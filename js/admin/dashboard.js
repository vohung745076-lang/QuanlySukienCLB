/* ============================================================
   admin/dashboard.js — Quản lý Sự kiện (Admin/Manager)
   ============================================================ */

const dashboardState = {
    searchTerm: '',
    statusFilter: 'all'
};

function getDashboardStatus(evt) {
    const now = new Date();
    const start = new Date(evt.date);
    const end = new Date(evt.end_date || evt.date);

    if (evt.registered >= evt.capacity && now < start) return 'full';
    if (now >= start && now <= end) return 'live';
    if (now > end) return 'completed';
    return 'upcoming';
}

function getDashboardStatusLabel(status) {
    const map = {
        all: 'Tất cả',
        upcoming: 'Sắp diễn ra',
        live: 'Đang diễn ra',
        completed: 'Đã kết thúc',
        full: 'Đã đầy'
    };

    return map[status] || 'Tất cả';
}

function getDashboardStatusBadge(status) {
    const labels = {
        upcoming: 'Sắp diễn ra',
        live: 'Đang diễn ra',
        completed: 'Đã kết thúc',
        full: 'Đã đầy'
    };

    return `<span class="dashboard-status-badge is-${status}">${labels[status] || 'Không rõ'}</span>`;
}

function getEventOccupancy(evt) {
    const capacity = Math.max(evt.capacity || 0, 0);
    const registered = Math.max(evt.registered || 0, 0);
    return capacity > 0 ? Math.min(100, Math.round((registered / capacity) * 100)) : 0;
}

