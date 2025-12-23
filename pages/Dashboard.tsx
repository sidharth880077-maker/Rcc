
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

  const currentMonthKey = new Date().toISOString().slice(0, 7);
  const hasPendingDues = !isTeacher && !storageService.getPayments().some(p => p.studentId === user.id && p.status === 'SUCCESS' && p.date.startsWith(currentMonthKey));

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
    <div className="space-y-8 animate-fade-in max-w-7xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none">RCC Hub</h1>
          <p className="text-slate-500 font-medium mt-2 capitalize">Welcome back, {user.role.toLowerCase()} {user.name}.</p>
        </div>
        {hasPendingDues && (
          <div className="bg-red-50 border-2 border-red-200 px-6 py-4 rounded-[2rem] flex items-center gap-4 animate-pulse">
             <span className="text-2xl">🚨</span>
             <div>
               <p className="text-red-800 font-black text-xs uppercase tracking-widest">Action Required</p>
               <p className="text-red-600 text-sm font-bold tracking-tight">Tuition Fee for {new Date().toLocaleString('default', { month: 'long' })} is Pending.</p>
             </div>
             <button 
                onClick={() => navigate('/payments')}
                className="bg-red-600 text-white px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-700 transition-all shadow-lg shadow-red-100"
             >
               Pay Now
             </button>
          </div>
        )}
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {isTeacher && (
          <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-100 flex items-center group hover:-translate-y-1 transition-all">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-3xl mr-6 flex items-center justify-center text-3xl shadow-inner group-hover:scale-110 transition-transform">👥</div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Students</p>
              <p className="text-3xl font-black text-slate-900 tracking-tighter">{stats.totalStudents}</p>
            </div>
          </div>
        )}
        <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-100 flex items-center group hover:-translate-y-1 transition-all">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-3xl mr-6 flex items-center justify-center text-3xl shadow-inner group-hover:scale-110 transition-transform">📈</div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Attendance</p>
            <p className="text-3xl font-black text-slate-900 tracking-tighter">{stats.attendanceRate}%</p>
          </div>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-100 flex items-center group hover:-translate-y-1 transition-all">
          <div className="w-16 h-16 bg-orange-50 text-orange-600 rounded-3xl mr-6 flex items-center justify-center text-3xl shadow-inner group-hover:scale-110 transition-transform">📝</div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Performance</p>
            <p className="text-3xl font-black text-slate-900 tracking-tighter">{stats.avgScore}%</p>
          </div>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-100 flex items-center group hover:-translate-y-1 transition-all">
          <div className="w-16 h-16 bg-red-50 text-red-600 rounded-3xl mr-6 flex items-center justify-center text-3xl shadow-inner group-hover:scale-110 transition-transform">💰</div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Dues Status</p>
            <p className="text-3xl font-black text-slate-900 tracking-tighter">{stats.pendingPayments}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <section className="lg:col-span-2 bg-white rounded-[3rem] shadow-2xl shadow-slate-200/50 border border-slate-100 p-10">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">Class Announcements</h2>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Official RCC Broadcast</p>
            </div>
            {isTeacher && (
              <button 
                onClick={handleAddAnnouncement}
                className="w-12 h-12 bg-indigo-50 text-indigo-600 font-black rounded-2xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm flex items-center justify-center text-2xl active:scale-90"
              >
                +
              </button>
            )}
          </div>
          <div className="space-y-6">
            {announcements.length > 0 ? announcements.map((ann) => (
              <div key={ann.id} className="p-8 bg-slate-50/50 rounded-[2rem] border border-slate-50 group hover:bg-white hover:shadow-2xl hover:shadow-slate-200/50 transition-all">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-black text-slate-800 tracking-tight">{ann.title}</h3>
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mt-1">{ann.date}</p>
                  </div>
                  {isTeacher && (
                    <div className="hidden group-hover:flex space-x-2">
                      <button onClick={() => handleEditAnnouncement(ann)} className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center text-xs">✏️</button>
                      <button onClick={() => deleteAnnouncement(ann.id)} className="w-10 h-10 bg-red-50 text-red-600 rounded-xl flex items-center justify-center text-xs">🗑️</button>
                    </div>
                  )}
                </div>
                <p className="text-slate-600 text-lg leading-relaxed font-medium">{ann.message}</p>
              </div>
            )) : (
              <div className="py-20 text-center opacity-30 grayscale flex flex-col items-center">
                 <div className="text-8xl mb-6">📭</div>
                 <p className="text-xl font-black tracking-tighter">Quiet inbox today.</p>
              </div>
            )}
          </div>
        </section>

        <section className="bg-slate-900 rounded-[3rem] shadow-2xl p-10 text-white flex flex-col justify-between overflow-hidden relative">
          <div className="relative z-10">
            <div className="flex justify-between items-center mb-10">
              <h2 className="text-2xl font-black tracking-tight">Live Schedule</h2>
              {isTeacher && (
                <button 
                  onClick={handleAddSchedule}
                  className="w-12 h-12 bg-white/10 text-white font-black rounded-2xl hover:bg-white/20 transition-all flex items-center justify-center text-2xl"
                >
                  +
                </button>
              )}
            </div>
            <div className="space-y-8">
              {schedule.map((cls) => (
                <div key={cls.id} className="flex items-start space-x-6 group">
                  <div className="w-20 text-[10px] font-black text-indigo-400 uppercase tracking-widest pt-1">{cls.time}</div>
                  <div className="flex-1 pb-6 border-b border-white/5 flex justify-between items-start group-last:border-none">
                    <div>
                      <div className="text-xl font-black tracking-tight mb-1">{cls.subject}</div>
                      <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">{cls.teacher}</div>
                    </div>
                    {isTeacher && (
                      <button 
                        onClick={() => handleEditSchedule(cls)}
                        className="opacity-0 group-hover:opacity-100 w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center text-xs hover:bg-white/20 transition-all"
                      >
                        ✏️
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <button 
            onClick={() => navigate('/calendar')}
            className="mt-12 w-full py-5 bg-indigo-600 text-white text-sm font-black uppercase tracking-[0.2em] rounded-2xl shadow-2xl shadow-indigo-500/20 hover:bg-indigo-700 transition-all active:scale-[0.98] z-10"
          >
            Full Calendar
          </button>
          
          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl"></div>
        </section>
      </div>

      {showScheduleModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xl z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-[3rem] shadow-2xl overflow-hidden animate-scale-up border border-white/20">
            <div className="p-8 bg-slate-50/50 border-b flex justify-between items-center">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">{editingScheduleItem?.id ? 'Adjust Slot' : 'New Slot'}</h2>
              <button onClick={() => setShowScheduleModal(false)} className="w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-xl">✕</button>
            </div>
            <form onSubmit={saveSchedule} className="p-8 space-y-6">
              <div>
                <label className="block text-[10px] font-black text-indigo-400 uppercase tracking-widest px-4 mb-2">Time Slot</label>
                <input 
                  type="text" 
                  placeholder="e.g. 04:00 PM"
                  required
                  className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl outline-none font-bold transition-all"
                  value={editingScheduleItem?.time}
                  onChange={e => setEditingScheduleItem({...editingScheduleItem!, time: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-indigo-400 uppercase tracking-widest px-4 mb-2">Topic / Subject</label>
                <input 
                  type="text"
                  required
                  className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl outline-none font-bold transition-all"
                  value={editingScheduleItem?.subject}
                  onChange={e => setEditingScheduleItem({...editingScheduleItem!, subject: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-indigo-400 uppercase tracking-widest px-4 mb-2">Instructor</label>
                <input 
                  type="text"
                  required
                  className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl outline-none font-bold transition-all"
                  value={editingScheduleItem?.teacher}
                  onChange={e => setEditingScheduleItem({...editingScheduleItem!, teacher: e.target.value})}
                />
              </div>
              <button className="w-full py-5 bg-indigo-600 text-white font-black uppercase tracking-widest rounded-2xl shadow-2xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-[0.98]">
                Save Schedule
              </button>
            </form>
          </div>
        </div>
      )}

      {showAnnModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xl z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden animate-scale-up border border-white/20">
            <div className="p-8 bg-slate-50/50 border-b flex justify-between items-center">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">{editingAnnouncement?.id ? 'Edit Broadcast' : 'New Broadcast'}</h2>
              <button onClick={() => setShowAnnModal(false)} className="w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-xl">✕</button>
            </div>
            <form onSubmit={saveAnnouncement} className="p-8 space-y-6">
              <div>
                <label className="block text-[10px] font-black text-indigo-400 uppercase tracking-widest px-4 mb-2">Headline</label>
                <input 
                  type="text" 
                  required
                  className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl outline-none font-black text-lg transition-all"
                  value={editingAnnouncement?.title}
                  onChange={e => setEditingAnnouncement({...editingAnnouncement!, title: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-indigo-400 uppercase tracking-widest px-4 mb-2">Date</label>
                <input 
                  type="date"
                  required
                  className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl outline-none font-bold transition-all"
                  value={editingAnnouncement?.date}
                  onChange={e => setEditingAnnouncement({...editingAnnouncement!, date: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-indigo-400 uppercase tracking-widest px-4 mb-2">Content</label>
                <textarea 
                  required
                  rows={4}
                  className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl outline-none font-medium leading-relaxed transition-all resize-none"
                  value={editingAnnouncement?.message}
                  onChange={e => setEditingAnnouncement({...editingAnnouncement!, message: e.target.value})}
                />
              </div>
              <button className="w-full py-6 bg-indigo-600 text-white font-black uppercase tracking-widest rounded-2xl shadow-2xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-[0.98]">
                Publish Update
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
