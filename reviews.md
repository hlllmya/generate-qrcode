# Code Review — cms-generate-qrcode — 2026-06-17

Repository: `hlllmya/generate-qrcode` (branch `main`, v1.0.1)  
Stack: TypeScript, Express 5, `qrcode` library  
Scope: Seluruh codebase (~30 file sumber, tanpa diff branch aktif)

---

## 1. Security

**Ringkasan:** Validasi input per tipe QR sudah cukup baik, tetapi API sepenuhnya publik tanpa autentikasi, rate limiting, atau hardening HTTP — berisiko disalahgunakan sebagai layanan QR gratis/abusif, terutama endpoint batch dan preview.

### Temuan

- **[High] Tidak ada autentikasi/otorisasi** — Semua endpoint (`/qrcode/*`, `/health`) dapat diakses siapa saja. Tidak ada API key, JWT, atau network restriction.
- **[High] Tidak ada rate limiting** — Endpoint batch (hingga 50 item) dan PNG width 2000px dapat dieksploitasi untuk CPU/memory exhaustion (DoS).
- **[Medium] Tidak ada security headers** — Tidak memakai `helmet` atau set header seperti `X-Content-Type-Options`, `X-Frame-Options`.
- **[Medium] Data sensitif terekspos di response** — WiFi password, QRIS payload, vCard, dll. dikembalikan di field `content` JSON dan header `X-QR-Content` (mode binary). Risiko log/proxy leakage.
- **[Medium] Tidak ada batas eksplisit body size** — `express.json()` memakai default ~100KB; tidak dikonfigurasi eksplisit dan tidak ada proteksi request flood.
- **[Medium] Validasi QRIS hanya pola permukaan** — `payment.ts` cek prefix `000201` dan panjang, tanpa validasi CRC EMVCo/checksum — payload rusak/palsu bisa lolos.
- **[Low] Health endpoint mengekspos `NODE_ENV`** — Informasi environment di `/health`.
- **[Low] Dependency audit bersih** — `npm audit`: 0 vulnerability (97 prod deps).

### Rekomendasi

1. Tambahkan autentikasi (API key minimal) di middleware sebelum router QR.
2. Pasang `express-rate-limit` per IP/API key; batasi lebih ketat untuk `/generate-batch` dan `/preview`.
3. Tambahkan `helmet` dan pertimbangkan tidak mengembalikan `content` mentah untuk tipe sensitif (wifi, payment).
4. Validasi QRIS dengan parser EMVCo + CRC check.
5. Set `express.json({ limit: '50kb' })` secara eksplisit.

---

## 2. Performance

**Ringkasan:** Arsitektur stateless cocok untuk skala kecil, tetapi batch processing paralel tanpa throttling dan pipeline base64→buffer berpotensi membebani memori saat beban tinggi.

### Temuan

- **[High] Batch `Promise.all` tanpa concurrency limit** — `batch.ts` menjalankan hingga 50 generasi PNG paralel; kombinasi width=2000 + PNG dapat spike RAM/CPU signifikan.
- **[Medium] Double buffering pada response binary** — QR dihasilkan sebagai base64 (`core.ts`), lalu dikonversi ke `Buffer` di `qrcode.response.ts` — pemborosan memori ~33%.
- **[Medium] Tidak ada caching** — Request identik (URL + options sama) selalu regenerate; missed opportunity untuk CDN/cache layer.
- **[Low] SVG dinormalisasi dengan regex** — `normalizeQrCodeSvg` menambah overhead kecil per request SVG.
- **[Low] Bundle/deployment ringan** — Hanya 3 runtime deps; tidak ada concern bundle size (server-side).

### Rekomendasi

1. Gunakan pool concurrency (mis. `p-limit` dengan max 5–10) untuk batch.
2. Untuk mode `binary` + PNG, gunakan `QRCode.toBuffer` langsung tanpa round-trip base64.
3. Tambahkan cache in-memory (LRU) atau header `Cache-Control` untuk endpoint preview GET.
4. Pertimbangkan timeout per-request (mis. 10s) pada generasi QR.

---

## 3. Reliability / Bug Risk

**Ringkasan:** Error handling terpusat dan validasi payload konsisten, tetapi logging absen, penanganan error Express tidak lengkap, dan beberapa konfigurasi TypeScript melemahkan type safety.

### Temuan

