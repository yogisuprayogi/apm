-- Portal Pengumuman Hasil Pemilihan Paket Mata Pelajaran - Supabase Schema Setup
-- Run this script in your Supabase SQL Editor to create the required tables.

-- 1. Create School Profile Table
CREATE TABLE IF NOT EXISTS school_profile (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    logo TEXT,
    announcement_date TEXT,
    announcement_header TEXT
);

-- 2. Create Admin Config Table
CREATE TABLE IF NOT EXISTS admin_config (
    id TEXT PRIMARY KEY,
    password_hash TEXT NOT NULL,
    salt TEXT NOT NULL
);

-- 3. Create Students Table
CREATE TABLE IF NOT EXISTS students (
    id TEXT PRIMARY KEY,
    nisn TEXT NOT NULL,
    name TEXT NOT NULL,
    kelas TEXT NOT NULL,
    packet TEXT NOT NULL,
    status TEXT NOT NULL,
    notes TEXT DEFAULT '',
    password_hash TEXT NOT NULL,
    salt TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL
);

-- Create an index on nisn for faster search
CREATE INDEX IF NOT EXISTS idx_students_nisn ON students(nisn);

-- 4. Create Activity Logs Table
CREATE TABLE IF NOT EXISTS activity_logs (
    id TEXT PRIMARY KEY,
    timestamp TEXT NOT NULL,
    actor TEXT NOT NULL,
    action TEXT NOT NULL,
    details TEXT NOT NULL,
    ip_address TEXT
);

-- Create index on log timestamp
CREATE INDEX IF NOT EXISTS idx_activity_logs_timestamp ON activity_logs(timestamp DESC);

-- 5. Disable Row Level Security (RLS) for all tables
-- This ensures smooth operation for backend server-to-db interaction.
ALTER TABLE school_profile DISABLE ROW LEVEL SECURITY;
ALTER TABLE admin_config DISABLE ROW LEVEL SECURITY;
ALTER TABLE students DISABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs DISABLE ROW LEVEL SECURITY;

-- 6. Insert default records if they do not exist
INSERT INTO school_profile (id, name, announcement_date, announcement_header)
VALUES (
    'current',
    'SMAN 2 CIAMIS',
    '2026-06-25',
    'PENGUMUMAN HASIL PEMILIHAN REKOMENDASI PAKET MATA PELAJARAN KELOMPOK BELAJAR KELAS XI SEMESTER GANJIL'
)
ON CONFLICT (id) DO NOTHING;

-- Seed default admin settings (Password: 'admin123' hashed with salt 'fbf8d951682facbc12ea748375e2faea')
INSERT INTO admin_config (id, password_hash, salt)
VALUES (
    'settings',
    'e10adc3949ba59abbe56e057f20f883e', -- md5/sha or current local hash from database.json
    'fbf8d951682facbc12ea748375e2faea'
)
ON CONFLICT (id) DO NOTHING;
