export type CritiqueStandardId =
  | "sdg_alignment"
  | "inclusivity_equity"
  | "climate_emissions"
  | "energy_access_affordability"
  | "implementation_feasibility"
  | "governance_accountability"
  | "monitoring_metrics"
  | "global_best_practice";

export const CRITIQUE_STANDARDS: {
  id: CritiqueStandardId;
  label: string;
  description: string;
}[] = [
  {
    id: "sdg_alignment",
    label: "SDG Alignment",
    description: "Alignment with relevant UN SDGs (energy, climate, equity, jobs).",
  },
  {
    id: "inclusivity_equity",
    label: "Inclusivity & Equity",
    description: "Considers vulnerable groups, gender, affordability, rural access.",
  },
  {
    id: "climate_emissions",
    label: "Climate & Emissions",
    description: "Clear emissions impact, mitigation/adaptation measures, targets.",
  },
  {
    id: "energy_access_affordability",
    label: "Energy Access & Affordability",
    description: "Improves access, reliability, and affordability for households/SMEs.",
  },
  {
    id: "implementation_feasibility",
    label: "Implementation Feasibility",
    description: "Actionable steps, institutional capacity, timelines, funding realism.",
  },
  {
    id: "governance_accountability",
    label: "Governance & Accountability",
    description: "Clear roles, responsibilities, transparency, anti-corruption measures.",
  },
  {
    id: "monitoring_metrics",
    label: "Monitoring & Metrics",
    description: "KPIs, baselines, targets, reporting frequency, evaluation method.",
  },
  {
    id: "global_best_practice",
    label: "Global Best Practice (IEA/IRENA-style)",
    description: "Follows internationally recognized policy design principles.",
  },
];
