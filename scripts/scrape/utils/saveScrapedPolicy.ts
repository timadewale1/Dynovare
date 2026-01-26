import { adminDb, adminStorage } from "@/lib/firebaseAdmin";
import { slugify } from "@/lib/slugify";
import { makeDedupeKey } from "./dedupe";
import { fetchOrGeneratePdf } from "./fetchOrGeneratePdf";

const SYSTEM_UID = "system_scraper";

export async function saveScrapedPolicy(policy: any) {
  const dedupeKey = makeDedupeKey({
    title: policy.title,
    country: policy.country,
    jurisdictionLevel: policy.jurisdictionLevel,
    publisher: policy.source.publisher,
  });

  function stripUndefined<T extends Record<string, any>>(obj: T): T {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined)
  ) as T;
}


  // 🔍 Dedup check
  const existingSnap = await adminDb
    .collection("policies")
    .where("dedupeKey", "==", dedupeKey)
    .limit(1)
    .get();

  if (!existingSnap.empty) {
    console.log(`⏭️ Skipped duplicate: ${policy.title}`);
    return;
  }

  const policyRef = adminDb.collection("policies").doc();
  const policyId = policyRef.id;

  const slug = `${slugify(policy.title)}-${policyId.slice(0, 6)}`;

  const meta = [
    `Source: ${policy.source.publisher}`,
    `Country: ${policy.country}`,
    `Jurisdiction: ${policy.jurisdictionLevel}`,
    `Sector: ${policy.sector ?? "N/A"}`,
    `Year: ${policy.policyYear ?? "N/A"}`,
  ];

  const { pdfBuffer, usedOriginalPdf } = await fetchOrGeneratePdf({
    title: policy.title,
    sourceUrl: policy.source.url,
    bodyText: policy.contentText ?? "",
    meta,
    pdfUrl: policy.source?.pdfUrl ?? null,
  });

  const bucket = adminStorage.bucket();

  const publisherSlug = String(policy.source.publisher || "public_source")
    .toLowerCase()
    .replace(/\s+/g, "_");

  const storagePath = `policies/public_source/${publisherSlug}/${policyId}.pdf`;

await bucket.file(storagePath).save(pdfBuffer, {
    contentType: "application/pdf",
    resumable: false,
  });

  const now = new Date();

  await policyRef.set(
  stripUndefined({
    ...policy,
    slug,
    dedupeKey,
    type: "public_source",
    visibility: "public",
    storagePath,

    createdByUid: SYSTEM_UID,
    createdByName: `${policy.source.publisher} Scraper`,
    createdByEmail: null,

    usedOriginalPdf,

    createdAt: now,
    updatedAt: now,
  })
);


  console.log(`✅ Saved: ${policy.title} (${usedOriginalPdf ? "PDF" : "text→PDF"})`);
}
