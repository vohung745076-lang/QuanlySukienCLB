/**
 * app.js - Logic for Club Event Management
 * Using Vanilla JS and Local Storage to simulate Backend
 */

const firebaseConfig = {
  apiKey: "AIzaSyCfd2Kt8qMHNZDYoRcEJt-DuveF5m3DOEE",
  authDomain: "gen-lang-client-0358371734.firebaseapp.com",
  projectId: "gen-lang-client-0358371734",
  storageBucket: "gen-lang-client-0358371734.firebasestorage.app",
  messagingSenderId: "377231159106",
  appId: "1:377231159106:web:0b1c8f5244dd142fdfe2db",
  measurementId: "G-FVMD2RBJHC"
};

let auth = null;
let googleProvider = null;
let firebaseReady = false;

async function initFirebase() {
    try {
        const [{ initializeApp }, { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged }] =
            await Promise.all([
                import("https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js"),
                import("https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js")
            ]);

        const app = initializeApp(firebaseConfig);
        auth = getAuth(app);
        googleProvider = new GoogleAuthProvider();

        window.__firebaseAuth = { signInWithPopup, signOut, onAuthStateChanged };
        firebaseReady = true;
    } catch (err) {
        console.warn("Firebase không tải được (có thể do offline/CORS).", err);
        firebaseReady = false;
        disableGoogleButtons();
    }
}

// --- STATE MANAGEMENT ---
let currentUser = null; // { id, name, role }
let events = JSON.parse(localStorage.getItem('events')) || [
    { id: 'EVT-1', name: 'Đại hội thường niên 2026', date: '2026-05-15T08:00', endDate: '2026-05-15T12:00', location: 'Hội trường lớn', desc: 'Đại hội tổng kết hoạt động năm.', capacity: 1000, registered: 850, checkins: 0, creatorId: 'admin_1', benefits: 'Cộng 5 ĐRL, Giấy chứng nhận', sponsors: 'Đoàn trường' },
    { id: 'EVT-2', name: 'Gala Dinner Kỷ niệm', date: '2026-06-20T18:30', endDate: '2026-06-20T22:30', location: 'Nhà hàng Ruby', desc: 'Tiệc kỷ niệm thành lập câu lạc bộ.', capacity: 500, registered: 120, checkins: 0, creatorId: 'admin_1', benefits: 'Ăn tối, Bốc thăm trúng thưởng', sponsors: 'Highlands Coffee' },
    { id: 'EVT-3', name: 'Workshop Kỹ năng mềm', date: '2026-04-20T14:00', endDate: '2026-04-20T17:00', location: 'Phòng học 302', desc: 'Chia sẻ kỹ năng giao tiếp.', capacity: 200, registered: 198, checkins: 0, creatorId: 'admin_1', benefits: 'Sổ tay, Bút, Cơ hội thực tập', sponsors: 'Google, VNPT' }
];
let userTickets = JSON.parse(localStorage.getItem('userTickets')) || [];
let checkinLogs = JSON.parse(localStorage.getItem('checkinLogs')) || [];
let users = JSON.parse(localStorage.getItem('users')) || [];

function saveData() {
    localStorage.setItem('events', JSON.stringify(events));
    localStorage.setItem('userTickets', JSON.stringify(userTickets));
    localStorage.setItem('checkinLogs', JSON.stringify(checkinLogs));
    localStorage.setItem('users', JSON.stringify(users));
}

// --- UTILS ---
function showToast(message, type = 'success') {
    const toastContainer = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    toastContainer.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function disableGoogleButtons() {
    document.querySelectorAll('.btn-google').forEach(btn => {
        btn.setAttribute('disabled', 'disabled');
        btn.style.opacity = '0.6';
        btn.style.cursor = 'not-allowed';
        btn.title = 'Google Auth cần Internet và chạy bằng http://localhost';
    });
}

function switchView(viewId) {
    document.querySelectorAll('.view').forEach(el => {
        el.classList.remove('active');
        el.classList.add('hidden');
    });
    const target = document.getElementById(viewId);
    target.classList.remove('hidden');
    target.classList.add('active');
}

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    // Auth Tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.auth-form').forEach(f => f.classList.add('hidden'));
            e.target.classList.add('active');
            document.getElementById(e.target.dataset.target).classList.remove('hidden');
        });
    });

    // Check existing session
    const session = sessionStorage.getItem('sessionUser');
    if (session) {
        currentUser = JSON.parse(session);
        loginSuccess();
    }

    // Init Firebase lazily so app still works offline
    initFirebase().then(() => {
        if (!firebaseReady || session) return;
        const { onAuthStateChanged } = window.__firebaseAuth;
        onAuthStateChanged(auth, (user) => {
            if (user && !currentUser) {
                let existingUser = users.find(u => u.studentId === user.uid);
                if (existingUser) {
                    currentUser = existingUser;
                    sessionStorage.setItem('sessionUser', JSON.stringify(currentUser));
                    loginSuccess();
                }
            }
        });
    });
});

