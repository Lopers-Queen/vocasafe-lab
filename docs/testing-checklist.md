# Testing Checklist

## Struktur dan tipe

- [ ] Seluruh folder yang disyaratkan tersedia.
- [ ] File TypeScript lolos pemeriksaan tipe tanpa `any` implisit.
- [ ] Relasi ID pada dummy data mengarah ke user, aset, dan SOP yang tersedia.
- [ ] Tidak ada akses Supabase atau API eksternal.

## Risk scoring

- [ ] Severity dan likelihood menerima bilangan bulat 1–5.
- [ ] Nilai di luar skala menghasilkan `RangeError`.
- [ ] Kontrol efektif, sebagian, dan tidak ada memberi modifier 0, 2, dan 4.
- [ ] Kejadian berulang menambah 2 poin.
- [ ] Skor akhir tidak melebihi 25.
- [ ] Batas level 4/5, 9/10, dan 16/17 menghasilkan level yang benar.
- [ ] Rekomendasi sesuai dengan level risiko.

## Checklist UI untuk task berikutnya

- [ ] Tidak terjadi horizontal overflow pada viewport mobile 360 px.
- [ ] Navigasi dan kontrol dapat digunakan dengan keyboard.
- [ ] Label, status, dan level risiko tidak hanya dibedakan melalui warna.
- [ ] Loading, empty, dan error state tersedia bila relevan.
- [ ] Alur utama berfungsi pada desktop dan mobile.

## Regresi alur demo

- [ ] Login dummy mengarahkan pengguna sesuai role.
- [ ] QR Code mengarah ke aset yang benar.
- [ ] Checklist dapat menghasilkan laporan.
- [ ] Laporan dapat diverifikasi dan ditindaklanjuti.
- [ ] Status aset dapat diperbarui.
- [ ] Ekspor audit menghasilkan data yang konsisten.
