"use client";

import { useState } from "react";
import PublicNavbar from "@/components/public/PublicNavbar";
import PublicFooter from "@/components/public/PublicFooter";
import { Button } from "@/components/ui/button";
import { Mail, MapPinned, MessageSquareText, PhoneCall, SendHorizonal } from "lucide-react";
import { usePublicTheme } from "@/components/public/usePublicTheme";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const { theme, mounted } = usePublicTheme();
  const dark = !mounted || theme === "dark";
  const shellClass = dark
    ? "min-h-screen bg-[radial-gradient(circle_at_top,rgba(0,115,209,0.12),transparent_24%),linear-gradient(180deg,#09111b_0%,#0a1320_40%,#08101a_100%)] text-white"
    : "min-h-screen bg-[linear-gradient(180deg,#eef6fd_0%,#f8fbff_30%,#ffffff_100%)] text-[#003869]";
  const panelClass = dark
    ? "rounded-[1.9rem] border border-white/10 bg-[#0b1523]/92 shadow-[0_24px_80px_rgba(0,0,0,0.22)]"
    : "premium-card rounded-[1.9rem]";
  const bodyClass = dark ? "text-white/64" : "text-[var(--text-secondary)]";
  const titleClass = dark ? "text-white" : "text-blue-deep";

  return (
    <div className={shellClass}>
      <PublicNavbar />

      <main className="mx-auto max-w-7xl px-6 py-10 md:px-10 lg:px-14">
        <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div className={`${panelClass} p-7`}>
            <p className="text-xs uppercase tracking-[0.22em] text-[#49d2b6]">Contact Dynovare</p>
            <h1 className={`mt-3 text-3xl font-semibold md:text-4xl ${titleClass}`}>
              Talk to us about your policy workflow, team setup, or partnership idea.
            </h1>
            <p className={`mt-4 leading-7 ${bodyClass}`}>
              Reach out if you want a walkthrough, a custom setup, implementation support, or a partnership conversation.
            </p>

            <div className="mt-8 space-y-4">
              {[
                { icon: Mail, title: "Email", body: "hello@dynovare.com" },
                { icon: MapPinned, title: "Focus", body: "Energy policy intelligence and private policy workflows for Nigeria." },
                { icon: PhoneCall, title: "Response", body: "We aim to respond to partnership and product enquiries quickly." },
              ].map((item) => (
                <div key={item.title} className={`${dark ? "rounded-[1.5rem] border border-white/10 bg-white/[0.04]" : "rounded-[1.5rem] border bg-white/70"} flex items-start gap-3 p-4`}>
                  <div className={`rounded-xl p-2 ${dark ? "border border-[#0073d1]/20 bg-[#0073d1]/10 text-[#7ac8ff]" : "bg-[rgba(0,115,209,0.09)] text-[#0073d1]"}`}>
                    <item.icon size={18} />
                  </div>
                  <div>
                    <p className={`font-semibold ${titleClass}`}>{item.title}</p>
                    <p className={`text-sm leading-7 ${bodyClass}`}>{item.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={`${panelClass} p-7`}>
            <div className="flex items-center gap-3">
              <div className={`rounded-2xl p-3 ${dark ? "border border-[#0073d1]/20 bg-[#0073d1]/10 text-[#7ac8ff]" : "bg-[rgba(0,115,209,0.09)] text-[#0073d1]"}`}>
                <MessageSquareText size={22} />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-[#49d2b6]">Send a note</p>
                <h2 className={`mt-1 text-2xl font-semibold ${titleClass}`}>Start the conversation</h2>
              </div>
            </div>

            {submitted ? (
              <div className={`mt-6 rounded-[1.5rem] border p-5 text-sm ${dark ? "border-[#2fd0a2]/20 bg-[#2fd0a2]/10 text-white" : "bg-[#edf8ff] text-blue-deep"}`}>
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
              <input className={`studio-input ${dark ? "border-white/10 bg-[#09111b] text-white placeholder:text-white/52" : ""}`} placeholder="Your name" />
              <input className={`studio-input ${dark ? "border-white/10 bg-[#09111b] text-white placeholder:text-white/52" : ""}`} placeholder="Your email" type="email" />
              <input className={`studio-input ${dark ? "border-white/10 bg-[#09111b] text-white placeholder:text-white/52" : ""}`} placeholder="Organization or team" />
              <textarea className={`studio-textarea min-h-[180px] ${dark ? "border-white/10 bg-[#09111b] text-white placeholder:text-white/52" : ""}`} placeholder="Tell us what you want to discuss." />
              <Button type="submit" className="rounded-full bg-[#0073d1] hover:bg-[#003869]">
                <SendHorizonal size={15} />
                Send enquiry
              </Button>
            </form>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
