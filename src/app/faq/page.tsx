"use client";

import { useState } from "react";
import PublicNavbar from "@/components/public/PublicNavbar";
import PublicFooter from "@/components/public/PublicFooter";
import { Card } from "@/components/ui/card";
import { ChevronDown, ChevronUp } from "lucide-react";

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

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#e7f4f6_0%,#f8fbfd_40%,#ffffff_100%)]">
      <PublicNavbar />

      <main className="mx-auto max-w-5xl px-4 py-10">
        <section className="rounded-[2.25rem] bg-[linear-gradient(135deg,#00223f_0%,#0073d1_100%)] p-8 text-white shadow-[0_28px_80px_rgba(0,56,105,0.16)]">
          <p className="text-xs uppercase tracking-[0.22em] text-white/70">FAQ</p>
          <h1 className="mt-3 text-3xl font-black md:text-4xl">Answers to the questions teams ask most.</h1>
          <p className="mt-4 max-w-2xl text-white/78">
            Find quick answers on privacy, drafting, critique, simulation, rankings, and exports.
          </p>
        </section>

        <section className="mt-8 space-y-4">
          {FAQ_ITEMS.map((item) => {
            const isOpen = open === item.q;
            return (
              <Card key={item.q} className="premium-card overflow-hidden rounded-[1.75rem]">
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : item.q)}
                  className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                >
                  <p className="text-lg font-bold text-blue-deep">{item.q}</p>
                  {isOpen ? <ChevronUp size={18} className="text-[#0073d1]" /> : <ChevronDown size={18} className="text-[#0073d1]" />}
                </button>
                {isOpen ? (
                  <div className="border-t px-6 py-5 text-sm leading-7 text-[var(--text-secondary)]">
                    {item.a}
                  </div>
                ) : null}
              </Card>
            );
          })}
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
