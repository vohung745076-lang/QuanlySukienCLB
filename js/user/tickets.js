/* ============================================================
   user/tickets.js — Vé của Tôi
   ============================================================ */

async function renderUserTickets() {
    const list = document.getElementById('my-tickets-list');
    list.innerHTML = '<p style="color:var(--text-muted)">Đang tải vé...</p>';

    const { data: myTickets, error } = await supabase
        .from('tickets')
        .select('*, events(name, date, location, benefits)')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false });

    if (error) {
        list.innerHTML = '<p style="color:var(--error)">Không tải được vé. Thử lại.</p>';
        return;
    }

    userTickets = myTickets || [];

    if (userTickets.length === 0) {
        list.innerHTML = '<p style="color:var(--text-muted)">Bạn chưa đăng ký sự kiện nào. <a href="#" onclick="document.querySelector(\'#nav-explore\')?.click()">Khám phá ngay →</a></p>';
        return;
    }

    list.innerHTML = '';

    userTickets.forEach(ticket => {
        const evt = ticket.events;
        if (!evt) return;

        const statusClass = ticket.status === 'valid' ? 'status-valid' : 'status-used';
        const statusText  = ticket.status === 'valid' ? 'HỢP LỆ' : 'ĐÃ SỬ DỤNG';

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
                <p><strong>🕒 Thời gian:</strong> ${formatDate(evt.date)}</p>
                <p><strong>📍 Địa điểm:</strong> ${evt.location || '---'}</p>
                ${evt.benefits ? `<p><strong>🎁 Quyền lợi:</strong> ${evt.benefits}</p>` : ''}
            </div>
        `;
        list.appendChild(div);
    });
}
