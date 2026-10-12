import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

export default function MyTicketsView({ currentUser, setCurrentView, showToast }) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyTickets();
  }, []);

  const fetchMyTickets = async () => {
    setLoading(true);
    try {
      const res = await api.getMyTickets();
      setTickets(res.data);
    } catch (err) {
      showToast('Lỗi khi tải danh sách vé: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '---';
    return new Date(dateStr).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div>
      <header className="view-header">
        <div>
          <div className="view-eyebrow">Digital Pass</div>
          <h1 className="view-title">Vé của Tôi</h1>
        </div>
      </header>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
          Đang tải vé điện tử...
        </div>
      ) : tickets.length === 0 ? (
        <div className="glass-panel" style={{ padding: '60px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🎟️</div>
          <h3 style={{ fontSize: '1.3rem', marginBottom: '8px' }}>Bạn chưa đăng ký vé sự kiện nào</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
            Khám phá ngay các sự kiện nổi bật của BEECLUB để tham gia và nhận quyền lợi!
          </p>
          <button className="btn btn-primary" onClick={() => setCurrentView('events')}>
            Khám Phá Sự Kiện →
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '24px' }}>
          {tickets.map((t) => {
            const isValid = t.status === 'valid';
            return (
              <div
                key={t.id}
                className="glass-panel"
                style={{
                  padding: '24px',
                  borderTop: `4px solid ${isValid ? 'var(--brand-gold)' : 'var(--color-success)'}`,
                  position: 'relative'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <span
                    className="cat-badge"
                    style={{
                      borderColor: isValid ? 'var(--brand-gold)' : 'var(--color-success)',
                      color: isValid ? 'var(--brand-gold)' : 'var(--color-success)'
                    }}
                  >
                    {isValid ? 'HỢP LỆ' : 'ĐÃ ĐIỂM DANH'}
                  </span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {t.event?.code}
                  </span>
                </div>

                {/* Simulated QR Code Box */}
                <div
                  style={{
                    background: '#FFFFFF',
                    padding: '16px',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    marginBottom: '18px'
                  }}
                >
                  {/* SVG QR Code Simulation */}
                  <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
                    <rect width="120" height="120" fill="white" />
                    <rect x="10" y="10" width="30" height="30" fill="black" />
                    <rect x="16" y="16" width="18" height="18" fill="white" />
                    <rect x="20" y="20" width="10" height="10" fill="black" />

                    <rect x="80" y="10" width="30" height="30" fill="black" />
                    <rect x="86" y="16" width="18" height="18" fill="white" />
                    <rect x="90" y="20" width="10" height="10" fill="black" />

                    <rect x="10" y="80" width="30" height="30" fill="black" />
                    <rect x="16" y="86" width="18" height="18" fill="white" />
                    <rect x="20" y="90" width="10" height="10" fill="black" />

                    <circle cx="60" cy="60" r="14" fill="#E0245E" />
                    <rect x="50" y="20" width="8" height="8" fill="black" />
                    <rect x="70" y="70" width="8" height="8" fill="black" />
                    <rect x="90" y="90" width="12" height="12" fill="black" />
                  </svg>
                  <div
                    style={{
                      fontFamily: 'monospace',
                      fontWeight: 800,
                      color: '#000000',
                      letterSpacing: '1px',
                      marginTop: '8px',
                      fontSize: '0.9rem'
                    }}
                  >
                    {t.ticketCode}
                  </div>
                </div>

                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#FFFFFF', marginBottom: '10px' }}>
                  {t.event?.title}
                </h3>

                <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                  <div>📍 <strong>Địa điểm:</strong> {t.event?.location}</div>
                  <div>🕒 <strong>Bắt đầu:</strong> {formatDate(t.event?.startTime)}</div>
                  <div>👤 <strong>Họ tên:</strong> {t.participantName}</div>
                  <div>🎓 <strong>MSSV:</strong> {t.participantMssv}</div>
                  {t.event?.benefits && (
                    <div style={{ color: 'var(--brand-gold)', marginTop: '6px' }}>
                      🎁 {t.event?.benefits}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
