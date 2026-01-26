import "./env";

(async () => {
  const { scrapeIRENANigeria } = await import("./sources/irena");
  console.log("🚀 Starting IRENA Nigeria scrape...");
  await scrapeIRENANigeria();
  console.log("✅ IRENA scrape complete");
})();
