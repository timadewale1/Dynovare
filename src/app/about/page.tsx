import Link from "next/link";
import { ArrowRight, Compass, Database, Globe2, ShieldCheck, Workflow } from "lucide-react";
import CompanyNavbar from "@/components/company/CompanyNavbar";
import CompanyFooter from "@/components/company/CompanyFooter";

const values = [
  { icon: Compass, title: "Localization", text: "Global energy frameworks only work when they account for the institutions and incentives that shape local decisions." },
  { icon: ShieldCheck, title: "Transparency", text: "Comparable information makes governance visible and gives people a common basis for action." },
  { icon: Workflow, title: "Institutional pull", text: "Better data helps governments see where reform can unlock investment, without Dynovare prescribing politics." },
  { icon: Database, title: "Defensibility", text: "A longitudinal, cross-verified subnational dataset becomes more useful with every cycle." },
];

export default function AboutPage() {
  return (
    <div className="dv dv-about-page">
      <CompanyNavbar />
      <main>
        <section className="dv-about-hero">
          <img src="/hero-image.png" alt="Electricity distribution lines crossing a city at dusk" />
          <div className="dv-about-hero-shade" />
          <div className="dv-about-hero-copy"><span className="dv-pill dv-pill-dark">About Dynovare Technologies</span><h1>We make local energy markets easier to understand, compare and act on.</h1><p>Dynovare is a Pan-African energy intelligence firm turning subnational governance and risk data into decisions investors, governments and institutions can use.</p></div>
          <div className="dv-about-hero-note"><Globe2 size={19} /><span>Local signals.<br />Grounded in place.</span></div>
        </section>

        <section className="dv-section dv-about-why">
          <div><span className="dv-pill">Why we exist</span><h2>Africa’s transition is planned nationally, but decided locally.</h2></div>
          <div className="dv-about-why-copy"><p>At state and provincial level, policymakers often work with outdated data. Investors have limited visibility into regional risk. International models are rarely calibrated to the governance realities that determine whether energy projects move.</p><p>Dynovare closes that gap by building a proprietary subnational dataset and creating products that make the intelligence useful: the Subnational Energy Governance Index and a policy analytics platform for governments and investors.</p><div className="dv-about-signal"><strong>36</strong><span>states.<br />Distinct realities.</span></div></div>
        </section>

        <section className="dv-about-name">
          <div><span className="dv-pill">Our name</span><h2><span>Dyna</span><b>+</b><span>Novare</span></h2></div>
          <p><strong>Dynamic, evolving</strong> + <strong>to renew, to innovate.</strong><br />We localize proven energy models for the realities of African states and provinces.</p>
        </section>

        <section className="dv-about-belief"><div className="dv-about-belief-inner"><span className="dv-pill dv-pill-dark">What we believe</span><blockquote>“The energy transition in Africa will not be won in boardrooms or at international summits alone. It will be won in state capitals, provincial assemblies, and local utility offices.”</blockquote><p>Kolade Kolawole <span>Managing Director, Dynovare Technologies</span></p></div><span className="dv-about-belief-mark" aria-hidden="true">“</span></section>

        <section className="dv-section dv-about-values"><div className="dv-about-values-head"><span className="dv-pill">How we work</span><h2>Principles built into the work.</h2></div><div className="dv-about-value-grid">{values.map(({ icon: Icon, title, text }, index) => <article key={title}><div><span>0{index + 1}</span><Icon size={21} /></div><h3>{title}</h3><p>{text}</p></article>)}</div></section>

        <section className="dv-about-facts"><div><span>Sector</span><strong>Energy intelligence & risk analytics</strong></div><div><span>Geography</span><strong>Pan-African, subnational focus</strong></div></section>

        <section className="dv-section dv-about-cta"><div><span className="dv-pill">Work with us</span><h2>Put better local intelligence to work.</h2></div><Link className="dv-btn dv-btn-dark" href="/contact">Start a conversation <ArrowRight size={16} /></Link></section>
      </main>
      <CompanyFooter />
    </div>
  );
}