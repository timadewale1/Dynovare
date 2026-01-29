// src/app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { UserProvider } from "@/components/providers/UserProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Dynovare",
  description: "Policy Intelligence Platform",
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
          geistSans.variable,
          geistMono.variable,
          "h-full min-h-screen bg-white text-[var(--text-primary)]",
          "overflow-x-hidden",
        ].join(" ")}
      >
        <UserProvider>
          <div className="min-h-screen">{children}</div>
          <Toaster position="top-right" />
        </UserProvider>
      </body>
    </html>
  );
}
