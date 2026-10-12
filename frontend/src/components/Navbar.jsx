import React from 'react';

export default function Navbar({ currentView, setCurrentView, currentUser, onLogout }) {
  if (!currentUser) return null;

  const role = currentUser.role || 'user';
  const isAdmin = role === 'admin';
  const isManager = role === 'manager' || isAdmin;

  return (
    <header className="navbar">
      <div className="nav-brand">
        <span className="nav-brand-icon">🐝</span>
        <span>BEECLUB</span>
      </div>

      <nav className="nav-links">
        {/* Navigation items adapted per user role */}
        <button
          className={`nav-link ${currentView === 'events' ? 'active' : ''}`}
          onClick={() => setCurrentView('events')}
        >
          EVENTS
        </button>

        {isManager && (
          <button
            className={`nav-link ${currentView === 'dashboard' ? 'active' : ''}`}
            onClick={() => setCurrentView('dashboard')}
          >
            ANALYTICS
          </button>
        )}

        {isAdmin && (
          <button
            className={`nav-link ${currentView === 'members' ? 'active' : ''}`}
            onClick={() => setCurrentView('members')}
          >
            STAFF (HUB)
          </button>
        )}

        {isManager && (
          <button
            className={`nav-link ${currentView === 'checkin' ? 'active' : ''}`}
            onClick={() => setCurrentView('checkin')}
          >
            CHECK-IN
          </button>
        )}

        <button
          className={`nav-link ${currentView === 'my-tickets' ? 'active' : ''}`}
          onClick={() => setCurrentView('my-tickets')}
        >
          MY TICKETS
        </button>
      </nav>

      <div className="nav-user">
        <div className="nav-avatar">
          {currentUser.full_name?.charAt(0).toUpperCase() || 'U'}
        </div>
        <div className="nav-user-details">
          <span className="nav-user-name">{currentUser.full_name}</span>
          <span className="nav-user-role">{currentUser.category || currentUser.role}</span>
        </div>
        <button className="btn btn-outline btn-sm" onClick={onLogout} style={{ marginLeft: 10 }}>
          Đăng xuất
        </button>
      </div>
    </header>
  );
}
