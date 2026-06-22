import express from 'express';
import path from 'path';
import crypto from 'crypto';

import { getDb, saveDb, writeAuditLog, hashPassword, generateSalt, syncFromSupabase } from './src/db.js';
import { Student, SchoolProfile, ActivityLog } from './src/types.js';

const app = express();
const PORT = 3000;

// Middlewares
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Auto-Hydration Middleware for serverless / Vercel container instances
let isSupabaseLoaded = false;
let supabaseLoadPromise: Promise<void> | null = null;

app.use(async (req, res, next) => {
  if (!isSupabaseLoaded) {
    if (!supabaseLoadPromise) {
      console.log('[Supabase Serverless Setup] Pre-hydrating local memory from Supabase cloud...');
      supabaseLoadPromise = syncFromSupabase()
        .then(() => {
          isSupabaseLoaded = true;
          console.log('[Supabase Serverless Setup] Pre-hydration completed successfully.');
        })
        .catch((err) => {
          console.error('[Supabase Serverless Setup] Warning: pre-hydration failed:', err);
          supabaseLoadPromise = null; // Let it retry on the next request if it fails
        });
    }
    await supabaseLoadPromise;
  }
  next();
});

// -------------------------------------------------------------
// SECURE STATELESS SESSION ENGINE
// -------------------------------------------------------------
interface Session {
  token: string;
  role: 'admin' | 'student';
  userId: string;
  expiresAt: number;
}
const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const SESSION_SECRET = process.env.SESSION_SECRET || 'sman_2_ciamis_super_secret_key_2026';

function getSigningSecret(role: 'admin' | 'student'): string {
  if (role === 'admin') {
    const db = getDb();
    return SESSION_SECRET + '_' + db.adminPasswordHash;
  }
  return SESSION_SECRET;
}

// Helper to generate a random cryptographically safe token with stateless session signature
function generateSecureToken(role: 'admin' | 'student', userId: string): string {
  const expiresAt = Date.now() + SESSION_TIMEOUT_MS;
  const payload = JSON.stringify({
    r: role === 'admin' ? 'a' : 's',
    u: userId,
    e: expiresAt,
    n: crypto.randomBytes ? crypto.randomBytes(8).toString('hex') : Math.random().toString(36).substring(2)
  });
  const base64Payload = Buffer.from(payload).toString('base64url');
  const secret = getSigningSecret(role);
  const signature = crypto.createHmac('sha256', secret).update(base64Payload).digest('base64url');
  return `${base64Payload}.${signature}`;
}

const activeSessions = {
  get(token: string): Session | undefined {
    if (!token || typeof token !== 'string') return undefined;
    try {
      const parts = token.split('.');
      if (parts.length !== 2) return undefined;

      const [base64Payload, signature] = parts;
      const payloadStr = Buffer.from(base64Payload, 'base64url').toString('utf-8');
      const payload = JSON.parse(payloadStr);

      if (Date.now() > payload.e) {
        return undefined; // Expired
      }

      const role = payload.r === 'a' ? 'admin' : 'student';
      const secret = getSigningSecret(role);

      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(base64Payload)
        .digest('base64url');

      if (signature !== expectedSignature) {
        return undefined;
      }

      return {
        token,
        role,
        userId: payload.u,
        expiresAt: payload.e
      };
    } catch (e) {
      return undefined;
    }
  },

  set(token: string, session: Session): void {
    // Stateless signed token - no storage required
  },

  delete(token: string): void {
    // Stateless signed token - client discards it
  },

  keys(): string[] {
    return [];
  },

  clear(): void {
    // No-op
  }
};

// Session Validation Middleware (Auto Logout & RBAC)
function authenticate(req: any, res: any, next: any) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(419).json({ message: 'Sesi tidak ditemukan. Silakan login kembali.' });
  }

  const token = authHeader.replace('Bearer ', '').trim();
  const session = activeSessions.get(token);

  if (!session) {
    return res.status(419).json({ message: 'Sesi Anda telah kedaluwarsa atau tidak valid.' });
  }

  if (Date.now() > session.expiresAt) {
    return res.status(419).json({ message: 'Sesi Anda telah berakhir karena tidak ada aktivitas selama 30 menit.' });
  }

  // We bind session metadata to request
  req.session = session;
  next();
}

