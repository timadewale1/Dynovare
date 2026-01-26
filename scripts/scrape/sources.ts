export type SourceConfig = {
  key: string;
  name: string;
  baseUrl: string;
  license: "pdf_allowed" | "no_pdf";
  country: "Nigeria";
};

export const SOURCES: SourceConfig[] = [
  {
    key: "iea",
    name: "International Energy Agency",
    baseUrl: "https://www.iea.org/policies",
    license: "no_pdf",
    country: "Nigeria",
  },
  {
    key: "irena",
    name: "IRENA",
    baseUrl: "https://www.irena.org/energy-transition/Policy",
    license: "no_pdf",
    country: "Nigeria",
  },
  {
    key: "climate_laws",
    name: "Climate Change Laws of the World",
    baseUrl: "https://climate-laws.org",
    license: "no_pdf",
    country: "Nigeria",
  },
];
