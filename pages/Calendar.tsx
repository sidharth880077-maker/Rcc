
import React, { useState, useEffect } from 'react';
import { User, UserRole, ScheduleItem, Announcement } from '../types';
import { storageService } from '../services/storageService';

interface CalendarProps {
  user: User;
}

const Calendar: React.FC<CalendarProps> = ({ user }) => {
  const isTeacher = user.role === UserRole.TEACHER;
  const [currentDate, setCurrentDate] = useState(new Date());
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  
  // Modal State
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [showDayModal, setShowDayModal] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventMessage, setNewEventMessage] = useState('');

  useEffect(() => {
    setSchedule(storageService.getSchedule());
    setAnnouncements(storageService.getAnnouncements());
  }, []);

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const totalDays = daysInMonth(year, month);
  const startDay = firstDayOfMonth(year, month);

  const monthName = currentDate.toLocaleString('default', { month: 'long' });

  const getDateStr = (day: number) => {
    return `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
  };

  const getEventsForDay = (day: number) => {
    const dateStr = getDateStr(day);
    const dayAnnouncements = announcements.filter(a => a.date === dateStr);
    const date = new Date(year, month, day);
    const dayOfWeek = date.getDay();
    const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
    
    return {
      announcements: dayAnnouncements,
      hasClasses: isWeekday && schedule.length > 0
    };
  };

  const handleDayClick = (day: number) => {
    setSelectedDay(day);
    setShowDayModal(true);
  };

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDay || !newEventTitle.trim()) return;

    const newEvent: Announcement = {
      id: `ann-${Date.now()}`,
      title: newEventTitle,
      message: newEventMessage || 'Special Event',
      date: getDateStr(selectedDay)
    };

    const updated = [newEvent, ...announcements];
    setAnnouncements(updated);
    storageService.saveAnnouncements(updated);
    
    setNewEventTitle('');
    setNewEventMessage('');
  };

  const handleDeleteEvent = (id: string) => {
    const updated = announcements.filter(a => a.id !== id);
    setAnnouncements(updated);
    storageService.saveAnnouncements(updated);
  };

  const today = new Date();
  const isToday = (day: number) => 
    today.getDate() === day && 
    today.getMonth() === month && 
    today.getFullYear() === year;

  const currentDayEvents = selectedDay ? getEventsForDay(selectedDay) : null;

  return (
    <div className="space-y-8 animate-fade-in max-w-6xl mx-auto pb-12">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Academic Calendar</h1>
          <p className="text-slate-500 font-medium">Manage and track RCC events, exams, and class schedules.</p>
        </div>
        <div className="flex items-center bg-white shadow-2xl shadow-slate-200/50 rounded-[2.5rem] p-3 border border-slate-100">
          <button 
            onClick={prevMonth}
            className="w-14 h-14 flex items-center justify-center hover:bg-indigo-50 text-indigo-600 rounded-full transition-all text-2xl active:scale-90"
          >
            ←
          </button>
          <div className="px-10 text-2xl font-black text-slate-800 min-w-[220px] text-center tracking-tight">
            {monthName} {year}
          </div>
          <button 
            onClick={nextMonth}
            className="w-14 h-14 flex items-center justify-center hover:bg-indigo-50 text-indigo-600 rounded-full transition-all text-2xl active:scale-90"
          >
            →
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 px-2">
        {/* Main Calendar Grid */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-[4rem] shadow-2xl shadow-slate-200/60 border border-slate-100 overflow-hidden transform-gpu transition-all">
            <div className="grid grid-cols-7 bg-slate-50/50 border-b border-slate-100">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="py-8 text-center text-xs font-black text-slate-400 uppercase tracking-[0.3em]">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {/* Empty cells before start of month */}
              {Array.from({ length: startDay }).map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square border-b border-r border-slate-50 bg-slate-50/10" />
              ))}
              
              {/* Month days */}
              {Array.from({ length: totalDays }).map((_, i) => {
                const day = i + 1;
                const events = getEventsForDay(day);
                const active = isToday(day);
                
                return (
                  <button 
                    key={day} 
                    onClick={() => handleDayClick(day)}
                    className={`aspect-square p-5 border-b border-r border-slate-50 relative group transition-all text-left outline-none ${
                      active ? 'bg-indigo-50/40' : 'hover:bg-slate-50'
                    }`}
                  >
                    <span className={`text-2xl font-black transition-all ${
                      active ? 'text-indigo-600' : 'text-slate-700 group-hover:text-indigo-500'
                    }`}>
                      {day}
                    </span>
                    
                    <div className="mt-3 space-y-1.5">
                      {events.hasClasses && (
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span>
                          <span className="text-[10px] font-black text-indigo-400 uppercase tracking-tight hidden md:block">Classes</span>
                        </div>
                      )}
                      {events.announcements.slice(0, 2).map(ann => (
                        <div key={ann.id} className="flex items-center gap-1.5">
                          <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                          <span className="text-[10px] font-black text-orange-400 uppercase tracking-tight truncate hidden md:block">{ann.title}</span>
                        </div>
                      )}
                      {events.announcements.length > 2 && (
                        <div className="text-[9px] font-black text-slate-300 ml-3 uppercase">+{events.announcements.length - 2} more</div>
                      )}
                    </div>

                    {active && (
                      <div className="absolute top-4 right-4 px-3 py-1 bg-indigo-600 text-white text-[10px] font-black rounded-full uppercase tracking-widest shadow-lg shadow-indigo-100">
                        Today
                      </div>
                    )}
                    
                    {isTeacher && (
                      <div className="absolute inset-0 bg-indigo-600/0 group-hover:bg-indigo-600/5 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100">
                         <span className="text-indigo-600 font-black text-3xl">+</span>
                      </div>
                    )}
                  </button>
                );
              })}
              
              {/* Empty cells after end of month */}
              {Array.from({ length: (7 - ((startDay + totalDays) % 7)) % 7 }).map((_, i) => (
                <div key={`empty-end-${i}`} className="aspect-square border-b border-slate-50 bg-slate-50/10" />
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Legend & Events */}
        <aside className="space-y-8">
          <div className="bg-white p-10 rounded-[3rem] shadow-2xl border border-slate-100">
            <h3 className="text-2xl font-black text-slate-900 mb-8 tracking-tighter">Event Legend</h3>
            <div className="space-y-6">
              <div className="flex items-center gap-5">
                <div className="w-5 h-5 rounded-full bg-indigo-500 shadow-xl shadow-indigo-100"></div>
                <span className="text-sm font-black text-slate-500 uppercase tracking-[0.15em]">Classes</span>
              </div>
              <div className="flex items-center gap-5">
                <div className="w-5 h-5 rounded-full bg-orange-500 shadow-xl shadow-orange-100"></div>
                <span className="text-sm font-black text-slate-500 uppercase tracking-[0.15em]">Events</span>
              </div>
              <div className="flex items-center gap-5">
                <div className="w-5 h-5 rounded-full bg-red-500 shadow-xl shadow-red-100"></div>
                <span className="text-sm font-black text-slate-500 uppercase tracking-[0.15em]">Exams</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 p-10 rounded-[3rem] shadow-2xl text-white relative overflow-hidden group">
            <div className="relative z-10">
              <h3 className="text-2xl font-black mb-8 tracking-tighter">Today's Focus</h3>
              <div className="space-y-8">
                {schedule.length > 0 ? schedule.map(item => (
                  <div key={item.id} className="flex gap-5 group/item transition-all hover:translate-x-1">
                    <div className="text-xs font-black text-indigo-400 uppercase w-20 pt-1 tracking-widest">{item.time}</div>
                    <div>
                      <div className="font-black text-lg tracking-tight leading-none mb-1">{item.subject}</div>
                      <div className="text-xs text-slate-400 font-black uppercase tracking-wider">{item.teacher}</div>
                    </div>
                  </div>
                )) : (
                  <div className="py-10 text-center opacity-30">
                    <div className="text-5xl mb-4">🌙</div>
                    <p className="text-sm font-bold uppercase tracking-widest">No Active Sessions</p>
                  </div>
                )}
              </div>
            </div>
            <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl group-hover:scale-110 transition-transform"></div>
          </div>
        </aside>
      </div>

      {/* Day Detail & Edit Modal */}
      {showDayModal && selectedDay && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xl z-[100] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white w-full max-w-2xl rounded-[4rem] shadow-2xl overflow-hidden border border-slate-100 animate-scale-up flex flex-col max-h-[90vh]">
            <div className="p-10 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
              <div>
                <h2 className="text-4xl font-black text-slate-900 tracking-tighter">
                  {selectedDay} {monthName}
                </h2>
                <p className="text-xs font-black text-indigo-500 uppercase tracking-[0.3em] mt-2">
                  {isTeacher ? 'Manage Daily Activities' : 'Daily Agenda'}
                </p>
              </div>
              <button 
                onClick={() => setShowDayModal(false)}
                className="w-16 h-16 flex items-center justify-center rounded-full bg-white shadow-xl hover:bg-red-50 hover:text-red-500 transition-all text-2xl"
              >✕</button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar">
              {/* Existing Events Section */}
              <div className="space-y-6">
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3">
                  Scheduled Events <span className="h-px bg-slate-100 flex-1"></span>
                </h3>
                {currentDayEvents?.announcements.length === 0 ? (
                  <p className="text-slate-400 font-medium italic py-4">No events pinned for this date.</p>
                ) : (
                  <div className="space-y-4">
                    {currentDayEvents?.announcements.map(ann => (
                      <div key={ann.id} className="group bg-slate-50 p-6 rounded-[2rem] border border-slate-100 flex items-center justify-between shadow-sm hover:shadow-xl hover:bg-white transition-all">
                        <div className="flex items-center gap-6">
                          <div className="w-14 h-14 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center text-2xl">📅</div>
                          <div>
                            <h4 className="font-black text-slate-800 text-xl tracking-tight">{ann.title}</h4>
                            <p className="text-sm text-slate-500 font-medium">{ann.message}</p>
                          </div>
                        </div>
                        {isTeacher && (
                          <button 
                            onClick={() => handleDeleteEvent(ann.id)}
                            className="w-12 h-12 bg-white text-red-400 hover:bg-red-600 hover:text-white rounded-xl transition-all shadow-sm flex items-center justify-center text-lg active:scale-90"
                            title="Delete Event"
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Teacher Form Section */}
              {isTeacher && (
                <div className="pt-10 border-t border-slate-100">
                  <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3 mb-8">
                    Add New Event <span className="h-px bg-slate-100 flex-1"></span>
                  </h3>
                  <form onSubmit={handleAddEvent} className="space-y-6">
                    <div className="space-y-4">
                      <div className="relative">
                        <label className="block text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-2 px-6">Event Title</label>
                        <input 
                          type="text" 
                          required
                          placeholder="e.g. Unit Test 3, Summer Break..."
                          className="w-full px-8 py-5 bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-[2rem] outline-none text-xl font-bold transition-all shadow-inner"
                          value={newEventTitle}
                          onChange={e => setNewEventTitle(e.target.value)}
                        />
                      </div>
                      <div className="relative">
                        <label className="block text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-2 px-6">Description (Optional)</label>
                        <textarea 
                          rows={3}
                          placeholder="Provide more details about this event..."
                          className="w-full px-8 py-5 bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-[2rem] outline-none text-lg font-medium transition-all shadow-inner resize-none"
                          value={newEventMessage}
                          onChange={e => setNewEventMessage(e.target.value)}
                        />
                      </div>
                    </div>
                    <button 
                      type="submit"
                      disabled={!newEventTitle.trim()}
                      className="w-full py-6 bg-indigo-600 text-white font-black text-xl rounded-[2rem] shadow-2xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-[0.98] disabled:opacity-20 flex items-center justify-center gap-4"
                    >
                      <span>Create Calendar Event</span>
                      <span className="text-3xl">✨</span>
                    </button>
                  </form>
                </div>
              )}
            </div>
            
            <div className="p-8 bg-slate-50/50 text-center">
               <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.4em]">RCC Smart Calendar System • {monthName} {year}</p>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(99, 102, 241, 0.1);
          border-radius: 20px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(99, 102, 241, 0.3);
        }
      `}</style>
    </div>
  );
};

export default Calendar;