- **[High] Error tidak di-log** — `errorHandler.middleware.ts` menangkap semua error non-validation sebagai 500 tanpa `console.error`/structured logging — sulit debug production.
- **[Medium] Tidak ada handler JSON parse error** — Body JSON malformed dari `express.json()` tidak ditangani secara eksplisit; bisa menghasilkan response default Express.
- **[Medium] TypeScript strictness dilonggarkan** — `noImplicitAny: false`, `strictNullChecks: false` di `tsconfig.json` — meningkatkan risiko runtime bug.
- **[Medium] Batch selalu HTTP 200** — Meski semua item gagal, response tetap 200 dengan `successCount: 0`; klien harus parse `failedCount` (bisa membingungkan).
- **[Low] Tidak ada graceful shutdown** — `index.ts` tidak menangani SIGTERM/SIGINT.
- **[Low] `formatGoogleCalendarDate` edge case** — Regex `replace(/\.\d{3}/, '')` hanya menghapus satu grup milliseconds.
- **[Low] Phone prefix hardcoded** — `buildPhoneQrPayload` selalu `tel:+${phone}` setelah normalisasi tanpa `+`; asumsi nomor sudah format internasional tanpa kode negara eksplisit.

### Rekomendasi

1. Tambahkan structured logging (pino/winston) di error handler dan startup.
2. Tambahkan middleware error khusus untuk `SyntaxError` dari body parser.
3. Aktifkan `strictNullChecks` secara bertahap.
4. Pertimbangkan HTTP 207/422 untuk batch partial failure, atau 400 jika semua gagal.
5. Implementasi graceful shutdown dengan `server.close()`.

---

## 4. Maintainability

**Ringkasan:** Refactor ke pola registry + payload validators sudah baik dan modular, namun duplikasi endpoint legacy, dokumentasi minim, dan beberapa inkonsistensi API mengurangi kemudahan maintenance jangka panjang.

### Temuan

- **[Medium] Duplikasi endpoint** — `/qrcode/create` (unified) + 15 endpoint legacy per tipe; controller hampir identik — risiko drift saat menambah tipe baru.
- **[Medium] Tidak ada README** — Tidak ada dokumentasi setup, env vars, atau contoh request untuk integrator CMS.
- **[Low] Struktur folder rapi** — Pemisahan `payloads/`, `validators/`, `registry.ts`, `service.ts` jelas dan extensible.
- **[Low] `generateQrCode.ts` hanya re-export** — File legacy shim; bisa dihapus atau didokumentasikan.
- **[Low] Inkonsistensi API shape** — Legacy endpoint: data di root body (`{ url }`); unified: `{ type, data, options }` — dua kontrak berbeda.
- **[Low] `getQrCodeApiInfo` sangat besar** — Metadata API (~150 baris) di service; bisa dipindah ke file konfigurasi terpisah.

### Rekomendasi

1. Deprecate endpoint legacy; arahkan semua klien ke `/qrcode/create`.
2. Tambahkan README dengan daftar env, endpoint, dan contoh curl.
3. Ekstrak metadata API ke `api-info.ts`.
4. Pertimbangkan OpenAPI/Swagger spec auto-generated dari registry.

---

## 5. Testing

**Ringkasan:** Tidak ada test sama sekali — risiko regresi tinggi mengingat 15+ tipe QR dengan validasi masing-masing.

### Temuan

- **[High] Zero test coverage** — `package.json`: `"test": "echo \"Error: no test specified\" && exit 1"`. Tidak ada file `*.test.ts` / `*.spec.ts`.
- **[High] Tidak ada CI pipeline** — Tidak ada GitHub Actions / workflow untuk build/lint/test otomatis.
- **[Medium] Area kritis tanpa test** — Validators (`common.ts`, `payment.ts`, `network.ts`), batch partial failure, response modes (json/binary/dataUrl) tidak ter-cover.
- **[Low] Build TypeScript lulus** — `npm run build` sukses setelah `npm install`.

### Rekomendasi

1. Setup Jest/Vitest + supertest untuk integration test endpoint utama.
2. Unit test untuk setiap validator payload (terutama payment QRIS, wifi, vcard, UTM).
3. Test batch: success partial, all-fail, max items boundary (50/51).
4. Tambahkan GitHub Actions: `npm ci && npm run build && npm test`.

---

## Ringkasan Prioritas

| Prioritas | Item |
|-----------|------|
| P0 | Auth + rate limiting |
| P0 | Logging error production |
| P1 | Test suite + CI |
| P1 | Batch concurrency limit |
| P2 | README + deprecate legacy endpoints |
| P2 | Security headers + body limit eksplisit |
