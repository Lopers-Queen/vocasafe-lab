"use client";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export type DatabaseAssetKind = "alat" | "fasilitas";
export type DatabaseAssetStatus = "layak" | "perlu_dicek" | "tidak_layak";

export interface LaboratorySummary {
  id: string;
  code: string;
  name: string;
  department: string | null;
  location: string | null;
}

export interface SopSummary {
  id: string;
  laboratoryId: string | null;
  title: string;
  version: string | null;
  lastUpdatedAt: string | null;
  requiredPpe: string[];
  steps: string[];
}

export interface DatabaseAsset {
  id: string;
  laboratoryId: string | null;
  sopId: string | null;
  code: string;
  name: string;
  kind: DatabaseAssetKind;
  category: string | null;
  location: string | null;
  description: string | null;
  status: DatabaseAssetStatus;
  qrPayload: string | null;
  lastInspectionAt: string | null;
  nextInspectionAt: string | null;
  laboratory: LaboratorySummary | null;
  sop: SopSummary | null;
}

interface LaboratoryRow {
  id: string;
  code: string;
  name: string;
  department: string | null;
  location: string | null;
}

interface SopRow {
  id: string;
  laboratory_id: string | null;
  title: string;
  version: string | null;
  last_updated_at: string | null;
  required_ppe: unknown;
  steps: unknown;
}

interface AssetRow {
  id: string;
  laboratory_id: string | null;
  sop_id: string | null;
  code: string;
  name: string;
  kind: DatabaseAssetKind;
  category: string | null;
  location: string | null;
  description: string | null;
  status: DatabaseAssetStatus;
  qr_payload: string | null;
  last_inspection_at: string | null;
  next_inspection_at: string | null;
  laboratory: LaboratoryRow | LaboratoryRow[] | null;
  sop: SopRow | SopRow[] | null;
}

const ASSET_SELECT = `
  id,
  laboratory_id,
  sop_id,
  code,
  name,
  kind,
  category,
  location,
  description,
  status,
  qr_payload,
  last_inspection_at,
  next_inspection_at,
  laboratory:laboratories(id,code,name,department,location),
  sop:sops(id,laboratory_id,title,version,last_updated_at,required_ppe,steps)
`;

function firstRelation<T>(value: T | T[] | null): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}

function stringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function mapAsset(row: AssetRow): DatabaseAsset {
  const laboratory = firstRelation(row.laboratory);
  const sop = firstRelation(row.sop);

  return {
    id: row.id,
    laboratoryId: row.laboratory_id,
    sopId: row.sop_id,
    code: row.code,
    name: row.name,
    kind: row.kind,
    category: row.category,
    location: row.location,
    description: row.description,
    status: row.status,
    qrPayload: row.qr_payload,
    lastInspectionAt: row.last_inspection_at,
    nextInspectionAt: row.next_inspection_at,
    laboratory: laboratory
      ? {
          id: laboratory.id,
          code: laboratory.code,
          name: laboratory.name,
          department: laboratory.department,
          location: laboratory.location,
        }
      : null,
    sop: sop
      ? {
          id: sop.id,
          laboratoryId: sop.laboratory_id,
          title: sop.title,
          version: sop.version,
          lastUpdatedAt: sop.last_updated_at,
          requiredPpe: stringArray(sop.required_ppe),
          steps: stringArray(sop.steps),
        }
      : null,
  };
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Data asset tidak dapat dimuat dari Supabase.";
}

export function getAssetQrPayload(asset: DatabaseAsset): string {
  return asset.qrPayload || `vocasafe://assets/${asset.code}`;
}

export async function fetchAssets(): Promise<{
  assets: DatabaseAsset[];
  error: string | null;
}> {
  try {
    const supabase = createSupabaseBrowserClient();
    const { data, error } = await supabase
      .from("assets")
      .select(ASSET_SELECT)
      .order("code", { ascending: true });

    if (error) return { assets: [], error: error.message };

    return {
      assets: ((data ?? []) as unknown as AssetRow[]).map(mapAsset),
      error: null,
    };
  } catch (error) {
    return { assets: [], error: errorMessage(error) };
  }
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function normalizeLookup(value: string): string {
  let decoded = value;
  try {
    decoded = decodeURIComponent(value);
  } catch {
    // Keep the original value so a malformed URL becomes a normal not-found result.
  }

  const trimmed = decoded.trim();
  const qrMatch = trimmed.match(/^vocasafe:\/\/assets\/([^/?#]+)\/?$/i);
  return qrMatch?.[1] ?? trimmed;
}

async function queryAsset(
  column: "code" | "id" | "qr_payload",
  value: string,
): Promise<{ asset: DatabaseAsset | null; error: string | null }> {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("assets")
    .select(ASSET_SELECT)
    .eq(column, value)
    .maybeSingle();

  if (error) return { asset: null, error: error.message };
  if (!data) return { asset: null, error: null };

  return { asset: mapAsset(data as unknown as AssetRow), error: null };
}

export async function fetchAssetByLookup(value: string): Promise<{
  asset: DatabaseAsset | null;
  error: string | null;
}> {
  try {
    const original = value.trim();
    const normalized = normalizeLookup(original);

    const byCode = await queryAsset("code", normalized);
    if (byCode.asset || byCode.error) return byCode;

    if (UUID_PATTERN.test(normalized)) {
      const byId = await queryAsset("id", normalized);
      if (byId.asset || byId.error) return byId;
    }

    return await queryAsset("qr_payload", original);
  } catch (error) {
    return { asset: null, error: errorMessage(error) };
  }
}
