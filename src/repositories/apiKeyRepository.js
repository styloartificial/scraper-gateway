const path = require('path');
const JsonFileStore = require('../utils/jsonFileStore');

// Sebelumnya path ini salah ketik: menunjuk ke "appkey.json" (2 folder ke
// atas), padahal file aslinya bernama "apikey.json". Sekarang file-nya
// dipindah ke dalam folder project (data/) supaya tidak bergantung pada
// struktur folder di luar project yang gampang berubah/rusak saat deploy.
const API_KEY_PATH = path.join(__dirname, '..', '..', 'data', 'apikeys.json');
const store = new JsonFileStore(API_KEY_PATH, []);

async function findAll() {
  return store.readAll();
}

async function findAvailable() {
  const keys = await store.readAll();
  return keys.filter((k) => k.creditLeft > 0);
}

async function markAsExhausted(apiKey) {
  const keys = await store.readAll();
  const updated = keys.map((k) =>
    k.apiKey === apiKey ? { ...k, creditLeft: 0 } : k
  );
  await store.writeAll(updated);
  return updated;
}

module.exports = { findAll, findAvailable, markAsExhausted };