// --- AUTHENTICATION ---
document.getElementById('form-login').addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('login-username').value.trim();
    
    // Mock login logic
    if (username === 'admin') {
        currentUser = { id: 'admin_1', name: 'Ban Quản Trị', role: 'admin' };
    } else {
        // Tìm user trong danh sách
        const existingUser = users.find(u => u.studentId === username);
        if (existingUser) {
            currentUser = existingUser;
        } else {
            currentUser = { id: `user_${Date.now()}`, name: username, role: 'user', studentId: username };
            users.push(currentUser);
            saveData();
        }
    }
    
    sessionStorage.setItem('sessionUser', JSON.stringify(currentUser));
    loginSuccess();
});

document.getElementById('form-register').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('reg-name').value.trim();
    const studentId = document.getElementById('reg-studentid').value.trim();
    
    // Kiểm tra xem mã sinh viên đã tồn tại chưa
    let existingUser = users.find(u => u.studentId === studentId);
    if (!existingUser) {
        existingUser = { id: `user_${Date.now()}`, name: name, role: 'user', studentId: studentId };
        users.push(existingUser);
        saveData();
    }
    
    currentUser = existingUser;
    sessionStorage.setItem('sessionUser', JSON.stringify(currentUser));
    loginSuccess();
});

// Real Google Auth
document.querySelectorAll('.btn-google').forEach(btn => {
    btn.addEventListener('click', async () => {
        if (!firebaseReady) {
            showToast('Chức năng Google cần Internet hoặc chạy bằng http://localhost', 'error');
            return;
        }
        try {
            const { signInWithPopup } = window.__firebaseAuth;
            showToast('Đang mở cửa sổ đăng nhập Google...', 'success');
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;
            
            const googleId = user.uid;
            const name = user.displayName || 'Google User';
            
            let existingUser = users.find(u => u.studentId === googleId);
            if (!existingUser) {
                existingUser = { id: `user_${Date.now()}`, name: name, role: 'user', studentId: googleId, email: user.email };
                users.push(existingUser);
                saveData();
            } else if (!existingUser.email && user.email) {
                existingUser.email = user.email;
                saveData();
            }
            
            currentUser = existingUser;
            sessionStorage.setItem('sessionUser', JSON.stringify(currentUser));
            loginSuccess();
        } catch (error) {
            console.error("Firebase Auth Error", error);
            showToast('Đăng nhập bị hủy hoặc có lỗi!', 'error');
        }
    });
});

document.getElementById('btn-logout').addEventListener('click', async () => {
    if (firebaseReady) {
        try {
            const { signOut } = window.__firebaseAuth;
            await signOut(auth);
        } catch(err) {
            console.error("Sign out error", err);
        }
    }
    
    sessionStorage.removeItem('sessionUser');
    currentUser = null;
    document.getElementById('sidebar').classList.add('hidden');
    switchView('view-auth');
    showToast('Đã đăng xuất');
});

function loginSuccess() {
    showToast(`Chào mừng, ${currentUser.name}!`);
    document.getElementById('sidebar').classList.remove('hidden');
    
    // Update User Info
    document.getElementById('user-name-display').textContent = currentUser.name;
    let roleText = 'Thành viên';
    if (currentUser.role === 'admin') roleText = 'Super Admin';
    if (currentUser.role === 'manager') roleText = 'Ban Tổ Chức';
    document.getElementById('user-role-display').textContent = roleText;
    document.getElementById('user-avatar').textContent = currentUser.name.charAt(0).toUpperCase();

    renderSidebarMenu();
    
    if (currentUser.role === 'admin' || currentUser.role === 'manager') {
        switchView('view-dashboard');
        renderAdminDashboard();
    } else {
        switchView('view-explore');
        renderUserExplore();
    }
}

