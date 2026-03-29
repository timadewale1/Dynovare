"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  BarChart3,
  Compass,
  Database,
  FilePenLine,
  Globe2,
  MapPinned,
  Scale,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import NigeriaPolicyMap from "@/components/public/NigeriaPolicyMap";
import PublicNavbar from "@/components/public/PublicNavbar";
import PublicFooter from "@/components/public/PublicFooter";
import { useUser } from "@/components/providers/UserProvider";
import PwaInstallPrompt from "@/components/branding/PwaInstallPrompt";

type PublicInsights = {
  totals: {
    policies: number;
    critiques: number;
    averageScore: number | null;
  };
  leaderboard: { rank: number; title: string; slug: string | null; score: number; state: string | null }[];
  stateLeaderboard: { state: string; score: number | null; policies: number }[];
  stateScores: { state: string; score: number | null; policies: number }[];
};

function SectionHeader({ kicker, title, subtitle }: { kicker: string; title: string; subtitle: string }) {
  return (
    <div className="max-w-3xl">
      <p className="text-xs uppercase tracking-[0.22em] text-[var(--text-secondary)]">{kicker}</p>
      <h2 className="mt-3 text-2xl font-black tracking-tight text-blue-deep md:text-4xl">{title}</h2>
      <p className="mt-3 text-base text-[var(--text-secondary)] md:text-lg">{subtitle}</p>
    </div>
  );
}

