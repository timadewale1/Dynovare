"use client";

import { useState } from "react";
import { Mail, MapPinned, Send } from "lucide-react";
import CompanyNavbar from "@/components/company/CompanyNavbar";
import CompanyFooter from "@/components/company/CompanyFooter";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  return (
    <div className="dv dv-contact-page">
      <CompanyNavbar />
      <main>
        <header className="dv-contact-hero">
          <div><span className="dv-pill">Contact Dynovare</span><h1>Good decisions start with a clearer conversation.</h1><p>Whether you’re evaluating a subnational deal, exploring reform, or looking for research data, tell us what you’re working on.</p></div>
          <div className="dv-contact-details"><a href="mailto:hello@dynovare.com"><Mail size={18} /><span>hello@dynovare.com</span></a><div><MapPinned size={18} /><span>Nigeria · Pan-African focus</span></div></div>
        </header>

        <section className="dv-section dv-contact-layout">
          <div className="dv-contact-context"><span className="dv-pill">Get in touch</span><h2>What brings you here?</h2><p>Share a few details and the right person on our team will follow up.</p>
            <div className="dv-contact-audiences"><article><strong>Investors & DFIs</strong><span>CIEGMA Investor and States of Energy insights.</span></article><article><strong>Governments</strong><span>CIEGMA Policy analytics for government teams.</span></article><article><strong>Media & academia</strong><span>CIEGMA Civic and States of Energy research access.</span></article></div>
          </div>
          <form className="dv-contact-form" onSubmit={(event) => { event.preventDefault(); setSubmitted(true); }}>
            {submitted ? <div className="dv-contact-success" role="status"><strong>Thank you for reaching out.</strong><span>Your message has been captured. Email delivery will be connected soon.</span></div> : null}
            <div className="dv-contact-field-grid"><label>Name<input name="name" required placeholder="Your name" /></label><label>Organization<input name="organization" placeholder="Organization or institution" /></label><label>Email<input name="email" type="email" required placeholder="you@organization.com" /></label><label>I am a…<select name="audience" defaultValue=""><option value="" disabled>Select an audience</option><option>Investor / DFI</option><option>Government</option><option>Citizen / NGO</option><option>Media / Academia</option><option>Other</option></select></label></div>
            <label className="dv-contact-message">Message<textarea name="message" required rows={5} placeholder="Tell us what you would like to discuss." /></label>
            <button className="dv-btn dv-btn-dark" type="submit">Send enquiry <Send size={15} /></button>
          </form>
        </section>
      </main>
      <CompanyFooter />
    </div>
  );
}