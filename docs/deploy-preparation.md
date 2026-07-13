# Deploy Preparation D4

## Branch

Deploy candidate: `feature/d4-production-like-migration`.

## Vercel Environment Variables

Set variabel berikut di Vercel Project Settings:

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_STORAGE_BUCKET=report-evidence
AI_PROVIDER=none
OPENAI_API_KEY=
GEMINI_API_KEY=
DEEPSEEK_API_KEY=
OPENROUTER_API_KEY=
OPENROUTER_MODEL=tencent/hy3:free
```

Catatan AI:

- Gunakan `AI_PROVIDER=none` untuk deploy tanpa provider AI berbayar.
- Provider opsional yang didukung: `openai`, `gemini`, `deepseek`, dan `openrouter`.
- Untuk OpenRouter, gunakan `AI_PROVIDER=openrouter`; model default adalah `tencent/hy3:free`.
- Isi hanya API key provider yang dipakai.
- Jangan menaruh API key pada variabel `NEXT_PUBLIC_*`.
- Fitur rekomendasi tidak memakai fitur reasoning vendor; output hanya teks rekomendasi K3.

Catatan service role:

- `SUPABASE_SERVICE_ROLE_KEY` hanya diset jika operasi server-only admin benar-benar dipakai.
- Key ini tidak boleh dipakai di Client Component atau dikirim ke browser.
- Jangan commit nilai secret ke repository.

## Supabase Requirement

Pastikan sebelum deploy:

- Migration `001_initial_d4_schema.sql` sudah dijalankan.
- Seed `001_seed_initial_data.sql` sudah dijalankan.
- Migration `002_d4_rls_hardening.sql` sudah dijalankan.
- Migration `004_ai_endpoint_rate_limit.sql` sudah direview dan dijalankan manual.
- Bucket private `report-evidence` sudah ada.
- Storage policy untuk upload/read signed URL foto bukti aktif.
- Admin user manual sudah ada di Supabase Auth dan `user_profiles`.
- RLS aktif dan sudah diuji untuk role utama.

## Post-Deploy Smoke Test

Jalankan setelah Vercel deploy:

1. Buka `/` dan `/login`.
2. Login admin dan logout.
3. Pastikan non-login route protected redirect ke `/login`.
4. Buka `/assets` dan `/assets/AST-001`; cek SOP dan QR.
5. Buka `/scan`; test input manual `AST-001` dan kamera jika perangkat mendukung.
6. Buat laporan dari `/reports/new?assetId=AST-001`.
7. Upload foto bukti dan cek attachment signed URL di detail laporan.
8. Update status/follow-up sebagai admin/teknisi/kepala lab sesuai RLS.
9. Buat checklist dengan risiko dan tanpa risiko.
10. Cek `/dashboard` dan `/audit` memakai data Supabase terbaru.
11. Test export CSV dan print audit.
12. Buka `/admin`; cek user_profiles, data dasar, update user lain, dan self-lock.
13. Test tombol `Buat Rekomendasi AI` tanpa API key; fallback harus muncul.
14. Jika memakai OpenRouter, test dengan `AI_PROVIDER=openrouter`, `OPENROUTER_API_KEY`, dan model default `tencent/hy3:free`.
15. Panggil endpoint AI tanpa login dan pastikan response `401`.
16. Pastikan profil inactive mendapat `403` dari endpoint AI.
17. Sebagai user aktif, kirim 11 request AI dalam 60 detik dan pastikan request ke-11 mendapat `429` dengan header `Retry-After`.
18. Pastikan rate limit user lain terpisah dan kembali tersedia setelah window 60 detik.

Rate limiter AI memakai tabel Supabase dan RPC atomik dengan batas 10 request per 60 detik per user. Fitur ini tidak memerlukan environment variable, service role, atau dependency tambahan. Provider yang gagal tetap menggunakan fallback rule-based setelah request lolos autentikasi dan rate limit.

## Known Warning

- Build lokal masih menampilkan warning multiple lockfiles karena Next.js mendeteksi `C:\Users\Paulina\package-lock.json` dan `C:\Users\Paulina\Documents\vocasafe-lab\package-lock.json`. Warning ini tidak menggagalkan build.

## Known Issue

- `npm run lint` masih gagal pada rule `react-hooks/set-state-in-effect` di `src/components/AppShell.tsx`. Ini issue lama dan tidak diubah pada D4-15.

## Release Gate

Sebelum push/deploy:

- `npm run typecheck` lulus.
- `npm run build` lulus.
- Tidak ada perubahan pada `supabase/migrations/*` tanpa review.
- Tidak ada perubahan pada `package.json` atau lockfile tanpa izin.
- Tidak ada `.env.local` atau secret yang masuk Git.
