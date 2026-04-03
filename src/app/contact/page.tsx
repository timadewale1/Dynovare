"use client";

import { useState } from "react";
import PublicNavbar from "@/components/public/PublicNavbar";
import PublicFooter from "@/components/public/PublicFooter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, MapPinned, MessageSquareText, PhoneCall } from "lucide-react";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#e6f2f7_0%,#f8fbfd_40%,#ffffff_100%)]">
      <PublicNavbar />

      <main className="mx-auto max-w-7xl px-4 py-10">
        <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <Card className="premium-card rounded-[2rem] p-7">
            <p className="text-xs uppercase tracking-[0.22em] text-[var(--text-secondary)]">Contact Dynovare</p>
            <h1 className="mt-3 text-3xl font-black text-blue-deep md:text-4xl">Talk to us about your policy workflow, team setup, or partnership idea.</h1>
            <p className="mt-4 text-[var(--text-secondary)]">
              Reach out if you want a walkthrough, a custom setup, implementation support, or a partnership conversation.
            </p>

            <div className="mt-8 space-y-4">
              {[
                { icon: <Mail size={18} />, title: "Email", body: "hello@dynovare.com" },
                { icon: <MapPinned size={18} />, title: "Focus", body: "Energy policy intelligence and private policy workflows for Nigeria." },
                { icon: <PhoneCall size={18} />, title: "Response", body: "We aim to respond to partnership and product enquiries quickly." },
              ].map((item) => (
                <div key={item.title} className="flex items-start gap-3 rounded-[1.5rem] border bg-white/70 p-4">
                  <div className="rounded-xl bg-[rgba(0,115,209,0.09)] p-2 text-[#0073d1]">{item.icon}</div>
                  <div>
                    <p className="font-bold text-blue-deep">{item.title}</p>
                    <p className="text-sm text-[var(--text-secondary)]">{item.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="premium-card rounded-[2rem] p-7">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-[rgba(0,115,209,0.09)] p-3 text-[#0073d1]">
                <MessageSquareText size={22} />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-[var(--text-secondary)]">Send a note</p>
                <h2 className="mt-1 text-xl font-black text-blue-deep">Start the conversation</h2>
              </div>
            </div>

            {submitted ? (
              <div className="mt-6 rounded-[1.5rem] border bg-[#edf8ff] p-5 text-sm text-blue-deep">
                Thanks for the message. Your note has been captured in the interface, but email delivery has not been connected yet.
              </div>
            ) : null}

            <form
              className="mt-6 space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                setSubmitted(true);
              }}
            >
              <input className="studio-input" placeholder="Your name" />
              <input className="studio-input" placeholder="Your email" type="email" />
              <input className="studio-input" placeholder="Organization or team" />
              <textarea className="studio-textarea min-h-[180px]" placeholder="Tell us what you want to discuss." />
              <Button type="submit" className="rounded-full bg-[#0073d1] hover:bg-[#003869]">Send enquiry</Button>
            </form>
          </Card>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