// --- SIDEBAR MENU ---
function renderSidebarMenu() {
    const navMenu = document.getElementById('nav-menu');
    navMenu.innerHTML = '';

    const rootAdminLinks = [
        { id: 'nav-dashboard', label: 'Tổng quan Sự kiện', view: 'view-dashboard', icon: '📊' },
        { id: 'nav-users', label: 'Quản lý Tài khoản', view: 'view-users', icon: '👑' },
        { id: 'nav-checkin', label: 'Hệ thống Check-in', view: 'view-checkin', icon: '✅' }
    ];

    const managerLinks = [
        { id: 'nav-dashboard', label: 'Tổng quan Sự kiện & Tạo mới', view: 'view-dashboard', icon: '📊' },
        { id: 'nav-checkin', label: 'Hệ thống Check-in', view: 'view-checkin', icon: '✅' }
    ];

    const userLinks = [
        { id: 'nav-explore', label: 'Khám phá Sự kiện', view: 'view-explore', icon: '🌍' },
        { id: 'nav-tickets', label: 'Vé của Tôi', view: 'view-tickets', icon: '🎫' }
    ];

    let links = userLinks;
    if (currentUser.role === 'admin') links = rootAdminLinks;
    if (currentUser.role === 'manager') links = managerLinks;

    links.forEach((link, index) => {
        const div = document.createElement('div');
        div.className = `nav-item ${index === 0 ? 'active' : ''}`;
        div.innerHTML = `<span style="margin-right: 10px">${link.icon}</span> ${link.label}`;
        div.addEventListener('click', () => {
            document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
            div.classList.add('active');
            switchView(link.view);
            
            // Re-render based on view
            if (link.view === 'view-dashboard') renderAdminDashboard();
            if (link.view === 'view-explore') renderUserExplore();
            if (link.view === 'view-tickets') renderUserTickets();
            if (link.view === 'view-checkin') renderCheckinSystem();
            if (link.view === 'view-users') renderUserManagement();
        });
        navMenu.appendChild(div);
    });
}

