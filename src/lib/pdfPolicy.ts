import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { normalizePolicySections, type PolicyEvidence, type PolicySection } from "@/lib/policyEditor";

type ExportCritique = {
  overallScore?: number | null;
  summary?: string | null;
  executiveVerdict?: string | null;
  priorityActions?: string[];
  perStandard?: { standardId?: string; score?: number; suggestions?: string[] }[];
  evidence?: PolicyEvidence[];
};

type ExportSimulation = {
  outputs?: Record<string, any> | null;
  evidence?: PolicyEvidence[];
};

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

function wrapText(text: string, maxLen: number) {
  const words = sanitizeForPdf(text).split(/\s+/).filter(Boolean);
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

function wrapWordsToWidth(text: string, maxWidth: number, size: number, font: StandardFonts | any) {
  const words = sanitizeForPdf(text).split(/\s+/).filter(Boolean);
  const lines: string[][] = [];
  let line: string[] = [];
  let width = 0;

  for (const word of words) {
    const wordWidth = font.widthOfTextAtSize(word, size);
    const spaceWidth = line.length ? font.widthOfTextAtSize(" ", size) : 0;
    if (line.length && width + spaceWidth + wordWidth > maxWidth) {
      lines.push(line);
      line = [word];
      width = wordWidth;
    } else {
      line.push(word);
      width += (line.length > 1 ? spaceWidth : 0) + wordWidth;
    }
  }

  if (line.length) lines.push(line);
  return lines;
}

function countWords(text: string) {
  return sanitizeForPdf(text)
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

function formatMetric(value: unknown) {
  if (typeof value === "number") return Number.isFinite(value) ? `${value}` : "-";
  if (typeof value === "string" && value.trim()) return value.trim();
  return "-";
}

function pickNumeric(output: Record<string, any> | null | undefined, keys: string[]) {
  for (const key of keys) {
    const value = output?.[key];
    if (typeof value === "number") return value;
    if (typeof value === "string") {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return null;
}

function normalizeYearSeries(raw: any) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((entry, index) => ({
      year: String(entry?.year ?? entry?.label ?? `Y${index + 1}`),
      access: pickNumeric(entry, ["access", "accessImpact", "accessScore"]),
      reliability: pickNumeric(entry, ["reliability", "reliabilityImpact", "reliabilityScore"]),
      emissions: pickNumeric(entry, ["emissions", "emissionsChange", "emissionsImpact"]),
    }))
    .filter((entry) => entry.access !== null || entry.reliability !== null || entry.emissions !== null);
}

export async function generatePolicyPdfBytes(params: {
  title: string;
  summary?: string;
  body?: string;
  sections?: PolicySection[];
  meta?: string[];
  evidence?: PolicyEvidence[];
  guidance?: {
    draftingNotes?: string[];
    implementationChecklist?: string[];
    revisionPrompts?: string[];
    riskControls?: string[];
  } | null;
  critique?: ExportCritique | null;
  simulation?: ExportSimulation | null;
}) {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const sections = normalizePolicySections(params.sections, params.body ?? "", params.title);
  const allText = sections.map((section) => section.body).join("\n\n");
  const wordCount = countWords(`${params.summary ?? ""}\n${allText}`);
  const margin = 46;
  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const contentWidth = pageWidth - margin * 2;

  const critique = params.critique ?? null;
  const simulation = params.simulation ?? null;
  const references = [
    ...(Array.isArray(params.evidence) ? params.evidence : []),
    ...(Array.isArray(critique?.evidence) ? critique!.evidence! : []),
    ...(Array.isArray(simulation?.evidence) ? simulation!.evidence! : []),
  ].filter((item, index, list) => item?.url && list.findIndex((other) => other?.url === item.url) === index);

  let page = pdf.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  const addPage = () => {
    page = pdf.addPage([pageWidth, pageHeight]);
    page.drawRectangle({ x: 0, y: 0, width: pageWidth, height: pageHeight, color: rgb(0.98, 0.99, 1) });
    page.drawRectangle({ x: 0, y: pageHeight - 28, width: pageWidth, height: 28, color: rgb(0, 0.45, 0.82) });
    page.drawText("Dynovare Policy Studio", {
      x: margin,
      y: pageHeight - 18,
      size: 9,
      font: fontBold,
      color: rgb(1, 1, 1),
    });
    page.drawText(String(pdf.getPageCount()), {
      x: pageWidth - margin - 6,
      y: pageHeight - 18,
      size: 9,
      font: fontBold,
      color: rgb(1, 1, 1),
    });
    y = pageHeight - 52;
  };

  const ensureSpace = (needed: number) => {
    if (y - needed < margin) addPage();
  };

  const drawParagraph = (text: string, options?: { size?: number; bold?: boolean; color?: ReturnType<typeof rgb>; maxLen?: number }) => {
    const size = options?.size ?? 10.5;
    const lines = wrapText(text, options?.maxLen ?? 88);
    for (const line of lines) {
      ensureSpace(size + 6);
      page.drawText(line, {
        x: margin,
        y,
        size,
        font: options?.bold ? fontBold : font,
        color: options?.color ?? rgb(0.11, 0.16, 0.22),
      });
      y -= size + 4;
    }
  };

  const drawJustifiedParagraph = (text: string, options?: { size?: number; color?: ReturnType<typeof rgb> }) => {
    const size = options?.size ?? 10.25;
    const maxWidth = contentWidth;
    const lines = wrapWordsToWidth(text, maxWidth, size, font);

    lines.forEach((words, index) => {
      ensureSpace(15);
      const isLastLine = index === lines.length - 1 || words.length <= 1;
      const joined = words.join(" ");

      if (isLastLine) {
        page.drawText(joined, {
          x: margin,
          y,
          size,
          font,
          color: options?.color ?? rgb(0.12, 0.16, 0.22),
        });
      } else {
        const wordWidths = words.map((word) => font.widthOfTextAtSize(word, size));
        const totalWordWidth = wordWidths.reduce((sum, value) => sum + value, 0);
        const gapCount = words.length - 1;
        const gapWidth = gapCount > 0 ? (maxWidth - totalWordWidth) / gapCount : 0;
        let cursorX = margin;

        words.forEach((word, wordIndex) => {
          page.drawText(word, {
            x: cursorX,
            y,
            size,
            font,
            color: options?.color ?? rgb(0.12, 0.16, 0.22),
          });
          cursorX += wordWidths[wordIndex] + (wordIndex < gapCount ? gapWidth : 0);
        });
      }

      y -= 14;
    });
  };

  const drawLabelValue = (label: string, value: string, x: number, top: number, boxWidth: number, boxHeight: number) => {
    page.drawRectangle({
      x,
      y: top - boxHeight,
      width: boxWidth,
      height: boxHeight,
      color: rgb(1, 1, 1),
      borderWidth: 1,
      borderColor: rgb(0.85, 0.9, 0.95),
    });
    page.drawText(sanitizeForPdf(label.toUpperCase()), {
      x: x + 12,
      y: top - 20,
      size: 8,
      font: fontBold,
      color: rgb(0.38, 0.46, 0.55),
    });
    page.drawText(sanitizeForPdf(value), {
      x: x + 12,
      y: top - 44,
      size: 16,
      font: fontBold,
      color: rgb(0, 0.22, 0.41),
    });
  };

  const drawListCard = (title: string, items: string[], tone: { fill: ReturnType<typeof rgb>; border: ReturnType<typeof rgb> }) => {
    if (!items.length) return;
    const lines = items.slice(0, 5).flatMap((item) => wrapText(item, 70));
    const boxHeight = 42 + lines.length * 14;
    ensureSpace(boxHeight + 18);
    page.drawRectangle({
      x: margin,
      y: y - boxHeight,
      width: contentWidth,
      height: boxHeight,
      color: tone.fill,
      borderColor: tone.border,
      borderWidth: 1,
    });
    page.drawText(title, {
      x: margin + 14,
      y: y - 20,
      size: 11,
      font: fontBold,
      color: rgb(0, 0.22, 0.41),
    });
    let innerY = y - 38;
    for (const item of items.slice(0, 5)) {
      const bulletLines = wrapText(item, 70);
      for (let index = 0; index < bulletLines.length; index += 1) {
        page.drawText(index === 0 ? `- ${bulletLines[index]}` : `  ${bulletLines[index]}`, {
          x: margin + 16,
          y: innerY,
          size: 9.5,
          font,
          color: rgb(0.16, 0.22, 0.29),
        });
        innerY -= 14;
      }
    }
    y -= boxHeight + 14;
  };

  const drawSectionBody = (body: string) => {
    const paragraphs = sanitizeForPdf(body)
      .split(/\n{2,}/)
      .map((item) => item.trim())
      .filter(Boolean);

    for (const paragraph of paragraphs) {
      if (/^[-*]\s+/.test(paragraph)) {
        const items = paragraph
          .split(/\n/)
          .map((line) => line.replace(/^[-*]\s+/, "").trim())
          .filter(Boolean);
        for (const item of items) {
          const bulletLines = wrapText(item, 82);
          for (let index = 0; index < bulletLines.length; index += 1) {
            ensureSpace(15);
            page.drawText(index === 0 ? `- ${bulletLines[index]}` : `  ${bulletLines[index]}`, {
              x: margin + 10,
              y,
              size: 10,
              font,
              color: rgb(0.12, 0.16, 0.22),
            });
            y -= 14;
          }
        }
        y -= 4;
        continue;
      }

      const lines = wrapText(paragraph, 88);
      if (lines.length) {
        drawJustifiedParagraph(paragraph, { size: 10.25, color: rgb(0.12, 0.16, 0.22) });
      }
      y -= 6;
    }
  };

  const drawCritiqueBars = () => {
    const standards = Array.isArray(critique?.perStandard) ? critique!.perStandard!.slice(0, 6) : [];
    if (!standards.length) return;
    ensureSpace(170);
    page.drawText("Critique Snapshot", {
      x: margin,
      y,
      size: 14,
      font: fontBold,
      color: rgb(0, 0.22, 0.41),
    });
    y -= 18;

    standards.forEach((item) => {
      const score = Math.max(0, Math.min(100, Number(item.score ?? 0)));
      const label = sanitizeForPdf(String(item.standardId ?? "standard").replace(/_/g, " "));
      ensureSpace(26);
      page.drawText(label, { x: margin, y, size: 9.5, font: fontBold, color: rgb(0.22, 0.29, 0.36) });
      page.drawText(`${score}/100`, { x: pageWidth - margin - 40, y, size: 9.5, font: fontBold, color: rgb(0, 0.22, 0.41) });
      y -= 10;
      page.drawRectangle({ x: margin, y, width: contentWidth, height: 8, color: rgb(0.9, 0.94, 0.97) });
      page.drawRectangle({ x: margin, y, width: (contentWidth * score) / 100, height: 8, color: rgb(0, 0.45, 0.82) });
      y -= 18;
    });
    y -= 4;
  };

  const drawSimulationChart = () => {
    const output = simulation?.outputs ?? {};
    const yearSeries = normalizeYearSeries(output?.yearByYear);
    if (!yearSeries.length) return;

    ensureSpace(240);
    page.drawText("Scenario Trend", {
      x: margin,
      y,
      size: 14,
      font: fontBold,
      color: rgb(0, 0.22, 0.41),
    });
    y -= 18;

    const chartX = margin;
    const chartY = y - 170;
    const chartWidth = contentWidth;
    const chartHeight = 150;
    page.drawRectangle({ x: chartX, y: chartY, width: chartWidth, height: chartHeight, color: rgb(1, 1, 1), borderColor: rgb(0.85, 0.9, 0.95), borderWidth: 1 });

    const values = yearSeries.flatMap((point) => [point.access, point.reliability, point.emissions].filter((value): value is number => value !== null));
    const min = Math.min(...values, 0);
    const max = Math.max(...values, 100);
    const range = max - min || 1;
    const plotLeft = chartX + 28;
    const plotBottom = chartY + 22;
    const plotWidth = chartWidth - 48;
    const plotHeight = chartHeight - 42;

    for (let tick = 0; tick <= 4; tick += 1) {
      const tickValue = min + (range * tick) / 4;
      const tickY = plotBottom + (plotHeight * tick) / 4;
      page.drawRectangle({ x: plotLeft, y: tickY, width: plotWidth, height: 0.5, color: rgb(0.9, 0.93, 0.96) });
      page.drawText(`${Math.round(tickValue)}`, { x: chartX + 2, y: tickY - 3, size: 8, font, color: rgb(0.44, 0.51, 0.58) });
    }

    const drawSeries = (key: "access" | "reliability" | "emissions", color: ReturnType<typeof rgb>) => {
      let previous: { x: number; y: number } | null = null;
      yearSeries.forEach((point, index) => {
        const value = point[key];
        if (value === null) return;
        const x = plotLeft + (plotWidth * index) / Math.max(1, yearSeries.length - 1);
        const yPoint = plotBottom + ((value - min) / range) * plotHeight;
        page.drawCircle({ x, y: yPoint, size: 2.6, color });
        if (previous) {
          page.drawLine({ start: previous, end: { x, y: yPoint }, thickness: 2, color });
        }
        previous = { x, y: yPoint };
      });
    };

    drawSeries("access", rgb(0, 0.45, 0.82));
    drawSeries("reliability", rgb(0.02, 0.62, 0.52));
    drawSeries("emissions", rgb(0.83, 0.42, 0.24));

    yearSeries.forEach((point, index) => {
      const x = plotLeft + (plotWidth * index) / Math.max(1, yearSeries.length - 1);
      page.drawText(point.year, { x: x - 8, y: chartY + 8, size: 7.5, font, color: rgb(0.44, 0.51, 0.58) });
    });

    page.drawText("Access", { x: chartX + 20, y: chartY + chartHeight + 6, size: 8.5, font: fontBold, color: rgb(0, 0.45, 0.82) });
    page.drawText("Reliability", { x: chartX + 70, y: chartY + chartHeight + 6, size: 8.5, font: fontBold, color: rgb(0.02, 0.62, 0.52) });
    page.drawText("Emissions", { x: chartX + 142, y: chartY + chartHeight + 6, size: 8.5, font: fontBold, color: rgb(0.83, 0.42, 0.24) });

    y = chartY - 14;
  };

  page.drawRectangle({ x: 0, y: 0, width: pageWidth, height: pageHeight, color: rgb(0.98, 0.99, 1) });
  page.drawRectangle({ x: 0, y: pageHeight - 168, width: pageWidth, height: 168, color: rgb(0, 0.22, 0.41) });
  page.drawRectangle({ x: 0, y: pageHeight - 132, width: pageWidth, height: 132, color: rgb(0, 0.45, 0.82), opacity: 0.86 });
  page.drawRectangle({ x: margin, y: pageHeight - 178, width: 130, height: 8, color: rgb(0.56, 0.83, 0.95) });

  y = pageHeight - 104;
  drawParagraph(params.title, { bold: true, size: 24, color: rgb(1, 1, 1), maxLen: 44 });
  y -= 4;
  drawParagraph("Dynovare styled policy export", { size: 11, color: rgb(0.88, 0.95, 0.99), maxLen: 60 });
  if (params.summary) {
    y -= 10;
    drawParagraph(params.summary, { size: 10.5, color: rgb(0.92, 0.96, 0.99), maxLen: 86 });
  }

  y = pageHeight - 260;
  const cardTop = y;
  const boxWidth = (contentWidth - 24) / 3;
  drawLabelValue("Word count", wordCount.toLocaleString(), margin, cardTop, boxWidth, 62);
  drawLabelValue("Sections", `${sections.length}`, margin + boxWidth + 12, cardTop, boxWidth, 62);
  drawLabelValue("Critique score", critique?.overallScore ? `${critique.overallScore}/100` : "-", margin + boxWidth * 2 + 24, cardTop, boxWidth, 62);
  y -= 82;

  if (params.meta?.length) {
    page.drawText("Document context", { x: margin, y, size: 11, font: fontBold, color: rgb(0, 0.22, 0.41) });
    y -= 16;
    params.meta.slice(0, 4).forEach((item, index) => {
      const x = margin + (index % 2) * (contentWidth / 2);
      const row = Math.floor(index / 2);
      page.drawText(sanitizeForPdf(item), {
        x,
        y: y - row * 14,
        size: 9.5,
        font,
        color: rgb(0.32, 0.39, 0.46),
      });
    });
    y -= 38;
  }

  drawListCard("Drafting notes", (params.guidance?.draftingNotes ?? []).slice(0, 4), {
    fill: rgb(0.94, 0.97, 1),
    border: rgb(0.8, 0.88, 0.96),
  });

  drawListCard("Priority actions", (critique?.priorityActions ?? []).slice(0, 4), {
    fill: rgb(1, 0.97, 0.92),
    border: rgb(0.98, 0.85, 0.65),
  });

  drawListCard("Implementation checklist", (params.guidance?.implementationChecklist ?? []).slice(0, 4), {
    fill: rgb(0.94, 0.99, 0.96),
    border: rgb(0.77, 0.92, 0.84),
  });

  addPage();

  if (critique?.executiveVerdict) {
    drawParagraph("Executive Verdict", { bold: true, size: 15, color: rgb(0, 0.22, 0.41) });
    y -= 4;
    drawParagraph(critique.executiveVerdict, { size: 11, color: rgb(0.17, 0.22, 0.29), maxLen: 88 });
    y -= 10;
  }

  if (critique?.summary) {
    drawParagraph("Critique Summary", { bold: true, size: 14, color: rgb(0, 0.22, 0.41) });
    y -= 4;
    drawParagraph(critique.summary, { size: 10.5, maxLen: 88 });
    y -= 10;
  }

  drawCritiqueBars();

  const simOutputs = simulation?.outputs ?? {};
  const metricTop = y;
  const metricValues = [
    ["Access", formatMetric(pickNumeric(simOutputs, ["accessImpact", "access", "accessScore"]))],
    ["Reliability", formatMetric(pickNumeric(simOutputs, ["reliabilityImpact", "reliability", "reliabilityScore"]))],
    ["Emissions", formatMetric(pickNumeric(simOutputs, ["emissionsChange", "emissions", "emissionsImpact"]))],
  ];
  if (metricValues.some((entry) => entry[1] !== "-")) {
    ensureSpace(80);
    page.drawText("Scenario Metrics", { x: margin, y, size: 14, font: fontBold, color: rgb(0, 0.22, 0.41) });
    y -= 18;
    const smallWidth = (contentWidth - 24) / 3;
    metricValues.forEach(([label, value], index) => {
      drawLabelValue(label, value, margin + index * (smallWidth + 12), y, smallWidth, 58);
    });
    y -= 76;
  }

  drawSimulationChart();

  for (const section of sections) {
    ensureSpace(48);
    page.drawRectangle({
      x: margin,
      y: y - 8,
      width: contentWidth,
      height: 24,
      color: rgb(0.93, 0.96, 1),
    });
    page.drawText(sanitizeForPdf(section.title), {
      x: margin + 10,
      y,
      size: 12,
      font: fontBold,
      color: rgb(0, 0.22, 0.41),
    });
    y -= 24;
    drawSectionBody(section.body);
    y -= 8;
  }

  if (references.length) {
    addPage();
    drawParagraph("References", { bold: true, size: 16, color: rgb(0, 0.22, 0.41) });
    y -= 8;
    references.forEach((reference, index) => {
      const why = reference.whyRelevant ? `Why it matters: ${reference.whyRelevant}` : "";
      ensureSpace(60);
      page.drawRectangle({
        x: margin,
        y: y - 50,
        width: contentWidth,
        height: 50,
        color: rgb(1, 1, 1),
        borderColor: rgb(0.85, 0.9, 0.95),
        borderWidth: 1,
      });
      page.drawText(`${index + 1}. ${sanitizeForPdf(reference.title || "Reference")}`, {
        x: margin + 12,
        y: y - 16,
        size: 10.5,
        font: fontBold,
        color: rgb(0, 0.22, 0.41),
      });
      page.drawText(sanitizeForPdf(reference.url || ""), {
        x: margin + 12,
        y: y - 30,
        size: 8.5,
        font,
        color: rgb(0, 0.3, 0.56),
      });
      if (why) {
        page.drawText(sanitizeForPdf(why).slice(0, 120), {
          x: margin + 12,
          y: y - 42,
          size: 8.5,
          font,
          color: rgb(0.35, 0.42, 0.48),
        });
      }
      y -= 62;
    });
  }

  return pdf.save();
}
