"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import DynovareLogo from "@/components/branding/DynovareLogo";
import PwaInstallButton from "@/components/branding/PwaInstallButton";
import { Menu, X } from "lucide-react";
import { useUser } from "@/components/providers/UserProvider";
import { usePublicTheme } from "@/components/public/usePublicTheme";
import PublicThemeToggle from "@/components/public/PublicThemeToggle";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/public/policies", label: "Policy Repository" },
  { href: "/rankings", label: "Rankings" },
  { href: "/#modeling", label: "Scenario Modeling" },
  { href: "/about", label: "About" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
];

export default function PublicNavbar() {
  const { user } = useUser();
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const repoHref = user ? "/repository" : "/public/policies";
  const isHome = pathname === "/";
  const { theme, mounted } = usePublicTheme();
  const dark = !mounted || theme === "dark";

  return (
    <header
      className={`sticky top-0 z-50 w-full max-w-full overflow-x-clip border-b backdrop-blur-2xl ${
        dark
          ? "border-white/10 bg-[rgba(10,15,26,0.84)]"
          : "border-[#d8e6ec] bg-[rgba(248,251,254,0.92)]"
      }`}
    >
      <div className="mx-auto max-w-7xl overflow-x-clip px-6 md:px-10 lg:px-14">
        <div className="flex h-[4.5rem] items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3">
            <DynovareLogo size={30} variant={dark ? "white" : "default"} />
          </Link>

          <nav className="hidden items-center gap-2 md:flex">
            {NAV_LINKS.map((link) => (
              <Link
                key={`${link.label}-${link.href}`}
                href={link.href === "/public/policies" ? repoHref : link.href}
                className={`rounded-full px-3 py-2 text-[13px] font-semibold transition ${
                  dark
                    ? "text-white/72 hover:bg-white/8 hover:text-white"
                    : "text-blue-deep hover:bg-[rgba(0,115,209,0.08)] hover:text-[#0073d1]"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            <PublicThemeToggle />
            <PwaInstallButton
              variant="outline"
              className={`rounded-full text-[13px] ${
                dark
                  ? "border-white/14 bg-transparent text-white hover:bg-white/10 hover:text-white"
                  : "border-[#cfe0ef] bg-white/88 text-[#003869] hover:bg-[#eef6ff]"
              }`}
            />
            <Link href="/login">
              <Button
                variant="outline"
                className={`rounded-full text-[13px] ${
                  dark ? "border-white/16 bg-transparent text-white hover:bg-white/10" : ""
                }`}
              >
                Login
              </Button>
            </Link>
            <Link href="/register">
              <Button className="rounded-full bg-[#0073d1] text-[13px] shadow-[0_16px_32px_rgba(0,115,209,0.24)] hover:bg-[#003869]">Create account</Button>
            </Link>
          </div>

          <button
            type="button"
            className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border transition md:hidden ${
              dark
                ? "border-white/12 text-white hover:bg-white/10"
                : "border-white/50 hover:bg-[rgba(0,115,209,0.08)]"
            }`}
            onClick={() => setOpen((value) => !value)}
            aria-label="Open menu"
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        {open ? (
          <div className="pb-5 md:hidden">
            <div className="grid gap-2">
              {NAV_LINKS.map((link) => (
                <Link
                  key={`${link.label}-${link.href}`}
                  href={link.href === "/public/policies" ? repoHref : link.href}
                    onClick={() => setOpen(false)}
                    className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                    dark
                      ? "text-white/78 hover:bg-white/8"
                      : "text-blue-deep hover:bg-[rgba(0,115,209,0.08)]"
                  }`}
                >
                  {link.label}
                </Link>
              ))}

              <div className="grid grid-cols-2 gap-2 pt-2">
                <PublicThemeToggle compact />
                <PwaInstallButton
                  variant="outline"
                  className={`col-span-2 w-full rounded-full ${
                    dark
                      ? "border-white/14 bg-transparent text-white hover:bg-white/10 hover:text-white"
                      : "border-[#cfe0ef] bg-white/88 text-[#003869] hover:bg-[#eef6ff]"
                  }`}
                />
                <Link href="/login">
                  <Button variant="outline" className={`w-full rounded-full ${dark ? "border-white/16 bg-transparent text-white hover:bg-white/10" : ""}`}>Login</Button>
                </Link>
                <Link href="/register">
                  <Button className="w-full rounded-full bg-[#0073d1] hover:bg-[#003869]">Create account</Button>
                </Link>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </header>
  );
}
