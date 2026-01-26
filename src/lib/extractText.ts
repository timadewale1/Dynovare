import * as mammoth from "mammoth";

// Firestore doc max is ~1MiB. We'll safely cap stored text.
const MAX_CHARS = 80_000;

function clampText(s: string) {
  const cleaned = s.replace(/\s+/g, " ").trim();
  return cleaned.length > MAX_CHARS ? cleaned.slice(0, MAX_CHARS) : cleaned;
}

async function extractPdfText(file: File) {
  // Dynamic import to avoid bundling issues
  const pdfjsLib: any = await require("pdfjs-dist/build/pdf");
  // Worker setup
  const workerSrc = new URL("pdfjs-dist/build/pdf.worker.mjs", import.meta.url);
  pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc.toString();

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  let fullText = "";
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    const strings = content.items.map((it: any) => it.str).join(" ");
    fullText += strings + "\n";
    if (fullText.length > MAX_CHARS) break;
  }

  return clampText(fullText);
}

async function extractDocxText(file: File) {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return clampText(result.value || "");
}

export async function extractPolicyText(file: File) {
  const type = file.type;

  if (type === "application/pdf") {
    return await extractPdfText(file);
  }

  // DOCX
  if (
    type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return await extractDocxText(file);
  }

  // DOC (old Word) is harder in-browser; allow upload but return empty for now
  // We'll support DOC fully later via server-side extraction.
  return "";
}
