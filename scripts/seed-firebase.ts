import "./env";
import { adminDb } from "@/lib/firebaseAdmin";

const now = new Date();

const publicPolicies = [
  {
    id: "seed-national-renewable-electricity-2026",
    title: "National Renewable Electricity Acceleration Framework",
    slug: "national-renewable-electricity-acceleration-framework-seed",
    summary:
      "A seeded federal framework focused on grid reinforcement, distributed solar incentives, transmission readiness, and delivery accountability.",
    country: "Nigeria",
    jurisdictionLevel: "federal",
    state: "Federal",
    policyYear: 2026,
    type: "public_source",
    sector: "Electricity",
    energySource: "renewable",
    domain: "electricity",
    visibility: "public",
    tags: ["renewable", "grid", "transmission", "seeded"],
    contentText:
      "Executive Summary\n\nThis seeded framework accelerates renewable electricity deployment.\n\nPolicy Measures\n\nThe framework combines grid upgrades, distributed energy incentives, and delivery oversight.\n\nMonitoring and Evaluation\n\nProgress will be tracked through quarterly access, reliability, and capacity indicators.",
    source: {
      publisher: "Dynovare Seed",
      url: "https://dynovare.local/seed/national-renewable-electricity",
      licenseNote: "Seeded demo policy for platform QA and showcase purposes.",
    },
  },
  {
    id: "seed-lagos-clean-cooking-transition-2026",
    title: "Lagos Clean Cooking Transition Roadmap",
    slug: "lagos-clean-cooking-transition-roadmap-seed",
    summary:
      "A seeded state roadmap for household transition to cleaner cooking fuels, distribution expansion, and behavior change support.",
    country: "Nigeria",
    jurisdictionLevel: "state",
    state: "Lagos",
    policyYear: 2026,
    type: "public_source",
    sector: "Clean Cooking",
    energySource: "mixed",
    domain: "cooking",
    visibility: "public",
    tags: ["clean-cooking", "lagos", "health", "seeded"],
    contentText:
      "Executive Summary\n\nThis seeded roadmap targets cleaner household energy use.\n\nPolicy Measures\n\nThe roadmap expands LPG and electric cooking adoption through incentives and public awareness.\n\nMonitoring and Evaluation\n\nHousehold adoption, affordability, and distribution density will be tracked.",
    source: {
      publisher: "Dynovare Seed",
      url: "https://dynovare.local/seed/lagos-clean-cooking",
      licenseNote: "Seeded demo policy for platform QA and showcase purposes.",
    },
  },
  {
    id: "seed-kaduna-industrial-energy-efficiency-2026",
    title: "Kaduna Industrial Energy Efficiency and Competitiveness Plan",
    slug: "kaduna-industrial-energy-efficiency-and-competitiveness-plan-seed",
    summary:
      "A seeded state plan to reduce industrial energy waste, improve reliability, and strengthen cleaner production incentives.",
    country: "Nigeria",
    jurisdictionLevel: "state",
    state: "Kaduna",
    policyYear: 2026,
    type: "public_source",
    sector: "Industry",
    energySource: "mixed",
    domain: "industry",
    visibility: "public",
    tags: ["industry", "efficiency", "kaduna", "seeded"],
    contentText:
      "Executive Summary\n\nThis seeded plan improves industrial energy productivity.\n\nPolicy Measures\n\nThe plan supports audits, financing access, and operational performance standards.\n\nMonitoring and Evaluation\n\nEnergy intensity and production reliability metrics will guide execution.",
    source: {
      publisher: "Dynovare Seed",
      url: "https://dynovare.local/seed/kaduna-industry-efficiency",
      licenseNote: "Seeded demo policy for platform QA and showcase purposes.",
    },
  },
];

const policyStats = [
  {
    id: "seed-national-renewable-electricity-2026",
    title: "National Renewable Electricity Acceleration Framework",
    slug: "national-renewable-electricity-acceleration-framework-seed",
    country: "Nigeria",
    jurisdictionLevel: "federal",
    state: "Federal",
    policyYear: 2026,
    type: "public_source",
    sector: "Electricity",
    energySource: "renewable",
    domain: "electricity",
    visibility: "public",
    critiquesCount: 7,
    sumOverallScore: 560,
    avgOverallScore: 80,
    latestOverallScore: 82,
    previousOverallScore: 78,
    trendDelta: 4,
    updatedAt: now,
    createdAt: now,
  },
  {
    id: "seed-lagos-clean-cooking-transition-2026",
    title: "Lagos Clean Cooking Transition Roadmap",
    slug: "lagos-clean-cooking-transition-roadmap-seed",
    country: "Nigeria",
    jurisdictionLevel: "state",
    state: "Lagos",
    policyYear: 2026,
    type: "public_source",
    sector: "Clean Cooking",
    energySource: "mixed",
    domain: "cooking",
    visibility: "public",
    critiquesCount: 5,
    sumOverallScore: 355,
    avgOverallScore: 71,
    latestOverallScore: 73,
    previousOverallScore: 68,
    trendDelta: 5,
    updatedAt: now,
    createdAt: now,
  },
  {
    id: "seed-kaduna-industrial-energy-efficiency-2026",
    title: "Kaduna Industrial Energy Efficiency and Competitiveness Plan",
    slug: "kaduna-industrial-energy-efficiency-and-competitiveness-plan-seed",
    country: "Nigeria",
    jurisdictionLevel: "state",
    state: "Kaduna",
    policyYear: 2026,
    type: "public_source",
    sector: "Industry",
    energySource: "mixed",
    domain: "industry",
    visibility: "public",
    critiquesCount: 4,
    sumOverallScore: 258,
    avgOverallScore: 64.5,
    latestOverallScore: 66,
    previousOverallScore: 61,
    trendDelta: 5,
    updatedAt: now,
    createdAt: now,
  },
];

async function main() {
  for (const policy of publicPolicies) {
    await adminDb.collection("policies").doc(policy.id).set(
      {
        ...policy,
        createdByUid: "dynovare_seed",
        createdByName: "Dynovare Seed",
        createdByEmail: null,
        createdAt: now,
        updatedAt: now,
      },
      { merge: true }
    );
  }

  for (const stat of policyStats) {
    await adminDb.collection("policyStats").doc(stat.id).set(stat, { merge: true });
  }

  console.log(`Seeded ${publicPolicies.length} public policies and ${policyStats.length} policyStats records.`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
