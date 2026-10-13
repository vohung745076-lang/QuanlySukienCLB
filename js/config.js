/* ============================================================
   config.js — Cấu hình tập trung Hệ thống Quản lý Sự kiện BUH
   ============================================================ */

(function () {
    const isLocal = window.location.hostname === 'localhost' || 
                    window.location.hostname === '127.0.0.1' || 
                    window.location.protocol === 'file:';

    window.CONFIG = {
        // Tự động chuyển đổi endpoint giữa dev local và Render production
        API_BASE_URL: isLocal 
            ? 'http://localhost:5000/api/v1' 
            : 'https://beeclub-backend.onrender.com/api/v1',
            
        // Google OAuth Client ID dành cho sinh viên trường BUH
        // Lấy từ Google Cloud Console (Credentials > OAuth 2.0 Client IDs)
        GOOGLE_CLIENT_ID: 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com',

        // Tên trường và định dạng
        ORG_NAME: 'Đại Học Ngân Hàng TP.HCM (BUH)',
        ALLOWED_EMAIL_DOMAIN: '@st.buh.edu.vn'
    };
})();
