"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
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
  leaderboard: { rank: number; title: string; slug: string | null; score: number; state: string | null }[];
  stateLeaderboard: { state: string; score: number | null; policies: number }[];
  stateScores: { state: string; score: number | null; policies: number }[];
};

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1466611653911-95081537e5b7?auto=format&fit=crop&w=1800&q=80";
const DISCOVERY_IMAGE =
  "https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&w=1400&q=80";
const WORKFLOW_IMAGE =
  "https://unsplash.com/photos/a-group-of-light-bulbs-sitting-on-top-of-a-blue-table-EQyGa5mOjyc?auto=format&fit=crop&w=1400&q=80";

function SectionHeader({ kicker, title, subtitle }: { kicker: string; title: string; subtitle: string }) {
  return (
    <div className="max-w-3xl">
      <p className="text-xs uppercase tracking-[0.22em] text-[var(--text-secondary)]">{kicker}</p>
      <h2 className="mt-3 text-[1.85rem] tracking-tight text-blue-deep md:text-[2.4rem]">{title}</h2>
      <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--text-secondary)] md:text-base">{subtitle}</p>
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

  const repoHref = user ? "/repository" : "/public/policies";
  const policyLeaderboard = useMemo(() => (insights?.leaderboard ?? []).slice(0, 3), [insights]);
  const stateLeaderboard = useMemo(() => (insights?.stateLeaderboard ?? []).slice(0, 3), [insights]);
  const stateScores = insights?.stateScores ?? [];

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-clip bg-[linear-gradient(180deg,#f6fbff_0%,#f8fbfe_34%,#ffffff_100%)]">
      <PublicNavbar />
      <PwaInstallPrompt />

      <main className="pb-12">
        <section className="relative min-h-[calc(100vh-4rem)] overflow-hidden">
          <div
            className="absolute inset-0 hero-overlay-card"
            style={{
              backgroundImage: `linear-gradient(180deg, rgba(0, 56, 105, 0.86) 0%, rgba(0, 56, 105, 0.8) 38%, rgba(0, 56, 105, 0.72) 100%), url(${HERO_IMAGE})`,
            }}
          />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.12),transparent_28%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,56,105,0.36)_0%,rgba(0,56,105,0.16)_44%,transparent_100%)]" />

          <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl items-end px-6 pb-16 pt-14 md:px-10 md:pb-20 lg:px-16">
            <div className="max-w-3xl">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="rounded-full border-white/18 bg-white/10 text-white backdrop-blur">
                  Nigeria-first policy intelligence
                </Badge>
                <Badge variant="outline" className="rounded-full border-white/18 bg-white/10 text-white backdrop-blur">
                  Private drafting workspace
                </Badge>
              </div>

              <h1 className="mt-7 max-w-3xl text-3xl leading-[0.97] tracking-tight text-white md:text-[4.25rem]">
                Build stronger energy policy with real signals, sharper critique, and decision-ready export.
              </h1>

              <p className="mt-6 max-w-2xl text-sm leading-8 text-white/84 md:text-lg">
                Explore public policy patterns across Nigeria, draft inside a private studio, run critique and simulation,
                and export a polished document when the work is ready to move.
              </p>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="rounded-full bg-white text-blue-deep hover:bg-white/92">
                  <Link href={repoHref}>
                    Explore repository <ArrowRight size={16} className="ml-2" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="rounded-full border-white/24 bg-transparent text-white hover:bg-white/10"
                >
                  <Link href="/register">Open private workspace</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-18 md:px-10 lg:px-16">
          <div className="grid gap-8 lg:grid-cols-[1.02fr_0.98fr]">
            <div
              className="hero-overlay-card relative overflow-hidden rounded-[2rem] border border-white/40 p-8 text-white shadow-[0_24px_72px_rgba(0,56,105,0.12)] md:p-10"
              style={{
                backgroundImage: `linear-gradient(90deg, rgba(10, 18, 24, 0.76) 0%, rgba(10, 18, 24, 0.48) 40%, rgba(10, 18, 24, 0.12) 100%), url(${DISCOVERY_IMAGE})`,
                backgroundPosition: "center right",
              }}
            >
              <div className="relative max-w-lg">
                <p className="text-xs uppercase tracking-[0.22em] text-white/70">Why it matters</p>
                <h2 className="mt-3 text-[1.9rem] tracking-tight text-white md:text-[2.5rem]">
                  Strong policy work starts with context, not assumption.
                </h2>
                <p className="mt-4 text-sm leading-7 text-white/82 md:text-base">
                  Use public repository signals, comparative ranking patterns, and geographic context to understand what your next draft should respond to before you write.
                </p>
              </div>
            </div>

            <Card className="premium-card rounded-[2rem] p-8 md:p-10">
              <p className="text-xs uppercase tracking-[0.22em] text-[var(--text-secondary)]">What you can do here</p>
              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                {[
                  { icon: <Database className="text-[#0073d1]" size={20} />, title: "Explore public policy", text: "Search the live repository before writing or revising." },
                  { icon: <FilePenLine className="text-[#0073d1]" size={20} />, title: "Draft in Policy Studio", text: "Work section by section inside a private editable workspace." },
                  { icon: <Sparkles className="text-[#0073d1]" size={20} />, title: "Run AI critique", text: "See verdicts, risks, and actions that strengthen the policy." },
                  { icon: <BarChart3 className="text-[#0073d1]" size={20} />, title: "Model likely outcomes", text: "Stress-test assumptions before your team commits." },
                ].map((item) => (
                  <div key={item.title} className="rounded-[1.4rem] border bg-slate-50 px-5 py-5">
                    <div className="inline-flex rounded-2xl bg-[rgba(0,115,209,0.09)] p-3">{item.icon}</div>
                    <h3 className="mt-4 text-lg text-blue-deep">{item.title}</h3>
                    <p className="mt-2 text-sm leading-7 text-[var(--text-secondary)]">{item.text}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-16 md:px-10 lg:px-16">
          <SectionHeader
            kicker="Public signals"
            title="A cleaner look at the strongest public policy movement."
            subtitle="Focus on the leaders first, then dive deeper through the repository or the map."
          />

          <div className="mt-8 grid gap-8 lg:grid-cols-2">
            <Card className="premium-card rounded-[2rem] p-8 md:p-10">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-secondary)]">Top policies</p>
                  <h3 className="mt-2 text-lg text-blue-deep">Live leaderboard</h3>
                </div>
                <Scale className="text-[#0073d1]" />
              </div>
              <div className="mt-6 space-y-4">
                {policyLeaderboard.length === 0 ? (
                  <p className="text-sm text-[var(--text-secondary)]">No public ranking data yet.</p>
                ) : (
                  policyLeaderboard.map((item) => (
                    <div key={`${item.rank}-${item.title}`} className="rounded-[1.35rem] border bg-white px-5 py-5">
                      <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-secondary)]">#{item.rank}</p>
                      <p className="mt-2 line-clamp-2 text-base leading-7 text-blue-deep">{item.title}</p>
                      <div className="mt-4 flex items-end justify-between gap-3">
                        <p className="text-sm text-[var(--text-secondary)]">{item.state ?? "Federal"}</p>
                        <p className="text-xl leading-none text-blue-deep tabular-nums">{item.score.toFixed(1)}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>

            <Card className="premium-card rounded-[2rem] p-8 md:p-10">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-secondary)]">Top states</p>
                  <h3 className="mt-2 text-lg text-blue-deep">State snapshot</h3>
                </div>
                <MapPinned className="text-[#0073d1]" />
              </div>
              <div className="mt-6 space-y-4">
                {stateLeaderboard.length === 0 ? (
                  <p className="text-sm text-[var(--text-secondary)]">No state-level scores yet.</p>
                ) : (
                  stateLeaderboard.map((item, index) => (
                    <button
                      key={item.state}
                      type="button"
                      onClick={() => window.location.assign(`${repoHref}?jurisdictionLevel=state&state=${encodeURIComponent(item.state)}`)}
                      className="w-full rounded-[1.35rem] border bg-white px-5 py-5 text-left transition hover:bg-[rgba(0,115,209,0.05)]"
                    >
                      <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-secondary)]">#{index + 1}</p>
                      <div className="mt-3 flex items-end justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-base text-blue-deep">{item.state}</p>
                          <p className="mt-1 text-sm text-[var(--text-secondary)]">{item.policies} public policies</p>
                        </div>
                        <p className="text-xl leading-none text-blue-deep tabular-nums">{item.score?.toFixed(1) ?? "-"}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </Card>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-16 md:px-10 lg:px-16">
          <SectionHeader
            kicker="Nigeria map"
            title="Read national policy movement with the map given full attention."
            subtitle="Use the map as a clean entry point into state-level signals, then jump straight into the repository view that matters."
          />

          <div className="mt-8">
            <NigeriaPolicyMap
              scores={stateScores}
              onSelectState={(state) => window.location.assign(`${repoHref}?jurisdictionLevel=state&state=${encodeURIComponent(state)}`)}
            />
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-18 md:px-10 lg:px-16">
          <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
            <Card className="premium-card rounded-[2rem] p-8 md:p-10">
              <SectionHeader
                kicker="Workflow"
                title="A calmer path from first signal to final document."
                subtitle="Keep discovery, drafting, critique, simulation, and export inside one connected flow."
              />

              <div className="mt-8 grid gap-5 md:grid-cols-3">
                {[
                  { icon: <Compass className="text-[#0073d1]" size={20} />, title: "Discover", text: "Start with repository, rankings, and the map before writing." },
                  { icon: <Globe2 className="text-[#0073d1]" size={20} />, title: "Develop", text: "Generate or upload a draft and keep refining it in Policy Studio." },
                  { icon: <ShieldCheck className="text-[#0073d1]" size={20} />, title: "Deliver", text: "Use critique, simulation, and styled export to move with confidence." },
                ].map((item) => (
                  <div key={item.title} className="rounded-[1.4rem] border bg-slate-50 px-5 py-5">
                    <div className="inline-flex rounded-2xl bg-[rgba(0,115,209,0.09)] p-3">{item.icon}</div>
                    <h3 className="mt-4 text-lg text-blue-deep">{item.title}</h3>
                    <p className="mt-2 text-sm leading-7 text-[var(--text-secondary)]">{item.text}</p>
                  </div>
                ))}
              </div>
            </Card>

            <div
              className="hero-overlay-card relative overflow-hidden rounded-[2rem] border border-white/30 p-8 text-white shadow-[0_22px_60px_rgba(0,56,105,0.12)] md:p-10"
              style={{
                backgroundImage: `linear-gradient(180deg, rgba(255,255,255,0.02) 0%, rgba(0,0,0,0.2) 42%, rgba(0,29,54,0.78) 100%), url(${WORKFLOW_IMAGE})`,
                backgroundPosition: "center center",
              }}
            >
              <div className="relative flex h-full flex-col justify-end">
                <div className="rounded-[1.6rem] border border-white/12 bg-[rgba(0,35,63,0.48)] p-5 backdrop-blur-sm">
                  <p className="text-xs uppercase tracking-[0.22em] text-white/70">Private workspace</p>
                  <h2 className="mt-3 max-w-xl text-[1.9rem] tracking-tight text-white md:text-[2.4rem]">
                    Draft privately, pressure-test carefully, and export only when the policy is ready.
                  </h2>
                  <p className="mt-4 max-w-lg text-sm leading-7 text-white/82 md:text-base">
                    Uploads and AI drafts stay in your workspace. Critique and simulation shape the next revision. Export stays the final move.
                  </p>
                  <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                    <Button asChild className="rounded-full bg-white text-blue-deep hover:bg-white/92">
                      <Link href="/register">Create account</Link>
                    </Button>
                    <Button asChild variant="outline" className="rounded-full border-white/24 bg-transparent text-white hover:bg-white/10">
                      <Link href={repoHref}>Browse public intelligence</Link>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
