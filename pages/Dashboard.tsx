
import React, { useState, useEffect } from 'react';
import { User, UserRole, ScheduleItem, Announcement } from '../types';
import { storageService } from '../services/storageService';
import { useNavigate } from 'react-router-dom';

interface DashboardProps {
  user: User;
}

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const isTeacher = user.role === UserRole.TEACHER;
  const navigate = useNavigate();
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showAnnModal, setShowAnnModal] = useState(false);
  const [editingScheduleItem, setEditingScheduleItem] = useState<ScheduleItem | null>(null);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);

  // Stats
  const [stats, setStats] = useState({
    totalStudents: 0,
    attendanceRate: 0,
    avgScore: 0,
    pendingPayments: 0
  });

  useEffect(() => {
    const students = storageService.getStudents();
    const attendance = storageService.getAttendance();
    const tests = storageService.getTests();
    const payments = storageService.getPayments();
    const storedSchedule = storageService.getSchedule();
    const storedAnnouncements = storageService.getAnnouncements();

    setSchedule(storedSchedule);
    setAnnouncements(storedAnnouncements);

    const attRate = isTeacher 
      ? 85 
      : Math.round((attendance.filter(a => a.studentId === user.id && a.status === 'PRESENT').length / Math.max(1, attendance.filter(a => a.studentId === user.id).length)) * 100);

    const avg = isTeacher
      ? 78
      : Math.round(tests.filter(t => t.studentId === user.id).reduce((acc, curr) => acc + (curr.marksObtained / curr.totalMarks), 0) / Math.max(1, tests.filter(t => t.studentId === user.id).length) * 100);

    const pending = isTeacher
      ? payments.filter(p => p.status === 'PENDING').length
      : payments.filter(p => p.studentId === user.id && p.status === 'PENDING').length;

    setStats({
      totalStudents: students.length,
      attendanceRate: isNaN(attRate) ? 0 : attRate,
      avgScore: isNaN(avg) ? 0 : avg,
      pendingPayments: pending
    });
  }, [user.id, isTeacher]);

  const handleEditSchedule = (item: ScheduleItem) => {
    setEditingScheduleItem(item);
    setShowScheduleModal(true);
  };

  const handleAddSchedule = () => {
    setEditingScheduleItem({ id: '', time: '', subject: '', teacher: '' });
    setShowScheduleModal(true);
  };

  const saveSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    let updated: ScheduleItem[];
    if (editingScheduleItem?.id) {
      updated = schedule.map(s => s.id === editingScheduleItem.id ? editingScheduleItem : s);
    } else {
      updated = [...schedule, { ...editingScheduleItem!, id: `sch-${Date.now()}` }];
    }
    setSchedule(updated);
    storageService.saveSchedule(updated);
    setShowScheduleModal(false);
  };

  const handleAddAnnouncement = () => {
    setEditingAnnouncement({ id: '', title: '', message: '', date: new Date().toISOString().split('T')[0] });
    setShowAnnModal(true);
  };

  const handleEditAnnouncement = (ann: Announcement) => {
    setEditingAnnouncement(ann);
    setShowAnnModal(true);
  };

  const saveAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAnnouncement) return;
    
    let updated: Announcement[];
    if (editingAnnouncement.id) {
      updated = announcements.map(a => a.id === editingAnnouncement.id ? editingAnnouncement : a);
    } else {
      updated = [{ ...editingAnnouncement, id: `ann-${Date.now()}` }, ...announcements];
    }
    setAnnouncements(updated);
    storageService.saveAnnouncements(updated);
    setShowAnnModal(false);
  };

  const deleteAnnouncement = (id: string) => {
    if (window.confirm("Delete this announcement?")) {
      const updated = announcements.filter(a => a.id !== id);
      setAnnouncements(updated);
      storageService.saveAnnouncements(updated);
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-800">Welcome, {user.name}!</h1>
        <p className="text-slate-500">Here's what's happening at RCC today.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {isTeacher && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-xl mr-4 text-2xl">👥</div>
            <div>
              <p className="text-sm font-medium text-slate-500">Total Students</p>
              <p className="text-2xl font-bold text-slate-900">{stats.totalStudents}</p>
            </div>
          </div>
        )}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center">
          <div className="p-3 bg-green-100 text-green-600 rounded-xl mr-4 text-2xl">📈</div>
          <div>
            <p className="text-sm font-medium text-slate-500">Attendance Rate</p>
            <p className="text-2xl font-bold text-slate-900">{stats.attendanceRate}%</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center">
          <div className="p-3 bg-orange-100 text-orange-600 rounded-xl mr-4 text-2xl">📝</div>
          <div>
            <p className="text-sm font-medium text-slate-500">Avg. Test Score</p>
            <p className="text-2xl font-bold text-slate-900">{stats.avgScore}%</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center">
          <div className="p-3 bg-red-100 text-red-600 rounded-xl mr-4 text-2xl">💰</div>
          <div>
            <p className="text-sm font-medium text-slate-500">{isTeacher ? 'Pending Appr.' : 'Pending Dues'}</p>
            <p className="text-2xl font-bold text-slate-900">{stats.pendingPayments}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-slate-800">Recent Announcements</h2>
            {isTeacher && (
              <button 
                onClick={handleAddAnnouncement}
                className="text-xs text-indigo-600 font-bold hover:underline"
              >
                + Post New
              </button>
            )}
          </div>
          <div className="space-y-4">
            {announcements.length > 0 ? announcements.map((ann) => (
              <div key={ann.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100 group">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-semibold text-slate-700">{ann.title}</h3>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-slate-400">{ann.date}</span>
                    {isTeacher && (
                      <div className="hidden group-hover:flex space-x-2">
                        <button onClick={() => handleEditAnnouncement(ann)} className="text-[10px] text-indigo-600 hover:font-bold">Edit</button>
                        <button onClick={() => deleteAnnouncement(ann.id)} className="text-[10px] text-red-600 hover:font-bold">Del</button>
                      </div>
                    )}
                  </div>
                </div>
                <p className="text-sm text-slate-600">{ann.message}</p>
              </div>
            )) : (
              <div className="p-8 text-center text-slate-400 italic">No announcements yet.</div>
            )}
          </div>
        </section>

        <section className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-slate-800">Upcoming Schedule</h2>
            {isTeacher && (
              <button 
                onClick={handleAddSchedule}
                className="text-xs text-indigo-600 font-bold hover:underline"
              >
                + Add
              </button>
            )}
          </div>
          <div className="space-y-4">
            {schedule.map((cls) => (
              <div key={cls.id} className="flex items-center space-x-4 group">
                <div className="w-16 text-xs font-bold text-indigo-600 uppercase tracking-tighter">{cls.time}</div>
                <div className="flex-1 pb-4 border-b border-slate-100 flex justify-between items-start">
                  <div>
                    <div className="font-semibold text-slate-800">{cls.subject}</div>
                    <div className="text-xs text-slate-500">{cls.teacher}</div>
                  </div>
                  {isTeacher && (
                    <button 
                      onClick={() => handleEditSchedule(cls)}
                      className="opacity-0 group-hover:opacity-100 text-[10px] text-slate-400 hover:text-indigo-600 transition-opacity"
                    >
                      Edit
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          <button 
            onClick={() => navigate('/calendar')}
            className="mt-6 w-full py-2 bg-indigo-50 text-indigo-600 text-sm font-semibold rounded-lg hover:bg-indigo-100 transition-colors"
          >
            View Full Calendar
          </button>
        </section>
      </div>

      {showScheduleModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-scale-up">
            <div className="p-6 bg-slate-50 border-b flex justify-between items-center">
              <h2 className="font-bold text-slate-800">{editingScheduleItem?.id ? 'Edit Class' : 'Add Class'}</h2>
              <button onClick={() => setShowScheduleModal(false)}>✕</button>
            </div>
            <form onSubmit={saveSchedule} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Time</label>
                <input 
                  type="text" 
                  placeholder="e.g. 04:00 PM"
                  required
                  className="w-full px-4 py-2 bg-slate-50 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                  value={editingScheduleItem?.time}
                  onChange={e => setEditingScheduleItem({...editingScheduleItem!, time: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Subject</label>
                <input 
                  type="text"
                  required
                  className="w-full px-4 py-2 bg-slate-50 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                  value={editingScheduleItem?.subject}
                  onChange={e => setEditingScheduleItem({...editingScheduleItem!, subject: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Teacher</label>
                <input 
                  type="text"
                  required
                  className="w-full px-4 py-2 bg-slate-50 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                  value={editingScheduleItem?.teacher}
                  onChange={e => setEditingScheduleItem({...editingScheduleItem!, teacher: e.target.value})}
                />
              </div>
              <button className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg">Save Schedule</button>
            </form>
          </div>
        </div>
      )}

      {showAnnModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-scale-up">
            <div className="p-6 bg-slate-50 border-b flex justify-between items-center">
              <h2 className="font-bold text-slate-800">{editingAnnouncement?.id ? 'Edit Announcement' : 'New Announcement'}</h2>
              <button onClick={() => setShowAnnModal(false)}>✕</button>
            </div>
            <form onSubmit={saveAnnouncement} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Title</label>
                <input 
                  type="text" 
                  required
                  className="w-full px-4 py-2 bg-slate-50 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                  value={editingAnnouncement?.title}
                  onChange={e => setEditingAnnouncement({...editingAnnouncement!, title: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Date</label>
                <input 
                  type="date"
                  required
                  className="w-full px-4 py-2 bg-slate-50 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                  value={editingAnnouncement?.date}
                  onChange={e => setEditingAnnouncement({...editingAnnouncement!, date: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Message</label>
                <textarea 
                  required
                  rows={4}
                  className="w-full px-4 py-2 bg-slate-50 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                  value={editingAnnouncement?.message}
                  onChange={e => setEditingAnnouncement({...editingAnnouncement!, message: e.target.value})}
                />
              </div>
              <button className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg">Publish Announcement</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
