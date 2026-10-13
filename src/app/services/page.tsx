import Link from "next/link";
import { ArrowRight, BarChart3, Bolt, Building2, Database, Landmark, UsersRound } from "lucide-react";
import CompanyNavbar from "@/components/company/CompanyNavbar";
import CompanyFooter from "@/components/company/CompanyFooter";

const programs = [
  {
    id: "ciegma",
    title: "CIEGMA",
    eyebrow: "Central Intelligence for Energy Governance and Market Analytics",
    description: "A shared intelligence program for energy governance and market analytics, with dedicated products for investors, governments and civic-tech.",
    products: ["CIEGMA Investor · For investors", "CIEGMA Policy · For governments", "CIEGMA Civic · Civic-tech"],
    icon: Database,
    href: "/ciegma",
    action: "Explore CIEGMA Policy",
  },
  {
    id: "states-of-energy",
    title: "States of Energy",
    eyebrow: "Subnational Energy Governance Index",
    description: "The Subnational Energy Governance Index, making state-level energy governance easier to compare and understand.",
    products: ["Subnational Energy Governance Index"],
    icon: BarChart3,
    href: "/index",
    action: "Explore States of Energy",
  },
  {
    id: "energii-policy-lab",
    title: "Energii Policy Lab",
    eyebrow: "Energy policy research",
    description: "A policy lab focused on energy, research and practical insight.",
    products: ["Energy policy research"],
    icon: UsersRound,
    href: "/contact",
    action: "Connect with the Policy Lab",
  },
];

export default function ServicesPage() {
  return (
    <div className="dv dv-services-page">
      <CompanyNavbar />
      <main>
        <section className="dv-services-hero">
          <div className="dv-services-hero-copy"><span className="dv-pill dv-pill-dark">Dynovare products and programs</span><h1>Intelligence for energy governance, markets and policy.</h1><p>Explore CIEGMA, States of Energy and Energii Policy Lab: Dynovare’s connected products and programs for better energy decisions.</p><div className="dv-actions"><a className="dv-btn dv-btn-lime" href="#services">Explore our programs <ArrowRight size={16} /></a><Link className="dv-btn dv-btn-ghost" href="/contact">Talk to Dynovare</Link></div></div>
          <div className="dv-services-hero-art" aria-label="Dynovare's shared dataset connects its services">
            <div className="dv-services-orbit-ring dv-services-orbit-ring-one" />
            <div className="dv-services-orbit-ring dv-services-orbit-ring-two" />
            <div className="dv-services-orbit-core"><Database size={32} /><strong>Dynovare</strong><span>SUBNATIONAL<br />INTELLIGENCE</span></div>
            <div className="dv-services-orbit-node dv-services-orbit-one"><BarChart3 size={18} /><span>CIEGMA Investor</span></div>
            <div className="dv-services-orbit-node dv-services-orbit-two"><Bolt size={18} /><span>CIEGMA Policy</span></div>
            <div className="dv-services-orbit-node dv-services-orbit-three"><UsersRound size={18} /><span>CIEGMA Civic</span></div>
            <div className="dv-services-orbit-node dv-services-orbit-four"><Landmark size={18} /><span>States of Energy</span></div>
            <div className="dv-services-orbit-node dv-services-orbit-five"><Building2 size={18} /><span>Energii Policy Lab</span></div>
          </div>
        </section>

        <section className="dv-section dv-services-list" id="services">
          <div className="dv-services-section-head"><div><span className="dv-pill">Our products and programs</span><h2>One intelligence foundation. Three focused programs.</h2></div><p>Products designed to support investors, governments and civic technology, grounded in subnational energy governance.</p></div>
          <div className="dv-services-product-grid">
            {programs.map(({ id, title, eyebrow, description, products: items, icon: Icon, href, action }) => (
              <article className={id === "ciegma" ? "dv-services-product-feature" : undefined} id={id} key={id}>
                <div className="dv-services-product-top"><span>{eyebrow}</span><Icon size={21} /></div>
                <div className="dv-services-product-title"><h3>{title}</h3></div>
                <p>{description}</p>
                <div className="dv-services-product-features">{items.map((item) => <span key={item}>{item}</span>)}</div>
                <Link className="dv-btn dv-btn-lime" href={href}>{action} <ArrowRight size={16} /></Link>
              </article>
            ))}
          </div>
        </section>

      </main>
      <CompanyFooter ctaEyebrow="Start a conversation" ctaTitle="Better energy decisions begin with better local intelligence." ctaText="Whether you need CIEGMA, States of Energy or Energii Policy Lab, Dynovare helps make the landscape clearer." ctaButtonLabel="Talk to Dynovare" ctaButtonHref="/contact" />
    </div>
  );
}