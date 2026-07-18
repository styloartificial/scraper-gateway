// Logger tipis. Sengaja tidak pakai library besar (pino/winston) dulu supaya
// dependency tetap minim — tapi semua log lewat sini, jadi gampang diganti nanti.
function timestamp() {
  return new Date().toISOString();
}

module.exports = {
  info: (...args) => console.log(`[INFO] ${timestamp()}`, ...args),
  warn: (...args) => console.warn(`[WARN] ${timestamp()}`, ...args),
  error: (...args) => console.error(`[ERROR] ${timestamp()}`, ...args),
};