function requireRole(role: 'admin' | 'student') {
  return (req: any, res: any, next: any) => {
    if (!req.session || req.session.role !== role) {
      return res.status(403).json({ message: 'Akses ditolak. Anda tidak memiliki izin untuk tindakan ini.' });
    }
    next();
  };
}

// Protection middleware to prevent malicious inputs
function sanitizeInput(req: any, res: any, next: any) {
  const sanitize = (val: any): any => {
    if (typeof val === 'string') {
      // Basic strip down of suspicious HTML tags (XSS protection)
      return val.replace(/<script[^>]*>([\S\s]*?)<\/script>/gi, '')
                .replace(/on\w+="[^"]*"/gi, '')
                .trim();
    } else if (typeof val === 'object' && val !== null) {
      for (const k in val) {
        val[k] = sanitize(val[k]);
      }
    }
    return val;
  };
  req.body = sanitize(req.body || {});
  next();
}

// -------------------------------------------------------------
// AUTHENTICATION ENDPOINTS
// -------------------------------------------------------------
app.post('/api/auth/login', sanitizeInput, (req, res) => {
  const { username, password } = req.body;
  const ipAddress = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1') as string;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username dan Password wajib diisi!' });
  }

  const db = getDb();

  // 1. Admin Auth
  const isAdmin = username === 'admin' || (db.admins && db.admins.some((a: any) => a.username === username));
  if (isAdmin) {
    let matched = false;
    let targetSalt = db.adminSalt;
    let targetHash = db.adminPasswordHash;
    let displayName = 'Administrator';

    if (username === 'admin') {
      matched = hashPassword(password, db.adminSalt) === db.adminPasswordHash;
    } else if (db.admins) {
      const foundAdmin = db.admins.find((a: any) => a.username === username);
      if (foundAdmin) {
        targetSalt = foundAdmin.salt;
        targetHash = foundAdmin.passwordHash;
        matched = hashPassword(password, targetSalt) === targetHash;
        displayName = `Admin ${username}`;
      }
    }

    if (matched) {
      const token = generateSecureToken('admin', username);
      activeSessions.set(token, {
        token,
        role: 'admin',
        userId: username,
        expiresAt: Date.now() + SESSION_TIMEOUT_MS
      });

      writeAuditLog(username, 'LOGIN', `Admin ${username} berhasil login ke sistem`, ipAddress);
      
      return res.json({
        token,
        role: 'admin',
        user: { name: displayName, username: username },
        schoolProfile: db.schoolProfile
      });
    }

    writeAuditLog('System', 'LOGIN_FAILED', `Gagal login sebagai admin (${username}) dari IP: ${ipAddress}`, ipAddress);
    return res.status(401).json({ message: 'Password Administrator salah!' });
  }

  // 2. Student Auth (Username = NISN)
  const student = db.students.find(s => s.nisn === username);
  if (!student) {
    return res.status(401).json({ message: 'Siswa dengan NISN tersebut tidak terdaftar!' });
  }

  if (!student.isActive) {
    return res.status(403).json({ message: 'Akun Anda dinonaktifkan oleh Administrator. Silakan hubungi operator sekolah.' });
  }

  const computedHash = hashPassword(password, student.salt);
  if (computedHash === student.passwordHash) {
    const token = generateSecureToken('student', student.id);
    activeSessions.set(token, {
      token,
      role: 'student',
      userId: student.id,
      expiresAt: Date.now() + SESSION_TIMEOUT_MS
    });

    writeAuditLog(`siswa_${student.nisn}`, 'LOGIN', `Siswa ${student.name} (${student.nisn}) berhasil login`, ipAddress);

    return res.json({
      token,
      role: 'student',
      user: {
        id: student.id,
        nisn: student.nisn,
        name: student.name,
        kelas: student.kelas,
        packet: student.packet,
        status: student.status,
        notes: student.notes
      },
      schoolProfile: db.schoolProfile
    });
  }

  writeAuditLog('System', 'LOGIN_FAILED', `Gagal login NISN ${username} dari IP: ${ipAddress}`, ipAddress);
  return res.status(401).json({ message: 'Username atau Password salah! Default: NISN' });
});

