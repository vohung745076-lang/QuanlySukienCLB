import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

export default function CheckinView({ currentUser, showToast }) {
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [ticketInput, setTicketInput] = useState('');
  const [checkinResult, setCheckinResult] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (selectedEventId) {
      fetchLogs();
    }
  }, [selectedEventId]);

  const fetchEvents = async () => {
    try {
      const res = await api.getEvents({ limit: 50 });
      setEvents(res.data);
      if (res.data.length > 0) {
        setSelectedEventId(res.data[0].id);
      }
    } catch (err) {
      console.warn('Could not load events for check-in:', err.message);
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await api.getCheckinLogs({ eventId: selectedEventId, limit: 30 });
      setLogs(res.data);
    } catch (err) {
      console.warn('Could not load check-in logs:', err.message);
    }
  };

  const handleDoCheckin = async (e) => {
    if (e) e.preventDefault();
    if (!selectedEventId) {
      showToast('Vui lòng chọn sự kiện trước!', 'error');
      return;
    }
    if (!ticketInput.trim()) return;

    setLoading(true);
    try {
      const res = await api.checkin({
        eventId: selectedEventId,
        code: ticketInput.trim()
      });

      setCheckinResult(res.data);
      if (res.data.success) {
        if (res.data.alreadyUsed) {
          showToast('Cảnh báo: Vé đã được điểm danh trước đó!', 'error');
        } else {
          showToast(res.data.message || 'Check-in thành công!', 'success');
        }
      } else {
        showToast(res.data.message, 'error');
      }

      setTicketInput('');
      fetchLogs();
    } catch (err) {
      setCheckinResult({
        success: false,
        message: err.message
      });
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleClearLogs = async () => {
    if (!confirm('Bạn có muốn làm sạch nhật ký hiển thị của sự kiện này?')) return;
    try {
      await api.clearCheckinLogs({ eventId: selectedEventId });
      showToast('Đã xóa nhật ký check-in', 'success');
      fetchLogs();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const formatLogTime = (timeStr) => {
    if (!timeStr) return '';
    return new Date(timeStr).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div>
      <header className="view-header">
        <div>
          <div className="view-eyebrow">Realtime Operations</div>
          <h1 className="view-title">Hệ thống Check-in</h1>
        </div>

        <div>
          <select
            className="form-select"
            style={{ minWidth: '280px' }}
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
          >
            {events.map((e) => (
              <option key={e.id} value={e.id}>
                {e.title} ({e.code})
              </option>
            ))}
          </select>
        </div>
      </header>

      <div className="checkin-shell">
        {/* Left Column: Scanner & Input */}
        <div>
          <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
            <div className="scanner-box" style={{ marginBottom: '24px' }}>
              <div className="scanner-beam" />
              <div style={{ fontSize: '3rem', marginBottom: '10px' }}>📷</div>
              <div style={{ fontWeight: 600, color: 'var(--brand-gold)' }}>
                Sẵn sàng quét mã QR / Barcode
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Hỗ trợ máy quét quang học cầm tay hoặc camera trực tiếp
              </p>
            </div>

            <form onSubmit={handleDoCheckin}>
              <div className="form-group">
                <label className="form-label">Nhập mã vé thủ công hoặc MSSV / Hive ID</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Vd: BEE-EVT01-0001 hoặc VIP-001, 20240101"
                    value={ticketInput}
                    onChange={(e) => setTicketInput(e.target.value)}
                    autoFocus
                  />
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? '...' : 'Xác nhận'}
                  </button>
                </div>
              </div>
            </form>

            {/* Result Box */}
            {checkinResult && (
              <div
                className={`checkin-result-alert ${
                  checkinResult.success && !checkinResult.alreadyUsed
                    ? 'success'
                    : 'error'
                }`}
              >
                <div style={{ fontSize: '1.1rem', marginBottom: '4px' }}>
                  {checkinResult.message}
                </div>
                {checkinResult.ticket && (
                  <div style={{ fontSize: '0.85rem', color: '#FFF', marginTop: '8px', lineHeight: 1.6 }}>
                    <div><strong>Họ và Tên:</strong> {checkinResult.ticket.participantName}</div>
                    <div><strong>Mã SV / Hive ID:</strong> {checkinResult.ticket.participantMssv} ({checkinResult.ticket.category})</div>
                    <div><strong>Mã vé:</strong> {checkinResult.ticket.ticketCode}</div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Recent Activity Logs */}
        <div>
          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Check-in Gần Đây</h3>
              <button
                className="btn btn-outline btn-sm"
                style={{ color: 'var(--color-error)' }}
                onClick={handleClearLogs}
              >
                🧹 Dọn dẹp
              </button>
            </div>

            <div style={{ maxHeight: '420px', overflowY: 'auto' }}>
              {logs.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '30px 0' }}>
                  Chưa có lịch sử check-in cho sự kiện này
                </div>
              ) : (
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {logs.map((log) => (
                    <li
                      key={log.id}
                      style={{
                        padding: '12px 14px',
                        background: '#18181D',
                        borderRadius: 'var(--radius-md)',
                        borderLeft: `4px solid ${log.is_success ? 'var(--color-success)' : 'var(--color-error)'}`,
                        fontSize: '0.85rem'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 700, color: '#FFF' }}>
                          {log.participant_name || log.input_code}
                        </span>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                          {formatLogTime(log.created_at)}
                        </span>
                      </div>
                      <div style={{ color: log.is_success ? '#A7F3D0' : '#FECACA' }}>
                        {log.result_message}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
