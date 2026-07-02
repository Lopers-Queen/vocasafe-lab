# Release Notes

## v1.0.0 MVP Prototype

Tanggal rilis: 2026-07-02

Status: Release Candidate / MVP Prototype siap demo

## Ringkasan

VocaSafe Lab v1.0.0 adalah prototype web app responsif untuk audit K3 dan manajemen risiko laboratorium vokasi. Versi ini berfokus pada alur demo end-to-end: login role, asset, SOP, QR Code, laporan bahaya, risk scoring, checklist K3, tindak lanjut teknisi, audit report, export CSV, dan print/save as PDF.

## Fitur Utama

- Landing page VocaSafe Lab
- Dummy login role:
  - Mahasiswa
  - Dosen
  - Teknisi/Laboran
  - Kepala Laboratorium
  - Admin
- Dashboard monitoring laporan dan risiko
- Daftar asset alat/fasilitas
- Detail asset dengan QR Code dan SOP digital
- Simulasi scan QR
- Form laporan bahaya dengan risk scoring
- Risk scoring resmi:
  - Severity x Probability x Exposure
  - 1-20 rendah
  - 21-50 sedang
  - 51-80 tinggi
  - 81-125 kritis
- Daftar laporan gabungan dummy data dan localStorage
- Detail laporan dengan riwayat status
- Panel tindak lanjut laporan untuk teknisi/admin
- Checklist K3 dengan penyimpanan localStorage
- Risk finding pada checklist dengan severity/probability/exposure
- Audit report
- Export CSV dengan nama `vocasafe-audit-report.csv`
- Print / Save as PDF melalui browser print
- Route guard dan navigasi berbasis role access

## Perbaikan Final QA

### Status Follow-Up

- Dropdown status tindak lanjut mengikuti `report.status` saat halaman dimuat.
- Status tidak kembali ke `diverifikasi` setelah reload.
- Status tidak mundur kecuali user memilih status tersebut secara eksplisit.

### Dashboard

- Dashboard membaca gabungan `dummyReports` + localStorage `vocasafe_reports` melalui `getAllReports()`.
- Laporan berstatus `dalam_penanganan` dihitung sebagai belum selesai.
- Status `selesai` dan `ditolak` tidak dihitung sebagai belum selesai.

### Normalisasi Spesifikasi

- Role resmi dinormalisasi menjadi:
  - `mahasiswa`
  - `dosen`
  - `teknisi`
  - `kepala_lab`
  - `admin`
- Status laporan resmi dinormalisasi menjadi:
  - `baru`
  - `diverifikasi`
  - `dalam_penanganan`
  - `selesai`
  - `ditolak`
- Risk scoring dinormalisasi menjadi:
  - `severity`
  - `probability`
  - `exposure`
  - `score`
  - `category`

### LocalStorage Migration

- Laporan localStorage lama dapat dibaca dan dinormalisasi saat runtime:
  - `dilaporkan` menjadi `baru`
  - `ditindaklanjuti` menjadi `dalam_penanganan`
  - `likelihood` menjadi `probability`
  - `riskResult.level` menjadi `riskResult.category`
  - `exposure` fallback ke 1 bila data lama belum memilikinya

## Batasan Prototype

- Belum memakai Supabase atau database production.
- Belum memakai API AI sungguhan.
- Belum memakai kamera QR sungguhan.
- Belum memakai upload server/storage.
- Belum memakai library PDF eksternal.
- Data demo tersimpan pada dummy data dan localStorage browser.

## Validasi Rilis

Validasi yang harus lulus sebelum deploy:

```bash
npm run typecheck
npm run build
```

Build terakhir menghasilkan route utama:

- `/`
- `/login`
- `/dashboard`
- `/assets`
- `/assets/[id]`
- `/scan`
- `/reports`
- `/reports/new`
- `/reports/[id]`
- `/checklists`
- `/checklists/new`
- `/audit`

## Catatan Deploy

- Pastikan tidak ada data sensitif di repository.
- Karena prototype memakai localStorage, data demo dapat berbeda antar browser/perangkat.
- Untuk reset data demo lokal, localStorage browser dapat dibersihkan manual.
