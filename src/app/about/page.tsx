"use client";

import PublicNavbar from "@/components/public/PublicNavbar";
import PublicFooter from "@/components/public/PublicFooter";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, Compass, MapPinned, ShieldCheck, Sparkles } from "lucide-react";
import { useUser } from "@/components/providers/UserProvider";

export default function AboutPage() {
  const { user } = useUser();
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#dceff4_0%,#f7fbfd_38%,#ffffff_100%)]">
      <PublicNavbar />

      <main className="mx-auto max-w-7xl px-4 py-10">
        <section className="overflow-hidden rounded-[2.25rem] bg-[linear-gradient(135deg,#081f30_0%,#103851_52%,#125669_100%)] px-6 py-10 text-white shadow-[0_30px_90px_rgba(8,31,48,0.18)] md:px-10">
          <Badge variant="outline" className="border-white/20 bg-white/10 text-white">About Dynovare</Badge>
          <h1 className="mt-5 max-w-4xl text-3xl font-black tracking-tight md:text-5xl">
            Give your team a better way to research, draft, test, and deliver energy policy.
          </h1>
          <p className="mt-5 max-w-2xl text-base text-white/76 md:text-lg">
            Use Dynovare to explore public policy signals, compare state performance, build stronger drafts, and export polished policy documents without losing control of the work.
          </p>
        </section>

        <section className="mt-10 grid gap-5 md:grid-cols-3">
          {[
            {
              icon: <Compass className="text-[#125669]" size={22} />,
              title: "Policy intelligence",
              text: "Track policy quality, state performance, and public evidence with a Nigeria-first repository.",
            },
            {
              icon: <Sparkles className="text-[#125669]" size={22} />,
              title: "Private AI workspace",
              text: "Generate drafts, rewrite sections, run simulations, and refine outputs without exposing private work.",
            },
            {
              icon: <ShieldCheck className="text-[#125669]" size={22} />,
              title: "Private by default",
              text: "Your workspace is built around private-by-default drafting and review.",
            },
          ].map((item) => (
            <Card key={item.title} className="premium-card rounded-[2rem] p-6">
              <div className="inline-flex rounded-2xl bg-[rgba(18,86,105,0.09)] p-3">{item.icon}</div>
              <h2 className="mt-4 text-xl font-black text-blue-deep">{item.title}</h2>
              <p className="mt-3 text-sm text-[var(--text-secondary)]">{item.text}</p>
            </Card>
          ))}
        </section>

        <section className="mt-10 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="premium-card rounded-[2rem] p-7">
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--text-secondary)]">Why teams use it</p>
            <h2 className="mt-3 text-2xl font-black text-blue-deep">Keep discovery, drafting, critique, and export in one flow.</h2>
            <p className="mt-4 text-[var(--text-secondary)]">
              Bring your evidence, your draft, and your review process into one place. Instead of juggling scattered documents and generic tools, you can move from discovery to drafting, critique, simulation, revision, and export in one continuous flow.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-[1.5rem] border bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-secondary)]">Explore</p>
                <p className="mt-2 font-bold text-blue-deep">Repository, rankings, insights, and the Nigeria map</p>
              </div>
              <div className="rounded-[1.5rem] border bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-secondary)]">Workspace</p>
                <p className="mt-2 font-bold text-blue-deep">Policy Studio, critique, simulations, revision, and export</p>
              </div>
            </div>
          </Card>

          <Card className="premium-card rounded-[2rem] p-7">
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--text-secondary)]">Who it serves</p>
            <div className="mt-4 space-y-4">
              {[
                "Government teams shaping state and national energy interventions.",
                "Researchers and think tanks comparing policy quality and implementation readiness.",
                "Development partners supporting evidence-backed energy transition planning.",
                "Organizations building internal policy drafts and delivery scenarios.",
              ].map((item) => (
                <div key={item} className="rounded-[1.25rem] border bg-white/70 px-4 py-3 text-sm text-[var(--text-secondary)]">
                  {item}
                </div>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild className="rounded-full bg-[#125669] hover:bg-[#0f4b5d]">
                <Link href="/register">
                  Create account <ArrowRight size={16} />
                </Link>
              </Button>
              <Button asChild variant="outline" className="rounded-full">
                <Link href={user ? "/repository" : "/public/policies"}>Explore repository</Link>
              </Button>
            </div>
          </Card>
        </section>

        <section className="mt-10 rounded-[2rem] border bg-[linear-gradient(135deg,#f4f7ec_0%,#edf8ff_100%)] p-7">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-white p-3 text-[#125669] shadow-sm">
              <MapPinned size={22} />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-[var(--text-secondary)]">Focus</p>
              <h2 className="mt-2 text-2xl font-black text-blue-deep">Built around Nigeria's policy landscape and ready for serious team use.</h2>
              <p className="mt-3 max-w-3xl text-[var(--text-secondary)]">
                Work across federal and state policy contexts, focus by energy domain, and move from exploration into drafting and revision without starting over in another tool.
              </p>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
