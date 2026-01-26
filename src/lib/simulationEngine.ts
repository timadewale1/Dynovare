export type SimulationInputs = {
  horizonYears: number; // 1–20
  implementationStrength: "weak" | "moderate" | "strong";
  fundingLevel: "low" | "medium" | "high";
  adoptionRate: number; // 0–100
  assumptions: {
    gridExpansion: boolean;
    miniGridGrowth: boolean;
    tariffReform: boolean;
    cleanCooking: boolean;
  };
};

export type SimulationOutputs = {
  accessImpactPct: number; // estimated % improvement
  reliabilityImpactPct: number;
  emissionsChangePct: number; // negative means reduction
  estimatedCostUSD: { low: number; high: number };
  riskLevel: "Low" | "Medium" | "High";
  narrative: string;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function runSimulationMVP(params: {
  policyTitle: string;
  policyType?: string;
  inputs: SimulationInputs;
}) {
  const { inputs } = params;

  const strengthFactor =
    inputs.implementationStrength === "strong"
      ? 1.15
      : inputs.implementationStrength === "moderate"
      ? 1.0
      : 0.85;

  const fundingFactor =
    inputs.fundingLevel === "high" ? 1.2 : inputs.fundingLevel === "medium" ? 1.0 : 0.8;

  const horizonFactor = clamp(inputs.horizonYears / 5, 0.3, 2.0); // 5-year baseline
  const adoptionFactor = clamp(inputs.adoptionRate / 100, 0, 1);

  const assumptionBoost =
    (inputs.assumptions.gridExpansion ? 0.08 : 0) +
    (inputs.assumptions.miniGridGrowth ? 0.10 : 0) +
    (inputs.assumptions.tariffReform ? 0.06 : 0) +
    (inputs.assumptions.cleanCooking ? 0.05 : 0);

  // Access & reliability improvements (toy model)
  let access = 8 * horizonFactor * strengthFactor * fundingFactor * adoptionFactor;
  access += 100 * assumptionBoost * 0.15;

  let reliability = 6 * horizonFactor * strengthFactor * fundingFactor * adoptionFactor;
  reliability += 100 * (inputs.assumptions.gridExpansion ? 0.05 : 0);

  // Emissions change: more clean energy & efficiency → bigger reduction
  let emissions = -5 * horizonFactor * strengthFactor * adoptionFactor;
  emissions += inputs.assumptions.cleanCooking ? -2 : 0;
  emissions += inputs.assumptions.tariffReform ? -1 : 0;

  access = clamp(access, 0, 35);
  reliability = clamp(reliability, 0, 30);
  emissions = clamp(emissions, -25, 10);

  // Cost estimate rough bands
  const baseCost = 120_000_000 * horizonFactor; // baseline 5-year
  const fundingMultiplier = inputs.fundingLevel === "high" ? 1.4 : inputs.fundingLevel === "medium" ? 1.0 : 0.7;
  const scale = 0.7 + adoptionFactor * 0.6;
  const cost = baseCost * fundingMultiplier * scale;

  const low = Math.round(cost * 0.8);
  const high = Math.round(cost * 1.25);

  // Risk level
  let riskScore = 0;
  if (inputs.implementationStrength === "weak") riskScore += 2;
  if (inputs.fundingLevel === "low") riskScore += 2;
  if (inputs.adoptionRate < 35) riskScore += 2;
  if (inputs.horizonYears >= 10) riskScore += 1;

  const riskLevel = riskScore >= 5 ? "High" : riskScore >= 3 ? "Medium" : "Low";

  const narrative =
    `Over a ${inputs.horizonYears}-year horizon with ${inputs.implementationStrength} implementation and ` +
    `${inputs.fundingLevel} funding, adoption at ${inputs.adoptionRate}% is projected to improve energy access by ` +
    `${access.toFixed(1)}% and reliability by ${reliability.toFixed(1)}%. Estimated emissions impact is ` +
    `${emissions.toFixed(1)}% (${emissions < 0 ? "reduction" : "increase"}). Risk level: ${riskLevel}.`;

  return {
    overall: {
      riskLevel,
      headline: `${access.toFixed(1)}% access uplift • ${emissions.toFixed(1)}% emissions change`,
    },
    outputs: {
      accessImpactPct: Number(access.toFixed(1)),
      reliabilityImpactPct: Number(reliability.toFixed(1)),
      emissionsChangePct: Number(emissions.toFixed(1)),
      estimatedCostUSD: { low, high },
      riskLevel,
      narrative,
    },
  };
}