function getDashboardTemplate() {
    return `
        <div class="dashboard-shell">
            <section class="dashboard-hero">
                <div class="dashboard-hero-copy">
                    <span class="dashboard-eyebrow">Operations Dashboard</span>
                    <h2>Tổng quan sự kiện</h2>
                    <p>Theo dõi tiến độ tổ chức, lượng đăng ký và thực trạng check-in trên cùng một dashboard rõ ràng hơn.</p>
                </div>
                <div class="dashboard-hero-actions">
                    <button class="btn btn-outline" id="btn-export-excel">Xuất dữ liệu SV</button>
                    <button class="btn btn-primary" id="btn-create-event">+ Tạo sự kiện mới</button>
                </div>
            </section>

            <section class="dashboard-overview">
                <div class="dashboard-stats">
                    <article class="stat-card stat-card-primary">
                        <div class="stat-card-label">Tổng sự kiện</div>
                        <div class="value" id="stat-total-events">0</div>
                        <p id="stat-total-events-note">Toàn bộ sự kiện đang được quản lý.</p>
                    </article>
                    <article class="stat-card">
                        <div class="stat-card-label">Lượt đăng ký</div>
                        <div class="value" id="stat-total-regs">0</div>
                        <p id="stat-total-regs-note">Tổng lượt sinh viên/khách đã đăng ký.</p>
                    </article>
                    <article class="stat-card">
                        <div class="stat-card-label">Đã check-in</div>
                        <div class="value" id="stat-total-checkins">0</div>
                        <p id="stat-total-checkins-note">Tình trạng tham dự thực tế trên toàn hệ thống.</p>
                    </article>
                    <article class="stat-card">
                        <div class="stat-card-label">Tỷ lệ lấp đầy</div>
                        <div class="value" id="stat-fill-rate">0%</div>
                        <p id="stat-fill-rate-note">So với tổng sức chứa các sự kiện.</p>
                    </article>
                </div>

                <aside class="dashboard-spotlight">
                    <div class="dashboard-spotlight-top">
                        <span class="dashboard-spotlight-label">Spotlight</span>
                        <span class="dashboard-spotlight-badge" id="dashboard-highlight-status">Chưa có dữ liệu</span>
                    </div>
                    <h3 id="dashboard-highlight-title">Chưa có sự kiện nào</h3>
                    <p id="dashboard-highlight-meta">Hãy tạo sự kiện mới để dashboard bắt đầu hiển thị số liệu.</p>
                    <div class="dashboard-progress">
                        <div class="dashboard-progress-track">
                            <div class="dashboard-progress-bar" id="dashboard-highlight-progress"></div>
                        </div>
                        <div class="dashboard-progress-text" id="dashboard-highlight-progress-text">0 / 0 đăng ký</div>
                    </div>
                    <div class="dashboard-highlight-meta-list">
                        <div>
                            <span>Check-in</span>
                            <strong id="dashboard-highlight-checkins">0</strong>
                        </div>
                        <div>
                            <span>Địa điểm</span>
                            <strong id="dashboard-highlight-location">---</strong>
                        </div>
                    </div>
                </aside>
            </section>

            <section class="event-list-container dashboard-table-panel">
                <div class="dashboard-panel-header">
                    <div>
                        <span class="dashboard-eyebrow">Event Registry</span>
                        <h3>Danh sách sự kiện</h3>
                        <p id="dashboard-records-text">Đang hiển thị toàn bộ sự kiện.</p>
                    </div>
                    <div class="dashboard-filter-tabs" id="dashboard-filter-tabs">
                        <button type="button" class="dashboard-filter-btn active" data-filter="all">Tất cả</button>
                        <button type="button" class="dashboard-filter-btn" data-filter="upcoming">Sắp diễn ra</button>
                        <button type="button" class="dashboard-filter-btn" data-filter="live">Đang diễn ra</button>
                        <button type="button" class="dashboard-filter-btn" data-filter="completed">Đã kết thúc</button>
                        <button type="button" class="dashboard-filter-btn" data-filter="full">Đã đầy</button>
                    </div>
                </div>

                <div class="dashboard-toolbar">
                    <div class="search-bar dashboard-search">
                        <input type="text" id="dashboard-search" placeholder="Tìm theo tên sự kiện hoặc mã sự kiện...">
                    </div>
                    <div class="dashboard-toolbar-note" id="dashboard-toolbar-note">Tracking theo thời gian thực cho toàn bộ event.</div>
                </div>

                <div class="table-responsive dashboard-table-wrap">
                    <table class="data-table dashboard-table">
                        <thead>
                            <tr>
                                <th>Sự kiện</th>
                                <th>Thời gian</th>
                                <th>Trạng thái</th>
                                <th>Địa điểm</th>
                                <th>Công suất</th>
                                <th>Hành động</th>
                            </tr>
                        </thead>
                        <tbody id="admin-events-tbody"></tbody>
                    </table>
                </div>
            </section>
        </div>
    `;
}

function ensureDashboardView() {
    const dashboardView = document.getElementById('view-dashboard');
    if (!dashboardView || dashboardView.dataset.dashboardReady === 'true') return;

    dashboardView.innerHTML = getDashboardTemplate();
    dashboardView.dataset.dashboardReady = 'true';

    document.getElementById('dashboard-search')?.addEventListener('input', (e) => {
        dashboardState.searchTerm = e.target.value;
        renderAdminDashboard();
    });

    document.getElementById('dashboard-filter-tabs')?.addEventListener('click', (e) => {
        const button = e.target.closest('.dashboard-filter-btn');
        if (!button) return;

        dashboardState.statusFilter = button.dataset.filter || 'all';
        document.querySelectorAll('.dashboard-filter-btn').forEach((item) => {
            item.classList.toggle('active', item === button);
        });
        renderAdminDashboard();
    });

    document.getElementById('btn-create-event')?.addEventListener('click', () => {
        document.getElementById('form-event').reset();
        document.getElementById('event-id').value = '';
        document.getElementById('modal-event-title').textContent = 'Tạo Sự kiện Mới';
        document.getElementById('modal-event').classList.remove('hidden');
    });

}

