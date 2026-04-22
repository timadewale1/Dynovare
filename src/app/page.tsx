"use client";

import { useEffect, useMemo, useState } from "react";
import { DM_Sans, Syne } from "next/font/google";
import { useRouter } from "next/navigation";
import NigeriaPolicyMap from "@/components/public/NigeriaPolicyMap";
import { useUser } from "@/components/providers/UserProvider";
import PublicNavbar from "@/components/public/PublicNavbar";
import PublicFooter from "@/components/public/PublicFooter";
import PwaInstallPrompt from "@/components/branding/PwaInstallPrompt";
import {
  ArrowRight,
  BookOpenText,
  BrainCircuit,
  Bolt,
  Gauge,
  LineChart,
  Search,
  ShieldAlert,
  Sparkles,
  SunMedium,
  Trees,
} from "lucide-react";

const syne = Syne({ subsets: ["latin"], weight: ["500", "600", "700", "800"], variable: "--font-home-heading" });
const dmSans = DM_Sans({ subsets: ["latin"], weight: ["400", "500", "700"], variable: "--font-home-body" });

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1466611653911-95081537e5b7?auto=format&fit=crop&w=1600&q=80";

const ENERGY_IMPACT_DATA = [
  { value: 85, suffix: "M+", label: "Nigerians without access to the national grid" },
  { value: 55, suffix: "%", label: "National electrification rate" },
  { value: 4.5, suffix: "GW", decimals: 1, label: "Supplied vs. 13GW installed capacity" },
  { value: 7, label: "Blackouts per week per connected household" },
  { value: 29, prefix: "$", suffix: "B", label: "Lost annually to power outages" },
  { value: 2, suffix: "%", label: "Contribution from renewable energy in total primary energy supply" },
];

type InsightResponse = {
  leaderboard: Array<{ id: string; title: string; state: string | null; jurisdictionLevel: string | null; avgScore: number | null }>;
  stateLeaderboard: Array<{ state: string; avgScore: number | null; policies: number }>;
  stateScores: Array<{ state: string; avgScore: number | null; policies: number }>;
};

type RankingItem = {
  id: string;
  title?: string | null;
  slug?: string | null;
  state?: string | null;
  country?: string | null;
  jurisdictionLevel?: string | null;
  policyYear?: number | null;
  type?: string | null;
  energySource?: string | null;
  domain?: string | null;
  critiquesCount?: number | null;
  avgOverallScore?: number | null;
  latestOverallScore?: number | null;
  trendDelta?: number | null;
};

type PublicPolicy = {
  id: string;
  title: string;
  slug: string | null;
  summary: string | null;
  contentText: string | null;
  editorSections: Array<{ heading?: string; title?: string; body?: string; content?: string }>;
  aiEvidence: Array<{ title?: string; url?: string; source?: string }>;
  jurisdictionLevel: string | null;
  state: string | null;
  policyYear: number | null;
  type: string | null;
  energySource: string | null;
  domain: string | null;
};

