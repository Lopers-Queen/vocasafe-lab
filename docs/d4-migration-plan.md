# D4 Migration Plan - VocaSafe Lab

## Ringkasan D4

D4 adalah migrasi VocaSafe Lab dari MVP demo berbasis dummy data dan localStorage menuju sistem production-like dengan Supabase Auth, Supabase Database, Row Level Security, Supabase Storage, QR scanner kamera asli, AI provider-agnostic, dan halaman admin.

Prinsip migrasi:

- Migrasi dilakukan di branch `feature/d4-production-like-migration`.
- MVP stabil di `main` tetap menjadi baseline.
- D4 tidak langsung menghapus `dummy-data.ts` atau localStorage helper.
- Data produksi utama akan berpindah ke Supabase.
- Risk scoring utama tetap `severity x probability x exposure`.
- AI hanya membantu rekomendasi/insight, bukan mengganti rumus risiko.

## Enum

Enum PostgreSQL awal:

- `user_role`: `mahasiswa`, `dosen`, `teknisi`, `kepala_lab`, `admin`
- `report_status`: `baru`, `diverifikasi`, `dalam_penanganan`, `selesai`, `ditolak`
- `risk_category`: `rendah`, `sedang`, `tinggi`, `kritis`
- `asset_status`: `layak`, `perlu_dicek`, `tidak_layak`
- `asset_kind`: `alat`, `fasilitas`
- `checklist_answer`: `ya`, `tidak`, `tidak_berlaku`

## Schema Tabel

Migration awal berada di:

```text
supabase/migrations/001_initial_d4_schema.sql
```

Tabel awal:

1. `laboratories`
   - Master laboratorium.
   - Dipakai sebagai scope data asset, SOP, checklist, dan laporan.

2. `user_profiles`
   - Profil aplikasi yang terhubung ke `auth.users`.
   - Menyimpan role resmi dan status aktif user.

3. `sops`
   - SOP digital, APD, dan langkah kerja.

4. `assets`
   - Master alat/fasilitas dengan status, QR payload, dan relasi SOP.

5. `k3_facilities`
   - Fasilitas K3 seperti APAR, P3K, ventilasi, atau safety equipment.

6. `risk_points`
   - Titik risiko permanen atau risiko teridentifikasi pada lab/asset.

7. `reports`
   - Laporan bahaya/kerusakan dengan risk scoring final.

8. `report_followups`
   - Riwayat tindak lanjut laporan.

9. `report_attachments`
   - Metadata foto bukti laporan yang disimpan di Supabase Storage.

10. `checklist_templates`
    - Template checklist K3.

11. `checklist_items`
    - Item checklist per template.

12. `checklist_results`
    - Hasil pengisian checklist, termasuk risk finding opsional.

13. `checklist_result_items`
    - Jawaban item checklist.

14. `audit_logs`
    - Jejak perubahan penting untuk audit sistem.

## Seed Strategy

Seed awal berada di:

```text
supabase/seed/001_seed_initial_data.sql
```

Seed berisi:

- 1 laboratory
- 3 SOP
- 3 assets
- 2 K3 facilities awal
- 1 checklist template
- 10 checklist items

Seed tidak membuat `auth.users` dan tidak membuat `user_profiles` final, karena admin pertama harus dibuat manual lewat Supabase Dashboard. Setelah admin pertama dibuat, row `user_profiles` dapat dibuat manual atau melalui task D4 Auth/Admin berikutnya.

## Auth Strategy

Target auth:

- Login email/password memakai Supabase Auth.
- Role app dibaca dari `user_profiles.role`.
- `localStorage` tidak lagi menjadi sumber auth utama.
- Admin pertama dibuat manual lewat Supabase Dashboard.
- Admin berikutnya dibuat lewat halaman admin aplikasi.

Flow:

1. User login di `/login` dengan email/password.
2. App membaca session Supabase.
3. App mengambil `user_profiles` berdasarkan `auth.uid()`.
4. AppShell dan route guard membaca role dari profile.
5. Admin dapat membuat user lewat API route/server action.
6. Server menggunakan `SUPABASE_SERVICE_ROLE_KEY` untuk operasi admin auth.
7. Service role key tidak pernah dikirim ke browser.

## RLS Strategy

D4-1 membuat RLS awal dan helper role:

- `get_current_user_role()`
- `is_admin()`
- `is_teknisi_or_admin()`

Semua tabel public yang dibuat sudah `enable row level security`.

Policy awal:

- Authenticated users dapat membaca `laboratories`, `assets`, dan `sops`.
- User dapat membaca profile sendiri.
- Admin dapat membaca semua profile.
- Admin dapat menulis master data utama.
- Authenticated users dapat membaca reports dan followups.
- Mahasiswa/dosen/teknisi/admin dapat membuat reports.
- Teknisi/admin dapat update reports dan insert followups.
- Dosen/teknisi/admin dapat membuat checklist results.
- Teknisi/kepala_lab/admin dapat membaca checklist results.
- Admin dapat membaca audit logs.
- Insert audit logs tidak dibuka bebas.

