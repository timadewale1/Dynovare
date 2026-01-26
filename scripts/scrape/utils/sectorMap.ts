export type Sector =
  | "electricity"
  | "renewable_energy"
  | "climate_change"
  | "emissions"
  | "energy_efficiency"
  | "fossil_fuels"
  | "general_energy";

export function inferSector(text: string): Sector {
  const t = text.toLowerCase();

  if (t.includes("electricity") || t.includes("power"))
    return "electricity";

  if (t.includes("renewable") || t.includes("solar") || t.includes("wind"))
    return "renewable_energy";

  if (t.includes("climate"))
    return "climate_change";

  if (t.includes("emission") || t.includes("carbon"))
    return "emissions";

  if (t.includes("efficiency"))
    return "energy_efficiency";

  if (t.includes("gas") || t.includes("oil"))
    return "fossil_fuels";

  return "general_energy";
}
