"use client";

import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import ProtectedRoute from "@/components/guards/ProtectedRoute";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Trophy,
  TrendingUp,
  TrendingDown,
  Minus,
  GitCompare,
  ChevronDown,
} from "lucide-react";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
} from "firebase/firestore";
import { useRouter } from "next/navigation";
import { NIGERIA_STATES } from "@/lib/ngStates";
import { CRITIQUE_STANDARDS } from "@/lib/critiqueStandards";

type PolicyStats = {
  policyId: string;

  // Different possible field names (we normalize below)
  title?: string | null;
  slug?: string | null;

  policyTitle?: string | null;
  policySlug?: string | null;

  country?: string | null;
  jurisdictionLevel?: string | null;
  state?: string | null;
  policyYear?: number | null;
  type?: string | null;
  sector?: string | null;

  critiquesCount?: number | null;
  sumOverallScore?: number | null;
  avgOverallScore?: number | null;
  latestOverallScore?: number | null;
  trendDelta?: number | null;

  latestCritiqueId?: string | null;
  latestCritiquedAt?: any;

  createdAt?: any;
  updatedAt?: any;
};

type CritiqueDoc = {
  critiqueId?: string;
  createdAt?: any;
  selectedStandards?: string[];
  perStandard?: { standardId: string; score: number; suggestions?: string[] }[];
  overallScore?: number;
};

const SECTORS = [
  "all",
  "Electricity",
  "Renewable Energy",
  "Oil & Gas",
  "Clean Cooking",
  "Transport",
  "Industry",
  "Buildings",
  "Agriculture",
  "Waste",
  "Climate & Emissions",
];

const TYPES = ["all", "uploaded", "ai_generated", "public_source"] as const;

function scoreRating(score: number | null) {
  if (typeof score !== "number") return { label: "—", variant: "outline" as const };
  if (score >= 80) return { label: "Strong", variant: "secondary" as const };
  if (score >= 65) return { label: "Moderate", variant: "outline" as const };
  return { label: "Weak", variant: "destructive" as const };
}

