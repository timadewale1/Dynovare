import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import CompanyNavbar from "@/components/company/CompanyNavbar";
import CompanyFooter from "@/components/company/CompanyFooter";

const team = [
  { image: "/team/kolade.png", name: "Kolade Kolawole", role: "Managing Director · Policy & Partnerships", tone: "green" },
  { image: "/team/abel.png", name: "Abel Gaiya", role: "Research & Data Lead", tone: "blue" },
  { image: "/team/timi.png", name: "Timilehin Adewale", role: "Technology Lead", tone: "amber" },
  { image: "/team/nana.png", name: "Nana Ahmed", role: "Communications Lead", tone: "coral" },
];

export default function TeamPage() {
  return (
    <div className="dv dv-team-page">
      <CompanyNavbar />
      <main>
        <section className="dv-team-hero">
          <div className="dv-team-hero-copy">
            <span className="dv-pill">The people behind Dynovare</span>
            <h1>Good intelligence starts with <span>people who care about the details.</span></h1>
          </div>
          <div className="dv-team-hero-aside">
            <p>We bring energy systems and local governance into the same conversation, then build the data infrastructure to keep it grounded.</p>
            <div className="dv-team-disciplines"><span>Policy</span><span>Research</span><span>Technology</span><span>Communications</span></div>
          </div>
        </section>

        <section className="dv-section dv-team-people">
          <div className="dv-team-section-head"><div><span className="dv-pill">Meet the team</span><h2>Different disciplines.<br />One shared purpose.</h2></div><p>A focused team building practical, locally grounded intelligence for Africa’s energy transition.</p></div>
          <div className="dv-team-grid">
            {team.map(({ image, name, role, tone }) => (
              <article className={`dv-team-card dv-team-${tone}`} key={name}>
                <div className="dv-team-portrait">
                  <Image src={image} alt={`${name}`} width={168} height={168} />
                </div>
                <div className="dv-team-card-copy"><p>{role}</p><h3>{name}</h3></div>
                <span className="dv-team-card-mark" aria-hidden="true" />
              </article>
            ))}
          </div>
        </section>

        <section className="dv-section dv-team-approach">
          <div><span className="dv-pill">How we work</span><h2>Close to the context.<br />Accountable to the evidence.</h2></div>
          <div><p>Our work starts with local institutions and the people who understand them. We pair direct research with open records and systematic verification so that the intelligence we publish can be examined, challenged and improved.</p><Link className="dv-btn dv-btn-dark" href="/about">More about Dynovare <ArrowRight size={16} /></Link></div>
        </section>
      </main>
      <CompanyFooter ctaEyebrow="Work with us" ctaTitle="Local knowledge makes better decisions possible." ctaText="Get in touch to learn more about the people and research behind Dynovare’s subnational intelligence." ctaButtonLabel="Contact Dynovare" ctaButtonHref="/contact" />
    </div>
  );
}