/* ============================================================
   utils.js - Helper Functions dùng chung toàn app
   ============================================================ */

const APP_ROUTES = {
    '#/auth/login': {
        viewId: 'view-auth',
        roles: ['guest'],
        authForm: 'form-login'
    },
    '#/auth/register': {
        viewId: 'view-auth',
        roles: ['guest'],
        authForm: 'form-register'
    },
    '#/user/explore': {
        viewId: 'view-explore',
        roles: ['user'],
        render: 'renderUserExplore'
    },
    '#/user/tickets': {
        viewId: 'view-tickets',
        roles: ['user'],
        render: 'renderUserTickets'
    },
    '#/admin/dashboard': {
        viewId: 'view-dashboard',
        roles: ['admin', 'manager'],
        render: 'renderAdminDashboard'
    },
    '#/admin/users': {
        viewId: 'view-users',
        roles: ['admin'],
        render: 'renderUserManagement'
    },
    '#/admin/checkin': {
        viewId: 'view-checkin',
        roles: ['admin', 'manager'],
        render: 'renderCheckinSystem'
    }
};

function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function getCurrentRole() {
    return currentUser?.role || 'guest';
}

function getDefaultRouteForRole(role = getCurrentRole()) {
    if (role === 'admin' || role === 'manager') return '#/admin/dashboard';
    if (role === 'user') return '#/user/explore';
    return '#/auth/login';
}

function normalizeRoute(route) {
    if (!route || route === '#') return getDefaultRouteForRole();
    return APP_ROUTES[route] ? route : getDefaultRouteForRole();
}

function canAccessRoute(route, role = getCurrentRole()) {
    const config = APP_ROUTES[route];
    return !!config && config.roles.includes(role);
}

function getFallbackRouteForRoute(route, role = getCurrentRole()) {
    if (canAccessRoute(route, role)) return route;
    return getDefaultRouteForRole(role);
}

function getRouteForView(viewId, role = getCurrentRole()) {
    const route = Object.keys(APP_ROUTES).find((item) => {
        const config = APP_ROUTES[item];
        return config.viewId === viewId && config.roles.includes(role);
    });

    return route || getDefaultRouteForRole(role);
}

function setActiveAuthForm(formId = 'form-login') {
    document.querySelectorAll('.tab-btn').forEach((button) => {
        button.classList.toggle('active', button.dataset.target === formId);
    });

    document.querySelectorAll('.auth-form').forEach((form) => {
        form.classList.toggle('hidden', form.id !== formId);
    });
}

function setActiveNavByView(viewId) {
    document.querySelectorAll('.nav-item').forEach((item) => {
        item.classList.toggle('active', item.dataset.view === viewId);
    });
}

function switchView(viewId, options = {}) {
    const { updateHash = true } = options;

    document.querySelectorAll('.view').forEach((element) => {
        element.classList.remove('active');
        element.classList.add('hidden');
    });

    const target = document.getElementById(viewId);
    if (target) {
        target.classList.remove('hidden');
        target.classList.add('active');
    }

    setActiveNavByView(viewId);

    if (updateHash) {
        const route = getRouteForView(viewId);
        if (window.location.hash !== route) {
            window.location.hash = route;
        }
    }
}

async function navigateToRoute(route, options = {}) {
    const { replace = false } = options;

    const normalizedRoute = normalizeRoute(route);
    const resolvedRoute = getFallbackRouteForRoute(normalizedRoute);
    const config = APP_ROUTES[resolvedRoute];

    if (replace && window.location.hash !== resolvedRoute) {
        history.replaceState(null, '', resolvedRoute);
    } else if (!replace && window.location.hash !== resolvedRoute) {
        window.location.hash = resolvedRoute;
        return;
    }

    if (config.authForm) {
        setActiveAuthForm(config.authForm);
    }

    switchView(config.viewId, { updateHash: false });

    if (config.render && typeof window[config.render] === 'function') {
        await window[config.render]();
    }
}

async function syncRouteWithSession(options = {}) {
    const { replace = false } = options;
    await navigateToRoute(window.location.hash || getDefaultRouteForRole(), { replace });
}

function disableGoogleButtons() {
    document.querySelectorAll('.btn-google').forEach((btn) => {
        btn.setAttribute('disabled', 'disabled');
        btn.style.opacity = '0.6';
        btn.style.cursor = 'not-allowed';
        btn.title = 'Google Auth cần cấu hình Supabase OAuth';
    });
}

function formatDate(dateStr) {
    if (!dateStr) return '---';
    return new Date(dateStr).toLocaleString('vi-VN');
}

function formatDateShort(dateStr) {
    if (!dateStr) return '---';
    return new Date(dateStr).toLocaleDateString('vi-VN');
}

function getEventStatusHtml(evt) {
    const now = new Date();
    const start = new Date(evt.date);
    const end = new Date(evt.end_date || evt.date);

    if (evt.registered >= evt.capacity && now < start) {
        return '<span style="color: #f39c12; font-weight:600;">Đã đầy</span>';
    }
    if (now >= start && now <= end) {
        return '<span style="color:var(--success); font-weight:600;">Đang mở</span>';
    }
    if (now > end) {
        return '<span style="color:var(--error); font-weight:600;">Đã kết thúc</span>';
    }
    return '<span style="color:var(--primary); font-weight:600;">Sắp diễn ra</span>';
}

window.addEventListener('hashchange', () => {
    syncRouteWithSession();
});

document.addEventListener('DOMContentLoaded', () => {
    syncRouteWithSession({ replace: true });
});
