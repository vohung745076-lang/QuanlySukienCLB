const ExcelJS = require('exceljs');
const db = require('../../database/db');
const { sendError } = require('../../utils/response');

async function exportRegistrations(req, res, next) {
    try {
        const { eventId } = req.query;

        let query = `
            SELECT t.ticket_code, t.participant_name, t.participant_mssv, t.participant_email,
                   t.status, t.checked_in_at, t.created_at,
                   e.code as event_code, e.title as event_title, e.location, e.start_time
            FROM tickets t
            JOIN events e ON t.event_id = e.id
        `;
        const params = [];
        if (eventId) {
            params.push(eventId);
            query += ` WHERE t.event_id = $1`;
        }
        query += ` ORDER BY t.created_at ASC`;

        const dbRes = await db.query(query, params);
        const rows = dbRes.rows;

        if (rows.length === 0) {
            return sendError(res, 'Không có dữ liệu đăng ký để xuất Excel!', 404);
        }

        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'BEECLUB Operations System';
        workbook.created = new Date();

        const worksheet = workbook.addWorksheet('Danh Sách Tham Gia', {
            views: [{ showGridLines: true }]
        });

        // Styling Title
        worksheet.mergeCells('A1:G1');
        const titleCell = worksheet.getCell('A1');
        titleCell.value = 'BEECLUB - DANH SÁCH ĐĂNG KÝ VÀ ĐIỂM DANH SỰ KIỆN';
        titleCell.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
        titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A1A1A' } };
        titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
        worksheet.getRow(1).height = 35;

        // Header
        const headers = ['STT', 'MÃ VÉ', 'HỌ VÀ TÊN', 'MSSV / HIVE ID', 'EMAIL', 'TRẠNG THÁI', 'SỰ KIỆN'];
        const headerRow = worksheet.addRow(headers);
        headerRow.height = 28;
        headerRow.eachCell((cell) => {
            cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0245E' } }; // Ruby red accent
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'medium' },
                right: { style: 'thin' }
            };
        });

        // Data Rows
        rows.forEach((r, idx) => {
            const statusText = r.status === 'used' ? 'Đã Check-in' : 'Hợp lệ';
            const row = worksheet.addRow([
                idx + 1,
                r.ticket_code,
                r.participant_name,
                r.participant_mssv,
                r.participant_email,
                statusText,
                r.event_title
            ]);

            row.height = 22;
            row.eachCell((cell, colNumber) => {
                cell.font = { name: 'Arial', size: 10 };
                cell.alignment = { vertical: 'middle', horizontal: colNumber === 1 || colNumber === 6 ? 'center' : 'left' };
                cell.border = {
                    top: { style: 'thin', color: { argb: 'FFE0E0E0' } },
                    bottom: { style: 'thin', color: { argb: 'FFE0E0E0' } },
                    left: { style: 'thin', color: { argb: 'FFE0E0E0' } },
                    right: { style: 'thin', color: { argb: 'FFE0E0E0' } }
                };

                // Highlight checked-in
                if (colNumber === 6 && r.status === 'used') {
                    cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF2E7D32' } };
                }
            });
        });

        // Column widths
        worksheet.columns = [
            { width: 8 },
            { width: 22 },
            { width: 25 },
            { width: 18 },
            { width: 30 },
            { width: 16 },
            { width: 35 }
        ];

        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader(
            'Content-Disposition',
            `attachment; filename=BeeClub_DangKy_${Date.now()}.xlsx`
        );

        await workbook.xlsx.write(res);
        res.end();
    } catch (err) {
        next(err);
    }
}

module.exports = {
    exportRegistrations
};