app.post('/api/auth/logout', authenticate, (req: any, res) => {
  const token = req.headers['authorization']?.replace('Bearer ', '') || '';
  if (token) {
    const session = activeSessions.get(token);
    if (session) {
      const actor = session.role === 'admin' ? 'admin' : `siswa_${session.userId}`;
      const ipAddress = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1') as string;
      writeAuditLog(actor, 'LOGOUT', 'User logout dari aplikasi', ipAddress);
      activeSessions.delete(token);
    }
  }
  res.json({ success: true, message: 'Berhasil logout' });
});

app.get('/api/auth/session', authenticate, (req: any, res) => {
  const db = getDb();
  if (req.session.role === 'admin') {
    return res.json({
      role: 'admin',
      user: { name: 'Administrator', username: 'admin' },
      schoolProfile: db.schoolProfile
    });
  } else {
    const student = db.students.find(s => s.id === req.session.userId);
    if (!student || !student.isActive) {
      activeSessions.delete(req.session.token);
      return res.status(401).json({ message: 'Informasi siswa tidak valid atau dinonaktifkan' });
    }
    return res.json({
      role: 'student',
      user: {
        id: student.id,
        nisn: student.nisn,
        name: student.name,
        kelas: student.kelas,
        packet: student.packet,
        status: student.status,
        notes: student.notes
      },
      schoolProfile: db.schoolProfile
    });
  }
});

// -------------------------------------------------------------
// ADMIN - DASHBOARD STATISTICS & ACTIVITY LOGS
// -------------------------------------------------------------
app.get('/api/stats', authenticate, requireRole('admin'), (req, res) => {
  const db = getDb();
  const totalStudents = db.students.length;
  const activeStudents = db.students.filter(s => s.isActive).length;
  const announcedStudents = db.students.filter(s => s.status === 'Diterima').length;
  const pendingStudents = db.students.filter(s => s.status === 'Belum Diproses').length;

  const packetDistribution: Record<string, number> = {
    'Paket 1': 0,
    'Paket 2': 0,
    'Paket 3': 0,
    'Paket 4': 0,
    'Paket 5': 0,
  };

  db.students.forEach(s => {
    if (packetDistribution[s.packet] !== undefined) {
      packetDistribution[s.packet]++;
    }
  });

  res.json({
    totalStudents,
    activeStudents,
    announcedStudents,
    pendingStudents,
    packetDistribution,
    recentActivities: db.activityLogs.slice(0, 15) // Recent 15 logs
  });
});

// -------------------------------------------------------------
// ADMIN - STUDENT ACCOUNTS MANAGEMENT (CRUD)
// -------------------------------------------------------------
app.get('/api/students', authenticate, requireRole('admin'), (req, res) => {
  const db = getDb();
  const search = ((req.query.search as string) || '').toLowerCase().trim();
  const kelas = (req.query.kelas as string) || '';
  const packet = (req.query.packet as string) || '';
  const status = (req.query.status as string) || '';
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;

  // Filter students
  let filtered = db.students;

  if (search) {
    filtered = filtered.filter(s => 
      s.name.toLowerCase().includes(search) || 
      s.nisn.includes(search) ||
      s.kelas.toLowerCase().includes(search)
    );
  }

  if (kelas) {
    filtered = filtered.filter(s => s.kelas === kelas);
  }

  if (packet) {
    filtered = filtered.filter(s => s.packet === packet);
  }

  if (status) {
    filtered = filtered.filter(s => s.status === status);
  }

  // Get distinct classes for search filters
  const classes = Array.from(new Set(db.students.map(s => s.kelas))).filter(Boolean).sort();

  // Pagination
  const total = filtered.length;
  const totalPages = Math.ceil(total / limit);
  const offset = (page - 1) * limit;
  const paginated = filtered.slice(offset, offset + limit);

  // Map to exclude hash codes in listing
  const mapped = paginated.map(({ passwordHash, salt, ...rest }) => rest);

  res.json({
    students: mapped,
    pagination: {
      total,
      page,
      limit,
      totalPages
    },
    classes
  });
});

