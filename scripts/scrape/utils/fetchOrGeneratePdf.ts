import axios from "axios";
import { generateScrapedPolicyPdf } from "@/lib/generatePdfFromScrapedText";
import { extractPdfTextFromBuffer } from "./extractPdfText";

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
      const ct = String(res.headers["content-type"] ?? "").toLowerCase();

      const looksLikePdf =
        ct.includes("pdf") || params.pdfUrl.toLowerCase().includes(".pdf");

      if (looksLikePdf) {
        const pdfBuffer = Buffer.from(res.data);

        // ✅ Extract text from the downloaded PDF
        const extractedText = await extractPdfTextFromBuffer(pdfBuffer);

        return {
          pdfBuffer,
          usedOriginalPdf: true,
          extractedText,
        };
      }
    } catch {
      // fall through
    }
  }

  // 2) Fallback: generate PDF from text
  const pdfBytes = await generateScrapedPolicyPdf({
    title: params.title,
    body: params.bodyText,
    meta: params.meta,
  });

  const pdfBuffer = Buffer.isBuffer(pdfBytes)
    ? pdfBytes
    : Buffer.from(pdfBytes as Uint8Array);

  return {
    pdfBuffer,
    usedOriginalPdf: false,
    extractedText: params.bodyText ?? "",
  };
}
