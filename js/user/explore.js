/* ============================================================
   user/explore.js - Kham pha & Dang ky su kien (User)
   ============================================================ */

async function renderUserExplore(searchTerm = '') {
    const grid = document.getElementById('explore-events-grid');
    grid.innerHTML = '<p style="color:var(--text-muted)">Đang tải sự kiện...</p>';

    const [
        { data: eventsData, error: eventsError },
        { data: myTickets, error: ticketsError }
    ] = await Promise.all([
        supabase
            .from('events')
            .select('*')
            .order('date', { ascending: true }),
        supabase
            .from('tickets')
            .select('event_id')
            .eq('user_id', currentUser.id)
    ]);

    if (eventsError) {
        grid.innerHTML = '<p>Không tải được sự kiện.</p>';
        return;
    }

    if (ticketsError) {
        showToast('Không tải được danh sách vé của bạn!', 'error');
    }

    events = eventsData || [];
    userTickets = myTickets || [];

    const registeredEventIds = new Set(userTickets.map((ticket) => ticket.event_id));
    const filtered = events.filter((eventItem) =>
        eventItem.name.toLowerCase().includes((searchTerm || '').toLowerCase())
    );

    grid.innerHTML = '';

    if (filtered.length === 0) {
        grid.innerHTML = '<p>Không có sự kiện nào phù hợp.</p>';
        return;
    }

    filtered.forEach((evt) => {
        const isRegistered = registeredEventIds.has(evt.id);
        const isFull = (evt.registered || 0) >= evt.capacity;

        const card = document.createElement('div');
        card.className = 'event-card';
        card.innerHTML = `
            <div class="event-card-img">
                <span class="event-date-badge">${formatDateShort(evt.date)}</span>
            </div>
            <div class="event-card-body">
                <h3 class="event-card-title">${evt.name}</h3>
                <div class="event-card-meta">
                    <span>📍 ${evt.location || '---'}</span>
                    <span>👥 ${evt.registered || 0}/${evt.capacity}</span>
                </div>
                <p class="event-card-desc">${evt.description || ''}</p>
                ${evt.benefits ? `<p style="font-size:0.85rem;color:var(--primary);margin-bottom:5px">🎁 <strong>Quyền lợi:</strong> ${evt.benefits}</p>` : ''}
                ${evt.sponsors ? `<p style="font-size:0.85rem;color:#757575;margin-bottom:10px">🤝 <strong>Tài trợ:</strong> ${evt.sponsors}</p>` : ''}
                ${isRegistered
                    ? '<button class="btn btn-outline btn-block" disabled>✅ Đã Đăng Ký</button>'
                    : isFull
                        ? '<button class="btn btn-outline btn-block" disabled>🚫 Đã Hết Vé</button>'
                        : `<button class="btn btn-primary btn-block" onclick="openRegisterModal('${evt.id}')">Đăng ký tham gia</button>`
                }
            </div>
        `;
        grid.appendChild(card);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('explore-search')?.addEventListener('input', (e) => {
        renderUserExplore(e.target.value);
    });

    document.getElementById('btn-close-register-modal')?.addEventListener('click', () => {
        document.getElementById('modal-register').classList.add('hidden');
    });

    document.getElementById('btn-cancel-register-modal')?.addEventListener('click', () => {
        document.getElementById('modal-register').classList.add('hidden');
    });

    document.getElementById('form-register-event')?.addEventListener('submit', handleRegisterEvent);
});

window.openRegisterModal = (eventId) => {
    const evt = events.find((eventItem) => eventItem.id === eventId);
    if (!evt || (evt.registered || 0) >= evt.capacity) return;

    document.getElementById('register-event-id').value = eventId;
    document.getElementById('register-event-name').textContent = evt.name;
    document.getElementById('reg-form-name').value = currentUser.name || '';
    document.getElementById('reg-form-email').value = currentUser.email || '';

    const sid = currentUser.studentId || '';
    const isGoogleUid = sid.length > 20;
    document.getElementById('reg-form-mssv').value = isGoogleUid ? '' : sid;

    document.getElementById('modal-register').classList.remove('hidden');
};

async function handleRegisterEvent(e) {
    e.preventDefault();

    const eventId = document.getElementById('register-event-id').value;
    const evt = events.find((eventItem) => eventItem.id === eventId);
    if (!evt || (evt.registered || 0) >= evt.capacity) return;

    const name = document.getElementById('reg-form-name').value.trim();
    const mssv = document.getElementById('reg-form-mssv').value.trim();
    const email = document.getElementById('reg-form-email').value.trim();

    const seq = String((evt.registered || 0) + 1).padStart(3, '0');
    const ticketCode = `${evt.id}-${seq}`;

    const { error: ticketError } = await supabase.from('tickets').insert({
        id: ticketCode,
        event_id: eventId,
        user_id: currentUser.id,
        status: 'valid',
        participant_name: name,
        participant_mssv: mssv,
        participant_email: email
    });

    if (ticketError) {
        showToast('Đăng ký thất bại! Thử lại sau.', 'error');
        return;
    }

    await supabase
        .from('events')
        .update({ registered: (evt.registered || 0) + 1 })
        .eq('id', eventId);

    document.getElementById('modal-register').classList.add('hidden');
    showToast(`Đăng ký thành công! 🎉 Mã vé: ${ticketCode}`);
    await renderUserExplore();
}
