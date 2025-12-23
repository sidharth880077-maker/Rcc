
import React, { useState, useEffect } from 'react';
import { User, UserRole, AttendanceRecord } from '../types';
import { storageService } from '../services/storageService';

interface AttendanceProps {
  user: User;
}

const Attendance: React.FC<AttendanceProps> = ({ user }) => {
  const isTeacher = user.role === UserRole.TEACHER;
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [students, setStudents] = useState<User[]>([]);

  useEffect(() => {
    setAttendance(storageService.getAttendance());
    setStudents(storageService.getStudents());
  }, []);

  const toggleStatus = (studentId: string) => {
    if (!isTeacher) return;
    
    let updated: AttendanceRecord[];
    const existingIndex = attendance.findIndex(a => a.studentId === studentId && a.date === selectedDate);
    
    if (existingIndex !== -1) {
      updated = attendance.map((a, idx) => 
        idx === existingIndex 
        ? { ...a, status: a.status === 'PRESENT' ? 'ABSENT' : 'PRESENT' } 
        : a
      );
    } else {
      updated = [...attendance, {
        id: `att-${Date.now()}`,
        studentId,
        date: selectedDate,
        status: 'PRESENT'
      }];
    }
    setAttendance(updated);
    storageService.saveAttendance(updated);
  };

  const getStatus = (studentId: string) => {
    return attendance.find(a => a.studentId === studentId && a.date === selectedDate)?.status || 'NOT_MARKED';
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            {isTeacher ? 'Attendance Management' : 'My Attendance Record'}
          </h1>
          <p className="text-slate-500">View and manage daily attendance logs.</p>
        </div>
        <div className="flex items-center space-x-2">
          <input 
            type="date" 
            className="px-4 py-2 border rounded-xl bg-white shadow-sm outline-none" 
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>
      </header>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {isTeacher ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4 font-semibold text-slate-700">Student Name</th>
                  <th className="px-6 py-4 font-semibold text-slate-700">Batch</th>
                  <th className="px-6 py-4 font-semibold text-slate-700">Mobile</th>
                  <th className="px-6 py-4 font-semibold text-slate-700 text-center">Status</th>
                  <th className="px-6 py-4 font-semibold text-slate-700 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((student) => {
                  const status = getStatus(student.id);
                  return (
                    <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-800">{student.name}</td>
                      <td className="px-6 py-4 text-slate-600">{student.batch}</td>
                      <td className="px-6 py-4 text-slate-600">{student.mobile}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          status === 'PRESENT' ? 'bg-green-100 text-green-700' : 
                          status === 'ABSENT' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => toggleStatus(student.id)}
                          className={`text-xs px-3 py-1 rounded transition-colors ${
                            status === 'PRESENT' ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-indigo-600 text-white hover:bg-indigo-700'
                          }`}
                        >
                          Mark {status === 'PRESENT' ? 'Absent' : 'Present'}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6">
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: 30 }).map((_, i) => {
                const day = i + 1;
                const month = selectedDate.split('-')[1];
                const year = selectedDate.split('-')[0];
                const dateStr = `${year}-${month}-${day.toString().padStart(2, '0')}`;
                const record = attendance.find(a => a.studentId === user.id && a.date === dateStr);
                return (
                  <div 
                    key={i} 
                    className={`aspect-square flex flex-col items-center justify-center rounded-lg border text-sm ${
                      record?.status === 'PRESENT' ? 'bg-green-100 border-green-200 text-green-800' :
                      record?.status === 'ABSENT' ? 'bg-red-100 border-red-200 text-red-800' :
                      'bg-slate-50 border-slate-100 text-slate-400'
                    }`}
                  >
                    <span className="font-bold">{day}</span>
                    <span className="text-[8px] uppercase">{record?.status || ''}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Attendance;
