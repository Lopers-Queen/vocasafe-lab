"use server";

export async function getReportEvidenceBucket(): Promise<{
  bucket: string | null;
  error: string | null;
}> {
  const bucket = process.env.SUPABASE_STORAGE_BUCKET?.trim();

  if (!bucket) {
    return {
      bucket: null,
      error:
        "SUPABASE_STORAGE_BUCKET belum dikonfigurasi. Isi env tersebut dengan nama bucket report-evidence.",
    };
  }

  return { bucket, error: null };
}
