/* ============================================================
   checkin/checkin.js — Hệ Thống Check-in Điểm Danh BUH
   Quét trực tiếp qua Camera điện thoại/máy tính hoặc nhập mã thủ công
   ============================================================ */

let html5QrScannerInstance = null;
let isCameraScanning = false;
let lastScannedCode = null;
let lastScannedTime = 0;

// Âm thanh phản hồi trực tiếp qua Web Audio API (không cần file âm thanh ngoài)
function playFeedbackSound(isSuccess = true) {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.type = isSuccess ? 'sine' : 'sawtooth';
        osc.frequency.setValueAtTime(isSuccess ? 880 : 330, audioCtx.currentTime); // 880Hz (A5) hoặc 330Hz (E4)
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);

        osc.connect(gain);
        gain.connect(audioCtx.destination);

        osc.start();
        osc.stop(audioCtx.currentTime + (isSuccess ? 0.15 : 0.35));
    } catch (e) {
        // Trình duyệt chặn âm thanh tự động
    }
}

// ─── 1. Khởi tạo giao diện Check-in ─────────────────────────────
async function renderCheckinSystem() {
    const select = document.getElementById('checkin-event-select');
    if (!select) return;
    select.innerHTML = '<option value="">-- Đang tải sự kiện BUH... --</option>';

    try {
        const res = await window.api.events.getAll({ limit: 50 });
        const eventList = res.data || [];

        select.innerHTML = '<option value="">-- Chọn sự kiện để check-in --</option>';
        eventList.forEach((e) => {
            const opt = document.createElement('option');
            opt.value = e.id;
            const dateStr = e.start_time ? new Date(e.start_time).toLocaleDateString('vi-VN') : '';
            opt.textContent = `${e.title} [${e.code}] (${dateStr})`;
            select.appendChild(opt);
        });

        if (eventList.length > 0 && !select.value) {
            select.value = eventList[0].id;
        }

        await renderCheckinLog();
    } catch (err) {
        select.innerHTML = '<option value="">Lỗi tải sự kiện</option>';
        showToast('Không tải được danh sách sự kiện check-in!', 'error');
    }
}

