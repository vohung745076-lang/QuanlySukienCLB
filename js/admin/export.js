/* ============================================================
   admin/export.js — Xuất danh sách đăng ký ra Excel
   Tải trực tiếp qua API Backend với định dạng ExcelJS chuyên nghiệp
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('btn-export-excel')?.addEventListener('click', handleExportExcel);
});

async function handleExportExcel() {
    try {
        const downloadUrl = window.api.export.getDownloadUrl();
        showToast('Đang tạo và tải file Excel đăng ký sự kiện BUH...', 'info');
        window.open(downloadUrl, '_blank');
    } catch (err) {
        showToast('Lỗi khi tải file: ' + err.message, 'error');
    }
}
