import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { DatabaseState, Student, ActivityLog, SchoolProfile } from './types.js';
import { createClient } from '@supabase/supabase-js';

const DB_FILE_PATH = path.join(process.cwd(), 'database.json');

// Supabase Configuration
let SUPABASE_URL = process.env.SUPABASE_URL || 'https://rcpdjaazjfjdqyttuaqn.supabase.co';
if (SUPABASE_URL.endsWith('/rest/v1/')) {
  SUPABASE_URL = SUPABASE_URL.slice(0, -9);
} else if (SUPABASE_URL.endsWith('/rest/v1')) {
  SUPABASE_URL = SUPABASE_URL.slice(0, -8);
}
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjcGRqYWF6amZqZHF5dHR1YXFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4NDE2ODIsImV4cCI6MjA5NzQxNzY4Mn0.8yxob1PzeemWQooATudF4PLpIfM7yahNkrEq9LHGq5M';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

// Prefer service_role key server-side to completely bypass SQL row level security (RLS) restrictions
export const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY);


// Helper to generate salt and hash
export function generateSalt(): string {
  return crypto.randomBytes(16).toString('hex');
}

export function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
}

// Default SVG Logo for SMAN 2 CIAMIS as a Base64 string
const DEFAULT_LOGO_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="100%" height="100%"><path d="M 250,10 L 490,175 L 400,475 Q 250,495 100,475 L 10,175 Z" fill="%230c75e6" stroke="%23001d54" stroke-width="12" stroke-linejoin="round"/><path d="M 70,170 Q 250,65 430,170 C 445,150 455,130 432,118 Q 250,15 68,118 C 45,130 55,150 70,170 Z" fill="%23ffffff" stroke="%23bbbbbb" stroke-width="2"/><path d="M 50,140 L 90,135 L 70,170 Z" fill="%23dddddd"/><path d="M 450,140 L 410,135 L 430,170 Z" fill="%23dddddd"/><path id="text-path" d="M 90,145 Q 250,53 410,145" fill="none"/><text font-family="&apos;Inter&apos;, &apos;Arial&apos;, sans-serif" font-weight="900" font-size="28" fill="%23000000" letter-spacing="4"><textPath href="%23text-path" startOffset="50%" text-anchor="middle">SMA NEGERI 2</textPath></text><path d="M 230,345 C 200,345 130,360 100,330 C 72,300 70,245 80,215 Q 92,260 142,305 C 130,250 115,165 135,160 C 142,192 142,250 190,312 Z" fill="%23ffea00" stroke="%23b2a300" stroke-width="1.5"/><path d="M 270,345 C 300,345 370,360 400,330 C 428,300 430,245 420,215 Q 408,260 358,305 C 370,250 385,165 365,160 C 358,192 358,250 310,312 Z" fill="%23ffea00" stroke="%23b2a300" stroke-width="1.5"/><circle cx="82" cy="245" r="8" fill="%23000000"/><circle cx="80" cy="285" r="8" fill="%23000000"/><circle cx="85" cy="325" r="8" fill="%23000000"/><circle cx="98" cy="360" r="8" fill="%23000000"/><circle cx="120" cy="385" r="8" fill="%23000000"/><circle cx="418" cy="245" r="8" fill="%23000000"/><circle cx="420" cy="285" r="8" fill="%23000000"/><circle cx="415" cy="325" r="8" fill="%23000000"/><circle cx="402" cy="360" r="8" fill="%23000000"/><circle cx="380" cy="385" r="8" fill="%23000000"/><path d="M 250,330 C 220,335 170,320 152,285 C 145,245 190,240 205,255 C 190,210 170,165 210,145 C 225,170 240,215 250,235 C 260,215 275,170 290,145 C 330,165 310,210 295,255 C 310,240 355,245 348,285 C 330,320 280,335 250,330 Z" fill="%23ffffff" stroke="%23999999" stroke-width="2"/><circle cx="215" cy="325" r="24" fill="none" stroke="%23ffffff" stroke-width="6"/><circle cx="250" cy="325" r="24" fill="none" stroke="%23ff1a1a" stroke-width="6"/><circle cx="285" cy="325" r="24" fill="none" stroke="%23ffea00" stroke-width="6"/><polygon points="244,230 256,230 253,330 247,330" fill="%23ffffff" stroke="%23999999" stroke-width="2"/><polygon points="225,220 275,220 268,235 232,235" fill="%23ffc107" stroke="%23b28600" stroke-width="2" stroke-linejoin="round"/><path d="M 250,220 C 230,215 224,190 238,170 C 244,160 246,145 250,150 C 254,145 256,160 262,170 C 276,190 270,215 250,220 Z" fill="%23ff1a1a" stroke="%23cc0000" stroke-width="2"/><path d="M 250,220 C 238,217 235,200 242,185 C 246,177 248,168 250,172 C 252,168 254,177 258,185 C 265,200 262,217 250,220 Z" fill="%23ffcc00"/><path d="M 250,382 Q 195,362 140,382 L 140,412 Q 195,392 250,412 Z" fill="%23ffffff" stroke="%23cccccc" stroke-width="2"/><path d="M 250,382 Q 305,362 360,382 L 360,412 Q 305,392 250,412 Z" fill="%23ffffff" stroke="%23cccccc" stroke-width="2"/><path d="M 140,412 Q 195,392 250,412 Q 305,392 360,412 L 360,422 Q 305,402 250,422 Q 195,402 140,422 Z" fill="%23bf9c1b" stroke="%237e660d" stroke-width="1.5"/><text x="250" y="465" font-family="&apos;Inter&apos;, &apos;Arial Black&apos;, sans-serif" font-weight="900" font-size="36" fill="%23ffffff" text-anchor="middle" letter-spacing="2">CIAMIS</text></svg>`;

// Deterministic static salts & hashes to prevent random resets across Vercel serverless cold starts
const INITIAL_ADMIN_SALT = 'e864ca2b15cb7a98b177a6b5b194f29a';
const INITIAL_ADMIN_HASH = '3a9007c9742db5e3b7d7fae706e7994bb7ed6cbb5095ddb21f8cee3bdaa08b3743b072719b8646b1f8f6a5dd133919eeda99fc05d0afe927a68b89ef232ea3c4';

const TIK_ADMIN_SALT = '21ae8272552029da238657c771b71f75';
const TIK_ADMIN_HASH = '3179348460a95b785e65a8853600c571bdef2dec76a5afefdd54b41f76d18fc22be6e207d6d305cf937d5aebc6adcf01b8246519371096b3b367d70b051092b5';

const DEFAULT_STATE: DatabaseState = {
  schoolProfile: {
    name: 'SMAN 2 CIAMIS',
    logo: DEFAULT_LOGO_SVG,
    announcementDate: '2026-06-25',
    announcementHeader: 'PENGUMUMAN HASIL PEMILIHAN REKOMENDASI PAKET MATA PELAJARAN KELOMPOK BELAJAR KELAS XI SEMESTER GANJIL',
  },
  students: [
    {
      id: '1234567891',
      nisn: '1234567891',
      name: 'Budi Santoso',
      kelas: 'XI MIPA A',
      packet: 'Paket 1',
      status: 'Diterima',
      notes: 'Selamat! Sesuai hasil evaluasi minat & psikotes, Anda disetujui untuk mengikuti Paket 1.',
      passwordHash: hashPassword('1234567891', '1234567891_salt'),
      salt: '1234567891_salt',
      isActive: true,
    },
    {
      id: '1234567892',
      nisn: '1234567892',
      name: 'Siti Rahmawati',
      kelas: 'XI MIPA B',
      packet: 'Paket 2',
      status: 'Belum Diproses',
      notes: 'Pilihan masih dalam tahap review oleh tim bimbingan konseling.',
      passwordHash: hashPassword('1234567892', '1234567892_salt'),
      salt: '1234567892_salt',
      isActive: true,
    },
    {
      id: '1234567893',
      nisn: '1234567893',
      name: 'Aditya Pratama',
      kelas: 'XI IPS 1',
      packet: 'Paket 3',
      status: 'Diterima',
      notes: 'Pilihan paket disetujui. Silakan persiapkan buku paket penunjang.',
      passwordHash: hashPassword('1234567893', '1234567893_salt'),
      salt: '1234567893_salt',
      isActive: false, // Non-aktifkan akun ini untuk pengujian
    },
    {
      id: '1234567894',
      nisn: '1234567894',
      name: 'Rian Hidayat',
      kelas: 'XI MIPA C',
      packet: 'Paket 4',
      status: 'Diterima',
      notes: 'Rekomendasi disetujui berdasarkan nilai akademik IPA.',
      passwordHash: hashPassword('1234567894', '1234567894_salt'),
      salt: '1234567894_salt',
      isActive: true,
    },
    {
      id: '1234567895',
      nisn: '1234567895',
      name: 'Dewi Lestari',
      kelas: 'XI IPS 2',
      packet: 'Paket 5',
      status: 'Diterima',
      notes: 'Silakan lakukan konsultasi luring ke guru wali kelas jika membutuhkan revisi Paket 5.',
      passwordHash: hashPassword('1234567895', '1234567895_salt'),
      salt: '1234567895_salt',
      isActive: true,
    }
  ],
  activityLogs: [
    {
      id: 'log_seed',
      timestamp: new Date().toISOString(),
      actor: 'System',
      action: 'INITIALIZE',
      details: 'Database didekorasi dengan paket data default SMAN 2 CIAMIS',
      ipAddress: '127.0.0.1'
    }
  ],
  adminPasswordHash: INITIAL_ADMIN_HASH,
  adminSalt: INITIAL_ADMIN_SALT,
  admins: [
    {
      username: 'tik',
      passwordHash: TIK_ADMIN_HASH,
      salt: TIK_ADMIN_SALT
    }
  ]
};

// In-memory cache for fast read operations
let cache: DatabaseState | null = null;

export function getDb(): DatabaseState {
  if (cache) return cache;

  try {
    if (fs.existsSync(DB_FILE_PATH)) {
      const content = fs.readFileSync(DB_FILE_PATH, 'utf-8');
      cache = JSON.parse(content);
      // Fallback fields for compatibility
      if (cache) {
        if (!cache.students) cache.students = [];
        if (!cache.activityLogs) cache.activityLogs = [];
        if (!cache.schoolProfile) cache.schoolProfile = DEFAULT_STATE.schoolProfile;
        if (!cache.schoolProfile.logo || cache.schoolProfile.logo.includes('viewBox="0 0 100 100"')) {
          cache.schoolProfile.logo = DEFAULT_LOGO_SVG;
        }
        if (!cache.adminPasswordHash) {
          cache.adminPasswordHash = INITIAL_ADMIN_HASH;
          cache.adminSalt = INITIAL_ADMIN_SALT;
        }
        if (!cache.admins) {
          cache.admins = [];
        }
        if (!cache.admins.some(a => a.username === 'tik')) {
          cache.admins.push({
            username: 'tik',
            passwordHash: TIK_ADMIN_HASH,
            salt: TIK_ADMIN_SALT
          });
          // Save and push to Supabase to make sure it syncs
          saveDb(cache);
        }
        return cache;
      }
    }
  } catch (error) {
    console.error('Error loading database, resetting to default', error);
  }

  // Write default state
  cache = JSON.parse(JSON.stringify(DEFAULT_STATE));
  saveDb(cache!);
  return cache!;
}

export async function pushAllToSupabase(state: DatabaseState): Promise<void> {
  try {
    console.log('[Supabase] Syncing current state to remote Supabase tables...');

    // 1. Upsert School Profile
    const { error: profileErr } = await supabase.from('school_profile').upsert({
      id: 'current',
      name: state.schoolProfile.name,
      logo: state.schoolProfile.logo,
      announcement_date: state.schoolProfile.announcementDate,
      announcement_header: state.schoolProfile.announcementHeader
    });
    if (profileErr) console.warn('[Supabase] Profile sync warning:', profileErr.message);

    // 2. Upsert Admin Configs
    const { error: adminErr } = await supabase.from('admin_config').upsert({
      id: 'settings',
      password_hash: state.adminPasswordHash,
      salt: state.adminSalt
    });
    if (adminErr) console.warn('[Supabase] Admin config sync warning:', adminErr.message);

    if (state.admins) {
      for (const admin of state.admins) {
        const { error: otherAdminErr } = await supabase.from('admin_config').upsert({
          id: admin.username,
          password_hash: admin.passwordHash,
          salt: admin.salt
        });
        if (otherAdminErr) console.warn(`[Supabase] Other Admin config sync warning for ${admin.username}:`, otherAdminErr.message);
      }
    }

    // 3. Upsert Students in chunked/batch array
    if (state.students && state.students.length > 0) {
      const studentRows = state.students.map(s => ({
        id: s.id,
        nisn: s.nisn,
        name: s.name,
        kelas: s.kelas,
        packet: s.packet,
        status: s.status,
        notes: s.notes || '',
        password_hash: s.passwordHash,
        salt: s.salt,
        is_active: s.isActive !== undefined ? s.isActive : true
      }));

      const { error: studErr } = await supabase.from('students').upsert(studentRows);
      if (studErr) console.warn('[Supabase] Students sync warning:', studErr.message);
    }

    // 4. Upsert Activity Logs
    if (state.activityLogs && state.activityLogs.length > 0) {
      const logRows = state.activityLogs.map(l => ({
        id: l.id,
        timestamp: l.timestamp,
        actor: l.actor,
        action: l.action,
        details: l.details,
        ip_address: l.ipAddress
      }));

      const { error: logErr } = await supabase.from('activity_logs').upsert(logRows);
      if (logErr) console.warn('[Supabase] Activity logs sync warning:', logErr.message);
    }

    console.log('[Supabase] Background sync completed successfully!');
  } catch (err: any) {
    console.warn('[Supabase] Could not perform fully-secured push state to remote DB:', err.message || err);
  }
}

export async function syncFromSupabase(): Promise<void> {
  try {
    console.log('[Supabase] Pre-hydrating local memory from Supabase cloud...');

    // Fetch school_profile using select() to gracefully check if remote table exists but has no records yet
    const { data: profileList, error: pErr } = await supabase.from('school_profile').select('*');
    if (pErr) {
      console.warn('[Supabase] Unable to select profile (the tables may not exist yet or are empty):', pErr.message);
      return;
    }

    // Auto-seed: If profileList is empty, the remote database has just been created but not hydrated yet
    if (!profileList || profileList.length === 0) {
      console.log('[Supabase] Remote school_profile table is empty. Seeding entire current local state to Supabase...');
      const localState = getDb();
      await pushAllToSupabase(localState);
      return;
    }

    const profileRes = profileList[0];

    // Fetch admin_config using select()
    const { data: adminList, error: aErr } = await supabase.from('admin_config').select('*');
    if (aErr) {
      console.warn('[Supabase] Unable to select admin config:', aErr.message);
      return;
    }

    let adminPasswordHash = INITIAL_ADMIN_HASH;
    let adminSalt = INITIAL_ADMIN_SALT;
    const admins: { username: string; passwordHash: string; salt: string }[] = [];

    if (adminList && adminList.length > 0) {
      for (const row of adminList) {
        if (row.id === 'settings') {
          adminPasswordHash = row.password_hash;
          adminSalt = row.salt;
        } else {
          admins.push({
            username: row.id,
            passwordHash: row.password_hash,
            salt: row.salt
          });
        }
      }
    }

    // Ensure 'tik' is always defined and saved
    const hasTik = admins.some(a => a.username === 'tik');
    let neededPush = false;
    if (!hasTik) {
      admins.push({
        username: 'tik',
        passwordHash: TIK_ADMIN_HASH,
        salt: TIK_ADMIN_SALT
      });
      neededPush = true;
    }

    // Fetch students
    const { data: studentsRes, error: sErr } = await supabase.from('students').select('*');
    if (sErr) {
      console.warn('[Supabase] Unable to fetch students:', sErr.message);
      return;
    }

    // Fetch logs (limit 200)
    const { data: logsRes, error: lErr } = await supabase.from('activity_logs').select('*').order('timestamp', { ascending: false }).limit(200);

    const finalLogo = (!profileRes.logo || profileRes.logo.includes('viewBox="0 0 100 100"'))
      ? DEFAULT_LOGO_SVG
      : profileRes.logo;

    // Reconstruct cache
    cache = {
      schoolProfile: {
        name: profileRes.name,
        logo: finalLogo,
        announcementDate: profileRes.announcement_date,
        announcementHeader: profileRes.announcement_header
      },
      students: (studentsRes || []).map(s => ({
        id: s.id,
        nisn: s.nisn,
        name: s.name,
        kelas: s.kelas,
        packet: s.packet,
        status: s.status,
        notes: s.notes || '',
        passwordHash: s.password_hash,
        salt: s.salt,
        isActive: s.is_active !== undefined ? s.is_active : true
      })),
      activityLogs: (logsRes || []).map(l => ({
        id: l.id,
        timestamp: l.timestamp,
        actor: l.actor,
        action: l.action,
        details: l.details,
        ipAddress: l.ip_address
      })),
      adminPasswordHash,
      adminSalt,
      admins
    };

    // Keep backup copy in database.json
    try {
      fs.writeFileSync(DB_FILE_PATH, JSON.stringify(cache, null, 2), 'utf-8');
    } catch (fsErr) {
      console.warn('[Supabase] Warning: could not write local backup database.json in read-only environment:', fsErr);
    }
    console.log('[Supabase] Successfully warmth cached the entire state from Supabase!');

    if (neededPush) {
      console.log('[Supabase] Missing `tik` admin user detected. Force syncing to remote Supabase DB...');
      await pushAllToSupabase(cache);
    }
  } catch (err: any) {
    console.error('[Supabase] Error pre-hydrating state:', err.message || err);
  }
}

export function saveDb(state: DatabaseState): void {
  cache = state;
  try {
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(state, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error saving database to file system', error);
  }

  // Sync to Supabase in background
  pushAllToSupabase(state).catch(err => {
    console.warn('[Supabase] Background save failed:', err);
  });
}

// Log admin action directly
export function writeAuditLog(actor: string, action: string, details: string, ipAddress: string): void {
  const db = getDb();
  const log: ActivityLog = {
    id: 'log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
    timestamp: new Date().toISOString(),
    actor,
    action,
    details,
    ipAddress: ipAddress || '127.0.0.1'
  };
  db.activityLogs.unshift(log);
  // Cap logs to 200 items to avoid infinite size
  if (db.activityLogs.length > 200) {
    db.activityLogs = db.activityLogs.slice(0, 200);
  }
  saveDb(db);
}