// Add single student
app.post('/api/students', sanitizeInput, authenticate, requireRole('admin'), (req, res) => {
  const { nisn, name, kelas, packet, status, notes, isActive, password } = req.body;
  const ipAddress = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1') as string;

  if (!nisn || !name || !kelas || !packet) {
    return res.status(400).json({ message: 'NISN, Nama, Kelas, dan Pilihan Paket harus diisi!' });
  }

  const db = getDb();
  const existing = db.students.find(s => s.nisn === nisn);
  if (existing) {
    return res.status(409).json({ message: `Siswa dengan NISN ${nisn} sudah terdaftar di sistem!` });
  }

  const studentSalt = generateSalt();
  // Default password is NISN if not provided
  const pwd = password || nisn;
  const newStudent: Student = {
    id: nisn,
    nisn,
    name,
    kelas,
    packet,
    status: status || 'Belum Diproses',
    notes: notes || '',
    isActive: isActive !== undefined ? isActive : true,
    salt: studentSalt,
    passwordHash: hashPassword(pwd, studentSalt)
  };

  db.students.unshift(newStudent);
  saveDb(db);

  writeAuditLog('admin', 'ADD_STUDENT', `Siswa Baru ditambahkan: ${name} (${nisn})`, ipAddress);
  res.status(201).json({ message: 'Siswa berhasil ditambahkan.', student: { id: nisn, name, nisn, kelas, packet } });
});

// Update student details
app.put('/api/students/:id', sanitizeInput, authenticate, requireRole('admin'), (req, res) => {
  const studentId = req.params.id;
  const { name, kelas, packet, status, notes, isActive, password } = req.body;
  const ipAddress = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1') as string;

  const db = getDb();
  const studentIndex = db.students.findIndex(s => s.id === studentId);

  if (studentIndex === -1) {
    return res.status(404).json({ message: 'Siswa tidak ditemukan!' });
  }

  const student = db.students[studentIndex];
  
  student.name = name || student.name;
  student.kelas = kelas || student.kelas;
  student.packet = packet || student.packet;
  student.status = status !== undefined ? status : student.status;
  student.notes = notes !== undefined ? notes : student.notes;
  student.isActive = isActive !== undefined ? isActive : student.isActive;

  if (password) {
    student.salt = generateSalt();
    student.passwordHash = hashPassword(password, student.salt);
  }

  db.students[studentIndex] = student;
  saveDb(db);

  writeAuditLog('admin', 'UPDATE_STUDENT', `Siswa Diperbarui: ${student.name} (${student.nisn})`, ipAddress);
  res.json({ message: 'Data siswa berhasil diperbarui.' });
});

// Delete student
app.delete('/api/students/:id', authenticate, requireRole('admin'), (req, res) => {
  const studentId = req.params.id;
  const ipAddress = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1') as string;

  const db = getDb();
  const student = db.students.find(s => s.id === studentId);

  if (!student) {
    return res.status(404).json({ message: 'Siswa tidak ditemukan!' });
  }

  db.students = db.students.filter(s => s.id !== studentId);
  saveDb(db);

  writeAuditLog('admin', 'DELETE_STUDENT', `Siswa Dihapus: ${student.name} (${student.nisn})`, ipAddress);
  res.json({ message: 'Data siswa berhasil dihapus dari sistem.' });
});

// Delete all students
app.post('/api/students/clear-all', authenticate, requireRole('admin'), (req, res) => {
  const ipAddress = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1') as string;
  const db = getDb();
  const totalCleared = db.students.length;

  db.students = [];
  saveDb(db);

  writeAuditLog('admin', 'CLEAR_STUDENTS', `Semua data siswa dikosongkan. Total data dihapus: ${totalCleared}`, ipAddress);
  res.json({ message: 'Semua data siswa berhasil dibersihkan dari database.' });
});

