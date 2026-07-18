const crypto = require('crypto');
const env = require('../config/env');

function timingSafeEqual(a, b) {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

// Terima header "x-secret-key" (konvensi standar untuk custom header) tapi
// tetap dukung "secret_key" (header lama) supaya Laravel yang sudah
// terintegrasi tidak langsung putus saat deploy versi ini.
function checkSecretKey(req, res, next) {
  const provided = req.headers['x-secret-key'] || req.headers['secret_key'];

  if (!provided || !timingSafeEqual(provided, env.secretKey)) {
    return res.status(401).json({ error: 'Unauthorized: secret_key salah atau tidak ada' });
  }
  next();
}

module.exports = { checkSecretKey };
