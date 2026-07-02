# Arsitektur VocaSafe Lab

## Stack awal

- Next.js App Router
- TypeScript
- Tailwind CSS
- `qrcode.react`
- Data lokal TypeScript

Supabase dan API AI tidak digunakan pada tahap ini.

## Struktur sumber

```text
src/
├── components/
│   ├── assets/
│   ├── dashboard/
│   ├── layout/
│   ├── reports/
│   └── risk/
├── data/
│   └── dummy-data.ts
├── lib/
│   └── risk-scoring.ts
└── types/
    └── index.ts
```

- `types` menjadi kontrak data bersama.
- `data` menyimpan data simulasi dan tidak melakukan akses jaringan.
- `lib` berisi logika domain murni yang dapat diuji tanpa UI.
- `components` disiapkan berdasarkan domain, tetapi belum berisi UI.

## Aliran data MVP

UI membaca data dari `dummy-data.ts`. Saat laporan dibuat, input severity, likelihood, kondisi kontrol, dan riwayat kejadian diproses oleh `calculateRiskScore`. Hasilnya berupa skor, level risiko, dan rekomendasi awal. Seluruh perubahan status selama fase dummy akan dikelola di state aplikasi.

## Aturan risk scoring

```text
base score = severity × likelihood
modifier   = kondisi kontrol + kejadian berulang
final score = min(25, base score + modifier)
```

Severity dan likelihood menggunakan skala bilangan bulat 1–5. Modifier kondisi kontrol adalah 0 untuk efektif, 2 untuk sebagian, dan 4 jika tidak ada. Kejadian berulang menambah 2 poin.

| Skor | Level |
|---:|---|
| 1–4 | Rendah |
| 5–9 | Sedang |
| 10–16 | Tinggi |
| 17–25 | Kritis |

## Arah pengembangan berikutnya

Lapisan data lokal nantinya dapat diganti repository Supabase tanpa mengubah kontrak domain atau fungsi scoring. Integrasi tersebut dilakukan setelah alur UI demo stabil dan bukan bagian dari struktur awal ini.
