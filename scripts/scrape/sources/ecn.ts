import axios from "axios";
import { load } from "cheerio";
import { saveScrapedPolicy } from "../utils/saveScrapedPolicy";

const PAGES = [
  "https://energy.gov.ng/energy-laws.html",
  "https://energy.gov.ng/policy_planning.html",
];

const KEYWORDS = ["energy", "electric", "electricity", "power", "climate", "emission", "renewable", "efficiency", "master plan", "policy"];

function isRelevant(s: string) {
  const t = s.toLowerCase();
  return KEYWORDS.some((k) => t.includes(k));
}

export async function scrapeECNPolicies() {
  for (const pageUrl of PAGES) {
    const { data } = await axios.get(pageUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
      },
    });

    const $ = load(data);

    // collect pdf links
    const pdfLinks: string[] = [];
    $("a").each((_, a) => {
      const href = $(a).attr("href");
      if (!href) return;
      const full = href.startsWith("http") ? href : `https://energy.gov.ng/${href.replace(/^\//, "")}`;
      if (full.toLowerCase().endsWith(".pdf")) pdfLinks.push(full);
    });

    const unique = [...new Set(pdfLinks)].slice(0, 80);
    console.log(`ECN: ${pageUrl} -> ${unique.length} PDF link(s)`);

    for (const pdfUrl of unique) {
      const file = decodeURIComponent(pdfUrl.split("/").pop() ?? "ECN Policy PDF");
      const title = file.replace(/\.pdf$/i, "").replace(/[_%20]+/g, " ").trim();
      if (!isRelevant(title)) continue;

      await saveScrapedPolicy({
        title,
        summary: "",
        contentText: "",
        country: "Nigeria",
        jurisdictionLevel: "federal",
        state: "Federal",
        policyYear: undefined,
        sector: "energy",
        tags: ["ecn", "nigeria", "energy"],

        source: {
          publisher: "Energy Commission of Nigeria",
          url: pageUrl,
          pdfUrl,
          licenseNote: "Public ECN publication link.",
        },
      });
    }
  }
}
