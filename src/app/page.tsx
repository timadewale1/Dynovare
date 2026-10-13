import Link from "next/link";
import { ArrowDownRight, ArrowRight, ArrowUpRight, BarChart3, Bolt, Building2, Database, Globe2, Landmark, ShieldCheck, UsersRound, Zap } from "lucide-react";
import CompanyNavbar from "@/components/company/CompanyNavbar";
import CompanyFooter from "@/components/company/CompanyFooter";

/* Every photo below was looked up and verified on unsplash.com (not guessed from
   memory), chosen to match both the section it illustrates and Dynovare's African
   context, and is used exactly once. */
const img = {
  hero: "https://images.unsplash.com/photo-1634148677018-5b6593666884?auto=format&fit=crop&w=2000&q=80", // high-voltage power line at sunset
  ctxA: "https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?auto=format&fit=crop&w=700&q=80", // solar panel field
  ctxB: "https://images.unsplash.com/photo-1714330477134-4275bc2cff3a?auto=format&fit=crop&w=700&q=80", // wind turbines at sunset
  ctxC: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=700&q=80", // civil engineer on site, Nigeria
  offerPolicy: "https://images.unsplash.com/photo-1573167101669-476636b96cea?auto=format&fit=crop&w=800&q=80", // woman in a boardroom meeting
  offerInvestor: "https://images.unsplash.com/photo-1618828665347-d870c38c95c7?auto=format&fit=crop&w=800&q=80", // Lagos, Nigeria skyline
  offerCivic: "https://images.unsplash.com/photo-1673280402260-82b9363b6f5b?auto=format&fit=crop&w=800&q=80", // community outreach, Lagos, Nigeria
  offerData: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80", // analytics graphs on a laptop
  offerCapacity: "https://images.unsplash.com/photo-1573496129783-779a090a72f2?auto=format&fit=crop&w=800&q=80", // colleagues at a training table
  stats: "https://images.unsplash.com/photo-1642285709726-f9eb035b034b?auto=format&fit=crop&w=2000&q=80", // industrial plant lit up at night
  partner: "https://images.unsplash.com/photo-1521790797524-b2497295b8a0?auto=format&fit=crop&w=800&q=80", // handshake, Nairobi, Kenya
  why: "https://images.unsplash.com/photo-1573164574397-dd250bc8a598?auto=format&fit=crop&w=1200&q=80", // colleagues reviewing work together
  cta: "https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?auto=format&fit=crop&w=2000&q=80", // Earth with the African continent visible
};

const dims = [
  { icon: Landmark, title: "Fiscal autonomy", text: "How much states control their own revenue and spending." },
  { icon: ShieldCheck, title: "Regulatory clarity", text: "How clear, stable and enforceable the rules are." },
  { icon: Building2, title: "Institutional capacity", text: "Whether agencies can plan, procure and deliver." },
  { icon: Zap, title: "Energy access", text: "Who is connected, and how reliably." },
  { icon: BarChart3, title: "Investment climate", text: "How ready a state is for private and DFI capital." },
  { icon: UsersRound, title: "Citizen feedback", text: "How communities are heard and how issues get resolved." },
];
const tags = ["Fiscal autonomy", "Regulatory clarity", "Institutional capacity", "Energy access", "Investment climate", "Citizen feedback", "Policy & reform history", "DFI eligibility"];

const offers = [
  { tag: "For investors · CIEGMA", title: "CIEGMA Investor", text: "Investor intelligence for subnational energy markets.", src: img.offerInvestor, href: "/services#ciegma" },
  { tag: "For governments · CIEGMA", title: "CIEGMA Policy", text: "Policy analytics for government teams.", src: img.offerPolicy, href: "/ciegma" },
  { tag: "Civic-tech · CIEGMA", title: "CIEGMA Civic", text: "Civic technology for energy governance.", src: img.offerCivic, href: "/services#ciegma" },
  { tag: "Subnational Energy Governance Index", title: "States of Energy", text: "The Subnational Energy Governance Index.", src: img.offerData, href: "/index" },
  { tag: "Policy research", title: "Energii Policy Lab", text: "A policy lab focused on energy.", src: img.offerCapacity, href: "/services#energii-policy-lab" },
];

const audiences = [
  { icon: Building2, title: "Investors & DFIs", text: "Make defensible decisions about subnational opportunities." },
  { icon: Landmark, title: "Governments", text: "Identify, prioritize and implement evidence-based reforms." },
  { icon: UsersRound, title: "Citizens & NGOs", text: "Understand energy delivery and hold institutions accountable." },
  { icon: Globe2, title: "Media & academia", text: "Access authoritative, comparable governance intelligence." },
];
const pillars = [
  ["Transparency", "Make governance quality visible and comparable."],
  ["De-risking", "Replace fragmented information with evidence."],
  ["Reform", "Help institutions identify what unlocks investment."],
  ["Defensibility", "A longitudinal, verified dataset built over time."],
];
const sources = [
  { icon: Landmark, label: "Government records" },
  { icon: BarChart3, label: "National statistics" },
  { icon: Globe2, label: "DFI / multilateral publications" },
  { icon: UsersRound, label: "Citizen reports" },
];
const outputs = ["Investment intelligence", "Policy analytics", "Civic intelligence", "Governance index"];

