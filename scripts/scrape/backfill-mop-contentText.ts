// scripts/scrape/backfill-mop-contentText.ts
import "./env";

import axios from "axios";
import mammoth from "mammoth";
import { adminDb, adminStorage } from "@/lib/firebaseAdmin";
import { extractPdfTextFromBuffer } from "./utils/extractPdfText";
import { extractPdfTextWithOcr } from "./utils/extractPdfTextWithOcr";
import { generateScrapedPolicyPdf } from "@/lib/generatePdfFromScrapedText";

function cleanText(s: string) {
  return String(s || "").replace(/\s+/g, " ").trim();
}

function sniffKind(buf: Buffer) {
  const head4 = buf.slice(0, 4).toString("utf8");
  if (head4 === "%PDF") return "pdf";

  // DOCX is a zip container -> starts with PK
  const zip2 = buf.slice(0, 2).toString("utf8");
  if (zip2 === "PK") return "docx";

  return "unknown";
}

async function downloadFromUrl(url: string) {
  const res = await axios.get(url, {
    responseType: "arraybuffer",
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
    },
    maxRedirects: 5,
  });
  return Buffer.from(res.data);
}

async function downloadFromStorage(storagePath: string) {
  const bucket = adminStorage.bucket();
  const [bytes] = await bucket.file(storagePath).download();
  return Buffer.from(bytes);
}

async function overwritePdfInStorage(storagePath: string, pdfBuffer: Buffer) {
  const bucket = adminStorage.bucket();
  await bucket.file(storagePath).save(pdfBuffer, {
    contentType: "application/pdf",
    resumable: false,
  });
}

async function regeneratePdfFromText(args: { title: string; text: string; meta: string[] }) {
  const pdfBytes = await generateScrapedPolicyPdf({
    title: args.title,
    body: args.text,
    meta: args.meta,
  });

  const pdfBuffer = Buffer.isBuffer(pdfBytes)
    ? pdfBytes
    : Buffer.from(pdfBytes as Uint8Array);

  return pdfBuffer;
}

(async () => {
  const db = adminDb;

  const snap = await db
    .collection("policies")
    .where("source.publisher", "==", "Federal Ministry of Power")
    .get();

  console.log(`Found ${snap.size} MOP policies`);

  let updated = 0;
  let skipped = 0;

  for (const d of snap.docs) {
    try {
      const data = d.data() as any;

      const currentText = cleanText(data.contentText || "");
      if (currentText.length >= 400) {
        skipped++;
        continue;
      }

      console.log(`Backfilling: ${data.slug || data.title} (${d.id})`);

      // ✅ Prefer source.pdfUrl first (most likely original file)
      let fileBuf: Buffer | null = null;

      if (data.source?.pdfUrl) {
        fileBuf = await downloadFromUrl(data.source.pdfUrl);
      } else if (data.storagePath) {
        fileBuf = await downloadFromStorage(data.storagePath);
      } else if (data.source?.url) {
        // last resort (might be HTML)
        fileBuf = await downloadFromUrl(data.source.url);
      }

      if (!fileBuf) {
        console.log("  ❌ No file buffer found");
        continue;
      }

      const kind = sniffKind(fileBuf);

      let extracted = "";
      let method: "pdf-text" | "ocr" | "docx" | "none" = "none";

      if (kind === "pdf") {
        // 1) pdf text layer
        extracted = cleanText(await extractPdfTextFromBuffer(fileBuf, 200));
        method = extracted.length >= 200 ? "pdf-text" : "none";

        // 2) OCR fallback if too short
        if (extracted.length < 400) {
          const ocr = await extractPdfTextWithOcr(fileBuf, { minChars: 200 });
          const ocrText = cleanText(ocr.text);
          if (ocrText.length > extracted.length) {
            extracted = ocrText;
            method = "ocr";
          }
        }
      } else if (kind === "docx") {
        // DOCX -> extract text with mammoth
        const out = await mammoth.extractRawText({ buffer: fileBuf });
        extracted = cleanText(out.value);
        method = "docx";
      } else {
        console.log("  ⚠️ Not a PDF/DOCX (maybe HTML). Skipping.");
        continue;
      }

      if (extracted.length < 200) {
        console.log(`  ⚠️ Extracted too short (${extracted.length} chars). Leaving as-is.`);
        continue;
      }

      // ✅ Regenerate a clean PDF from extracted text (so Storage PDF matches contentText)
      const meta = [
        `Source: ${data.source?.publisher || "Federal Ministry of Power"}`,
        `Country: ${data.country || "Nigeria"}`,
        `Jurisdiction: ${data.jurisdictionLevel || "federal"}`,
        `Sector: ${data.sector || "N/A"}`,
        `Year: ${data.policyYear || "N/A"}`,
      ];

      const regeneratedPdf = await regeneratePdfFromText({
        title: data.title || "Policy",
        text: extracted,
        meta,
      });

      if (data.storagePath) {
        await overwritePdfInStorage(data.storagePath, regeneratedPdf);
      }

      await db.collection("policies").doc(d.id).update({
        contentText: extracted,
        extraction: {
          method,
          backfilledAt: new Date().toISOString(),
          chars: extracted.length,
        },
        updatedAt: new Date(),
      });

      console.log(`  ✅ Updated (${method}) ${extracted.length} chars + refreshed PDF`);
      updated++;
    } catch (e: any) {
      console.log("  ❌ Failed this policy, continuing. Error:", String(e?.message || e));
    }
  }

  console.log(`Done. Updated ${updated}, skipped ${skipped}.`);
})();
