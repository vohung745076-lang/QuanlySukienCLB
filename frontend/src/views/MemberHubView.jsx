import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

export default function MemberHubView({ currentUser, showToast }) {
  const [stats, setStats] = useState({ totalMembers: 1000, activeStaff: 42, vipReservations: 128 });
  const [members, setMembers] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [categoryFilter, setCategoryFilter] = useState('All'); // 'All', 'VIP', 'Staff'
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);

  // Modal Add Member
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newStudentId, setNewStudentId] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState('user');
  const [newCategory, setNewCategory] = useState('REGULAR');

  useEffect(() => {
    fetchStats();
    fetchMembers();
  }, [categoryFilter, searchTerm, page]);

  const fetchStats = async () => {
    try {
      const res = await api.getMemberHubStats();
      setStats(res.data);
    } catch (err) {
      console.warn('Could not load member hub stats:', err.message);
    }
  };

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const res = await api.getMembers({
        search: searchTerm,
        category: categoryFilter,
        page,
        limit: 10
      });
      setMembers(res.data);
      setTotalCount(res.pagination.total);
    } catch (err) {
      showToast('Lỗi khi tải danh sách thành viên: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!newName || !newEmail) {
      showToast('Vui lòng điền họ tên và email!', 'error');
      return;
    }

    try {
      await api.addMember({
        fullName: newName,
        email: newEmail,
        studentId: newStudentId || null,
        role: newRole,
        category: newCategory,
        status: newRole === 'manager' || newRole === 'admin' ? 'on_duty' : 'active'
      });

      showToast('Đã thêm thành viên mới vào Hive!', 'success');
      setIsModalOpen(false);
      setNewName('');
      setNewStudentId('');
      setNewEmail('');
      fetchMembers();
      fetchStats();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleToggleRole = async (member) => {
    const nextRole = member.role === 'manager' ? 'user' : 'manager';
    try {
      await api.updateMemberRole(member.id, nextRole);
      showToast(`Đã chuyển vai trò của ${member.full_name} thành ${nextRole}!`, 'success');
      fetchMembers();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteMember = async (memberId) => {
    if (!confirm('Bạn có chắc chắn muốn xóa thành viên này khỏi hệ thống?')) return;
    try {
      await api.deleteMember(memberId);
      showToast('Đã xóa thành viên.', 'success');
      fetchMembers();
      fetchStats();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Oct 12, 2023';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div>
      {/* Header (Khớp Mockup PDF) */}
      <header className="view-header">
        <div>
          <div className="view-eyebrow">WIBI7903</div>
          <h1 className="view-title">Member Hub</h1>
        </div>

        <div className="filter-tabs">
          <button
            className={`filter-tab ${categoryFilter === 'All' ? 'active' : ''}`}
            onClick={() => { setCategoryFilter('All'); setPage(1); }}
          >
            All
          </button>
          <button
            className={`filter-tab ${categoryFilter === 'VIP' ? 'active' : ''}`}
            onClick={() => { setCategoryFilter('VIP'); setPage(1); }}
          >
            VIP
          </button>
          <button
            className={`filter-tab ${categoryFilter === 'Staff' ? 'active' : ''}`}
            onClick={() => { setCategoryFilter('Staff'); setPage(1); }}
          >
            Staff
          </button>
        </div>
      </header>

      {/* Stats Cards (Khớp Mockup PDF) */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-title">TOTAL HIVE MEMBERS</div>
          <div className="stat-card-value">{stats.totalMembers?.toLocaleString() || '1,000'}</div>
          <div className="stat-card-meta success">↗ 12% INCREASE THIS MONTH</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-title">ACTIVE STAFF</div>
          <div className="stat-card-value">{stats.activeStaff || '42'}</div>
          <div className="stat-card-meta success">⚡ 98% ONLINE NOW</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-title">VIP RESERVATIONS</div>
          <div className="stat-card-value">{stats.vipReservations || '128'}</div>
          <div className="stat-card-meta warning">☆ FULLY BOOKED TONIGHT</div>
        </div>
      </div>

      {/* Action Bar (Search, Filters, Add Member) */}
      <div className="action-bar">
        <div className="search-input-wrap">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="search-input"
            placeholder="Search by name, email or hive ID..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
          />
        </div>

        <button className="btn btn-outline" onClick={() => fetchMembers()}>
          <span>⚙</span> Filters
        </button>

        {currentUser.role === 'admin' && (
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>+</span> ADD MEMBER
          </button>
        )}
      </div>

      {/* Data Table (Khớp Mockup PDF) */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>MEMBER</th>
              <th>STATUS</th>
              <th>CATEGORY</th>
              <th>JOINED</th>
              <th style={{ textAlign: 'right' }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  Đang tải dữ liệu hội viên từ Database...
                </td>
              </tr>
            ) : members.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  Không tìm thấy thành viên nào phù hợp.
                </td>
              </tr>
            ) : (
              members.map((m) => {
                const isOnline = m.status === 'on_duty';
                const isCheckedIn = m.status === 'active';
                const isVIP = m.category === 'VIP';
                const isStaff = m.category === 'STAFF' || m.role === 'manager' || m.role === 'admin';

                return (
                  <tr key={m.id}>
                    <td>
                      <div className="member-cell">
                        <div className="member-avatar">
                          {m.full_name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="member-name">{m.full_name}</div>
                          <div className="member-email">{m.email}</div>
                        </div>
                      </div>
                    </td>

                    <td>
                      <div className="status-pill">
                        <span
                          className={`status-dot ${
                            isOnline ? 'yellow' : isCheckedIn ? 'green' : 'gray'
                          }`}
                        />
                        <span style={{ color: isOnline ? 'var(--brand-gold)' : isCheckedIn ? '#10B981' : 'var(--text-muted)' }}>
                          {isOnline ? 'ON DUTY' : isCheckedIn ? 'CHECKED IN' : 'INACTIVE'}
                        </span>
                      </div>
                    </td>

                    <td>
                      <span
                        className={`cat-badge ${
                          isVIP ? 'vip' : isStaff ? 'staff' : 'regular'
                        }`}
                      >
                        {m.category || (isStaff ? 'STAFF' : 'REGULAR')}
                      </span>
                    </td>

                    <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      {formatDate(m.created_at)}
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      {currentUser.role === 'admin' && m.id !== currentUser.id && (
                        <div style={{ display: 'inline-flex', gap: '8px' }}>
                          <button
                            className="btn btn-outline btn-sm"
                            onClick={() => handleToggleRole(m)}
                            title="Chuyển đổi quyền Staff / User"
                          >
                            {m.role === 'manager' ? 'Demote' : 'Set Staff'}
                          </button>
                          <button
                            className="btn btn-outline btn-sm"
                            style={{ color: 'var(--color-error)' }}
                            onClick={() => handleDeleteMember(m.id)}
                            title="Xóa thành viên"
                          >
                            🗑
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer (Khớp Mockup PDF) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
        <span>Showing 1-{members.length} of {totalCount || 1000} records</span>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            className="btn btn-outline btn-sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            &lt;
          </button>
          <button className="btn btn-primary btn-sm">{page}</button>
          <button
            className="btn btn-outline btn-sm"
            onClick={() => setPage((p) => p + 1)}
          >
            &gt;
          </button>
        </div>
      </div>

      {/* Modal Add Member */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>+ THÊM THÀNH VIÊN MỚI</h3>
              <button
                style={{ background: 'none', border: 'none', color: '#FFF', fontSize: '1.4rem', cursor: 'pointer' }}
                onClick={() => setIsModalOpen(false)}
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleAddMember}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Họ và Tên</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Marcus Reed"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="m.reed@gmail.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">MSSV / Hive ID</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="VIP-003 hoặc 2026xxxx"
                    value={newStudentId}
                    onChange={(e) => setNewStudentId(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Hạng Thành Viên (Category)</label>
                  <select
                    className="form-select"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                  >
                    <option value="REGULAR">REGULAR</option>
                    <option value="VIP">VIP</option>
                    <option value="STAFF">STAFF</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Vai trò hệ thống (Role)</label>
                  <select
                    className="form-select"
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                  >
                    <option value="user">Thành viên (Member)</option>
                    <option value="manager">Ban điều hành (Staff/Manager)</option>
                    <option value="admin">Quản trị viên (Admin)</option>
                  </select>
                </div>
              </div>
              <div style={{ padding: '0 24px 24px 24px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary">
                  Lưu Thành Viên
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