// --- ADMIN: DASHBOARD ---
function renderAdminDashboard(searchTerm = '') {
    // Update stats
    document.getElementById('stat-total-events').textContent = events.length;
    let totalReg = events.reduce((sum, e) => sum + e.registered, 0);
    let totalCheckin = events.reduce((sum, e) => sum + e.checkins, 0);
    document.getElementById('stat-total-regs').textContent = totalReg;
    document.getElementById('stat-total-checkins').textContent = totalCheckin;

    const tbody = document.getElementById('admin-events-tbody');
    tbody.innerHTML = '';
    
    const filteredEvents = events.filter(e => e.name.toLowerCase().includes(searchTerm.toLowerCase()));

    if (filteredEvents.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center">Không tìm thấy sự kiện nào.</td></tr>';
        return;
    }

    filteredEvents.forEach(evt => {
        const canEdit = currentUser.role === 'admin' || evt.creatorId === currentUser.id;
        
        // Tính toán trạng thái
        let status = 'Sắp mở';
        const now = new Date();
        const start = new Date(evt.date);
        const end = new Date(evt.endDate || evt.date);
        
        if (now >= start && now <= end) status = '<span style="color:var(--success); font-weight:600;">Đang mở</span>';
        else if (now > end) status = '<span style="color:var(--error); font-weight:600;">Đã kết thúc</span>';
        else status = '<span style="color:var(--primary); font-weight:600;">Sắp diễn ra</span>';
        if (evt.registered >= evt.capacity && now < start) status = '<span style="color: #f39c12; font-weight:600;">Đã đầy</span>';
        
        const dateStr = evt.endDate ? `${start.toLocaleString('vi-VN')} <br><small>Đến: ${end.toLocaleTimeString('vi-VN')}</small>` : start.toLocaleString('vi-VN');

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${evt.name}</strong><br><small>${evt.id}</small></td>
            <td>${dateStr}</td>
            <td>${status}</td>
            <td>${evt.location}</td>
            <td>${evt.registered} / ${evt.capacity}</td>
            <td>
                ${canEdit 
                    ? `<button class="btn btn-sm btn-outline" style="border-color: #2196F3; color: #2196F3;" onclick="viewEventUsers('${evt.id}')">Danh sách</button>
                       <button class="btn btn-sm btn-outline" onclick="editEvent('${evt.id}')">Sửa</button>
                       <button class="btn btn-sm btn-outline" onclick="deleteEvent('${evt.id}')" style="color:var(--error); border-color:var(--error)">Xóa</button>`
                    : `<span style="color: var(--text-muted); font-size: 0.8rem">Không đủ quyền</span>`
                }
            </td>
        `;
        tbody.appendChild(tr);
    });
}

document.getElementById('dashboard-search').addEventListener('input', (e) => {
    renderAdminDashboard(e.target.value);
});

// Export Excel Logic
document.getElementById('btn-export-excel').addEventListener('click', () => {
    if (userTickets.length === 0) {
        showToast('Chưa có dữ liệu lượt đăng ký nào!', 'error');
        return;
    }
    if (typeof XLSX === 'undefined') {
        showToast('Không tải được thư viện Excel (có thể do không có Internet).', 'error');
        return;
    }
    
    // Xuất dữ liệu dựa trên vé tham gia (mỗi vé 1 dòng)
    const exportData = userTickets.map((t, index) => {
        const evt = events.find(e => e.id === t.eventId);
        return {
            "STT": index + 1,
            "Sự kiện": evt ? evt.name : 'Không rõ',
            "Mã Vé": t.id,
            "Trạng Thái": t.status === 'used' ? 'Đã Check-in' : 'Hợp lệ',
            "Họ và Tên": t.participantName || '(Chưa cập nhật)',
            "MSSV": t.participantMssv || '(Chưa cập nhật)',
            "Email": t.participantEmail || '(Chưa cập nhật)'
        };
    });

    try {
        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const wscols = [
            {wch: 5}, {wch: 35}, {wch: 15}, {wch: 15}, {wch: 25}, {wch: 15}, {wch: 30}
        ];
        worksheet['!cols'] = wscols;
        
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "DanhSachDangKy");
        
        XLSX.writeFile(workbook, "DanhSach_DangKy_SuKien.xlsx");
        showToast('Xuất Excel thành công!');
    } catch (err) {
        console.error(err);
        showToast('Có lỗi xảy ra khi xuất file!', 'error');
    }
});


// Modal Logic
document.getElementById('btn-create-event').addEventListener('click', () => {
    document.getElementById('form-event').reset();
    document.getElementById('event-id').value = '';
    document.getElementById('modal-event-title').textContent = 'Tạo Sự kiện Mới';
    document.getElementById('modal-event').classList.remove('hidden');
});

document.getElementById('btn-close-modal').addEventListener('click', () => {
    document.getElementById('modal-event').classList.add('hidden');
});
document.getElementById('btn-cancel-modal').addEventListener('click', () => {
    document.getElementById('modal-event').classList.add('hidden');
});

document.getElementById('form-event').addEventListener('submit', (e) => {
    e.preventDefault();
    const id = document.getElementById('event-id').value;
    const name = document.getElementById('event-name').value;
    const date = document.getElementById('event-date').value;
    const endDate = document.getElementById('event-end-date').value;
    const capacity = parseInt(document.getElementById('event-capacity').value);
    const location = document.getElementById('event-location').value;
    const desc = document.getElementById('event-desc').value;
    const benefits = document.getElementById('event-benefits').value;
    const sponsors = document.getElementById('event-sponsors').value;

    if (id) {
        // Edit
        const evt = events.find(e => e.id === id);
        if (evt) {
            evt.name = name; evt.date = date; evt.endDate = endDate; evt.capacity = capacity; evt.location = location; evt.desc = desc;
            evt.benefits = benefits; evt.sponsors = sponsors;
        }
        showToast('Đã cập nhật sự kiện!');
    } else {
        // Create
        events.push({
            id: `EVT-${Date.now().toString().slice(-4)}`,
            name, date, endDate, capacity, location, desc, benefits, sponsors, registered: 0, checkins: 0, creatorId: currentUser.id
        });
        showToast('Đã tạo sự kiện mới!');
    }
    
    saveData();
    document.getElementById('modal-event').classList.add('hidden');
    renderAdminDashboard();
});

window.editEvent = (id) => {
    const evt = events.find(e => e.id === id);
    if (!evt) return;
    document.getElementById('event-id').value = evt.id;
    document.getElementById('event-name').value = evt.name;
    document.getElementById('event-date').value = evt.date;
    document.getElementById('event-end-date').value = evt.endDate || evt.date;
    document.getElementById('event-capacity').value = evt.capacity;
    document.getElementById('event-location').value = evt.location;
    document.getElementById('event-desc').value = evt.desc || '';
    document.getElementById('event-benefits').value = evt.benefits || '';
    document.getElementById('event-sponsors').value = evt.sponsors || '';
    
    document.getElementById('modal-event-title').textContent = 'Chỉnh sửa Sự kiện';
    document.getElementById('modal-event').classList.remove('hidden');
};

window.deleteEvent = (id) => {
    if (confirm('Bạn có chắc muốn xóa sự kiện này?')) {
        events = events.filter(e => e.id !== id);
        saveData();
        renderAdminDashboard();
        showToast('Đã xóa sự kiện.');
    }
};

// View Event Users
window.viewEventUsers = (eventId) => {
    const evt = events.find(e => e.id === eventId);
    if (!evt) return;
    
    document.getElementById('view-users-event-name').textContent = evt.name;
    const tbody = document.getElementById('event-users-tbody');
    tbody.innerHTML = '';
    
    // Đảm bảo lấy bản mới nhất (Phòng hờ user vừa đăng ký)
    const freshTickets = JSON.parse(localStorage.getItem('userTickets')) || [];
    const participants = freshTickets.filter(t => t.eventId === eventId);
    
    if (participants.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center">Chưa có ai đăng ký sự kiện này.</td></tr>';
    } else {
        participants.forEach((p, index) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${index + 1}</td>
                <td style="font-family: monospace; font-weight: bold;">${p.id}</td>
                <td>${p.participantMssv || '---'}</td>
                <td>${p.participantName || 'Khách'}</td>
                <td>${p.status === 'used' ? '<span style="color: var(--success); font-weight: bold;">Đã Check-in</span>' : '<span style="color: var(--text-muted);">Hợp lệ</span>'}</td>
            `;
            tbody.appendChild(tr);
        });
    }
    
    document.getElementById('modal-event-users').classList.remove('hidden');
};

