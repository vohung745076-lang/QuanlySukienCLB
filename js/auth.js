/* ============================================================
   auth.js - Supabase Authentication
   Login (Email/MSSV + Password), Register, Google OAuth, Logout
   ============================================================ */

let authResolutionPromise = null;
let authResolutionUserId = null;

document.addEventListener('DOMContentLoaded', () => {
    setupAuthTabs();
    restoreSession();
    setupAuthListeners();
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
    console.log('Checking Supabase session...');

    const {
        data: { session },
        error
    } = await supabase.auth.getSession();

    if (error) {
        console.error('Session error:', error);
        return;
    }

    if (!session?.user) return;

    console.log('User found:', session.user.id);
    const hasProfile = await resolveAuthenticatedUser(session.user.id);

    if (!hasProfile) {
        console.error('Profile not found for logged in user.');
        showToast('Không tìm thấy thông tin Profile. Vui lòng kiểm tra lại SQL!', 'error');
    }
}

async function loadUserProfile(authId, options = {}) {
    const { silentMissing = false } = options;

    console.log('Fetching profile from Supabase...');
    const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authId)
        .maybeSingle();

    if (error) {
        console.error('Lỗi truy vấn Profiles:', error.message);
        if (error.message.includes('relation "public.profiles" does not exist')) {
            showToast('LỖI: Bạn chưa chạy file supabase_setup.sql trên Dashboard!', 'error');
        }
        return false;
    }

    if (!profile) {
        if (!silentMissing) {
            console.warn('User authenticated but no profile record found.');
        }
        return false;
    }

    currentUser = {
        id: profile.id,
        name: profile.name || 'Thành viên',
        role: profile.role || 'user',
        studentId: profile.student_id,
        email: profile.email
    };

    console.log('Current User set:', currentUser);
    return true;
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForUserProfile(authId, options = {}) {
    const { retries = 5, delayMs = 200 } = options;

    for (let attempt = 0; attempt < retries; attempt += 1) {
        const hasProfile = await loadUserProfile(authId, {
            silentMissing: attempt < retries - 1
        });

        if (hasProfile) return true;

        if (attempt < retries - 1) {
            await sleep(delayMs);
        }
    }

    return false;
}

async function resolveAuthenticatedUser(authId, options = {}) {
    const { waitForProfile = false } = options;

    if (!authId) return false;

    if (authResolutionPromise && authResolutionUserId === authId) {
        return authResolutionPromise;
    }

    authResolutionUserId = authId;
    authResolutionPromise = (async () => {
        const hasProfile = waitForProfile
            ? await waitForUserProfile(authId)
            : await loadUserProfile(authId);

        if (hasProfile) {
            loginSuccess();
        }

        return hasProfile;
    })();

    try {
        return await authResolutionPromise;
    } finally {
        authResolutionPromise = null;
        authResolutionUserId = null;
    }
}

document.getElementById('form-login').addEventListener('submit', async (e) => {
    e.preventDefault();

    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Đang xử lý...';

    const input = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;

    try {
        let email = input;

        if (!input.includes('@')) {
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('email')
                .eq('student_id', input)
                .maybeSingle();

            if (profileError || !profile?.email) {
                showToast('Không tìm thấy Email tương ứng với MSSV này!', 'error');
                return;
            }

            email = profile.email;
        }

        const { data, error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
            const message = error.message === 'Invalid login credentials'
                ? 'Sai email hoặc mật khẩu!'
                : error.message;
            showToast(`Đăng nhập thất bại: ${message}`, 'error');
            return;
        }

        const hasProfile = await resolveAuthenticatedUser(data.user.id);
        if (!hasProfile) {
            showToast('Đăng nhập thành công nhưng chưa có Profile. Vui lòng cập nhật SQL!', 'error');
        }
    } catch (err) {
        console.error('Login catch error:', err);
        showToast('Có lỗi xảy ra!', 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Đăng nhập';
    }
});

document.getElementById('form-register').addEventListener('submit', async (e) => {
    e.preventDefault();

    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Đang xử lý...';

    const name = document.getElementById('reg-name').value.trim();
    const studentId = document.getElementById('reg-studentid').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;

    try {
        if (!name || !studentId || !email || !password) {
            showToast('Vui lòng điền đầy đủ thông tin!', 'error');
            return;
        }

        if (password.length < 6) {
            showToast('Mật khẩu phải có ít nhất 6 ký tự!', 'error');
            return;
        }

        const { data: existingUser } = await supabase
            .from('profiles')
            .select('email, student_id')
            .or(`email.eq.${email},student_id.eq.${studentId}`)
            .maybeSingle();

        if (existingUser) {
            if (existingUser.email === email) {
                showToast('Email này đã được sử dụng. Vui lòng đăng nhập!', 'error');
            } else {
                showToast('MSSV này đã được liên kết với tài khoản khác!', 'error');
            }
            return;
        }

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: name,
                    student_id: studentId
                }
            }
        });

        if (error) {
            if (error.message.includes('already registered')) {
                showToast('Email này đã được đăng ký. Vui lòng đăng nhập!', 'error');
            } else {
                showToast(`Lỗi: ${error.message}`, 'error');
            }
            return;
        }

        if (data.session?.user) {
            const hasProfile = await resolveAuthenticatedUser(data.session.user.id, { waitForProfile: true });

            if (hasProfile) {
                showToast('Đăng ký thành công! Chào mừng bạn!', 'success');
            } else {
                showToast('Đăng ký thành công nhưng Profile chưa sẵn sàng. Vui lòng thử lại sau ít giây.', 'error');
            }
            return;
        }

        showToast('Vui lòng kiểm tra email để xác nhận tài khoản rồi đăng nhập lại.');
    } catch (err) {
        console.error('Lỗi Đăng ký:', err);
        showToast(`Có lỗi không mong muốn: ${err.message}`, 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Đăng ký';
    }
});

