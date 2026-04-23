"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import PublicNavbar from "@/components/public/PublicNavbar";
import PublicFooter from "@/components/public/PublicFooter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ArrowRight,
  Database,
  Filter,
  Globe2,
  Lock,
  MapPinned,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";
import { NIGERIA_COUNTRY, NIGERIA_STATES } from "@/lib/ngStates";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@/components/providers/UserProvider";
import { importPublicPolicyToWorkspace } from "@/lib/policyWrites";
import toast from "react-hot-toast";
import {
  POLICY_DOMAINS,
  POLICY_ENERGY_SOURCES,
  policyDomainLabel,
  policyEnergySourceLabel,
} from "@/lib/policyTaxonomy";
import ListPagination from "@/components/ui/ListPagination";
import { usePublicTheme } from "@/components/public/usePublicTheme";

type PublicPolicy = {
  id: string;
  title: string;
  slug: string | null;
  summary?: string;
  country?: string;
  jurisdictionLevel?: "federal" | "state";
  state?: string | null;
  policyYear?: number | null;
  type?: "uploaded" | "ai_generated" | "public_source";
  energySource?: string | null;
  domain?: string | null;
};

function PublicPoliciesPageContent() {
  const PAGE_SIZE = 5;
  const router = useRouter();
  const { user, profile } = useUser();
  const { theme, mounted } = usePublicTheme();
  const dark = !mounted || theme === "dark";
  const searchParams = useSearchParams();
  const [jurisdictionFilter, setJurisdictionFilter] = useState<"all" | "federal" | "state">(
    (searchParams.get("jurisdictionLevel") as "all" | "federal" | "state") || "all"
  );
  const [stateFilter, setStateFilter] = useState<string>(searchParams.get("state") || "all");
  const [energySourceFilter, setEnergySourceFilter] = useState<string>("all");
  const [domainFilter, setDomainFilter] = useState<string>("all");
  const [yearFilter, setYearFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<PublicPolicy["type"] | "all">("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [policies, setPolicies] = useState<PublicPolicy[]>([]);
  const [error, setError] = useState("");
  const [importingId, setImportingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const shellClass = dark
    ? "min-h-screen bg-[radial-gradient(circle_at_top,rgba(0,115,209,0.12),transparent_24%),linear-gradient(180deg,#09111b_0%,#0a1320_40%,#08101a_100%)] text-white"
    : "min-h-screen bg-[linear-gradient(180deg,#eff7fd_0%,#f8fbff_30%,#ffffff_100%)] text-[#003869]";
  const panelClass = dark
    ? "rounded-[1.9rem] border border-white/10 bg-[#0b1523]/92 shadow-[0_24px_80px_rgba(0,0,0,0.22)]"
    : "premium-card rounded-[1.9rem]";
  const softPanelClass = dark
    ? "rounded-[1.7rem] border border-white/10 bg-white/[0.04]"
    : "rounded-[1.7rem] border border-[#d8e6ec] bg-white/88";
  const bodyTextClass = dark ? "text-white/64" : "text-[var(--text-secondary)]";
  const titleTextClass = dark ? "text-white" : "text-blue-deep";
  const chipClass = dark
    ? "border-white/10 bg-white/[0.03] text-white/72"
    : "border-[#d8e6ec] bg-white text-[#35516d]";

  const load = async () => {
    setLoading(true);
    setError("");

    const qs = new URLSearchParams();
    qs.set("jurisdictionLevel", jurisdictionFilter);
    qs.set("state", stateFilter);
    qs.set("type", String(typeFilter));
    qs.set("energySource", energySourceFilter);
    qs.set("domain", domainFilter);
    qs.set("policyYear", yearFilter);
    qs.set("search", search);

    const res = await fetch(`/api/public/policies?${qs.toString()}`);
    if (!res.ok) {
      const txt = await res.text();
      setPolicies([]);
      setError(`Failed to load policies (${res.status}). ${txt.slice(0, 120)}`);
      setLoading(false);
      return;
    }

    const data = await res.json();
    setPolicies(Array.isArray(data?.items) ? data.items : []);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, [jurisdictionFilter, stateFilter, typeFilter, energySourceFilter, domainFilter, yearFilter]);

  useEffect(() => {
    setPage(1);
  }, [jurisdictionFilter, stateFilter, typeFilter, energySourceFilter, domainFilter, yearFilter, search, policies.length]);

  const summary = useMemo(() => {
    const states = new Set(policies.map((item) => item.state).filter(Boolean));
    const federalCount = policies.filter((item) => item.jurisdictionLevel === "federal").length;
    const newestYear = policies.reduce((max, item) => Math.max(max, Number(item.policyYear ?? 0)), 0);
    return {
      count: policies.length,
      states: states.size,
      federalCount,
      newestYear: newestYear || null,
    };
  }, [policies]);

  const telemetry = useMemo(() => {
    const stateCount = policies.filter((item) => item.jurisdictionLevel === "state").length;
    const leadingEnergy =
      Object.entries(
        policies.reduce<Record<string, number>>((acc, item) => {
          if (!item.energySource) return acc;
          acc[item.energySource] = (acc[item.energySource] ?? 0) + 1;
          return acc;
        }, {})
      ).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
    const leadingDomain =
      Object.entries(
        policies.reduce<Record<string, number>>((acc, item) => {
          if (!item.domain) return acc;
          acc[item.domain] = (acc[item.domain] ?? 0) + 1;
          return acc;
        }, {})
      ).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

    return {
      stateCount,
      leadingEnergy,
      leadingDomain,
    };
  }, [policies]);

  const activeFilters = useMemo(
    () =>
      [
        jurisdictionFilter !== "all" ? `Jurisdiction: ${jurisdictionFilter === "federal" ? "Federal" : "State"}` : null,
        stateFilter !== "all" ? `State: ${stateFilter}` : null,
        energySourceFilter !== "all" ? `Energy: ${policyEnergySourceLabel(energySourceFilter)}` : null,
        domainFilter !== "all" ? `Domain: ${policyDomainLabel(domainFilter)}` : null,
        yearFilter !== "all" ? `Year: ${yearFilter}` : null,
        typeFilter && typeFilter !== "all" ? `Type: ${typeFilter.replaceAll("_", " ")}` : null,
        search.trim() ? `Search: ${search.trim()}` : null,
      ].filter(Boolean) as string[],
    [jurisdictionFilter, stateFilter, energySourceFilter, domainFilter, yearFilter, typeFilter, search]
  );

  const emptyText = useMemo(() => {
    if (error) return error;
    if (loading) return "Loading public policies...";
    if (policies.length === 0) return "No public policies match this filter.";
    return "";
  }, [error, loading, policies.length]);

  const totalPages = Math.max(1, Math.ceil(policies.length / PAGE_SIZE));
  const pagedPolicies = useMemo(
    () => policies.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [page, policies]
  );

  const addToWorkspace = async (policyId: string) => {
    if (!user) {
      router.push("/register");
      return;
    }

    try {
      setImportingId(policyId);
      const imported = await importPublicPolicyToWorkspace({
        uid: user.uid,
        userName: profile?.fullName ?? null,
        userEmail: user.email ?? null,
        publicPolicyId: policyId,
      });
      toast.success(
        imported.reused
          ? "Workspace copy already exists. Opening it now..."
          : "Policy added to your workspace"
      );
      router.push(`/policies/${imported.slug}`);
    } catch (error: any) {
      console.error(error);
      toast.error(error?.message || "Could not add this policy to your workspace");
    } finally {
      setImportingId(null);
    }
  };

  return (
    <div className={shellClass}>
      <PublicNavbar />

      <main className="mx-auto max-w-7xl px-6 py-10 md:px-10 lg:px-14">
        <section className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
          <div className={`${panelClass} p-7`}>
            <div className="flex items-start gap-4">
              <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${dark ? "border border-[#0073d1]/20 bg-[#0073d1]/10 text-[#7ac8ff]" : "bg-blue-soft text-[#0073d1]"}`}>
                <Database size={24} />
              </div>
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-[0.28em] text-[#49d2b6]">Public repository</p>
                <h1 className={`mt-3 text-3xl font-semibold ${titleTextClass} md:text-[2.7rem]`}>
                  Nigeria national policy intelligence.
                </h1>
                <p className={`mt-4 max-w-3xl text-sm leading-7 ${bodyTextClass}`}>
                  Search and filter public energy policies, regulatory frameworks, and published strategy documents, then move the strongest records into your private workspace when you are ready to work.
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {[
                { label: "Public records", value: summary.count || 0 },
                { label: "State coverage", value: summary.states || 0 },
                { label: "Federal records", value: summary.federalCount || 0 },
                { label: "Latest year", value: summary.newestYear || "-" },
              ].map((item) => (
                <div key={item.label} className={`${softPanelClass} p-4`}>
                  <p className={`text-xs uppercase tracking-[0.2em] ${bodyTextClass}`}>{item.label}</p>
                  <p className={`mt-2 text-2xl font-semibold ${titleTextClass}`}>{item.value}</p>
                </div>
              ))}
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              {[
                {
                  label: "State coverage",
                  value: `${telemetry.stateCount}`,
                  body: "Sub-national signals currently in the visible repository set.",
                },
                {
                  label: "Most common energy track",
                  value: telemetry.leadingEnergy ? policyEnergySourceLabel(telemetry.leadingEnergy) : "Mixed",
                  body: "The most represented energy pathway in the filtered result set.",
                },
                {
                  label: "Dominant policy domain",
                  value: telemetry.leadingDomain ? policyDomainLabel(telemetry.leadingDomain) : "Mixed",
                  body: "The main problem space surfaced by the current repository query.",
                },
              ].map((item) => (
                <div key={item.label} className={`${softPanelClass} p-4`}>
                  <p className="text-[11px] uppercase tracking-[0.2em] text-[#49d2b6]">{item.label}</p>
                  <p className={`mt-2 text-lg font-semibold ${titleTextClass}`}>{item.value}</p>
                  <p className={`mt-2 text-sm leading-6 ${bodyTextClass}`}>{item.body}</p>
                </div>
              ))}
            </div>
          </div>

          <div className={`${panelClass} p-7`}>
            <div className="flex items-center gap-3">
              <MapPinned className={dark ? "text-[#7ac8ff]" : "text-[#0073d1]"} size={20} />
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-[#49d2b6]">How it connects</p>
                <h2 className={`mt-2 text-2xl font-semibold ${titleTextClass}`}>Move from public evidence to private work.</h2>
              </div>
            </div>
            <div className="mt-5 space-y-3">
              {[
                "Explore public policy records and compare federal and state-level direction.",
                "Add a public policy to your workspace as a private editable copy.",
                "Run critique, simulation, drafting, and export only after sign-in.",
              ].map((item) => (
                <div key={item} className={`${softPanelClass} flex items-start gap-3 p-4`}>
                  <ShieldCheck size={16} className={dark ? "mt-1 text-[#7ce8d1]" : "mt-1 text-[#0073d1]"} />
                  <p className={`text-sm leading-7 ${bodyTextClass}`}>{item}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button
                className="rounded-full bg-[#0073d1] hover:bg-[#003869]"
                onClick={() => router.push(user ? "/repository" : "/register")}
              >
                {user ? "Open signed-in repository" : "Create account"}
              </Button>
              <Button
                variant="outline"
                className={`rounded-full ${dark ? "border-white/12 bg-transparent text-white hover:bg-white/8" : ""}`}
                onClick={() => router.push("/rankings")}
              >
                View rankings
              </Button>
            </div>
          </div>
        </section>

        <section className={`${panelClass} mt-6 p-6`}>
          <div className="flex items-center gap-3">
            <SlidersHorizontal size={17} className={dark ? "text-[#7ac8ff]" : "text-[#0073d1]"} />
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-[#49d2b6]">Repository filters</p>
              <h2 className={`mt-2 text-xl font-semibold ${titleTextClass}`}>Narrow the public signal fast.</h2>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-5">
            <div>
              <p className={`mb-2 text-sm font-medium ${titleTextClass}`}>Search</p>
              <div className="flex gap-2">
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search title, summary, tags..."
                  className={dark ? "border-white/10 bg-[#09111b] text-white placeholder:text-white/52" : ""}
                />
                <Button onClick={load} className="rounded-full bg-[#0073d1] hover:bg-[#003869]">
                  <Search size={15} />
                  Search
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3 xl:grid-cols-5">
              <div>
                <p className={`mb-2 text-sm font-medium ${titleTextClass}`}>Jurisdiction</p>
                <Select
                  value={jurisdictionFilter}
                  onValueChange={(v) => {
                    setJurisdictionFilter(v as "all" | "federal" | "state");
                    if (v === "federal") setStateFilter("all");
                  }}
                >
                  <SelectTrigger className={dark ? "border-white/10 bg-[#09111b] text-white" : ""}><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="federal">Federal</SelectItem>
                    <SelectItem value="state">State</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <p className={`mb-2 text-sm font-medium ${titleTextClass}`}>State</p>
                <Select value={stateFilter} onValueChange={setStateFilter} disabled={jurisdictionFilter === "federal"}>
                  <SelectTrigger className={dark ? "border-white/10 bg-[#09111b] text-white" : ""}><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All states</SelectItem>
                    {NIGERIA_STATES.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <p className={`mb-2 text-sm font-medium ${titleTextClass}`}>Energy source</p>
                <Select value={energySourceFilter} onValueChange={setEnergySourceFilter}>
                  <SelectTrigger className={dark ? "border-white/10 bg-[#09111b] text-white" : ""}><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {POLICY_ENERGY_SOURCES.map((s) => (
                      <SelectItem key={s} value={s}>{policyEnergySourceLabel(s)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <p className={`mb-2 text-sm font-medium ${titleTextClass}`}>Domain</p>
                <Select value={domainFilter} onValueChange={setDomainFilter}>
                  <SelectTrigger className={dark ? "border-white/10 bg-[#09111b] text-white" : ""}><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {POLICY_DOMAINS.map((d) => (
                      <SelectItem key={d} value={d}>{policyDomainLabel(d)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <p className={`mb-2 text-sm font-medium ${titleTextClass}`}>Year</p>
                <Select value={yearFilter} onValueChange={setYearFilter}>
                  <SelectTrigger className={dark ? "border-white/10 bg-[#09111b] text-white" : ""}><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All years</SelectItem>
                    {Array.from({ length: 16 }).map((_, i) => {
                      const y = 2026 - i;
                      return <SelectItem key={y} value={String(y)}>{y}</SelectItem>;
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <p className={`mb-2 text-sm font-medium ${titleTextClass}`}>Type</p>
              <Tabs value={typeFilter} onValueChange={(v) => setTypeFilter(v as PublicPolicy["type"] | "all")}>
                <TabsList className={`w-full ${dark ? "bg-white/[0.05]" : ""}`}>
                  <TabsTrigger className="flex-1" value="all">All</TabsTrigger>
                  <TabsTrigger className="flex-1" value="public_source">Public Source</TabsTrigger>
                  <TabsTrigger className="flex-1" value="uploaded">Curated Upload</TabsTrigger>
                  <TabsTrigger className="flex-1" value="ai_generated">Curated AI</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
        </section>

        {activeFilters.length ? (
          <section className={`${panelClass} mt-6 p-5`}>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs uppercase tracking-[0.22em] text-[#49d2b6]">Live query</span>
              {activeFilters.map((item) => (
                <Badge key={item} variant="outline" className={chipClass}>
                  {item}
                </Badge>
              ))}
            </div>
          </section>
        ) : null}

        <section className={`${panelClass} mt-6 p-6`}>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-[#49d2b6]">Public records</p>
              <h2 className={`mt-2 text-xl font-semibold ${titleTextClass}`}>
                Browse published policy records without leaving the intelligence layer.
              </h2>
            </div>
            <Badge className={dark ? "border-white/10 bg-white/[0.06] text-white" : ""} variant="outline">
              {policies.length} results
            </Badge>
          </div>

          {emptyText ? (
            <p className={`text-sm ${bodyTextClass}`}>{emptyText}</p>
          ) : (
            <div className="space-y-3">
              {pagedPolicies.map((p) => (
                <div
                  key={p.id}
                  className={`${softPanelClass} flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between`}
                >
                  <div className="min-w-0 max-w-full">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className={chipClass}>
                        Signal {((page - 1) * PAGE_SIZE) + pagedPolicies.indexOf(p) + 1}
                      </Badge>
                      <p className={`max-w-[680px] text-base font-semibold ${titleTextClass}`}>{p.title}</p>
                      <Badge variant="outline" className={chipClass}>{p.jurisdictionLevel === "federal" ? "Federal" : "State"}</Badge>
                      {p.state ? <Badge variant="outline" className={chipClass}>{p.state}</Badge> : null}
                      {p.policyYear ? <Badge variant="outline" className={chipClass}>{p.policyYear}</Badge> : null}
                      {p.energySource ? <Badge variant="outline" className={chipClass}>{policyEnergySourceLabel(p.energySource)}</Badge> : null}
                      {p.domain ? <Badge variant="outline" className={chipClass}>{policyDomainLabel(p.domain)}</Badge> : null}
                    </div>

                    {p.summary ? (
                      <p className={`mt-2 max-w-4xl text-sm leading-7 ${bodyTextClass}`}>{p.summary}</p>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      className={`gap-2 rounded-full ${dark ? "border-white/12 bg-transparent text-white hover:bg-white/8" : ""}`}
                      onClick={() => (user ? addToWorkspace(p.id) : router.push("/register"))}
                      disabled={importingId === p.id}
                    >
                      <Lock size={14} />
                      {user ? (importingId === p.id ? "Adding..." : "Add to workspace") : "Login for AI actions"}
                    </Button>
                    <Button
                      className="rounded-full bg-[#0073d1] hover:bg-[#003869]"
                      onClick={() => router.push("/rankings")}
                    >
                      Compare ranking
                      <ArrowRight size={15} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <ListPagination
            page={page}
            totalPages={totalPages}
            totalItems={policies.length}
            pageSize={PAGE_SIZE}
            itemLabel="policies"
            onPageChange={setPage}
          />
        </section>

        <section className="mt-8 flex flex-wrap items-center justify-between gap-3">
          <div className={`text-sm ${bodyTextClass}`}>Country focus: {NIGERIA_COUNTRY}</div>
          <Button
            variant="outline"
            className={`gap-2 rounded-full ${dark ? "border-white/12 bg-transparent text-white hover:bg-white/8" : ""}`}
            onClick={() => router.push("/rankings")}
          >
            <Globe2 size={16} />
            Open rankings
          </Button>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}

export default function PublicPoliciesPage() {
  return (
    <Suspense
      fallback={<div className="min-h-screen bg-[linear-gradient(180deg,#09111b_0%,#08101a_100%)]" />}
    >
      <PublicPoliciesPageContent />
    </Suspense>
  );
}
