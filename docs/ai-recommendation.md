# AI-Assisted Risk Recommendation

## Tujuan Fitur

Fitur ini membantu pengguna menyusun rekomendasi tindak lanjut K3 berdasarkan konteks laporan atau checklist. Rekomendasi dibuat dari input terstruktur seperti judul, deskripsi, aset, lokasi, dan hasil risk scoring.

## AI Tidak Mengganti Risk Score

Risk score utama tetap dihitung secara rule-based dengan rumus:

```text
Risk Score = Severity x Probability x Exposure
```

AI tidak boleh menentukan, mengganti, atau menyimpan risk score. API rekomendasi akan menolak request jika `riskScore` tidak sama dengan hasil perkalian `severity`, `probability`, dan `exposure`, atau jika `riskCategory` tidak sesuai threshold.

## Keamanan Endpoint

Endpoint `/api/ai/risk-recommendation` hanya dapat dipanggil oleh pengguna dengan session Supabase yang valid dan profil `user_profiles` aktif. API memverifikasi user melalui Supabase Auth di server, lalu memeriksa `is_active` sebelum memproses request.

Setiap pengguna aktif dibatasi hingga 10 request per 60 detik. Counter disimpan di Supabase dan dikonsumsi melalui RPC atomik `consume_ai_rate_limit`, sehingga pembatasan tetap konsisten pada deployment Vercel/serverless. Request dengan body invalid tetap mengurangi kuota setelah autentikasi.

Rate limiter tidak memerlukan environment variable atau service role baru. Migration `004_ai_endpoint_rate_limit.sql` harus direview dan dijalankan manual sebelum endpoint aman ini diuji pada runtime.

Response error yang digunakan:

```text
400: request rekomendasi tidak valid
401: session login tidak tersedia
403: profil tidak tersedia atau tidak aktif
429: batas 10 request per 60 detik tercapai
500: layanan rekomendasi tidak tersedia
```

Semua response endpoint memakai `Cache-Control: no-store`. Response `429` juga menyertakan `Retry-After` dalam detik. Raw error Supabase/provider, token, cookie, API key, stack trace, dan reasoning metadata tidak dikirim ke client.

## Environment Variables

Variabel yang tersedia di `.env.example`:

```text
AI_PROVIDER=
OPENAI_API_KEY=
GEMINI_API_KEY=
DEEPSEEK_API_KEY=
OPENROUTER_API_KEY=
OPENROUTER_MODEL=openrouter/free
```

Nilai `AI_PROVIDER` yang didukung:

```text
none
openai
gemini
deepseek
openrouter
```

API key bersifat server-only. Jangan membaca key AI di Client Component dan jangan menaruh secret ke variabel `NEXT_PUBLIC_*`.

Untuk OpenRouter, gunakan:

```text
AI_PROVIDER=openrouter
OPENROUTER_API_KEY=<server-only key>
OPENROUTER_MODEL=openrouter/free
```

Model default OpenRouter adalah `openrouter/free` jika `OPENROUTER_MODEL` tidak diisi. Model ini memakai Free Models Router dari OpenRouter untuk memilih model free yang kompatibel. Integrasi ini memakai Chat Completions API OpenRouter tanpa fitur reasoning vendor, tanpa streaming, dan tanpa menyimpan reasoning.

## Provider Fallback

Jika `AI_PROVIDER` kosong, `none`, tidak valid, API key tidak tersedia, timeout, atau provider gagal, sistem memakai rekomendasi fallback rule-based.

Fallback berdasarkan kategori risiko:

```text
rendah: Pantau kondisi secara berkala dan dokumentasikan hasil pemeriksaan.
sedang: Jadwalkan pemeriksaan oleh teknisi atau laboran dan lakukan tindakan pencegahan.
tinggi: Batasi penggunaan alat atau area sampai dilakukan pemeriksaan dan tindakan perbaikan.
kritis: Hentikan penggunaan alat atau area sampai diperiksa dan diperbaiki oleh teknisi.
```

Fallback dapat menambahkan konteks singkat dari judul, aset, dan lokasi, tetapi tidak boleh mengarang fakta teknis yang tidak ada di input.

## Cara Test Tanpa API Key

1. Pastikan `AI_PROVIDER` kosong atau bernilai `none`.
2. Jalankan aplikasi lokal.
3. Login sebagai admin.
4. Buka `/reports/new?assetId=AST-001`.
5. Isi judul, deskripsi, lokasi, dan nilai risiko.
6. Pastikan skor risiko tetap berasal dari `severity x probability x exposure`.
7. Klik `Buat Rekomendasi AI`.
8. Pastikan rekomendasi fallback muncul dan UI tidak crash.
9. Submit laporan seperti biasa untuk memastikan alur laporan tetap normal.

Endpoint tetap memerlukan session login dan profil aktif walaupun provider key tidak tersedia. Kegagalan provider akan menghasilkan rekomendasi fallback, bukan melewati autentikasi atau rate limiter.

## Cara Test Dengan Provider

1. Set `AI_PROVIDER` ke `openai`, `gemini`, `deepseek`, atau `openrouter`.
2. Isi API key provider yang sesuai di environment server.
3. Jalankan ulang aplikasi agar environment terbaca.
4. Buka form laporan baru dan klik `Buat Rekomendasi AI`.
5. Pastikan response `provider` sesuai provider yang dipilih.
6. Jika provider gagal, pastikan response tetap fallback dan UI tidak crash.

## Cara Test Keamanan dan Rate Limit

1. Review migration `004_ai_endpoint_rate_limit.sql`; jangan jalankan tanpa persetujuan manual.
2. Setelah migration diterapkan, panggil endpoint tanpa login dan pastikan response `401`.
3. Login dengan profil inactive dan pastikan response `403`.
4. Login dengan profil aktif dan kirim request valid; pastikan response `200`.
5. Kirim total 11 request dalam 60 detik dengan user yang sama.
6. Pastikan request ke-11 mendapat `429`, `retryAfterSeconds`, dan header `Retry-After`.
7. Pastikan user aktif lain memiliki counter terpisah.
8. Setelah 60 detik, pastikan request kembali diterima.
9. Matikan provider atau gunakan key invalid; pastikan response tetap `200` dengan `provider: fallback` selama kuota tersedia.
10. Pastikan score dan kategori pada response tidak berubah dari hasil rule-based.

## Risiko dan Batasan

- Output AI perlu review manusia sebelum dijadikan keputusan akhir.
- Provider AI bisa gagal, timeout, atau mengembalikan output yang kurang sesuai.
- Jangan memasukkan data sensitif berlebihan ke deskripsi laporan atau checklist.
- Score utama tetap rule-based dan tidak ditentukan oleh provider AI.
- Rekomendasi AI tidak disimpan otomatis ke database pada D4-14.