// -------------------------------------------------------------
// BATCH EXCEL IMPORT
// -------------------------------------------------------------
app.post('/api/students/import', sanitizeInput, authenticate, requireRole('admin'), (req, res) => {
  const { studentsList } = req.body;
  const ipAddress = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1') as string;

  if (!studentsList || !Array.isArray(studentsList)) {
    return res.status(400).json({ message: 'Format batch import tidak valid!' });
  }

  const db = getDb();
  let successCount = 0;
  let failureCount = 0;
  const errors: string[] = [];

  const existingNisns = new Set(db.students.map(s => s.nisn));

  studentsList.forEach((row: any, idx: number) => {
    const rowNum = idx + 2; // offset header
    const { nisn, name, kelas, packet, status, notes } = row;

    if (!nisn) {
      failureCount++;
      errors.push(`Baris ${rowNum}: NISN kosong`);
      return;
    }

    const nisnStr = String(nisn).trim();

    if (!name || !kelas || !packet) {
      failureCount++;
      errors.push(`Baris ${rowNum} (${nisnStr}): Nama, Kelas, dan Paket wajib diisi`);
      return;
    }

    if (existingNisns.has(nisnStr)) {
      failureCount++;
      errors.push(`Baris ${rowNum} (${nisnStr}): NISN ganda (sudah ada dalam database)`);
      return;
    }

    // Validate packets
    const validPackets = ['Paket 1', 'Paket 2', 'Paket 3', 'Paket 4', 'Paket 5'];
    if (!validPackets.includes(packet)) {
      failureCount++;
      errors.push(`Baris ${rowNum} (${nisnStr}): Nama Paket tidak valid '${packet}' (Gunakan: Paket 1 - Paket 5)`);
      return;
    }

    // Validate status
    const statVal = (status === 'Diterima' || status === 'Belum Diproses') ? status : 'Belum Diproses';

    const pSalt = generateSalt();
    const newStudent: Student = {
      id: nisnStr,
      nisn: nisnStr,
      name: String(name).trim(),
      kelas: String(kelas).trim(),
      packet: packet,
      status: statVal,
      notes: notes ? String(notes).trim() : '',
      isActive: true,
      salt: pSalt,
      passwordHash: hashPassword(nisnStr, pSalt) // default password is NISN
    };

    db.students.unshift(newStudent);
    existingNisns.add(nisnStr);
    successCount++;
  });

  saveDb(db);

  writeAuditLog('admin', 'IMPORT_EXCEL', `Import Batch Excel: ${successCount} berhasil, ${failureCount} gagal`, ipAddress);

  res.json({
    successCount,
    failureCount,
    errors
  });
});

// -------------------------------------------------------------
// ADMIN - SCHOOL PROFILE & SETTINGS
// -------------------------------------------------------------
app.get('/api/school/profile', (req, res) => {
  const db = getDb();
  res.json(db.schoolProfile);
});

app.put('/api/school/profile', sanitizeInput, authenticate, requireRole('admin'), (req, res) => {
  const { name, announcementDate, announcementHeader, logo, showPrintPdf, showParentNotification } = req.body;
  const ipAddress = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1') as string;

  if (!name || !announcementDate || !announcementHeader) {
    return res.status(400).json({ message: 'Seluruh kolom profil wajib diisi!' });
  }

  const db = getDb();
  db.schoolProfile = {
    name,
    announcementDate,
    announcementHeader,
    logo: logo !== undefined ? logo : db.schoolProfile.logo,
    showPrintPdf: showPrintPdf !== undefined ? !!showPrintPdf : db.schoolProfile.showPrintPdf,
    showParentNotification: showParentNotification !== undefined ? !!showParentNotification : db.schoolProfile.showParentNotification
  };

  saveDb(db);

  writeAuditLog('admin', 'UPDATE_PROFILE', `Profil sekolah diperbarui: Nama Sekolah -> ${name}`, ipAddress);
  res.json({ message: 'Profil sekolah berhasil diperbarui.', schoolProfile: db.schoolProfile });
});

