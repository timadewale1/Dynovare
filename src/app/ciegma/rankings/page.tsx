"use client";

import { useEffect, useMemo, useState } from "react";
import PublicNavbar from "@/components/public/PublicNavbar";
import PublicFooter from "@/components/public/PublicFooter";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter, Trophy, TrendingDown, TrendingUp, Sparkles, MapPinned, ArrowRight, ShieldCheck } from "lucide-react";
import { NIGERIA_STATES } from "@/lib/ngStates";
import { useRouter } from "next/navigation";
import { POLICY_DOMAINS, POLICY_ENERGY_SOURCES, policyDomainLabel, policyEnergySourceLabel } from "@/lib/policyTaxonomy";
import { useUser } from "@/components/providers/UserProvider";
import NigeriaPolicyMap from "@/components/public/NigeriaPolicyMap";
import { fetchWorkspacePolicies } from "@/lib/workspacePolicies";
import { importPublicPolicyToWorkspace } from "@/lib/policyWrites";
import toast from "react-hot-toast";
import ListPagination from "@/components/ui/ListPagination";
import { usePublicTheme } from "@/components/public/usePublicTheme";

type RankingItem = {
  id: string;
  title?: string | null;
  slug?: string | null;
  jurisdictionLevel?: string | null;
  state?: string | null;
  energySource?: string | null;
  domain?: string | null;
  critiquesCount?: number | null;
  avgOverallScore?: number | null;
  latestOverallScore?: number | null;
  trendDelta?: number | null;
};

type PublicInsights = {
  totals: {
    policies: number;
    critiques: number;
    averageScore: number | null;
  };
  stateScores: { state: string; score: number | null; policies: number }[];
};

