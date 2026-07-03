# Supabase Setup VocaSafe Lab D4

Dokumen ini menjelaskan setup Supabase awal untuk migrasi D4. Pada tahap D4-2, aplikasi MVP lama belum dimigrasikan ke Supabase; file ini hanya menyiapkan fondasi.

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

Untuk tahap awal, jalankan manual melalui Supabase SQL Editor atau Supabase CLI pada environment development.

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

## 5. Buat Admin Pertama

Admin pertama dibuat manual lewat Supabase Dashboard:

1. Buka Authentication > Users.
2. Tambahkan user admin dengan email/password.
3. Catat UUID user yang dibuat.
4. Buka SQL Editor.
5. Insert row ke `public.user_profiles` dengan UUID tersebut.

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

## 6. RLS Draft Awal

RLS di D4-1 masih draft awal agar tidak ada tabel public tanpa RLS.

Catatan penting:

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

## 9. Status D4-2

D4-2 hanya menambahkan dependency dan helper Supabase:

- browser client
- server client
- admin client server-only
- placeholder database types

Belum ada migrasi UI, route guard, atau auth flow aplikasi ke Supabase pada task ini.
