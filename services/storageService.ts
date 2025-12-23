
import { MOCK_STUDENTS, MOCK_ATTENDANCE, MOCK_TESTS, MOCK_PAYMENTS, MOCK_SCHEDULE } from '../constants';
import { User, AttendanceRecord, TestRecord, PaymentRecord, ScheduleItem, Message, Announcement } from '../types';

const KEYS = {
  STUDENTS: 'rcc_students',
  ATTENDANCE: 'rcc_attendance',
  TESTS: 'rcc_tests',
  PAYMENTS: 'rcc_payments',
  SCHEDULE: 'rcc_schedule',
  MESSAGES: 'rcc_messages',
  ANNOUNCEMENTS: 'rcc_announcements'
};

const DEFAULT_ANNOUNCEMENTS: Announcement[] = [
  { id: 'ann1', title: "Weekly Test Schedule", date: "2023-11-20", message: "Physics test on kinematics scheduled for Friday." },
  { id: 'ann2', title: "Diwali Holidays", date: "2023-11-19", message: "Classes will remain closed from Nov 10th to Nov 15th." },
  { id: 'ann3', title: "Fee Payment Reminder", date: "2023-11-18", message: "October month fees are due. Please clear before 10th." }
];

export const storageService = {
  getStudents: (): User[] => {
    const data = localStorage.getItem(KEYS.STUDENTS);
    return data ? JSON.parse(data) : MOCK_STUDENTS;
  },
  saveStudents: (students: User[]) => {
    localStorage.setItem(KEYS.STUDENTS, JSON.stringify(students));
  },

  getAttendance: (): AttendanceRecord[] => {
    const data = localStorage.getItem(KEYS.ATTENDANCE);
    return data ? JSON.parse(data) : MOCK_ATTENDANCE;
  },
  saveAttendance: (records: AttendanceRecord[]) => {
    localStorage.setItem(KEYS.ATTENDANCE, JSON.stringify(records));
  },

  getTests: (): TestRecord[] => {
    const data = localStorage.getItem(KEYS.TESTS);
    return data ? JSON.parse(data) : MOCK_TESTS;
  },
  saveTests: (tests: TestRecord[]) => {
    localStorage.setItem(KEYS.TESTS, JSON.stringify(tests));
  },

  getPayments: (): PaymentRecord[] => {
    const data = localStorage.getItem(KEYS.PAYMENTS);
    return data ? JSON.parse(data) : MOCK_PAYMENTS;
  },
  savePayments: (payments: PaymentRecord[]) => {
    localStorage.setItem(KEYS.PAYMENTS, JSON.stringify(payments));
  },

  getSchedule: (): ScheduleItem[] => {
    const data = localStorage.getItem(KEYS.SCHEDULE);
    return data ? JSON.parse(data) : MOCK_SCHEDULE;
  },
  saveSchedule: (schedule: ScheduleItem[]) => {
    localStorage.setItem(KEYS.SCHEDULE, JSON.stringify(schedule));
  },

  getMessages: (): Message[] => {
    const data = localStorage.getItem(KEYS.MESSAGES);
    return data ? JSON.parse(data) : [];
  },
  saveMessages: (messages: Message[]) => {
    localStorage.setItem(KEYS.MESSAGES, JSON.stringify(messages));
  },

  sendAutomatedReminder: (studentId: string, month: string) => {
    const messages = storageService.getMessages();
    const reminder: Message = {
      id: `rem-${Date.now()}`,
      senderId: 't1', // Teacher ID
      receiverId: studentId,
      content: `⚠️ AUTOMATED REMINDER: Your tuition fee for ${month} is currently pending. Please complete the online payment and upload the screenshot in the Payments section immediately to avoid late fees.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isRead: false
    };
    storageService.saveMessages([...messages, reminder]);
  },

  getAnnouncements: (): Announcement[] => {
    const data = localStorage.getItem(KEYS.ANNOUNCEMENTS);
    return data ? JSON.parse(data) : DEFAULT_ANNOUNCEMENTS;
  },
  saveAnnouncements: (announcements: Announcement[]) => {
    localStorage.setItem(KEYS.ANNOUNCEMENTS, JSON.stringify(announcements));
  }
};
