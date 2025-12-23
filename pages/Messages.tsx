
import React, { useState, useEffect, useRef } from 'react';
import { User, UserRole, Message } from '../types';
import { storageService } from '../services/storageService';

interface MessagesProps {
  user: User;
}

const Messages: React.FC<MessagesProps> = ({ user }) => {
  const isTeacher = user.role === UserRole.TEACHER;
  const [students, setStudents] = useState<User[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setStudents(storageService.getStudents());
    const msgs = storageService.getMessages();
    setMessages(msgs);
    
    if (isTeacher && msgs.length > 0 && !selectedStudentId) {
       const lastMsg = msgs[msgs.length - 1];
       const lastId = lastMsg.senderId === user.id ? lastMsg.receiverId : lastMsg.senderId;
       if (lastId !== user.id && lastId !== 't1') {
         setSelectedStudentId(lastId);
       } else if (students.length > 0) {
         setSelectedStudentId(students[0].id);
       }
    }
  }, [user.id, isTeacher, students.length]);

  useEffect(() => {
    if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, selectedStudentId]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    
    if (isTeacher && !selectedStudentId) return;

    const receiverId = isTeacher ? selectedStudentId! : 't1';

    const msg: Message = {
      id: `msg-${Date.now()}`,
      senderId: user.id,
      receiverId: receiverId,
      content: newMessage.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isRead: false
    };

    const updatedMessages = [...messages, msg];
    setMessages(updatedMessages);
    storageService.saveMessages(updatedMessages);
    setNewMessage('');
  };

  const handleCall = () => {
    if (isTeacher) {
      const student = students.find(s => s.id === selectedStudentId);
      if (student?.mobile) {
        window.location.href = `tel:${student.mobile}`;
      } else {
        alert("Contact number not available.");
      }
    } else {
      window.location.href = `tel:9876543210`;
    }
  };

  const filteredMessages = isTeacher
    ? messages.filter(m => (m.senderId === user.id && m.receiverId === selectedStudentId) || (m.senderId === selectedStudentId && m.receiverId === user.id))
    : messages.filter(m => m.receiverId === user.id || m.senderId === user.id);

  const selectedStudent = students.find(s => s.id === selectedStudentId);

  return (
    <div className="h-[calc(100vh-5rem)] flex flex-col md:flex-row gap-8 animate-fade-in p-2 md:p-0">
      {/* Sidebar - Smart List */}
      {isTeacher && (
        <aside className="w-full md:w-[400px] bg-white rounded-[3rem] shadow-2xl border border-slate-100 flex flex-col overflow-hidden transition-all duration-500">
          <div className="p-10 border-b border-slate-50 bg-gradient-to-br from-indigo-50/50 to-white">
            <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Inbox</h2>
            <div className="flex items-center mt-2">
              <span className="text-xs font-black text-indigo-500 bg-indigo-50 px-3 py-1 rounded-full uppercase tracking-widest">
                {students.length} Students
              </span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar">
            {students.map(student => {
              const studentMessages = messages.filter(m => (m.senderId === user.id && m.receiverId === student.id) || (m.senderId === student.id && m.receiverId === user.id));
              const lastMsg = studentMessages.length > 0 ? studentMessages[studentMessages.length - 1] : null;
              const unreadCount = studentMessages.filter(m => m.receiverId === user.id && !m.isRead).length;

              return (
                <button
                  key={student.id}
                  onClick={() => setSelectedStudentId(student.id)}
                  className={`w-full p-6 rounded-[2.2rem] text-left transition-all duration-300 relative group flex items-center gap-5 ${
                    selectedStudentId === student.id
                      ? 'bg-indigo-600 text-white shadow-2xl shadow-indigo-300 -translate-y-1'
                      : 'hover:bg-indigo-50/50 text-slate-600'
                  }`}
                >
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl flex-shrink-0 transition-transform group-hover:scale-110 ${
                    selectedStudentId === student.id ? 'bg-white/20' : 'bg-slate-100 text-slate-400'
                  }`}>
                    {student.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <span className={`font-black text-lg truncate ${selectedStudentId === student.id ? 'text-white' : 'text-slate-800'}`}>
                        {student.name}
                      </span>
                      <span className={`text-[10px] font-bold ${selectedStudentId === student.id ? 'text-indigo-200' : 'text-slate-400'}`}>
                        {lastMsg?.timestamp || ''}
                      </span>
                    </div>
                    <p className={`text-sm truncate font-medium ${selectedStudentId === student.id ? 'text-indigo-100' : 'text-slate-500'}`}>
                      {lastMsg ? lastMsg.content : 'Tap to start...'}
                    </p>
                  </div>
                  {unreadCount > 0 && selectedStudentId !== student.id && (
                    <span className="absolute top-6 right-6 w-6 h-6 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full font-black ring-4 ring-white animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </aside>
      )}

      {/* Main Smart Chat Window */}
      <div className="flex-1 bg-white rounded-[4rem] shadow-2xl border border-slate-100 flex flex-col overflow-hidden relative transition-all duration-700 ease-in-out">
        {isTeacher && !selectedStudentId ? (
          <div className="flex-1 flex flex-col items-center justify-center p-20 text-center">
            <div className="w-48 h-48 bg-indigo-50 rounded-full flex items-center justify-center text-8xl mb-10 animate-pulse">✨</div>
            <h3 className="text-4xl font-black text-slate-900 tracking-tighter">Smart Messaging</h3>
            <p className="text-slate-500 mt-5 max-w-md text-xl leading-relaxed font-medium opacity-80">
              Select a student to communicate effortlessly. Share notes, fee updates, and test results in real-time.
            </p>
          </div>
        ) : (
          <>
            {/* Header - Glass Effect */}
            <div className="p-10 border-b border-slate-100 flex items-center justify-between bg-white/70 backdrop-blur-xl z-20 sticky top-0">
              <div className="flex items-center gap-6">
                <div className={`w-20 h-20 rounded-[2rem] ${isTeacher ? 'bg-indigo-600' : 'bg-slate-900'} text-white flex items-center justify-center text-3xl font-black shadow-2xl shadow-indigo-200 transform hover:rotate-3 transition-transform cursor-pointer`}>
                  {(isTeacher ? selectedStudent?.name : 'Raghubir Sir')?.charAt(0)}
                </div>
                <div>
                  <h3 className="text-3xl font-black text-slate-900 tracking-tighter leading-none mb-2">
                    {isTeacher ? selectedStudent?.name : 'Raghubir Sir'}
                  </h3>
                  <div className="flex items-center">
                    <span className="relative flex h-3 w-3 mr-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                    </span>
                    <span className="text-xs text-slate-400 font-black uppercase tracking-[0.2em]">Connected to RCC</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-4">
                <button 
                  onClick={handleCall}
                  className="w-16 h-16 flex items-center justify-center bg-green-50 text-green-600 hover:bg-green-600 hover:text-white rounded-[1.5rem] transition-all duration-300 text-3xl shadow-sm hover:shadow-green-200 hover:-translate-y-1 active:scale-90"
                >
                  📞
                </button>
                <button className="w-16 h-16 flex items-center justify-center bg-slate-50 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 rounded-[1.5rem] transition-all duration-300 text-3xl shadow-sm">
                  ⚡
                </button>
              </div>
            </div>

            {/* Messages Display - Big bubbles, smooth spacing */}
            <div className="flex-1 overflow-y-auto p-12 space-y-10 bg-gradient-to-b from-slate-50/50 to-white custom-scrollbar">
              {filteredMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-6 opacity-30 grayscale">
                  <div className="text-9xl">🎈</div>
                  <p className="text-slate-600 text-2xl font-black tracking-tight">Your story starts here.</p>
                </div>
              ) : (
                filteredMessages.map((msg, idx) => {
                  const isOwn = msg.senderId === user.id;
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isOwn ? 'justify-end' : 'justify-start'} animate-scale-up-long`}
                    >
                      <div className={`max-w-[85%] flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
                        <div
                          className={`px-8 py-6 rounded-[2.5rem] text-xl md:text-2xl leading-relaxed transition-all duration-300 hover:shadow-2xl ${
                            isOwn
                              ? 'bg-indigo-600 text-white rounded-tr-none shadow-xl shadow-indigo-100'
                              : 'bg-white border border-slate-100 text-slate-800 rounded-tl-none shadow-lg'
                          }`}
                        >
                          {msg.content}
                        </div>
                        <div className="flex items-center mt-4 px-4 space-x-3">
                          <span className="text-[10px] text-slate-400 font-black uppercase tracking-[0.25em]">
                            {msg.timestamp}
                          </span>
                          {isOwn && (
                            <span className="text-indigo-500 font-black text-[10px] tracking-widest flex items-center">
                              READ <span className="ml-1 text-base">✓✓</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Form - Smart Action Area */}
            <div className="p-10 bg-white border-t border-slate-100">
              <form 
                onSubmit={handleSendMessage} 
                className="flex items-center gap-6 bg-slate-50 p-3 rounded-[3rem] border-2 border-transparent focus-within:border-indigo-400 focus-within:bg-white focus-within:ring-[15px] focus-within:ring-indigo-50/80 transition-all duration-500 shadow-sm"
              >
                <button type="button" className="w-16 h-16 flex items-center justify-center hover:bg-white rounded-full transition-all text-4xl grayscale hover:grayscale-0">📂</button>
                <input
                  type="text"
                  placeholder="Share something with your student..."
                  className="flex-1 bg-transparent border-none outline-none text-2xl font-bold text-slate-800 py-6 px-4 placeholder:text-slate-300 transition-all"
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  onFocus={() => setIsTyping(true)}
                  onBlur={() => setIsTyping(false)}
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="bg-indigo-600 text-white h-16 px-12 rounded-full font-black text-lg uppercase tracking-[0.2em] hover:bg-indigo-700 transition-all shadow-2xl shadow-indigo-200 disabled:opacity-20 disabled:grayscale disabled:shadow-none transform active:scale-90 flex items-center justify-center"
                >
                  Send
                </button>
              </form>
              <div className="mt-4 flex justify-center">
                <p className="text-[10px] text-slate-300 font-black uppercase tracking-[0.5em] animate-pulse">
                  RCC Smart Chat Encryption Active
                </p>
              </div>
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes scale-up-long {
          from { opacity: 0; transform: scale(0.95) translateY(20px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .animate-scale-up-long {
          animation: scale-up-long 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(99, 102, 241, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(99, 102, 241, 0.3);
        }
      `}</style>
    </div>
  );
};

export default Messages;
