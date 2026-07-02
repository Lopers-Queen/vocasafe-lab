# Final Testing Checklist VocaSafe Lab

Gunakan checklist ini sebelum deploy, presentasi, atau pengambilan screenshot proposal.

## 1. Route

- [ ] `/` dapat dibuka.
- [ ] `/login` dapat dibuka.
- [ ] `/dashboard` dapat dibuka setelah login.
- [ ] `/assets` menampilkan daftar asset.
- [ ] `/assets/AST-001` menampilkan detail asset valid.
- [ ] `/scan` menampilkan simulasi scan QR.
- [ ] `/reports` menampilkan daftar laporan.
- [ ] `/reports/new` menampilkan form laporan.
- [ ] `/reports/new?assetId=AST-001` otomatis memilih asset AST-001.
- [ ] `/reports/[id]` dengan ID valid menampilkan detail laporan.
- [ ] `/checklists` menampilkan checklist dan hasil lokal.
- [ ] `/checklists/new` menampilkan form checklist.
- [ ] `/checklists/new?assetId=AST-001` otomatis memilih asset AST-001.
- [ ] `/audit` menampilkan audit report.
- [ ] Unknown ID ditangani dengan pesan tidak ditemukan.

## 2. Role Access

### Mahasiswa

- [ ] Bisa akses `/dashboard`.
- [ ] Bisa akses `/scan`.
- [ ] Bisa akses `/assets`.
- [ ] Bisa akses `/reports`.
- [ ] Bisa akses `/reports/new`.
- [ ] Tidak bisa akses `/checklists`.
- [ ] Tidak bisa akses `/checklists/new`.
- [ ] Tidak bisa akses `/audit`.
- [ ] Tidak melihat kontrol ubah status laporan.

### Dosen

- [ ] Bisa akses `/dashboard`.
- [ ] Bisa akses `/scan`.
- [ ] Bisa akses `/assets`.
- [ ] Bisa akses `/reports`.
- [ ] Bisa akses `/reports/new`.
- [ ] Bisa akses `/checklists`.
- [ ] Bisa akses `/checklists/new`.
- [ ] Tidak bisa akses `/audit`.
- [ ] Tidak melihat kontrol ubah status laporan.

### Teknisi/Laboran

- [ ] Bisa akses `/dashboard`.
- [ ] Bisa akses `/scan`.
- [ ] Bisa akses `/assets`.
- [ ] Bisa akses `/reports`.
- [ ] Bisa akses `/reports/new`.
- [ ] Bisa akses `/checklists`.
- [ ] Bisa akses `/checklists/new`.
- [ ] Bisa akses `/audit`.
- [ ] Bisa mengubah status laporan.
- [ ] Bisa menyimpan catatan tindak lanjut.

### Kepala Laboratorium

- [ ] Bisa akses `/dashboard`.
- [ ] Bisa akses `/assets`.
- [ ] Bisa akses `/reports`.
- [ ] Bisa akses `/audit`.
- [ ] Tidak bisa akses `/scan`.
- [ ] Tidak bisa akses `/reports/new`.
- [ ] Tidak bisa akses `/checklists`.
- [ ] Tidak bisa akses `/checklists/new`.
- [ ] Tidak melihat kontrol ubah status laporan.

### Admin

- [ ] Bisa akses semua route.
- [ ] Bisa mengubah status laporan.
- [ ] Bisa menyimpan catatan tindak lanjut.

## 3. Risk Scoring

- [ ] Form laporan memiliki field severity.
- [ ] Form laporan memiliki field probability.
- [ ] Form laporan memiliki field exposure.
- [ ] Tidak ada field likelihood.
- [ ] Tidak ada field controlCondition.
- [ ] Tidak ada field isRecurring.
- [ ] Input 5, 4, 5 menghasilkan score 100.
- [ ] Input 5, 4, 5 menghasilkan category kritis.
- [ ] Threshold kategori sesuai:
  - [ ] 1-20 rendah
  - [ ] 21-50 sedang
  - [ ] 51-80 tinggi
  - [ ] 81-125 kritis

## 4. Laporan Bahaya

- [ ] `/reports/new?assetId=AST-001` otomatis memilih AST-001.
- [ ] Submit form valid menyimpan laporan ke `vocasafe_reports`.
- [ ] Laporan baru tampil di `/reports`.
- [ ] Laporan baru ikut dihitung di `/dashboard`.
- [ ] Laporan baru ikut tampil di `/audit`.
- [ ] Status awal laporan baru adalah `baru`.

## 5. Follow-Up Laporan

- [ ] Login sebagai teknisi.
- [ ] Buka detail laporan.
- [ ] Dropdown status mengikuti `report.status`.
- [ ] Ubah status menjadi `dalam_penanganan`.
- [ ] Simpan catatan tindak lanjut.
- [ ] Reload halaman.
- [ ] Status tetap `dalam_penanganan`.
- [ ] Simpan catatan kedua tanpa status mundur ke `diverifikasi`.
- [ ] Ubah status menjadi `selesai`.
- [ ] Reload halaman.
- [ ] Status tetap `selesai`.

## 6. Checklist

- [ ] `/checklists/new?assetId=AST-001` otomatis memilih AST-001.
- [ ] Checklist template dapat dipilih.
- [ ] Item checklist dapat dijawab Ya/Tidak/N/A.
- [ ] Opsi "Ada temuan risiko?" tampil.
- [ ] Jika temuan risiko = Ya, severity/probability/exposure tampil.
- [ ] Input 5, 4, 5 menghasilkan score 100 dan category kritis.
- [ ] Submit valid menyimpan hasil ke `vocasafe_checklist_results`.
- [ ] Hasil checklist baru tampil di `/checklists`.

## 7. Audit

- [ ] `/audit` membaca dummy reports + localStorage reports.
- [ ] Ringkasan risiko memakai category baru.
- [ ] Status laporan memakai status baru.
- [ ] Export CSV berjalan.
- [ ] Nama file CSV adalah `vocasafe-audit-report.csv`.
- [ ] Print / Save as PDF memanggil browser print dialog.
- [ ] Saat print, topbar/sidebar/tombol aksi tersembunyi.

## 8. Export CSV

- [ ] CSV berisi nomor laporan.
- [ ] CSV berisi judul laporan.
- [ ] CSV berisi lokasi.
- [ ] CSV berisi status.
- [ ] CSV berisi skor risiko.
- [ ] CSV berisi kategori risiko.

## 9. Print

- [ ] Tombol Print / PDF memanggil `window.print()`.
- [ ] Layout print bersih.
- [ ] Navigasi dan tombol aksi tidak ikut tercetak.

## 10. Mobile 390px

- [ ] Tidak ada horizontal overflow.
- [ ] Menu mobile bisa dibuka dan ditutup.
- [ ] Form laporan nyaman digunakan.
- [ ] Form checklist nyaman digunakan.
- [ ] Tabel audit tetap dapat dibaca/scroll horizontal bila perlu.
- [ ] Tombol utama tidak tertutup navigasi.

## 11. Build

- [ ] `npm run typecheck` lulus.
- [ ] `npm run build` lulus.
- [ ] Tidak ada runtime error di browser console.
- [ ] Tidak ada hydration error.

## 12. Safety

- [ ] Tidak ada Supabase.
- [ ] Tidak ada API AI.
- [ ] Tidak ada upload server/storage.
- [ ] Tidak ada kamera QR sungguhan.
- [ ] Tidak ada browser camera API.
- [ ] Tidak ada library PDF eksternal.
- [ ] Tidak ada secret/API key di repository.