function renderDashboardSpotlight(nextEvent) {
    const statusEl = document.getElementById('dashboard-highlight-status');
    const titleEl = document.getElementById('dashboard-highlight-title');
    const metaEl = document.getElementById('dashboard-highlight-meta');
    const progressEl = document.getElementById('dashboard-highlight-progress');
    const progressTextEl = document.getElementById('dashboard-highlight-progress-text');
    const checkinsEl = document.getElementById('dashboard-highlight-checkins');
    const locationEl = document.getElementById('dashboard-highlight-location');

    if (!nextEvent) {
        statusEl.textContent = 'Chưa có dữ liệu';
        titleEl.textContent = 'Chưa có sự kiện nào';
        metaEl.textContent = 'Hãy tạo sự kiện mới để dashboard bắt đầu hiển thị số liệu.';
        progressEl.style.width = '0%';
        progressTextEl.textContent = '0 / 0 đăng ký';
        checkinsEl.textContent = '0';
        locationEl.textContent = '---';
        return;
    }

    const occupancy = getEventOccupancy(nextEvent);
    const status = getDashboardStatus(nextEvent);

    statusEl.textContent = getDashboardStatusLabel(status);
    titleEl.textContent = nextEvent.name;
    metaEl.textContent = `${formatDate(nextEvent.date)}${nextEvent.end_date ? ` • Kết thúc: ${formatDate(nextEvent.end_date)}` : ''}`;
    progressEl.style.width = `${occupancy}%`;
    progressTextEl.textContent = `${nextEvent.registered || 0} / ${nextEvent.capacity || 0} đăng ký`;
    checkinsEl.textContent = `${nextEvent.checkins || 0}`;
    locationEl.textContent = nextEvent.location || '---';
}

function renderDashboardStats(allEvents) {
    const totalEvents = allEvents.length;
    const totalReg = allEvents.reduce((sum, evt) => sum + (evt.registered || 0), 0);
    const totalCheckins = allEvents.reduce((sum, evt) => sum + (evt.checkins || 0), 0);
    const totalCapacity = allEvents.reduce((sum, evt) => sum + (evt.capacity || 0), 0);
    const fillRate = totalCapacity > 0 ? Math.round((totalReg / totalCapacity) * 100) : 0;
    const liveCount = allEvents.filter((evt) => getDashboardStatus(evt) === 'live').length;
    const upcomingCount = allEvents.filter((evt) => getDashboardStatus(evt) === 'upcoming').length;

    document.getElementById('stat-total-events').textContent = totalEvents;
    document.getElementById('stat-total-regs').textContent = totalReg;
    document.getElementById('stat-total-checkins').textContent = totalCheckins;
    document.getElementById('stat-fill-rate').textContent = `${fillRate}%`;

    document.getElementById('stat-total-events-note').textContent = `${upcomingCount} sự kiện sắp diễn ra, ${liveCount} sự kiện đang hoạt động.`;
    document.getElementById('stat-total-regs-note').textContent = totalEvents ? `Trung bình ${Math.round(totalReg / totalEvents)} lượt / sự kiện.` : 'Chưa có dữ liệu đăng ký.';
    document.getElementById('stat-total-checkins-note').textContent = totalReg ? `${Math.round((totalCheckins / totalReg) * 100)}% người đăng ký đã check-in.` : 'Chưa có dữ liệu check-in.';
    document.getElementById('stat-fill-rate-note').textContent = totalCapacity ? `${totalReg} / ${totalCapacity} chỗ đã được lấp.` : 'Chưa cấu hình sức chứa cho sự kiện.';
}

