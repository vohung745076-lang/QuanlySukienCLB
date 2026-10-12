/* ============================================================
   admin/export.js — Xuất danh sách đăng ký ra Excel
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('btn-export-excel')?.addEventListener('click', handleExportExcel);
});

async function handleExportExcel() {
    if (typeof XLSX === 'undefined') {
        showToast('Không tải được thư viện Excel. Kiểm tra kết nối Internet!', 'error');
        return;
    }

    showToast('Đang tải dữ liệu...');

    // Lấy toàn bộ tickets kèm thông tin sự kiện
    const { data: tickets, error } = await supabase
        .from('tickets')
        .select('*, events(name)')
        .order('created_at', { ascending: true });

    if (error) { showToast('Không tải được dữ liệu!', 'error'); return; }
    if (!tickets || tickets.length === 0) {
        showToast('Chưa có dữ liệu đăng ký nào!', 'error');
        return;
    }

    const exportData = tickets.map((t, i) => ({
        'STT':         i + 1,
        'Sự kiện':     t.events?.name || 'Không rõ',
        'Mã Vé':       t.id,
        'Trạng Thái':  t.status === 'used' ? 'Đã Check-in' : 'Hợp lệ',
        'Họ và Tên':   t.participant_name  || '(Chưa cập nhật)',
        'MSSV':        t.participant_mssv  || '(Chưa cập nhật)',
        'Email':       t.participant_email || '(Chưa cập nhật)'
    }));

    try {
        const worksheet = XLSX.utils.json_to_sheet(exportData);
        worksheet['!cols'] = [
            { wch: 5 }, { wch: 35 }, { wch: 15 },
            { wch: 15 }, { wch: 25 }, { wch: 15 }, { wch: 30 }
        ];
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'DanhSachDangKy');
        XLSX.writeFile(workbook, 'DanhSach_DangKy_SuKien.xlsx');
        showToast('Xuất Excel thành công! 📥');
    } catch (err) {
        console.error(err);
        showToast('Có lỗi khi xuất file!', 'error');
    }
}
