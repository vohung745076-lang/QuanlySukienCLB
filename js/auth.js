/* ============================================================
   auth.js — Authentication Controller (RESTful API & Google OAuth)
   Đăng nhập sinh viên BUH, Đăng ký, Khôi phục phiên, Google GSI
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
    setupAuthTabs();
    setupAuthForms();
    setupGoogleAuth();
    restoreSession();
});

function setupAuthTabs() {
    document.querySelectorAll('.tab-btn').forEach((btn) => {
        btn.addEventListener('click', (e) => {
            const targetForm = e.currentTarget.dataset.target;
            window.location.hash = targetForm === 'form-register' ? '#/auth/register' : '#/auth/login';
        });
    });
}

async function restoreSession() {
    const token = window.api.getToken();
    if (!token) return;

    try {
        const res = await window.api.auth.getMe();
        const user = res.data;
        if (user) {
            currentUser = {
                id: user.id,
                name: user.full_name,
                role: user.role,
                studentId: user.student_id,
                email: user.email,
                avatar: user.avatar_url
            };
            loginSuccess(false);
        }
    } catch (err) {
        console.warn('Khôi phục phiên thất bại (token hết hạn):', err.message);
        window.api.setToken(null);
        currentUser = null;
    }
}

function setupAuthForms() {
    // 1. Xử lý Đăng nhập bằng Email/MSSV + Mật khẩu
    const loginForm = document.getElementById('form-login');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = loginForm.querySelector('button[type="submit"]');
            btn.disabled = true;
            btn.textContent = 'Đang xử lý...';

            const username = document.getElementById('login-username').value.trim();
            const password = document.getElementById('login-password').value;

            try {
                const res = await window.api.auth.login(username, password);
                const { user, accessToken } = res.data;
                window.api.setToken(accessToken);

                currentUser = {
                    id: user.id,
                    name: user.full_name,
                    role: user.role,
                    studentId: user.student_id,
                    email: user.email,
                    avatar: user.avatar_url
                };

                loginSuccess(true);
            } catch (err) {
                showToast(err.message || 'Đăng nhập thất bại!', 'error');
            } finally {
                btn.disabled = false;
                btn.textContent = 'Đăng nhập';
            }
        });
    }

    // 2. Xử lý Đăng ký tài khoản
    const registerForm = document.getElementById('form-register');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = registerForm.querySelector('button[type="submit"]');
            btn.disabled = true;
            btn.textContent = 'Đang xử lý...';

            const fullName = document.getElementById('reg-name').value.trim();
            const studentId = document.getElementById('reg-studentid').value.trim();
            const email = document.getElementById('reg-email').value.trim();
            const password = document.getElementById('reg-password').value;

            try {
                const res = await window.api.auth.register({ fullName, studentId, email, password });
                const { user, accessToken } = res.data;
                window.api.setToken(accessToken);

                currentUser = {
                    id: user.id,
                    name: user.full_name,
                    role: user.role,
                    studentId: user.student_id,
                    email: user.email,
                    avatar: user.avatar_url
                };

                showToast('Đăng ký tài khoản thành công! 🎉');
                loginSuccess(true);
            } catch (err) {
                showToast(err.message || 'Đăng ký thất bại!', 'error');
            } finally {
                btn.disabled = false;
                btn.textContent = 'Đăng ký';
            }
        });
    }

    // 3. Xử lý Đăng xuất
    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
        btnLogout.addEventListener('click', async () => {
            window.api.auth.logout();
            currentUser = null;
            events = [];
            userTickets = [];
            checkinLogs = [];
            users = [];

            document.getElementById('topbar')?.classList.add('hidden');
            await navigateToRoute('#/auth/login', { replace: true });
            showToast('Đã đăng xuất khỏi hệ thống');
        });
    }
}

// 4. Xử lý Google Identity Services (GSI) cho Sinh Viên BUH
function setupGoogleAuth() {
    // Khởi tạo Google One-Tap & Sign-in Button nếu SDK sẵn sàng
    const initGoogleGsi = () => {
        if (typeof google === 'undefined' || !google.accounts || !google.accounts.id) return;
        
        const clientId = window.CONFIG?.GOOGLE_CLIENT_ID;
        if (!clientId || clientId.includes('YOUR_GOOGLE_CLIENT_ID')) {
            console.info('Google Client ID chưa được điền trong js/config.js. Nút Google sẽ mở hướng dẫn khi bấm.');
            return;
        }

        google.accounts.id.initialize({
            client_id: clientId,
            callback: handleGoogleCredentialResponse,
            auto_select: false,
            cancel_on_tap_outside: true
        });
    };

    // Khi người dùng bấm nút Google Sign-In trên giao diện
    document.querySelectorAll('.btn-google').forEach((btn) => {
        btn.addEventListener('click', async () => {
            const clientId = window.CONFIG?.GOOGLE_CLIENT_ID;

            if (typeof google !== 'undefined' && google.accounts && google.accounts.id && clientId && !clientId.includes('YOUR_GOOGLE_CLIENT_ID')) {
                google.accounts.id.prompt((notification) => {
                    if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
                        console.log('Google One-Tap không hiển thị tự động, người dùng có thể thử lại.');
                    }
                });
            } else {
                // Hướng dẫn nếu chưa cài đặt Client ID trên Google Cloud
                const inputToken = prompt(
                    'ĐĂNG NHẬP GOOGLE SINH VIÊN BUH:\n\n' +
                    '1. Để kích hoạt thực tế, vui lòng điền GOOGLE_CLIENT_ID trong js/config.js.\n' +
                    '2. Để test nhanh luồng API hiện tại, bạn có thể dán thử Google ID Token tại đây (hoặc nhấn Hủy):'
                );
                if (inputToken && inputToken.trim()) {
                    await handleGoogleCredentialResponse({ credential: inputToken.trim() });
                }
            }
        });
    });

    if (window.google) {
        initGoogleGsi();
    } else {
        window.addEventListener('load', initGoogleGsi);
    }
}

async function handleGoogleCredentialResponse(response) {
    if (!response || !response.credential) {
        showToast('Không nhận được mã xác thực từ Google!', 'error');
        return;
    }

    try {
        showToast('Đang xác thực tài khoản Google sinh viên BUH...', 'info');
        const res = await window.api.auth.googleLogin(response.credential);
        const { user, accessToken } = res.data;

        window.api.setToken(accessToken);
        currentUser = {
            id: user.id,
            name: user.full_name,
            role: user.role,
            studentId: user.student_id,
            email: user.email,
            avatar: user.avatar_url
        };

        showToast(`Đăng nhập thành công! Xin chào ${currentUser.name} (MSSV: ${currentUser.studentId || 'Chưa cập nhật'})`);
        loginSuccess(true);
    } catch (err) {
        showToast(err.message || 'Đăng nhập Google thất bại!', 'error');
    }
}

function loginSuccess(showWelcome = false) {
    if (!currentUser) return;

    if (showWelcome) {
        showToast(`Chào mừng, ${currentUser.name}!`);
    }

    document.getElementById('topbar')?.classList.remove('hidden');

    const nameDisplay = document.getElementById('user-name-display');
    const avatarDisplay = document.getElementById('user-avatar');
    const roleDisplay = document.getElementById('user-role-display');

    if (nameDisplay) nameDisplay.textContent = currentUser.name;
    if (avatarDisplay) {
        if (currentUser.avatar) {
            avatarDisplay.innerHTML = `<img src="${currentUser.avatar}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;" alt="Avatar">`;
        } else {
            avatarDisplay.textContent = currentUser.name.charAt(0).toUpperCase();
        }
    }

    const roleLabels = { admin: 'Admin', manager: 'Ban Quản Trị', user: 'Sinh Viên' };
    if (roleDisplay) roleDisplay.textContent = roleLabels[currentUser.role] || 'Sinh Viên';

    renderSidebarMenu();

    // Điều hướng vào trang phù hợp với vai trò
    navigateToRoute(window.location.hash || getDefaultRouteForRole(), { replace: true }).catch((error) => {
        console.error('Route sync error:', error);
    });
}
