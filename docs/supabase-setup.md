# Supabase Setup VocaSafe Lab D4

Dokumen ini menjelaskan setup Supabase untuk D4 production-like migration. Pada kondisi D4 saat ini, aplikasi sudah memakai Supabase Auth, `public.user_profiles`, Supabase Database, Supabase Storage, dan RLS hardening D4-13 untuk route aktif.

Route aktif D4 memakai Supabase sebagai sumber utama untuk auth, asset/SOP, reports/follow-up/evidence metadata, checklist, dashboard, audit, dan admin page. File dummy/localStorage lama masih ada sebagai artefak legacy/non-runtime, tetapi bukan sumber utama route D4 aktif.

## 1. Buat Project Supabase

1. Buka Supabase Dashboard.
2. Buat project baru untuk VocaSafe Lab.
3. Simpan project URL dan anon key.
4. Simpan service role key hanya jika ada kebutuhan server-only admin operation.
5. Jangan menyalin secret ke dokumentasi, issue, PR, atau output agent.

## 2. Environment Variables

Salin `.env.example` menjadi `.env.local` untuk development lokal, lalu isi nilai berikut:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_STORAGE_BUCKET=report-evidence
AI_PROVIDER=
OPENAI_API_KEY=
GEMINI_API_KEY=
DEEPSEEK_API_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

Catatan keamanan:

- `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_ANON_KEY` boleh dipakai browser.
- `SUPABASE_STORAGE_BUCKET` berisi nama bucket, bukan secret.
- `SUPABASE_SERVICE_ROLE_KEY` wajib server-only dan tidak boleh dipakai di Client Component.
- AI API keys wajib server-only dan tidak boleh memakai prefix `NEXT_PUBLIC_`.
- Jangan commit `.env.local` atau file `.env` berisi secret.

## 3. Jalankan Migration 001

Migration awal berada di:

```text
supabase/migrations/001_initial_d4_schema.sql
```

Untuk menjalankan migration secara manual:

1. Buka Supabase Dashboard dan pilih project target.
2. Buka **SQL Editor** lalu buat query baru.
3. Salin seluruh isi `001_initial_d4_schema.sql`.
4. Pastikan environment yang dipilih benar.
5. Jalankan query sekali dan periksa tidak ada error.

Migration ini membuat:

- enum role/status/risiko/asset/checklist
- tabel `laboratories`, `user_profiles`, `sops`, `assets`, `k3_facilities`, `risk_points`
- tabel `reports`, `report_followups`, `report_attachments`
- tabel `checklist_templates`, `checklist_items`, `checklist_results`, `checklist_result_items`
- tabel `audit_logs`
- index penting
- RLS awal
- helper function RLS awal

Catatan: migration ini dimaksudkan untuk dijalankan sekali oleh tracking migration Supabase. File ini tidak dirancang sebagai script idempotent penuh untuk eksekusi manual berulang.

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

1. Pastikan migration 001 berhasil dijalankan.
2. Buka **SQL Editor** pada project yang sama.
3. Salin seluruh isi `001_seed_initial_data.sql`.
4. Jalankan query dan lanjutkan dengan query verifikasi.

### 4.1 Verifikasi Jumlah Seed

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

- `AST-001` - Mesin Bor Duduk 01 - SOP Penggunaan Mesin Bor
- `AST-002` - APAR Ruang Praktikum - SOP Pemeriksaan APAR
- `AST-003` - Kotak P3K - SOP Pemeriksaan P3K

### 4.3 Verifikasi Template dan Item Checklist

```sql
select title, is_active
from public.checklist_templates;

select label, sort_order
from public.checklist_items
order by sort_order;
```

Template `Checklist K3 Laboratorium Vokasi` harus aktif dan memiliki 10 item:

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

Ganti email dan UUID sesuai user Auth yang dibuat. Jangan gunakan contoh ini tanpa menyesuaikan data environment.

Validasi profile admin:

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

Pastikan minimal satu row tersedia, `role = 'admin'`, `is_active = true`, dan nilai `id` sama dengan UUID user pada Authentication > Users.

## 6. Buat Bucket Storage Private

Bucket evidence wajib tersedia sebelum test reports dengan upload foto.

Target bucket:

```text
report-evidence
```

Requirement:

- Bucket private, bukan public.
- Batas file disarankan 5 MB.
- MIME type disarankan: `image/jpeg`, `image/png`, `image/webp`.
- Akses baca di aplikasi memakai signed URL.
- Policy final mengacu pada migration 002 D4-13, bukan policy MVP D4-8.

Detail setup ada di `docs/supabase-storage.md`.

## 7. Jalankan Migration 002 RLS Hardening

Migration hardening berada di:

```text
supabase/migrations/002_d4_rls_hardening.sql
```

Jalankan setelah:

1. Migration 001 berhasil.
2. Seed berhasil.
3. Admin pertama tersedia.
4. Bucket `report-evidence` sudah dibuat private.

Migration 002 memperketat:

- helper function role dan active user
- policy `user_profiles`
- policy reports, follow-up, attachment metadata
- policy checklist results dan result items
- policy Storage `report-evidence`
- grant/revoke helper function
- validasi database untuk risk scoring reports/checklists

Migration 002 juga harus men-drop policy manual lama yang terlalu luas:

- `report_evidence_authenticated_upload`
- `report_evidence_authenticated_read`

Detail review ada di `docs/rls-hardening.md`.

## 8. Runtime Verification

Setelah setup selesai, jalankan QA manual minimal:

1. Login admin.
2. Buka `/dashboard`, `/assets`, `/reports`, `/checklists`, `/audit`, dan `/admin`.
3. Buat laporan dari `/reports/new?assetId=AST-001`.
4. Upload evidence JPG/PNG/WebP dan pastikan signed URL tampil di detail laporan.
5. Update status/follow-up sebagai role manager.
6. Buat checklist dengan risiko dan tanpa risiko.
7. Pastikan dashboard dan audit membaca data Supabase terbaru.
8. Export CSV dan print audit.
9. Test role mahasiswa/dosen/teknisi/kepala_lab/admin sesuai matrix akses.

## 9. Free Tier Note

Supabase Free tier cukup untuk tahap demo dan development, tetapi perhatikan limit:

- database size
- bandwidth
- storage
- Auth rate limits
- project pausing bila tidak aktif

Untuk production sesungguhnya, evaluasi plan sesuai kebutuhan penggunaan.

## 10. Status D4

- D4-1: schema, RLS draft, dan seed plan.
- D4-2: helper Supabase browser/server/admin.
- D4-3: Supabase Auth, `user_profiles`, dan route guard.
- D4-4: seed verification dan admin pertama.
- D4-5: Assets dan SOP dari Supabase.
- D4-6: Scan lookup dari Supabase.
- D4-7: QR camera scanner.
- D4-8: Reports dan evidence Storage.
- D4-9: Status laporan dan follow-up Supabase.
- D4-10: Checklist K3 Supabase.
- D4-11: Dashboard dan audit Supabase.
- D4-12: Admin management page.
- D4-13: RLS hardening.
- D4-14: AI recommendation fallback.
- D4-15: Deploy preparation checklist.

`.env.local` hanya untuk development lokal dan tidak boleh di-commit.
