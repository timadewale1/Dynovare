import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { normalizePolicySections, type PolicySection } from "@/lib/policyEditor";

function wrapText(text: string, maxLen: number) {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";

  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > maxLen) {
      if (line) lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }

  if (line) lines.push(line);
  return lines;
}

function sanitizeForPdf(text: string) {
  return String(text || "")
    .replace(/[•●]/g, "-")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[—–]/g, "-")
    .replace(/…/g, "...")
    .replace(/\u00A0/g, " ")
    .replace(/[^\x00-\x7F]/g, "");
}

export async function generatePolicyPdfBytes(params: {
  title: string;
  summary?: string;
  body?: string;
  sections?: PolicySection[];
  meta?: string[];
}) {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const sections = normalizePolicySections(params.sections, params.body ?? "", params.title);
  const margin = 52;
  const lineHeight = 16;
  const textWidth = 78;

  let page = pdf.addPage();
  let { width, height } = page.getSize();
  let y = height - margin;

  const addPage = () => {
    page = pdf.addPage();
    ({ width, height } = page.getSize());
    page.drawRectangle({
      x: 0,
      y: height - 36,
      width,
      height: 36,
      color: rgb(0.06, 0.24, 0.36),
    });
    page.drawRectangle({
      x: margin,
      y: 24,
      width: width - margin * 2,
      height: 1,
      color: rgb(0.85, 0.9, 0.94),
    });
    y = height - margin - 12;
  };

  const ensureSpace = (needed = lineHeight) => {
    if (y - needed < margin) addPage();
  };

  const drawLine = (text: string, options?: { bold?: boolean; size?: number; color?: ReturnType<typeof rgb> }) => {
    ensureSpace((options?.size ?? 11) + 6);
    page.drawText(sanitizeForPdf(text), {
      x: margin,
      y,
      size: options?.size ?? 11,
      font: options?.bold ? fontBold : font,
      color: options?.color ?? rgb(0.11, 0.16, 0.22),
    });
    y -= (options?.size ?? 11) + 5;
  };

  page.drawRectangle({
    x: 0,
    y: 0,
    width,
    height,
    color: rgb(0.98, 0.99, 1),
  });
  page.drawRectangle({
    x: 0,
    y: height - 120,
    width,
    height: 120,
    color: rgb(0.06, 0.24, 0.36),
  });
  page.drawRectangle({
    x: margin,
    y: height - 165,
    width: 180,
    height: 8,
    color: rgb(0.16, 0.64, 0.52),
  });

  y = height - 150;
  drawLine(params.title, { bold: true, size: 22, color: rgb(1, 1, 1) });
  y -= 6;
  drawLine("Dynovare Policy Studio Export", { size: 11, color: rgb(0.85, 0.92, 0.97) });
  y -= 14;

  if (params.summary) {
    for (const line of wrapText(sanitizeForPdf(params.summary), 90).slice(0, 4)) {
      drawLine(line, { size: 11, color: rgb(0.9, 0.95, 0.98) });
    }
    y -= 8;
  }

  if (params.meta?.length) {
    for (const item of params.meta) drawLine(item, { size: 10, color: rgb(0.9, 0.95, 0.98) });
  }

  addPage();

  for (const section of sections) {
    ensureSpace(40);
    page.drawRectangle({
      x: margin,
      y: y - 4,
      width: width - margin * 2,
      height: 22,
      color: rgb(0.92, 0.96, 0.99),
    });
    drawLine(section.title, { bold: true, size: 13, color: rgb(0.06, 0.24, 0.36) });
    y -= 2;

    const paragraphs = sanitizeForPdf(section.body).split(/\n{2,}/).map((item) => item.trim()).filter(Boolean);
    for (const paragraph of paragraphs) {
      const lines = wrapText(paragraph, textWidth);
      for (const line of lines) drawLine(line, { size: 10.5 });
      y -= 5;
    }
    y -= 6;
  }

  return pdf.save();
}
