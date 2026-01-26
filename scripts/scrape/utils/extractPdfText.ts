export async function extractPdfTextFromBuffer(pdfBuffer: Buffer) {
  try {
    // Works regardless of whether pdf-parse exposes default or direct callable
    const mod: any = await import("pdf-parse");
    const pdfParse = mod?.default ?? mod;

    const data = await pdfParse(pdfBuffer);

    const text = (data?.text ?? "")
      .replace(/\s+/g, " ")
      .trim();

    return text;
  } catch (e) {
    console.log("⚠️ PDF text extraction failed");
    return "";
  }
}
