/**
 * BEECLUB Frontend RESTful API Client
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

let authToken = localStorage.getItem('beeclub_token') || null;

export function setAuthToken(token) {
  authToken = token;
  if (token) {
    localStorage.setItem('beeclub_token', token);
  } else {
    localStorage.removeItem('beeclub_token');
  }
}

export function getAuthToken() {
  return authToken || localStorage.getItem('beeclub_token');
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMsg = data?.message || `HTTP Error ${response.status}`;
    const error = new Error(errorMsg);
    error.statusCode = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  // Auth
  login: (username, password) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    }),

  register: (payload) =>
    request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  getMe: () => request('/auth/me'),

  // Member Hub (Users)
  getMemberHubStats: () => request('/users/stats'),

  getMembers: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/users?${query}`);
  },

  addMember: (payload) =>
    request('/users', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  updateMemberRole: (id, role) =>
    request(`/users/${id}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role })
    }),

  deleteMember: (id) =>
    request(`/users/${id}`, {
      method: 'DELETE'
    }),

  // Events
  getDashboardStats: () => request('/events/stats'),

  getEvents: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/events?${query}`);
  },

  createEvent: (payload) =>
    request('/events', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  updateEvent: (id, payload) =>
    request(`/events/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    }),

  deleteEvent: (id) =>
    request(`/events/${id}`, {
      method: 'DELETE'
    }),

  // Tickets
  bookTicket: (payload) =>
    request('/tickets/book', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  getMyTickets: () => request('/tickets/my-tickets'),

  getEventTickets: (eventId) => request(`/tickets/event/${eventId}`),

  // Check-in
  checkin: (payload) =>
    request('/checkin', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  getCheckinLogs: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/checkin/logs?${query}`);
  },

  clearCheckinLogs: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/checkin/logs?${query}`, {
      method: 'DELETE'
    });
  },

  // Export Excel
  getExcelDownloadUrl: (eventId = null) => {
    const query = eventId ? `?eventId=${eventId}` : '';
    return `${API_BASE_URL}/export/excel${query}`;
  }
};
