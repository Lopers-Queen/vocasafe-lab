# Supabase Setup VocaSafe Lab D4

Dokumen ini menjelaskan setup Supabase development untuk migrasi D4. Sampai
D4-4, autentikasi sudah memakai Supabase Auth dan role aplikasi dibaca dari
`public.user_profiles`. Data operasional aplikasi belum dimigrasikan dari dummy
data/localStorage.

## 1. Buat Project Supabase

1. Buka Supabase Dashboard.
2. Buat project baru untuk VocaSafe Lab.
3. Simpan project URL dan anon key.
4. Simpan service role key hanya untuk server-side operations.

## 2. Environment Variables

Salin `.env.example` menjadi `.env.local` untuk development lokal, lalu isi nilai berikut:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
AI_PROVIDER=
OPENAI_API_KEY=
GEMINI_API_KEY=
DEEPSEEK_API_KEY=
SUPABASE_STORAGE_BUCKET=report-evidence
```

Catatan keamanan:

- `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_ANON_KEY` boleh dipakai browser.
- `SUPABASE_SERVICE_ROLE_KEY` wajib server-only.
- AI API keys wajib server-only.
- Jangan commit `.env.local` atau file `.env` berisi secret.
- Service role key hanya boleh digunakan di Route Handler, Server Action, atau module server-only.

## 3. Jalankan Migration Awal

Migration awal berada di:

```text
supabase/migrations/001_initial_d4_schema.sql
```

Untuk menjalankan migration secara manual pada project development:

1. Buka Supabase Dashboard dan pilih project VocaSafe Lab.
2. Buka **SQL Editor** lalu buat query baru.
3. Salin seluruh isi `001_initial_d4_schema.sql` ke editor.
4. Pastikan project yang dipilih adalah environment development.
5. Jalankan query sekali dan periksa bahwa tidak ada error.

Migration juga dapat dijalankan melalui Supabase CLI jika project sudah di-link,
tetapi jangan menjalankan ulang file manual tanpa memastikan status migration.

Migration ini membuat:

- enum role/status/risiko/asset/checklist
- tabel laboratories, user_profiles, sops, assets, k3_facilities, risk_points
- tabel reports, report_followups, report_attachments
- tabel checklist_templates, checklist_items, checklist_results, checklist_result_items
- tabel audit_logs
- index penting
- RLS awal
- helper function RLS awal

Catatan: migration ini dimaksudkan untuk dijalankan sekali oleh tracking migration Supabase. File ini tidak dirancang sebagai script idempotent penuh untuk eksekusi manual berulang-ulang.

## 4. Jalankan Seed Awal

Seed awal berada di:

```text
supabase/seed/001_seed_initial_data.sql
```

Seed berisi:

- 1 laboratory
- 3 SOP
- 3 assets
- 2 K3 facilities
- 1 checklist template
- 10 checklist items

Seed tidak membuat `auth.users` dan tidak membuat final `user_profiles`.

Untuk menjalankan seed secara manual:

1. Pastikan migration awal berhasil dijalankan.
2. Buka **SQL Editor** pada project development yang sama.
3. Salin seluruh isi `001_seed_initial_data.sql` ke query baru.
4. Jalankan query dan lanjutkan dengan query verifikasi di bawah.

### 4.1 Verifikasi Jumlah Seed

Jalankan query read-only berikut melalui SQL Editor:

```sql
select count(*) from public.laboratories;
select count(*) from public.sops;
select count(*) from public.assets;
select count(*) from public.k3_facilities;
select count(*) from public.checklist_templates;
select count(*) from public.checklist_items;
```

Hasil yang diharapkan:

| Tabel | Jumlah |
|---|---:|
| `laboratories` | 1 |
| `sops` | 3 |
| `assets` | 3 |
| `k3_facilities` | 2 |
| `checklist_templates` | 1 |
| `checklist_items` | 10 |

### 4.2 Verifikasi Asset dan Relasi SOP

```sql
select code, name, status, kind, location
from public.assets
order by code;

select
  a.code as asset_code,
  a.name as asset_name,
  s.title as sop_title
