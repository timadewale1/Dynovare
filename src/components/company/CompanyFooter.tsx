import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import DynovareLogo from "@/components/branding/DynovareLogo";

interface CompanyFooterProps {
  /** Optional closing CTA rendered above the footer card, e.g. on the homepage.
   *  Omit all four and the footer renders exactly as it does everywhere else. */
  ctaEyebrow?: string;
  ctaTitle?: string;
  ctaText?: string;
  ctaButtonLabel?: string;
  ctaButtonHref?: string;
}

export default function CompanyFooter({ ctaEyebrow, ctaTitle, ctaText, ctaButtonLabel, ctaButtonHref }: CompanyFooterProps) {
  return (
    <footer className="company-footer">
      {ctaTitle ? (
        <div className="company-footer-cta">
          {ctaEyebrow ? <span className="company-footer-cta-eyebrow">{ctaEyebrow}</span> : null}
          <h2>{ctaTitle}</h2>
          {ctaText ? <p>{ctaText}</p> : null}
          {ctaButtonLabel && ctaButtonHref ? (
            <Link className="company-footer-cta-btn" href={ctaButtonHref}>{ctaButtonLabel} <ArrowRight size={16} /></Link>
          ) : null}
        </div>
      ) : null}
      <div className="company-footer-main">
        <div>
          <Link href="/" aria-label="Dynovare home"><DynovareLogo size={18} variant="white" /></Link>
          <p>Subnational energy intelligence for a transition decided locally.</p>
        </div>
        <div className="company-footer-links">
          <Link href="/index">The Index</Link><Link href="/services">Services</Link>
          <Link href="/about">About Dynovare</Link><Link href="/team">Our team</Link>
          <Link href="/contact">Contact</Link>
          <Link href="/ciegma">CIEGMA Policy <ArrowUpRight size={14} /></Link>
        </div>
      </div>
      <div className="company-footer-bottom"><span>© {new Date().getFullYear()} Dynovare Technologies</span><span>Starting in Nigeria. Built for Africa.</span></div>
    </footer>
  );
}