export default function CompanyHomePage() {
  return (
    <div className="dv">
      <CompanyNavbar />
      <main>
        {/* HERO */}
        <section className="dv-hero">
          <img className="dv-hero-bg" src={img.hero} alt="High-voltage power line at sunset" />
          <div className="dv-hero-shade" />
          <aside className="dv-hero-card">
            <img src="/nigeria-states-base.svg" alt="Map of Nigeria's 36 states" />
            <div><strong>36 states</strong><span>One intelligence layer</span></div>
            <Link href="/index" className="dv-circle" aria-label="Explore the Index"><ArrowUpRight size={18} /></Link>
          </aside>
          <div className="dv-hero-copy">
            <h1>Nigeria’s energy transition is local. <span>The intelligence should be too.</span></h1>
            <div className="dv-hero-foot">
              <p>Dynovare turns subnational energy and governance data into intelligence that helps investors, governments and institutions make better decisions across Africa.</p>
              <div className="dv-actions">
                <Link className="dv-btn dv-btn-lime" href="/index">Explore the Index <ArrowRight size={16} /></Link>
                <Link className="dv-btn dv-btn-ghost" href="/contact">Talk to Dynovare</Link>
              </div>
            </div>
          </div>
        </section>

        {/* MISSION — three perfect circles */}
        <section className="dv-section dv-mission" id="context">
          <div>
            <span className="dv-pill">The context</span>
            <h2>Africa’s energy transition is planned nationally, but implemented locally.</h2>
          </div>
          <div className="dv-mission-body">
            <p>Across Africa, energy decisions are made at state and provincial level, where policymakers often work with outdated information, investors have limited visibility into regional risk, and national models miss local governance realities.</p>
            <p className="dv-strong">Dynovare closes that intelligence gap.</p>
            <Link className="dv-btn dv-btn-dark" href="/about">Meet Dynovare <ArrowRight size={16} /></Link>
          </div>
          <div className="dv-trio">
            <img className="dv-trio-photo" src={img.ctxA} alt="Solar panel field" />
            <img className="dv-trio-photo dv-trio-photo-lg" src={img.ctxB} alt="Wind turbines at sunset" />
            <img className="dv-trio-photo" src={img.ctxC} alt="Civil engineer on site in Nigeria" />
          </div>
        </section>

        {/* GIANT TYPE */}
        <section className="dv-giant" aria-label="Data to decisions">
          <p>Data to Decisions.</p>
        </section>

        {/* PRODUCTS — CIEGMA programs, States of Energy, and Energii Policy Lab */}
        <section className="dv-section">
          <div className="dv-head">
            <div><span className="dv-pill">What Dynovare offers</span><h2>Making subnational energy markets legible.</h2></div>
            <Link className="dv-btn dv-btn-dark" href="/services">Explore what we do <ArrowRight size={16} /></Link>
          </div>
          <div className="dv-offers">
            {offers.map((o) => (
              <Link key={o.title} href={o.href} className="dv-offer">
                <img src={o.src} alt="" />
                <span className="dv-offer-tag">{o.tag}</span>
                <div className="dv-offer-body">
                  <h3>{o.title}</h3>
                  <span className="dv-circle dv-circle-sm"><ArrowUpRight size={14} /></span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* STATS */}
        <section className="dv-stats">
          <img src={img.stats} alt="" />
          <div className="dv-stats-shade" />
          <div className="dv-stats-grid">
            <div><strong>36</strong><span>States, 36 distinct regulatory realities</span></div>
            <div><strong>6</strong><span>Core governance dimensions benchmarked</span></div>
            <div><strong>1</strong><span>Verified, comparable subnational dataset</span></div>
          </div>
          <p className="dv-stats-note">The grid is local. So is the risk.</p>
        </section>

        {/* MARQUEE */}
        <div className="dv-marquee" aria-hidden="true">
          <div className="dv-marquee-track">
            {[...tags, ...tags].map((t, i) => <span key={i}><Bolt size={13} />{t}</span>)}
          </div>
        </div>

        {/* PARTNER / SIX DIMENSIONS */}
        <section className="dv-section dv-partner">
          <div className="dv-center-head">
            <span className="dv-pill">The Index</span>
            <h2>Six dimensions. One clear picture of every state.</h2>
          </div>
          <div className="dv-partner-grid">
            <div className="dv-partner-col">
              {dims.slice(0, 3).map(({ icon: Icon, title, text }) => (
                <article key={title}><span className="dv-icon"><Icon size={18} /></span><h3>{title}</h3><p>{text}</p></article>
              ))}
            </div>
            <img className="dv-partner-img" src="/index.png" alt="Dynovare Index overview" />
            <div className="dv-partner-col">
              {dims.slice(3).map(({ icon: Icon, title, text }) => (
                <article key={title}><span className="dv-icon"><Icon size={18} /></span><h3>{title}</h3><p>{text}</p></article>
              ))}
            </div>
          </div>
          <div className="dv-center-cta"><Link className="dv-btn dv-btn-dark" href="/index">Explore the Index <ArrowRight size={16} /></Link></div>
        </section>

        {/* DATA ENGINE — plain vertical pipeline, each row self-contained */}
        <section className="dv-pipeline">
          <div className="dv-pipe-inner">
            <div className="dv-head">
              <div><span className="dv-pill dv-pill-dark">The data engine</span><h2>From multiple sources to actionable intelligence.</h2></div>
              <p>We aggregate, validate and cross-reference data from across the public and private sector to build a single, trusted subnational dataset.</p>
            </div>
            <div className="dv-pipe-sources">
              {sources.map(({ icon: Icon, label }) => (
                <div key={label}><Icon size={20} /><span>{label}</span></div>
              ))}
            </div>
            <div className="dv-pipe-arrow" aria-hidden="true">↓</div>
            <div className="dv-pipe-validate">Validation · Cross-referencing · Deduplication</div>
            <div className="dv-pipe-arrow" aria-hidden="true">↓</div>
            <div className="dv-pipe-core"><Database size={20} />Dynovare Subnational Intelligence Dataset</div>
            <div className="dv-pipe-arrow" aria-hidden="true">↓</div>
            <div className="dv-pipe-outputs">
              {outputs.map((o) => <div key={o}>{o}</div>)}
            </div>
          </div>
        </section>

        {/* SERVICES & CAPABILITIES — full list, row style */}
        <section className="dv-section dv-rows">
          <div className="dv-rows-intro">
            <span className="dv-pill">Services & capabilities</span>
            <h2>From intelligence to action.</h2>
            <p>One shared data foundation supports multiple ways of working with investors, governments and communities.</p>
          </div>
          <div className="dv-row-list">
            {offers.map((s) => (
              <Link key={s.title} href={s.href} className="dv-row">
                <span className="dv-row-title">{s.title}</span>
                <span className="dv-row-note">{s.text}</span>
                <span className="dv-circle dv-circle-sm"><ArrowUpRight size={14} /></span>
              </Link>
            ))}
          </div>
        </section>

        {/* AUDIENCES */}
        <section className="dv-section">
          <div className="dv-head">
            <div><span className="dv-pill">Who we work with</span><h2>Built for decisions that move capital, policy and infrastructure.</h2></div>
          </div>
          <div className="dv-aud">
            {audiences.map(({ icon: Icon, title, text }) => (
              <article key={title}><Icon size={22} /><h3>{title}</h3><p>{text}</p></article>
            ))}
          </div>
        </section>

        {/* WHY */}
        <section className="dv-section dv-why">
          <img src={img.why} alt="Colleagues reviewing work together" />
          <div>
            <span className="dv-pill">Why Dynovare</span>
            <h2>Why subnational intelligence matters.</h2>
            <div className="dv-pillars">
              {pillars.map(([t, p]) => <article key={t}><strong>{t}</strong><p>{p}</p></article>)}
            </div>
          </div>
        </section>

        {/* AFRICA */}
        <section className="dv-section dv-africa-wrap">
          <div className="dv-africa">
            <div>
              <span className="dv-pill dv-pill-dark">Pan-African direction</span>
              <h2>Starting in Nigeria. Built for Africa.</h2>
              <p>Nigeria’s 36 states are our foundation and our model for bringing subnational intelligence to energy markets across the continent.</p>
            </div>
            <div className="dv-africa-map"><img src="/nigeria-states-base.svg" alt="Nigeria as the starting point" /><span>Nigeria (36 states)</span></div>
            <strong>Same model.<br />More countries.<br />Greater impact.</strong>
          </div>
        </section>
      </main>

      {/* The closing "Better energy decisions..." panel now lives inside the
          footer itself (see CompanyFooter's ctaTitle/ctaText/ctaButton props),
          so the photo, the giant wordmark and the glass card are one
          continuous piece — the same layout the reference site uses. */}
      <CompanyFooter
        ctaEyebrow="Start a conversation"
        ctaTitle="Better energy decisions begin with better local intelligence."
        ctaText="Whether you’re evaluating an investment, designing a reform, researching an energy market, or looking for reliable subnational data, Dynovare helps make the landscape clearer."
        ctaButtonLabel="Talk to Dynovare"
        ctaButtonHref="/contact"
      />
    </div>
  );
}