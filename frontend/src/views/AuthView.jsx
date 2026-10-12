import React, { useState } from 'react';
import { api, setAuthToken } from '../services/api';

export default function AuthView({ onLoginSuccess, showToast }) {
  const [tab, setTab] = useState('login'); // 'login' or 'register'
  const [loading, setLoading] = useState(false);

  // Login inputs
  const [loginUsername, setLoginUsername] = useState('admin@beeclub.com');
  const [loginPassword, setLoginPassword] = useState('Password123!');

  // Register inputs
  const [regName, setRegName] = useState('');
  const [regStudentId, setRegStudentId] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.login(loginUsername, loginPassword);
      setAuthToken(res.data.accessToken);
      showToast(`Chào mừng trở lại, ${res.data.user.full_name}!`, 'success');
      onLoginSuccess(res.data.user);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!regName || !regEmail || !regPassword) {
      showToast('Vui lòng điền đủ họ tên, email và mật khẩu!', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await api.register({
        fullName: regName,
        email: regEmail,
        studentId: regStudentId || null,
        password: regPassword
      });
      setAuthToken(res.data.accessToken);
      showToast('Đăng ký tài khoản thành công! Chào mừng bạn gia nhập hive!', 'success');
      onLoginSuccess(res.data.user);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '440px', padding: '36px' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>🐝</div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#FFF' }}>BEECLUB PORTAL</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Nền tảng Quản lý Sự kiện & Hội viên Hive
          </p>
        </div>

        <div className="filter-tabs" style={{ marginBottom: '24px' }}>
          <button
            className={`filter-tab ${tab === 'login' ? 'active' : ''}`}
            style={{ flex: 1 }}
            onClick={() => setTab('login')}
          >
            Đăng nhập
          </button>
          <button
            className={`filter-tab ${tab === 'register' ? 'active' : ''}`}
            style={{ flex: 1 }}
            onClick={() => setTab('register')}
          >
            Đăng ký
          </button>
        </div>

        {tab === 'login' ? (
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label">Email hoặc Mã số SV / Hive ID</label>
              <input
                type="text"
                className="form-input"
                placeholder="admin@beeclub.com hoặc MSSV"
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Mật khẩu</label>
              <input
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary btn-block"
              style={{ marginTop: '10px' }}
              disabled={loading}
            >
              {loading ? 'Đang xử lý...' : 'XÁC NHẬN ĐĂNG NHẬP'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister}>
            <div className="form-group">
              <label className="form-label">Họ và Tên</label>
              <input
                type="text"
                className="form-input"
                placeholder="Nguyễn Văn A"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Mã số sinh viên (MSSV)</label>
              <input
                type="text"
                className="form-input"
                placeholder="2026xxxx hoặc Hive ID"
                value={regStudentId}
                onChange={(e) => setRegStudentId(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-input"
                placeholder="member@beeclub.com"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Mật khẩu (Tối thiểu 6 ký tự)</label>
              <input
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary btn-block"
              style={{ marginTop: '10px' }}
              disabled={loading}
            >
              {loading ? 'Đang khởi tạo tài khoản...' : 'TẠO TÀI KHOẢN MỚI'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
