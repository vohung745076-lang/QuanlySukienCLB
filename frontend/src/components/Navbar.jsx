import React from 'react';

export default function Navbar({
  currentView,
  setCurrentView,
  currentUser,
  effectiveRole,
  onToggleViewRole,
  onLogout
}) {
  if (!currentUser) return null;

  const isAdmin = effectiveRole === 'admin';

  return (
    <header className="navbar">
      <div
        className="nav-brand"
        onClick={() => setCurrentView(isAdmin ? 'dashboard' : 'events')}
        style={{ cursor: 'pointer' }}
      >
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

        {isAdmin && (
          <>
            <button
              className={`nav-link ${currentView === 'dashboard' ? 'active' : ''}`}
              onClick={() => setCurrentView('dashboard')}
            >
              ANALYTICS
            </button>

            <button
              className={`nav-link ${currentView === 'members' ? 'active' : ''}`}
              onClick={() => setCurrentView('members')}
            >
              MEMBER HUB
            </button>

            <button
              className={`nav-link ${currentView === 'checkin' ? 'active' : ''}`}
              onClick={() => setCurrentView('checkin')}
            >
              CHECK-IN
            </button>
          </>
        )}

        <button
          className={`nav-link ${currentView === 'my-tickets' ? 'active' : ''}`}
          onClick={() => setCurrentView('my-tickets')}
        >
          MY TICKETS
        </button>
      </nav>

      <div className="nav-user" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {/* Quick View Role Switcher for Admin */}
        {currentUser.role === 'admin' && (
          <button
            className="btn btn-outline btn-sm"
            onClick={onToggleViewRole}
            style={{
              padding: '4px 10px',
              fontSize: '0.78rem',
              fontWeight: 600,
              borderRadius: '20px',
              borderColor: isAdmin ? 'var(--brand-gold)' : 'rgba(255, 255, 255, 0.25)',
              color: isAdmin ? 'var(--brand-gold)' : '#ffffff',
              background: isAdmin ? 'rgba(245, 166, 35, 0.12)' : 'rgba(255, 255, 255, 0.06)'
            }}
            title="Bấm để chuyển đổi nhanh qua lại giữa giao diện Admin và User"
          >
            {isAdmin ? '👑 Xem chế độ: ADMIN' : '👤 Xem chế độ: USER'} ⮂
          </button>
        )}

        <div className="nav-avatar">
          {currentUser.full_name?.charAt(0).toUpperCase() || 'U'}
        </div>
        <div className="nav-user-details">
          <span className="nav-user-name">{currentUser.full_name}</span>
          <span
            className="nav-user-role"
            style={{
              color: currentUser.role === 'admin' ? 'var(--brand-gold)' : 'var(--text-muted)',
              fontWeight: currentUser.role === 'admin' ? 700 : 400
            }}
          >
            {currentUser.role === 'admin' ? 'ADMIN' : 'USER'}
          </span>
        </div>
        <button className="btn btn-outline btn-sm" onClick={onLogout} style={{ marginLeft: 6 }}>
          Đăng xuất
        </button>
      </div>
    </header>
  );
}
