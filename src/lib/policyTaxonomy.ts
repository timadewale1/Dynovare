export const POLICY_SECTORS = [
  "Electricity",
  "Renewable Energy",
  "Oil & Gas",
  "Clean Cooking",
  "Transport",
  "Industry",
  "Buildings",
  "Agriculture",
  "Waste",
  "Climate & Emissions",
] as const;

export const POLICY_ENERGY_SOURCES = [
  "renewable",
  "non_renewable",
  "mixed",
] as const;

export const POLICY_DOMAINS = [
  "electricity",
  "cooking",
  "transport",
  "industry",
  "agriculture",
  "cross_sector",
] as const;

export type PolicySector = (typeof POLICY_SECTORS)[number];
export type PolicyEnergySource = (typeof POLICY_ENERGY_SOURCES)[number];
export type PolicyDomain = (typeof POLICY_DOMAINS)[number];

export function policyEnergySourceLabel(value?: string | null) {
  if (value === "renewable") return "Renewable";
  if (value === "non_renewable") return "Non-renewable";
  if (value === "mixed") return "Mixed";
  return "Unspecified";
}

export function policyDomainLabel(value?: string | null) {
  if (value === "cross_sector") return "Cross-sector";
  if (!value) return "Unspecified";
  return value.charAt(0).toUpperCase() + value.slice(1);
}
