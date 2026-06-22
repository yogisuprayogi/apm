import React, { useState } from 'react';
import { LogIn, User, Shield, Eye, EyeOff, BookOpen, Sun, Moon } from 'lucide-react';
import { SchoolProfile } from '../types.js';

interface LoginScreenProps {
  schoolProfile: SchoolProfile;
  darkMode: boolean;
  toggleDarkMode: () => void;
  onLogin: (role: 'admin' | 'student', username: string, pw: string) => Promise<boolean>;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  schoolProfile,
  darkMode,
  toggleDarkMode,
  onLogin,
}) => {
  const [role, setRole] = useState<'student' | 'admin'>('student');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // Sanitization and simple front-end validation
    const trimmedUser = username.trim();
    if (!trimmedUser) {
      setErrorMsg(role === 'student' ? 'NISN wajib diisi!' : 'Username Admin wajib diisi!');
      return;
    }
    if (!password) {
      setErrorMsg('Password wajib diisi!');
      return;
    }

    if (role === 'student') {
      // Validate NISN format (digits only optionally, minimum character matches)
      if (!/^\d+$/.test(trimmedUser)) {
        setErrorMsg('NISN hanya boleh berisi angka!');
        return;
      }
    }

    setLoading(true);
    try {
      const success = await onLogin(role, trimmedUser, password);
      if (!success) {
        setErrorMsg('Username/NISN atau Password salah!');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan jaringan atau server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="login-container" className="min-h-screen relative flex flex-col justify-between overflow-hidden bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      
      {/* Dynamic Background Accents */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-400/10 dark:bg-blue-600/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/15 dark:bg-indigo-950/20 blur-[130px] pointer-events-none" />

      {/* Top action bar: Dark mode switch */}
      <header className="w-full flex justify-end items-center max-w-7xl mx-auto px-6 py-4 z-10 shrink-0">
        <button
          onClick={toggleDarkMode}
          className="p-3 bg-white hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 transition-all focus:outline-none"
          title="Toggle Dark/Light Mode"
        >
          {darkMode ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5 text-indigo-500" />}
        </button>
      </header>

      {/* Main Form Center */}
      <main className="flex-1 flex flex-col justify-center items-center px-4 md:px-8 py-8 z-10">
        <div className="w-full max-w-md">
          {/* Logo & Brand Display */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center mb-4 transition-transform hover:scale-105 duration-300">
              {schoolProfile.logo ? (
                <img
                  src={schoolProfile.logo}
                  alt={schoolProfile.name}
                  referrerPolicy="no-referrer"
                  className="w-20 h-20 md:w-24 md:h-24 object-contain rounded-2xl drop-shadow-md border border-slate-100/50 dark:border-slate-900"
                />
              ) : (
                <div id="school-logo-fallback" className="w-20 h-20 md:w-24 md:h-24 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg text-white font-extrabold text-2xl">
                  {schoolProfile.name ? schoolProfile.name.charAt(0) : 'S'}
                </div>
              )}
            </div>

            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white uppercase tracking-tight">
              {schoolProfile.name}
            </h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 font-sans max-w-sm mx-auto leading-relaxed">
              Portal Pengumuman Hasil Pemilihan Paket Mata Pelajaran
            </p>
          </div>

          {/* Form Card (Glassmorphism inspired) */}
          <div className="bg-white/85 dark:bg-slate-900/80 border border-slate-100 dark:border-slate-800 shadow-2xl rounded-2xl p-6 md:p-8 backdrop-blur-md">
            
            {/* Role Tab Navigation */}
            <div className="flex gap-2 p-1.5 bg-slate-100 dark:bg-slate-950/70 rounded-xl mb-6">
              <button
                type="button"
                onClick={() => {
                  setRole('student');
                  setUsername('');
                  setPassword('');
                  setErrorMsg('');
                }}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                  role === 'student'
                    ? 'bg-blue-900 border border-blue-800 text-white shadow-md'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                Siswa (NISN)
              </button>
              <button
                type="button"
                onClick={() => {
                  setRole('admin');
                  setUsername('');
                  setPassword('');
                  setErrorMsg('');
                }}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                  role === 'admin'
                    ? 'bg-blue-900 border border-blue-800 text-white shadow-md'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Shield className="w-4 h-4" />
                Administrator
              </button>
            </div>

            {/* Error alerts */}
            {errorMsg && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 text-rose-700 dark:text-rose-400 text-xs font-semibold rounded-lg mb-4 flex items-start gap-2">
                <span className="inline-block mt-0.5 font-bold">⚠️</span>
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Dynamic User Label */}
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                  {role === 'student' ? 'NISN (Nomor Induk Siswa Nasional)' : 'Username Admin'}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder={role === 'student' ? 'Contoh: 1234567891' : 'Contoh: admin'}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all font-sans"
                  />
                </div>
                {role === 'student' && (
                  <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500 font-mono">
                    *Gunakan NISN resmi 10-digit Anda
                  </p>
                )}
              </div>

              {/* Password field */}
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Kata Sandi
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={role === 'student' ? 'Default: NISN Anda' : 'Masukkan password admin'}
                    className="w-full pl-4 pr-10 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all font-sans"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Custom login instruction details */}
              <div className="py-2 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed bg-slate-50/50 dark:bg-slate-800/10 p-3 rounded-lg border border-dotted border-slate-200 dark:border-slate-800 font-sans">
                {role === 'student' ? (
                  <p>
                    <strong>Siswa:</strong> Gunakan NISN Anda sebagai username sekaligus password awal. Silakan cetak bukti kelulusan paket setelah berhasil masuk.
                  </p>
                ) : (
                  <p>
                    <strong>Admin:</strong> Akses ini dibatasi khusus guru, staf operator BK, atau administrator sekolah untuk pemutakhiran data paket belajar.
                  </p>
                )}
              </div>

              {/* Action Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold text-sm py-3 px-4 rounded-xl shadow-lg hover:shadow-blue-200 dark:hover:shadow-none transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    Asosiasi &amp; Masuk Sesi
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </main>

      {/* Clean elegant footer */}
      <footer className="w-full text-center py-6 px-6 z-10 border-t border-slate-100 dark:border-slate-900 font-mono text-[11px] text-slate-400 dark:text-slate-500 shrink-0">
        <div>
          {schoolProfile.name} &copy; 2026 • Unit Pelayanan Bimbingan Konseling Sekolah
        </div>
        <div className="mt-1">
          Portal Pengumuman Hasil Pemilihan Paket Mata Pelajaran
        </div>
      </footer>

    </div>
  );
};
