/* ============================================================
   user/explore.js — Khám Phá & Đăng Ký Sự Kiện (Sinh Viên BUH)
   Tự động mở sự kiện khi quét QR poster, Đăng ký vé an toàn qua API
   ============================================================ */

async function renderUserExplore(searchTerm = '') {
    const grid = document.getElementById('explore-events-grid');
    if (!grid) return;
    grid.innerHTML = '<p style="color:var(--text-muted);padding:20px;">Đang tải danh sách sự kiện BUH...</p>';

    try {
        const [eventsRes, ticketsRes] = await Promise.all([
            window.api.events.getAll({ search: searchTerm, limit: 50 }),
            window.api.tickets.getMyTickets().catch(() => ({ data: [] }))
        ]);

        events = eventsRes.data || [];
        userTickets = ticketsRes.data || [];

        const registeredEventIds = new Set(userTickets.map((t) => t.event_id));

        grid.innerHTML = '';

        if (events.length === 0) {
            grid.innerHTML = '<p style="padding:20px;color:var(--text-muted);">Hiện tại chưa có sự kiện nào phù hợp.</p>';
            return;
        }

        events.forEach((evt) => {
            const isRegistered = registeredEventIds.has(evt.id);
            const isFull = (evt.registered_count || 0) >= evt.capacity;
            const eventDate = evt.start_time ? new Date(evt.start_time).toLocaleDateString('vi-VN') : '---';

            const card = document.createElement('div');
            card.className = 'event-card glass-panel';
            card.innerHTML = `
                <div class="event-card-img" style="background:linear-gradient(135deg, rgba(245,197,24,0.15), rgba(224,36,94,0.15));padding:20px;border-radius:12px;position:relative;">
                    <span class="event-date-badge" style="background:var(--brand-gold,#f5c518);color:#000;padding:4px 10px;border-radius:6px;font-weight:700;font-size:0.85rem;">📅 ${eventDate}</span>
                    <span style="float:right;font-family:monospace;font-size:0.8rem;background:rgba(255,255,255,0.1);padding:4px 8px;border-radius:4px;color:var(--text-muted);">${evt.code}</span>
                </div>
                <div class="event-card-body" style="padding:15px 0;">
                    <h3 class="event-card-title" style="margin-bottom:8px;font-size:1.2rem;">${evt.title}</h3>
                    <div class="event-card-meta" style="color:var(--text-muted);font-size:0.9rem;margin-bottom:10px;display:flex;gap:15px;">
                        <span>📍 ${evt.location || 'Hội trường BUH'}</span>
                        <span>👥 ${evt.registered_count || 0}/${evt.capacity} vé</span>
                    </div>
                    <p class="event-card-desc" style="color:var(--text-secondary);font-size:0.95rem;margin-bottom:12px;line-height:1.5;">${evt.description || ''}</p>
                    ${evt.benefits ? `<p style="font-size:0.85rem;color:var(--primary,#f5c518);margin-bottom:6px">🎁 <strong>Quyền lợi:</strong> ${evt.benefits}</p>` : ''}
                    ${evt.sponsors ? `<p style="font-size:0.85rem;color:#888;margin-bottom:14px">🤝 <strong>Đồng hành:</strong> ${evt.sponsors}</p>` : ''}
                    <div class="event-card-actions">
                        ${isRegistered
                            ? '<button class="btn btn-outline btn-block" style="border-color:var(--success,#00b894);color:var(--success,#00b894);" disabled>✅ Bạn Đã Có Vé</button>'
                            : isFull
                                ? '<button class="btn btn-outline btn-block" disabled>🚫 Đã Hết Vé</button>'
                                : `<button class="btn btn-primary btn-block" onclick="openRegisterModal('${evt.id}')">Đăng Ký Tham Gia Ngay →</button>`
                        }
                    </div>
                </div>
            `;
            grid.appendChild(card);
        });

        // Tự động mở modal nếu URL chứa mã sự kiện quét từ poster QR (?event=BUH-...)
        checkUrlEventParam();
    } catch (err) {
        grid.innerHTML = `<p style="color:var(--error);padding:20px;">Lỗi tải sự kiện: ${err.message}</p>`;
    }
}

function checkUrlEventParam() {
    const hash = window.location.hash || '';
    const searchPart = hash.includes('?') ? hash.split('?')[1] : window.location.search.substring(1);
    const params = new URLSearchParams(searchPart);
    const eventCode = params.get('event');

    if (eventCode && events.length > 0) {
        const found = events.find(e => e.code.toUpperCase() === eventCode.toUpperCase() || e.id === eventCode);
        if (found) {
            openRegisterModal(found.id);
        }
    }
}

window.openRegisterModal = (eventId) => {
    const evt = events.find((e) => e.id === eventId);
    if (!evt) return;

    if ((evt.registered_count || 0) >= evt.capacity) {
        showToast('Sự kiện này đã đạt giới hạn đăng ký!', 'error');
        return;
    }

    const modal = document.getElementById('modal-register');
    if (!modal) return;

    document.getElementById('register-event-id').value = eventId;
    document.getElementById('register-event-name').textContent = evt.title;
    
    // Tự động điền thông tin sinh viên BUH từ tài khoản
    document.getElementById('reg-form-name').value = currentUser?.name || '';
    document.getElementById('reg-form-mssv').value = currentUser?.studentId || '';
    document.getElementById('reg-form-email').value = currentUser?.email || '';

    modal.classList.remove('hidden');
};

async function handleRegisterEvent(e) {
    e.preventDefault();

    const eventId = document.getElementById('register-event-id').value;
    const evt = events.find((e) => e.id === eventId);
    if (!evt) return;

    const name = document.getElementById('reg-form-name').value.trim();
    const mssv = document.getElementById('reg-form-mssv').value.trim();
    const email = document.getElementById('reg-form-email').value.trim();

    const submitBtn = e.target.querySelector('button[type="submit"]');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Đang tạo vé...';
    }

    try {
        const res = await window.api.tickets.book({
            eventId,
            fullName: name,
            studentId: mssv,
            email: email
        });

        const newTicket = res.data;
        document.getElementById('modal-register').classList.add('hidden');
        showToast(`🎉 Đăng ký thành công! Mã vé của bạn: ${newTicket.ticket_code}`, 'success');

        // Tải lại danh sách sự kiện và mở tab Vé của tôi
        await renderUserExplore();
        
        setTimeout(() => {
            if (confirm(`Đã cấp vé thành công!\nMã vé: ${newTicket.ticket_code}\n\nBạn có muốn chuyển sang mục 'Vé của Tôi' để xem mã QR check-in ngay bây giờ không?`)) {
                window.location.hash = '#/user/tickets';
            }
        }, 500);
    } catch (err) {
        showToast(err.message || 'Đăng ký vé thất bại!', 'error');
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Xác Nhận Đăng Ký';
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('explore-search')?.addEventListener('input', (e) => {
        renderUserExplore(e.target.value);
    });

    document.getElementById('btn-close-register-modal')?.addEventListener('click', () => {
        document.getElementById('modal-register')?.classList.add('hidden');
    });

    document.getElementById('btn-cancel-register-modal')?.addEventListener('click', () => {
        document.getElementById('modal-register')?.classList.add('hidden');
    });

    document.getElementById('form-register-event')?.addEventListener('submit', handleRegisterEvent);
});
