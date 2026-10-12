const app = require('./app');
const config = require('./config');
const db = require('./database/db');

const PORT = config.port;

async function bootstrap() {
    console.log('🐝 Starting BEECLUB Operations Backend...');
    
    // Test PostgreSQL connectivity
    await db.testConnection();

    const server = app.listen(PORT, () => {
        console.log(`🚀 BEECLUB Backend is running on port ${PORT} [${config.env}]`);
        console.log(`🔗 Health check available at: http://localhost:${PORT}/api/v1/health`);
    });

    // Graceful Shutdown
    const shutdown = async (signal) => {
        console.log(`\nReceived ${signal}. Shutting down gracefully...`);
        server.close(async () => {
            console.log('HTTP server closed.');
            await db.pool.end();
            console.log('Database pool closed. Exiting process.');
            process.exit(0);
        });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
}

bootstrap().catch((err) => {
    console.error('Fatal initialization error:', err);
    process.exit(1);
});
