
export enum UserRole {
  STUDENT = 'STUDENT',
  TEACHER = 'TEACHER',
}

export interface User {
  id: string;
  name: string;
  mobile: string;
  role: UserRole;
  batch?: string;
  class?: string;
  section?: string;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  date: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE';
}

export interface TestRecord {
  id: string;
  studentId: string;
  subject: string;
  date: string;
  marksObtained: number;
  totalMarks: number;
  grade: string;
}

export interface PaymentRecord {
  id: string;
  studentId: string;
  amount: number;
  date: string;
  status: 'SUCCESS' | 'PENDING' | 'FAILED';
  description: string;
  transactionId?: string;
  paymentMethod?: string;
}

export interface ScheduleItem {
  id: string;
  time: string;
  subject: string;
  teacher: string;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: string;
  isRead: boolean;
}

export interface Announcement {
  id: string;
  title: string;
  message: string;
  date: string;
}