// -------------------------------------------------------------
// ADMIN - SECURITY & SETTINGS
// -------------------------------------------------------------
app.put('/api/admin/change-password', sanitizeInput, authenticate, requireRole('admin'), (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const ipAddress = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1') as string;

  if (!oldPassword || !newPassword) {
    return res.status(400).json({ message: 'Password lama dan password baru wajib diisi!' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ message: 'Password baru minimal harus terdiri dari 6 karakter!' });
  }

  const db = getDb();
  const currentHash = hashPassword(oldPassword, db.adminSalt);

  if (currentHash !== db.adminPasswordHash) {
    return res.status(400).json({ message: 'Password lama yang Anda masukkan salah!' });
  }

  db.adminSalt = generateSalt();
  db.adminPasswordHash = hashPassword(newPassword, db.adminSalt);

  // Invalidate all current admin sessions to force re-login on lock configuration changes
  const activeTokens = Array.from(activeSessions.keys());
  activeTokens.forEach(token => {
    const sess = activeSessions.get(token);
    if (sess && sess.role === 'admin') {
      activeSessions.delete(token);
    }
  });

  saveDb(db);

  writeAuditLog('admin', 'CHANGE_PASSWORD', 'Password administrator berhasil diperbarui', ipAddress);
  res.json({ message: 'Password admin berhasil diubah. Silakan login kembali dengan password baru.' });
});

// -------------------------------------------------------------
// ADMIN - BACKUP / RESTORE DATABASE
// -------------------------------------------------------------
app.get('/api/database/backup', authenticate, requireRole('admin'), (req, res) => {
  const db = getDb();
  const ipAddress = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1') as string;

  writeAuditLog('admin', 'BACKUP_DATABASE', 'Admin mengunduh file cadangan database (Backup)', ipAddress);

  // set header for file download
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename=SMAN2_CIAMIS_Backup_${new Date().toISOString().split('T')[0]}.json`);
  res.send(JSON.stringify(db, null, 2));
});

app.post('/api/database/restore', sanitizeInput, authenticate, requireRole('admin'), (req, res) => {
  const { databaseJson } = req.body;
  const ipAddress = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1') as string;

  if (!databaseJson) {
    return res.status(400).json({ message: 'Data backup tidak ditemukan!' });
  }

  let parsed: any;
  try {
    parsed = typeof databaseJson === 'string' ? JSON.parse(databaseJson) : databaseJson;
  } catch (error) {
    return res.status(400).json({ message: 'Format JSON database tidak valid!' });
  }

  // Validate properties
  if (!parsed.schoolProfile || !Array.isArray(parsed.students) || !parsed.adminPasswordHash) {
    return res.status(400).json({ message: 'Data backup tidak memiliki struktur database SMAN 2 CIAMIS yang valid!' });
  }

  const db = getDb();
  db.schoolProfile = parsed.schoolProfile;
  db.students = parsed.students;
  db.adminPasswordHash = parsed.adminPasswordHash;
  db.adminSalt = parsed.adminSalt || db.adminSalt;
  db.activityLogs = parsed.activityLogs || [];

  writeAuditLog('admin', 'RESTORE_DATABASE', 'Admin berhasil memulihkan database dari file cadangan', ipAddress);
  saveDb(db);

  // Invalidate any current active sessions to prevent state collision
  activeSessions.clear();

  res.json({ message: 'Database berhasil dipulihkan sepenuhnya. Silakan segarkan halaman.' });
});

// -------------------------------------------------------------
// GLOBAL ERROR HANDLER
// -------------------------------------------------------------
app.use((err: any, req: any, res: any, next: any) => {
  console.error('[Unhandled Error]', err);
  res.status(500).json({
    message: `Kesalahan Internal Server (500): ${err.message || err}`,
    error: err.message || err,
    stack: err.stack
  });
});

// -------------------------------------------------------------
// INITIALIZE EXPRESS SERVER & VITE
// -------------------------------------------------------------
async function startServer() {
  // Integrate Vite for development, serve static in production
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[OK] SMAN 2 CIAMIS App running on port http://localhost:${PORT}`);
    
    // Sync state with cloud Supabase asynchronously on background without blocking port bind
    console.log('[Supabase] Initializing background sync...');
    syncFromSupabase()
      .then(() => {
        console.log('[Supabase] Pre-hydration and cloud synchronization completed.');
      })
      .catch((err) => {
        console.error('[Supabase] Non-blocking initial sync failed:', err);
      });
  });
}

if (!process.env.VERCEL) {
  startServer();
}

export default app;
