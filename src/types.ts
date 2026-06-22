export interface SchoolProfile {
  name: string;
  logo: string; // Base64 encoding
  announcementDate: string;
  announcementHeader: string;
  showPrintPdf?: boolean;
  showParentNotification?: boolean;
}

export interface Student {
  id: string; // Same as NISN
  nisn: string;
  name: string;
  kelas: string;
  packet: 'Paket 1' | 'Paket 2' | 'Paket 3' | 'Paket 4' | 'Paket 5';
  status: 'Diterima' | 'Belum Diproses';
  notes: string;
  passwordHash: string;
  salt: string;
  isActive: boolean;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  actor: string; // admin / student-nisn
  action: string;
  details: string;
  ipAddress: string;
}

export interface AdminUser {
  username: string;
  passwordHash: string;
  salt: string;
}

export interface AdminSettings {
  sessionTimeoutMinutes: number;
}

export interface DatabaseState {
  schoolProfile: SchoolProfile;
  students: Student[];
  activityLogs: ActivityLog[];
  adminPasswordHash: string;
  adminSalt: string;
  admins?: AdminUser[];
}

export interface DashboardStats {
  totalStudents: number;
  activeStudents: number;
  announcedStudents: number;
  pendingStudents: number;
  packetDistribution: Record<string, number>;
  recentActivities: ActivityLog[];
}
