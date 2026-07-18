const fs = require('fs/promises');
const path = require('path');

/**
 * Store JSON berbasis file, dengan:
 * 1. Write atomic (tulis ke file .tmp lalu rename) supaya file tidak
 *    pernah kebaca dalam kondisi setengah tertulis / corrupt.
 * 2. Write queue (mutex) per instance, supaya dua request yang datang
 *    hampir bersamaan tidak saling timpa (read-modify-write race condition).
 *
 * Catatan jujur: ini tetap "database" berbasis file, cocok untuk skala kecil
 * seperti queue scraping saat ini. Kalau trafik/concurrency naik, ini adalah
 * titik yang paling masuk akal untuk diganti ke SQLite/Postgres/Redis nanti,
 * tapi interface readAll/writeAll di bawah membuat migrasi itu tidak
 * mengharuskan ubah kode di service/route.
 */
class JsonFileStore {
  constructor(filePath, defaultValue = []) {
    this.filePath = filePath;
    this.defaultValue = defaultValue;
    this._writeChain = Promise.resolve();
  }

  async readAll() {
    try {
      const raw = await fs.readFile(this.filePath, 'utf-8');
      if (!raw.trim()) return this.defaultValue;
      return JSON.parse(raw);
    } catch (err) {
      if (err.code === 'ENOENT') {
        await this.writeAll(this.defaultValue);
        return this.defaultValue;
      }
      throw err;
    }
  }

  async writeAll(data) {
    // Antrikan setiap write di belakang write sebelumnya (mutex sederhana).
    this._writeChain = this._writeChain.then(() => this._atomicWrite(data));
    return this._writeChain;
  }

  async _atomicWrite(data) {
    const tmpPath = path.join(
      path.dirname(this.filePath),
      `.${path.basename(this.filePath)}.tmp`
    );
    await fs.writeFile(tmpPath, JSON.stringify(data, null, 2), 'utf-8');
    await fs.rename(tmpPath, this.filePath);
  }
}

module.exports = JsonFileStore;
