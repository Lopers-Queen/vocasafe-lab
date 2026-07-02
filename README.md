# VocaSafe Lab

VocaSafe Lab adalah prototype sistem audit K3 dan manajemen risiko laboratorium vokasi berbasis QR Code dan AI-Assisted Risk Scoring.

Prototype ini dirancang untuk demo hackathon, bahan screenshot/mockup proposal, dan validasi alur kerja K3 laboratorium vokasi. Data masih menggunakan dummy data dan localStorage.

## Fitur Utama

- Dummy login role
- Dashboard monitoring
- Data alat/fasilitas
- Detail asset + QR Code
- Simulasi scan QR
- SOP digital
- Form laporan bahaya
- Risk scoring severity x probability x exposure
- Daftar laporan
- Tindak lanjut laporan
- Checklist K3
- Audit report
- Export CSV
- Print / Save as PDF

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- LocalStorage
- qrcode.react
- lucide-react

## Role Demo

- Mahasiswa
- Dosen
- Teknisi/Laboran
- Kepala Laboratorium
- Admin

## Hak Akses Role

| Route | Mahasiswa | Dosen | Teknisi | Kepala Lab | Admin |
|---|---:|---:|---:|---:|---:|
| `/dashboard` | Ya | Ya | Ya | Ya | Ya |
| `/scan` | Ya | Ya | Ya | Tidak | Ya |
| `/assets` | Ya | Ya | Ya | Ya | Ya |
| `/assets/[id]` | Ya | Ya | Ya | Ya | Ya |
| `/reports` | Ya | Ya | Ya | Ya | Ya |
| `/reports/new` | Ya | Ya | Ya | Tidak | Ya |
| `/reports/[id]` | Ya | Ya | Ya | Ya | Ya |
| `/checklists` | Tidak | Ya | Ya | Tidak | Ya |
| `/checklists/new` | Tidak | Ya | Ya | Tidak | Ya |
| `/audit` | Tidak | Tidak | Ya | Ya | Ya |

Hanya `teknisi` dan `admin` yang dapat mengubah status laporan dan menambahkan catatan tindak lanjut.

## Status Laporan

Status laporan resmi:

- `baru`
- `diverifikasi`
- `dalam_penanganan`
- `selesai`
- `ditolak`

## Risk Scoring

Rumus risk scoring:

```text
Risk Score = Severity x Probability x Exposure
```

Setiap faktor bernilai integer 1 sampai 5.

Kategori risiko:

| Skor | Kategori |
|---:|---|
| 1-20 | rendah |
| 21-50 | sedang |
| 51-80 | tinggi |
| 81-125 | kritis |

Contoh:

```text
Severity = 5
Probability = 4
Exposure = 5
Risk Score = 5 x 4 x 5 = 100
Kategori = kritis
```

## Cara Menjalankan Lokal

```bash
npm install
npm run dev
```

Buka aplikasi di browser melalui URL yang ditampilkan Next.js, biasanya:

```text
http://localhost:3000
```

Validasi sebelum deploy:

```bash
npm run typecheck
npm run build
```

## Data Prototype

Prototype ini belum memakai backend production. Data demo terdiri dari:

- Dummy data untuk user, asset, SOP, checklist template, dan laporan awal
- localStorage untuk laporan baru, tindak lanjut, dan hasil checklist lokal

Key localStorage utama:

- `vocasafe_current_user`
- `vocasafe_reports`
- `vocasafe_checklist_results`

## Catatan Prototype

- Belum memakai Supabase
- Belum memakai API AI
- Belum memakai kamera QR sungguhan
- Belum memakai upload server/storage
- Belum memakai library PDF eksternal
- Export PDF menggunakan fitur browser Print / Save as PDF
- Semua data demo memakai dummy data dan localStorage

## Dokumentasi Tambahan

- Demo script: `docs/demo-script.md`
- Testing checklist: `docs/testing-checklist.md`
- Release notes: `docs/release-notes.md`
- Project summary: `docs/project-summary.md`
