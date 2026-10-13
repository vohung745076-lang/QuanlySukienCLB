/* ============================================================
   api.js — Unified RESTful API Client for BEECLUB BUH
   Quản lý token JWT, tự động đính kèm header xác thực
   ============================================================ */

(function () {
    const TOKEN_KEY = 'beeclub_jwt_token';

    function getToken() {
        return localStorage.getItem(TOKEN_KEY) || null;
    }

    function setToken(token) {
        if (token) {
            localStorage.setItem(TOKEN_KEY, token);
        } else {
            localStorage.removeItem(TOKEN_KEY);
        }
    }

    async function request(endpoint, options = {}) {
        const baseUrl = (window.CONFIG && window.CONFIG.API_BASE_URL) || 'http://localhost:5000/api/v1';
        const url = `${baseUrl}${endpoint}`;

        const headers = {
            'Content-Type': 'application/json',
            ...(options.headers || {})
        };

        const token = getToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        try {
            const response = await fetch(url, {
                ...options,
                headers
            });

            const data = await response.json().catch(() => null);

            if (!response.ok) {
                const errorMsg = data?.message || `HTTP Error ${response.status}: Yêu cầu thất bại`;
                const error = new Error(errorMsg);
                error.statusCode = response.status;
                error.data = data;
                throw error;
            }

            return data;
        } catch (err) {
            if (err.statusCode) throw err;
            const netError = new Error('Không thể kết nối đến máy chủ Backend API (' + baseUrl + '). Vui lòng kiểm tra server!');
            netError.statusCode = 0;
            throw netError;
        }
    }

    window.api = {
        getToken,
        setToken,

        // 1. Xác thực (Auth)
        auth: {
            login: (username, password) =>
                request('/auth/login', {
                    method: 'POST',
                    body: JSON.stringify({ username, password })
                }),

            googleLogin: (idToken) =>
                request('/auth/google-login', {
                    method: 'POST',
                    body: JSON.stringify({ idToken })
                }),

            register: (payload) =>
                request('/auth/register', {
                    method: 'POST',
                    body: JSON.stringify(payload)
                }),

            getMe: () => request('/auth/me'),

            logout: () => {
                setToken(null);
            }
        },

        // 2. Sự kiện (Events)
        events: {
            getAll: (params = {}) => {
                const query = new URLSearchParams(params).toString();
                return request(`/events?${query}`);
            },

            getById: (id) => request(`/events/${id}`),

            getStats: () => request('/events/stats'),

            create: (payload) =>
                request('/events', {
                    method: 'POST',
                    body: JSON.stringify(payload)
                }),

            update: (id, payload) =>
                request(`/events/${id}`, {
                    method: 'PUT',
                    body: JSON.stringify(payload)
                }),

            delete: (id) =>
                request(`/events/${id}`, {
                    method: 'DELETE'
                })
        },

        // 3. Đặt vé & Vé điện tử (Tickets)
        tickets: {
            book: (payload) =>
                request('/tickets/book', {
                    method: 'POST',
                    body: JSON.stringify(payload)
                }),

            getMyTickets: () => request('/tickets/my-tickets'),

            getEventTickets: (eventId) => request(`/tickets/event/${eventId}`)
        },

        // 4. Check-in & Quét QR (Checkin)
        checkin: {
            checkin: (payload) =>
                request('/checkin', {
                    method: 'POST',
                    body: JSON.stringify(payload)
                }),

            getLogs: (params = {}) => {
                const query = new URLSearchParams(params).toString();
                return request(`/checkin/logs?${query}`);
            },

            clearLogs: (params = {}) => {
                const query = new URLSearchParams(params).toString();
                return request(`/checkin/logs?${query}`, {
                    method: 'DELETE'
                });
            }
        },

        // 5. Quản lý Hội viên (Users Hub)
        users: {
            getStats: () => request('/users/stats'),

            getAll: (params = {}) => {
                const query = new URLSearchParams(params).toString();
                return request(`/users?${query}`);
            },

            create: (payload) =>
                request('/users', {
                    method: 'POST',
                    body: JSON.stringify(payload)
                }),

            updateRole: (id, role) =>
                request(`/users/${id}/role`, {
                    method: 'PATCH',
                    body: JSON.stringify({ role })
                }),

            delete: (id) =>
                request(`/users/${id}`, {
                    method: 'DELETE'
                })
        },

        // 6. Xuất dữ liệu Excel
        export: {
            getDownloadUrl: (eventId = null) => {
                const baseUrl = (window.CONFIG && window.CONFIG.API_BASE_URL) || 'http://localhost:5000/api/v1';
                const token = getToken();
                const queryParams = new URLSearchParams();
                if (token) queryParams.set('token', token);
                if (eventId) queryParams.set('eventId', eventId);
                return `${baseUrl}/export/excel?${queryParams.toString()}`;
            }
        }
    };
})();