// ─── 2. Thực hiện Check-in qua API ─────────────────────────────
async function doCheckin(explicitCode = null) {
    const eventSelect = document.getElementById('checkin-event-select');
    const eventId = eventSelect ? eventSelect.value : '';
    const inputEl = document.getElementById('checkin-ticket-code');
    const ticketCode = (explicitCode || (inputEl ? inputEl.value : '')).trim();
    const resultBox = document.getElementById('checkin-result');

    if (!eventId) {
        showToast('Vui lòng chọn sự kiện trước khi check-in!', 'error');
        return;
    }
    if (!ticketCode) return;

    if (resultBox) {
        resultBox.classList.remove('hidden', 'success', 'error', 'warning');
        resultBox.innerHTML = '<p style="margin:0;">⏳ Đang xác thực vé...</p>';
    }

    try {
        const res = await window.api.checkin.checkin({ eventId, code: ticketCode });
        const result = res.data;

        if (result.success) {
            if (result.alreadyUsed) {
                // Vé đã được check-in trước đó
                playFeedbackSound(false);
                if (resultBox) {
                    resultBox.className = 'checkin-result error';
                    resultBox.style.cssText = 'background:rgba(243,156,18,0.15);border:1px solid #f39c12;padding:15px;border-radius:10px;margin-top:15px;';
                    resultBox.innerHTML = `
                        <div style="font-size:1.1rem;font-weight:700;color:#f39c12;margin-bottom:6px;">⚠️ CẢNH BÁO: VÉ ĐÃ ĐƯỢC CHECK-IN TRƯỚC ĐÓ!</div>
                        <div><strong>Mã vé:</strong> ${result.ticket?.ticketCode || ticketCode}</div>
                        <div><strong>Sinh viên:</strong> ${result.ticket?.participantName || '---'} (MSSV: ${result.ticket?.participantMssv || '---'})</div>
                        <div style="color:var(--text-muted);font-size:0.85rem;margin-top:4px;">Thời gian quét trước: ${result.ticket?.checkedInAt ? new Date(result.ticket.checkedInAt).toLocaleString('vi-VN') : '---'}</div>
                    `;
                }
                showToast('Vé này đã được điểm danh trước đó!', 'error');
            } else {
                // Check-in thành công lần đầu
                playFeedbackSound(true);
                if (resultBox) {
                    resultBox.className = 'checkin-result success';
                    resultBox.style.cssText = 'background:rgba(0,184,148,0.15);border:1px solid #00b894;padding:15px;border-radius:10px;margin-top:15px;';
                    resultBox.innerHTML = `
                        <div style="font-size:1.2rem;font-weight:700;color:#00b894;margin-bottom:6px;">✅ ĐIỂM DANH THÀNH CÔNG! 🎉</div>
                        <div style="font-size:1.05rem;"><strong>Họ và tên:</strong> ${result.ticket?.participantName || '---'}</div>
                        <div style="font-size:1.05rem;"><strong>MSSV:</strong> ${result.ticket?.participantMssv || '---'}</div>
                        <div style="color:var(--text-muted);font-size:0.85rem;margin-top:4px;">Mã vé: ${result.ticket?.ticketCode}</div>
                    `;
                }
                showToast(`Check-in thành công: ${result.ticket?.participantName} (${result.ticket?.participantMssv})`, 'success');
            }
        } else {
            // Không tìm thấy vé
            playFeedbackSound(false);
            if (resultBox) {
                resultBox.className = 'checkin-result error';
                resultBox.style.cssText = 'background:rgba(224,36,94,0.15);border:1px solid #e0245e;padding:15px;border-radius:10px;margin-top:15px;';
                resultBox.innerHTML = `
                    <div style="font-size:1.1rem;font-weight:700;color:#e0245e;margin-bottom:6px;">❌ THẤT BẠI: VÉ KHÔNG HỢP LỆ!</div>
                    <div>${result.message || 'Không tìm thấy vé hoặc mã số sinh viên không khớp với sự kiện này.'}</div>
                `;
            }
            showToast('Không tìm thấy vé hợp lệ!', 'error');
        }

        if (inputEl) inputEl.value = '';
        await renderCheckinLog();
    } catch (err) {
        playFeedbackSound(false);
        if (resultBox) {
            resultBox.className = 'checkin-result error';
            resultBox.style.cssText = 'background:rgba(224,36,94,0.15);border:1px solid #e0245e;padding:15px;border-radius:10px;margin-top:15px;';
            resultBox.innerHTML = `❌ Lỗi: ${err.message}`;
        }
        showToast(err.message || 'Lỗi xử lý check-in', 'error');
    }
}

// ─── 3. Quét QR Trực Tiếp Qua Camera Màn Hình ───────────────────
async function toggleCameraScanner() {
    const btn = document.getElementById('btn-toggle-camera');
    const viewport = document.getElementById('qr-camera-viewport');
    const mockView = document.getElementById('scanner-mock-view');

    if (!isCameraScanning) {
        // BẬT CAMERA
        if (typeof Html5Qrcode === 'undefined') {
            showToast('Thư viện quét mã camera chưa sẵn sàng. Vui lòng thử lại sau vài giây!', 'error');
            return;
        }

        const eventId = document.getElementById('checkin-event-select')?.value;
        if (!eventId) {
            showToast('Vui lòng chọn sự kiện trước khi bật camera!', 'error');
            return;
        }

        try {
            if (mockView) mockView.style.display = 'none';
            if (viewport) viewport.style.display = 'block';

            html5QrScannerInstance = new Html5Qrcode('qr-camera-viewport');

            await html5QrScannerInstance.start(
                { facingMode: 'environment' },
                {
                    fps: 15,
                    qrbox: { width: 260, height: 260 }
                },
                (decodedText) => {
                    // Khi nhận diện được mã QR trên màn hình điện thoại sinh viên
                    const now = Date.now();
                    if (decodedText === lastScannedCode && (now - lastScannedTime) < 3000) {
                        return; // Chống quét trùng lặp trong 3 giây
                    }
                    lastScannedCode = decodedText;
                    lastScannedTime = now;

                    console.log('Camera nhận diện mã QR:', decodedText);
                    doCheckin(decodedText);
                },
                (errorMessage) => {
                    // Bỏ qua các frame rỗng chưa nhận diện được QR
                }
            );

            isCameraScanning = true;
            if (btn) {
                btn.innerHTML = '🛑 Tắt Camera Quét Mã';
                btn.style.borderColor = 'var(--error,#e0245e)';
                btn.style.color = 'var(--error,#e0245e)';
            }
            showToast('Camera đã sẵn sàng! Lia camera vào mã QR trên màn hình sinh viên.', 'info');
        } catch (camErr) {
            console.error('Không thể khởi động Camera:', camErr);
            showToast('Không mở được camera (Cần cấp quyền truy cập Camera trình duyệt)!', 'error');
            if (mockView) mockView.style.display = 'block';
            if (viewport) viewport.style.display = 'none';
        }
    } else {
        // TẮT CAMERA
        if (html5QrScannerInstance) {
            try {
                await html5QrScannerInstance.stop();
                html5QrScannerInstance.clear();
            } catch (e) {}
            html5QrScannerInstance = null;
        }

        isCameraScanning = false;
        if (viewport) viewport.style.display = 'none';
        if (mockView) mockView.style.display = 'block';
        if (btn) {
            btn.innerHTML = '📸 Bật Camera Quét Mã QR Màn Hình';
            btn.style.borderColor = 'var(--brand-gold,#f5c518)';
            btn.style.color = 'var(--brand-gold,#f5c518)';
        }
    }
}

