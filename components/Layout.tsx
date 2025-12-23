
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { User, UserRole } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  user: User;
  onLogout: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, user, onLogout }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/', icon: '🏠' },
    ...(user.role === UserRole.TEACHER ? [{ name: 'Students', href: '/students', icon: '👨‍🎓' }] : []),
    { name: 'Attendance', href: '/attendance', icon: '📅' },
    { name: 'Weekly Tests', href: '/tests', icon: '📝' },
    { name: 'Payments', href: '/payments', icon: '💰' },
    { name: 'Calendar', href: '/calendar', icon: '🗓️' },
    { name: 'Messages', href: '/messages', icon: '💬' },
  ];

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  const supportNumber = "+91 8409313191";

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex w-72 bg-indigo-900 text-white flex-col sticky top-0 h-screen shadow-2xl">
        <div className="p-8">
          <h1 className="text-3xl font-black tracking-tighter">RCC</h1>
          <p className="text-[10px] text-indigo-300 font-bold uppercase tracking-[0.2em] mt-1">Raghubir Coaching Classes</p>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 overflow-y-auto custom-scrollbar">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center px-5 py-4 text-sm font-bold rounded-2xl transition-all duration-300 ${
                  isActive 
                    ? 'bg-white text-indigo-900 shadow-xl shadow-indigo-950/20 translate-x-1' 
                    : 'text-indigo-100 hover:bg-indigo-800/50 hover:text-white'
                }`}
              >
                <span className="mr-4 text-xl">{item.icon}</span>
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Support Section - Desktop */}
        <div className="px-6 py-4">
          <div className="bg-indigo-800/40 rounded-[2rem] p-5 border border-indigo-700/50">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-xl">🆘</span>
              <p className="text-[10px] font-black uppercase tracking-widest text-indigo-200">Help & Support</p>
            </div>
            <p className="text-xs text-indigo-100/70 font-medium mb-3">Need assistance? Call us directly for any help.</p>
            <a 
              href={`tel:${supportNumber}`}
              className="block w-full py-3 bg-indigo-500 hover:bg-indigo-400 text-white text-center rounded-xl text-xs font-black transition-all active:scale-95 shadow-lg shadow-indigo-950/20"
            >
              📞 {supportNumber}
            </a>
          </div>
        </div>

        <div className="p-6 border-t border-indigo-800 bg-indigo-950/30">
          <div className="flex items-center mb-6 px-2">
            <div className="h-12 w-12 rounded-2xl bg-indigo-500 flex items-center justify-center text-white text-xl font-black shadow-lg">
              {user.name.charAt(0)}
            </div>
            <div className="ml-4 overflow-hidden">
              <p className="text-sm font-black truncate">{user.name}</p>
              <p className="text-[10px] text-indigo-300 font-bold uppercase tracking-widest">{user.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center px-5 py-4 text-xs font-black text-red-300 hover:bg-red-600 hover:text-white rounded-2xl transition-all uppercase tracking-widest"
          >
            🚪 Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Top Nav */}
      <div className="md:hidden bg-indigo-900 text-white p-5 flex justify-between items-center sticky top-0 z-50 shadow-lg">
        <div>
          <h1 className="text-2xl font-black tracking-tighter">RCC</h1>
        </div>
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
          className="w-12 h-12 flex items-center justify-center bg-indigo-800 rounded-2xl text-2xl"
        >
          {mobileMenuOpen ? '✕' : '☰'}
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-indigo-900 text-white z-40 p-8 space-y-4 animate-fade-in overflow-y-auto">
          <div className="flex justify-between items-center mb-10">
            <h1 className="text-3xl font-black tracking-tighter">RCC Portal</h1>
            <button onClick={() => setMobileMenuOpen(false)} className="text-2xl">✕</button>
          </div>
          
          <div className="space-y-2">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center px-6 py-5 rounded-2xl bg-indigo-800/50 text-lg font-bold"
              >
                <span className="mr-4">{item.icon}</span> {item.name}
              </Link>
            ))}
          </div>

          <div className="pt-10 border-t border-indigo-800">
            <p className="text-xs font-black uppercase tracking-[0.3em] text-indigo-400 mb-4">Official Support</p>
            <a 
              href={`tel:${supportNumber}`}
              className="flex items-center justify-center gap-4 w-full py-6 bg-emerald-600 text-white rounded-[2rem] text-xl font-black shadow-2xl active:scale-95"
            >
              📞 Call Admin
            </a>
            <p className="text-center text-indigo-300 text-sm mt-4 font-bold">{supportNumber}</p>
          </div>

          <button 
            onClick={handleLogout} 
            className="block w-full text-center py-6 text-red-400 font-black uppercase tracking-widest text-sm"
          >
            Sign Out
          </button>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 p-5 md:p-12 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
};
