# AI-Assisted Risk Recommendation

## Tujuan Fitur

Fitur ini membantu pengguna menyusun rekomendasi tindak lanjut K3 berdasarkan konteks laporan atau checklist. Rekomendasi dibuat dari input terstruktur seperti judul, deskripsi, aset, lokasi, dan hasil risk scoring.

## AI Tidak Mengganti Risk Score

Risk score utama tetap dihitung secara rule-based dengan rumus:

```text
Risk Score = Severity x Probability x Exposure
```

AI tidak boleh menentukan, mengganti, atau menyimpan risk score. API rekomendasi akan menolak request jika `riskScore` tidak sama dengan hasil perkalian `severity`, `probability`, dan `exposure`, atau jika `riskCategory` tidak sesuai threshold.

## Environment Variables

Variabel yang tersedia di `.env.example`:

```text
AI_PROVIDER=
OPENAI_API_KEY=
GEMINI_API_KEY=
DEEPSEEK_API_KEY=
```

Nilai `AI_PROVIDER` yang didukung:

```text
none
openai
gemini
deepseek
```

API key bersifat server-only. Jangan membaca key AI di Client Component dan jangan menaruh secret ke variabel `NEXT_PUBLIC_*`.

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

## Cara Test Dengan Provider

1. Set `AI_PROVIDER` ke `openai`, `gemini`, atau `deepseek`.
2. Isi API key provider yang sesuai di environment server.
3. Jalankan ulang aplikasi agar environment terbaca.
4. Buka form laporan baru dan klik `Buat Rekomendasi AI`.
5. Pastikan response `provider` sesuai provider yang dipilih.
6. Jika provider gagal, pastikan response tetap fallback dan UI tidak crash.

## Risiko dan Batasan

- Output AI perlu review manusia sebelum dijadikan keputusan akhir.
- Provider AI bisa gagal, timeout, atau mengembalikan output yang kurang sesuai.
- Jangan memasukkan data sensitif berlebihan ke deskripsi laporan atau checklist.
- Score utama tetap rule-based dan tidak ditentukan oleh provider AI.
- Rekomendasi AI tidak disimpan otomatis ke database pada D4-14.
