
import { User, UserRole, AttendanceRecord, TestRecord, PaymentRecord, ScheduleItem } from './types';

export const MOCK_TEACHER: User & { username: string } = {
  id: 't1',
  name: 'Raghubir Sir',
  mobile: '9876543210',
  username: 'Raghubir',
  role: UserRole.TEACHER,
};

export const MOCK_STUDENTS: User[] = [
  { id: 's1', name: 'Sidharth Kumar', mobile: '8409313191', role: UserRole.STUDENT, batch: 'A', class: '10', section: 'Science' },
  { id: 's2', name: 'Anjali Sharma', mobile: '9988776655', role: UserRole.STUDENT, batch: 'B', class: '12', section: 'Commerce' },
  { id: 's3', name: 'Rohan Mehta', mobile: '8877665544', role: UserRole.STUDENT, batch: 'A', class: '10', section: 'Science' },
];

export const MOCK_ATTENDANCE: AttendanceRecord[] = [
  { id: 'a1', studentId: 's1', date: '2023-10-01', status: 'PRESENT' },
  { id: 'a2', studentId: 's1', date: '2023-10-02', status: 'PRESENT' },
  { id: 'a3', studentId: 's1', date: '2023-10-03', status: 'ABSENT' },
  { id: 'a4', studentId: 's1', date: '2023-10-04', status: 'PRESENT' },
];

export const MOCK_TESTS: TestRecord[] = [
  { id: 'tr1', studentId: 's1', subject: 'Mathematics', date: '2023-09-25', marksObtained: 85, totalMarks: 100, grade: 'A' },
  { id: 'tr2', studentId: 's1', subject: 'Physics', date: '2023-10-01', marksObtained: 78, totalMarks: 100, grade: 'B' },
  { id: 'tr3', studentId: 's1', subject: 'Chemistry', date: '2023-10-08', marksObtained: 92, totalMarks: 100, grade: 'A+' },
];

export const MOCK_PAYMENTS: PaymentRecord[] = [
  { 
    id: 'p1', 
    studentId: 's1', 
    amount: 5000, 
    date: '2023-09-01', 
    status: 'SUCCESS', 
    description: 'Monthly Fees - Sep',
    transactionId: 'TXN84920184',
    paymentMethod: 'UPI / GPay'
  },
  { 
    id: 'p2', 
    studentId: 's1', 
    amount: 5000, 
    date: '2023-10-01', 
    status: 'SUCCESS', 
    description: 'Monthly Fees - Oct',
    transactionId: 'TXN91028472',
    paymentMethod: 'UPI / PhonePe'
  },
];

export const MOCK_SCHEDULE: ScheduleItem[] = [
  { id: 'sch1', time: "04:00 PM", subject: "Mathematics", teacher: "Raghubir Sir" },
  { id: 'sch2', time: "05:30 PM", subject: "Physics", teacher: "Sharma Sir" },
  { id: 'sch3', time: "07:00 PM", subject: "Chemistry", teacher: "Verma Mam" }
];
