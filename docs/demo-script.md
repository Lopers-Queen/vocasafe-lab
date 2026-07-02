# Demo Script VocaSafe Lab

## Skenario utama

1. Masuk sebagai auditor menggunakan login dummy.
2. Buka data Mesin Bor Duduk 01 melalui simulasi pemindaian QR Code.
3. Tinjau identitas aset, status, SOP, dan alat pelindung diri wajib.
4. Isi checklist K3 dan tandai pelindung mata bor sebagai tidak aman.
5. Buat laporan bahaya dan tambahkan foto bukti simulasi.
6. Masukkan severity, likelihood, kondisi kontrol, dan status kejadian berulang.
7. Tunjukkan skor risiko kritis beserta rekomendasi penghentian penggunaan alat.
8. Masuk sebagai admin lab dan verifikasi laporan.
9. Masuk sebagai teknisi dan catat tindak lanjut perbaikan.
10. Perbarui status alat dan tampilkan ekspor laporan audit sederhana.

## Data demo utama

- Aset: Mesin Bor Duduk 01 (`MBD-01`)
- Laporan: Pelindung mata bor longgar (`VSL-2026-0001`)
- Perhitungan: severity 4 × likelihood 4 + kontrol sebagian 2 + berulang 2 = 20
- Hasil: risiko kritis

## Catatan presenter

Tekankan bahwa scoring saat ini sepenuhnya rule-based, dapat diaudit, dan belum menggunakan API AI. Data masih dummy agar demonstrasi UI dan alur dapat divalidasi sebelum integrasi backend.
