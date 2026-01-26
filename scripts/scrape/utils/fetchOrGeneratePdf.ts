import axios from "axios";
import mammoth from "mammoth";
import { generateScrapedPolicyPdf } from "@/lib/generatePdfFromScrapedText";
import { extractPdfTextFromBuffer } from "./extractPdfText";
import { extractPdfTextWithOcr } from "./extractPdfTextWithOcr";

function cleanText(s: string) {
  return String(s || "").replace(/\s+/g, " ").trim();
}

function sniffKind(buf: Buffer) {
  const head4 = buf.slice(0, 4).toString("utf8");
  if (head4 === "%PDF") return "pdf";
  const zip2 = buf.slice(0, 2).toString("utf8");
  if (zip2 === "PK") return "docx";
  return "unknown";
}

export async function fetchOrGeneratePdf(params: {
  title: string;
  sourceUrl: string;
  bodyText: string;
  meta: string[];
  pdfUrl?: string | null;
}) {
  const MIN_CHARS = 200;

  if (params.pdfUrl) {
    try {
      const res = await axios.get(params.pdfUrl, {
        responseType: "arraybuffer",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
        },
        maxRedirects: 5,
      });

      const buf = Buffer.from(res.data);
      const kind = sniffKind(buf);

      // ✅ PDF path
      if (kind === "pdf") {
        let extractedText = cleanText(await extractPdfTextFromBuffer(buf, MIN_CHARS));
        let extractionMethod: "pdf-text" | "ocr" | "none" = extractedText.length >= MIN_CHARS ? "pdf-text" : "none";

        if (extractedText.length < MIN_CHARS) {
          try {
            const ocr = await extractPdfTextWithOcr(buf, { minChars: MIN_CHARS });
            const ocrText = cleanText(ocr.text);
            if (ocrText.length >= extractedText.length) {
              extractedText = ocrText;
              extractionMethod = "ocr";
            }
          } catch {
            console.log("⚠️ OCR failed; continuing without OCR");
          }
        }

        return {
          pdfBuffer: buf,
          usedOriginalPdf: true,
          extractedText,
          extractionMethod,
        };
      }

      // ✅ DOCX path -> extract text then generate PDF
      if (kind === "docx") {
        const out = await mammoth.extractRawText({ buffer: buf });
        const docText = cleanText(out.value);

        const pdfBytes = await generateScrapedPolicyPdf({
          title: params.title,
          body: docText || params.bodyText,
          meta: params.meta,
        });

        const pdfBuffer = Buffer.isBuffer(pdfBytes)
          ? pdfBytes
          : Buffer.from(pdfBytes as Uint8Array);

        return {
          pdfBuffer,
          usedOriginalPdf: false,
          extractedText: docText,
          extractionMethod: "none" as const,
        };
      }

      // unknown/HTML -> fall through to text->pdf
    } catch {
      // fall through
    }
  }

  // Fallback: generate PDF from text
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
    extractedText: cleanText(params.bodyText ?? ""),
    extractionMethod: "none" as const,
  };
}
