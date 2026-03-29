// src/app/layout.tsx
import type { Metadata } from "next";
import { Manrope, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { UserProvider } from "@/components/providers/UserProvider";
import PwaBootstrap from "@/components/app/PwaBootstrap";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Dynovare",
  description: "AI policy intelligence for drafting, critique, simulation, and public energy policy analysis.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://dynovare.web.app"),
  applicationName: "Dynovare",
  manifest: "/manifest.webmanifest",
  openGraph: {
    title: "Dynovare",
    description: "AI policy intelligence for drafting, critique, simulation, and public energy policy analysis.",
    url: process.env.NEXT_PUBLIC_SITE_URL || "https://dynovare.vercel.app",
    siteName: "Dynovare",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Dynovare policy intelligence platform" }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Dynovare",
    description: "AI policy intelligence for drafting, critique, simulation, and public energy policy analysis.",
    images: ["/twitter-image"],
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icon-192.png", sizes: "192x192", type: "image/png" }],
    shortcut: ["/icon-192.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body
        className={[
          manrope.variable,
          spaceGrotesk.variable,
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
