import React, { useRef, useState, useEffect } from 'react';
import { LogOut, Printer, FileText, Calendar, CheckCircle2, RefreshCw, Moon, Sun, Clock, BookOpen, GraduationCap } from 'lucide-react';
import { SchoolProfile } from '../types.js';

interface StudentDashboardProps {
  student: {
    id: string;
    nisn: string;
    name: string;
    kelas: string;
    packet: 'Paket 1' | 'Paket 2' | 'Paket 3' | 'Paket 4' | 'Paket 5';
    status: 'Diterima' | 'Belum Diproses';
    notes: string;
  };
  schoolProfile: SchoolProfile;
  darkMode: boolean;
  toggleDarkMode: () => void;
  onLogout: () => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  student,
  schoolProfile,
  darkMode,
  toggleDarkMode,
  onLogout,
}) => {
  const [sessionTimeLeft, setSessionTimeLeft] = useState(30 * 60); // 30 minutes in seconds
  const printAreaRef = useRef<HTMLDivElement>(null);

  // Sub-package mappings as mandated
  const packetSubjects = {
    'Paket 1': ['Biologi', 'Fisika', 'Matematika Tingkat Lanjut', 'PKWU', 'Informatika'],
    'Paket 2': ['Ekonomi', 'Sosiologi', 'Sejarah Tingkat Lanjut', 'PKWU', 'Informatika'],
    'Paket 3': ['Ekonomi', 'Sosiologi', 'Bhs.Inggris Tingkat Lanjut', 'PKWU', 'Informatika'],
    'Paket 4': ['Biologi', 'Fisika', 'Ekonomi', 'PKWU', 'Informatika'],
    'Paket 5': ['Biologi', 'Fisika', 'Bhs.Inggris Tingkat Lanjut', 'PKWU', 'Informatika'],
  };

  const getSubjects = (pkt: 'Paket 1' | 'Paket 2' | 'Paket 3' | 'Paket 4' | 'Paket 5') => {
    return packetSubjects[pkt] || [];
  };

  // 30 minute countdown timer for session safety
  useEffect(() => {
    const timer = setInterval(() => {
      setSessionTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onLogout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [onLogout]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handlePrint = () => {
    const printContent = printAreaRef.current?.innerHTML;
    if (!printContent) return;

    // Create a temporary hidden iframe so we can trigger a clean print
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.zIndex = '-9999';
    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentWindow?.document || iframe.contentDocument;
    if (!iframeDoc) {
      window.print();
      return;
    }

    // Write the document with forced light colors and printing configuration
    iframeDoc.open();
    iframeDoc.write(`
      <html>
        <head>
          <title>Bukti Pengumuman - ${schoolProfile.name}</title>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            body {
              font-family: 'Inter', 'Segoe UI', Arial, sans-serif !important;
              background-color: white !important;
              color: black !important;
              padding: 2.5rem !important;
            }
            @media print {
              body {
                padding: 0 !important;
              }
              @page {
                size: A4 portrait;
                margin: 1.5cm;
              }
            }
          </style>
        </head>
        <body class="bg-white text-black">
          <div class="max-w-4xl mx-auto">
            ${printContent}
          </div>
          <script>
            // Wait for logo image and QR SVG vector elements to render fully
            window.onload = function() {
              setTimeout(function() {
                window.focus();
                window.print();
                setTimeout(function() {
                  window.parent.document.body.removeChild(window.frameElement);
                }, 1000);
              }, 600);
            };
          </script>
        </body>
      </html>
    `);
    iframeDoc.close();
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-300">
      
      {/* ----------------- VISUAL NAVIGATION BAR ----------------- */}
      <nav className="w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-850/60 sticky top-0 z-30 shadow-xs print:hidden">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-3.5 flex items-center justify-between">
          
          <div className="flex items-center gap-3">
            {schoolProfile.logo ? (
              <img
                src={schoolProfile.logo}
                alt={schoolProfile.name}
                referrerPolicy="no-referrer"
                className="w-10 h-10 object-contain rounded-lg"
              />
            ) : (
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                S
              </div>
            )}
            <div>
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400 block tracking-widest leading-none">STUDENT PORTAL</span>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight mt-0.5">{schoolProfile.name}</h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            
            {/* Session Info Timer */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30 rounded-lg font-mono text-xs font-semibold">
              <Clock className="w-4 h-4 animate-pulse" />
              <span>Sesi Otomatis: {formatTime(sessionTimeLeft)}</span>
            </div>

            {/* Dark Mode switcher */}
            <button
              onClick={toggleDarkMode}
              className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300 rounded-xl transition-colors focus:outline-none"
              title="Ganti Tema Visual"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-indigo-500" />}
            </button>

            {/* Logout button */}
            <button
              onClick={onLogout}
              className="flex items-center gap-2 py-2 px-4 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-semibold text-xs md:text-sm rounded-xl transition-colors cursor-pointer focus:ring-2 focus:ring-offset-2 focus:ring-rose-500"
            >
              <LogOut className="w-4 h-4" />
              Keluar
            </button>
          </div>
        </div>
      </nav>

      {/* ----------------- MOBILE ONLY SESSION BAR ----------------- */}
      <div className="sm:hidden block p-3 bg-amber-50 dark:bg-amber-950/10 border-b border-amber-100 dark:border-amber-900/10 text-center font-mono text-xs text-amber-800 dark:text-amber-400 font-bold print:hidden">
        🔑 Sesi Keamanan Berakhir dalam: {formatTime(sessionTimeLeft)}
      </div>

      {/* ----------------- CORE CONTAINER ----------------- */}
      <div className="max-w-4xl mx-auto px-4 md:px-8 py-8 print:p-0">
        
        {/* Printable Headless Form */}
        <div className="print:hidden">
          
          <div className="mb-6">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-400 dark:text-slate-500 font-mono tracking-wider mb-2">
              <span>PORTAL SISWA</span>
              <span>/</span>
              <span>PENGUMUMAN</span>
              <span>/</span>
              <span className="text-blue-500">{student.nisn}</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Pengumuman Hasil Pemilihan Paket Mata Pelajaran
            </h1>
          </div>

          {/* ----------------- STUDENT BASIC RECORD CARD ----------------- */}
          <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-850/60 shadow-xl rounded-2xl overflow-hidden mb-8">
            <div className="p-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500" />
            
            <div className="p-6 md:p-8">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-6 border-b border-slate-100 dark:border-slate-800/80">
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white font-sans">{student.name}</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-mono">
                    NISN: <span className="font-bold text-slate-700 dark:text-slate-200">{student.nisn}</span> • Kelas: <span className="font-bold">{student.kelas}</span>
                  </p>
                </div>

                {/* Announcement Status Badge */}
                <div className="shrink-0 flex items-center">
                  {student.status === 'Diterima' ? (
                    <span className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 text-xs md:text-sm font-bold border border-emerald-200 dark:border-emerald-900/40 rounded-xl shadow-xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      Status: Diterima
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 text-xs md:text-sm font-bold border border-amber-200 dark:border-amber-900/40 rounded-xl shadow-xs animate-pulse">
                      <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
                      Status: Belum Diproses
                    </span>
                  )}
                </div>
              </div>

              {/* ----------------- DETAILED PACKET ANALYSIS ----------------- */}
              <div className="mt-6 space-y-6">
                <div>
                  <h3 className="text-xs font-bold text-slate-450 dark:text-slate-500 uppercase tracking-widest">Rekomendasi Paket Akademik</h3>
                  <div className="mt-2 text-2xl font-extrabold text-blue-600 dark:text-blue-400 flex items-center gap-2">
                    <GraduationCap className="w-7 h-7 stroke-[1.8]" />
                    {student.packet}
                  </div>
                </div>

                {/* Sub-Subjects List Box */}
                <div className="p-5 bg-slate-50 dark:bg-slate-950/50 rounded-xl border border-slate-100 dark:border-slate-850/80">
                  <h4 className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5" />
                    Rincian Mata Pelajaran yang Akan Ditempuh ({student.packet}):
                  </h4>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {getSubjects(student.packet).map((sub, index) => (
                      <li key={index} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-350">
                        <span className="w-5 h-5 flex items-center justify-center bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-mono text-[11px] font-bold rounded-md">
                          {index + 1}
                        </span>
                        <span>{sub}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Official Message notes */}
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-slate-450 dark:text-slate-500 uppercase tracking-widest">Pesan / Catatan Tambahan</h4>
                  <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed italic bg-blue-50/20 dark:bg-slate-900 p-4 border-l-4 border-blue-600 rounded-r-lg font-sans">
                    &ldquo;{student.notes || 'Silakan menghubungi guru Bimbingan Konseling atau wali kelas jika membutuhkan asistensi lebih lanjut.'}&rdquo;
                  </div>
                </div>

                {/* Date display context */}
                <div className="flex items-center gap-2 text-xs font-mono text-slate-450 dark:text-slate-500 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <Calendar className="w-4 h-4 shrink-0 text-slate-400" />
                  <span>Tanggal Pengumuman Resmi: <strong className="text-slate-600 dark:text-slate-300">{schoolProfile.announcementDate}</strong></span>
                </div>
              </div>
            </div>

            {/* Action Card trigger print */}
            <div className="p-4 bg-slate-50 dark:bg-slate-850/30 border-t border-slate-100 dark:border-slate-850 flex items-center justify-between flex-wrap gap-3">
              <span className="text-xs text-slate-500 dark:text-slate-400 leading-normal max-w-sm font-sans">
                Harap cetak pengumuman resmi ini sebagai dokumen penunjang pendaftaran ulang kelompok belajar.
              </span>
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 py-2 px-5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs md:text-sm rounded-xl shadow-lg shadow-indigo-100 dark:shadow-none transition-all cursor-pointer focus:outline-none"
              >
                <Printer className="w-4 h-4" />
                Cetak Bukti Pengumuman (PDF)
              </button>
            </div>
          </div>

          {/* Quick Informational Notice */}
          <div className="p-5 border border-blue-105 dark:border-blue-900 bg-blue-50/40 dark:bg-blue-950/10 rounded-2xl flex gap-3.5">
            <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400 shrink-0" />
            <div className="text-xs md:text-sm text-slate-750 dark:text-slate-350 leading-relaxed">
              <strong className="text-blue-900 dark:text-blue-300 font-sans">Pemberitahuan Wali Orang Tua:</strong> Sistem seleksi paket bimbingan didasarkan atas instrumen evaluasi kualifikasi bimbingan konseling mandiri. Jika nama, kelas, atau NISN tidak sepadan dengan data sekolah, silakan ajukan klarifikasi langsung ke administrator di unit BK.
            </div>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* PRINT READY COMPLIANT SCHOOL CERTIFICATE LETTER (Visible in print) */}
        {/* ------------------------------------------------------------- */}
        <div id="printable-sheet" ref={printAreaRef} className="hidden print:block bg-white text-black p-8 font-sans leading-relaxed text-sm">
          
          {/* Header SMAN 2 CIAMIS Letterhead */}
          <div className="flex items-center justify-between pb-4 border-b-4 border-double border-black gap-4 text-left">
            {schoolProfile.logo ? (
              <img
                src={schoolProfile.logo || ''}
                alt="Logo Sekolah"
                referrerPolicy="no-referrer"
                className="w-20 h-20 object-contain shrink-0"
              />
            ) : (
              <div className="w-20 h-20 border-2 border-black flex items-center justify-center font-bold">LOGO</div>
            )}
            <div className="text-center flex-1">
              <h2 className="text-base font-bold tracking-wider leading-tight">YAYASAN MUTU AKADEMIK PENDIDIKAN NASIONAL</h2>
              <h1 className="text-xl font-extrabold uppercase tracking-wide leading-tight mt-1">{schoolProfile.name}</h1>
              <p className="text-xs mt-1 font-mono italic">
                Jalan Pendidikan Nomor 2 Gembira, Ciamis, Jawa Barat • Telp. 0265-1234567 • Kode Pos 46211
              </p>
              <p className="text-xs font-mono">
                Website: www.sman2ciamis.sch.id • Email: info@sman2ciamis.sch.id
              </p>
            </div>
            {/* Stamp space */}
            <div className="w-20 shrink-0" />
          </div>

          <div className="my-6 text-center">
            <h3 className="text-base font-bold uppercase underline tracking-wider">
              SURAT KEPUTUSAN PENETAPAN PROGRAM PAKET BELAJAR SISWA
            </h3>
            <p className="text-xs font-mono mt-1">Nomor: 421.3 / BK.002 / SMAN2-CMS / VIII / 2026</p>
          </div>

          <p className="text-justify indent-8 text-sm mt-4">
            Berdasarkan hasil asesmen kualifikasi, psikotes peminatan mandiri, serta portofolio nilai akademik bimbingan konseling kelayakan, Kepala Sekolah <strong>{schoolProfile.name}</strong> dengan ini menetapkan paket kelompok belajar mata pelajaran kelayakan tingkat lanjut bagi siswa yang tertera di bawah ini untuk Tahun Ajaran 2026/2027:
          </p>

          {/* Student details table */}
          <table className="w-full my-6 border-collapse border border-slate-900 text-sm text-left">
            <tbody>
              <tr>
                <td className="border border-slate-900 px-4 py-2 font-bold w-1/3">NAMA SISWA</td>
                <td className="border border-slate-900 px-4 py-2 uppercase">{student.name}</td>
              </tr>
              <tr>
                <td className="border border-slate-900 px-4 py-2 font-bold">NISN</td>
                <td className="border border-slate-900 px-4 py-2 font-mono">{student.nisn}</td>
              </tr>
              <tr>
                <td className="border border-slate-900 px-4 py-2 font-bold">KELAS / JURUSAN</td>
                <td className="border border-slate-900 px-4 py-2">{student.kelas}</td>
              </tr>
              <tr>
                <td className="border border-slate-900 px-4 py-2 font-bold bg-slate-50">PAKET AKADEMIK PILIHAN</td>
                <td className="border border-slate-900 px-4 py-1.5 font-bold text-blue-800 uppercase bg-slate-50">{student.packet}</td>
              </tr>
              <tr>
                <td className="border border-slate-900 px-4 py-2 font-bold">DAFTAR MATA PELAJARAN</td>
                <td className="border border-slate-900 px-4 py-2 bg-slate-50/25">
                  <ol className="list-decimal list-inside space-y-1">
                    {getSubjects(student.packet).map((sub, i) => (
                      <li key={i}>{sub}</li>
                    ))}
                  </ol>
                </td>
              </tr>
              <tr>
                <td className="border border-slate-900 px-4 py-2 font-bold">STATUS PENETAPAN</td>
                <td className="border border-slate-900 px-4 py-2">
                  <span className={`font-bold ${student.status === 'Diterima' ? 'text-emerald-700' : 'text-amber-600'}`}>
                    {student.status === 'Diterima' ? 'DISUTUJUI / DITERIMA' : 'PENDING / BELUM DIPROSES'}
                  </span>
                </td>
              </tr>
              <tr>
                <td className="border border-slate-900 px-4 py-2 font-bold">CATATAN DAN REKOMENDASI</td>
                <td className="border border-slate-900 px-4 py-2 italic font-mono text-xs">
                  &ldquo;{student.notes || 'Disetujui berdasarkan kriteria akademik bimbingan.'}&rdquo;
                </td>
              </tr>
            </tbody>
          </table>

          <p className="text-justify indent-8 text-sm leading-relaxed mt-4">
            Demikian surat ketatapan ini dikeluarkan untuk dapat dipergunakan sebagaimana mestinya. Siswa yang bersangkutan diharapkan segera melakukan verifikasi berkas luring ke wali kelas masing-masing guna kelengkapan modul belajar.
          </p>

          {/* Signatures & QR block */}
          <div className="mt-12 flex justify-between items-end">
            
            {/* Decoy Verification QR container */}
            <div className="flex flex-col items-center">
              <div className="w-24 h-24 border border-black p-1 bg-white flex items-center justify-center">
                {/* Visual SVG QR */}
                <svg viewBox="0 0 100 100" className="w-full h-full text-black">
                  <rect x="0" y="0" width="25" height="25" fill="black" />
                  <rect x="5" y="5" width="15" height="15" fill="white" />
                  <rect x="9" y="9" width="7" height="7" fill="black" />

                  <rect x="75" y="0" width="25" height="25" fill="black" />
                  <rect x="80" y="5" width="15" height="15" fill="white" />
                  <rect x="84" y="9" width="7" height="7" fill="black" />

                  <rect x="0" y="75" width="25" height="25" fill="black" />
                  <rect x="5" y="80" width="15" height="15" fill="white" />
                  <rect x="9" y="84" width="7" height="7" fill="black" />

                  <rect x="40" y="40" width="20" height="20" fill="gray" />
                  <rect x="45" y="45" width="10" height="10" fill="black" />

                  <rect x="30" y="10" width="10" height="10" fill="black" />
                  <rect x="60" y="10" width="10" height="10" fill="black" />
                  <rect x="10" y="30" width="10" height="10" fill="black" />
                  <rect x="80" y="30" width="10" height="10" fill="black" />
                  <rect x="30" y="80" width="10" height="10" fill="black" />
                  <rect x="60" y="80" width="10" height="20" fill="black" />
                  <rect x="80" y="60" width="10" height="10" fill="black" />
                </svg>
              </div>
              <span className="text-[10px] font-mono mt-1 uppercase text-slate-500">Scan QR Verifikasi</span>
            </div>

            {/* Official Signature */}
            <div className="text-right w-[45%] font-sans flex flex-col items-end">
              <span className="text-xs">Ciamis, {schoolProfile.announcementDate}</span>
              <span className="text-xs font-bold mt-1">Kepala Sekolah (SMAN 2 CIAMIS)</span>
              
              {/* Spacer signature space */}
              <div className="h-16 flex items-center justify-center font-mono text-[9px] text-slate-350 italic pr-8">
                [Tanda Tangan &amp; Cap Basah]
              </div>

              <span className="text-xs font-extrabold underline block">Drs. H. Suherman, M.Pd.</span>
              <span className="text-xs font-mono block text-slate-600 mt-0.5">NIP. 19690412 199303 1 005</span>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};
