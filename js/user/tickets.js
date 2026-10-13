/* ============================================================
   user/tickets.js — Vé Điện Tử Của Tôi (Sinh Viên BUH)
   Hiển thị mã QR Code thực tế sắc nét sẵn sàng để check-in màn hình
   ============================================================ */

async function renderUserTickets() {
    const list = document.getElementById('my-tickets-list');
    if (!list) return;
    list.innerHTML = '<p style="color:var(--text-muted);padding:20px;">Đang tải danh sách vé điện tử...</p>';

    try {
        const res = await window.api.tickets.getMyTickets();
        userTickets = res.data || [];

        if (userTickets.length === 0) {
            list.innerHTML = `
                <div class="glass-panel" style="padding:40px 20px;text-align:center;">
                    <div style="font-size:3rem;margin-bottom:15px;">🎟️</div>
                    <h3 style="margin-bottom:10px;">Bạn chưa có vé sự kiện nào</h3>
                    <p style="color:var(--text-muted);margin-bottom:20px;">
                        Khám phá ngay các sự kiện của Trường Đại học Ngân hàng BUH để nhận vé điện tử!
                    </p>
                    <a href="#/user/explore" class="btn btn-primary">Khám Phá Sự Kiện Ngay →</a>
                </div>
            `;
            return;
        }

        list.innerHTML = '';

        userTickets.forEach((ticket) => {
            const evt = ticket.event || {};
            const isValid = ticket.status === 'valid';
            const statusClass = isValid ? 'status-valid' : 'status-used';
            const statusText = isValid ? '✅ HỢP LỆ (CHƯA QUÉT)' : '🏁 ĐÃ CHECK-IN';
            const statusBg = isValid ? 'rgba(0,184,148,0.15)' : 'rgba(255,255,255,0.1)';
            const statusColor = isValid ? '#00b894' : 'var(--text-muted)';

            const eventTime = evt.startTime ? new Date(evt.startTime).toLocaleString('vi-VN') : '---';
            const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(ticket.ticketCode)}`;

            const div = document.createElement('div');
            div.className = 'ticket-item glass-panel';
            div.style.cssText = 'display:flex;flex-wrap:wrap;gap:20px;padding:20px;margin-bottom:20px;border-radius:14px;background:rgba(20,20,22,0.8);border:1px solid rgba(245,197,24,0.25);';
            
            div.innerHTML = `
                <div class="ticket-qr" style="text-align:center;background:#fff;padding:12px;border-radius:10px;display:flex;flex-direction:column;align-items:center;justify-content:center;min-width:180px;">
                    <img src="${qrCodeUrl}" alt="QR Ticket Code" style="width:160px;height:160px;display:block;" />
                    <div class="ticket-code" style="margin-top:8px;font-family:monospace;font-size:0.8rem;color:#000;font-weight:700;word-break:break-all;">
                        ${ticket.ticketCode}
                    </div>
                </div>
                <div class="ticket-details" style="flex:1;min-width:260px;">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
                        <span class="ticket-status ${statusClass}" style="background:${statusBg};color:${statusColor};padding:4px 12px;border-radius:20px;font-weight:700;font-size:0.85rem;">
                            ${statusText}
                        </span>
                        <span style="font-size:0.85rem;color:var(--text-muted);">MSSV: <strong style="color:var(--text-primary);">${ticket.participantMssv || '---'}</strong></span>
                    </div>

                    <h3 style="margin:0 0 10px 0;font-size:1.3rem;color:var(--brand-gold,#f5c518);">${evt.title || 'Sự kiện BUH'}</h3>
                    <p style="margin:4px 0;color:var(--text-secondary);font-size:0.95rem;">👤 <strong>Sinh viên:</strong> ${ticket.participantName || '---'}</p>
                    <p style="margin:4px 0;color:var(--text-secondary);font-size:0.95rem;">🕒 <strong>Thời gian:</strong> ${eventTime}</p>
                    <p style="margin:4px 0;color:var(--text-secondary);font-size:0.95rem;">📍 <strong>Địa điểm:</strong> ${evt.location || 'BUH'}</p>
                    ${evt.benefits ? `<p style="margin:8px 0 0 0;font-size:0.85rem;color:#00cec9;">🎁 <strong>Quyền lợi:</strong> ${evt.benefits}</p>` : ''}
                    
                    <div style="margin-top:15px;padding-top:10px;border-top:1px dashed rgba(255,255,255,0.1);font-size:0.8rem;color:var(--text-muted);">
                        💡 <em>Xuất trình màn hình có mã QR này cho Ban Tổ Chức tại cửa sự kiện để được check-in quét mã.</em>
                    </div>
                </div>
            `;
            list.appendChild(div);
        });
    } catch (err) {
        list.innerHTML = `<p style="color:var(--error);padding:20px;">Lỗi tải vé: ${err.message}</p>`;
    }
}
