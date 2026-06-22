import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Users,
  FilePlus2,
  BellRing,
  BarChart3,
  Settings,
  Database,
  KeyRound,
  LogOut,
  Search,
  Filter,
  Plus,
  Edit2,
  Trash2,
  FileText,
  UserCheck,
  UserX,
  Sparkles,
  ArrowRight,
  Download,
  Upload,
  UserMinus,
  Check,
  AlertCircle,
  Menu,
  X,
  Moon,
  Sun,
  ShieldCheck,
  RotateCcw
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { SchoolProfile, ActivityLog, DashboardStats, Student } from '../types.js';

interface AdminDashboardProps {
  schoolProfile: SchoolProfile;
  darkMode: boolean;
  toggleDarkMode: () => void;
  onLogout: () => void;
  showToast: (text: string, type: 'success' | 'error' | 'warning' | 'info') => void;
  showConfirm: (
    title: string,
    message: string,
    type: 'danger' | 'warning' | 'info' | 'success',
    onConfirm: () => void
  ) => void;
  token: string;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  schoolProfile,
  darkMode,
  toggleDarkMode,
  onLogout,
  showToast,
  showConfirm,
  token,
}) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'siswa' | 'import' | 'pengumuman' | 'statistik' | 'profile' | 'backup' | 'password'>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // 1. Dashboard State
  const [stats, setStats] = useState<DashboardStats | null>(null);

  // 2. Students List State (Pagination, Search, Filters)
  const [students, setStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedPacket, setSelectedPacket] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [distinctClasses, setDistinctClasses] = useState<string[]>([]);
  const [totalStudentsCount, setTotalStudentsCount] = useState(0);

  // 3. Edit / Add Student Modal State
  const [studentModalOpen, setStudentModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [formData, setFormData] = useState({
    id: '',
    nisn: '',
    name: '',
    kelas: '',
    packet: 'Paket 1' as any,
    status: 'Diterima' as any,
    notes: '',
    password: '',
    isActive: true
  });

  // 4. School Profile Form State
  const [profileForm, setProfileForm] = useState({
    name: schoolProfile.name,
    announcementDate: schoolProfile.announcementDate,
    announcementHeader: schoolProfile.announcementHeader,
    logo: schoolProfile.logo
  });
  const [isDraggingLogo, setIsDraggingLogo] = useState(false);

  // 5. Excel Import State
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [importLogs, setImportLogs] = useState<{
    success: number;
    failed: number;
    errors: string[];
  } | null>(null);
  const [importedRowsLength, setImportedRowsLength] = useState(0);

  // 6. Backup / Restore File State
  const [restoreFileContent, setRestoreFileContent] = useState<string>('');

  // 7. Security Password State
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Fetch Dashboard Stats
  const fetchStats = async () => {
    try {
      const res = await fetch('/api/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      } else {
        const err = await res.json();
        showToast(err.message || 'Gagal memuat statistik', 'error');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch Students with current queries
  const fetchStudents = async () => {
    try {
      const query = new URLSearchParams({
        search: searchTerm,
        kelas: selectedClass,
        packet: selectedPacket,
        status: selectedStatus,
        page: currentPage.toString(),
        limit: '8'
      }).toString();

      const res = await fetch(`/api/students?${query}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        setStudents(data.students);
        setTotalPages(data.pagination.totalPages);
        setDistinctClasses(data.classes);
        setTotalStudentsCount(data.pagination.total);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (activeTab === 'dashboard') {
      fetchStats();
    } else if (activeTab === 'siswa') {
      fetchStudents();
    } else if (activeTab === 'statistik') {
      fetchStats();
    }
  }, [activeTab, searchTerm, selectedClass, selectedPacket, selectedStatus, currentPage]);

  // Handle student create/edit submission
  const handleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nisn || !formData.name || !formData.kelas || !formData.packet) {
      showToast('Harap isi semua kolom wajib!', 'warning');
      return;
    }

    try {
      if (modalMode === 'add') {
        const res = await fetch('/api/students', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(formData)
        });

        if (res.ok) {
          showToast('Data siswa baru berhasil ditambahkan.', 'success');
          setStudentModalOpen(false);
          fetchStudents();
          fetchStats();
        } else {
          const err = await res.json();
          showToast(err.message || 'Gagal menambahkan siswa', 'error');
        }
      } else {
        // Edit mode
        const res = await fetch(`/api/students/${formData.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(formData)
        });

        if (res.ok) {
          showToast('Data siswa berhasil dirubah.', 'success');
          setStudentModalOpen(false);
          fetchStudents();
        } else {
          const err = await res.json();
          showToast(err.message || 'Gagal mengubah siswa', 'error');
        }
      }
    } catch (err) {
      showToast('Koneksi internet bermasalah', 'error');
    }
  };

  // Delete single student
  const handleDeleteStudent = (id: string, name: string) => {
    showConfirm(
      'Hapus Data Siswa?',
      `Apakah Anda yakin ingin menghapus "${name}" secara permanen dari sistem?`,
      'danger',
      async () => {
        try {
          const res = await fetch(`/api/students/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            showToast('Siswa berhasil dihapus.', 'success');
            fetchStudents();
            fetchStats();
          } else {
            const err = await res.json();
            showToast(err.message || 'Gagal menghapus siswa', 'error');
          }
        } catch (err) {
          showToast('Tindakan tidak valid', 'error');
        }
      }
    );
  };

  // Empty student database
  const handleClearAllStudents = () => {
    showConfirm(
      'Kosongkan Seluruh Siswa?',
      'PERHATIAN! Semua data siswa akan terhapus permanen dari sistem. Tindakan ini tidak dapat dibatalkan.',
      'danger',
      async () => {
        try {
          const res = await fetch('/api/students/clear-all', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            showToast('Basis data siswa telah dikosongkan.', 'success');
            fetchStudents();
            fetchStats();
          }
        } catch (error) {
          showToast('Gagal memproses pengosongan database', 'error');
        }
      }
    );
  };

  // ----------------- EXCEL TEMPLATE DOWNLOAD -----------------
  const handleDownloadTemplate = () => {
    // Generate an illustrative clean template structured for Bk
    const sampleData = [
      {
        nisn: '1234567801',
        name: 'Mulyadi',
        kelas: 'XI MIPA A',
        packet: 'Paket 1',
        status: 'Diterima',
        notes: 'Direkomendasikan berdasarkan hasil evaluasi BK minat sains.'
      },
      {
        nisn: '1234567802',
        name: 'Sari Ayu',
        kelas: 'XI IPS 1',
        packet: 'Paket 3',
        status: 'Belum Diproses',
        notes: 'Pilihan IPS Paket 3 dalam penelaahan.'
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Database_Siswa');

    // Write worksheet headers metadata
    XLSX.writeFile(workbook, 'Template_Siswa_SMAN_2.xlsx');
    showToast('Template Excel berhasil diunduh.', 'success');
  };

  // ----------------- CLIENT-SIDE EXCEL FILE READER -----------------
  const handleExcelImportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setExcelFile(file);
      setImportLogs(null);
    }
  };

  const handleExcelSubmit = async () => {
    if (!excelFile) {
      showToast('Pilih berkas Excel (.xlsx / .xls) terlebih dahulu!', 'warning');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        
        // Convert schema to Array of objects
        const rawRows = XLSX.utils.sheet_to_json(sheet);
        if (rawRows.length === 0) {
          showToast('Spreedsheet kososng atau format kolom salah!', 'error');
          return;
        }

        // Validate basic columns
        const keys = Object.keys(rawRows[0] as object);
        const requiredHeaders = ['nisn', 'name', 'kelas', 'packet'];
        const missing = requiredHeaders.filter(h => !keys.includes(h));
        
        if (missing.length > 0) {
          showToast(`Header spreadsheet hilang/tidak cocok! Wajib ada: ${missing.join(', ')}`, 'error');
          return;
        }

        setImportedRowsLength(rawRows.length);

        // Upload validated parsed list to database microservice
        const response = await fetch('/api/students/import', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ studentsList: rawRows })
        });

        if (response.ok) {
          const resLogs = await response.json();
          setImportLogs(resLogs);
          setExcelFile(null);
          showToast(`Proses import selesai. Berhasil: ${resLogs.successCount}, Gagal: ${resLogs.failureCount}`, 'info');
        } else {
          showToast('Gagal memproses batch import backend', 'error');
        }

      } catch (err) {
        showToast('Kesalahan sewaktu menguraikan lembar Excel!', 'error');
      }
    };
    reader.readAsBinaryString(excelFile);
  };

  // ----------------- DOWNLOAD EXCEL DATA LISTING -----------------
  const handleExportToExcel = () => {
    showConfirm(
      'Export Data ke Excel?',
      'Ingin mengunduh seluruh database siswa SMAN 2 CIAMIS ke bentuk format Excel?',
      'info',
      async () => {
        try {
          const res = await fetch('/api/students?limit=5000', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            const exportRows = data.students.map((s: any, i: number) => ({
              No: i + 1,
              NISN: s.nisn,
              'Nama Siswa': s.name,
              'Kelas Rujukan': s.kelas,
              'Paket Terpilih': s.packet,
              Status: s.status,
              'Catatan Tambahan': s.notes,
              'Akun Aktif': s.isActive ? 'AKTIF' : 'NONAKTIF'
            }));

            const worksheet = XLSX.utils.json_to_sheet(exportRows);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Data_Pengumuman');
            XLSX.writeFile(workbook, `Database_SMAN2_${Date.now()}.xlsx`);
            showToast('Ekspor Excel berhasil.', 'success');
          }
        } catch (error) {
          showToast('Sistem gagal mengekspor data', 'error');
        }
      }
    );
  };

  // ----------------- PROFILE GRAPHICS & EDIT LOGO -----------------
  const handleLogoDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingLogo(true);
  };

  const handleLogoDragLeave = () => {
    setIsDraggingLogo(false);
  };

  const handleLogoDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingLogo(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        showToast('File harus berupa berkas gambar!', 'error');
        return;
      }
      processLogoFile(file);
    }
  };

  const processLogoFile = (file: File) => {
    if (file.size > 1500 * 1024) {
      showToast('Logo terlalu besar! Ukuran maksimal harus dibawah 1.5MB.', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const base64String = uploadEvent.target?.result as string;
      setProfileForm(prev => ({ ...prev, logo: base64String }));
      showToast('Logo berhasil diunggah!', 'success');
    };
    reader.readAsDataURL(file);
  };

  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processLogoFile(file);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/school/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(profileForm)
      });

      if (res.ok) {
        showToast('Profil sekolah dan identitas logo berhasil diperbarui.', 'success');
        // Refresh page or trigger callback
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        showToast('Gagal merubah data identitas', 'error');
      }
    } catch (error) {
      showToast('Koneksi server gagal', 'error');
    }
  };

  // ----------------- DATABASE RESTORE -----------------
  const handleBackupDownload = () => {
    // Direct AJAX implementation for authorized content
    fetch('/api/database/backup', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(r => r.blob())
    .then(blob => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Backup_SMAN2_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      showToast('Berhasil mengunduh Backup Database.', 'success');
    });
  };

  const handleRestoreFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (loadEvent) => {
        const text = loadEvent.target?.result as string;
        setRestoreFileContent(text);
      };
      reader.readAsText(file);
    }
  };

  const handleRestoreSubmit = async () => {
    if (!restoreFileContent) {
      showToast('Silakan pilih file backup (.json) terlebih dahulu!', 'warning');
      return;
    }

    showConfirm(
      'Lakukan Pemulihan Database?',
      'PERINGATAN! Pemulihan database menggantikan seluruh profil sekolah, daftar paket, akun, dan riwayat siswa. Sesi Anda akan berakhir.',
      'warning',
      async () => {
        try {
          const res = await fetch('/api/database/restore', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ databaseJson: restoreFileContent })
          });

          if (res.ok) {
            showToast('Database berhasil dipulihkan. Mengatur ulang sesi...', 'success');
            setTimeout(() => {
              window.location.reload();
            }, 1500);
          } else {
            const err = await res.json();
            showToast(err.message || 'Gagal memulihkan database', 'error');
          }
        } catch (error) {
          showToast('Kesalahan jaringan sewaktu merestore database', 'error');
        }
      }
    );
  };

  // ----------------- SECURITY PASSWORD CHANGE -----------------
  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showToast('Password baru tidak cocok dengan konfirmasi!', 'warning');
      return;
    }

    try {
      const res = await fetch('/api/admin/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          oldPassword: passwordForm.oldPassword,
          newPassword: passwordForm.newPassword
        })
      });

      if (res.ok) {
        showToast('Password administrator berhasil diubah. Menghentikan sesi...', 'success');
        setTimeout(() => {
          onLogout();
        }, 1500);
      } else {
        const err = await res.json();
        showToast(err.message || 'Gagal mengubah password admin', 'error');
      }
    } catch (e) {
      showToast('Koneksi ditolak', 'error');
    }
  };

  const getStatusColor = (st: string) => {
    return st === 'Diterima'
      ? 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30'
      : 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30';
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-150 flex flex-col md:flex-row transition-colors duration-300">
      
      {/* ----------------- MOBILE BRAND HEADER ----------------- */}
      <div className="md:hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-850 p-4 flex justify-between items-center z-40 shrink-0">
        <div className="flex items-center gap-2">
          {schoolProfile.logo && (
            <img src={schoolProfile.logo} alt="Logo" className="w-8 h-8 object-contain rounded" />
          )}
          <span className="font-extrabold text-sm dark:text-white uppercase tracking-tight">{schoolProfile.name}</span>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-700 dark:text-slate-400"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* ----------------- SIDEBAR CONTAINER ----------------- */}
      <aside
        className={`fixed md:sticky top-0 left-0 bottom-0 z-40 w-64 bg-blue-900 dark:bg-slate-950 text-white dark:text-slate-300 border-r border-blue-800/50 dark:border-slate-900 flex flex-col justify-between transition-transform duration-300 transform shrink-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } h-screen`}
      >
        <div>
          {/* Logo Brand Title */}
          <div className="p-6 border-b border-blue-800/50 dark:border-slate-900 flex items-center gap-3">
            {schoolProfile.logo ? (
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white p-1.5 shadow-sm">
                <img
                  src={schoolProfile.logo}
                  alt="Logo"
                  className="w-full h-full object-contain"
                />
              </div>
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white p-1.5 shadow-sm text-blue-900 font-extrabold text-lg">
                S2
              </div>
            )}
            <div>
              <h1 className="text-sm font-bold leading-tight tracking-tight text-white">{schoolProfile.name}</h1>
              <p className="text-[10px] uppercase tracking-widest text-blue-300 font-mono">Admin Portal</p>
            </div>
          </div>

          {/* Nav Item lists */}
          <nav className="p-4 space-y-1 overflow-y-auto">
            <button
              onClick={() => { setActiveTab('dashboard'); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 py-2.5 px-4 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                activeTab === 'dashboard' 
                  ? 'bg-blue-800 dark:bg-blue-900 text-white shadow-sm' 
                  : 'text-blue-100 hover:bg-blue-800/50 hover:text-white dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 text-blue-300 dark:text-slate-400" />
              Rangkuman Dashboard
            </button>
            <button
              onClick={() => { setActiveTab('siswa'); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 py-2.5 px-4 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                activeTab === 'siswa' 
                  ? 'bg-blue-800 dark:bg-blue-900 text-white shadow-sm' 
                  : 'text-blue-100 hover:bg-blue-800/50 hover:text-white dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-white'
              }`}
            >
              <Users className="w-4 h-4 text-blue-300 dark:text-slate-400" />
              Kelola Data Siswa
            </button>
            <button
              onClick={() => { setActiveTab('import'); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 py-2.5 px-4 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                activeTab === 'import' 
                  ? 'bg-blue-800 dark:bg-blue-900 text-white shadow-sm' 
                  : 'text-blue-100 hover:bg-blue-800/50 hover:text-white dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-white'
              }`}
            >
              <FilePlus2 className="w-4 h-4 text-blue-300 dark:text-slate-400" />
              Impor Excel Siswa
            </button>
            <button
              onClick={() => { setActiveTab('pengumuman'); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 py-2.5 px-4 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                activeTab === 'pengumuman' 
                  ? 'bg-blue-800 dark:bg-blue-900 text-white shadow-sm' 
                  : 'text-blue-100 hover:bg-blue-800/50 hover:text-white dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-white'
              }`}
            >
              <BellRing className="w-4 h-4" />
              Kriteria Pengumuman
            </button>
            <button
              onClick={() => { setActiveTab('statistik'); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 py-2.5 px-4 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                activeTab === 'statistik' 
                  ? 'bg-blue-800 dark:bg-blue-900 text-white shadow-sm' 
                  : 'text-blue-100 hover:bg-blue-800/50 hover:text-white dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-white'
              }`}
            >
              <BarChart3 className="w-4 h-4 text-blue-300 dark:text-slate-400" />
              Analisis &amp; Chart
            </button>
            <button
              onClick={() => { setActiveTab('profile'); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 py-2.5 px-4 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                activeTab === 'profile' 
                  ? 'bg-blue-800 dark:bg-blue-900 text-white shadow-sm' 
                  : 'text-blue-100 hover:bg-blue-800/50 hover:text-white dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-white'
              }`}
            >
              <Settings className="w-4 h-4 text-blue-300 dark:text-slate-400" />
              Profil Sekolah
            </button>
            <button
              onClick={() => { setActiveTab('backup'); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 py-2.5 px-4 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                activeTab === 'backup' 
                  ? 'bg-blue-800 dark:bg-blue-900 text-white shadow-sm' 
                  : 'text-blue-100 hover:bg-blue-800/50 hover:text-white dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-white'
              }`}
            >
              <Database className="w-4 h-4 text-blue-300 dark:text-slate-400" />
              Cadangkan Database
            </button>
            <button
              onClick={() => { setActiveTab('password'); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 py-2.5 px-4 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                activeTab === 'password' 
                  ? 'bg-blue-800 dark:bg-blue-900 text-white shadow-sm' 
                  : 'text-blue-100 hover:bg-blue-800/50 hover:text-white dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-white'
              }`}
            >
              <KeyRound className="w-4 h-4 text-blue-300 dark:text-slate-400" />
              Ganti Sandi Akun
            </button>
          </nav>
        </div>

        {/* User Footer block with toggle light mode */}
        <div className="p-4 border-t border-blue-800/50 dark:border-slate-900 space-y-4 shrink-0">
          <div className="rounded-xl bg-blue-850 dark:bg-slate-900 border border-blue-800 dark:border-slate-800 p-4 text-center">
            <p className="text-[10px] uppercase font-bold tracking-widest text-blue-300 dark:text-slate-450">Sistem Aktif</p>
            <p className="text-base font-extrabold text-white mt-1">SSL SECURED</p>
          </div>

          <div className="flex justify-between items-center text-xs text-blue-200 dark:text-slate-400 pt-1">
            <span className="font-medium">Model Tampilan</span>
            <button
              onClick={toggleDarkMode}
              className="p-1 px-2.5 bg-blue-800 hover:bg-blue-750 dark:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-md text-[10px] flex items-center gap-1 cursor-pointer transition-colors focus:outline-none"
            >
              {darkMode ? <Sun className="w-3.5 h-3.5 text-amber-405" /> : <Moon className="w-3.5 h-3.5 text-blue-200" />}
              <span>{darkMode ? "Terang" : "Gelap"}</span>
            </button>
          </div>

          <button
            onClick={onLogout}
            className="w-full py-2 bg-transparent hover:bg-red-500/20 text-white hover:text-red-405 border border-blue-700 hover:border-red-500 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out Portal
          </button>
        </div>
      </aside>

      {/* ----------------- SUB-TABS CONTENT ----------------- */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Core Top Nav */}
        <header className="hidden md:flex bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-850 px-8 py-4 items-center justify-between z-10 shrink-0">
          <div>
            <h2 className="text-xs font-bold text-slate-405 text-slate-400 uppercase tracking-widest leading-none">ADMIN PANEL</h2>
            <h1 className="text-lg font-black text-slate-900 dark:text-white tracking-tight mt-1">SMAN 2 CIAMIS Console</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 text-xs font-bold border border-emerald-100 dark:border-emerald-900/30 rounded-lg">
              <ShieldCheck className="w-3.5 h-3.5" />
              Autentikasi Terjamin (SSL)
            </span>
            <div className="w-8 h-8 rounded-full bg-blue-105 bg-blue-600 flex items-center justify-center text-white font-black text-sm">
              AD
            </div>
          </div>
        </header>

        {/* Tab Canvas Scroller */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto w-full max-w-7xl mx-auto">
          
          {/* TAB 1: DASHBOARD */}
          {activeTab === 'dashboard' && stats && (
            <div className="space-y-8 animate-fade-in">
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white font-sans">
                  Sapaan, Operator Sekolah
                </h2>
                <p className="text-sm text-slate-505 text-slate-500 mt-1 font-sans">
                  Berikut ringkasan statistik pembagian rekomendasi paket belajar saat ini.
                </p>
              </div>

              {/* Stat Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                
                <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-850/60 p-5 rounded-2xl shadow-sm hover:translate-y-[-2px] transition-all">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">TOTAL SELURUH SISWA</span>
                  <div className="mt-2 text-3xl font-black text-slate-900 dark:text-white font-sans">{stats.totalStudents}</div>
                  <p className="text-[11px] text-slate-500 mt-1 font-mono">Tercatat dalam manifest</p>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-850/60 p-5 rounded-2xl shadow-sm hover:translate-y-[-2px] transition-all">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">SISWA AKUN AKTIF</span>
                  <div className="mt-2 text-3xl font-black text-blue-600 dark:text-blue-400 font-sans">{stats.activeStudents}</div>
                  <p className="text-[11px] text-emerald-550 dark:text-emerald-400 mt-1 font-mono flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Dapat mengakses hasil
                  </p>
                </div>

                <div 
                  className="rounded-2xl p-5 shadow-md text-white hover:translate-y-[-2px] transition-all"
                  style={{ 
                    backgroundColor: '#1e3a8a', 
                    backgroundImage: 'radial-gradient(at 0% 0%, #1e40af 0px, transparent 50%), radial-gradient(at 100% 100%, #3b82f6 0px, transparent 50%)' 
                  }}
                >
                  <span className="text-[10px] font-bold uppercase tracking-widest opacity-80 block">STATUS: DITERIMA</span>
                  <div className="mt-2 text-3xl font-black font-sans">{stats.announcedStudents}</div>
                  <p className="text-[11px] opacity-90 mt-1 font-mono">Siap cetak berkas pengumuman</p>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-850/60 p-5 rounded-2xl shadow-sm hover:translate-y-[-2px] transition-all">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">BELUM DIPROSES</span>
                  <div className="mt-2 text-3xl font-black text-amber-500 font-sans">{stats.pendingStudents}</div>
                  <p className="text-[11px] text-amber-500 mt-1 font-mono">Sedang dilakukan review lanjutan</p>
                </div>

              </div>

              {/* Distribution Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* distribution list */}
                <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-850/60 p-6 rounded-2xl shadow-sm">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight mb-4 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-blue-500" />
                    Proporsi Pemetaaan Paket Mata Pelajaran
                  </h3>

                  <div className="space-y-4 pt-1">
                    {Object.entries(stats.packetDistribution).map(([pkt, count]) => {
                      const countNum = count as number;
                      const percentage = stats.totalStudents > 0 ? (countNum / stats.totalStudents) * 100 : 0;
                      return (
                        <div key={pkt} className="space-y-1">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-semibold text-slate-700 dark:text-slate-300">{pkt}</span>
                            <span className="font-mono text-slate-500 font-bold">{countNum} Siswa ({percentage.toFixed(0)}%)</span>
                          </div>
                          <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-650 bg-blue-600 rounded-full"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Audit Logs list */}
                <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-850/60 p-6 rounded-2xl shadow-sm overflow-hidden flex flex-col max-h-[350px]">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight mb-4 flex items-center justify-between">
                    <span>Aktivitas &amp; Audit Log Terbaru</span>
                    <span className="text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-950 p-1 px-2 rounded-md">Realtime</span>
                  </h3>

                  <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 text-xs">
                    {stats.recentActivities.length === 0 ? (
                      <p className="text-slate-400 italic text-center py-6 font-sans">Belum ada aktivitas terekam.</p>
                    ) : (
                      stats.recentActivities.map(log => (
                        <div key={log.id} className="pb-3 border-b border-slate-100 dark:border-slate-850 last:border-0 flex gap-2 w-full text-justify">
                          <div className="shrink-0 font-bold text-slate-400 font-mono mt-0.5">
                            {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                          <div className="flex-1">
                            <p className="text-slate-800 dark:text-slate-300 font-sans">
                              <strong className="text-blue-600 dark:text-blue-400 uppercase">{log.actor}</strong>: {log.details}
                            </p>
                            <span className="text-[10px] font-mono text-slate-400">Tindakan: {log.action} • {log.ipAddress}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MANAGE STUDENTS CONTROLS */}
          {activeTab === 'siswa' && (
            <div className="space-y-6 animate-fade-in">
              
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Manajemen Basis Data Siswa</h2>
                  <p className="text-xs text-slate-400 font-sans mt-0.5">Tambah satu per satu atau lakukan manipulasi status kualifikasi.</p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      setModalMode('add');
                      setFormData({
                        id: '',
                        nisn: '',
                        name: '',
                        kelas: '',
                        packet: 'Paket 1',
                        status: 'Diterima',
                        notes: '',
                        password: '',
                        isActive: true
                      });
                      setStudentModalOpen(true);
                    }}
                    className="flex items-center gap-2 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs md:text-sm rounded-xl cursor-pointer shadow-lg hover:shadow-blue-200 dark:hover:shadow-none"
                  >
                    <Plus className="w-4 h-4" />
                    Tambah Satu Siswa
                  </button>

                  <button
                    onClick={handleClearAllStudents}
                    className="flex items-center gap-1.5 py-2 px-3 border border-rose-200 hover:bg-rose-50 text-rose-600 dark:border-rose-950/20 dark:hover:bg-rose-950/10 font-bold text-xs rounded-xl cursor-pointer"
                    title="Kosongkan Database Siswa"
                  >
                    <UserMinus className="w-4 h-4" />
                    Hapus Semua
                  </button>
                </div>
              </div>

              {/* Filters toolbar (Datatable features) */}
              <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-850/60 p-4 rounded-2xl shadow-xs flex flex-col md:flex-row gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute inset-y-0 left-3 flex items-center text-slate-400 w-4 h-4 my-auto" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                    placeholder="Cari berdasarkan NISN, Nama, atau Kelas..."
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="flex flex-wrap gap-2.5">
                  
                  {/* Class selection */}
                  <div className="flex items-center gap-1.5">
                    <Filter className="w-3.5 h-3.5 text-slate-400" />
                    <select
                      value={selectedClass}
                      onChange={(e) => { setSelectedClass(e.target.value); setCurrentPage(1); }}
                      className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-1.5 px-2.5 text-xs text-slate-700 dark:text-slate-350 focus:outline-none"
                    >
                      <option value="">Semua Kelas</option>
                      {distinctClasses.map(cls => (
                        <option key={cls} value={cls}>{cls}</option>
                      ))}
                    </select>
                  </div>

                  {/* Packet Selection */}
                  <select
                    value={selectedPacket}
                    onChange={(e) => { setSelectedPacket(e.target.value); setCurrentPage(1); }}
                    className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-1.5 px-2.5 text-xs text-slate-705 text-slate-700 dark:text-slate-300 focus:outline-none"
                  >
                    <option value="">Semua Paket</option>
                    <option value="Paket 1">Paket 1</option>
                    <option value="Paket 2">Paket 2</option>
                    <option value="Paket 3">Paket 3</option>
                    <option value="Paket 4">Paket 4</option>
                    <option value="Paket 5">Paket 5</option>
                  </select>

                  {/* Status Selection */}
                  <select
                    value={selectedStatus}
                    onChange={(e) => { setSelectedStatus(e.target.value); setCurrentPage(1); }}
                    className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-1.5 px-2.5 text-xs text-slate-700 dark:text-slate-300 focus:outline-none"
                  >
                    <option value="">Semua Status</option>
                    <option value="Diterima">Diterima</option>
                    <option value="Belum Diproses">Belum Diproses</option>
                  </select>

                  {/* Download spreadsheet list */}
                  <button
                    onClick={handleExportToExcel}
                    className="flex items-center gap-1 py-1.5 px-2.5 bg-blue-50 hover:bg-blue-105 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-bold text-xs rounded-xl cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Unduh Excel
                  </button>

                </div>
              </div>

              {/* Students Datatable */}
              <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-850/60 rounded-2xl overflow-hidden shadow-sm">
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-950/60 text-[10px] font-bold text-slate-450 dark:text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-850">
                        <th className="px-6 py-3">Siswa</th>
                        <th className="px-6 py-3">NISN</th>
                        <th className="px-6 py-3">Kelas</th>
                        <th className="px-6 py-3">Paket</th>
                        <th className="px-6 py-3">Status</th>
                        <th className="px-6 py-3">Akun</th>
                        <th className="px-6 py-3 text-right">Opsi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-850 text-xs">
                      {students.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-6 py-8 text-center text-slate-400 italic">
                            Tidak ditemukan data siswa yang cocok dengan filter pencarian Anda.
                          </td>
                        </tr>
                      ) : (
                        students.map((std) => (
                          <tr key={std.id} className="hover:bg-slate-50/55 dark:hover:bg-slate-850/30 transition-colors">
                            <td className="px-6 py-3.5">
                              <span className="font-bold text-slate-900 dark:text-white capitalize">{std.name}</span>
                              <p className="text-[10px] text-slate-400 font-mono mt-0.5 truncate max-w-[200px]" title={std.notes}>
                                {std.notes || 'Tanpa catatan rekomendasi.'}
                              </p>
                            </td>
                            <td className="px-6 py-3.5 font-mono text-slate-600 dark:text-slate-350">{std.nisn}</td>
                            <td className="px-6 py-3.5">{std.kelas}</td>
                            <td className="px-6 py-3.5 font-semibold text-blue-600 dark:text-blue-400">{std.packet}</td>
                            <td className="px-6 py-3.5">
                              <span className={`px-2 py-0.5 font-bold rounded-md border text-[10px] ${getStatusColor(std.status)}`}>
                                {std.status}
                              </span>
                            </td>
                            <td className="px-6 py-3.5">
                              <span className={`inline-flex items-center gap-1 font-semibold text-[10px] ${std.isActive ? 'text-emerald-600' : 'text-slate-400'}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${std.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                                {std.isActive ? 'Aktif' : 'Nonaktif'}
                              </span>
                            </td>
                            <td className="px-6 py-3.5 text-right space-x-1.5">
                              <button
                                onClick={() => {
                                  setModalMode('edit');
                                  setFormData({
                                    id: std.id,
                                    nisn: std.nisn,
                                    name: std.name,
                                    kelas: std.kelas,
                                    packet: std.packet,
                                    status: std.status,
                                    notes: std.notes,
                                    password: '',
                                    isActive: std.isActive
                                  });
                                  setStudentModalOpen(true);
                                }}
                                className="inline-flex items-center justify-center p-1.5 bg-blue-50 hover:bg-blue-105 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400 rounded-lg transition-colors cursor-pointer"
                                title="Edit Siswa"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteStudent(std.id, std.name)}
                                className="inline-flex items-center justify-center p-1.5 bg-rose-50 hover:bg-rose-105 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400 rounded-lg transition-colors cursor-pointer"
                                title="Hapus Siswa"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-850 flex items-center justify-between text-xs">
                  <span className="font-mono text-slate-400">Total data tercapai: <strong>{totalStudentsCount}</strong> data</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 disabled:opacity-40 border border-slate-205 dark:border-slate-800 font-bold text-xs rounded-lg transition-all"
                    >
                      Sebelumnya
                    </button>
                    <span className="px-2 py-1 font-mono font-bold text-slate-600 dark:text-slate-350">
                      Hal {currentPage} dari {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 disabled:opacity-40 border border-slate-200 dark:border-slate-800 font-bold text-xs rounded-lg transition-all"
                    >
                      Selanjutnya
                    </button>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* TAB 3: EXCEL IMPORT CONSOLE */}
          {activeTab === 'import' && (
            <div className="space-y-8 animate-fade-in max-w-2xl">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Unggah &amp; Impor Batch Siswa</h2>
                <p className="text-xs text-slate-405 text-slate-400 mt-1">Gunakan berkas spreadsheet Excel untuk mendaftarkan ratusan siswa dalam satu unggahan.</p>
              </div>

              {/* Template Download Prompt */}
              <div className="p-5 border border-dashed border-blue-200 bg-blue-50/20 dark:border-blue-900 dark:bg-blue-950/10 rounded-2xl flex items-center justify-between flex-wrap gap-4">
                <div className="max-w-md">
                  <h4 className="text-sm font-bold text-slate-909 dark:text-white">Unduh Format Spreadsheet</h4>
                  <p className="text-xs mt-1 text-slate-500 dark:text-slate-400">Pastikan susunan header kolom NISN, Nama, Kelas, Pilihan Paket, Status, dan Catatan tersusun tepat sesuai format di bawah.</p>
                </div>
                <button
                  onClick={handleDownloadTemplate}
                  className="flex items-center gap-2 py-2 px-4.5 bg-gradient-to-r from-blue-650 via-blue-600 to-indigo-600 text-white font-bold text-xs rounded-xl shadow-lg transition-transform hover:scale-105 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  Format Template (.xlsx)
                </button>
              </div>

              {/* Upload Drop area */}
              <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-850 p-6 rounded-2xl space-y-4 shadow-sm">
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-450 uppercase tracking-wider mb-2">Import File</label>
                
                <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-blue-500 rounded-xl p-8 flex flex-col items-center justify-center transition-colors">
                  <Upload className="w-10 h-10 text-slate-400 mb-3" />
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {excelFile ? `Berkas terpilih: ${excelFile.name}` : 'Klik untuk menelusuri berkas Excel (.xlsx / .xls)'}
                  </p>
                  <input
                    type="file"
                    accept=".xls,.xlsx"
                    onChange={handleExcelImportFileChange}
                    className="mt-4 text-xs max-w-full text-slate-550 dark:text-slate-400"
                  />
                </div>

                <div className="flex gap-3 justify-end pt-2">
                  {excelFile && (
                    <button
                      onClick={() => setExcelFile(null)}
                      className="px-4 py-2 border border-slate-200 hover:bg-slate-50 dark:border-slate-850 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-350 text-xs font-bold rounded-xl"
                    >
                      Batal
                    </button>
                  )}
                  <button
                    onClick={handleExcelSubmit}
                    disabled={!excelFile}
                    className="py-2 px-5 bg-blue-650 bg-blue-600 disabled:bg-slate-300 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                  >
                    Unggah Ke Sistem
                  </button>
                </div>
              </div>

              {/* Import Log summaries */}
              {importLogs && (
                <div className="bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-500" />
                    Ikhtisar Unggahan Terakhir
                  </h3>

                  <div className="grid grid-cols-3 gap-2.5">
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-400 border border-emerald-100 rounded-xl text-center">
                      <span className="text-[10px] uppercase font-bold block">Sukses Terunggah</span>
                      <strong className="text-xl mt-0.5 block">{importLogs.successCount || 0}</strong>
                    </div>
                    <div className="p-3 bg-rose-50 dark:bg-rose-950/20 text-rose-800 dark:text-rose-400 border border-rose-105 rounded-xl text-center">
                      <span className="text-[10px] uppercase font-bold block">Gagal (Diabaikan)</span>
                      <strong className="text-xl mt-0.5 block">{importLogs.failureCount || 0}</strong>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-950/20 text-slate-805 text-slate-700 dark:text-slate-350 border border-slate-100 rounded-xl text-center">
                      <span className="text-[10px] uppercase font-bold block">Total Row Data</span>
                      <strong className="text-xl mt-0.5 block">{importedRowsLength}</strong>
                    </div>
                  </div>

                  {importLogs.errors?.length > 0 && (
                    <div className="mt-4">
                      <span className="text-xs font-bold text-rose-600 dark:text-rose-455 block mb-1">Rincian Kesalahan Import:</span>
                      <div className="p-3 bg-rose-50/50 dark:bg-rose-955/10 max-h-[150px] overflow-y-auto rounded-xl font-mono text-[11px] text-rose-800 dark:text-rose-400 space-y-1">
                        {importLogs.errors.map((e, idx) => (
                          <div key={idx}>• {e}</div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

            </div>
          )}

          {/* TAB 4: COMPLIANT ANNOUNCEMENTS EDIT */}
          {activeTab === 'pengumuman' && (
            <div className="space-y-6 animate-fade-in max-w-2xl">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Kriteria Pilihan Paket Kelompok Belajar</h2>
                <p className="text-xs text-slate-400 mt-1">Daftar paket mata pelajaran akademik rujukan BK tingkat lanjut sesuai keputusan sekolah.</p>
              </div>

              <div className="space-y-4">
                
                {/* Package Mapping Descriptions info */}
                {[
                  { name: 'Paket 1', subs: 'Biologi, Fisika, Matematika Tingkat Lanjut, PKWU, Informatika', color: 'from-blue-500 to-cyan-500' },
                  { name: 'Paket 2', subs: 'Ekonomi, Sosiologi, Sejarah Tingkat Lanjut, PKWU, Informatika', color: 'from-amber-500 to-orange-500' },
                  { name: 'Paket 3', subs: 'Ekonomi, Sosiologi, Bhs.Inggris Tingkat Lanjut, PKWU, Informatika', color: 'from-emerald-500 to-teal-500' },
                  { name: 'Paket 4', subs: 'Biologi, Fisika, Ekonomi, PKWU, Informatika', color: 'from-pink-500 to-rose-500' },
                  { name: 'Paket 5', subs: 'Biologi, Fisika, Bhs.Inggris Tingkat Lanjut, PKWU, Informatika', color: 'from-purple-500 to-indigo-500' },
                ].map((p, idx) => (
                  <div key={idx} className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-850 p-5 rounded-2xl flex items-start gap-4 shadow-xs">
                    <div className={`p-3 bg-gradient-to-br ${p.color} text-white font-black text-xs rounded-xl shadow-xs font-mono shrink-0`}>
                      P{idx+1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <strong className="text-slate-900 dark:text-white text-sm block">{p.name}</strong>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono tracking-tight leading-relaxed select-all">
                        {p.subs}
                      </p>
                    </div>
                  </div>
                ))}

              </div>
            </div>
          )}

          {/* TAB 5: ANALYTICS & CHARTS */}
          {activeTab === 'statistik' && stats && (
            <div className="space-y-8 animate-fade-in max-w-4xl">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Analitis Pemetaan Pilihan &amp; Kelulusan</h2>
                <p className="text-xs text-slate-400 mt-0.5">Sintesis numerik pembagian rekomendasi dan status database.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Visual Bar graphics list */}
                <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-850 p-6 rounded-2xl shadow-sm">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Grafik Bar Pilihan Paket Mandiri SMAN 2</h3>
                  
                   <div className="space-y-6 pt-2">
                    {Object.entries(stats.packetDistribution).map(([pkt, cnt]) => {
                      const cntNum = cnt as number;
                      const maxVal = Math.max(...Object.values(stats.packetDistribution).map(v => v as number)) || 1;
                      const ratio = (cntNum / maxVal) * 100;
                      return (
                        <div key={pkt} className="flex items-center gap-3">
                          <span className="w-16 text-xs text-slate-500 dark:text-slate-400 font-bold shrink-0 font-mono">{pkt}</span>
                          <div className="flex-1 bg-slate-105 bg-slate-100 dark:bg-slate-950/60 h-6 rounded-lg overflow-hidden flex items-center pr-3">
                            <div
                              className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-l-lg"
                              style={{ width: `${ratio}%` }}
                            />
                            {cntNum > 0 && (
                              <span className="text-[10px] font-bold font-mono pl-3 text-slate-600 dark:text-slate-400">{cntNum} Siswa</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* status dashboard analysis */}
                <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-850 p-6 rounded-2xl shadow-sm flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Ringkasan Konfigurasi Hasil Konseling</h3>
                    <p className="text-xs text-slate-400 mb-6 font-sans">Presentasi kualifikasi bimbingan kelulusan yang telah berhasil dipublish ke sistem.</p>
                  </div>

                  <div className="space-y-3 font-sans">
                    <div className="flex justify-between items-center text-xs pb-3 border-b border-slate-100 dark:border-slate-850">
                      <span>Kelulusan Terselesaikan</span>
                      <span className="font-bold text-emerald-600 font-mono">{stats.announcedStudents} Siswa ({stats.totalStudents > 0 ? ((stats.announcedStudents / stats.totalStudents) * 100).toFixed(0) : 0}%)</span>
                    </div>
                    <div className="flex justify-between items-center text-xs pb-3 border-b border-slate-100 dark:border-slate-850">
                      <span>Kandidat Belum Ditelaah</span>
                      <span className="font-bold text-amber-500 font-mono">{stats.pendingStudents} Siswa ({stats.totalStudents > 0 ? ((stats.pendingStudents / stats.totalStudents) * 100).toFixed(0) : 0}%)</span>
                    </div>
                    <div className="flex justify-between items-center text-xs pt-1.5">
                      <span>Total Data Manifest</span>
                      <span className="font-black text-slate-900 dark:text-white font-mono">{stats.totalStudents} Siswa</span>
                    </div>
                  </div>
                  
                  <div className="mt-6 border-t border-slate-100 dark:border-slate-850 pt-4 flex gap-2.5 items-center bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl">
                    <Check className="w-5 h-5 text-blue-500 shrink-0" />
                    <span className="text-[11px] text-slate-550 dark:text-slate-400 leading-normal font-sans">Semua metrik dan aktivitas disinkronisasikan langsung dengan unit pelayanan bimbingan konseling SMAN 2 CIAMIS.</span>
                  </div>

                </div>

              </div>

            </div>
          )}

          {/* TAB 6: SCHOOL PROFILE PRESETS */}
          {activeTab === 'profile' && (
            <div className="space-y-6 animate-fade-in max-w-2xl">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Profil &amp; Identitas Sekolah</h2>
                <p className="text-xs text-slate-400 mt-0.5">Ubah nama sekolah, ubah gambar logo instansi, serta sesuaikan teks tajuk kelulusan pengumuman.</p>
              </div>

              <form onSubmit={handleUpdateProfile} className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-850 rounded-2xl p-6 md:p-8 space-y-5 shadow-sm">
                
                {/* School Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Nama Instansi Sekolah</label>
                  <input
                    type="text"
                    required
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-50/50 dark:bg-slate-950 border border-slate-205 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white"
                  />
                </div>

                {/* Announcement Date */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Tanggal Kelulusan Resmi</label>
                  <input
                    type="date"
                    required
                    value={profileForm.announcementDate}
                    onChange={(e) => setProfileForm({ ...profileForm, announcementDate: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white font-mono"
                  />
                </div>

                {/* Announcement Head Header text */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Teks Headline Kop Surat Kerangka Pengumuman</label>
                  <textarea
                    rows={3}
                    required
                    value={profileForm.announcementHeader}
                    onChange={(e) => setProfileForm({ ...profileForm, announcementHeader: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white leading-normal"
                  />
                </div>

                {/* Logo Uploader */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-3">Unggah / Ganti Lambang Logo Sekolah</label>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center">
                    
                    {/* Preview Area */}
                    <div className="sm:col-span-3 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 rounded-2xl p-4 border border-slate-150 dark:border-slate-850 h-32 relative group">
                      {profileForm.logo ? (
                        <>
                          <img
                            src={profileForm.logo}
                            alt="Logo Preview"
                            className="w-20 h-20 object-contain rounded-xl p-1 bg-white dark:bg-slate-900 shadow-sm transition-transform group-hover:scale-105"
                          />
                          <button
                            type="button"
                            onClick={() => setProfileForm({ ...profileForm, logo: '' })}
                            className="absolute top-2 right-2 p-1 bg-rose-600 hover:bg-rose-700 text-white rounded-full transition-all hover:scale-110 cursor-pointer shadow-md focus:outline-none"
                            title="Hapus Logo"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-[9px] text-slate-400 mt-1.5 font-mono font-medium">Pratinjau Logo</span>
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center text-slate-400 text-center animate-pulse">
                          <AlertCircle className="w-8 h-8 text-slate-305 text-slate-300 dark:text-slate-600 mb-1" />
                          <span className="text-[10px] font-medium text-slate-400">Kosong</span>
                        </div>
                      )}
                    </div>

                    {/* Drag and Drop Zone */}
                    <div className="sm:col-span-9">
                      <div
                        onDragOver={handleLogoDragOver}
                        onDragLeave={handleLogoDragLeave}
                        onDrop={handleLogoDrop}
                        onClick={() => document.getElementById('logo-file-input')?.click()}
                        className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 h-32 group relative ${
                          isDraggingLogo
                            ? 'border-blue-500 bg-blue-50/40 dark:bg-blue-950/20 scale-[0.99]'
                            : 'border-slate-200 hover:border-blue-500 hover:bg-slate-50/50 dark:border-slate-800 dark:hover:border-blue-900/60 dark:hover:bg-slate-950/20'
                        }`}
                      >
                        <input
                          id="logo-file-input"
                          type="file"
                          accept="image/*"
                          onChange={handleLogoFileChange}
                          className="hidden"
                        />
                        
                        <div className="p-2.5 bg-blue-550/10 bg-blue-50 dark:bg-slate-900 rounded-full group-hover:scale-110 transition-transform duration-200">
                          <Upload className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-2 font-sans">
                          {isDraggingLogo ? "Lepaskan file logo di sini..." : "Tarik & Lepas gambar di sini atau Klik untuk memilih"}
                        </p>
                        
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 max-w-xs leading-normal">
                          Format: PNG, JPG, GIF, atau SVG (Maksimal 1.5MB dengan rasio 1:1)
                        </p>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end pt-3">
                  <button
                    type="submit"
                    className="py-2.5 px-6 bg-blue-650 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-lg hover:shadow-blue-200 dark:hover:shadow-none transition-all cursor-pointer"
                  >
                    Simpan Perubahan Identitas
                  </button>
                </div>

              </form>
            </div>
          )}

          {/* TAB 7: BACKUP & RESTORE DATABASE CONSOLE */}
          {activeTab === 'backup' && (
            <div className="space-y-6 animate-fade-in max-w-xl">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Backup dan Restore Database</h2>
                <p className="text-xs text-slate-400 mt-0.5">Ambil cadangan lokal atau pulihkan data dari point cadangan tersimpan.</p>
              </div>

              {/* Download card */}
              <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-850 p-6 rounded-2xl flex items-center justify-between shadow-xs">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Unduh Backup SMAN 2</h4>
                  <p className="text-xs text-slate-450 dark:text-slate-505 text-slate-400 mt-1 max-w-sm">Dapatkan file backup berserialized .json berisi konfigurasi identitas dan seluruh siswa aktif.</p>
                </div>
                <button
                  onClick={handleBackupDownload}
                  className="flex items-center gap-2 py-2 px-4.5 bg-blue-50 hover:bg-blue-105 dark:bg-blue-950 dark:text-blue-400 font-bold text-xs text-blue-605 rounded-xl cursor-pointer transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Keluarkan JSON
                </button>
              </div>

              {/* Restore database card */}
              <div className="bg-white dark:bg-slate-900 border border-slate-155 dark:border-slate-850 rounded-2xl p-6 space-y-4 shadow-sm">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Restore Dari Backup Sebelumnya</h4>
                  <p className="text-xs text-slate-400 mt-1 leading-normal">Pilih file backup instansi bervalidasi untuk menggantikan semua record database saat ini.</p>
                </div>

                <div className="p-4 border border-dashed border-slate-205 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950/15">
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleRestoreFileChange}
                    className="text-xs text-slate-600 dark:text-slate-400"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={handleRestoreSubmit}
                    disabled={!restoreFileContent}
                    className="flex items-center gap-2 py-2 px-5 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-300 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Restore Database
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* TAB 8: CHANGE SECURITY PASSWORD */}
          {activeTab === 'password' && (
            <div className="space-y-6 animate-fade-in max-w-md">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Ganti Sandi Administrator</h2>
                <p className="text-xs text-slate-400 mt-0.5">Ubah password lama admin untuk menjamin keamanan dari penyalahgunaan hak akses konseling.</p>
              </div>

              <form onSubmit={handleChangePasswordSubmit} className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-850 p-6 rounded-2xl space-y-4 shadow-sm">
                
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Password Lama</label>
                  <input
                    type="password"
                    required
                    value={passwordForm.oldPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400"
                    placeholder="Contoh: admin123"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Password Baru</label>
                  <input
                    type="password"
                    required
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400"
                    placeholder="Minimal 6 karakter"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Klarifikasi Password Baru</label>
                  <input
                    type="password"
                    required
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50/50 dark:bg-slate-950 border border-slate-205 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400"
                    placeholder="Ulangi password baru"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="py-2.5 px-6 bg-blue-650 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-colors cursor-pointer"
                  >
                    Ganti Password Admin
                  </button>
                </div>

              </form>
            </div>
          )}

        </main>

        {/* FOOTER / STATUS BAR */}
        <footer className="flex flex-col sm:flex-row items-center justify-between border-t border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900 px-8 py-3.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 gap-2 mt-auto">
          <div>© {new Date().getFullYear()} SMAN 2 CIAMIS — Sistem Informasi Pemilihan Paket</div>
          <div className="flex gap-6">
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span> 
              Database Terkoneksi
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span> 
              SSL Active
            </span>
            <span>v2.5.0-GB</span>
          </div>
        </footer>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* ADD / EDIT SINGLE STUDENT MODAL */}
      {/* ------------------------------------------------------------- */}
      {studentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          {/* Backdrop */}
          <div onClick={() => setStudentModalOpen(false)} className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs" />
          
          {/* Main Modal Panel */}
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-2xl p-6 z-10 overflow-hidden">
            
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-500" />
                {modalMode === 'add' ? 'Tambah Siswa Baru' : 'Perbarui Siswa SMAN 2'}
              </h3>
              <button
                onClick={() => setStudentModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleStudentSubmit} className="mt-4 space-y-4 max-h-[75vh] overflow-y-auto pr-1">
              
              {/* NISN input */}
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                  NISN <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  disabled={modalMode === 'edit'}
                  value={formData.nisn}
                  onChange={(e) => setFormData({ ...formData, nisn: e.target.value.replace(/\D/g, '') })}
                  className="w-full px-3 py-2 bg-slate-50/50 dark:bg-slate-950 disabled:opacity-50 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white"
                  placeholder="Contoh: 1234567801 (10-digit angka)"
                />
              </div>

              {/* Name */}
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Nama Siswa <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50/50 dark:bg-slate-950 border border-slate-205 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white"
                  placeholder="Nama Lengkap Siswa"
                />
              </div>

              {/* Class/Kelas */}
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Kelas Rujukan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.kelas}
                  onChange={(e) => setFormData({ ...formData, kelas: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white"
                  placeholder="Contoh: XI MIPA A, XI IPS 1"
                />
              </div>

              {/* Selected Packet */}
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Pilihan Paket Mata Pelajaran
                </label>
                <select
                  value={formData.packet}
                  onChange={(e) => setFormData({ ...formData, packet: e.target.value as any })}
                  className="w-full px-3 py-2 bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-700 dark:text-slate-300"
                >
                  <option value="Paket 1">Paket 1</option>
                  <option value="Paket 2">Paket 2</option>
                  <option value="Paket 3">Paket 3</option>
                  <option value="Paket 4">Paket 4</option>
                  <option value="Paket 5">Paket 5</option>
                </select>
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Status Pengumuman Kelulusan
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full px-3 py-2 bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-700 dark:text-slate-300 mr-2"
                >
                  <option value="Diterima">Diterima</option>
                  <option value="Belum Diproses">Belum Diproses</option>
                </select>
              </div>

              {/* Custom Student Password Override */}
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Sandi Login Siswa (Sandi Khusus)
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white"
                  placeholder={modalMode === 'add' ? 'Kosongkan untuk menyamakan dengan NISN' : 'Isi hanya jika ingin mengubah sandi'}
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Catatan / Rekomendasi Khusus BK Siswa
                </label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50/50 dark:bg-slate-950 border border-slate-205 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white font-sans leading-normal"
                  placeholder="Informasi saran rujukan atau ucapan selamat pemilihan..."
                />
              </div>

              {/* Account State IsActive check */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 text-blue-600 dark:bg-slate-955 rounded-md"
                />
                <label htmlFor="isActive" className="text-xs text-slate-700 dark:text-slate-300 font-bold select-none cursor-pointer">
                  Aktifkan status akun siswa (Izin akses portal siswa)
                </label>
              </div>

              {/* Modal footer buttons */}
              <div className="flex gap-2.5 justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setStudentModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-850 text-slate-600 dark:text-slate-300 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-605 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl cursor-pointer shadow-md"
                >
                  {modalMode === 'add' ? 'Tambahkan Siswa' : 'Simpan Perubahan'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