Catatan: policy D4-1 adalah draft awal. Hardening detail dilakukan pada D4-13. Jangan anggap RLS D4-1 sebagai final production policy.

Catatan hardening RLS D4-13:

- Policy `authenticated select` untuk reports, followups, dan attachments masih perlu diperketat berbasis lab scope dan relasi report.
- Helper `SECURITY DEFINER` seperti `get_current_user_role()`, `is_admin()`, dan `is_teknisi_or_admin()` perlu review privilege, owner, dan grant sebelum production.
- Storage policy untuk evidence photos harus mengikuti akses report, bukan dibuat public tanpa aturan.

## Storage Strategy

Target storage:

- Bucket: `report-evidence`
- Path: `laboratories/{laboratory_id}/reports/{report_id}/{uuid}.{ext}`
- Metadata disimpan di `report_attachments`.
- File tidak public by default.
- Akses file melalui signed URL untuk role yang boleh membaca report.
- Validasi tipe file: JPEG, PNG, WEBP.
- Validasi ukuran file, misalnya max 5MB.
- Upload foto bukti laporan menjadi bagian dari flow create report.

## QR Scanner Strategy

Saat ini `/scan` masih simulasi input manual. D4 akan mengganti/menambah kamera asli.

Rekomendasi dependency:

- `html5-qrcode` untuk implementasi cepat dan dukungan mobile yang baik.
- Alternatif: `@zxing/browser` jika butuh kontrol lebih granular.

Alur:

1. User membuka `/scan`.
2. App meminta izin kamera.
3. Scanner membaca QR payload.
4. Payload dipetakan ke `asset.code`, `asset.id`, atau `qr_payload`.
5. Jika asset ditemukan, redirect ke `/assets/[id]`.
6. Jika kamera ditolak, tampilkan input manual fallback.
7. Jika QR invalid, tampilkan pesan error.

Catatan: kamera membutuhkan HTTPS di production. Vercel production sudah HTTPS.

## AI Provider Strategy

AI bersifat optional dan provider-agnostic. Frontend tidak memanggil provider langsung.

API internal yang direncanakan:

- `POST /api/ai/analyze-hazard`
- `POST /api/ai/followup-summary`
- `POST /api/ai/audit-insights`

Interface provider:

```ts
interface AiProvider {
  analyzeHazard(input: AnalyzeHazardInput): Promise<AnalyzeHazardOutput>;
  summarizeFollowup(input: FollowupInput): Promise<FollowupOutput>;
  generateAuditInsights(input: AuditInput): Promise<AuditOutput>;
}
```

Env yang mungkin dipakai:

- `AI_PROVIDER`
- `OPENAI_API_KEY`
- `GEMINI_API_KEY`
- `DEEPSEEK_API_KEY`

Fallback:

- Jika `AI_PROVIDER` kosong, gunakan rekomendasi rule-based.
- Jika API gagal atau timeout, tetap gunakan rule-based recommendation.
- AI tidak boleh mengganti risk score utama.

## Urutan Task D4

1. D4-1 Schema Supabase awal
   - Branch migrasi, migration SQL, seed SQL, dokumentasi migrasi.

2. D4-2 Supabase client/server setup
   - Tambah dependency dan helper Supabase client/server/admin.

3. D4-3 Auth dan user_profiles
   - Login email/password dan route guard berbasis profile DB.

4. D4-4 Seed database
   - Jalankan migration dan seed ke Supabase dev project.

5. D4-5 Admin users
   - Halaman admin user dan API route server-only untuk create user.

6. D4-6 Assets dan SOP dari database
   - Ubah halaman assets/detail asset agar membaca DB.

7. D4-7 QR scanner kamera asli
   - Integrasi scanner kamera dengan fallback manual.

8. D4-8 Reports dan upload foto
   - Form laporan ke DB + Supabase Storage evidence.

9. D4-9 Follow-up reports
   - Status/followup ke DB.

10. D4-10 Checklist database
    - Template/item/result checklist dari DB.

11. D4-11 Audit database
    - Audit report dari aggregate DB.

12. D4-12 AI provider-agnostic route
    - API internal AI + fallback rule-based.

13. D4-13 RLS hardening
    - Policy detail per role, lab scope, storage policy.

14. D4-14 QA besar
    - Regression full production-like.

## Catatan D4-2

D4-2 sebaiknya belum migrasi semua halaman. Fokus berikutnya cukup:

- install dependency Supabase
- buat `.env.example` update
- buat helper client/server/admin
- buat health/read session smoke test kecil bila diperlukan
- jangan expose service role key ke browser
