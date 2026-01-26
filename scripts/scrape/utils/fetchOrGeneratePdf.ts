import axios from "axios";
import { generateScrapedPolicyPdf } from "@/lib/generatePdfFromScrapedText";

export async function fetchOrGeneratePdf(params: {
  title: string;
  sourceUrl: string;
  bodyText: string;
  meta: string[];
  pdfUrl?: string | null;
}) {
  // 1) Try original PDF (if direct URL provided)
  if (params.pdfUrl) {
    try {
      const res = await axios.get(params.pdfUrl, { responseType: "arraybuffer" });
      const ct = String(res.headers["content-type"] ?? "");

      if (ct.includes("pdf") || params.pdfUrl.toLowerCase().endsWith(".pdf")) {
        // ✅ Convert ArrayBuffer to Buffer
        return { pdfBuffer: Buffer.from(res.data), usedOriginalPdf: true };
      }
    } catch {
      // fall through
    }
  }

  // 2) Fallback: generate PDF from text (typically Uint8Array)
  const pdfBytes = await generateScrapedPolicyPdf({
    title: params.title,
    body: params.bodyText,
    meta: params.meta,
  });

  // ✅ Ensure Buffer
  const pdfBuffer = Buffer.isBuffer(pdfBytes)
    ? pdfBytes
    : Buffer.from(pdfBytes as Uint8Array);

  return { pdfBuffer, usedOriginalPdf: false };
}
