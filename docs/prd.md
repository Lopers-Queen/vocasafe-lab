# Product Requirements Document — VocaSafe Lab

## Ringkasan

VocaSafe Lab adalah prototype web responsif untuk audit K3 dan manajemen risiko laboratorium vokasi. Sistem menghubungkan data alat atau fasilitas dengan QR Code, SOP digital, checklist, laporan bahaya, serta penilaian risiko berbasis aturan.

## Tujuan MVP

- Mempercepat akses informasi K3 melalui QR Code.
- Menstandarkan proses pemeriksaan dan pelaporan bahaya.
- Menghasilkan skor risiko yang transparan dan konsisten.
- Memudahkan pemantauan verifikasi dan tindak lanjut laporan.
- Menyediakan alur demo hackathon yang dapat dijalankan di desktop dan mobile.

## Peran pengguna

- **Admin Lab:** memantau dashboard, memverifikasi laporan, dan memperbarui status alat.
- **Auditor:** memeriksa alat atau fasilitas, mengisi checklist, dan membuat laporan.
- **Teknisi:** melihat laporan terverifikasi dan mencatat tindak lanjut.

Autentikasi pada MVP menggunakan pilihan role dan data pengguna dummy.

## Ruang lingkup MVP

1. Login dummy berdasarkan role.
2. Dashboard monitoring.
3. Daftar dan detail alat atau fasilitas.
4. QR Code untuk membuka detail aset.
5. SOP digital dan checklist K3.
6. Laporan bahaya atau kerusakan dengan simulasi unggah foto.
7. Risk scoring rule-based dan rekomendasi tindakan awal.
8. Daftar, verifikasi, dan tindak lanjut laporan.
9. Pembaruan status alat atau fasilitas.
10. Ekspor laporan audit sederhana.

## Di luar ruang lingkup saat ini

- Supabase dan penyimpanan data permanen.
- API AI atau machine learning.
- Autentikasi produksi dan manajemen izin tingkat lanjut.
- Notifikasi, integrasi perangkat IoT, dan aplikasi native.

## Kriteria keberhasilan demo

- Alur utama dapat diselesaikan tanpa backend eksternal.
- Data yang tampil konsisten antara aset, SOP, checklist, dan laporan.
- Skor risiko dapat dijelaskan dari input dan aturan yang digunakan.
- Halaman yang nanti dibangun dapat digunakan pada viewport desktop dan mobile.
