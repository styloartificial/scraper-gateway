const env = require('./config/env');
const createApp = require('./app');
const logger = require('./utils/logger');

const app = createApp();

const server = app.listen(env.port, () => {
  logger.info(`scraper-gateway berjalan di port ${env.port} (${env.nodeEnv})`);
});

// Graceful shutdown supaya request yang sedang berjalan tidak terputus
// paksa saat proses di-restart (misal oleh PM2/Docker).
function shutdown(signal) {
  logger.info(`Menerima ${signal}, mematikan server...`);
  server.close(() => {
    logger.info('Server berhenti dengan bersih.');
    process.exit(0);
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection:', reason);
});