export default function Home() {
  const { user } = useUser();
  const [insights, setInsights] = useState<PublicInsights | null>(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const res = await fetch("/api/public/insights");
        const data = await res.json();
        if (active && res.ok) setInsights(data);
      } catch {
        // soft fail
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, []);

  const stateScores = insights?.stateScores ?? [];
  const policyLeaderboard = (insights?.leaderboard ?? []).slice(0, 3);
  const stateLeaderboard = (insights?.stateLeaderboard ?? []).slice(0, 3);

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-clip bg-[radial-gradient(circle_at_top,#d9edf2_0%,#f6fbfd_38%,#ffffff_100%)]">
      <PublicNavbar />
      <PwaInstallPrompt />

      <main>
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute left-0 top-16 h-72 w-72 -translate-x-1/2 rounded-full bg-[#8bd7c7]/22 blur-3xl" />
          <div className="pointer-events-none absolute right-0 top-14 h-80 w-80 translate-x-1/3 rounded-full bg-[#8fc7ff]/24 blur-3xl" />

          <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-14 lg:grid-cols-[1.08fr_0.92fr] lg:items-start">
            <div className="fade-up">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="rounded-full bg-white/80">Grant-ready policy intelligence</Badge>
                <Badge variant="outline" className="rounded-full bg-white/80">Nigeria-first energy transition workflows</Badge>
              </div>

              <h1 className="mt-6 max-w-5xl text-4xl font-black leading-[0.94] tracking-tight text-blue-deep md:text-6xl">
                Build sharper energy policy with evidence, critique, simulation, and export-ready design.
              </h1>

              <p className="mt-6 max-w-2xl text-lg text-[var(--text-secondary)]">
                Explore public policy signals across Nigeria, compare state performance, draft stronger interventions, test assumptions,
                and export polished policy documents your team can actually use.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="rounded-full bg-[#125669] shadow-[0_18px_40px_rgba(18,86,105,0.22)] hover:bg-[#0f4b5d]">
                  <Link href={user ? "/repository" : "/public/policies"}>
                    Explore repository <ArrowRight size={16} className="ml-2" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="rounded-full bg-white/80">
                  <Link href="/register">Open private workspace</Link>
                </Button>
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                <Card className="premium-card rounded-[1.75rem] p-5">
                  <p className="text-sm text-[var(--text-secondary)]">Public policies</p>
                  <p className="mt-2 text-3xl font-black text-blue-deep">{insights?.totals.policies ?? 0}</p>
                  <p className="text-sm text-[var(--text-secondary)]">Browse the live repository faster</p>
                </Card>
                <Card className="premium-card rounded-[1.75rem] p-5">
                  <p className="text-sm text-[var(--text-secondary)]">Average score</p>
                  <p className="mt-2 text-3xl font-black text-blue-deep">{insights?.totals.averageScore ? `${insights.totals.averageScore}/100` : "-"}</p>
                  <p className="text-sm text-[var(--text-secondary)]">See how strong the leading policies are</p>
                </Card>
                <Card className="premium-card rounded-[1.75rem] p-5">
                  <p className="text-sm text-[var(--text-secondary)]">Public critiques</p>
                  <p className="mt-2 text-3xl font-black text-blue-deep">{insights?.totals.critiques ?? 0}</p>
                  <p className="text-sm text-[var(--text-secondary)]">Review signals behind the rankings</p>
                </Card>
              </div>
            </div>

            <div className="grid gap-4">
              <Card className="pulse-glow rounded-[2rem] bg-[linear-gradient(135deg,#091a28_0%,#0d4760_46%,#178e83_100%)] p-6 text-white shadow-xl">
                <p className="text-xs uppercase tracking-[0.22em] text-white/70">Your workflow</p>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {[
                    ["Discover", "Browse policy records, compare states, and understand what is already working."],
                    ["Draft", "Generate or upload documents into an editable in-app policy studio."],
                    ["Stress-test", "Run critique and simulation before your team commits to a path."],
                    ["Export", "Download a polished PDF only when the document is ready to share."],
                  ].map(([title, text]) => (
                    <div key={title} className="rounded-[1.4rem] bg-white/8 p-4">
                      <p className="font-bold">{title}</p>
                      <p className="mt-2 text-sm text-white/76">{text}</p>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="premium-card aurora-border rounded-[2rem] p-6">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.22em] text-[var(--text-secondary)]">What you can do here</p>
                    <h2 className="mt-2 text-xl font-black text-blue-deep">Everything you need to move a policy draft forward.</h2>
                  </div>
                  <Sparkles className="text-[#125669]" />
                </div>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  {[
                    ["Policy repository", "See what already exists before you write, revise, or benchmark your draft."],
                    ["Policy studio", "Edit section by section, not inside a locked static file."],
                    ["Critique engine", "Get verdicts, priority actions, risks, and strengths in one pass."],
                    ["Simulation flow", "Test access, cost, reliability, and delivery risk under different assumptions."],
                  ].map(([title, text]) => (
                    <div key={title} className="rounded-[1.4rem] border bg-slate-50 p-4">
                      <p className="font-bold text-blue-deep">{title}</p>
                      <p className="mt-2 text-sm text-[var(--text-secondary)]">{text}</p>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-12">
          <SectionHeader
            kicker="Product pillars"
            title="Move from public signal to submission-ready policy work in one place."
            subtitle="Start with evidence, sharpen the draft, pressure-test the idea, and export a document your team can stand behind."
          />

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[
              { icon: <Database className="text-[#125669]" size={22} />, title: "Public repository", text: "Search energy policy records across federal and state contexts." },
              { icon: <Scale className="text-[#125669]" size={22} />, title: "Rankings intelligence", text: "Spot strong policies, score movement, and review-backed performance." },
              { icon: <FilePenLine className="text-[#125669]" size={22} />, title: "Editable policy studio", text: "Draft, refine, and export from a workspace built for policy writing." },
              { icon: <ShieldCheck className="text-[#125669]" size={22} />, title: "Private workspace", text: "Keep uploads, AI drafts, critiques, and simulations under your account." },
            ].map((item) => (
              <Card key={item.title} className="premium-card rounded-[2rem] p-6 transition hover:-translate-y-1">
                <div className="inline-flex rounded-2xl bg-[rgba(18,86,105,0.09)] p-3">{item.icon}</div>
                <h3 className="mt-4 text-2xl font-black text-blue-deep">{item.title}</h3>
                <p className="mt-3 text-sm text-[var(--text-secondary)]">{item.text}</p>
              </Card>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-12">
          <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
            <Card className="premium-card rounded-[2rem] p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-[var(--text-secondary)]">Top public policies</p>
                  <h2 className="mt-2 text-xl font-black text-blue-deep">Live leaderboard</h2>
                </div>
                <Scale className="text-[#125669]" />
              </div>
              <div className="mt-5 space-y-3">
                {policyLeaderboard.length === 0 ? (
                  <p className="text-sm text-[var(--text-secondary)]">No public ranking data yet.</p>
                ) : (
                  policyLeaderboard.map((item) => (
                    <div key={`${item.rank}-${item.title}`} className="rounded-[1.4rem] border bg-white/70 px-4 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-secondary)]">#{item.rank}</p>
                          <p className="truncate font-bold text-blue-deep">{item.title}</p>
                          <p className="text-sm text-[var(--text-secondary)]">{item.state ?? "Federal"}</p>
                        </div>
                        <p className="shrink-0 pl-3 text-right text-[1.85rem] leading-none font-black tabular-nums text-blue-deep">{item.score.toFixed(1)}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>

            <Card className="premium-card rounded-[2rem] p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-[var(--text-secondary)]">Top states</p>
                  <h2 className="mt-2 text-xl font-black text-blue-deep">State performance snapshot</h2>
                </div>
                <MapPinned className="text-[#125669]" />
              </div>
              <div className="mt-5 space-y-3">
                {stateLeaderboard.length === 0 ? (
                  <p className="text-sm text-[var(--text-secondary)]">No state-level scores yet.</p>
                ) : (
                  stateLeaderboard.map((item, index) => (
                    <button
                      key={item.state}
                      type="button"
                      onClick={() => window.location.assign(`${user ? "/repository" : "/public/policies"}?jurisdictionLevel=state&state=${encodeURIComponent(item.state)}`)}
                      className="flex w-full items-center justify-between rounded-[1.4rem] border bg-white/70 px-4 py-3 text-left transition hover:bg-[rgba(18,86,105,0.05)]"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-secondary)]">#{index + 1}</p>
                        <p className="font-bold text-blue-deep">{item.state}</p>
                        <p className="text-sm text-[var(--text-secondary)]">{item.policies} public policies</p>
                      </div>
                      <p className="shrink-0 pl-3 text-right text-[1.85rem] leading-none font-black tabular-nums text-blue-deep">{item.score?.toFixed(1) ?? "-"}</p>
                    </button>
                  ))
                )}
              </div>
            </Card>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-12">
          <NigeriaPolicyMap
            scores={stateScores}
            onSelectState={(state) => window.location.assign(`${user ? "/repository" : "/public/policies"}?jurisdictionLevel=state&state=${encodeURIComponent(state)}`)}
          />
        </section>

        <section id="modeling" className="mx-auto max-w-7xl px-4 py-12">
          <SectionHeader
            kicker="Workflow"
            title="From first insight to final PDF"
            subtitle="Build with evidence first, refine with AI where it helps, and keep control of the document all the way through."
          />

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              { icon: <Compass className="text-[#125669]" size={22} />, title: "Discover", text: "Use the repository, rankings, and map to understand the landscape before writing." },
              { icon: <BarChart3 className="text-[#125669]" size={22} />, title: "Stress-test", text: "Run critique and simulation to test structure, implementation, and likely outcomes." },
              { icon: <Globe2 className="text-[#125669]" size={22} />, title: "Deliver", text: "Refine the draft in Policy Studio and export a polished PDF when you are ready to share it." },
            ].map((item) => (
              <Card key={item.title} className="premium-card rounded-[2rem] p-6">
                <div className="inline-flex rounded-2xl bg-[rgba(18,86,105,0.09)] p-3">{item.icon}</div>
                <h3 className="mt-4 text-2xl font-black text-blue-deep">{item.title}</h3>
                <p className="mt-3 text-sm text-[var(--text-secondary)]">{item.text}</p>
              </Card>
            ))}
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
