import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import AuthView from './views/AuthView';
import MemberHubView from './views/MemberHubView';
import DashboardView from './views/DashboardView';
import CheckinView from './views/CheckinView';
import ExploreView from './views/ExploreView';
import MyTicketsView from './views/MyTicketsView';
import { api, setAuthToken, getAuthToken } from './services/api';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentView, setCurrentView] = useState('events'); // 'events', 'dashboard', 'members', 'checkin', 'my-tickets'
  const [isInitializing, setIsInitializing] = useState(true);
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    const token = getAuthToken();
    if (!token) {
      setIsInitializing(false);
      return;
    }

    try {
      const res = await api.getMe();
      setCurrentUser(res.data);
      // Set default view based on role
      if (res.data.role === 'admin' || res.data.role === 'manager') {
        setCurrentView('dashboard');
      } else {
        setCurrentView('events');
      }
    } catch (err) {
      console.warn('Session verification failed, logging out:', err.message);
      setAuthToken(null);
      setCurrentUser(null);
    } finally {
      setIsInitializing(false);
    }
  };

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    if (user.role === 'admin' || user.role === 'manager') {
      setCurrentView('dashboard');
    } else {
      setCurrentView('events');
    }
  };

  const handleLogout = () => {
    setAuthToken(null);
    setCurrentUser(null);
    setCurrentView('events');
    showToast('Đã đăng xuất khỏi hệ thống.');
  };

  if (isInitializing) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'var(--brand-gold)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', animation: 'spin 1.5s infinite linear' }}>🐝</div>
          <p style={{ marginTop: '12px', fontWeight: 600 }}>Đang khởi tạo BEECLUB Portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Toast Notification Stack */}
      <div className="toast-box">
        {toasts.map((t) => (
          <div key={t.id} className={`toast-item ${t.type}`}>
            {t.message}
          </div>
        ))}
      </div>

      {/* Top Navbar */}
      {currentUser && (
        <Navbar
          currentView={currentView}
          setCurrentView={setCurrentView}
          currentUser={currentUser}
          onLogout={handleLogout}
        />
      )}

      {/* Main View Router */}
      <main className="main-content">
        {!currentUser ? (
          <AuthView onLoginSuccess={handleLoginSuccess} showToast={showToast} />
        ) : currentView === 'members' ? (
          <MemberHubView currentUser={currentUser} showToast={showToast} />
        ) : currentView === 'dashboard' ? (
          <DashboardView currentUser={currentUser} showToast={showToast} />
        ) : currentView === 'checkin' ? (
          <CheckinView currentUser={currentUser} showToast={showToast} />
        ) : currentView === 'my-tickets' ? (
          <MyTicketsView currentUser={currentUser} setCurrentView={setCurrentView} showToast={showToast} />
        ) : (
          <ExploreView currentUser={currentUser} setCurrentView={setCurrentView} showToast={showToast} />
        )}
      </main>
    </div>
  );
}
