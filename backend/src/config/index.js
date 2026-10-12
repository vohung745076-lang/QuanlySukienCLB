require('dotenv').config();

module.exports = {
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '5000', 10),
    clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
    db: {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432', 10),
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: process.env.DB_NAME || 'beeclub_db'
    },
    jwt: {
        secret: process.env.JWT_SECRET || 'beeclub_secret_key_default_2026',
        expiresIn: process.env.JWT_EXPIRES_IN || '24h',
        refreshSecret: process.env.JWT_REFRESH_SECRET || 'beeclub_refresh_default_2026',
        refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
    }
};
