import type { CritiqueStandardId } from "@/lib/critiqueStandards";

// Simple keyword heuristics (MVP). We'll replace with AI later.
const KEYWORDS: Record<CritiqueStandardId, string[]> = {
  sdg_alignment: ["sdg", "sustainable development", "united nations", "targets"],
  inclusivity_equity: ["women", "gender", "youth", "rural", "afford", "equity", "inclusive", "vulnerable"],
  climate_emissions: ["emissions", "co2", "carbon", "climate", "mitigation", "adaptation", "net zero"],
  energy_access_affordability: ["access", "electrification", "mini-grid", "reliability", "tariff", "affordable", "subsidy"],
  implementation_feasibility: ["timeline", "budget", "funding", "phases", "implementation", "capacity", "procurement"],
  governance_accountability: ["governance", "accountability", "oversight", "audit", "transparency", "stakeholders"],
  monitoring_metrics: ["kpi", "baseline", "metrics", "monitor", "evaluation", "reporting", "indicators"],
  global_best_practice: ["best practice", "standard", "framework", "iea", "irena", "benchmark"],
};

function scoreFromText(text: string, standard: CritiqueStandardId) {
  const t = text.toLowerCase();
  const hits = KEYWORDS[standard].reduce((acc, kw) => acc + (t.includes(kw) ? 1 : 0), 0);

  // Convert hits to a 0–100 score with reasonable shape
  if (!text || text.trim().length < 200) return 35; // very low info
  if (hits === 0) return 45;
  if (hits === 1) return 55;
  if (hits === 2) return 65;
  if (hits === 3) return 75;
  if (hits === 4) return 82;
  return 88;
}

function suggestionsFor(standard: CritiqueStandardId, score: number) {
  const map: Record<CritiqueStandardId, string[]> = {
    sdg_alignment: [
      "Explicitly map actions to specific SDGs (SDG7, SDG13, SDG8) with targets.",
      "Add a short SDG alignment table (goal → target → policy action).",
    ],
    inclusivity_equity: [
      "Add measures for affordability and last-mile rural access.",
      "Include gender/youth inclusion and stakeholder consultation requirements.",
    ],
    climate_emissions: [
      "Include emissions baseline, target reductions, and reporting cadence.",
      "Specify mitigation/adaptation actions and link them to measurable outcomes.",
    ],
    energy_access_affordability: [
      "Define how the policy expands access (mini-grid/grid extension) and improves reliability.",
      "Add affordability mechanisms (tariff design, subsidy targeting, consumer protection).",
    ],
    implementation_feasibility: [
      "Add an implementation roadmap (phases, owners, budget bands).",
      "Clarify institutional responsibilities and realistic timelines.",
    ],
    governance_accountability: [
      "Define governance structure and reporting lines across agencies.",
      "Add transparency measures: audits, public reporting, grievance channels.",
    ],
    monitoring_metrics: [
      "Add KPIs, baseline values, targets, and reporting frequency.",
      "Define evaluation methodology and data sources.",
    ],
    global_best_practice: [
      "Align structure with globally common templates: objectives → interventions → governance → M&E.",
      "Add risk register and mitigation strategies.",
    ],
  };

  if (score >= 80) return ["Strong coverage. Consider polishing clarity and adding examples/data."];
  if (score >= 65) return [map[standard][0]];
  return map[standard];
}

export function runCritiqueMVP(params: {
  policyText: string;
  standards: CritiqueStandardId[];
}) {
  const { policyText, standards } = params;

  const results = standards.map((s) => {
    const score = scoreFromText(policyText, s);
    return {
      standardId: s,
      score,
      suggestions: suggestionsFor(s, score),
    };
  });

  const overall =
    results.length === 0
      ? 0
      : Math.round(results.reduce((a, b) => a + b.score, 0) / results.length);

  const strengths =
    results.filter((r) => r.score >= 75).map((r) => r.standardId);

  const risks =
    results.filter((r) => r.score < 60).map((r) => r.standardId);

  return {
    overallScore: overall,
    perStandard: results,
    strengths,
    risks,
    summary:
      overall >= 80
        ? "Strong policy foundation with good alignment across selected standards."
        : overall >= 65
        ? "Decent policy direction, but improvements are needed in some areas."
        : "Policy needs significant improvement across multiple standards.",
  };
}
