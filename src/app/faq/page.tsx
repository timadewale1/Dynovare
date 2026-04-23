"use client";

import { useState } from "react";
import PublicNavbar from "@/components/public/PublicNavbar";
import PublicFooter from "@/components/public/PublicFooter";
import { ChevronDown, ChevronUp, HelpCircle, ShieldCheck } from "lucide-react";
import { usePublicTheme } from "@/components/public/usePublicTheme";

const FAQ_ITEMS = [
  {
    q: "What is public and what is private in Dynovare?",
    a: "The public repository, rankings, and public insights are visible without signing in. Your uploads, AI-generated drafts, critique histories, simulations, and Policy Studio edits stay private unless you intentionally curate them for public viewing.",
  },
  {
    q: "Can AI-generated drafts be edited before export?",
    a: "Yes. Generated policies open inside Policy Studio as editable sections. You can revise sections manually, ask AI to improve a specific section, save drafts, run critique and simulations, and export a styled PDF only when the draft is ready.",
  },
  {
    q: "Does uploading a document make it public automatically?",
    a: "No. Uploaded policies stay under your account and do not flow into the public repository automatically.",
  },
  {
    q: "What do the rankings represent?",
    a: "The public rankings summarize critique-backed performance for public policies using score trends, critique volume, and structural quality signals. When you sign in, you see those signals alongside your own drafts and review work.",
  },
  {
    q: "Can the platform support internal policy teams?",
    a: "Yes. You can draft, revise, critique, simulate, and export inside the workspace, so the platform supports more than simple public browsing.",
  },
];

export default function FAQPage() {
  const [open, setOpen] = useState<string | null>(FAQ_ITEMS[0].q);
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

      <main className="mx-auto max-w-6xl px-6 py-10 md:px-10 lg:px-14">
        <section className={`${panelClass} p-8`}>
          <div className="flex items-center gap-3">
            <div className={`rounded-2xl p-3 ${dark ? "border border-[#0073d1]/20 bg-[#0073d1]/10 text-[#7ac8ff]" : "bg-[rgba(0,115,209,0.09)] text-[#0073d1]"}`}>
              <HelpCircle size={22} />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-[#49d2b6]">FAQ</p>
              <h1 className={`mt-2 text-3xl font-semibold md:text-4xl ${titleClass}`}>Answers to the questions teams ask most.</h1>
            </div>
          </div>
          <p className={`mt-4 max-w-3xl leading-7 ${bodyClass}`}>
            Find quick answers on privacy, drafting, critique, simulation, rankings, and exports.
          </p>
        </section>

        <section className="mt-8 space-y-4">
          {FAQ_ITEMS.map((item) => {
            const isOpen = open === item.q;
            return (
              <div key={item.q} className={`${panelClass} overflow-hidden`}>
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : item.q)}
                  className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                >
                  <p className={`text-lg font-semibold ${titleClass}`}>{item.q}</p>
                  {isOpen ? <ChevronUp size={18} className={dark ? "text-[#7ac8ff]" : "text-[#0073d1]"} /> : <ChevronDown size={18} className={dark ? "text-[#7ac8ff]" : "text-[#0073d1]"} />}
                </button>
                {isOpen ? (
                  <div className={`border-t px-6 py-5 text-sm leading-7 ${dark ? "border-white/10 text-white/68" : "text-[var(--text-secondary)]"}`}>
                    {item.a}
                  </div>
                ) : null}
              </div>
            );
          })}
        </section>

        <section className={`${panelClass} mt-8 p-7`}>
          <div className="flex items-start gap-3">
            <ShieldCheck className={dark ? "mt-1 text-[#7ce8d1]" : "mt-1 text-[#0073d1]"} size={18} />
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-[#49d2b6]">Quick principle</p>
              <p className={`mt-2 leading-7 ${bodyClass}`}>
                Public discovery and private work are intentionally separate. Browse public signals openly, then move into the private workspace for critique, simulation, drafting, and export.
              </p>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