export default function RankingsPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<PolicyStats[]>([]);

  // filters
  const [draftSearch, setDraftSearch] = useState("");
  const [search, setSearch] = useState("");

  const [jurisdiction, setJurisdiction] = useState<"all" | "federal" | "state">(
    "all"
  );
  const [stateFilter, setStateFilter] = useState<string>("all");
  const [sector, setSector] = useState<string>("all");
  const [type, setType] = useState<(typeof TYPES)[number]>("all");
  const [sortBy, setSortBy] = useState<"avg" | "latest" | "trend" | "count">(
    "avg"
  );

  // compare
  const [compareMode, setCompareMode] = useState(false);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [compareCritiques, setCompareCritiques] = useState<
    Record<string, CritiqueDoc | null>
  >({});
  const [loadingCompareCritiques, setLoadingCompareCritiques] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);

      const q = query(
        collection(db, "policyStats"),
        orderBy("updatedAt", "desc"),
        limit(250)
      );

      const snap = await getDocs(q);
      const rows = snap.docs.map(
        (d) => ({ ...(d.data() as any), policyId: d.id } as PolicyStats)
      );

      setStats(rows);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (jurisdiction === "federal") setStateFilter("all");
  }, [jurisdiction]);

  const normalized = useMemo(() => {
    return stats.map((s) => {
      // ✅ Fix Untitled: support both title/slug AND policyTitle/policySlug
      const rawTitle = String((s.title ?? s.policyTitle ?? "") as any).trim();
      const rawSlug = String((s.slug ?? s.policySlug ?? "") as any).trim();

      const critiquesCount = Number(s.critiquesCount ?? 0);

      // If avgOverallScore is missing but sum/count exist, compute client-side
      const avgFromSum =
        typeof s.sumOverallScore === "number" && critiquesCount > 0
          ? Math.round((s.sumOverallScore / critiquesCount) * 10) / 10
          : null;

      const avgOverallScore =
        typeof s.avgOverallScore === "number" ? s.avgOverallScore : avgFromSum;

      const latestOverallScore =
        typeof s.latestOverallScore === "number" ? s.latestOverallScore : null;

      const trendDelta = typeof s.trendDelta === "number" ? s.trendDelta : null;

      // use avg if available else latest for rating
      const ratingBase =
        typeof avgOverallScore === "number"
          ? avgOverallScore
          : typeof latestOverallScore === "number"
          ? latestOverallScore
          : null;

      const rating = scoreRating(ratingBase);

      return {
        ...s,
        title: rawTitle || "Untitled",
        slug: rawSlug || null,
        critiquesCount,
        avgOverallScore,
        latestOverallScore,
        trendDelta,
        rating,
      };
    });
  }, [stats]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    return normalized
      .filter((s: any) => {
        if (jurisdiction !== "all" && (s.jurisdictionLevel ?? null) !== jurisdiction)
          return false;
        if (stateFilter !== "all" && (s.state ?? null) !== stateFilter) return false;
        if (sector !== "all" && (s.sector ?? null) !== sector) return false;
        if (type !== "all" && (s.type ?? null) !== type) return false;

        if (!q) return true;

        const hay = [
          s.title,
          s.country,
          s.jurisdictionLevel,
          s.state,
          s.sector,
          s.type,
          s.policyYear ? String(s.policyYear) : "",
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return hay.includes(q);
      })
      .sort((a: any, b: any) => {
        const aAvg = a.avgOverallScore ?? -1;
        const bAvg = b.avgOverallScore ?? -1;

        const aLatest = a.latestOverallScore ?? -1;
        const bLatest = b.latestOverallScore ?? -1;

        const aTrend = a.trendDelta ?? -9999;
        const bTrend = b.trendDelta ?? -9999;

        const aCount = a.critiquesCount ?? 0;
        const bCount = b.critiquesCount ?? 0;

        if (sortBy === "avg") return bAvg - aAvg;
        if (sortBy === "latest") return bLatest - aLatest;
        if (sortBy === "trend") return bTrend - aTrend;
        return bCount - aCount;
      });
  }, [normalized, search, jurisdiction, stateFilter, sector, type, sortBy]);

  const topKpis = useMemo(() => {
    const rows = filtered;

    const withAvg = rows.filter(
      (r: any) => typeof r.avgOverallScore === "number"
    ) as Array<any>;

    const n = withAvg.length;

    const avg =
      n > 0
        ? Math.round(
            ((withAvg.reduce(
              (sum: number, r: any) => sum + (r.avgOverallScore ?? 0),
              0
            ) /
              n) *
              10)
          ) / 10
        : null;

    const totalCritiques = rows.reduce(
      (sum: number, r: any) => sum + Number(r.critiquesCount ?? 0),
      0
    );

    return {
      policies: rows.length,
      totalCritiques,
      meanAvgScore: avg,
    };
  }, [filtered]);

  const runSearch = () => setSearch(draftSearch.trim());

  const toggleCompare = (policyId: string) => {
    setCompareIds((prev) => {
      if (prev.includes(policyId)) return prev.filter((x) => x !== policyId);
      if (prev.length >= 4) return prev; // cap at 4
      return [...prev, policyId];
    });
  };

  const compareRows = useMemo(() => {
    const set = new Set(compareIds);
    return filtered.filter((r: any) => set.has(r.policyId));
  }, [compareIds, filtered]);

  // Fetch latest critiques for selected compare policies (for dropdown criteria)
  useEffect(() => {
    if (!compareMode || compareIds.length === 0) {
      setCompareCritiques({});
      return;
    }

    (async () => {
      setLoadingCompareCritiques(true);

      try {
        const out: Record<string, CritiqueDoc | null> = {};

        for (const pid of compareIds) {
          const q = query(
            collection(db, "policies", pid, "critiques"),
            orderBy("createdAt", "desc"),
            limit(1)
          );
          const snap = await getDocs(q);

          out[pid] = snap.empty ? null : (snap.docs[0].data() as CritiqueDoc);
        }

        setCompareCritiques(out);
      } finally {
        setLoadingCompareCritiques(false);
      }
    })();
  }, [compareMode, compareIds]);

  const standardLabel = (id: string) => {
    const found = CRITIQUE_STANDARDS.find((s) => s.id === id);
    return found?.label ?? id;
  };

  const trendChip = (d: number | null) => {
    if (typeof d !== "number") return <Badge variant="outline">—</Badge>;
    if (d > 0)
      return (
        <Badge className="gap-1">
          <TrendingUp size={14} /> +{d}
        </Badge>
      );
    if (d < 0)
      return (
        <Badge variant="destructive" className="gap-1">
          <TrendingDown size={14} /> {d}
        </Badge>
      );
    return (
      <Badge variant="secondary" className="gap-1">
        <Minus size={14} /> 0
      </Badge>
    );
  };

  const CompareCriteriaDropdown = ({ policyId }: { policyId: string }) => {
    const crit = compareCritiques[policyId];

    const rows =
      crit?.perStandard?.map((r) => ({
        id: r.standardId,
        score: r.score,
        label: standardLabel(r.standardId),
      })) ?? [];

    return (
      <details className="border rounded-xl p-3">
        <summary className="cursor-pointer flex items-center justify-between gap-2">
          <span className="text-sm font-semibold text-blue-deep">
            Criteria & scores
          </span>
          <ChevronDown size={16} className="text-[var(--text-secondary)]" />
        </summary>

        <div className="mt-3">
          {loadingCompareCritiques ? (
            <p className="text-xs text-[var(--text-secondary)]">Loading…</p>
          ) : !crit ? (
            <p className="text-xs text-[var(--text-secondary)]">
              No critique found for this policy yet.
            </p>
          ) : rows.length === 0 ? (
            <p className="text-xs text-[var(--text-secondary)]">
              No per-standard scores saved.
            </p>
          ) : (
            <div className="space-y-2">
              {rows.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between gap-3 text-sm"
                >
                  <span className="text-[var(--text-secondary)] line-clamp-1">
                    {r.label}
                  </span>
                  <span className="font-bold text-blue-deep">{r.score}/100</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </details>
    );
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-blue-soft text-blue-electric">
              <Trophy size={26} strokeWidth={2.2} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-blue-deep">Rankings</h1>
              <p className="text-sm text-[var(--text-secondary)]">
                Leaderboard powered by critiques. Filter, sort, and compare policies.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant={compareMode ? "secondary" : "outline"}
              onClick={() => {
                setCompareMode((v) => !v);
                setCompareIds([]);
                setCompareCritiques({});
              }}
              className="gap-2"
            >
              <GitCompare size={16} />
              {compareMode ? "Exit compare" : "Compare"}
            </Button>

            <div className="text-sm font-semibold text-blue-deep bg-blue-soft px-3 py-2 rounded-lg">
              Policies: {topKpis.policies}
            </div>
          </div>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="p-4">
            <p className="text-xs text-[var(--text-secondary)]">Policies ranked</p>
            <p className="text-2xl font-bold text-blue-deep">{topKpis.policies}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-[var(--text-secondary)]">Total critiques</p>
            <p className="text-2xl font-bold text-blue-deep">{topKpis.totalCritiques}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-[var(--text-secondary)]">Mean average score</p>
            <p className="text-2xl font-bold text-blue-deep">
              {typeof topKpis.meanAvgScore === "number"
                ? `${topKpis.meanAvgScore}/100`
                : "—"}
            </p>
          </Card>
        </div>

        {/* Controls */}
        <Card className="p-4 mb-6">
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-sm font-medium mb-2">Search</p>
              <div className="flex gap-2">
                <Input
                  value={draftSearch}
                  onChange={(e) => setDraftSearch(e.target.value)}
                  placeholder="Search title, state, sector, year, type…"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") runSearch();
                  }}
                />
                <Button onClick={runSearch}>Search</Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {/* Jurisdiction */}
              <div>
                <p className="text-sm font-medium mb-2">Jurisdiction</p>
                <Select
                  value={jurisdiction}
                  onValueChange={(v) => setJurisdiction(v as any)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select…" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="federal">Federal</SelectItem>
                    <SelectItem value="state">State</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* State */}
              <div>
                <p className="text-sm font-medium mb-2">State</p>
                <Select
                  value={stateFilter}
                  onValueChange={setStateFilter}
                  disabled={jurisdiction === "federal"}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select…" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All states</SelectItem>
                    {NIGERIA_STATES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Sector */}
              <div>
                <p className="text-sm font-medium mb-2">Sector</p>
                <Select value={sector} onValueChange={setSector}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select…" />
                  </SelectTrigger>
                  <SelectContent>
                    {SECTORS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s === "all" ? "All sectors" : s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Type */}
              <div>
                <p className="text-sm font-medium mb-2">Type</p>
                <Tabs value={type} onValueChange={(v) => setType(v as any)}>
                  <TabsList className="w-full">
                    <TabsTrigger className="flex-1" value="all">
                      All
                    </TabsTrigger>
                    <TabsTrigger className="flex-1" value="uploaded">
                      Uploaded
                    </TabsTrigger>
                    <TabsTrigger className="flex-1" value="ai_generated">
                      AI
                    </TabsTrigger>
                    <TabsTrigger className="flex-1" value="public_source">
                      Public
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {/* Sort */}
              <div>
                <p className="text-sm font-medium mb-2">Sort by</p>
                <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select…" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="avg">Average score</SelectItem>
                    <SelectItem value="latest">Latest score</SelectItem>
                    <SelectItem value="trend">Trend</SelectItem>
                    <SelectItem value="count">Critiques count</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {compareMode && (
              <div className="text-sm text-[var(--text-secondary)]">
                Select up to <span className="font-semibold">4</span> policies to
                compare. Selected:{" "}
                <span className="font-semibold">{compareIds.length}</span>
              </div>
            )}
          </div>
        </Card>

        {/* Compare panel */}
        {compareMode && compareRows.length > 0 && (
          <Card className="p-4 mb-6">
            <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
              <p className="font-bold text-blue-deep">Comparison</p>
              <Button variant="outline" onClick={() => setCompareIds([])}>
                Clear
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
              {compareRows.map((p: any) => (
                <div key={p.policyId} className="border rounded-xl p-4">
                  <p className="font-bold text-blue-deep line-clamp-2">
                    {p.title ?? "Untitled"}
                  </p>

                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge variant={p.rating.variant}>{p.rating.label}</Badge>
                    <Badge variant="outline">{p.jurisdictionLevel ?? "—"}</Badge>
                    {p.state ? <Badge variant="outline">{p.state}</Badge> : null}
                    {p.sector ? <Badge variant="outline">{p.sector}</Badge> : null}
                    {p.policyYear ? (
                      <Badge variant="outline">{p.policyYear}</Badge>
                    ) : null}
                  </div>

                  <div className="mt-3 space-y-2 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[var(--text-secondary)]">Avg</span>
                      <span className="font-bold text-blue-deep">
                        {typeof p.avgOverallScore === "number"
                          ? `${p.avgOverallScore}/100`
                          : "—"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[var(--text-secondary)]">Latest</span>
                      <span className="font-bold text-blue-deep">
                        {typeof p.latestOverallScore === "number"
                          ? `${p.latestOverallScore}/100`
                          : "—"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[var(--text-secondary)]">Trend</span>
                      <span>{trendChip(p.trendDelta ?? null)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[var(--text-secondary)]">Critiques</span>
                      <span className="font-bold text-blue-deep">
                        {p.critiquesCount ?? 0}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4">
                    <CompareCriteriaDropdown policyId={p.policyId} />
                  </div>

                  <div className="mt-4 flex gap-2">
                    <Button
                      variant="secondary"
                      className="flex-1"
                      onClick={() => router.push(`/policies/${p.slug ?? p.policyId}`)}
                    >
                      View
                    </Button>
                    <Button variant="outline" onClick={() => toggleCompare(p.policyId)}>
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* List */}
        <Card className="p-4">
          {loading ? (
            <p className="text-sm text-[var(--text-secondary)]">Loading rankings…</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-[var(--text-secondary)]">
              No ranked policies match your filters.
            </p>
          ) : (
            <div className="space-y-3">
              {filtered.map((p: any, i: number) => {
                const rank = i + 1;

                return (
                  <div
                    key={p.policyId}
                    className="border rounded-xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="secondary">#{rank}</Badge>

                        <p className="font-bold text-blue-deep truncate max-w-[560px]">
                          {p.title ?? "Untitled"}
                        </p>

                        <Badge variant={p.rating.variant}>{p.rating.label}</Badge>

                        <Badge variant="outline">{p.type ?? "—"}</Badge>
                        <Badge variant="outline">{p.jurisdictionLevel ?? "—"}</Badge>
                        {p.state ? <Badge variant="outline">{p.state}</Badge> : null}
                        {p.sector ? <Badge variant="outline">{p.sector}</Badge> : null}
                        {p.policyYear ? (
                          <Badge variant="outline">{p.policyYear}</Badge>
                        ) : null}
                      </div>

                      <div className="mt-2 flex items-center gap-2 flex-wrap text-sm">
                        <Badge variant="outline">Avg</Badge>
                        <span className="font-bold">
                          {typeof p.avgOverallScore === "number"
                            ? `${p.avgOverallScore}/100`
                            : "—"}
                        </span>

                        <Badge variant="outline">Latest</Badge>
                        <span className="font-bold">
                          {typeof p.latestOverallScore === "number"
                            ? `${p.latestOverallScore}/100`
                            : "—"}
                        </span>

                        <Badge variant="outline">Trend</Badge>
                        {trendChip(p.trendDelta ?? null)}

                        <Badge variant="outline">Critiques</Badge>
                        <span className="font-bold">{p.critiquesCount ?? 0}</span>
                      </div>
                    </div>

                    <div className="flex gap-2 flex-wrap">
                      {compareMode && (
                        <Button
                          variant={compareIds.includes(p.policyId) ? "secondary" : "outline"}
                          onClick={() => toggleCompare(p.policyId)}
                          disabled={!compareIds.includes(p.policyId) && compareIds.length >= 4}
                        >
                          {compareIds.includes(p.policyId) ? "Selected" : "Compare"}
                        </Button>
                      )}

                      <Button
                        variant="secondary"
                        onClick={() => router.push(`/policies/${p.slug ?? p.policyId}`)}
                      >
                        View
                      </Button>

                      <Button onClick={() => router.push(`/critique?policyId=${p.policyId}`)}>
                        Critique
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