type RepoItem = {
  id: string;
  title: string;
  slug: string | null;
  summary: string | null;
  jurisdictionLevel: string | null;
  state: string | null;
  policyYear: number | null;
  type: string | null;
  energySource: string | null;
  domain: string | null;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function titleCase(value: string | null | undefined) {
  if (!value) return "National";
  return value
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function countKeywords(text: string, list: string[]) {
  return list.reduce((total, word) => total + (text.match(new RegExp(word, "gi"))?.length ?? 0), 0);
}

function summarizeSections(policy: PublicPolicy | null) {
  if (!policy) return "";
  const sectionText = policy.editorSections
    .map((section) => [section.heading, section.title, section.body, section.content].filter(Boolean).join(" "))
    .join(" ");
  return [policy.summary, policy.contentText, sectionText].filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
}

function analyzePolicy(policy: PublicPolicy | null, ranking: RankingItem | null) {
  const text = summarizeSections(policy).toLowerCase();
  const sectionCount = policy?.editorSections?.length ?? 0;
  const evidenceCount = policy?.aiEvidence?.length ?? 0;
  const base = ranking?.latestOverallScore ?? ranking?.avgOverallScore ?? 58;

  const financeHits = countKeywords(text, ["finance", "fund", "budget", "investment", "ppp", "tariff", "incentive"]);
  const implementationHits = countKeywords(text, ["implementation", "delivery", "timeline", "phase", "agency", "disco", "execution"]);
  const inclusionHits = countKeywords(text, ["rural", "women", "youth", "equity", "inclusion", "community", "affordability"]);
  const governanceHits = countKeywords(text, ["regulation", "compliance", "oversight", "market", "licence", "governance"]);

  const coherence = clamp(Math.round(base * 0.92 + sectionCount * 2 + governanceHits * 1.6), 38, 96);
  const implementationReadiness = clamp(Math.round(base * 0.72 + implementationHits * 3 + sectionCount), 32, 92);
  const inclusivity = clamp(Math.round(base * 0.76 + inclusionHits * 3 + evidenceCount * 1.5), 28, 93);
  const financingArchitecture = clamp(Math.round(base * 0.62 + financeHits * 4 + evidenceCount * 1.2), 24, 90);
  const sdgAlignment = clamp(
    Math.round(base * 0.95 + (policy?.energySource === "renewable" ? 6 : 0) + (policy?.domain === "electricity" ? 5 : 2)),
    40,
    98
  );

  const ordered = [
    { key: "sdg", label: "SDG 7 alignment", value: sdgAlignment },
    { key: "coherence", label: "Policy coherence", value: coherence },
    { key: "implementation", label: "Implementation readiness", value: implementationReadiness },
    { key: "inclusivity", label: "Inclusivity & equity", value: inclusivity },
    { key: "financing", label: "Financing architecture", value: financingArchitecture },
  ];

  const strongest = [...ordered].sort((a, b) => b.value - a.value)[0];
  const weakest = [...ordered].sort((a, b) => a.value - b.value)[0];
  const middle = [...ordered].sort((a, b) => a.value - b.value)[2];

  const strengthText =
    strongest.key === "coherence"
      ? "The policy structure is more complete, with stronger institutional framing and clearer regulatory intent than the average public record."
      : strongest.key === "sdg"
        ? "The policy aligns strongly with access, reliability, and transition outcomes that matter most for SDG 7 delivery."
        : strongest.key === "implementation"
          ? "Delivery mechanisms are more visible here, with clearer execution language and more practical sequencing signals."
          : strongest.key === "inclusivity"
            ? "The document reflects broader inclusion signals, especially around affordability, underserved communities, or state-level access."
            : "The financing logic is more developed here, showing stronger market instruments, funding pathways, or investment direction.";

  const gapText =
    weakest.key === "financing"
      ? "Funding and blended finance pathways still appear less developed than the ambition level requires."
      : weakest.key === "implementation"
        ? "Delivery pace remains underdefined, so execution risk is still high even where policy intent is strong."
        : weakest.key === "inclusivity"
          ? "The access and equity case could go further, especially on affordability and who benefits first."
          : weakest.key === "coherence"
            ? "The policy direction is visible, but the document logic could be tighter across mandates, instruments, and sequencing."
            : "The SDG 7 linkage is present, but the practical path to access impact is not as explicit as it could be.";

  const riskText =
    middle.key === "implementation"
      ? "Implementation remains the most exposed area where policy intent and real-world outcomes can diverge."
      : middle.key === "financing"
        ? "Capital mobilisation may lag behind policy ambition if financing structures are not tightened early."
        : "The main risk is uneven delivery quality across institutions, especially where policy breadth outpaces execution readiness.";

  return { overall: Math.round(base), criteria: ordered, strongest, weakest, strengthText, gapText, riskText };
}

function buildScenario(policy: PublicPolicy | null, critique: ReturnType<typeof analyzePolicy>) {
  const renewableBoost = policy?.energySource === "renewable" ? 5 : 2;
  const baselineAccess = clamp(55 + Math.round((critique.overall - 50) / 6), 48, 74);
  const access2030 = clamp(baselineAccess + renewableBoost + Math.round(critique.criteria[2].value / 18), 56, 82);
  const access2040 = clamp(access2030 + 10 + Math.round(critique.criteria[1].value / 24), 66, 92);
  const access2050 = clamp(access2040 + 8 + Math.round(critique.criteria[0].value / 30), 74, 98);
  const growth2030 = clamp(Number((0.3 + critique.overall / 200).toFixed(1)), 0.3, 1.4);
  const growth2040 = clamp(Number((growth2030 + 0.8).toFixed(1)), 0.8, 2.3);
  const growth2050 = clamp(Number((growth2040 + 1.1).toFixed(1)), 1.2, 3.8);
  const jobs2030 = Math.round(55 + critique.overall * 0.9 + renewableBoost * 4);
  const jobs2040 = Math.round(jobs2030 * 2.8);
  const jobs2050 = Math.round(jobs2030 * 5.4);
  const emission2030 = -clamp(4 + Math.round((critique.criteria[0].value - 50) / 5), 4, 18);
  const emission2040 = -clamp(Math.abs(emission2030) + 12, 12, 34);
  const emission2050 = -clamp(Math.abs(emission2040) + 18, 24, 58);
  const fiscal2030 = Number((1.2 + critique.overall / 90).toFixed(1));
  const fiscal2040 = Number((fiscal2030 * 1.8).toFixed(1));
  const fiscal2050 = Number((fiscal2040 * 1.25).toFixed(1));

  return {
    title: `${titleCase(policy?.state) === "National" ? "Nigeria" : titleCase(policy?.state)} - ${titleCase(policy?.energySource) || "Energy"} scenario`,
    status: critique.criteria[2].value >= 65 ? "Running" : "Calibrating",
    access: [access2030, access2040, access2050],
    growth: [growth2030, growth2040, growth2050],
    jobs: [jobs2030, jobs2040, jobs2050],
    emissions: [emission2030, emission2040, emission2050],
    fiscal: [fiscal2030, fiscal2040, fiscal2050],
    sliders: [
      { label: "Renewable capacity addition (GW/yr)", value: Number((1.4 + renewableBoost * 0.36).toFixed(1)), max: 5.5, decimals: 1 },
      { label: "Grid and mini-grid deployment pace", value: critique.criteria[2].value, max: 100, decimals: 0 },
      { label: "Financing readiness index", value: critique.criteria[4].value, max: 100, decimals: 0 },
      { label: "Implementation confidence", value: critique.criteria[2].value + 4, max: 100, decimals: 0 },
    ],
    years: [2030, 2040, 2050],
    baseline: [55, 62, 70],
  };
}

function useCountUp(target: number, decimals = 0) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    let frame = 0;
    const started = performance.now();
    const duration = 950;
    const tick = (now: number) => {
      const progress = Math.min((now - started) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Number((target * eased).toFixed(decimals)));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, decimals]);

  return value;
}