document.getElementById('btn-close-event-users-modal')?.addEventListener('click', () => {
    document.getElementById('modal-event-users').classList.add('hidden');
});
document.getElementById('btn-close-event-users-bottom')?.addEventListener('click', () => {
    document.getElementById('modal-event-users').classList.add('hidden');
});

// --- ADMIN: USER MANAGEMENT ---
function renderUserManagement(searchTerm = '') {
    const tbody = document.getElementById('admin-users-tbody');
    tbody.innerHTML = '';
    
    // Tìm sinh viên (bỏ tài khoản root admin khỏi danh sách thao tác nội bộ nếu muốn, nhưng ở đây hiện hết)
    const filteredUsers = users.filter(u => 
        (u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (u.studentId && u.studentId.toLowerCase().includes(searchTerm.toLowerCase())))
    );

    if (filteredUsers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center">Không tìm thấy tài khoản nào.</td></tr>';
        return;
    }

    filteredUsers.forEach(u => {
        // Chỉ root admin mới có thể thăng cấp
        const isManager = u.role === 'manager';
        const roleLabel = isManager ? '<span style="color: var(--primary); font-weight: bold;">Ban Tổ Chức (Manager)</span>' : 'Thành viên (User)';
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${u.studentId || '-'}</strong></td>
            <td>${u.name}</td>
            <td>${roleLabel}</td>
            <td>
                ${isManager 
                    ? `<button class="btn btn-sm btn-outline" style="border-color: #757575; color: #757575;" onclick="toggleRole('${u.id}', 'user')">Hạ cấp User</button>`
                    : u.role === 'admin' ? '' : `<button class="btn btn-sm btn-outline" onclick="toggleRole('${u.id}', 'manager')">Thăng Manager</button>`
                }
                ${u.id !== currentUser.id && u.role !== 'admin' 
                    ? `<button class="btn btn-sm btn-outline" style="border-color: var(--error); color: var(--error); margin-left: 5px;" onclick="deleteUser('${u.id}')">Xóa</button>` 
                    : ''
                }
            </td>
        `;
        tbody.appendChild(tr);
    });
}

document.getElementById('user-search')?.addEventListener('input', (e) => {
    renderUserManagement(e.target.value);
});

window.toggleRole = (userId, newRole) => {
    const user = users.find(u => u.id === userId);
    if (user) {
        user.role = newRole;
        saveData();
        showToast(`Đã thay đổi quyền của ${user.name} thành ${newRole === 'manager' ? 'Ban Tổ Chức' : 'Thành viên'}`);
        renderUserManagement(document.getElementById('user-search').value);
    }
};

window.deleteUser = (userId) => {
    if(confirm('Bạn có chắc chắn muốn xóa thành viên này? Toàn bộ vé của họ sẽ bị mất!')) {
        users = users.filter(u => u.id !== userId);
        userTickets = userTickets.filter(t => t.userId !== userId);
        saveData();
        renderUserManagement(document.getElementById('user-search').value);
        showToast('Đã xóa thành viên', 'success');
    }
};

// Add User Modal
document.getElementById('btn-add-user-modal')?.addEventListener('click', () => {
    document.getElementById('form-add-user').reset();
    document.getElementById('modal-add-user').classList.remove('hidden');
});
document.getElementById('btn-close-user-modal')?.addEventListener('click', () => {
    document.getElementById('modal-add-user').classList.add('hidden');
});
document.getElementById('btn-cancel-user-modal')?.addEventListener('click', () => {
    document.getElementById('modal-add-user').classList.add('hidden');
});
document.getElementById('form-add-user')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('add-user-name').value.trim();
    const studentId = document.getElementById('add-user-id').value.trim();
    const role = document.getElementById('add-user-role').value;
    
    const existing = users.find(u => u.studentId === studentId);
    if(existing) {
        showToast('Mã số / User ID này đã tồn tại!', 'error');
        return;
    }
    
    users.push({
        id: `user_${Date.now()}`,
        name, studentId, role
    });
    saveData();
    document.getElementById('modal-add-user').classList.add('hidden');
    renderUserManagement(document.getElementById('user-search').value);
    showToast('Tạo tài khoản thành công!');
});

// --- USER: EXPLORE EVENTS ---
function renderUserExplore(searchTerm = '') {
    const grid = document.getElementById('explore-events-grid');
    grid.innerHTML = '';
    
    const filteredEvents = events.filter(e => e.name.toLowerCase().includes(searchTerm.toLowerCase()));

    if (filteredEvents.length === 0) {
        grid.innerHTML = '<p>Không có sự kiện nào phù hợp.</p>';
        return;
    }

    filteredEvents.forEach(evt => {
        const isRegistered = userTickets.some(t => t.eventId === evt.id && t.userId === currentUser.id);
        const isFull = evt.registered >= evt.capacity;

        const card = document.createElement('div');
        card.className = 'event-card';
        card.innerHTML = `
            <div class="event-card-img">
                <span class="event-date-badge">${new Date(evt.date).toLocaleDateString('vi-VN')}</span>
            </div>
            <div class="event-card-body">
                <h3 class="event-card-title">${evt.name}</h3>
                <div class="event-card-meta">
                    <span>📍 ${evt.location}</span>
                    <span>👥 ${evt.registered}/${evt.capacity}</span>
                </div>
                <p class="event-card-desc">${evt.desc}</p>
                ${evt.benefits ? `<p style="font-size: 0.85rem; color: var(--primary); margin-bottom: 5px;">🎁 <strong>Quyền lợi:</strong> ${evt.benefits}</p>` : ''}
                ${evt.sponsors ? `<p style="font-size: 0.85rem; color: #757575; margin-bottom: 10px;">🤝 <strong>Tài trợ:</strong> ${evt.sponsors}</p>` : ''}
                ${isRegistered 
                    ? `<button class="btn btn-outline btn-block" disabled>Đã Đăng Ký</button>`
                    : isFull 
                        ? `<button class="btn btn-outline btn-block" disabled>Đã Hết Vé</button>`
                        : `<button class="btn btn-primary btn-block" onclick="registerEvent('${evt.id}')">Đăng ký tham gia</button>`
                }
            </div>
        `;
        grid.appendChild(card);
    });
}

document.getElementById('explore-search').addEventListener('input', (e) => {
    renderUserExplore(e.target.value);
});

window.registerEvent = (eventId) => {
    const evt = events.find(e => e.id === eventId);
    if (!evt || evt.registered >= evt.capacity) return;
    
    document.getElementById('register-event-id').value = eventId;
    document.getElementById('register-event-name').textContent = evt.name;
    
    document.getElementById('reg-form-name').value = currentUser.name || '';
    if(currentUser.studentId && !currentUser.studentId.startsWith("GGL-") && currentUser.studentId.length < 20) {
        document.getElementById('reg-form-mssv').value = currentUser.studentId;
    } else {
        document.getElementById('reg-form-mssv').value = '';
    }
    document.getElementById('reg-form-email').value = currentUser.email || '';
    
    document.getElementById('modal-register').classList.remove('hidden');
};

document.getElementById('btn-close-register-modal')?.addEventListener('click', () => {
    document.getElementById('modal-register').classList.add('hidden');
});
document.getElementById('btn-cancel-register-modal')?.addEventListener('click', () => {
    document.getElementById('modal-register').classList.add('hidden');
});
document.getElementById('form-register-event')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const eventId = document.getElementById('register-event-id').value;
    const evt = events.find(e => e.id === eventId);
    if (!evt || evt.registered >= evt.capacity) return;
    
    const name = document.getElementById('reg-form-name').value.trim();
    const mssv = document.getElementById('reg-form-mssv').value.trim();
    const email = document.getElementById('reg-form-email').value.trim();
    
    evt.registered += 1;
    // Mã vé tuần tự theo sự kiện (Ví dụ: EVT-1234-001, EVT-1234-002)
    const sequencePart = String(evt.registered).padStart(3, '0');
    const ticketCode = `${evt.id}-${sequencePart}`;
    userTickets.push({
        id: ticketCode,
        eventId: evt.id,
        userId: currentUser.id,
        status: 'valid',
        participantName: name,
        participantMssv: mssv,
        participantEmail: email
    });
    saveData();
    document.getElementById('modal-register').classList.add('hidden');
    showToast('Đăng ký thành công! Mã vé của bạn là ' + ticketCode);
    renderUserExplore();
});

// --- USER: MY TICKETS ---
function renderUserTickets() {
    const list = document.getElementById('my-tickets-list');
    list.innerHTML = '';
    
    const myTickets = userTickets.filter(t => t.userId === currentUser.id);
    
    if (myTickets.length === 0) {
        list.innerHTML = '<p>Bạn chưa đăng ký sự kiện nào.</p>';
        return;
    }

    myTickets.forEach(ticket => {
        const evt = events.find(e => e.id === ticket.eventId);
        if (!evt) return;

        const statusClass = ticket.status === 'valid' ? 'status-valid' : 'status-used';
        const statusText = ticket.status === 'valid' ? 'HỢP LỆ' : 'ĐÃ SỬ DỤNG';

        const div = document.createElement('div');
        div.className = 'ticket-item';
        div.innerHTML = `
            <div class="ticket-qr">
                <div class="ticket-qr-img"></div>
                <div class="ticket-code">${ticket.id}</div>
            </div>
            <div class="ticket-details">
                <span class="ticket-status ${statusClass}">${statusText}</span>
                <h3 style="margin: 10px 0">${evt.name}</h3>
                <p><strong>🕒 Thời gian:</strong> ${new Date(evt.date).toLocaleString('vi-VN')}</p>
                <p><strong>📍 Địa điểm:</strong> ${evt.location}</p>
                ${evt.benefits ? `<p><strong>🎁 Quyền lợi:</strong> ${evt.benefits}</p>` : ''}
            </div>
        `;
        list.appendChild(div);
    });
}

// --- ADMIN: CHECK-IN SYSTEM ---
function renderCheckinSystem() {
    const select = document.getElementById('checkin-event-select');
    select.innerHTML = '<option value="">-- Chọn sự kiện để check-in --</option>';
    events.forEach(e => {
        const opt = document.createElement('option');
        opt.value = e.id;
        opt.textContent = `${e.name} (${new Date(e.date).toLocaleDateString('vi-VN')})`;
        select.appendChild(opt);
    });
    
    renderCheckinLog();
}

document.getElementById('btn-do-checkin').addEventListener('click', () => {
    // Phiên bản Cục bộ trước đây cần JSON.parse(...). Nay xài Firebase nên array luôn khớp thời gian thực.
    const eventId = document.getElementById('checkin-event-select').value;
    const ticketCode = document.getElementById('checkin-ticket-code').value.trim();
    const resultBox = document.getElementById('checkin-result');
    
    if (!eventId) {
        showToast('Vui lòng chọn sự kiện trước!', 'error');
        return;
    }
    
    if (!ticketCode) return;

    resultBox.classList.remove('hidden', 'success', 'error');

    // Tìm vé theo ID gốc hoặc MSSV tham gia
    const searchStr = ticketCode.toLowerCase();
    const ticket = userTickets.find(t => 
        t.eventId === eventId && 
        (t.id.toLowerCase() === searchStr || (t.participantMssv && t.participantMssv.toLowerCase() === searchStr))
    );
    
    if (!ticket) {
        resultBox.className = 'checkin-result error';
        resultBox.innerHTML = `❌ Lỗi: Không tìm thấy vé đăng ký (hoặc MSSV không khớp) cho sự kiện này.`;
        logCheckin(ticketCode, eventId, false, 'Sai mã/MSSV');
    } else if (ticket.status === 'used') {
        // Cho phép check-in lại báo thành công nhưng không lưu log (chống spam/double-click)
        resultBox.className = 'checkin-result success';
        resultBox.innerHTML = `✅ Check-in thành công!<br><small><strong>Mã vé:</strong> ${ticket.id}<br><strong>Họ tên:</strong> ${ticket.participantName || '---'}<br><strong>MSSV:</strong> ${ticket.participantMssv || '---'}</small><br><i style="margin-top:5px;display:block;font-size:0.85rem;color:var(--text-muted);">*Vé này đã được điểm danh trước đó, hệ thống không ghi nhận thêm.</i>`;
        // Không gọi logCheckin hay tăng số lượt
    } else {
        // Success
        ticket.status = 'used';
        syncToFirebase('userTickets', ticket.id, ticket);
        const evt = events.find(e => e.id === eventId);
        if (evt) { 
            evt.checkins += 1;
            syncToFirebase('events', evt.id, evt);
        }
        saveData();

        resultBox.className = 'checkin-result success';
        resultBox.innerHTML = `✅ Check-in thành công!<br><small><strong>Mã vé:</strong> ${ticket.id}<br><strong>Họ tên:</strong> ${ticket.participantName || '---'}<br><strong>MSSV:</strong> ${ticket.participantMssv || '---'}</small>`;
        logCheckin(`${ticket.id} (${ticket.participantMssv || 'Khách'})`, eventId, true, 'Hợp lệ', ticket.id);
    }

    document.getElementById('checkin-ticket-code').value = '';
    renderCheckinLog();
});

function logCheckin(code, eventId, success, note, ticketId = null) {
    const newLog = {
        time: new Date().toLocaleTimeString('vi-VN'),
        timestamp: Date.now(), // Unique ID for Firestore
        code,
        eventId,
        success,
        note,
        ticketId
    };
    checkinLogs.unshift(newLog);
    syncToFirebase("checkinLogs", newLog.timestamp.toString(), newLog);
    // Keep last 30 logs
    if (checkinLogs.length > 30) checkinLogs.pop();
    saveData();
}

function renderCheckinLog() {
    const list = document.getElementById('checkin-log-list');
    list.innerHTML = '';
    
    if (checkinLogs.length === 0) {
        list.innerHTML = '<li>Chưa có lịch sử check-in</li>';
        return;
    }

    checkinLogs.forEach((log, index) => {
        const li = document.createElement('li');
        li.innerHTML = `
            <div>
                <span><strong>${log.code}</strong> <small>(${log.time})</small></span>
            </div>
            <div style="display: flex; align-items: center; gap: 15px;">
                <span style="color: ${log.success ? 'var(--success)' : 'var(--error)'}">${log.note}</span>
                ${log.success && log.ticketId ? `<button title="Hoàn tác Check-in này" onclick="undoCheckin('${log.ticketId}', '${log.eventId}', ${index})" style="background:none; border:none; color:var(--error); text-decoration:underline; cursor:pointer; font-size: 0.85rem;">Hoàn tác</button>` : ''}
                <button title="Xóa dòng này" onclick="deleteCheckinLog(${index})" style="background:none; border:none; color:var(--text-muted); cursor:pointer; font-size: 1.2rem;">&times;</button>
            </div>
        `;
        list.appendChild(li);
    });
}

window.deleteCheckinLog = (index) => {
    const delLog = checkinLogs[index];
    checkinLogs.splice(index, 1);
    saveData();
    if (delLog && delLog.timestamp) {
        deleteFromFirebase('checkinLogs', delLog.timestamp.toString());
    }
    renderCheckinLog();
};

window.undoCheckin = (ticketId, eventId, index) => {
    if (confirm('Phục hồi vé này trở lại trạng thái "Hợp lệ" (Chưa check-in)?')) {
        const ticket = userTickets.find(t => t.id === ticketId);
        if (ticket && ticket.status === 'used') {
            ticket.status = 'valid';
            syncToFirebase('userTickets', ticket.id, ticket);
            const evt = events.find(e => e.id === eventId);
            if (evt) {
                evt.checkins = Math.max(0, evt.checkins - 1);
                syncToFirebase('events', evt.id, evt);
            }
            showToast('Đã hoàn tác. Vé đã có thể sử dụng lại.', 'success');
        }
        checkinLogs[index].note = 'Đã hủy check-in';
        checkinLogs[index].success = false;
        checkinLogs[index].ticketId = null; // Tránh hoàn tác 2 lần
        syncToFirebase('checkinLogs', checkinLogs[index].timestamp.toString(), checkinLogs[index]);
        saveData();
        renderCheckinLog();
    }
};

document.getElementById('btn-clear-checkin-logs')?.addEventListener('click', () => {
    if(confirm('Bạn muốn dọn dẹp sạch sẽ toàn bộ danh sách hiển thị này? (Không ảnh hưởng đến vé sinh viên)')) {
        checkinLogs = [];
        saveData();
        renderCheckinLog();
    }
});
