export async function extractPdfTextFromBuffer(pdfBuffer: Buffer, minChars = 200) {
  try {
    const mod: any = await import("pdf-parse");
    const pdfParse = mod?.default ?? mod;

    const data = await pdfParse(pdfBuffer);

    const text = (data?.text ?? "").replace(/\s+/g, " ").trim();
    return text.length >= minChars ? text : "";
  } catch {
    console.log("⚠️ PDF text extraction failed");
    return "";
  }
}
