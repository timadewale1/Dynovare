// src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import "./company-site.css";
import "./landing.css";
import { Toaster } from "react-hot-toast";
import { UserProvider } from "@/components/providers/UserProvider";
import PwaBootstrap from "@/components/app/PwaBootstrap";

// Global app shell: metadata, styling, session context, and PWA bootstrapping all start here.
export const metadata: Metadata = {
  title: "Dynovare Technologies | Subnational Energy Intelligence",
  description: "Dynovare turns subnational energy and governance data into intelligence for better decisions across Africa.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://dynovare.com"),
  applicationName: "Dynovare Technologies",
  manifest: "/manifest.webmanifest",
  openGraph: {
    title: "Dynovare Technologies | Subnational Energy Intelligence",
    description: "Dynovare turns subnational energy and governance data into intelligence for better decisions across Africa.",
    url: process.env.NEXT_PUBLIC_SITE_URL || "https://dynovare.com",
    siteName: "Dynovare Technologies",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Dynovare subnational energy intelligence" }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Dynovare Technologies",
    description: "Subnational energy governance intelligence for Africa.",
    images: ["/twitter-image"],
  },
  icons: {
    icon: [
      { url: "/logo/Dynovare_Favicon.png", sizes: "704x704", type: "image/png" },
    ],
    apple: [{ url: "/logo/Dynovare_Favicon.png", sizes: "704x704", type: "image/png" }],
    shortcut: ["/logo/Dynovare_Favicon.png"],
  },
};

// Everything else renders inside this layout so the same session/install setup follows the whole app.
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body
        className={[
          "h-full min-h-screen bg-white text-[var(--text-primary)]",
          "overflow-x-hidden",
        ].join(" ")}
      >
        <UserProvider>
          <PwaBootstrap />
          <div className="min-h-screen max-w-full overflow-x-clip">{children}</div>
          <Toaster position="top-right" />
        </UserProvider>
      </body>
    </html>
  );
}
