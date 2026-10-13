import Link from "next/link";
import { ArrowRight, BarChart3, Building2, Check, Database, Globe2, Landmark, ShieldCheck, UsersRound, Zap } from "lucide-react";
import CompanyNavbar from "@/components/company/CompanyNavbar";
import CompanyFooter from "@/components/company/CompanyFooter";

const dimensions = [
  { icon: Landmark, number: "01", name: "Fiscal autonomy", description: "IGR relative to federal allocation, budget execution and fiscal discipline." },
  { icon: ShieldCheck, number: "02", name: "Regulatory clarity", description: "State electricity law, regulator functionality and licensing efficiency." },
  { icon: Building2, number: "03", name: "Institutional capacity", description: "Agency staffing, technical expertise and procurement capability." },
  { icon: Zap, number: "04", name: "Energy access", description: "Electrification, grid reliability and mini-grid penetration." },
  { icon: BarChart3, number: "05", name: "Investment climate", description: "Ease of doing business, PPP track record and investor experience." },
  { icon: UsersRound, number: "06", name: "Citizen feedback", description: "Outage reports, tariff concerns and infrastructure satisfaction." },
];

const sources = [
  { icon: Landmark, label: "Government records" },
  { icon: BarChart3, label: "National statistics" },
  { icon: Globe2, label: "DFI / multilateral publications" },
  { icon: UsersRound, label: "Citizen reports" },
];
const outputs = ["Investment intelligence", "Policy analytics", "Civic intelligence", "Governance index"];

export default function IndexPage() {
  return (
    <div className="dv dv-index-page">
      <CompanyNavbar />
      <main>
        <section className="dv-index-hero">
          <div className="dv-index-hero-copy">
            <span className="dv-pill dv-pill-dark">The subnational energy governance index</span>
            <h1>A clearer view of how states are positioned for the energy transition.</h1>
            <p>Dynovare’s flagship index makes governance capacity across Nigeria’s states visible, comparable and useful for decisions.</p>
            <div className="dv-actions">
              <a className="dv-btn dv-btn-lime" href="#method">Explore the methodology <ArrowRight size={16} /></a>
              <Link className="dv-btn dv-btn-ghost" href="/contact">Request Index access</Link>
            </div>
          </div>
          <div className="dv-index-hero-visual">
            <div className="dv-index-image-wrap">
              <img src="/index.png" alt="Dynovare Index dashboard overview" />
            </div>
            <div className="dv-index-hero-stat"><strong>36</strong><span>states<br />one index</span></div>
            <div className="dv-index-hero-map"><img src="/nigeria-states-base.svg" alt="Map of Nigeria's 36 states" /></div>
          </div>
        </section>

        <section className="dv-section dv-index-intro">
          <div><span className="dv-pill">A shared reference point</span><h2>Transparency can change the incentives around reform.</h2></div>
          <div className="dv-index-intro-copy">
            <p>When governance quality is easier to compare, investors can replace informal assurances with evidence, institutions can identify where they need to improve, and citizens can work from a common picture of energy delivery.</p>
            <p className="dv-strong">The Index turns scattered signals into a language for better decisions.</p>
          </div>
        </section>

        <section className="dv-index-dimensions" id="method">
          <div className="dv-index-dimensions-head">
            <div><span className="dv-pill dv-pill-dark">What goes into the Index</span><h2>Six dimensions.<br />One subnational picture.</h2></div>
            <p>The Index combines fiscal, regulatory, institutional, access, investment and citizen signals to build a grounded view of state-level energy governance.</p>
          </div>
          <div className="dv-index-dimension-grid">
            {dimensions.map(({ icon: Icon, number, name, description }) => (
              <article key={name}>
                <div className="dv-index-dimension-top"><span>{number}</span><Icon size={20} /></div>
                <h3>{name}</h3>
                <p>{description}</p>
                <Check className="dv-index-check" size={18} />
              </article>
            ))}
          </div>
        </section>

        <section className="dv-section dv-index-flow-section">
          <div className="dv-index-flow-copy"><span className="dv-pill">How the data flows</span><h2>Raw signals in.<br />Verified intelligence out.</h2><p>Records from government, national statistics, multilateral publications and citizen reports move through validation, cross-referencing and deduplication before entering the shared data pipeline.</p></div>
          <div className="dv-index-flow">
            <div className="dv-pipe-sources">
              {sources.map(({ icon: Icon, label }) => <div key={label}><Icon size={19} /><span>{label}</span></div>)}
            </div>
            <div className="dv-pipe-arrow" aria-hidden="true">↓</div>
            <div className="dv-pipe-validate">Validation · Cross-referencing · Deduplication</div>
            <div className="dv-pipe-arrow" aria-hidden="true">↓</div>
            <div className="dv-pipe-core"><Database size={20} />Dynovare Subnational Intelligence Dataset</div>
            <div className="dv-pipe-arrow" aria-hidden="true">↓</div>
            <div className="dv-pipe-outputs">{outputs.map((output) => <div key={output}>{output}</div>)}</div>
          </div>
        </section>

        <section className="dv-section dv-index-state">
          <div className="dv-index-state-map"><img src="/nigeria-states-base.svg" alt="Nigeria's 36 states" /><span>Starting in Nigeria</span></div>
          <div><span className="dv-pill">Built to grow</span><h2>One model for every state. A foundation for Africa.</h2><p>Nigeria’s 36 states are the first expression of a wider idea: subnational intelligence should make local realities visible wherever energy markets are changing.</p><Link className="dv-btn dv-btn-dark" href="/contact">Talk to Dynovare <ArrowRight size={16} /></Link></div>
        </section>
      </main>
      <CompanyFooter ctaEyebrow="Access the Index" ctaTitle="Better energy decisions begin with better local intelligence." ctaText="Talk to our team about licensing, research access and how the Index can support your work." ctaButtonLabel="Request Index access" ctaButtonHref="/contact" />
    </div>
  );
}