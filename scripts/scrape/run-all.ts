import "./env";

(async () => {
  const { scrapeIEANigeria } = await import("./sources/iea");
  const { scrapeIRENANigeria } = await import("./sources/irena");
  const { scrapeMinistryOfPowerDownloads } = await import("./sources/ng-power");
  const { scrapeECNPolicies } = await import("./sources/ecn");

  console.log("🚀 IEA...");
  await scrapeIEANigeria();

  console.log("🚀 IRENA...");
  await scrapeIRENANigeria();

  console.log("🚀 Ministry of Power...");
  await scrapeMinistryOfPowerDownloads();

  console.log("🚀 ECN...");
  await scrapeECNPolicies();

  console.log("✅ ALL SCRAPES COMPLETE");
})();
