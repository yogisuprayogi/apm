import { useState, useEffect } from 'react';
import { SchoolProfile } from './types.js';
import { LoginScreen } from './components/LoginScreen.js';
import { StudentDashboard } from './components/StudentDashboard.js';
import { AdminDashboard } from './components/AdminDashboard.js';
import { ToastContainer, ToastMessage } from './components/Toast.js';
import { ConfirmModal } from './components/ConfirmModal.js';
import { GraduationCap } from 'lucide-react';

export default function App() {
  const [role, setRole] = useState<'admin' | 'student' | null>(null);
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string>('');
  const [schoolProfile, setSchoolProfile] = useState<SchoolProfile>({
    name: 'SMAN 2 CIAMIS',
    logo: '',
    announcementDate: '',
    announcementHeader: ''
  });
  const [loading, setLoading] = useState(true);

  // Theme support
  const [darkMode, setDarkMode] = useState<boolean>(false);

  // Toast state
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Confirm dialg state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'danger' | 'warning' | 'info' | 'success';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'warning',
    onConfirm: () => {}
  });

  const showToast = (text: string, type: 'success' | 'error' | 'warning' | 'info' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, text, type }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const showConfirm = (
    title: string,
    message: string,
    type: 'danger' | 'warning' | 'info' | 'success',
    onConfirm: () => void
  ) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      type,
      onConfirm: () => {
        onConfirm();
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
      }
    });
  };

  const toggleDarkMode = () => {
    const nextDark = !darkMode;
    setDarkMode(nextDark);
    localStorage.setItem('SMAN2_THEME', nextDark ? 'dark' : 'light');
    
    if (nextDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // On initial mount: Restore Session and Theme Preferences
  useEffect(() => {
    // 1. Restore Theme
    const savedTheme = localStorage.getItem('SMAN2_THEME');
    const isDark = savedTheme === 'dark';
    setDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // 2. Hydrate/Check Session
    const savedToken = localStorage.getItem('SMAN2_SESSION_TOKEN');
    const savedRole = localStorage.getItem('SMAN2_SESSION_ROLE') as 'admin' | 'student';

    const checkSession = async () => {
      // Fetch public profile as fallback first
      let currentProfile: SchoolProfile | null = null;
      try {
        const profRes = await fetch('/api/school/profile');
        if (profRes.ok) {
          currentProfile = await profRes.json();
          setSchoolProfile(currentProfile!);
        }
      } catch (err) {
        console.error('Failed to pre-hydrate profile', err);
      }

      if (savedToken && savedRole) {
        try {
          const res = await fetch('/api/auth/session', {
            headers: {
              'Authorization': `Bearer ${savedToken}`
            }
          });

          if (res.ok) {
            const data = await res.json();
            setRole(data.role);
            setUser(data.user);
            setToken(savedToken);
            if (data.schoolProfile) {
              setSchoolProfile(data.schoolProfile);
            }
          } else {
            // Token expired or invalid
            localStorage.removeItem('SMAN2_SESSION_TOKEN');
            localStorage.removeItem('SMAN2_SESSION_ROLE');
            showToast('Sesi login telah berakhir. Silakan login kembali.', 'info');
          }
        } catch (error) {
          console.error(error);
          showToast('Koneksi internet bermasalah, menggunakan data lokal offline.', 'warning');
        }
      }
      setLoading(false);
    };

    checkSession();
  }, []);

  const handleLogin = async (loginRole: 'admin' | 'student', username: string, pw: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password: pw })
      });

      if (res.ok) {
        const data = await res.json();
        
        // Cache token in LocalStorage
        localStorage.setItem('SMAN2_SESSION_TOKEN', data.token);
        localStorage.setItem('SMAN2_SESSION_ROLE', data.role);

        setToken(data.token);
        setRole(data.role);
        setUser(data.user);
        if (data.schoolProfile) {
          setSchoolProfile(data.schoolProfile);
        }

        showToast(
          data.role === 'admin' 
            ? 'Selamat Datang Admin! Panel kontrol berhasil diakses.' 
            : `Selamat Datang Siswa: ${data.user.name}!`,
          'success'
        );
        return true;
      } else {
        const errorData = await res.json();
        showToast(errorData.message || 'Gagal masuk sistem', 'error');
        return false;
      }
    } catch (err) {
      showToast('Koneksi ke server terputus.', 'error');
      return false;
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (e) {
      // Ignored
    }

    localStorage.removeItem('SMAN2_SESSION_TOKEN');
    localStorage.removeItem('SMAN2_SESSION_ROLE');
    
    setToken('');
    setRole(null);
    setUser(null);
    showToast('Anda berhasil keluar dari sistem.', 'success');
  };

  // Loading animation state
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-105 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
            <GraduationCap className="w-7 h-7 text-blue-600 absolute inset-0 m-auto animate-pulse" />
          </div>
          <span className="text-xs font-bold font-mono tracking-widest text-slate-400 dark:text-slate-505 block">SMAN 2 CIAMIS</span>
          <p className="text-sm text-slate-550 dark:text-slate-400 font-sans font-medium">Memverifikasi integritas kredensial keamanan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="font-sans antialiased bg-slate-50 dark:bg-slate-950 min-h-screen">
      
      {/* Toast Manager */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Confirmation Modal overlay (SweetAlert replacement) */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* Auth State Switch Router */}
      {!role && (
        <LoginScreen
          schoolProfile={schoolProfile}
          darkMode={darkMode}
          toggleDarkMode={toggleDarkMode}
          onLogin={handleLogin}
        />
      )}

      {role === 'student' && user && (
        <StudentDashboard
          student={user}
          schoolProfile={schoolProfile}
          darkMode={darkMode}
          toggleDarkMode={toggleDarkMode}
          onLogout={handleLogout}
        />
      )}

      {role === 'admin' && (
        <AdminDashboard
          schoolProfile={schoolProfile}
          darkMode={darkMode}
          toggleDarkMode={toggleDarkMode}
          onLogout={handleLogout}
          showToast={showToast}
          showConfirm={showConfirm}
          token={token}
        />
      )}

    </div>
  );
}
