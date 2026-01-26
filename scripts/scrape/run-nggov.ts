import "./env";

(async () => {
  const { scrapeMinistryOfPowerDownloads } = await import("./sources/ng-power");
  const { scrapeECNPolicies } = await import("./sources/ecn");

  console.log("🚀 Starting Ministry of Power scrape...");
  await scrapeMinistryOfPowerDownloads();
  console.log("✅ Ministry of Power scrape complete");

  console.log("🚀 Starting ECN scrape...");
  await scrapeECNPolicies();
  console.log("✅ ECN scrape complete");
})();
