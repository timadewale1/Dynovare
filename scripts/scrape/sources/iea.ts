import axios from "axios";
import { load } from "cheerio";
import { normalizeIEAPolicy } from "../utils/normalizePolicy";
import { saveScrapedPolicy } from "../utils/saveScrapedPolicy";

const IEA_SEARCH_URL = "https://www.iea.org/search/policies?q=Nigeria%20energy";

// basic keyword filter (title/summary/body)
const KEYWORDS = ["energy", "electricity", "power", "climate", "emission", "renewable, Nigeria"];

function isRelevant(text: string) {
  const t = text.toLowerCase();
  return KEYWORDS.some((k) => t.includes(k));
}

export async function scrapeIEANigeria() {
  const { data } = await axios.get(IEA_SEARCH_URL, {
    headers: {
      // helps prevent some bot blocks
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
    },
  });

  const $ = load(data);

  // Collect policy links
  const links: string[] = [];
  $("a").each((_, el) => {
    const href = $(el).attr("href");
    if (!href) return;

    // IEA URLs can be absolute or relative
    const full = href.startsWith("http") ? href : `https://www.iea.org${href}`;

    // keep only policy pages
    if (full.includes("iea.org/policies")) links.push(full);
  });

  const uniqueLinks = [...new Set(links)].slice(0, 25); // start small

  console.log(`Found ${uniqueLinks.length} candidate policy link(s).`);

  for (const url of uniqueLinks) {
    try {
      const page = await axios.get(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
        },
      });

      const $$ = load(page.data);

      const title = $$("h1").first().text().trim();
      const summary = ($$("meta[name='description']").attr("content") ?? "").trim();

      // best-effort content extraction
      const candidates = [
  $$("article").text(),
  $$(".m-policy__content").text(),
  $$(".m-article__content").text(),
  $$(".o-content").text(),
  $$("main").text(),
];

const bodyText = candidates
  .map((t) => t.replace(/\s+/g, " ").trim())
  .sort((a, b) => b.length - a.length)[0]; // pick the longest


      if (!title) {
  console.log("SKIP (no title):", url);
  continue;
}

if (!isRelevant(`${title} ${summary} ${bodyText}`)) {
  console.log("SKIP (not relevant):", title);
  continue;
}

if (!bodyText || bodyText.length < 500) {
  console.log("SKIP (too short):", title, "len:", bodyText?.length ?? 0);
  continue;
}


      // year extraction (best-effort)
      const yearMatch = bodyText.match(/\b(19|20)\d{2}\b/);
      const year = yearMatch ? Number(yearMatch[0]) : undefined;

      const normalized = normalizeIEAPolicy({
        title,
        summary,
        url,
        year,
        fullText: bodyText,
      });

      await saveScrapedPolicy(normalized);
    } catch (err) {
      console.error("❌ Failed scraping:", url);
    }
  }
}
