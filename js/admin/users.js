/* ============================================================
   admin/users.js — Quản Lý Thành Viên & Phân Quyền BUH (Admin)
   Sử dụng RESTful API kết nối trực tiếp bảng users
   ============================================================ */

async function renderUserManagement(searchTerm = '') {
    const tbody = document.getElementById('admin-users-tbody');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:20px;color:var(--text-muted);">Đang tải danh sách thành viên BUH...</td></tr>';

    try {
        const res = await window.api.users.getAll({ search: searchTerm, limit: 50 });
        users = res.data || [];
        tbody.innerHTML = '';

        if (users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:20px;color:var(--text-muted);">Không tìm thấy tài khoản nào.</td></tr>';
            return;
        }

        users.forEach((u) => {
            const isManager = u.role === 'manager';
            const isAdmin = u.role === 'admin';

            let catBadge = `<span class="cat-badge" style="padding:3px 8px;border-radius:4px;font-size:0.75rem;border:1px solid #666;">REGULAR</span>`;
            if (isAdmin) catBadge = `<span class="cat-badge" style="color:var(--error,#e0245e);border:1px solid rgba(224,36,94,0.4);padding:3px 8px;border-radius:4px;font-size:0.75rem;">ADMIN</span>`;
            else if (isManager) catBadge = `<span class="cat-badge staff" style="color:var(--brand-gold,#f5c518);border:1px solid rgba(245,197,24,0.4);padding:3px 8px;border-radius:4px;font-size:0.75rem;">STAFF</span>`;
            else if (u.category === 'VIP') catBadge = `<span class="cat-badge vip" style="color:#9b59b6;border:1px solid rgba(155,89,182,0.4);padding:3px 8px;border-radius:4px;font-size:0.75rem;">VIP</span>`;

            let statusDot = `<span class="status-pill" style="font-size:0.8rem;color:#00b894;"><span class="status-dot" style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#00b894;margin-right:4px;"></span> ACTIVE</span>`;
            if (u.status === 'suspended') statusDot = `<span class="status-pill" style="font-size:0.8rem;color:var(--error);"><span class="status-dot" style="display:inline-block;width:8px;height:8px;border-radius:50%;background:var(--error);margin-right:4px;"></span> BLOCKED</span>`;

            const dateJoined = u.created_at ? new Date(u.created_at).toLocaleDateString('vi-VN') : '---';

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>
                    <div class="member-profile" style="display:flex;align-items:center;gap:12px;">
                        <div style="width:36px;height:36px;border-radius:50%;background:rgba(255,255,255,0.1);display:flex;align-items:center;justify-content:center;font-weight:700;color:var(--brand-gold,#f5c518);overflow:hidden;">
                            ${u.avatar_url ? `<img src="${u.avatar_url}" style="width:100%;height:100%;object-fit:cover;" alt="Avatar">` : (u.full_name || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <div class="name" style="font-weight:600;">${u.full_name}</div>
                            <div class="email" style="font-size:0.85rem;color:var(--text-muted);">${u.email} ${u.student_id ? `(${u.student_id})` : ''}</div>
                        </div>
                    </div>
                </td>
                <td>${statusDot}</td>
                <td>${catBadge}</td>
                <td><span style="color:var(--text-muted);font-size:0.9rem;">${dateJoined}</span></td>
                <td>
                    <div style="display:flex;gap:8px;">
                        <select onchange="changeUserRole('${u.id}', this.value)" style="background:rgba(0,0,0,0.5);border:1px solid #444;color:#fff;border-radius:4px;padding:4px 8px;font-size:0.85rem;">
                            <option value="user" ${u.role === 'user' ? 'selected' : ''}>Thành viên</option>
                            <option value="manager" ${u.role === 'manager' ? 'selected' : ''}>Staff (Quản lý)</option>
                            <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>Admin</option>
                        </select>
                        <button onclick="deleteUserAccount('${u.id}')" title="Xóa tài khoản" style="background:none;border:none;color:var(--error,#e0245e);cursor:pointer;font-size:1.1rem;padding:0 6px;">🗑️</button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:20px;color:var(--error);">Lỗi: ${err.message}</td></tr>`;
    }
}

window.changeUserRole = async (userId, newRole) => {
    try {
        await window.api.users.updateRole(userId, newRole);
        showToast('Đã cập nhật vai trò người dùng!', 'success');
        await renderUserManagement();
    } catch (err) {
        showToast(err.message || 'Lỗi cập nhật vai trò', 'error');
    }
};

window.deleteUserAccount = async (userId) => {
    if (!confirm('Bạn có chắc chắn muốn xóa thành viên này khỏi hệ thống BUH?')) return;

    try {
        await window.api.users.delete(userId);
        showToast('Đã xóa thành viên!');
        await renderUserManagement();
    } catch (err) {
        showToast(err.message || 'Lỗi xóa thành viên', 'error');
    }
};

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('admin-users-search')?.addEventListener('input', (e) => {
        renderUserManagement(e.target.value);
    });

    document.getElementById('btn-add-user')?.addEventListener('click', () => {
        document.getElementById('modal-add-user')?.classList.remove('hidden');
    });

    document.getElementById('btn-close-user-modal')?.addEventListener('click', () => {
        document.getElementById('modal-add-user')?.classList.add('hidden');
    });

    document.getElementById('btn-cancel-user-modal')?.addEventListener('click', () => {
        document.getElementById('modal-add-user')?.classList.add('hidden');
    });

    document.getElementById('form-add-user')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const fullName = document.getElementById('add-user-name').value.trim();
        const studentId = document.getElementById('add-user-id').value.trim();
        const role = document.getElementById('add-user-role').value;
        const email = `${studentId.toLowerCase()}@st.buh.edu.vn`;

        try {
            await window.api.users.create({
                fullName,
                studentId,
                email,
                role,
                category: role === 'admin' ? 'STAFF' : 'REGULAR'
            });

            showToast('Đã thêm thành viên mới!', 'success');
            document.getElementById('modal-add-user')?.classList.add('hidden');
            await renderUserManagement();
        } catch (err) {
            showToast(err.message || 'Lỗi thêm thành viên', 'error');
        }
    });
});
