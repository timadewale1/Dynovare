import axios from "axios";
import { load } from "cheerio";
import { saveScrapedPolicy } from "../utils/saveScrapedPolicy";

const BASE = "https://www.irena.org";

// This search is already Nigeria-tag filtered (works well in practice)
const IRENA_NIGERIA_SEARCH =
  "https://www.irena.org/Search?tagCountryEngagements=2b6400a1-60a0-4d5a-81ff-748b6ede8b89&orderBy=Date";

const KEYWORDS = [
  "nigeria",
  "energy",
  "electricity",
  "power",
  "climate",
  "emission",
  "renewable",
  "transition",
];

function isRelevant(t: string) {
  const s = t.toLowerCase();
  return KEYWORDS.some((k) => s.includes(k));
}

function absUrl(href: string) {
  if (href.startsWith("http")) return href;
  return `${BASE}${href.startsWith("/") ? "" : "/"}${href}`;
}

export async function scrapeIRENANigeria() {
  const { data } = await axios.get(IRENA_NIGERIA_SEARCH, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
    },
  });

  const $ = load(data);

  // Grab result links (IRENA changes markup sometimes; this is intentionally broad)
  const links: string[] = [];
  $("a").each((_, a) => {
    const href = $(a).attr("href");
    if (!href) return;
    const full = absUrl(href);

    // Keep only content pages, not filters
    if (
      full.includes("irena.org/") &&
      !full.includes("/Search?") &&
      !full.includes("#") &&
      (full.includes("/Publications/") ||
        full.includes("/News/") ||
        full.includes("/Events/") ||
        full.includes("/Search/"))
    ) {
      links.push(full);
    }
  });

  const unique = [...new Set(links)].slice(0, 25);
  console.log(`IRENA: Found ${unique.length} candidate page(s).`);

  for (const pageUrl of unique) {
    try {
      const page = await axios.get(pageUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
        },
      });

      const $$ = load(page.data);

      const title = $$("h1").first().text().trim();
      if (!title) continue;

      const metaDesc = ($$("meta[name='description']").attr("content") ?? "").trim();

      // Find PDF link if present
      let pdfUrl: string | null = null;
      $$("a").each((_, a) => {
        const href = $$(a).attr("href");
        if (!href) return;
        const full = absUrl(href);
        if (full.toLowerCase().endsWith(".pdf")) pdfUrl = full;
      });

      // Extract readable text (best effort)
      const bodyText = [
        $$("article").text(),
        $$("main").text(),
        $$(".o-content").text(),
      ]
        .map((t) => t.replace(/\s+/g, " ").trim())
        .sort((a, b) => b.length - a.length)[0];

      const combined = `${title} ${metaDesc} ${bodyText}`.toLowerCase();
      if (!isRelevant(combined)) continue;

      // Best-effort year
      const yearMatch = combined.match(/\b(19|20)\d{2}\b/);
      const policyYear = yearMatch ? Number(yearMatch[0]) : undefined;

      // Sector guess (simple)
      const sector =
        combined.includes("electric") || combined.includes("power")
          ? "electricity"
          : combined.includes("climate") || combined.includes("emission")
          ? "climate"
          : "energy";

      if (!bodyText || bodyText.length < 400) {
        // still allow if PDF exists
        if (!pdfUrl) continue;
      }

      await saveScrapedPolicy({
        title,
        summary: metaDesc,
        contentText: bodyText ?? "",
        country: "Nigeria",
        jurisdictionLevel: "federal",
        state: "Federal",
        policyYear,
        sector,

        tags: ["irena", "nigeria", sector],

        source: {
          publisher: "IRENA",
          url: pageUrl,
          pdfUrl,
          licenseNote: "Saved for research reference; follows platform policy for downloadable vs text-derived PDFs.",
        },
      });
    } catch {
      console.log("IRENA: skip failed page", pageUrl);
    }
  }
}
