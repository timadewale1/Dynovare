"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import DynovareLogo from "@/components/branding/DynovareLogo";
import PwaInstallButton from "@/components/branding/PwaInstallButton";
import { Menu, X } from "lucide-react";
import { useUser } from "@/components/providers/UserProvider";

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

  return (
    <header
      className={`sticky top-0 z-50 w-full max-w-full overflow-x-clip border-b backdrop-blur-2xl ${
        isHome
          ? "border-white/10 bg-[rgba(10,15,26,0.82)]"
          : "border-white/50 bg-[rgba(248,251,254,0.9)]"
      }`}
    >
      <div className="mx-auto max-w-7xl overflow-x-clip px-5 md:px-8 lg:px-10">
        <div className="flex h-[4.5rem] items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3">
            <DynovareLogo size={30} variant={isHome ? "white" : "default"} />
          </Link>

          <nav className="hidden items-center gap-2 md:flex">
            {NAV_LINKS.map((link) => (
              <Link
                key={`${link.label}-${link.href}`}
                href={link.href === "/public/policies" ? repoHref : link.href}
                className={`rounded-full px-3 py-2 text-[13px] font-semibold transition ${
                  isHome
                    ? "text-white/72 hover:bg-white/8 hover:text-white"
                    : "text-blue-deep hover:bg-[rgba(0,115,209,0.08)] hover:text-[#0073d1]"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            <PwaInstallButton className="rounded-full" />
            <Link href="/login">
              <Button
                variant="outline"
                className={`rounded-full text-[13px] ${
                  isHome ? "border-white/16 bg-transparent text-white hover:bg-white/10" : ""
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
              isHome
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
                    isHome
                      ? "text-white/78 hover:bg-white/8"
                      : "text-blue-deep hover:bg-[rgba(0,115,209,0.08)]"
                  }`}
                >
                  {link.label}
                </Link>
              ))}

              <div className="grid grid-cols-2 gap-2 pt-2">
                <PwaInstallButton className="col-span-2 w-full rounded-full" />
                <Link href="/login">
                  <Button variant="outline" className={`w-full rounded-full ${isHome ? "border-white/16 bg-transparent text-white hover:bg-white/10" : ""}`}>Login</Button>
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
