import { calculateRiskScore } from "../lib/risk-scoring";
import type {
  Asset,
  HazardReport,
  RiskScoringInput,
  SafetyChecklist,
  StandardOperatingProcedure,
  User,
} from "../types";

export const dummyUsers: User[] = [
  {
    id: "USR-001",
    name: "Ayu Lestari",
    email: "admin@vocasafe.test",
    role: "admin_lab",
  },
  {
    id: "USR-002",
    name: "Bima Pratama",
    email: "auditor@vocasafe.test",
    role: "auditor",
  },
  {
    id: "USR-003",
    name: "Citra Dewi",
    email: "teknisi@vocasafe.test",
    role: "teknisi",
  },
];

export const dummySops: StandardOperatingProcedure[] = [
  {
    id: "SOP-001",
    title: "Pengoperasian Mesin Bor Duduk",
    version: "1.2",
    lastUpdated: "2026-05-10T08:00:00+08:00",
    requiredPpe: ["Kacamata keselamatan", "Sepatu keselamatan"],
    steps: [
      "Periksa kondisi kabel, mata bor, pelindung, dan tombol darurat.",
      "Pastikan benda kerja terkunci kuat pada ragum.",
      "Atur kecepatan mesin sesuai material yang digunakan.",
      "Matikan mesin dan bersihkan serpihan setelah digunakan.",
    ],
  },
  {
    id: "SOP-002",
    title: "Inspeksi APAR",
    version: "1.0",
    lastUpdated: "2026-04-20T09:30:00+08:00",
    requiredPpe: ["Sarung tangan kerja"],
    steps: [
      "Pastikan APAR terlihat dan mudah dijangkau.",
      "Periksa segel, pin pengaman, selang, dan kondisi tabung.",
      "Pastikan indikator tekanan berada pada zona hijau.",
      "Catat hasil dan tanggal inspeksi pada kartu pemeriksaan.",
    ],
  },
];

export const dummyAssets: Asset[] = [
  {
    id: "AST-001",
    code: "MBD-01",
    name: "Mesin Bor Duduk 01",
    kind: "alat",
    category: "Mesin perkakas",
    location: "Lab Teknik Mesin",
    description: "Mesin bor duduk untuk praktik pemesinan dasar.",
    status: "tidak_layak_pakai",
    lastInspectionAt: "2026-06-24T10:15:00+08:00",
    nextInspectionAt: "2026-07-01T10:15:00+08:00",
    qrValue: "vocasafe://assets/AST-001",
    sopId: "SOP-001",
  },
  {
    id: "AST-002",
    code: "APR-01",
    name: "APAR Area Pengelasan",
    kind: "fasilitas",
    category: "Proteksi kebakaran",
    location: "Lab Pengelasan",
    description: "APAR dry chemical powder berkapasitas 6 kg.",
    status: "perlu_pemeriksaan",
    lastInspectionAt: "2026-05-30T09:00:00+08:00",
    nextInspectionAt: "2026-06-30T09:00:00+08:00",
    qrValue: "vocasafe://assets/AST-002",
    sopId: "SOP-002",
  },
  {
    id: "AST-003",
    code: "VNT-01",
    name: "Ventilasi Ruang Kimia",
    kind: "fasilitas",
    category: "Ventilasi",
    location: "Lab Kimia Terapan",
    description: "Sistem ventilasi mekanis untuk sirkulasi udara ruang praktik.",
    status: "aman",
    lastInspectionAt: "2026-06-28T13:45:00+08:00",
    nextInspectionAt: "2026-07-28T13:45:00+08:00",
    qrValue: "vocasafe://assets/AST-003",
    sopId: "SOP-002",
  },
];

