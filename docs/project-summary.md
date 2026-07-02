# Project Summary: VocaSafe Lab

## Masalah

Laboratorium vokasi memiliki banyak alat dan fasilitas yang digunakan oleh mahasiswa, dosen, teknisi, dan pengelola lab. Risiko K3 sering muncul dari alat yang tidak layak pakai, SOP yang tidak mudah diakses, laporan bahaya yang tidak terdokumentasi, dan tindak lanjut yang sulit dipantau.

Masalah utama yang ingin dijawab:

- Informasi alat dan SOP tidak selalu tersedia saat praktik berlangsung.
- Pelaporan bahaya sering tidak terstruktur.
- Tingkat risiko sulit diprioritaskan secara konsisten.
- Tindak lanjut teknisi perlu tercatat dan mudah dipantau.
- Kepala laboratorium membutuhkan ringkasan audit yang mudah dibaca.

## Solusi

VocaSafe Lab adalah prototype sistem audit K3 dan manajemen risiko laboratorium vokasi berbasis web. Sistem ini menghubungkan asset lab, SOP digital, QR Code, laporan bahaya, risk scoring, checklist K3, dan audit report dalam satu alur demo.

Solusi utama:

- Asset memiliki detail, status, SOP, dan QR Code.
- Pengguna dapat mensimulasikan scan QR untuk membuka detail asset.
- Mahasiswa/dosen/teknisi dapat membuat laporan bahaya.
- Risiko dihitung memakai severity x probability x exposure.
- Teknisi/admin dapat menindaklanjuti laporan dengan status dan catatan.
- Dosen/teknisi/admin dapat mengisi checklist K3.
- Kepala lab/admin dapat melihat audit report dan export CSV.

## Target Pengguna

- **Mahasiswa**: scan QR, melihat asset, melaporkan bahaya.
- **Dosen**: memantau asset, membuat laporan, mengisi checklist.
- **Teknisi/Laboran**: menindaklanjuti laporan, mengisi checklist, melihat audit.
- **Kepala Laboratorium**: memantau dashboard, laporan, dan audit report.
- **Admin**: mengelola seluruh alur demo dan melakukan tindak lanjut.

## Fitur

- Dummy login role
- Dashboard monitoring
- Data alat/fasilitas
- Detail asset + QR Code
- SOP digital
- Simulasi scan QR
- Form laporan bahaya
- Risk scoring severity x probability x exposure
- Daftar laporan
- Detail laporan
- Tindak lanjut laporan
- Checklist K3
- Risk finding pada checklist
- Audit report
- Export CSV
- Print / Save as PDF
- Role-based navigation dan route guard

## Teknologi

- Next.js App Router
- TypeScript
- Tailwind CSS
- qrcode.react
- lucide-react
- Dummy data
- localStorage

## Alur Kerja

1. Pengguna login dengan role demo.
2. Pengguna membuka dashboard untuk melihat kondisi risiko.
3. Pengguna melihat daftar asset dan membuka detail asset.
4. Detail asset menampilkan SOP digital dan QR Code.
5. Pengguna mensimulasikan scan QR untuk membuka asset.
6. Pengguna membuat laporan bahaya.
7. Sistem menghitung risiko dengan severity x probability x exposure.
8. Laporan tersimpan dan tampil di daftar laporan/dashboard/audit.
9. Teknisi/admin membuka laporan dan menambahkan tindak lanjut.
10. Dosen/teknisi/admin mengisi checklist K3.
11. Kepala lab/admin membuka audit report untuk rekap dan export.

## Keunggulan

- Alur end-to-end mudah dipahami untuk demo.
- Risk scoring transparan dan berbasis rumus sederhana.
- Role access sesuai kebutuhan pengguna laboratorium.
- QR Code dan SOP membantu akses informasi asset.
- Dashboard dan audit report mendukung pengambilan keputusan.
- Prototype tidak membutuhkan backend sehingga mudah dijalankan lokal.
- Data lokal memungkinkan demo interaktif tanpa server.

## Batasan Prototype

- Belum memakai database production seperti Supabase.
- Belum memakai API AI sungguhan.
- Belum memakai kamera QR sungguhan.
- Belum memakai upload file atau storage server.
- Belum memakai authentication production.
- Belum memakai library PDF eksternal.
- Data tersimpan di localStorage sehingga bergantung pada browser/perangkat.

## Pengembangan Lanjutan

Tahap berikutnya yang dapat dikembangkan:

- Integrasi Supabase untuk database dan authentication.
- QR scanner sungguhan menggunakan kamera browser.
- Upload bukti foto ke storage.
- AI-assisted recommendation untuk tindak lanjut risiko.
- Dashboard grafik tren risiko.
- Notifikasi untuk laporan kritis.
- Export audit report ke PDF production.
- Manajemen master data asset, SOP, user, dan checklist.
- Multi-lab support untuk beberapa jurusan atau kampus.
