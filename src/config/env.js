require('dotenv').config();

// Semua env yang wajib ada. Kalau ada yang kosong, server langsung berhenti
// saat start, bukan error samar-samar di tengah request (fail fast).
const REQUIRED_VARS = ['CHARTED_SEA_API_TOKEN'];

const missing = REQUIRED_VARS.filter((key) => !process.env[key]);
if (missing.length > 0) {
  throw new Error(
    `Environment variable wajib belum diisi: ${missing.join(', ')}. Cek file .env kamu (lihat .env.example).`
  );
}

module.exports = {
  port: Number(process.env.PORT) || 3001,
  chartedSeaApiToken: process.env.CHARTED_SEA_API_TOKEN,
  nodeEnv: process.env.NODE_ENV || 'development',
  secretKey: process.env.SECRET_KEY || '',
};