import { PDFDocument, StandardFonts } from "pdf-lib";

function wrapText(text: string, maxLen: number) {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";

  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (test.length > maxLen) {
      if (line) lines.push(line);
      line = w;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function sanitizeForPdf(text: string) {
  return text
    // bullets & symbols
    .replace(/●|•/g, "-")
    // smart quotes
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    // dashes
    .replace(/—|–/g, "-")
    // ellipsis
    .replace(/…/g, "...")
    // non-breaking space
    .replace(/\u00A0/g, " ")
    // remove any remaining non-ansi characters
    .replace(/[^\x00-\x7F]/g, "");
}


export async function generatePolicyPdfBytes(params: {
  title: string;
  body: string;
  meta?: string[];
}) {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const margin = 50;
  const fontSize = 11;
  const lineHeight = 15;
  const maxCharsPerLine = 95;

  let page = pdf.addPage();
  let { width, height } = page.getSize();
  let y = height - margin;

  const drawLine = (txt: string, bold = false, size = fontSize) => {
    if (y < margin + lineHeight) {
      page = pdf.addPage();
      ({ width, height } = page.getSize());
      y = height - margin;
    }
    page.drawText(txt, {
      x: margin,
      y,
      size,
      font: bold ? fontBold : font,
    });
    y -= lineHeight;
  };

  // Title
drawLine(sanitizeForPdf(params.title), true, 16);
  y -= 8;

  if (params.meta?.length) {
params.meta.forEach((m) => drawLine(sanitizeForPdf(m), false, 10));
    y -= 8;
  }

  // Body
  const safeBody = sanitizeForPdf(params.body);
const lines = wrapText(safeBody, maxCharsPerLine);
for (const l of lines) drawLine(l);


  return await pdf.save();
}