export const dummyChecklists: SafetyChecklist[] = [
  {
    id: "CHK-001",
    title: "Checklist Pemeriksaan Alat",
    assetKind: "alat",
    items: [
      {
        id: "CHK-001-01",
        label: "Kabel dan steker dalam kondisi baik",
        isCritical: true,
      },
      {
        id: "CHK-001-02",
        label: "Pelindung mesin terpasang dengan benar",
        isCritical: true,
      },
      {
        id: "CHK-001-03",
        label: "Area kerja bersih dan bebas hambatan",
        isCritical: false,
      },
      {
        id: "CHK-001-04",
        label: "Tombol darurat berfungsi",
        isCritical: true,
      },
    ],
  },
  {
    id: "CHK-002",
    title: "Checklist Pemeriksaan Fasilitas",
    assetKind: "fasilitas",
    items: [
      {
        id: "CHK-002-01",
        label: "Fasilitas mudah dijangkau",
        isCritical: true,
      },
      {
        id: "CHK-002-02",
        label: "Label dan petunjuk penggunaan terbaca",
        isCritical: false,
      },
      {
        id: "CHK-002-03",
        label: "Tidak terdapat kerusakan fisik",
        isCritical: true,
      },
    ],
  },
];

const criticalRiskInput: RiskScoringInput = {
  severity: 4,
  likelihood: 4,
  controlCondition: "sebagian",
  isRecurring: true,
};

const highRiskInput: RiskScoringInput = {
  severity: 3,
  likelihood: 2,
  controlCondition: "tidak_ada",
  isRecurring: false,
};

export const dummyReports: HazardReport[] = [
  {
    id: "RPT-001",
    reportNumber: "VSL-2026-0001",
    assetId: "AST-001",
    reporterUserId: "USR-002",
    title: "Pelindung mata bor longgar",
    description:
      "Pelindung bergeser saat mesin beroperasi dan tidak menutup area mata bor secara penuh.",
    location: "Lab Teknik Mesin",
    reportedAt: "2026-06-24T10:20:00+08:00",
    status: "ditindaklanjuti",
    riskInput: criticalRiskInput,
    riskResult: calculateRiskScore(criticalRiskInput),
    evidencePhotos: [
      {
        id: "IMG-001",
        fileName: "pelindung-bor-longgar.jpg",
        imageUrl: "/dummy/evidence/pelindung-bor-longgar.jpg",
        uploadedAt: "2026-06-24T10:20:00+08:00",
      },
    ],
    statusHistory: [
      {
        status: "dilaporkan",
        changedAt: "2026-06-24T10:20:00+08:00",
        changedByUserId: "USR-002",
      },
      {
        status: "diverifikasi",
        changedAt: "2026-06-24T11:00:00+08:00",
        changedByUserId: "USR-001",
        note: "Bahaya terkonfirmasi. Mesin diberi label larangan operasi.",
      },
      {
        status: "ditindaklanjuti",
        changedAt: "2026-06-24T13:30:00+08:00",
        changedByUserId: "USR-003",
        note: "Penggantian dudukan pelindung sedang dikerjakan.",
      },
    ],
  },
  {
    id: "RPT-002",
    reportNumber: "VSL-2026-0002",
    assetId: "AST-002",
    reporterUserId: "USR-002",
    title: "Jadwal inspeksi APAR terlewati",
    description:
      "Kartu pemeriksaan menunjukkan APAR belum diperiksa pada jadwal bulan berjalan.",
    location: "Lab Pengelasan",
    reportedAt: "2026-06-30T14:10:00+08:00",
    status: "diverifikasi",
    riskInput: highRiskInput,
    riskResult: calculateRiskScore(highRiskInput),
    evidencePhotos: [],
    statusHistory: [
      {
        status: "dilaporkan",
        changedAt: "2026-06-30T14:10:00+08:00",
        changedByUserId: "USR-002",
      },
      {
        status: "diverifikasi",
        changedAt: "2026-06-30T15:00:00+08:00",
        changedByUserId: "USR-001",
        note: "Inspeksi ulang ditugaskan kepada teknisi.",
      },
    ],
  },
];