function renderDashboardRows(filteredEvents, allEvents) {
    const tbody = document.getElementById('admin-events-tbody');
    const recordsText = document.getElementById('dashboard-records-text');
    const toolbarNote = document.getElementById('dashboard-toolbar-note');
    tbody.innerHTML = '';

    recordsText.textContent = `Hiển thị ${filteredEvents.length} / ${allEvents.length} sự kiện • Bộ lọc: ${getDashboardStatusLabel(dashboardState.statusFilter)}.`;
    toolbarNote.textContent = dashboardState.searchTerm
        ? `Kết quả cho từ khóa "${dashboardState.searchTerm}".`
        : 'Tracking theo thời gian thực cho toàn bộ event.';

    if (filteredEvents.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="dashboard-empty-state">
                    Không tìm thấy sự kiện phù hợp với điều kiện hiện tại.
                </td>
            </tr>
        `;
        return;
    }

    filteredEvents.forEach((evt) => {
        const canEdit = currentUser.role === 'admin' || evt.creator_id === currentUser.id;
        const status = getDashboardStatus(evt);
        const occupancy = getEventOccupancy(evt);
        const start = new Date(evt.date);
        const end = new Date(evt.end_date || evt.date);
        const dateStr = evt.end_date
            ? `${start.toLocaleString('vi-VN')}<br><small>Đến: ${end.toLocaleString('vi-VN')}</small>`
            : start.toLocaleString('vi-VN');

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                <div class="dashboard-event-cell">
                    <strong>${evt.name}</strong>
                    <span>${evt.id}</span>
                </div>
            </td>
            <td>${dateStr}</td>
            <td>${getDashboardStatusBadge(status)}</td>
            <td>${evt.location || '---'}</td>
            <td>
                <div class="dashboard-capacity-cell">
                    <div class="dashboard-capacity-top">
                        <strong>${evt.registered || 0} / ${evt.capacity || 0}</strong>
                        <span>${occupancy}%</span>
                    </div>
                    <div class="dashboard-mini-progress">
                        <span style="width:${occupancy}%"></span>
                    </div>
                    <small>${evt.checkins || 0} check-in</small>
                </div>
            </td>
            <td>
                ${canEdit
                    ? `<div class="dashboard-actions">
                            <button class="btn btn-sm btn-outline" onclick="viewEventUsers('${evt.id}')">Danh sách</button>
                            <button class="btn btn-sm btn-outline" onclick="editEvent('${evt.id}')">Sửa</button>
                            <button class="btn btn-sm btn-outline dashboard-btn-danger" onclick="deleteEvent('${evt.id}')">Xóa</button>
                       </div>`
                    : '<span class="dashboard-no-access">Không đủ quyền</span>'
                }
            </td>
        `;
        tbody.appendChild(tr);
    });
}

async function renderAdminDashboard() {
    ensureDashboardView();

    const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('date', { ascending: true });

    if (error) {
        showToast('Không tải được danh sách sự kiện!', 'error');
        return;
    }

    events = data || [];
    renderDashboardStats(events);

    const searchValue = dashboardState.searchTerm.trim().toLowerCase();
    const filtered = events.filter((evt) => {
        const matchesSearch = !searchValue
            || evt.name.toLowerCase().includes(searchValue)
            || evt.id.toLowerCase().includes(searchValue);
        const status = getDashboardStatus(evt);
        const matchesStatus = dashboardState.statusFilter === 'all' || status === dashboardState.statusFilter;
        return matchesSearch && matchesStatus;
    });

    const spotlightEvent = [...events].sort((a, b) => {
        const aStatus = getDashboardStatus(a);
        const bStatus = getDashboardStatus(b);
        const aPriority = aStatus === 'live' ? 0 : aStatus === 'upcoming' ? 1 : 2;
        const bPriority = bStatus === 'live' ? 0 : bStatus === 'upcoming' ? 1 : 2;
        if (aPriority !== bPriority) return aPriority - bPriority;
        return new Date(a.date) - new Date(b.date);
    })[0];

    renderDashboardSpotlight(spotlightEvent);
    renderDashboardRows(filtered, events);
}

document.addEventListener('DOMContentLoaded', () => {
    ensureDashboardView();

    document.getElementById('btn-close-modal')?.addEventListener('click', () => closeEventModal());
    document.getElementById('btn-cancel-modal')?.addEventListener('click', () => closeEventModal());
    document.getElementById('form-event')?.addEventListener('submit', handleEventFormSubmit);

    document.getElementById('btn-close-event-users-modal')?.addEventListener('click', () =>
        document.getElementById('modal-event-users').classList.add('hidden'));
    document.getElementById('btn-close-event-users-bottom')?.addEventListener('click', () =>
        document.getElementById('modal-event-users').classList.add('hidden'));
});

