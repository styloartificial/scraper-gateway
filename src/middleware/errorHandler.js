const env = require('../config/env');
const logger = require('../utils/logger');

// Express 5 otomatis meneruskan rejected Promise dari route handler ke sini,
// jadi route async tidak perlu try/catch manual di setiap handler.
function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  const statusCode = err.statusCode || 500;

  logger.error(`${req.method} ${req.originalUrl} ->`, err.message);
  if (env.nodeEnv !== 'production') {
    logger.error(err.stack);
  }

  res.status(statusCode).json({
    error: statusCode === 500 ? 'Terjadi kesalahan pada server' : err.message,
  });
}

function notFoundHandler(req, res) {
  res.status(404).json({ error: `Route ${req.method} ${req.originalUrl} tidak ditemukan` });
}

module.exports = { errorHandler, notFoundHandler };
