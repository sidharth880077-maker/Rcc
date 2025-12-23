
import React, { useState } from 'react';
import { MOCK_STUDENTS, MOCK_TEACHER } from '../constants';
import { User, UserRole } from '../types';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [activeTab, setActiveTab] = useState<UserRole>(UserRole.STUDENT);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (activeTab === UserRole.TEACHER) {
      // Teacher check - Username 'Raghubir' and Password 'SIDHARTH'
      if (identifier === MOCK_TEACHER.username && password === 'SIDHARTH') {
        onLogin(MOCK_TEACHER);
        return;
      }
      setError('Invalid teacher username or access key.');
    } else {
      // Student check - Mobile '8409313191' and Password 'Sidharth'
      const student = MOCK_STUDENTS.find(s => s.mobile === identifier);
      if (student && password === 'Sidharth') {
        onLogin(student);
        return;
      }
      setError('Invalid student mobile or access key.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-3xl shadow-2xl transition-all border border-slate-200">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white text-3xl font-bold shadow-lg mb-4">
            RCC
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900">RCC Portal</h2>
          <p className="mt-2 text-sm text-slate-500">
            Raghubir Coaching Classes
          </p>
        </div>

        {/* Tab Selection */}
        <div className="flex p-1 bg-slate-100 rounded-xl">
          <button
            onClick={() => { setActiveTab(UserRole.STUDENT); setError(''); setIdentifier(''); setPassword(''); }}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
              activeTab === UserRole.STUDENT 
                ? 'bg-white text-indigo-600 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Student Login
          </button>
          <button
            onClick={() => { setActiveTab(UserRole.TEACHER); setError(''); setIdentifier(''); setPassword(''); }}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
              activeTab === UserRole.TEACHER 
                ? 'bg-white text-indigo-600 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Teacher Login
          </button>
        </div>
        
        <form className="mt-4 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="relative">
              <label htmlFor="identifier" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 px-1">
                {activeTab === UserRole.TEACHER ? 'Username' : 'Student Mobile'}
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  {activeTab === UserRole.TEACHER ? '👤' : '📱'}
                </span>
                <input
                  id="identifier"
                  type="text"
                  required
                  className="block w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none text-slate-800"
                  placeholder={activeTab === UserRole.TEACHER ? "Enter username" : "Enter mobile number"}
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                />
              </div>
            </div>
            
            <div className="relative">
              <label htmlFor="password" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 px-1">
                Access Key
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  🔑
                </span>
                <input
                  id="password"
                  type="password"
                  required
                  className="block w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none text-slate-800"
                  placeholder="Enter your key"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 p-3 rounded-xl text-red-600 text-xs text-center font-medium animate-pulse">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="group relative w-full flex justify-center py-4 px-4 border border-transparent text-sm font-bold rounded-2xl text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all transform active:scale-[0.98] shadow-lg shadow-indigo-200"
          >
            Enter {activeTab === UserRole.TEACHER ? 'Teacher' : 'Student'} Dashboard
          </button>
        </form>

        <div className="text-center pt-2">
          <p className="text-xs text-slate-400 italic">
            Secure multi-user access portal. Contact admin for assistance.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
