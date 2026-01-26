// scripts/scrape/utils/extractPdfTextWithOcr.ts
import * as pdfParse from "pdf-parse";
import { ImageAnnotatorClient } from "@google-cloud/vision";
import { adminStorage } from "@/lib/firebaseAdmin";

type ExtractResult = {
  text: string;
  method: "pdf-text" | "ocr";
};

const vision = new ImageAnnotatorClient({
  projectId: process.env.FIREBASE_PROJECT_ID,
  credentials: {
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    private_key: (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
  },
});

function cleanText(s: string) {
  return String(s || "").replace(/\s+/g, " ").trim();
}

function isProbablyPdf(buf: Buffer) {
  // PDF files start with "%PDF"
  return buf.slice(0, 4).toString("utf8") === "%PDF";
}

export async function extractPdfTextWithOcr(
  pdfBuffer: Buffer,
  opts?: { minChars?: number; gcsTempPrefix?: string }
): Promise<ExtractResult> {
  const minChars = opts?.minChars ?? 200;

  // ✅ Guard: do not attempt OCR on non-PDF bytes
  if (!isProbablyPdf(pdfBuffer)) {
    return { text: "", method: "pdf-text" };
  }

  // 1) Fast path: pdf text layer
  try {
    const parsed = await (pdfParse as any)(pdfBuffer);
    const text = cleanText(parsed?.text || "");
    if (text.length >= minChars) return { text, method: "pdf-text" };
  } catch {
    // ignore -> OCR fallback
  }

  // 2) OCR path (Vision requires GCS input/output for PDFs)
  const bucket = adminStorage.bucket();
  const prefix = opts?.gcsTempPrefix ?? "tmp/vision-ocr";

  const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const inputPath = `${prefix}/input/${id}.pdf`;
  const outputPrefix = `${prefix}/output/${id}/`; // MUST end with "/"

  await bucket.file(inputPath).save(pdfBuffer, {
    contentType: "application/pdf",
    resumable: false,
  });

  const gcsInputUri = `gs://${bucket.name}/${inputPath}`;
  const gcsOutputUri = `gs://${bucket.name}/${outputPrefix}`;

  try {
    const request: any = {
      requests: [
        {
          inputConfig: {
            gcsSource: { uri: gcsInputUri },
            mimeType: "application/pdf",
          },
          features: [{ type: "DOCUMENT_TEXT_DETECTION" }],
          outputConfig: { gcsDestination: { uri: gcsOutputUri } },
        },
      ],
    };

    const [operation] = await (vision as any).asyncBatchAnnotateFiles(request);
    await operation.promise();

    const [files] = await bucket.getFiles({ prefix: outputPrefix });
    const jsonFiles = files.filter((f) => f.name.endsWith(".json"));

    let combined = "";
    for (const f of jsonFiles) {
      const [buf] = await f.download();
      const payload = JSON.parse(buf.toString("utf8"));

      const responses = payload?.responses ?? [];
      for (const r of responses) {
        const t = r?.fullTextAnnotation?.text || "";
        if (t) combined += `\n${t}`;
      }
    }

    return { text: cleanText(combined), method: "ocr" };
  } catch (e: any) {
    // ✅ Don't crash the whole pipeline
    const msg = String(e?.message || e);
    console.log("⚠️ Vision OCR failed:", msg);
    return { text: "", method: "ocr" };
  } finally {
    // best-effort cleanup
    try {
      await bucket.file(inputPath).delete({ ignoreNotFound: true } as any);
    } catch {}
    try {
      const [outFiles] = await bucket.getFiles({ prefix: outputPrefix });
      await Promise.all(outFiles.map((f) => f.delete({ ignoreNotFound: true } as any)));
    } catch {}
  }
}