document.querySelectorAll('.btn-google').forEach((btn) => {
    btn.addEventListener('click', async () => {
        if (window.location.protocol === 'file:') {
            showToast('Vui lòng chạy qua local server (http://localhost) để dùng Google OAuth!', 'error');
            console.warn('Google OAuth không hoạt động khi mở file trực tiếp (file://).');
            return;
        }

        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.href.split('?')[0]
            }
        });

        if (error) {
            showToast(`Đăng nhập Google thất bại: ${error.message}`, 'error');
            console.error('OAuth Error:', error);
        }
    });
});

document.getElementById('btn-logout').addEventListener('click', async () => {
    await supabase.auth.signOut();
    currentUser = null;
    events = [];
    userTickets = [];
    checkinLogs = [];
    users = [];

    document.getElementById('topbar')?.classList.add('hidden');
    await navigateToRoute('#/auth/login', { replace: true });
    showToast('Đã đăng xuất');
});

function loginSuccess() {
    if (!currentUser) return;

    showToast(`Chào mừng, ${currentUser.name}!`);
    document.getElementById('topbar')?.classList.remove('hidden');

    document.getElementById('user-name-display').textContent = currentUser.name;
    document.getElementById('user-avatar').textContent = currentUser.name.charAt(0).toUpperCase();

    const roleLabels = { admin: 'Super Admin', manager: 'Ban Tổ Chức', user: 'Thành viên' };
    document.getElementById('user-role-display').textContent = roleLabels[currentUser.role] || 'Thành viên';

    renderSidebarMenu();

    navigateToRoute(window.location.hash || getDefaultRouteForRole(), { replace: true }).catch((error) => {
        console.error('Route sync error:', error);
        showToast('Không tải được trang sau đăng nhập!', 'error');
    });
}

function setupAuthListeners() {
    supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user && !currentUser) {
            await resolveAuthenticatedUser(session.user.id, { waitForProfile: true });
        }

        if (event === 'SIGNED_OUT') {
            currentUser = null;
        }
    });
}
