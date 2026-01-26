import { adminDb, adminStorage } from "@/lib/firebaseAdmin";
import { slugify } from "@/lib/slugify";
import { makeDedupeKey } from "./dedupe";
import { fetchOrGeneratePdf } from "./fetchOrGeneratePdf";
import { extractPdfTextWithOcr } from "./extractPdfTextWithOcr";

const SYSTEM_UID = "system_scraper";

function stripUndefined<T extends Record<string, any>>(obj: T): T {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as T;
}

function toBuffer(input: any): Buffer {
  if (Buffer.isBuffer(input)) return input;
  if (input instanceof Uint8Array) return Buffer.from(input);
  if (input instanceof ArrayBuffer) return Buffer.from(new Uint8Array(input));
  // fallback (shouldn’t happen)
  return Buffer.from(input);
}

export async function saveScrapedPolicy(policy: any) {
  const dedupeKey = makeDedupeKey({
    title: policy.title,
    country: policy.country,
    jurisdictionLevel: policy.jurisdictionLevel,
    publisher: policy.source.publisher,
  });

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

  // 1) Get PDF (original if allowed, else generate)
  const { pdfBuffer, usedOriginalPdf, extractedText } = await fetchOrGeneratePdf({
    title: policy.title,
    sourceUrl: policy.source.url,
    bodyText: policy.contentText ?? "",
    meta,
    pdfUrl: policy.source?.pdfUrl ?? null,
  });

  const pdfBuf = toBuffer(pdfBuffer);

  // 2) Ensure we have usable contentText:
  //    Prefer text extracted during fetchOrGeneratePdf, else OCR fallback on the PDF bytes.
  let finalText = (extractedText ?? "").trim();

  if (finalText.length < 200) {
    const { text, method } = await extractPdfTextWithOcr(pdfBuf, { minChars: 200 });
    finalText = (text || "").trim();
    console.log(`🧾 Text method for "${policy.title}": ${method} (${finalText.length} chars)`);
  }

  // 3) Upload PDF to Storage
  const bucket = adminStorage.bucket();

  const publisherSlug = String(policy.source.publisher || "public_source")
    .toLowerCase()
    .replace(/\s+/g, "_");

  const storagePath = `policies/public_source/${publisherSlug}/${policyId}.pdf`;

  await bucket.file(storagePath).save(pdfBuf, {
    contentType: "application/pdf",
    resumable: false,
  });

  const now = new Date();

  // 4) Write Firestore ONCE
  await policyRef.set(
    stripUndefined({
      ...policy,
      contentText: finalText, // ✅ now OCR-backed
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
