import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

export default function DashboardView({ currentUser, showToast }) {
  const [stats, setStats] = useState({ totalEvents: 0, totalRegistrations: 0, totalCheckins: 0, fillRate: 0 });
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [capacity, setCapacity] = useState(1000);
  const [benefits, setBenefits] = useState('');
  const [sponsors, setSponsors] = useState('');

  useEffect(() => {
    fetchStats();
    fetchEvents();
  }, [statusFilter, searchTerm]);

  const fetchStats = async () => {
    try {
      const res = await api.getDashboardStats();
      setStats(res.data);
    } catch (err) {
      console.warn('Could not load dashboard stats:', err.message);
    }
  };

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await api.getEvents({
        search: searchTerm,
        status: statusFilter
      });
      setEvents(res.data);
    } catch (err) {
      showToast('Lỗi khi tải danh sách sự kiện: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingEventId(null);
    setTitle('');
    setDescription('');
    setLocation('');
    setStartTime('');
    setEndTime('');
    setCapacity(1000);
    setBenefits('');
    setSponsors('');
    setIsModalOpen(true);
  };

  const openEditModal = (evt) => {
    setEditingEventId(evt.id);
    setTitle(evt.title);
    setDescription(evt.description || '');
    setLocation(evt.location);
    setStartTime(evt.start_time ? evt.start_time.slice(0, 16) : '');
    setEndTime(evt.end_time ? evt.end_time.slice(0, 16) : '');
    setCapacity(evt.capacity);
    setBenefits(evt.benefits || '');
    setSponsors(evt.sponsors || '');
    setIsModalOpen(true);
  };

  const handleSaveEvent = async (e) => {
    e.preventDefault();
    if (!title || !location || !startTime || !endTime) {
      showToast('Vui lòng điền đủ tiêu đề, địa điểm và thời gian!', 'error');
      return;
    }

    try {
      const payload = {
        title,
        description,
        location,
        startTime,
        endTime,
        capacity: parseInt(capacity, 10),
        benefits,
        sponsors
      };

      if (editingEventId) {
        await api.updateEvent(editingEventId, payload);
        showToast('Cập nhật sự kiện thành công!', 'success');
      } else {
        await api.createEvent(payload);
        showToast('Tạo sự kiện mới thành công!', 'success');
      }

      setIsModalOpen(false);
      fetchEvents();
      fetchStats();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteEvent = async (id) => {
    if (!confirm('Bạn có chắc chắn muốn xóa sự kiện này? Toàn bộ vé liên quan cũng sẽ bị xóa!')) return;
    try {
      await api.deleteEvent(id);
      showToast('Đã xóa sự kiện thành công!', 'success');
      fetchEvents();
      fetchStats();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleDownloadExcel = () => {
    const url = api.getExcelDownloadUrl();
    window.open(url, '_blank');
    showToast('Đang tạo và tải file Excel đăng ký...', 'success');
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
          <div className="view-eyebrow">Operations Dashboard</div>
          <h1 className="view-title">Tổng quan sự kiện</h1>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-outline" onClick={handleDownloadExcel}>
            📥 Xuất dữ liệu SV (Excel)
          </button>
          <button className="btn btn-primary" onClick={openCreateModal}>
            + Tạo sự kiện mới
          </button>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-title">Tổng sự kiện</div>
          <div className="stat-card-value">{stats.totalEvents}</div>
          <div className="stat-card-meta success">Đang điều phối trên toàn hệ thống</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-title">Lượt đăng ký</div>
          <div className="stat-card-value">{stats.totalRegistrations.toLocaleString()}</div>
          <div className="stat-card-meta warning">Thành viên đã giữ chỗ</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-title">Đã check-in</div>
          <div className="stat-card-value">{stats.totalCheckins.toLocaleString()}</div>
          <div className="stat-card-meta success">Có mặt thực tế tại hội trường</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-title">Tỷ lệ lấp đầy</div>
          <div className="stat-card-value">{stats.fillRate}%</div>
          <div className="stat-card-meta">So với tổng sức chứa</div>
        </div>
      </div>

      {/* Filter Tabs and Search Bar */}
      <div className="action-bar">
        <div className="search-input-wrap">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="search-input"
            placeholder="Tìm theo tên sự kiện, mã sự kiện hoặc địa điểm..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-tabs">
          {['all', 'upcoming', 'live', 'completed'].map((tab) => (
            <button
              key={tab}
              className={`filter-tab ${statusFilter === tab ? 'active' : ''}`}
              onClick={() => setStatusFilter(tab)}
            >
              {tab === 'all' ? 'Tất cả' : tab === 'upcoming' ? 'Sắp tới' : tab === 'live' ? 'Đang mở' : 'Đã xong'}
            </button>
          ))}
        </div>
      </div>

      {/* Events Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>MÃ / TÊN SỰ KIỆN</th>
              <th>THỜI GIAN</th>
              <th>ĐỊA ĐIỂM</th>
              <th>LƯỢNG ĐĂNG KÝ</th>
              <th>CHECK-IN</th>
              <th style={{ textAlign: 'right' }}>HÀNH ĐỘNG</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  Đang tải danh sách sự kiện...
                </td>
              </tr>
            ) : events.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  Không có sự kiện nào. Hãy nhấn "+ Tạo sự kiện mới" để bắt đầu!
                </td>
              </tr>
            ) : (
              events.map((evt) => {
                const occupancy = evt.capacity > 0 ? Math.round((evt.registered_count / evt.capacity) * 100) : 0;
                return (
                  <tr key={evt.id}>
                    <td>
                      <div style={{ fontWeight: 700, color: '#FFFFFF' }}>{evt.title}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--brand-gold)' }}>{evt.code}</div>
                    </td>

                    <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      <div>🕒 Bắt đầu: {formatDate(evt.start_time)}</div>
                      <div>🏁 Kết thúc: {formatDate(evt.end_time)}</div>
                    </td>

                    <td>📍 {evt.location}</td>

                    <td>
                      <div style={{ fontWeight: 600 }}>
                        {evt.registered_count} / {evt.capacity} vé
                      </div>
                      <div style={{ fontSize: '0.75rem', color: occupancy >= 100 ? 'var(--color-error)' : 'var(--text-muted)' }}>
                        {occupancy}% sức chứa
                      </div>
                    </td>

                    <td>
                      <span className="cat-badge staff">
                        {evt.checkin_count} người
                      </span>
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '8px' }}>
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => openEditModal(evt)}
                        >
                          Sửa
                        </button>
                        {currentUser.role === 'admin' && (
                          <button
                            className="btn btn-outline btn-sm"
                            style={{ color: 'var(--color-error)' }}
                            onClick={() => handleDeleteEvent(evt.id)}
                          >
                            Xóa
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal: Tạo / Chỉnh sửa sự kiện */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-card" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>
                {editingEventId ? 'CHỈNH SỬA SỰ KIỆN' : '+ TẠO SỰ KIỆN MỚI'}
              </h3>
              <button
                style={{ background: 'none', border: 'none', color: '#FFF', fontSize: '1.4rem', cursor: 'pointer' }}
                onClick={() => setIsModalOpen(false)}
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleSaveEvent}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Tên Sự Kiện</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Đại hội thường niên, Workshop AI..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">Bắt đầu</label>
                    <input
                      type="datetime-local"
                      className="form-input"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Kết thúc</label>
                    <input
                      type="datetime-local"
                      className="form-input"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">Địa Điểm</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Hội trường A, Nhà hàng..."
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Sức Chứa Tối Đa (Vé)</label>
                    <input
                      type="number"
                      className="form-input"
                      value={capacity}
                      onChange={(e) => setCapacity(e.target.value)}
                      min="1"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Mô tả chi tiết</label>
                  <textarea
                    className="form-textarea"
                    rows="3"
                    placeholder="Mô tả nội dung sự kiện..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Quyền Lợi Tham Gia</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ví dụ: Giấy chứng nhận, Cộng ĐRL, Quà tặng..."
                    value={benefits}
                    onChange={(e) => setBenefits(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Nhà Tài Trợ</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ví dụ: Google, VNPT, FPT..."
                    value={sponsors}
                    onChange={(e) => setSponsors(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ padding: '0 24px 24px 24px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingEventId ? 'Lưu Thay Đổi' : 'Tạo Sự Kiện'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
