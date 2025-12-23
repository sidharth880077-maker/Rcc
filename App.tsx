
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { User, UserRole } from './types';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Attendance from './pages/Attendance';
import Tests from './pages/Tests';
import Payments from './pages/Payments';
import StudentManagement from './pages/StudentManagement';
import Messages from './pages/Messages';
import Calendar from './pages/Calendar';
import { Layout } from './components/Layout';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('rcc_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
    localStorage.setItem('rcc_user', JSON.stringify(loggedInUser));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('rcc_user');
  };

  return (
    <HashRouter>
      <Routes>
        <Route 
          path="/login" 
          element={user ? <Navigate to="/" replace /> : <Login onLogin={handleLogin} />} 
        />
        
        <Route 
          path="/" 
          element={user ? <Layout user={user} onLogout={handleLogout}><Dashboard user={user} /></Layout> : <Navigate to="/login" replace />} 
        />
        
        <Route 
          path="/attendance" 
          element={user ? <Layout user={user} onLogout={handleLogout}><Attendance user={user} /></Layout> : <Navigate to="/login" replace />} 
        />
        
        <Route 
          path="/tests" 
          element={user ? <Layout user={user} onLogout={handleLogout}><Tests user={user} /></Layout> : <Navigate to="/login" replace />} 
        />
        
        <Route 
          path="/payments" 
          element={user ? <Layout user={user} onLogout={handleLogout}><Payments user={user} /></Layout> : <Navigate to="/login" replace />} 
        />

        <Route 
          path="/students" 
          element={user?.role === UserRole.TEACHER ? <Layout user={user} onLogout={handleLogout}><StudentManagement user={user} /></Layout> : <Navigate to="/" replace />} 
        />

        <Route 
          path="/messages" 
          element={user ? <Layout user={user} onLogout={handleLogout}><Messages user={user} /></Layout> : <Navigate to="/login" replace />} 
        />

        <Route 
          path="/calendar" 
          element={user ? <Layout user={user} onLogout={handleLogout}><Calendar user={user} /></Layout> : <Navigate to="/login" replace />} 
        />
      </Routes>
    </HashRouter>
  );
};

export default App;