function closeEventModal() {
    document.getElementById('modal-event').classList.add('hidden');
}

async function handleEventFormSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('event-id').value;
    const payload = {
        name: document.getElementById('event-name').value,
        date: document.getElementById('event-date').value,
        end_date: document.getElementById('event-end-date').value,
        capacity: parseInt(document.getElementById('event-capacity').value),
        location: document.getElementById('event-location').value,
        description: document.getElementById('event-desc').value,
        benefits: document.getElementById('event-benefits').value,
        sponsors: document.getElementById('event-sponsors').value,
    };

    if (id) {
        const { error } = await supabase.from('events').update(payload).eq('id', id);
        if (error) {
            showToast('Cập nhật thất bại!', 'error');
            return;
        }
        showToast('Đã cập nhật sự kiện!');
    } else {
        const newId = `EVT-${Date.now().toString().slice(-6)}`;
        const { error } = await supabase.from('events').insert({
            id: newId,
            ...payload,
            registered: 0,
            checkins: 0,
            creator_id: currentUser.id
        });
        if (error) {
            showToast('Tạo sự kiện thất bại!', 'error');
            return;
        }
        showToast('Đã tạo sự kiện mới!');
    }

    closeEventModal();
    await renderAdminDashboard();
}

window.editEvent = async (id) => {
    const evt = events.find((item) => item.id === id);
    if (!evt) return;

    document.getElementById('event-id').value = evt.id;
    document.getElementById('event-name').value = evt.name;
    document.getElementById('event-date').value = evt.date?.slice(0, 16) || '';
    document.getElementById('event-end-date').value = evt.end_date?.slice(0, 16) || '';
    document.getElementById('event-capacity').value = evt.capacity;
    document.getElementById('event-location').value = evt.location || '';
    document.getElementById('event-desc').value = evt.description || '';
    document.getElementById('event-benefits').value = evt.benefits || '';
    document.getElementById('event-sponsors').value = evt.sponsors || '';

    document.getElementById('modal-event-title').textContent = 'Chỉnh sửa Sự kiện';
    document.getElementById('modal-event').classList.remove('hidden');
};

window.deleteEvent = async (id) => {
    if (!confirm('Bạn có chắc muốn xóa sự kiện này? Toàn bộ vé liên quan sẽ bị xóa!')) return;

    const { error } = await supabase.from('events').delete().eq('id', id);
    if (error) {
        showToast('Xóa thất bại!', 'error');
        return;
    }

    showToast('Đã xóa sự kiện.');
    await renderAdminDashboard();
};

window.viewEventUsers = async (eventId) => {
    const evt = events.find((item) => item.id === eventId);
    if (!evt) return;

    document.getElementById('view-users-event-name').textContent = evt.name;
    const tbody = document.getElementById('event-users-tbody');
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center">Đang tải...</td></tr>';
    document.getElementById('modal-event-users').classList.remove('hidden');

    const { data: participants, error } = await supabase
        .from('tickets')
        .select('*')
        .eq('event_id', eventId)
        .order('created_at', { ascending: true });

    if (error) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--error)">Không tải được danh sách!</td></tr>';
        return;
    }

    if (!participants || participants.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center">Chưa có ai đăng ký sự kiện này.</td></tr>';
        return;
    }

    tbody.innerHTML = '';
    participants.forEach((participant, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${index + 1}</td>
            <td style="font-family:monospace;font-weight:bold">${participant.id}</td>
            <td>${participant.participant_mssv || '---'}</td>
            <td>${participant.participant_name || 'Khách'}</td>
            <td>${participant.status === 'used'
                ? '<span style="color:var(--success);font-weight:bold">Đã Check-in</span>'
                : '<span style="color:var(--text-muted)">Hợp lệ</span>'
            }</td>
        `;
        tbody.appendChild(tr);
    });
};
