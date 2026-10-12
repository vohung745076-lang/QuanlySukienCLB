/* ============================================================
   admin/users.js — Quản lý Tài khoản & Phân quyền (Super Admin)
   ============================================================ */

// ─── Render Danh sách Users ───────────────────────────────────

async function renderUserManagement(searchTerm = '') {
    const tbody = document.getElementById('admin-users-tbody');
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center">Đang tải...</td></tr>';

    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        showToast('Không tải được danh sách thành viên!', 'error');
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:var(--error)">Lỗi tải dữ liệu</td></tr>';
        return;
    }

    users = data || [];
    tbody.innerHTML = '';

    const filtered = users.filter(u =>
        u.name?.toLowerCase().includes((searchTerm || '').toLowerCase()) ||
        u.student_id?.toLowerCase().includes((searchTerm || '').toLowerCase())
    );

    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center">Không tìm thấy tài khoản nào.</td></tr>';
        return;
    }

    filtered.forEach(u => {
        const isManager = u.role === 'manager';
        const isAdmin = u.role === 'admin';
        
        let catBadge = `<span class="cat-badge">REGULAR</span>`;
        if (isAdmin) catBadge = `<span class="cat-badge" style="color:var(--error);border-color:rgba(244,67,54,0.3)">ADMIN</span>`;
        else if (isManager) catBadge = `<span class="cat-badge staff">STAFF</span>`;
        else if (u.student_id && u.student_id.toLowerCase().includes('vip')) catBadge = `<span class="cat-badge vip">VIP</span>`;

        let statusDot = `<span class="status-pill"><span class="status-dot gray"></span> INACTIVE</span>`;
        if (isAdmin || isManager) statusDot = `<span class="status-pill"><span class="status-dot yellow"></span> ON DUTY</span>`;
        else if (u.created_at) statusDot = `<span class="status-pill"><span class="status-dot" style="background:#4CAF50;box-shadow:0 0 5px #4CAF50"></span> ACTIVE</span>`;
        
        const avatarColor = isAdmin ? 'var(--error)' : (isManager ? 'var(--primary)' : '#444');

        const dateJoined = new Date(u.created_at || Date.now()).toLocaleDateString('en-US', {month:'short', day:'2-digit', year:'numeric'});

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                <div class="member-profile">
                    <img src="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2'><circle cx='12' cy='8' r='5'/><path d='M20 21a8 8 0 0 0-16 0'/></svg>" style="background:${avatarColor}; padding: 6px;">
                    <div>
                        <div class="name">${u.name}</div>
                        <div class="email">${u.email || (u.student_id + '@hive.com')}</div>
                    </div>
                </div>
            </td>
            <td>${statusDot}</td>
            <td>${catBadge}</td>
            <td style="color:var(--text-muted);font-size:0.85rem">${dateJoined}</td>
            <td>
                ${(!isAdmin) 
                    ? (isManager 
                        ? `<button class="btn btn-sm btn-outline" style="border-color:#555;color:#AAA;padding:4px 8px" onclick="toggleRole('${u.id}','user')">Demote</button>`
                        : `<button class="btn btn-sm btn-primary" style="padding:4px 8px;font-size:0.75rem;color:#000" onclick="toggleRole('${u.id}','manager')">Set Staff</button>`)
                    : ''
                }
                ${(u.id !== currentUser.id && !isAdmin)
                    ? `<button class="btn btn-sm" style="background:transparent;border:1px solid #444;color:#AAA;padding:4px 8px;margin-left:5px" onclick="deleteUser('${u.id}')">🗑</button>`
                    : ''
                }
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// ─── Toggle Role ──────────────────────────────────────────────

window.toggleRole = async (userId, newRole) => {
    const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

    if (error) { showToast('Cập nhật quyền thất bại!', 'error'); return; }

    const roleText = newRole === 'manager' ? 'Ban Tổ Chức' : 'Thành viên';
    showToast(`Đã thay đổi quyền thành ${roleText}`);
    await renderUserManagement(document.getElementById('user-search')?.value);
};

// ─── Delete User ──────────────────────────────────────────────

window.deleteUser = async (userId) => {
    if (!confirm('Xóa thành viên này? Toàn bộ vé của họ cũng sẽ bị xóa!')) return;

    // Xóa profile (tickets xóa theo cascade)
    const { error } = await supabase.from('profiles').delete().eq('id', userId);
    if (error) { showToast('Xóa thất bại!', 'error'); return; }

    showToast('Đã xóa thành viên.');
    await renderUserManagement(document.getElementById('user-search')?.value);
};

// ─── Add User Modal ───────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
    // Search
    document.getElementById('user-search')?.addEventListener('input', (e) => {
        renderUserManagement(e.target.value);
    });

    // Mở modal thêm tài khoản
    document.getElementById('btn-add-user-modal')?.addEventListener('click', () => {
        document.getElementById('form-add-user').reset();
        document.getElementById('modal-add-user').classList.remove('hidden');
    });

    // Đóng modal
    document.getElementById('btn-close-user-modal')?.addEventListener('click',  () =>
        document.getElementById('modal-add-user').classList.add('hidden'));
    document.getElementById('btn-cancel-user-modal')?.addEventListener('click', () =>
        document.getElementById('modal-add-user').classList.add('hidden'));

    // Submit form thêm user
    document.getElementById('form-add-user')?.addEventListener('submit', handleAddUser);
});

async function handleAddUser(e) {
    e.preventDefault();
    const name      = document.getElementById('add-user-name').value.trim();
    const studentId = document.getElementById('add-user-id').value.trim();
    const role      = document.getElementById('add-user-role').value;

    if (!name || !studentId) {
        showToast('Vui lòng điền đầy đủ thông tin!', 'error');
        return;
    }

    // Kiểm tra student_id đã tồn tại chưa
    const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('student_id', studentId)
        .maybeSingle();

    if (existing) {
        showToast('MSSV / ID này đã tồn tại!', 'error');
        return;
    }

    // Tạo profile trước (pre-create, chưa có auth)
    // Khi user tự đăng ký với đúng student_id → trigger sẽ cập nhật
    const { error } = await supabase.from('profiles').insert({
        name,
        student_id: studentId,
        role,
        email: `${studentId}@pending.clb`
    });

    if (error) { showToast('Tạo tài khoản thất bại!', 'error'); return; }

    document.getElementById('modal-add-user').classList.add('hidden');
    showToast('Đã thêm thành viên vào danh sách!');
    await renderUserManagement(document.getElementById('user-search')?.value);
}