from public.assets a
left join public.sops s on s.id = a.sop_id
order by a.code;
```

Data yang diharapkan:

- `AST-001` — Mesin Bor Duduk 01 — SOP Penggunaan Mesin Bor
- `AST-002` — APAR Ruang Praktikum — SOP Pemeriksaan APAR
- `AST-003` — Kotak P3K — SOP Pemeriksaan P3K

Status asset harus menggunakan enum `layak`, `perlu_dicek`, atau
`tidak_layak`.

### 4.3 Verifikasi Template dan Item Checklist

```sql
select title, is_active
from public.checklist_templates;

select label, sort_order
from public.checklist_items
order by sort_order;
```

Template `Checklist K3 Laboratorium Vokasi` harus aktif dan memiliki 10 item
dengan urutan berikut:

1. Kondisi fisik alat/fasilitas
2. Kabel dan konektor
3. Panel listrik
4. APD tersedia
5. APAR tersedia dan layak
6. Kotak P3K lengkap
7. Kebersihan area kerja
8. Safety sign tersedia
9. Jalur evakuasi tidak terhalang
10. Ventilasi ruangan baik

## 5. Buat Admin Pertama

Admin pertama dibuat manual lewat Supabase Dashboard:

1. Buka Authentication > Users.
2. Tambahkan user admin dengan email/password.
3. Catat UUID user yang dibuat.
4. Buka SQL Editor.
5. Insert row ke `public.user_profiles` dengan UUID yang sama.

Contoh kasar:

```sql
insert into public.user_profiles (id, full_name, email, role, is_active)
values (
  '<auth-user-uuid>',
  'Admin VocaSafe',
  'admin@example.com',
  'admin',
  true
);
```

Ganti email dan UUID sesuai user Auth yang dibuat. Jangan gunakan contoh ini untuk production tanpa menyesuaikan data sebenarnya.

Admin pertama sengaja dibuat manual agar ada akun awal yang dapat login sebelum
halaman administrasi user tersedia. User berikutnya nantinya dibuat melalui
halaman admin aplikasi pada task khusus admin user.

Validasi profile admin dengan query read-only berikut:

```sql
select id, full_name, email, role, is_active
from public.user_profiles
where role = 'admin';
```

Pastikan minimal satu row tersedia, `role = 'admin'`, `is_active = true`, dan
nilai `id` sama dengan UUID user pada **Authentication > Users**. Untuk validasi
langsung dari SQL Editor, gunakan:

```sql
select
  p.id,
  p.full_name,
  p.email,
  p.role,
  p.is_active,
  (u.id is not null) as auth_user_exists
from public.user_profiles p
left join auth.users u on u.id = p.id
where p.role = 'admin';
```

Jangan menyalin UUID, email, password, access token, atau key asli ke dokumentasi,
issue tracker, maupun output agent. Sensor identifier saat membuat laporan.

## 6. RLS Draft Awal

RLS di D4-1 masih draft awal agar tidak ada tabel public tanpa RLS.

Catatan penting:

- RLS sudah di-enable pada seluruh tabel utama yang dibuat oleh migration D4-1.
- Policy awal memakai role authenticated dan helper role dari `user_profiles`.
- Policy `authenticated select` untuk reports, followups, dan attachments masih perlu hardening berbasis lab scope pada D4-13.
- Helper `SECURITY DEFINER` perlu review owner, privilege, dan grant pada D4-13.
- Jangan anggap RLS D4-1 sebagai final production policy.

## 7. Storage

Target bucket untuk evidence photos:

```text
report-evidence
```

Bucket belum dibuat pada D4-2. Storage bucket dan policy akan dibuat pada task Storage berikutnya.

## 8. Free Tier Note

Supabase Free tier cukup untuk tahap awal demo dan development, tetapi perhatikan limit:

- database size
- bandwidth
- storage
- Auth rate limits
- project pausing bila tidak aktif

Untuk production sesungguhnya, evaluasi plan sesuai kebutuhan penggunaan.

## 9. Status Sampai D4-4

- D4-1: schema, RLS draft, dan seed plan selesai.
- D4-2: helper Supabase browser/server/admin selesai.
- D4-3: Supabase Auth, `user_profiles`, dan route guard selesai.
- D4-4: prosedur verifikasi seed dan admin pertama didokumentasikan.
- D4-5 berikutnya: migrasi halaman Assets dan SOP agar membaca Supabase.

`.env.local` hanya untuk development lokal dan tidak boleh di-commit. Pastikan
file tersebut tetap diabaikan Git sebelum menambahkan credential apa pun.