function CountUpNumber({
  value,
  prefix = "",
  suffix = "",
  decimals = 0,
  className = "",
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
}) {
  const animated = useCountUp(value, decimals);
  return (
    <span className={className}>
      {prefix}
      {animated.toFixed(decimals)}
      {suffix}
    </span>
  );
}

export default function HomePage() {
  const router = useRouter();
  const { user } = useUser();
  const [insights, setInsights] = useState<InsightResponse | null>(null);
  const [rankings, setRankings] = useState<RankingItem[]>([]);
  const [repository, setRepository] = useState<RepoItem[]>([]);
  const [featuredRanking, setFeaturedRanking] = useState<RankingItem | null>(null);
  const [featuredPolicy, setFeaturedPolicy] = useState<PublicPolicy | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const [insightsRes, rankingsRes, repoRes] = await Promise.all([
        fetch("/api/public/insights", { cache: "no-store" }),
        fetch("/api/public/rankings?sortBy=avg", { cache: "no-store" }),
        fetch("/api/public/policies?limit=5", { cache: "no-store" }),
      ]);
      const [insightsJson, rankingsJson, repoJson] = await Promise.all([
        insightsRes.json(),
        rankingsRes.json(),
        repoRes.json(),
      ]);

      if (cancelled) return;
      setInsights(insightsJson ?? null);
      setRankings(rankingsJson?.items ?? []);
      setRepository((repoJson?.items ?? []).slice(0, 5));
      const source: RankingItem[] = rankingsJson?.items ?? [];
      if (source.length) setFeaturedRanking(source[Math.floor(Math.random() * source.length)]);
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadPolicy() {
      if (!featuredRanking?.slug && !featuredRanking?.id) return;
      const slugOrId = encodeURIComponent(featuredRanking.slug ?? featuredRanking.id);
      const res = await fetch(`/api/public/policy?slugOrId=${slugOrId}`, { cache: "no-store" });
      const json = await res.json();
      if (!cancelled) setFeaturedPolicy(json?.policy ?? null);
    }

    void loadPolicy();
    return () => {
      cancelled = true;
    };
  }, [featuredRanking]);

  const critique = useMemo(() => analyzePolicy(featuredPolicy, featuredRanking), [featuredPolicy, featuredRanking]);
  const scenario = useMemo(() => buildScenario(featuredPolicy, critique), [featuredPolicy, critique]);
  const leaderboard = (insights?.leaderboard ?? []).slice(0, 3);
  const topStates = (insights?.stateLeaderboard ?? []).slice(0, 3);
  const stateScores = insights?.stateScores ?? [];

  const openProtected = (path: string) => {
    router.push(user ? path : `/login?next=${encodeURIComponent(path)}`);
  };

  const featuredLocation =
    [featuredPolicy?.state, titleCase(featuredPolicy?.jurisdictionLevel)].filter(Boolean).join(", ") || "Nigeria";

  return (
    <div className={`${syne.variable} ${dmSans.variable}`}>
      <PublicNavbar />
      <PwaInstallPrompt />
      <main
        className="dyn-home-shell min-h-screen"
        style={
          {
            ["--font-dyn-heading" as string]: "var(--font-home-heading)",
            ["--font-dyn-body" as string]: "var(--font-home-body)",
          } as React.CSSProperties
        }
      >
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('${HERO_IMAGE}')` }} />
        <div className="absolute inset-0 bg-[#003869]/88" />
        <div className="relative mx-auto flex min-h-[76vh] max-w-7xl items-center justify-center px-6 py-20 text-center md:px-10 lg:px-14">
          <div className="max-w-4xl">
            <div className="mb-5 flex flex-wrap items-center justify-center gap-3 text-[11px] uppercase tracking-[0.28em] text-[#7fe7cb]">
              <span className="rounded-full border border-white/12 bg-white/6 px-4 py-2">Africa's energy policy intelligence layer</span>
              <span className="rounded-full border border-white/12 bg-white/6 px-4 py-2">Private drafting workspace</span>
            </div>
            <h1 className="mx-auto max-w-[20ch] text-[2.1rem] font-bold leading-[1.04] text-white sm:text-[2.75rem] md:text-[3.65rem]">
              Turn policy signals into decisions that electrify Africa
            </h1>
            <p className="mx-auto mt-6 max-w-3xl text-base leading-8 text-white/80 md:text-lg">
              An AI-powered platform that evaluates, synthesises, and simulates African energy policies, transforming incoherent frameworks into context-specific, evidence-driven solutions.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => router.push(user ? "/repository" : "/public/policies")}
                className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#003869] transition hover:bg-[#dcebfa]"
              >
                Explore repository
                <ArrowRight size={16} />
              </button>
              <button
                type="button"
                onClick={() => openProtected("/policies")}
                className="inline-flex items-center gap-2 rounded-full border border-white/18 bg-white/8 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/12"
              >
                Open private workspace
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-white/8">
        <div className="mx-auto grid max-w-7xl gap-4 px-6 py-10 md:grid-cols-2 md:px-10 lg:grid-cols-3 lg:px-14">
          {ENERGY_IMPACT_DATA.map((item) => (
            <article key={item.label} className="dyn-home-stat-card rounded-[1.6rem] p-5">
              <p className="text-[2rem] font-semibold leading-none text-white">
                <CountUpNumber value={item.value} prefix={item.prefix} suffix={item.suffix} decimals={item.decimals ?? 0} />
              </p>
              <p className="mt-3 max-w-[28ch] text-sm leading-6 text-white/66">{item.label}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-b border-white/8">
        <div className="mx-auto max-w-7xl px-6 py-16 md:px-10 lg:px-14">
          <div className="mb-8 max-w-3xl">
            <p className="text-xs uppercase tracking-[0.28em] text-[#49d2b6]">Platform capabilities</p>
            <h2 className="mt-3 text-3xl font-semibold text-white md:text-[2.7rem]">From raw policy to decision-ready intelligence.</h2>
            <p className="mt-4 text-base leading-7 text-white/66">
              Search public records, generate drafts, run critique, model scenarios, and export a stronger policy package from one connected system.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[
              { icon: Search, title: "Pan-African policy repository", body: "Continuously updated public policy records help you ground decisions in real market, regulatory, and state-level context.", tags: ["Live repository", "Nigeria focus", "Searchable"], href: user ? "/repository" : "/public/policies" },
              { icon: BrainCircuit, title: "AI policy critique engine", body: "Benchmark policy quality across coherence, implementation, inclusion, and financing, then generate stronger next drafts.", tags: ["SDG 7", "Evidence-aware", "Revision-ready"], href: "/critique" },
              { icon: LineChart, title: "Dynamic scenario modeling", body: "Project access, jobs, emissions, and fiscal implications over short, medium, and long horizons using live policy signals.", tags: ["2030-2050", "Comparative", "Decision support"], href: "/simulations" },
              { icon: Gauge, title: "Policy quality and impact index", body: "See how public policies rank, where state-level gaps sit, and what stronger examples are doing differently.", tags: ["Rankings", "State signals", "Trend view"], href: "/rankings" },
              { icon: Sparkles, title: "Private policy studio", body: "Keep uploads and AI drafts private until you are ready, then iterate with critique, simulation, and styled export.", tags: ["Private", "Workspace", "Styled PDF"], href: "/policies" },
              { icon: BookOpenText, title: "Context-specific generation", body: "Draft longer policy documents grounded in local conditions, then keep improving them with section-level regeneration.", tags: ["Long-form", "Editable", "Source-backed"], href: "/ai-generate" },
            ].map((item) => (
              <button
                key={item.title}
                type="button"
                onClick={() => (item.href === "/rankings" || item.href.includes("public") ? router.push(item.href) : openProtected(item.href))}
                className="dyn-home-card rounded-[1.8rem] p-6 text-left transition hover:border-[#0073d1]/40 hover:bg-white/[0.08]"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#0073d1]/25 bg-[#0073d1]/10 text-[#72c4ff]">
                  <item.icon size={21} />
                </div>
                <h3 className="mt-5 text-xl font-semibold text-white">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-white/64">{item.body}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {item.tags.map((tag) => (
                    <span key={tag} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-[#8ecbff]">
                      {tag}
                    </span>
                  ))}
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>
      <section className="border-b border-white/8">
        <div className="mx-auto grid max-w-7xl gap-6 px-6 py-16 md:px-10 xl:grid-cols-[1.35fr_0.95fr] lg:px-14">
          <div className="dyn-home-card rounded-[1.9rem] p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="text-xs uppercase tracking-[0.28em] text-[#49d2b6]">Policy repository</p>
                <h2 className="mt-3 text-3xl font-semibold text-white">Nigeria national policy intelligence</h2>
                <p className="mt-3 text-sm leading-7 text-white/64">
                  Search policies, regulations, and strategy documents, then carry the strongest public examples straight into your own workflow.
                </p>
              </div>
            </div>
            <div className="mt-6 rounded-[1.3rem] border border-white/8 bg-[#0c1625] px-4 py-3">
              <div className="flex items-center gap-3 text-white/46">
                <Search size={16} />
                <span className="text-sm">Search policies, institutions, regulations...</span>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {["All", "Electricity Act", "ETP", "Mini-grid", "NERC", "REA", "Off-grid"].map((chip) => (
                <span key={chip} className={`rounded-full border px-3 py-1.5 text-xs ${chip === "All" ? "border-[#49d2b6]/40 bg-[#49d2b6]/10 text-[#81ebd5]" : "border-white/10 bg-white/[0.03] text-white/62"}`}>
                  {chip}
                </span>
              ))}
            </div>
            <div className="mt-6 overflow-hidden rounded-[1.4rem] border border-white/8">
              {repository.map((policy, index) => {
                const Icon = [Bolt, Trees, SunMedium, ShieldAlert, BookOpenText][index % 5];
                const score =
                  rankings.find((item) => item.id === policy.id)?.latestOverallScore ??
                  rankings.find((item) => item.id === policy.id)?.avgOverallScore ??
                  60;
                return (
                  <div key={policy.id} className="flex items-center gap-4 border-b border-white/8 bg-[#0b1523] px-4 py-4 last:border-b-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[#0073d1]/25 bg-[#0073d1]/10 text-[#72c4ff]">
                      <Icon size={16} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-white">{policy.title}</p>
                      <p className="mt-1 text-xs text-white/48">
                        {titleCase(policy.type)} · {policy.state || titleCase(policy.jurisdictionLevel)} · {policy.policyYear || "Recent"}
                      </p>
                    </div>
                    <div className="rounded-full border border-[#49d2b6]/25 bg-[#49d2b6]/10 px-3 py-1 text-xs font-medium text-[#7de9d0]">
                      Score: <CountUpNumber value={Number(score)} decimals={0} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="dyn-home-card rounded-[1.9rem] p-6">
            <p className="text-xs uppercase tracking-[0.28em] text-[#49d2b6]">AI critique engine</p>
            <div className="mt-3">
              <h2 className="text-[2rem] font-semibold text-white">{featuredPolicy?.title ?? "Loading live policy critique..."}</h2>
              <p className="mt-2 text-sm text-white/56">
                {featuredLocation} · {titleCase(featuredPolicy?.domain)} · {titleCase(featuredPolicy?.energySource)}
              </p>
            </div>
            <div className="mt-5 rounded-[1.3rem] border border-[#0073d1]/18 bg-[#102034] p-4 text-sm leading-7 text-white/70">
              Overall score: <CountUpNumber value={critique.overall} suffix="/100" className="font-semibold text-[#79caff]" />. The current public signal suggests stronger direction in some areas than others, with the featured document anchored to live repository data on each load.
            </div>
            <div className="mt-5 space-y-3">
              {critique.criteria.map((row) => (
                <div key={row.key}>
                  <div className="mb-1 flex items-center justify-between text-sm text-white/76">
                    <span>{row.label}</span>
                    <span className="font-semibold text-white"><CountUpNumber value={row.value} suffix="%" /></span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/8">
                    <div className={`h-full rounded-full ${row.value >= 80 ? "bg-[#2fd0a2]" : row.value >= 65 ? "bg-[#5eb6ff]" : row.value >= 50 ? "bg-[#f4a83a]" : "bg-[#ff6b64]"}`} style={{ width: `${row.value}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-5 space-y-3">
              <div className="rounded-[1.25rem] border border-white/8 bg-[#0c1625] p-4">
                <p className="text-sm font-semibold text-[#7ce8d1]">Strength - {critique.strongest.label}</p>
                <p className="mt-2 text-sm leading-7 text-white/64">{critique.strengthText}</p>
              </div>
              <div className="rounded-[1.25rem] border border-white/8 bg-[#0c1625] p-4">
                <p className="text-sm font-semibold text-[#ffc86e]">Gap - {critique.weakest.label}</p>
                <p className="mt-2 text-sm leading-7 text-white/64">{critique.gapText}</p>
              </div>
              <div className="rounded-[1.25rem] border border-white/8 bg-[#0c1625] p-4">
                <p className="text-sm font-semibold text-[#ff8a84]">Risk - Implementation bottleneck</p>
                <p className="mt-2 text-sm leading-7 text-white/64">{critique.riskText}</p>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <button type="button" onClick={() => openProtected("/critique")} className="inline-flex items-center gap-2 rounded-full bg-[#0073d1] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0059a3]">
                Run critique
              </button>
              <button type="button" onClick={() => openProtected("/ai-generate")} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
                Generate improvement draft
              </button>
            </div>
          </div>
        </div>
      </section>

      <section id="modeling" className="border-b border-white/8">
        <div className="mx-auto grid max-w-7xl gap-6 px-6 py-16 md:px-10 xl:grid-cols-[1.35fr_0.95fr] lg:px-14">
          <div className="dyn-home-card rounded-[1.9rem] p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-[#49d2b6]">Scenario modelling</p>
                <h2 className="mt-3 text-3xl font-semibold text-white">Simulate policy impact across time horizons.</h2>
                <p className="mt-3 text-sm leading-7 text-white/64">
                  The live panel below uses the same featured public policy as the critique engine, so the scenario preview stays tied to the same policy signal.
                </p>
              </div>
              <span className="shrink-0 rounded-full border border-[#49d2b6]/22 bg-[#49d2b6]/12 px-3 py-1 text-xs font-semibold text-[#82ebd6]">
                {scenario.status}
              </span>
            </div>
            <div className="mt-6 rounded-[1.5rem] border border-white/8 bg-[#0b1523] p-5">
              <p className="text-sm font-semibold text-white">{scenario.title}</p>
              <p className="mt-1 text-xs text-white/46">Live preview from the current featured policy.</p>
              <div className="mt-6 h-[220px] rounded-[1.2rem] border border-white/8 bg-[linear-gradient(180deg,#0a1320_0%,#0d1829_100%)] p-4">
                <div className="relative h-full w-full">
                  <div className="absolute inset-x-0 bottom-8 h-px bg-white/8" />
                  <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
                    <defs>
                      <linearGradient id="accessFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="rgba(45,208,162,0.35)" />
                        <stop offset="100%" stopColor="rgba(45,208,162,0.02)" />
                      </linearGradient>
                    </defs>
                    <polyline fill="none" stroke="#2fd0a2" strokeWidth="2.4" points={`5,75 35,${92 - scenario.access[0]} 68,${92 - scenario.access[1]} 95,${92 - scenario.access[2]}`} />
                    <polyline fill="none" stroke="#5eb6ff" strokeDasharray="4 2" strokeWidth="2" points={`5,75 35,${92 - scenario.baseline[0]} 68,${92 - scenario.baseline[1]} 95,${92 - scenario.baseline[2]}`} />
                    <polygon fill="url(#accessFill)" points={`5,100 5,75 35,${92 - scenario.access[0]} 68,${92 - scenario.access[1]} 95,${92 - scenario.access[2]} 95,100`} />
                  </svg>
                  <div className="absolute bottom-0 left-0 right-0 flex justify-between text-[11px] uppercase tracking-[0.16em] text-white/34">
                    {scenario.years.map((year) => <span key={year}>{year}</span>)}
                  </div>
                </div>
              </div>
              <div className="mt-5 grid gap-4">
                {scenario.sliders.map((slider) => (
                  <div key={slider.label}>
                    <div className="mb-2 flex items-center justify-between text-sm text-white/66">
                      <span>{slider.label}</span>
                      <span className="font-semibold text-[#7de9d0]"><CountUpNumber value={slider.value} decimals={slider.decimals} /></span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/8">
                      <div className="h-full rounded-full bg-[#2fd0a2]" style={{ width: `${(slider.value / slider.max) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="dyn-home-card rounded-[1.9rem] p-6">
            <p className="text-xs uppercase tracking-[0.28em] text-[#49d2b6]">Projected outcomes</p>
            <div className="mt-5 overflow-hidden rounded-[1.35rem] border border-white/8">
              {[
                { label: "Energy access rate", values: scenario.access, suffix: "%" },
                { label: "GDP growth uplift", values: scenario.growth, prefix: "+", suffix: "%" },
                { label: "Jobs created (thousands)", values: scenario.jobs, suffix: "k" },
                { label: "CO2 emissions", values: scenario.emissions, suffix: "%" },
                { label: "Fiscal cost (NGN trillion)", values: scenario.fiscal, prefix: "₦" },
              ].map((row) => (
                <div key={row.label} className="grid grid-cols-[1.2fr_repeat(3,0.6fr)] gap-3 border-b border-white/8 bg-[#0b1523] px-4 py-4 last:border-b-0">
                  <p className="text-sm text-white/68">{row.label}</p>
                  {row.values.map((value, index) => (
                    <div key={`${row.label}-${scenario.years[index]}`} className="text-right">
                      <p className={`text-sm font-semibold ${index === 2 ? "text-[#2fd0a2]" : index === 1 ? "text-[#5eb6ff]" : "text-[#ffbf5a]"}`}>
                        <CountUpNumber value={Math.abs(Number(value))} prefix={Number(value) < 0 ? "-" : row.prefix ?? ""} suffix={row.suffix ?? ""} decimals={typeof value === "number" && !Number.isInteger(value) ? 1 : 0} />
                      </p>
                      <p className="mt-1 text-[11px] uppercase tracking-[0.14em] text-white/34">{scenario.years[index]}</p>
                    </div>
                  ))}
                </div>
              ))}
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <button type="button" onClick={() => openProtected("/simulations")} className="rounded-full bg-[#2fd0a2] px-5 py-3 text-sm font-semibold text-[#07131e] transition hover:bg-[#45dfb3]">
                Run full simulation
              </button>
              <button type="button" onClick={() => router.push("/rankings")} className="rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
                Compare scenarios
              </button>
            </div>
          </div>
        </div>
      </section>
      <section className="border-b border-white/8">
        <div className="mx-auto grid max-w-7xl gap-6 px-6 py-16 md:px-10 xl:grid-cols-[1.1fr_0.95fr] lg:px-14">
          <div className="dyn-home-card rounded-[1.9rem] p-6">
            <p className="text-xs uppercase tracking-[0.28em] text-[#49d2b6]">Rankings & index</p>
            <h2 className="mt-3 text-3xl font-semibold text-white">African energy policy quality and impact index.</h2>
            <p className="mt-3 text-sm leading-7 text-white/64">
              Annual public ranking signals highlight stronger policy examples, state-level momentum, and where the biggest delivery gaps still sit.
            </p>
            <div className="mt-6 space-y-3">
              {leaderboard.map((item, index) => {
                const score = item.avgScore ?? 0;
                const status = score >= 80 ? "Leading" : score >= 65 ? "Steady" : score >= 50 ? "Developing" : "Gaps";
                return (
                  <div key={`${item.id ?? item.title ?? "rank"}-${index}`} className="flex items-center gap-4 rounded-[1.3rem] border border-white/8 bg-[#0b1523] px-4 py-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full border border-[#0073d1]/28 bg-[#0073d1]/10 text-sm font-semibold text-[#82cfff]">
                      <CountUpNumber value={score} decimals={0} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-white">{item.title}</p>
                      <p className="mt-1 text-xs text-white/46">{item.state || titleCase(item.jurisdictionLevel)}</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-medium ${status === "Leading" ? "bg-[#2fd0a2]/12 text-[#84ead7]" : status === "Steady" ? "bg-[#5eb6ff]/12 text-[#8ecfff]" : status === "Developing" ? "bg-[#f4a83a]/12 text-[#ffcc7b]" : "bg-[#ff6b64]/12 text-[#ff9f9b]"}`}>
                      #{index + 1} {status}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="dyn-home-card rounded-[1.9rem] p-6">
            <p className="text-xs uppercase tracking-[0.28em] text-[#49d2b6]">Nigeria - state-level snapshot</p>
            <div className="mt-6 space-y-4">
              {topStates.map((item, index) => (
                <div key={item.state} className="flex items-center gap-4 rounded-[1.3rem] border border-white/8 bg-[#0b1523] px-4 py-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full border border-[#2fd0a2]/28 bg-[#2fd0a2]/10 text-sm font-semibold text-[#7fe7cf]">
                    {index + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-white">{item.state}</p>
                    <p className="mt-1 text-xs text-white/46">{item.policies} indexed public policies</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-semibold text-white"><CountUpNumber value={Number(item.avgScore ?? 0)} decimals={1} /></p>
                    <p className="text-[11px] uppercase tracking-[0.14em] text-white/32">score</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 space-y-3">
              {critique.criteria.map((row) => (
                <div key={`breakdown-${row.key}`}>
                  <div className="mb-1 flex items-center justify-between text-sm text-white/68">
                    <span>{row.label}</span>
                    <span className="font-semibold text-white"><CountUpNumber value={row.value} /></span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/8">
                    <div className={`h-full rounded-full ${row.value >= 80 ? "bg-[#2fd0a2]" : row.value >= 65 ? "bg-[#5eb6ff]" : row.value >= 50 ? "bg-[#f4a83a]" : "bg-[#ff6b64]"}`} style={{ width: `${row.value}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <button type="button" onClick={() => router.push("/rankings")} className="mt-6 text-sm font-semibold text-[#8dcfff] transition hover:text-white">
              Open rankings
            </button>
          </div>
        </div>
      </section>

      <section className="border-b border-white/8">
        <div className="mx-auto max-w-7xl px-6 py-16 md:px-10 lg:px-14">
          <div className="mb-8 max-w-3xl">
            <p className="text-xs uppercase tracking-[0.28em] text-[#49d2b6]">Nigeria map intelligence</p>
            <h2 className="mt-3 text-3xl font-semibold text-white">See public policy performance geographically.</h2>
            <p className="mt-3 text-sm leading-7 text-white/64">
              Hover a state, see the live profile, then move directly into the repository or rankings with better geographic context.
            </p>
          </div>
          <NigeriaPolicyMap
            scores={stateScores.map((item) => ({ state: item.state, score: item.avgScore, policies: item.policies }))}
            dark
            onSelectState={(state) => {
              const path = user ? `/repository?state=${encodeURIComponent(state)}` : `/public/policies?state=${encodeURIComponent(state)}`;
              router.push(path);
            }}
          />
        </div>
      </section>

      <section>
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 px-6 py-16 md:px-10 lg:flex-row lg:items-center lg:px-14">
          <div className="max-w-2xl">
            <p className="text-xs uppercase tracking-[0.28em] text-[#49d2b6]">Connected workflow</p>
            <h2 className="mt-3 text-3xl font-semibold text-white">Move from public signals to private execution without losing context.</h2>
            <p className="mt-4 text-sm leading-7 text-white/64">
              Discover a public policy, bring it into your workspace, improve the draft, test the scenario, and export a polished document when the work is ready.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={() => router.push(user ? "/repository" : "/public/policies")} className="rounded-full border border-white/12 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
              Open repository
            </button>
            <button type="button" onClick={() => openProtected("/ai-generate")} className="rounded-full bg-[#0073d1] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0059a3]">
              Start drafting
            </button>
          </div>
        </div>
      </section>
      </main>
      <PublicFooter />
    </div>
  );
}