// ─── 4. Hiển thị danh sách Check-in Log gần đây ─────────────────
async function renderCheckinLog() {
    const list = document.getElementById('checkin-log-list');
    if (!list) return;

    const eventId = document.getElementById('checkin-event-select')?.value || null;

    try {
        const res = await window.api.checkin.getLogs({ eventId, limit: 25 });
        checkinLogs = res.data || [];

        if (checkinLogs.length === 0) {
            list.innerHTML = '<li style="padding:15px;color:var(--text-muted);text-align:center;">Chưa có lượt check-in nào cho sự kiện này.</li>';
            return;
        }

        list.innerHTML = '';
        checkinLogs.forEach((log) => {
            const timeStr = log.created_at ? new Date(log.created_at).toLocaleTimeString('vi-VN') : '---';
            const li = document.createElement('li');
            li.style.cssText = 'display:flex;justify-content:space-between;align-items:center;padding:10px 15px;border-bottom:1px solid rgba(255,255,255,0.06);';

            li.innerHTML = `
                <div>
                    <span style="font-family:monospace;font-weight:700;">${log.input_code}</span>
                    <small style="color:var(--text-muted);margin-left:8px;">(${timeStr})</small>
                </div>
                <div>
                    <span style="color:${log.is_success ? 'var(--success,#00b894)' : 'var(--error,#e0245e)'};font-weight:600;font-size:0.9rem;">
                        ${log.result_message || (log.is_success ? 'Thành công' : 'Thất bại')}
                    </span>
                </div>
            `;
            list.appendChild(li);
        });
    } catch (err) {
        list.innerHTML = `<li style="padding:10px;color:var(--error);">Lỗi tải lịch sử: ${err.message}</li>`;
    }
}

// ─── 5. Gắn sự kiện lắng nghe ─────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('btn-do-checkin')?.addEventListener('click', () => doCheckin());
    document.getElementById('btn-toggle-camera')?.addEventListener('click', toggleCameraScanner);

    document.getElementById('checkin-ticket-code')?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') doCheckin();
    });

    document.getElementById('checkin-event-select')?.addEventListener('change', () => {
        renderCheckinLog();
    });

    document.getElementById('btn-clear-checkin-logs')?.addEventListener('click', async () => {
        const eventId = document.getElementById('checkin-event-select')?.value;
        if (!confirm('Bạn có chắc chắn muốn dọn dẹp các dòng log check-in hiển thị?')) return;

        try {
            await window.api.checkin.clearLogs({ eventId });
            showToast('Đã dọn dẹp lịch sử check-in!');
            await renderCheckinLog();
        } catch (err) {
            showToast('Lỗi dọn dẹp log: ' + err.message, 'error');
        }
    });
});
