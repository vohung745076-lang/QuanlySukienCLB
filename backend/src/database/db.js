const { Pool } = require('pg');
const config = require('../config');

const pool = new Pool({
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
    database: config.db.database,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle PostgreSQL client:', err.message);
});

async function query(text, params) {
    const start = Date.now();
    try {
        const res = await pool.query(text, params);
        const duration = Date.now() - start;
        if (config.env === 'development') {
            // console.log('Executed query', { text: text.slice(0, 80), duration, rows: res.rowCount });
        }
        return res;
    } catch (error) {
        console.error('Database query error:', { text, error: error.message });
        throw error;
    }
}

async function transaction(callback) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const result = await callback(client);
        await client.query('COMMIT');
        return result;
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

async function testConnection() {
    try {
        const res = await pool.query('SELECT NOW()');
        console.log('✅ PostgreSQL connected successfully at:', res.rows[0].now);
        return true;
    } catch (err) {
        console.warn('⚠️ Warning: Cannot connect to PostgreSQL database:', err.message);
        console.warn('👉 Please ensure PostgreSQL / Docker container is running.');
        return false;
    }
}

module.exports = {
    pool,
    query,
    transaction,
    testConnection
};
