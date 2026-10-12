/* ============================================================
   checkin/checkin.js — Hệ thống Check-in (Admin/Manager)
   ============================================================ */

// ─── Render Check-in System ───────────────────────────────────

async function renderCheckinSystem() {
    const select = document.getElementById('checkin-event-select');
    select.innerHTML = '<option value="">-- Chọn sự kiện để check-in --</option>';

    const { data: eventsData } = await supabase
        .from('events')
        .select('id, name, date')
        .order('date', { ascending: false });

    (eventsData || []).forEach(e => {
        const opt = document.createElement('option');
        opt.value       = e.id;
        opt.textContent = `${e.name} (${formatDateShort(e.date)})`;
        select.appendChild(opt);
    });

    await renderCheckinLog();
}

// ─── Setup event listeners ────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('btn-do-checkin')?.addEventListener('click', doCheckin);

    // Enter trong ô nhập mã vé cũng trigger check-in
    document.getElementById('checkin-ticket-code')?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') doCheckin();
    });

    document.getElementById('btn-clear-checkin-logs')?.addEventListener('click', async () => {
        if (!confirm('Dọn dẹp toàn bộ lịch sử check-in hiển thị này?')) return;
        // Chỉ xóa log trong Supabase liên quan đến user session hiện tại (30 log gần nhất)
        const { data: recentLogs } = await supabase
            .from('checkin_logs')
            .select('id')
            .order('created_at', { ascending: false })
            .limit(30);

        if (recentLogs && recentLogs.length > 0) {
            await supabase.from('checkin_logs').delete().in('id', recentLogs.map(l => l.id));
        }
        checkinLogs = [];
        renderCheckinLog();
    });
});

// ─── Thực hiện Check-in ───────────────────────────────────────

async function doCheckin() {
    const eventId    = document.getElementById('checkin-event-select').value;
    const ticketCode = document.getElementById('checkin-ticket-code').value.trim();
    const resultBox  = document.getElementById('checkin-result');

    if (!eventId) { showToast('Vui lòng chọn sự kiện trước!', 'error'); return; }
    if (!ticketCode) return;

    resultBox.classList.remove('hidden', 'success', 'error');

    // Tìm vé theo ticket id HOẶC MSSV
    const { data: foundTickets, error } = await supabase
        .from('tickets')
        .select('*')
        .eq('event_id', eventId)
        .or(`id.ilike.${ticketCode},participant_mssv.ilike.${ticketCode}`);

    const ticket = foundTickets?.[0] || null;

    if (error || !ticket) {
        resultBox.className = 'checkin-result error';
        resultBox.innerHTML = '❌ Lỗi: Không tìm thấy vé (hoặc MSSV không khớp).';
        await logCheckin(ticketCode, eventId, false, 'Sai mã/MSSV', null);
    } else if (ticket.status === 'used') {
        resultBox.className = 'checkin-result success';
        resultBox.innerHTML = `✅ Check-in thành công!<br>
            <small><strong>Mã vé:</strong> ${ticket.id}<br>
            <strong>Họ tên:</strong> ${ticket.participant_name || '---'}<br>
            <strong>MSSV:</strong> ${ticket.participant_mssv || '---'}</small><br>
            <i style="font-size:0.85rem;color:var(--text-muted);margin-top:5px;display:block">*Vé đã được điểm danh trước đó.</i>`;
    } else {
        // Cập nhật vé → used
        const { error: updateErr } = await supabase
            .from('tickets')
            .update({ status: 'used' })
            .eq('id', ticket.id);

        if (updateErr) {
            resultBox.className = 'checkin-result error';
            resultBox.innerHTML = '❌ Lỗi hệ thống khi cập nhật vé!';
            return;
        }

        // Tăng checkins của event
        const evt = (await supabase.from('events').select('checkins').eq('id', eventId).single()).data;
        if (evt) {
            await supabase.from('events').update({ checkins: (evt.checkins || 0) + 1 }).eq('id', eventId);
        }

        resultBox.className = 'checkin-result success';
        resultBox.innerHTML = `✅ Check-in thành công!<br>
            <small><strong>Mã vé:</strong> ${ticket.id}<br>
            <strong>Họ tên:</strong> ${ticket.participant_name || '---'}<br>
            <strong>MSSV:</strong> ${ticket.participant_mssv || '---'}</small>`;

        await logCheckin(
            `${ticket.id} (${ticket.participant_mssv || 'Khách'})`,
            eventId, true, 'Hợp lệ', ticket.id
        );
    }

    document.getElementById('checkin-ticket-code').value = '';
    await renderCheckinLog();
}

// ─── Ghi Log Check-in ─────────────────────────────────────────

async function logCheckin(code, eventId, success, note, ticketId) {
    const { error } = await supabase.from('checkin_logs').insert({
        code,
        event_id:  eventId,
        success,
        note,
        ticket_id: ticketId
    });
    if (error) console.error('Ghi log thất bại:', error);
}

// ─── Render danh sách log gần đây ────────────────────────────

async function renderCheckinLog() {
    const list = document.getElementById('checkin-log-list');
    if (!list) return;

    const { data: logs } = await supabase
        .from('checkin_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(30);

    checkinLogs = logs || [];

    if (checkinLogs.length === 0) {
        list.innerHTML = '<li style="padding:15px 20px;color:var(--text-muted)">Chưa có lịch sử check-in</li>';
        return;
    }

    list.innerHTML = '';
    checkinLogs.forEach((log) => {
        const timeStr = new Date(log.created_at).toLocaleTimeString('vi-VN');
        const li = document.createElement('li');
        li.innerHTML = `
            <div>
                <span><strong>${log.code}</strong> <small>(${timeStr})</small></span>
            </div>
            <div style="display:flex;align-items:center;gap:15px">
                <span style="color:${log.success ? 'var(--success)' : 'var(--error)'}">${log.note}</span>
                ${log.success && log.ticket_id
                    ? `<button title="Hoàn tác" onclick="undoCheckin('${log.ticket_id}', '${log.event_id}', ${log.id})"
                        style="background:none;border:none;color:var(--error);text-decoration:underline;cursor:pointer;font-size:0.85rem">Hoàn tác</button>`
                    : ''
                }
                <button title="Xóa dòng này" onclick="deleteCheckinLog(${log.id})"
                    style="background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:1.2rem">&times;</button>
            </div>
        `;
        list.appendChild(li);
    });
}

// ─── Hoàn tác Check-in ────────────────────────────────────────

window.undoCheckin = async (ticketId, eventId, logId) => {
    if (!confirm('Phục hồi vé này về trạng thái "Hợp lệ" (Chưa check-in)?')) return;

    // Cập nhật vé → valid
    const { error: tErr } = await supabase
        .from('tickets')
        .update({ status: 'valid' })
        .eq('id', ticketId);

    if (tErr) { showToast('Hoàn tác thất bại!', 'error'); return; }

    // Giảm checkins của event
    const { data: evt } = await supabase.from('events').select('checkins').eq('id', eventId).single();
    if (evt) {
        await supabase.from('events').update({ checkins: Math.max(0, (evt.checkins || 1) - 1) }).eq('id', eventId);
    }

    // Cập nhật log → đã hủy
    await supabase.from('checkin_logs').update({ note: 'Đã hủy check-in', success: false, ticket_id: null }).eq('id', logId);

    showToast('Đã hoàn tác. Vé có thể sử dụng lại.');
    await renderCheckinLog();
};

// ─── Xóa một dòng log ─────────────────────────────────────────

window.deleteCheckinLog = async (logId) => {
    await supabase.from('checkin_logs').delete().eq('id', logId);
    await renderCheckinLog();
};
