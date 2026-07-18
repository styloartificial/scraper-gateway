# scraper-gateway

Gateway service (Node.js/Express) yang menjembatani Laravel dengan proses
scraping: mengelola antrian keyword (`queue.json`) dan mencari produk ke
Lazada dengan rotasi API key.

## Struktur folder

```
scraper-gateway/
├── data/
│   ├── queue.json              # state antrian (runtime, gitignored)
│   ├── apikeys.json            # state API key (runtime, gitignored)
│   ├── queue.example.json      # contoh format, aman di-commit
│   └── apikeys.example.json    # contoh format, aman di-commit
├── src/
│   ├── config/
│   │   └── env.js              # baca & validasi environment variable
│   ├── middleware/
│   │   ├── auth.js             # cek secret_key di header
│   │   └── errorHandler.js     # error handler + 404 handler terpusat
│   ├── repositories/
│   │   ├── queueRepository.js  # baca/tulis queue.json
│   │   └── apiKeyRepository.js # baca/tulis apikeys.json
│   ├── services/
│   │   ├── queueService.js         # validasi + logika antrian
│   │   └── productSearchService.js # cari produk Lazada + retry ganti API key
│   ├── routes/
│   │   ├── index.js
│   │   ├── queue.routes.js
│   │   └── products.routes.js
│   ├── utils/
│   │   ├── jsonFileStore.js    # baca/tulis JSON atomic + anti race condition
│   │   └── logger.js
│   ├── app.js                  # setup express (tanpa listen)
│   └── server.js               # entrypoint: listen + graceful shutdown
├── .env.example
├── .gitignore
└── package.json
```

Pola di atas adalah **layered architecture**: `routes` menerima HTTP request →
panggil `services` (logika bisnis & validasi) → panggil `repositories`
(akses data). Setiap layer hanya tahu layer di bawahnya, jadi kalau nanti
`queue.json` dipindah ke database sungguhan, yang berubah cukup
`repositories/`, tidak perlu sentuh `routes` atau `services`.

## Instalasi

```bash
npm install
cp .env.example .env
# lalu isi SECRET_KEY di .env dengan nilai asli (jangan pakai contoh)
```

## Menjalankan

```bash
npm run dev    # dengan nodemon, auto-restart saat file berubah
npm start      # mode biasa
```

Server akan berjalan di `http://localhost:3001` (atau sesuai `PORT` di `.env`).

## Endpoint

Semua endpoint (kecuali `/health`) butuh header `x-secret-key` (atau
`secret_key` untuk kompatibilitas lama) berisi nilai `SECRET_KEY`.

| Method | Path                          | Keterangan                         |
|--------|-------------------------------|-------------------------------------|
| GET    | `/health`                     | Health check, tanpa auth            |
| POST   | `/api/add-to-queue-scraper`   | Tambah/update ticket ke antrian     |
| POST   | `/api/remove-to-queue-scraper`| Hapus ticket dari antrian           |
| GET    | `/queue`                      | Lihat isi antrian                   |
| GET    | `/search-products`            | Cari produk Lazada (`?search_query=`, `?marketplace=`) |

## Ringkasan perubahan dari versi lama

**Bug yang diperbaiki:**
- `scraper.js` sebelumnya `require("./helpers/ApiKeyHelper")` (folder
  `helpers`, plural) padahal foldernya bernama `helper` (singular) —
  kalau dijalankan langsung, ini akan crash `MODULE_NOT_FOUND`.
- `ApiKeyHelper.js` menunjuk ke file `appkey.json` padahal file yang ada
  bernama `apikey.json` — typo satu huruf yang bikin API key tidak pernah
  kebaca.
- `axios` dipakai di `scraper.js` tapi tidak pernah ditulis di
  `package.json` — akan gagal saat `npm install` di server lain / teman
  tim / CI.
- `require('dotenv').config()` dipanggil dua kali di `index.js`.
- Ada `console.log` yang mencetak `SECRET_KEY` langsung ke log — berisiko
  bocor kalau log ini kebaca orang lain (server log, CI log, dsb).
- File `.env` sebelumnya ikut ke-zip/ke-commit (ini penyebab insiden
  kebocoran key yang pernah kamu perbaiki di `stylo_mobile`). Sekarang ada
  `.env.example` + `.gitignore` supaya tidak terulang.

**Perubahan struktur/kualitas (tidak mengubah perilaku endpoint):**
- `index.js` dan `scraper.js` (2 app Express terpisah, 2 port) digabung
  jadi satu app dengan route yang jelas — lebih gampang di-deploy dan
  di-maintain, tapi path endpoint yang lama tetap dipertahankan persis
  sama supaya Laravel yang sudah terintegrasi tidak perlu diubah.
- Baca/tulis `queue.json` dan `apikeys.json` sekarang **atomic** (tulis ke
  file sementara lalu rename) dan **diantrikan** (mutex sederhana), supaya
  kalau ada 2 request datang hampir bersamaan, file tidak saling timpa
  atau corrupt.
- Perbandingan `secret_key` sekarang pakai `crypto.timingSafeEqual`
  (mencegah timing attack), bukan `!==` biasa.
- Environment variable divalidasi sekali di `config/env.js` — kalau
  `SECRET_KEY` belum diisi, server langsung berhenti dengan pesan jelas
  saat start, bukan error samar di tengah request.
- Error handling terpusat di `middleware/errorHandler.js` — semua route
  cukup `throw`/reject promise, tidak perlu `try/catch` berulang di setiap
  handler (Express 5 otomatis menangkap rejected promise dari route
  async).
- Ditambahkan graceful shutdown (`SIGTERM`/`SIGINT`) supaya request yang
  sedang jalan tidak terputus paksa saat restart deploy.
- Endpoint `/search-products` sekarang juga diberi proteksi `secret_key`,
  karena memanggil API berbayar (per-kredit) — sebelumnya endpoint ini
  terbuka tanpa autentikasi sama sekali.

## Yang perlu kamu isi sendiri

- `data/apikeys.json` — isi dengan API key Lazada yang asli (lihat
  `data/apikeys.example.json` untuk formatnya).
- `.env` — isi `SECRET_KEY` dengan nilai asli yang sama dengan yang dipakai
  Laravel untuk memanggil gateway ini.
