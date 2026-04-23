"use client";

import PublicNavbar from "@/components/public/PublicNavbar";
import PublicFooter from "@/components/public/PublicFooter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, Compass, MapPinned, ShieldCheck, Sparkles, Workflow } from "lucide-react";
import { useUser } from "@/components/providers/UserProvider";
import { usePublicTheme } from "@/components/public/usePublicTheme";

export default function AboutPage() {
  const { user } = useUser();
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
        <section className={`${panelClass} overflow-hidden px-7 py-10 md:px-10`}>
          <Badge variant="outline" className={dark ? "border-white/12 bg-white/[0.06] text-white" : ""}>About Dynovare</Badge>
          <h1 className={`mt-5 max-w-4xl text-3xl font-semibold tracking-tight md:text-5xl ${titleClass}`}>
            A public intelligence layer and private policy workspace built for serious energy-policy work.
          </h1>
          <p className={`mt-5 max-w-3xl text-base leading-8 md:text-lg ${bodyClass}`}>
            Dynovare helps teams move from fragmented public policy signals to stronger drafting, critique, simulation, and export in one connected system designed around Nigeria’s energy context.
          </p>
        </section>

        <section className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {[
            { icon: Compass, title: "Public intelligence", text: "Track policy quality, state performance, and public evidence in a searchable repository." },
            { icon: Sparkles, title: "Private AI workspace", text: "Generate, revise, critique, simulate, and export without exposing draft work publicly." },
            { icon: Workflow, title: "Connected workflow", text: "Discovery, drafting, simulation, critique, and export stay in one system instead of scattered tools." },
            { icon: ShieldCheck, title: "Private by default", text: "Uploads, AI drafts, critiques, and simulations stay inside the user workspace unless curated." },
          ].map((item) => (
            <div key={item.title} className={`${panelClass} p-6`}>
              <div className={`inline-flex rounded-2xl p-3 ${dark ? "border border-[#0073d1]/20 bg-[#0073d1]/10 text-[#7ac8ff]" : "bg-[rgba(0,115,209,0.09)] text-[#0073d1]"}`}>
                <item.icon size={22} />
              </div>
              <h2 className={`mt-4 text-xl font-semibold ${titleClass}`}>{item.title}</h2>
              <p className={`mt-3 text-sm leading-7 ${bodyClass}`}>{item.text}</p>
            </div>
          ))}
        </section>

        <section className="mt-8 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <div className={`${panelClass} p-7`}>
            <p className="text-xs uppercase tracking-[0.24em] text-[#49d2b6]">System view</p>
            <h2 className={`mt-3 text-2xl font-semibold ${titleClass}`}>Built to keep evidence and execution close together.</h2>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {[
                "Repository, rankings, insights, and state map",
                "Private drafting, critique, simulation, and export",
                "Public examples imported into the private workspace",
                "Structured policy documents instead of static one-shot output",
              ].map((item) => (
                <div key={item} className={`${dark ? "rounded-[1.4rem] border border-white/10 bg-white/[0.04]" : "rounded-[1.4rem] border bg-slate-50"} p-4`}>
                  <p className={`text-sm leading-7 ${bodyClass}`}>{item}</p>
                </div>
              ))}
            </div>
          </div>

          <div className={`${panelClass} p-7`}>
            <p className="text-xs uppercase tracking-[0.24em] text-[#49d2b6]">Who it serves</p>
            <div className="mt-4 space-y-3">
              {[
                "Government teams shaping national and state energy interventions.",
                "Researchers and think tanks comparing policy quality and implementation readiness.",
                "Development partners supporting evidence-backed transition planning.",
                "Organizations building internal policy drafts and delivery scenarios.",
              ].map((item) => (
                <div key={item} className={`${dark ? "rounded-[1.25rem] border border-white/10 bg-white/[0.04]" : "rounded-[1.25rem] border bg-white/70"} px-4 py-3 text-sm ${bodyClass}`}>
                  {item}
                </div>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild className="rounded-full bg-[#0073d1] hover:bg-[#003869]">
                <Link href="/register">
                  Create account <ArrowRight size={16} />
                </Link>
              </Button>
              <Button asChild variant="outline" className={`rounded-full ${dark ? "border-white/12 bg-transparent text-white hover:bg-white/8" : ""}`}>
                <Link href={user ? "/repository" : "/public/policies"}>Explore repository</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className={`${panelClass} mt-8 p-7`}>
          <div className="flex items-start gap-4">
            <div className={`rounded-2xl p-3 ${dark ? "border border-[#0073d1]/20 bg-[#0073d1]/10 text-[#7ac8ff]" : "bg-white shadow-sm text-[#0073d1]"}`}>
              <MapPinned size={22} />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-[#49d2b6]">Focus</p>
              <h2 className={`mt-2 text-2xl font-semibold ${titleClass}`}>Built around Nigeria’s policy landscape and ready for serious team use.</h2>
              <p className={`mt-3 max-w-3xl leading-7 ${bodyClass}`}>
                Work across federal and state contexts, focus by energy domain, and move from exploration into drafting and revision without restarting in another tool.
              </p>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
