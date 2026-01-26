import axios from "axios";
import { load } from "cheerio";
import { saveScrapedPolicy } from "../utils/saveScrapedPolicy";

const LIST_URL = "https://www.power.gov.ng/news-media/downloads/";

const KEYWORDS = [
  "energy",
  "electric",
  "electricity",
  "power",
  "climate",
  "emission",
  "renewable",
  "policy",
  "act",
  "law",
  "tariff",
  "grid",
];

function isRelevant(s: string) {
  const t = s.toLowerCase();
  return KEYWORDS.some((k) => t.includes(k));
}

function absUrl(href: string) {
  if (!href) return "";
  if (href.startsWith("http")) return href;
  // site uses both www.power.gov.ng and power.gov.ng
  const base = "https://www.power.gov.ng";
  return `${base}${href.startsWith("/") ? "" : "/"}${href}`;
}

export async function scrapeMinistryOfPowerDownloads() {
  const { data } = await axios.get(LIST_URL, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
    },
  });

  const $ = load(data);

  // 1) Find /download/.../ pages
  const downloadPages: string[] = [];
  $("a").each((_, a) => {
    const href = $(a).attr("href");
    if (!href) return;

    const full = absUrl(href);

    // these are the detail pages like /download/electricity-act-2023/
    if (full.includes("/download/")) {
      downloadPages.push(full);
    }
  });

  const uniquePages = [...new Set(downloadPages)].slice(0, 60);
  console.log(`MOP: Found ${uniquePages.length} download page(s).`);

  for (const pageUrl of uniquePages) {
    try {
      const page = await axios.get(pageUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
        },
      });

      const $$ = load(page.data);

      // Title: usually h1 on page
      const title = $$("h1").first().text().trim() || pageUrl.split("/").filter(Boolean).pop()!;
      if (!title) continue;

      if (!isRelevant(title)) continue;

      // 2) Find actual file link (PDF/DOC/DOCX)
      let fileUrl: string | null = null;

      $$("a").each((_, a) => {
        const href = $$(a).attr("href");
        if (!href) return;
        const full = absUrl(href);

        // common file types
        if (
          full.toLowerCase().endsWith(".pdf") ||
          full.toLowerCase().endsWith(".doc") ||
          full.toLowerCase().endsWith(".docx")
        ) {
          fileUrl = full;
        }
      });

      // fallback: sometimes the download button uses query strings without extension
      if (!fileUrl) {
        $$("a").each((_, a) => {
          const text = $$(a).text().toLowerCase();
          const href = $$(a).attr("href");
          if (!href) return;

          if (text.includes("download")) {
            fileUrl = absUrl(href);
          }
        });
      }

      if (!fileUrl) {
        console.log(`MOP: No file link found for: ${title}`);
        continue;
      }

      // Best-effort year from title
      const y = title.match(/\b(19|20)\d{2}\b/);
      const policyYear = y ? Number(y[0]) : undefined;

      await saveScrapedPolicy({
        title,
        summary: "",
        // we can add text extraction later; for now we store PDF bytes (preferred)
        contentText: "",
        country: "Nigeria",
        jurisdictionLevel: "federal",
        state: "Federal",
        policyYear,
        sector: "energy",
        tags: ["ministry_of_power", "nigeria", "energy"],

        source: {
          publisher: "Federal Ministry of Power",
          url: pageUrl,       // page where the download is referenced
          pdfUrl: fileUrl,    // actual file link (pdf/doc/docx)
          licenseNote: "Official government download page.",
        },
      });
    } catch (e) {
      console.log("MOP: Failed page:", pageUrl);
    }
  }
}
