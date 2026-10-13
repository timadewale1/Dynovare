import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "CIEGMA",
    template: "%s | CIEGMA",
  },
  description: "Central Intelligence for Energy Governance and Market Analytics.",
  applicationName: "CIEGMA",
};

export default function PolicyAnalyticsLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}