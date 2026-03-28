"use client";

import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import ProtectedRoute from "@/components/guards/ProtectedRoute";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Lock, Globe2, Filter, Sparkles, BarChart3 } from "lucide-react";
import { NIGERIA_COUNTRY, NIGERIA_STATES } from "@/lib/ngStates";
import { fetchPolicies } from "@/lib/policiesRepo";
import type { Policy, PolicyType } from "@/lib/policyTypes";
import { useRouter } from "next/navigation";
import { useUser } from "@/components/providers/UserProvider";
import { POLICY_DOMAINS, POLICY_ENERGY_SOURCES, policyDomainLabel, policyEnergySourceLabel } from "@/lib/policyTaxonomy";

export default function PoliciesPage() {
  const router = useRouter();
  const { user } = useUser();
  const [jurisdictionFilter, setJurisdictionFilter] = useState<"all" | "federal" | "state">("all");
  const [stateFilter, setStateFilter] = useState<string>("all");
  const [energySourceFilter, setEnergySourceFilter] = useState<string>("all");
  const [domainFilter, setDomainFilter] = useState<string>("all");
  const [yearFilter, setYearFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<PolicyType | "all">("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [policies, setPolicies] = useState<Policy[]>([]);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const items = await fetchPolicies({
      uid: user.uid,
      jurisdictionLevel: jurisdictionFilter,
      state: stateFilter,
      type: typeFilter,
      energySource: energySourceFilter,
      domain: domainFilter,
      policyYear: yearFilter === "all" ? "all" : Number(yearFilter),
      search,
    });
    setPolicies(items);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, [user, jurisdictionFilter, stateFilter, typeFilter, energySourceFilter, domainFilter, yearFilter]);

  const emptyText = useMemo(() => {
    if (loading) return "Loading workspace policies...";
    if (policies.length === 0) return "No private policies match this filter.";
    return "";
  }, [loading, policies.length]);

  const typeBadge = (t: PolicyType) => {
    if (t === "uploaded") return <Badge>Uploaded</Badge>;
    if (t === "ai_generated") return <Badge variant="secondary">AI Generated</Badge>;
    return <Badge variant="outline">Public Source</Badge>;
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="mb-6 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-white text-blue-electric shadow-sm">
              <Lock size={26} strokeWidth={2.2} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-blue-deep">My Workspace</h1>
              <p className="text-sm text-[var(--text-secondary)]">
                Keep drafts, uploads, and revisions in one private workspace.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" className="gap-2" onClick={() => router.push("/repository")}>
              <Globe2 size={16} />
              Repository
            </Button>
            <Button onClick={() => router.push("/policies/upload")}>Upload policy</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="premium-card p-5 rounded-2xl">
            <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-secondary)]">Private policies</p>
            <p className="text-3xl font-bold text-blue-deep mt-2">{policies.length}</p>
            <p className="text-sm text-[var(--text-secondary)] mt-1">Workspace-only documents</p>
          </Card>
          <Card className="premium-card p-5 rounded-2xl">
            <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-secondary)]">Country focus</p>
            <p className="text-3xl font-bold text-blue-deep mt-2">{NIGERIA_COUNTRY}</p>
            <p className="text-sm text-[var(--text-secondary)] mt-1">Built around Nigerian policy work</p>
          </Card>
          <Card className="premium-card p-5 rounded-2xl">
            <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-secondary)]">Next step</p>
            <p className="text-lg font-bold text-blue-deep mt-2">Critique, simulate, or improve</p>
            <p className="text-sm text-[var(--text-secondary)] mt-1">Move straight into critique, simulation, or revision.</p>
          </Card>
        </div>

        <Card className="premium-card p-5 mb-6 rounded-3xl border-white/70 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Filter size={16} className="text-blue-electric" />
            <p className="font-bold text-blue-deep">Filters</p>
          </div>

          <div className="flex flex-col gap-4">
            <div>
              <p className="text-sm font-medium mb-2">Search</p>
              <div className="flex gap-2">
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search title, tags, summary..." />
                <Button onClick={load}>Search</Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4">
              <div>
                <p className="text-sm font-medium mb-2">Jurisdiction</p>
                <Select
                  value={jurisdictionFilter}
                  onValueChange={(v) => {
                    setJurisdictionFilter(v as any);
                    if (v === "federal") setStateFilter("all");
                  }}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="federal">Federal</SelectItem>
                    <SelectItem value="state">State</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">State</p>
                <Select value={stateFilter} onValueChange={setStateFilter} disabled={jurisdictionFilter === "federal"}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All states</SelectItem>
                    {NIGERIA_STATES.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">Energy source</p>
                <Select value={energySourceFilter} onValueChange={setEnergySourceFilter}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {POLICY_ENERGY_SOURCES.map((s) => (
                      <SelectItem key={s} value={s}>{policyEnergySourceLabel(s)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">Domain</p>
                <Select value={domainFilter} onValueChange={setDomainFilter}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {POLICY_DOMAINS.map((d) => (
                      <SelectItem key={d} value={d}>{policyDomainLabel(d)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">Year</p>
                <Select value={yearFilter} onValueChange={setYearFilter}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
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
              <p className="text-sm font-medium mb-2">Type</p>
              <Tabs value={typeFilter} onValueChange={(v) => setTypeFilter(v as any)}>
                <TabsList className="w-full">
                  <TabsTrigger className="flex-1" value="all">All</TabsTrigger>
                  <TabsTrigger className="flex-1" value="uploaded">Uploaded</TabsTrigger>
                  <TabsTrigger className="flex-1" value="ai_generated">AI Generated</TabsTrigger>
                  <TabsTrigger className="flex-1" value="public_source">Imported Public</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
        </Card>

        <Card className="premium-card p-4 rounded-3xl border-white/70 shadow-sm">
          {emptyText ? (
            <p className="text-sm text-[var(--text-secondary)]">{emptyText}</p>
          ) : (
            <div className="space-y-3">
              {policies.map((p: any) => (
                <div key={p.id} className="border rounded-2xl p-4 bg-white/90 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div className="min-w-0 max-w-full">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-blue-deep break-anywhere line-clamp-2">{p.title}</p>
                      {typeBadge(p.type)}
                      <Badge variant="outline">{p.jurisdictionLevel === "federal" ? "Federal" : "State"}</Badge>
                      {p.state ? <Badge variant="outline">{p.state}</Badge> : null}
                      {p.policyYear ? <Badge variant="outline">{p.policyYear}</Badge> : null}
                      {p.energySource ? <Badge variant="outline">{policyEnergySourceLabel(p.energySource)}</Badge> : null}
                      {p.domain ? <Badge variant="outline">{policyDomainLabel(p.domain)}</Badge> : null}
                    </div>

                    {p.summary ? (
                      <p className="text-sm text-[var(--text-secondary)] mt-1 line-clamp-2">{p.summary}</p>
                    ) : null}
                  </div>

                  <div className="flex gap-2 flex-wrap max-w-full">
                    <Button variant="secondary" onClick={() => router.push(`/policies/${p.slug ?? p.id}`)}>
                      View
                    </Button>
                    <Button onClick={() => router.push(`/critique?policyId=${p.id}`)} className="gap-2">
                      <Sparkles size={16} />
                      Critique
                    </Button>
                    <Button variant="outline" onClick={() => router.push(`/simulations?policyId=${p.id}`)} className="gap-2">
                      <BarChart3 size={16} />
                      Simulate
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
