# Administrasi VocaSafe Lab

Halaman `/admin` hanya tersedia untuk profil dengan role `admin`. Halaman ini
membaca `user_profiles`, `laboratories`, `assets`, `checklist_templates`, dan
`checklist_items` melalui Supabase menggunakan session pengguna yang sedang
login.

## Pembuatan akun

1. Akun Supabase Auth pertama tetap dibuat manual melalui Supabase Dashboard.
2. Setiap akun Auth harus memiliki row dengan ID yang sama di
   `public.user_profiles` agar dapat login ke aplikasi.
3. Halaman admin mengelola profil aplikasi dan tidak membuat atau mengubah user
   Supabase Auth.

## Batasan D4-12

- Daftar profil pengguna dapat dibaca oleh admin sesuai policy RLS saat ini.
- Perubahan `role` dan `is_active` belum tersedia karena migration awal belum
  memiliki policy `UPDATE` untuk `user_profiles`.
- Data dasar ditampilkan read-only untuk menjaga scope perubahan tetap kecil.
- Tidak ada service role key atau admin client yang digunakan di browser.
- Review dan hardening policy RLS dijadwalkan pada D4-13 sebelum fitur edit
  profil dapat diaktifkan.
