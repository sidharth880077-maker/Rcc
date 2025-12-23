
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

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex w-64 bg-indigo-900 text-white flex-col sticky top-0 h-screen">
        <div className="p-6">
          <h1 className="text-2xl font-bold tracking-tight">RCC</h1>
          <p className="text-xs text-indigo-300">Raghubir Coaching Classes</p>
        </div>
        
        <nav className="flex-1 px-4 space-y-1">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-indigo-800 text-white' 
                    : 'text-indigo-100 hover:bg-indigo-800 hover:text-white'
                }`}
              >
                <span className="mr-3 text-lg">{item.icon}</span>
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-indigo-800">
          <div className="flex items-center mb-4">
            <div className="h-10 w-10 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold">
              {user.name.charAt(0)}
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">{user.name}</p>
              <p className="text-xs text-indigo-300 capitalize">{user.role.toLowerCase()}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-4 py-2 text-sm font-medium text-indigo-100 hover:bg-red-600 hover:text-white rounded-lg transition-colors"
          >
            <span>🚪</span>
            <span className="ml-3">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Top Nav */}
      <div className="md:hidden bg-indigo-900 text-white p-4 flex justify-between items-center sticky top-0 z-50">
        <h1 className="text-xl font-bold">RCC</h1>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2">
          {mobileMenuOpen ? '✕' : '☰'}
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden bg-indigo-800 text-white p-4 space-y-2">
          {navigation.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              onClick={() => setMobileMenuOpen(false)}
              className="block px-4 py-2 rounded hover:bg-indigo-700"
            >
              {item.icon} {item.name}
            </Link>
          ))}
          <button onClick={handleLogout} className="block w-full text-left px-4 py-2 text-red-300">
            Sign Out
          </button>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
};
