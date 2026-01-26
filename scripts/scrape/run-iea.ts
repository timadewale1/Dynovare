import "./env"; // ✅ MUST be first

(async () => {
  const { scrapeIEANigeria } = await import("./sources/iea");

  console.log("🚀 Starting IEA Nigeria scrape...");
  await scrapeIEANigeria();
  console.log("✅ IEA scrape complete");
})();
