# Supabase Storage untuk Foto Bukti Laporan

D4-8 memakai bucket private `report-evidence`. Upload dilakukan oleh pengguna
yang sedang login melalui Supabase browser client sehingga seluruh operasi tetap
melewati RLS. Preview pada detail laporan memakai signed URL yang berlaku satu
jam.

## Environment lokal

Tambahkan ke `.env.local` dan environment deployment:

```env
SUPABASE_STORAGE_BUCKET=report-evidence
```

Nama bucket dibaca melalui Server Action. Service role key tidak digunakan.

## Membuat bucket

Cara paling sederhana adalah melalui Supabase Dashboard:

1. Buka **Storage**.
2. Pilih **New bucket**.
3. Gunakan nama `report-evidence`.
4. Biarkan **Public bucket** tidak aktif.
5. Atur batas file `5 MB` jika opsi tersedia.
6. Batasi MIME type ke `image/jpeg`, `image/png`, dan `image/webp`.

Bucket juga dapat dibuat manual melalui SQL Editor:

```sql
insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'report-evidence',
  'report-evidence',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
```

## Policy Storage minimum untuk D4-8

Jalankan melalui SQL Editor jika policy bucket belum tersedia:

```sql
create policy "authenticated can upload report evidence"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'report-evidence');

create policy "authenticated can read report evidence"
on storage.objects
for select
to authenticated
using (bucket_id = 'report-evidence');
```

Policy ini sengaja masih berupa policy MVP yang luas untuk pengguna
terautentikasi. Pembatasan berdasarkan role, kepemilikan laporan, dan akses file
harus diperketat pada D4-13 bersama audit RLS menyeluruh.

## Verifikasi manual

1. Login sebagai admin, mahasiswa, dosen, atau teknisi.
2. Buka `/reports/new?assetId=AST-001`.
3. Pilih foto JPG/PNG/WebP di bawah 5 MB lalu kirim laporan.
4. Pastikan row baru tersedia di `public.reports`.
5. Pastikan object tersedia pada path
   `reports/{reportId}/{timestamp}-{safeFileName}` di bucket.
6. Pastikan metadata tersedia di `public.report_attachments`.
7. Buka `/reports/{reportId}` dan pastikan signed URL menampilkan foto.

Jika laporan berhasil dibuat tetapi upload atau metadata gagal, UI menampilkan
peringatan tanpa membuat aplikasi crash.
