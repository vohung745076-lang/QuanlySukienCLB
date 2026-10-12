import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

export default function ExploreView({ currentUser, setCurrentView, showToast }) {
  const [events, setEvents] = useState([]);
  const [myTickets, setMyTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Register Modal State
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [regName, setRegName] = useState('');
  const [regStudentId, setRegStudentId] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, [searchTerm]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [eventsRes, ticketsRes] = await Promise.all([
        api.getEvents({ search: searchTerm, limit: 30 }),
        api.getMyTickets().catch(() => ({ data: [] }))
      ]);

      setEvents(eventsRes.data);
      setMyTickets(ticketsRes.data || []);
    } catch (err) {
      showToast('Lỗi khi tải danh sách sự kiện: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const openRegisterModal = (evt) => {
    setSelectedEvent(evt);
    setRegName(currentUser.full_name || '');
    setRegStudentId(currentUser.student_id || '');
    setRegEmail(currentUser.email || '');
  };

  const handleBookTicket = async (e) => {
    e.preventDefault();
    if (!selectedEvent) return;

    setIsSubmitting(true);
    try {
      const res = await api.bookTicket({
        eventId: selectedEvent.id,
        fullName: regName,
        studentId: regStudentId,
        email: regEmail
      });

      showToast(`Đăng ký thành công! 🎉 Mã vé: ${res.data.ticket_code}`, 'success');
      setSelectedEvent(null);
      fetchData();
      setCurrentView('my-tickets');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const registeredEventIds = new Set(myTickets.map((t) => t.event?.id));

  const formatDate = (dateStr) => {
    if (!dateStr) return '---';
    return new Date(dateStr).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div>
      <header className="view-header">
        <div>
          <div className="view-eyebrow">Discover Events</div>
          <h1 className="view-title">Khám phá Sự kiện</h1>
        </div>
      </header>

      <div className="action-bar">
        <div className="search-input-wrap">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="search-input"
            placeholder="Tìm kiếm sự kiện bạn quan tâm..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
          Đang tải dữ liệu sự kiện...
        </div>
      ) : events.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
          Không tìm thấy sự kiện nào phù hợp.
        </div>
      ) : (
        <div className="events-grid">
          {events.map((evt) => {
            const isRegistered = registeredEventIds.has(evt.id);
            const isFull = evt.registered_count >= evt.capacity;

            return (
              <div key={evt.id} className="event-card">
                <div className="event-card-header">
                  <span className="event-date-badge">
                    🗓 {formatDate(evt.start_time)}
                  </span>
                  <span className="cat-badge vip">{evt.code}</span>
                </div>

                <div className="event-card-body">
                  <h3 className="event-card-title">{evt.title}</h3>

                  <div className="event-card-meta">
                    <span>📍 {evt.location}</span>
                    <span>👥 {evt.registered_count}/{evt.capacity} vé</span>
                  </div>

                  <p className="event-card-desc">{evt.description}</p>

                  {evt.benefits && (
                    <div style={{ fontSize: '0.82rem', color: 'var(--brand-gold)', marginBottom: '8px' }}>
                      🎁 <strong>Quyền lợi:</strong> {evt.benefits}
                    </div>
                  )}

                  {evt.sponsors && (
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                      🤝 <strong>Tài trợ:</strong> {evt.sponsors}
                    </div>
                  )}

                  {isRegistered ? (
                    <button className="btn btn-outline btn-block" disabled>
                      ✅ Đã Đăng Ký
                    </button>
                  ) : isFull ? (
                    <button className="btn btn-outline btn-block" disabled>
                      🚫 Đã Hết Vé
                    </button>
                  ) : (
                    <button
                      className="btn btn-primary btn-block"
                      onClick={() => openRegisterModal(evt)}
                    >
                      Đăng Ký Tham Gia
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Đăng Ký Vé */}
      {selectedEvent && (
        <div className="modal-overlay" onClick={() => setSelectedEvent(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>
                ĐĂNG KÝ: <span style={{ color: 'var(--brand-gold)' }}>{selectedEvent.title}</span>
              </h3>
              <button
                style={{ background: 'none', border: 'none', color: '#FFF', fontSize: '1.4rem', cursor: 'pointer' }}
                onClick={() => setSelectedEvent(null)}
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleBookTicket}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Họ và Tên</label>
                  <input
                    type="text"
                    className="form-input"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Mã số sinh viên (MSSV) / Hive ID</label>
                  <input
                    type="text"
                    className="form-input"
                    value={regStudentId}
                    onChange={(e) => setRegStudentId(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email nhận vé</label>
                  <input
                    type="email"
                    className="form-input"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div style={{ padding: '0 24px 24px 24px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-outline" onClick={() => setSelectedEvent(null)}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Đang xuất vé...' : 'Xác Nhận Nhận Vé'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
