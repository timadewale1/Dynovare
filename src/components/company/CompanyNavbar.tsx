"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowUpRight, Menu, X } from "lucide-react";
import DynovareLogo from "@/components/branding/DynovareLogo";

const links = [
  { href: "/index", label: "The Index" },
  { href: "/services", label: "What we do" },
  { href: "/team", label: "People" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export default function CompanyNavbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="company-nav">
      <div className="company-nav-inner">
        <Link href="/" aria-label="Dynovare home" className="company-brand"><DynovareLogo size={18} /></Link>
        <nav aria-label="Main navigation" className="company-nav-links">
          {links.map((link) => <Link href={link.href} key={link.href}>{link.label}</Link>)}
        </nav>
        <Link className="company-nav-cta" href="/contact">Request access <ArrowUpRight size={15} /></Link>
        <button className="company-menu-toggle" type="button" onClick={() => setOpen((value) => !value)} aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open}>
          {open ? <X size={19} /> : <Menu size={19} />}
        </button>
      </div>
      {open ? <nav aria-label="Mobile navigation" className="company-mobile-nav">
        {links.map((link) => <Link href={link.href} key={link.href} onClick={() => setOpen(false)}>{link.label}</Link>)}
        <Link href="/contact" onClick={() => setOpen(false)}>Request access <ArrowUpRight size={15} /></Link>
      </nav> : null}
    </header>
  );
}