function RankingFilters({
  search,
  setSearch,
  jurisdiction,
  setJurisdiction,
  stateFilter,
  setStateFilter,
  energySource,
  setEnergySource,
  domain,
  setDomain,
  sortBy,
  setSortBy,
  load,
  dark = false,
}: any) {
  return (
    <Card className={`${dark ? "rounded-[2rem] border border-white/10 bg-[#0b1523]/92 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.22)]" : "premium-card rounded-[2rem] p-5"}`}>
      <div className="mb-4 flex items-center gap-2">
        <Filter size={16} className={dark ? "text-[#7ac8ff]" : "text-[#0073d1]"} />
        <p className={`font-bold ${dark ? "text-white" : "text-blue-deep"}`}>Filters</p>
      </div>

      <div className="flex flex-col gap-4">
        <div>
            <p className={`mb-2 text-sm font-medium ${dark ? "text-white" : ""}`}>Search</p>
            <div className="flex gap-2">
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search title, state, domain..." className={dark ? "border-white/10 bg-[#09111b] text-white placeholder:text-white/52" : ""} />
            <Button onClick={load} className="rounded-full bg-[#0073d1] hover:bg-[#003869]">Search</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
          <div>
            <p className={`mb-2 text-sm font-medium ${dark ? "text-white" : ""}`}>Jurisdiction</p>
            <Select value={jurisdiction} onValueChange={(value) => { setJurisdiction(value); if (value === "federal") setStateFilter("all"); }}>
              <SelectTrigger className={dark ? "border-white/10 bg-[#09111b] text-white" : ""}><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="federal">Federal</SelectItem>
                <SelectItem value="state">State</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <p className={`mb-2 text-sm font-medium ${dark ? "text-white" : ""}`}>State</p>
            <Select value={stateFilter} onValueChange={setStateFilter} disabled={jurisdiction === "federal"}>
              <SelectTrigger className={dark ? "border-white/10 bg-[#09111b] text-white" : ""}><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All states</SelectItem>
                {NIGERIA_STATES.map((state) => <SelectItem key={state} value={state}>{state}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <p className={`mb-2 text-sm font-medium ${dark ? "text-white" : ""}`}>Energy source</p>
            <Select value={energySource} onValueChange={setEnergySource}>
              <SelectTrigger className={dark ? "border-white/10 bg-[#09111b] text-white" : ""}><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {POLICY_ENERGY_SOURCES.map((item) => <SelectItem key={item} value={item}>{policyEnergySourceLabel(item)}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <p className={`mb-2 text-sm font-medium ${dark ? "text-white" : ""}`}>Domain</p>
            <Select value={domain} onValueChange={setDomain}>
              <SelectTrigger className={dark ? "border-white/10 bg-[#09111b] text-white" : ""}><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {POLICY_DOMAINS.map((item) => <SelectItem key={item} value={item}>{policyDomainLabel(item)}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <p className={`mb-2 text-sm font-medium ${dark ? "text-white" : ""}`}>Sort by</p>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className={dark ? "border-white/10 bg-[#09111b] text-white" : ""}><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="avg">Average score</SelectItem>
                <SelectItem value="latest">Latest score</SelectItem>
                <SelectItem value="trend">Trend</SelectItem>
                <SelectItem value="count">Critique count</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </Card>
  );
}

function RankingList({
  items,
  loading,
  router,
  internal = false,
  onApply,
  page,
  onPageChange,
  dark = false,
}: {
  items: RankingItem[];
  loading: boolean;
  router: any;
  internal?: boolean;
  onApply?: (item: RankingItem) => void;
  page: number;
  onPageChange: (page: number) => void;
  dark?: boolean;
}) {
  const PAGE_SIZE = 5;
  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const pagedItems = items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <Card className={`${dark ? "rounded-[2rem] border border-white/10 bg-[#0b1523]/92 p-4 shadow-[0_24px_80px_rgba(0,0,0,0.22)]" : "premium-card rounded-[2rem] p-4"}`}>
      {loading ? (
        <p className={`text-sm ${dark ? "text-white/58" : "text-[var(--text-secondary)]"}`}>Loading rankings...</p>
      ) : items.length === 0 ? (
        <p className={`text-sm ${dark ? "text-white/58" : "text-[var(--text-secondary)]"}`}>No rankings match your filters.</p>
      ) : (
        <div className="space-y-3">
          {pagedItems.map((item, index) => (
            <div key={item.id} className={`rounded-[1.5rem] border p-4 transition hover:-translate-y-0.5 ${dark ? "border-white/10 bg-white/[0.04] hover:bg-white/[0.06]" : "bg-white/80 hover:shadow-sm"}`}>
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">#{(page - 1) * PAGE_SIZE + index + 1}</Badge>
                    <p className={`max-w-[560px] truncate font-bold ${dark ? "text-white" : "text-blue-deep"}`}>{item.title ?? "Untitled policy"}</p>
                    {item.jurisdictionLevel ? <Badge variant="outline" className={dark ? "border-white/10 bg-white/[0.03] text-white/72" : ""}>{item.jurisdictionLevel === "federal" ? "Federal" : item.state ?? "State"}</Badge> : null}
                    {item.energySource ? <Badge variant="outline" className={dark ? "border-white/10 bg-white/[0.03] text-white/72" : ""}>{policyEnergySourceLabel(item.energySource)}</Badge> : null}
                    {item.domain ? <Badge variant="outline" className={dark ? "border-white/10 bg-white/[0.03] text-white/72" : ""}>{policyDomainLabel(item.domain)}</Badge> : null}
                  </div>
                  <div className={`mt-2 flex flex-wrap items-center gap-2 text-sm ${dark ? "text-white/72" : ""}`}>
                    <Badge variant="outline" className={dark ? "border-white/10 bg-white/[0.03] text-white/72" : ""}>Avg</Badge>
                    <span className="font-bold">{typeof item.avgOverallScore === "number" ? `${item.avgOverallScore}/100` : "-"}</span>
                    <Badge variant="outline" className={dark ? "border-white/10 bg-white/[0.03] text-white/72" : ""}>Latest</Badge>
                    <span className="font-bold">{typeof item.latestOverallScore === "number" ? `${item.latestOverallScore}/100` : "-"}</span>
                    <Badge variant="outline" className={dark ? "border-white/10 bg-white/[0.03] text-white/72" : ""}>Trend</Badge>
                    <span className="inline-flex items-center gap-1 font-semibold">
                      {Number(item.trendDelta ?? 0) > 0 ? <TrendingUp size={14} className="text-green-600" /> : null}
                      {Number(item.trendDelta ?? 0) < 0 ? <TrendingDown size={14} className="text-red-600" /> : null}
                      {typeof item.trendDelta === "number" ? item.trendDelta : "-"}
                    </span>
                    <Badge variant="outline" className={dark ? "border-white/10 bg-white/[0.03] text-white/72" : ""}>Critiques</Badge>
                    <span className="font-bold">{item.critiquesCount ?? 0}</span>
                  </div>
                  <div className="mt-3 grid gap-2 sm:grid-cols-3">
                    {[
                      {
                        label: "Score strength",
                        value:
                          typeof item.avgOverallScore === "number"
                            ? item.avgOverallScore >= 80
                              ? "Leading"
                              : item.avgOverallScore >= 65
                                ? "Steady"
                                : item.avgOverallScore >= 50
                                  ? "Developing"
                                  : "Gaps"
                            : "Pending",
                      },
                      {
                        label: "Jurisdiction focus",
                        value: item.jurisdictionLevel === "federal" ? "National" : item.state ?? "State",
                      },
                      {
                        label: "Review signal",
                        value: Number(item.critiquesCount ?? 0) >= 3 ? "Deeply reviewed" : "Early-stage signal",
                      },
                    ].map((signal) => (
                      <div
                        key={`${item.id}-${signal.label}`}
                        className={`rounded-2xl border px-3 py-3 ${dark ? "border-white/10 bg-white/[0.03]" : "border-[#d8e6ec] bg-[#f8fbff]"}`}
                      >
                        <p className={`text-[11px] uppercase tracking-[0.18em] ${dark ? "text-white/46" : "text-[#7890a5]"}`}>{signal.label}</p>
                        <p className={`mt-2 text-sm font-semibold ${dark ? "text-white" : "text-blue-deep"}`}>{signal.value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button variant="secondary" className={dark ? "bg-white text-[#003869] hover:bg-[#dcebfa]" : ""} onClick={() => router.push(internal ? `/repository/${item.slug ?? item.id}` : `/public/policies/${item.slug ?? item.id}`)}>View</Button>
                  {internal ? (
                    <Button variant="outline" className={`gap-2 ${dark ? "border-white/12 bg-transparent text-white hover:bg-white/8" : ""}`} onClick={() => onApply?.(item)}>
                      <Sparkles size={14} />
                      Apply to my work
                    </Button>
                  ) : (
                    <Button variant="outline" className={dark ? "border-white/12 bg-transparent text-white hover:bg-white/8" : ""} onClick={() => router.push("/register")}>Open private workspace</Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <ListPagination
        page={page}
        totalPages={totalPages}
        totalItems={items.length}
        pageSize={PAGE_SIZE}
        itemLabel="ranked policies"
        onPageChange={onPageChange}
      />
    </Card>
  );
}

function PublicRankingsView() {
  const router = useRouter();
  const { theme, mounted } = usePublicTheme();
  const dark = !mounted || theme === "dark";
  const [items, setItems] = useState<RankingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [jurisdiction, setJurisdiction] = useState("all");
  const [stateFilter, setStateFilter] = useState("all");
  const [energySource, setEnergySource] = useState("all");
  const [domain, setDomain] = useState("all");
  const [sortBy, setSortBy] = useState("avg");
  const [page, setPage] = useState(1);

  const load = async () => {
    setLoading(true);
    const qs = new URLSearchParams({ jurisdiction, state: stateFilter, energySource, domain, sortBy, search });
    const res = await fetch(`/api/public/rankings?${qs.toString()}`);
    const data = await res.json();
    setItems(Array.isArray(data?.items) ? data.items : []);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, [jurisdiction, stateFilter, energySource, domain, sortBy]);

  useEffect(() => {
    setPage(1);
  }, [jurisdiction, stateFilter, energySource, domain, sortBy, search, items.length]);

  const summary = useMemo(() => {
    const avgRows = items.filter((item) => typeof item.avgOverallScore === "number");
    return {
      policies: items.length,
      totalCritiques: items.reduce((sum, item) => sum + Number(item.critiquesCount ?? 0), 0),
      average:
        avgRows.length > 0
          ? Math.round((avgRows.reduce((sum, item) => sum + Number(item.avgOverallScore ?? 0), 0) / avgRows.length) * 10) / 10
          : null,
    };
  }, [items]);

  const rankingSignals = useMemo(() => {
    const topMover = [...items]
      .filter((item) => typeof item.trendDelta === "number")
      .sort((a, b) => Number(b.trendDelta ?? 0) - Number(a.trendDelta ?? 0))[0] ?? null;
    const strongest = [...items]
      .filter((item) => typeof item.avgOverallScore === "number")
      .sort((a, b) => Number(b.avgOverallScore ?? 0) - Number(a.avgOverallScore ?? 0))[0] ?? null;
    const mostReviewed = [...items]
      .sort((a, b) => Number(b.critiquesCount ?? 0) - Number(a.critiquesCount ?? 0))[0] ?? null;

    return { topMover, strongest, mostReviewed };
  }, [items]);

  const stateScores = useMemo(
    () =>
      items
        .filter((item) => item.state)
        .reduce<{ state: string; score: number | null; policies: number }[]>((acc, item) => {
          const state = item.state as string;
          const existing = acc.find((entry) => entry.state === state);
          const score = item.avgOverallScore ?? item.latestOverallScore ?? null;
          if (!existing) {
            acc.push({ state, score, policies: 1 });
          } else {
            existing.policies += 1;
            if (typeof score === "number" && (existing.score === null || score > existing.score)) {
              existing.score = score;
            }
          }
          return acc;
        }, []),
    [items]
  );

  return (
    <div className={dark ? "min-h-screen bg-[radial-gradient(circle_at_top,rgba(0,115,209,0.12),transparent_24%),linear-gradient(180deg,#09111b_0%,#0a1320_40%,#08101a_100%)] text-white" : "min-h-screen bg-[linear-gradient(180deg,#eff7fd_0%,#f8fbff_30%,#ffffff_100%)] text-[#003869]"}>
      <PublicNavbar />

      <main className="mx-auto max-w-7xl px-6 py-10 md:px-10 lg:px-14">
        <div className="grid gap-5 xl:grid-cols-[1.08fr_0.92fr]">
          <Card className={`${dark ? "rounded-[2rem] border border-white/10 bg-[#0b1523]/92 p-7 shadow-[0_24px_80px_rgba(0,0,0,0.22)]" : "premium-card rounded-[2rem] p-7"}`}>
            <div className="flex items-center gap-3">
              <div className={`rounded-2xl p-3 ${dark ? "border border-[#0073d1]/20 bg-[#0073d1]/10 text-[#7ac8ff]" : "bg-[rgba(0,115,209,0.09)] text-[#0073d1]"}`}>
                <Trophy size={24} />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-[#49d2b6]">Public rankings</p>
                <h1 className={`mt-2 text-3xl font-semibold ${dark ? "text-white" : "text-blue-deep"}`}>See which public policies are setting the pace.</h1>
                <p className={`mt-1 text-sm ${dark ? "text-white/58" : "text-[var(--text-secondary)]"}`}>
                  Compare quality, trend movement, and review volume across public policies.
                </p>
              </div>
            </div>
          </Card>

          <Card className={`${dark ? "rounded-[2rem] border border-white/10 bg-[linear-gradient(135deg,#07121e_0%,#0b1523_50%,#10253f_100%)] p-7 text-white shadow-[0_24px_80px_rgba(0,0,0,0.22)]" : "rounded-[2rem] bg-[linear-gradient(135deg,#00223f_0%,#0073d1_100%)] p-7 text-white shadow-sm"}`}>
            <p className="text-xs uppercase tracking-[0.22em] text-[#49d2b6]">Snapshot</p>
            <h2 className="mt-3 text-2xl font-semibold">Public ranking intelligence at a glance.</h2>
              <div className="mt-4 grid grid-cols-3 gap-3">
              <div className="min-w-0">
                <p className="truncate text-[1.9rem] leading-none font-black tabular-nums">{summary.policies}</p>
                <p className="text-xs text-white/70">Policies</p>
              </div>
              <div className="min-w-0">
                <p className="truncate text-[1.9rem] leading-none font-black tabular-nums">{summary.totalCritiques}</p>
                <p className="text-xs text-white/70">Critiques</p>
              </div>
              <div className="min-w-0">
                <p className="truncate text-[1.9rem] leading-none font-black tabular-nums">{summary.average ? summary.average.toFixed(1) : "-"}</p>
                <p className="text-xs text-white/70">Avg score</p>
              </div>
            </div>
          </Card>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
          <Card className={`${dark ? "rounded-[2rem] border border-white/10 bg-[#0b1523]/92 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.22)]" : "premium-card rounded-[2rem] p-6"}`}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-[#49d2b6]">Nigeria map</p>
                <h2 className={`mt-2 text-2xl font-semibold ${dark ? "text-white" : "text-blue-deep"}`}>Track state-level public signals.</h2>
              </div>
              <MapPinned className={dark ? "text-[#7ac8ff]" : "text-[#0073d1]"} />
            </div>
            <div className="mt-5">
              <NigeriaPolicyMap
                scores={stateScores}
                compact
                dark={dark}
                showHoverCard
                onSelectState={(state) => router.push(`/public/policies?jurisdictionLevel=state&state=${encodeURIComponent(state)}`)}
              />
            </div>
          </Card>

          <Card className={`${dark ? "rounded-[2rem] border border-white/10 bg-[#0b1523]/92 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.22)]" : "premium-card rounded-[2rem] p-6"}`}>
            <div className="flex items-center gap-3">
              <ShieldCheck size={18} className={dark ? "text-[#7ce8d1]" : "text-[#0073d1]"} />
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-[#49d2b6]">What to do next</p>
                <h2 className={`mt-2 text-2xl font-semibold ${dark ? "text-white" : "text-blue-deep"}`}>Use the strongest public examples deliberately.</h2>
              </div>
            </div>
            <div className="mt-5 space-y-3">
              {[
                "Look for high-average policies with strong critique volume, not just one-off scores.",
                "Open the repository after filtering to inspect the policy context behind the ranking.",
                "Create an account to import a public policy into your private workspace and improve it.",
              ].map((item) => (
                <div key={item} className={`${dark ? "rounded-[1.4rem] border border-white/10 bg-white/[0.04]" : "rounded-[1.4rem] border border-[#d8e6ec] bg-white"} p-4`}>
                  <p className={`text-sm leading-7 ${dark ? "text-white/64" : "text-[var(--text-secondary)]"}`}>{item}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <section className="mt-6 grid gap-4 lg:grid-cols-3">
          {[
            {
              label: "Top mover",
              title: rankingSignals.topMover?.title ?? "No trend data yet",
              body: rankingSignals.topMover ? `${rankingSignals.topMover.trendDelta ?? 0} point movement across recent critiques.` : "Run more critiques to surface movement between reviews.",
            },
            {
              label: "Strongest average",
              title: rankingSignals.strongest?.title ?? "No scoring data yet",
              body: rankingSignals.strongest ? `${rankingSignals.strongest.avgOverallScore ?? "-"} average score across visible ranking items.` : "Average score cards will populate as public critique data grows.",
            },
            {
              label: "Most reviewed",
              title: rankingSignals.mostReviewed?.title ?? "No review leader yet",
              body: rankingSignals.mostReviewed ? `${rankingSignals.mostReviewed.critiquesCount ?? 0} critiques logged against this public policy.` : "Review depth appears here when enough public critique records exist.",
            },
          ].map((item) => (
            <Card key={item.label} className={`${dark ? "rounded-[1.75rem] border border-white/10 bg-[#0b1523]/92 p-5 shadow-[0_24px_60px_rgba(0,0,0,0.2)]" : "premium-card rounded-[1.75rem] p-5"}`}>
              <p className="text-[11px] uppercase tracking-[0.22em] text-[#49d2b6]">{item.label}</p>
              <h3 className={`mt-3 text-lg font-semibold ${dark ? "text-white" : "text-blue-deep"}`}>{item.title}</h3>
              <p className={`mt-3 text-sm leading-7 ${dark ? "text-white/64" : "text-[var(--text-secondary)]"}`}>{item.body}</p>
            </Card>
          ))}
        </section>

        <div className="mt-6 space-y-6">
          <RankingFilters
            search={search}
            setSearch={setSearch}
            jurisdiction={jurisdiction}
            setJurisdiction={setJurisdiction}
            stateFilter={stateFilter}
            setStateFilter={setStateFilter}
            energySource={energySource}
            setEnergySource={setEnergySource}
            domain={domain}
            setDomain={setDomain}
            sortBy={sortBy}
            setSortBy={setSortBy}
            load={load}
            dark={dark}
          />
          <RankingList items={items} loading={loading} router={router} page={page} onPageChange={setPage} dark={dark} />
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}

function InternalRankingsView() {
  const router = useRouter();
  const { user, profile } = useUser();
  const [items, setItems] = useState<RankingItem[]>([]);
  const [insights, setInsights] = useState<PublicInsights | null>(null);
  const [workspaceCount, setWorkspaceCount] = useState(0);
  const [draftCount, setDraftCount] = useState(0);
  const [search, setSearch] = useState("");
  const [jurisdiction, setJurisdiction] = useState("all");
  const [stateFilter, setStateFilter] = useState("all");
  const [energySource, setEnergySource] = useState("all");
  const [domain, setDomain] = useState("all");
  const [sortBy, setSortBy] = useState("avg");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const [rankRes, insightRes, workspacePolicies] = await Promise.all([
      fetch(`/api/public/rankings?${new URLSearchParams({ jurisdiction, state: stateFilter, energySource, domain, sortBy, search }).toString()}`),
      fetch("/api/public/insights"),
      fetchWorkspacePolicies(user.uid, {}),
    ]);

    const rankData = await rankRes.json();
    const insightData = await insightRes.json();
    setItems(Array.isArray(rankData?.items) ? rankData.items : []);
    setInsights(insightRes.ok ? insightData : null);
    setWorkspaceCount(workspacePolicies.length);
    setDraftCount(workspacePolicies.filter((item: any) => item.type === "ai_generated").length);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, [user, jurisdiction, stateFilter, energySource, domain, sortBy]);

  useEffect(() => {
    setPage(1);
  }, [jurisdiction, stateFilter, energySource, domain, sortBy, search, items.length]);

  const applyToWorkspace = async (item: RankingItem) => {
    if (!user) return;
    try {
      const imported = await importPublicPolicyToWorkspace({
        uid: user.uid,
        userName: profile?.fullName ?? null,
        userEmail: user.email ?? null,
        publicPolicyId: item.id,
      });
      toast.success(imported.reused ? "Workspace copy already exists. Opening it now..." : "Policy added to your workspace");
      router.push(`/policies/${imported.slug}`);
    } catch (error: any) {
      console.error(error);
      toast.error(error?.message || "Could not add this policy to your workspace");
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <section className="overflow-hidden rounded-[2.25rem] bg-[linear-gradient(135deg,#001b33_0%,#002c52_52%,#0073d1_100%)] p-8 text-white shadow-[0_30px_90px_rgba(0,56,105,0.16)]">
          <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
            <div>
              <Badge variant="outline" className="border-white/20 bg-white/10 text-white">Workspace intelligence</Badge>
              <h1 className="mt-5 text-3xl font-black tracking-tight md:text-4xl">Use public ranking signals to guide your next move.</h1>
              <p className="mt-4 max-w-2xl text-white/76">
                {profile?.fullName ? `${profile.fullName}, ` : ""}compare what is performing well publicly, then turn those signals into stronger drafting and review decisions in your workspace.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Card className="rounded-[1.75rem] border-white/10 bg-white/8 p-5 text-white">
                <p className="text-xs uppercase tracking-[0.2em] text-white/68">Workspace docs</p>
                <p className="mt-2 truncate text-[1.9rem] leading-none font-black tabular-nums">{workspaceCount}</p>
                <p className="mt-1 text-sm text-white/68">Private policies and drafts</p>
              </Card>
              <Card className="rounded-[1.75rem] border-white/10 bg-white/8 p-5 text-white">
                <p className="text-xs uppercase tracking-[0.2em] text-white/68">AI drafts</p>
                <p className="mt-2 truncate text-[1.9rem] leading-none font-black tabular-nums">{draftCount}</p>
                <p className="mt-1 text-sm text-white/68">Editable studio drafts</p>
              </Card>
              <Card className="rounded-[1.75rem] border-white/10 bg-white/8 p-5 text-white">
                <p className="text-xs uppercase tracking-[0.2em] text-white/68">Public score avg</p>
                <p className="mt-2 truncate text-[1.9rem] leading-none font-black tabular-nums">{insights?.totals.averageScore ? insights.totals.averageScore.toFixed(1) : "-"}</p>
                <p className="mt-1 text-sm text-white/68">Visible public policy average</p>
              </Card>
              <Card className="rounded-[1.75rem] border-white/10 bg-white/8 p-5 text-white">
                <p className="text-xs uppercase tracking-[0.2em] text-white/68">Critique evidence</p>
                <p className="mt-2 truncate text-[1.9rem] leading-none font-black tabular-nums">{insights?.totals.critiques ?? 0}</p>
                <p className="mt-1 text-sm text-white/68">Public critiques logged</p>
              </Card>
            </div>
          </div>
        </section>

        <div className="grid gap-5 lg:grid-cols-[1.08fr_0.92fr]">
          <Card className="premium-card rounded-[2rem] p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-[var(--text-secondary)]">National map</p>
                <h2 className="mt-2 text-xl font-black text-blue-deep">Find where performance is strongest and where gaps remain</h2>
              </div>
              <MapPinned className="text-[#0073d1]" />
            </div>
            <div className="mt-5">
              <NigeriaPolicyMap
                scores={insights?.stateScores ?? []}
                compact
                showHoverCard
                onSelectState={(state) => router.push(`/repository?jurisdictionLevel=state&state=${encodeURIComponent(state)}`)}
              />
            </div>
          </Card>

          <Card className="premium-card rounded-[2rem] p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-[rgba(0,115,209,0.09)] p-3 text-[#0073d1]">
                <ShieldCheck size={20} />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-[var(--text-secondary)]">Fast actions</p>
                <h2 className="mt-1 text-2xl font-black text-blue-deep">Turn ranking insight into action quickly.</h2>
              </div>
            </div>
            <div className="mt-5 space-y-3">
              {[
                { label: "Open Policy Studio", href: "/policies" },
                { label: "Run AI critique", href: "/critique" },
                { label: "Run simulations", href: "/simulations" },
                { label: "Generate a draft", href: "/ai-generate" },
              ].map((item) => (
                <Button key={item.label} variant="outline" className="w-full justify-between rounded-full" onClick={() => router.push(item.href)}>
                  {item.label} <ArrowRight size={15} />
                </Button>
              ))}
            </div>
          </Card>
        </div>

        <RankingFilters
          search={search}
          setSearch={setSearch}
          jurisdiction={jurisdiction}
          setJurisdiction={setJurisdiction}
          stateFilter={stateFilter}
          setStateFilter={setStateFilter}
          energySource={energySource}
          setEnergySource={setEnergySource}
          domain={domain}
          setDomain={setDomain}
          sortBy={sortBy}
          setSortBy={setSortBy}
          load={load}
        />

        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-[var(--text-secondary)]">Ranked public policies</p>
            <h2 className="mt-1 text-2xl font-black text-blue-deep">Use public signals to sharpen the work in your workspace.</h2>
          </div>
          <Button variant="outline" className="rounded-full gap-2" onClick={() => router.push("/repository")}>
            Open repository <ArrowRight size={15} />
          </Button>
        </div>

        <RankingList items={items} loading={loading} router={router} internal onApply={applyToWorkspace} page={page} onPageChange={setPage} />
      </div>
    </DashboardLayout>
  );
}

export default function RankingsPage() {
  const { user, loading } = useUser();

  if (loading) {
    return <div className="min-h-screen bg-[linear-gradient(180deg,#f5fbff_0%,#ffffff_24%)]" />;
  }

  return user ? <InternalRankingsView /> : <PublicRankingsView />;
}
