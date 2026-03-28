"use client";

import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import ProtectedRoute from "@/components/guards/ProtectedRoute";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Database, Download, Filter, Lock, Sparkles } from "lucide-react";
import { NIGERIA_COUNTRY, NIGERIA_STATES } from "@/lib/ngStates";
import { POLICY_DOMAINS, POLICY_ENERGY_SOURCES, policyDomainLabel, policyEnergySourceLabel } from "@/lib/policyTaxonomy";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@/components/providers/UserProvider";
import { importPublicPolicyToWorkspace } from "@/lib/policyWrites";
import toast from "react-hot-toast";

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
  sector?: string | null;
  energySource?: string | null;
  domain?: string | null;
  tags?: string[];
  publicPdfUrl?: string | null;
};

export default function RepositoryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, profile } = useUser();
  const [jurisdictionFilter, setJurisdictionFilter] = useState<"all" | "federal" | "state">(
    (searchParams.get("jurisdictionLevel") as any) || "all"
  );
  const [stateFilter, setStateFilter] = useState<string>(searchParams.get("state") || "all");
  const [energySourceFilter, setEnergySourceFilter] = useState<string>("all");
  const [domainFilter, setDomainFilter] = useState<string>("all");
  const [yearFilter, setYearFilter] = useState<string>("all");
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [loading, setLoading] = useState(true);
  const [policies, setPolicies] = useState<PublicPolicy[]>([]);
  const [importingId, setImportingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    const qs = new URLSearchParams();
    qs.set("jurisdictionLevel", jurisdictionFilter);
    qs.set("state", stateFilter);
    qs.set("type", "all");
    qs.set("energySource", energySourceFilter);
    qs.set("domain", domainFilter);
    qs.set("policyYear", yearFilter);
    qs.set("search", search);

    const res = await fetch(`/api/public/policies?${qs.toString()}`);
    if (!res.ok) {
      const txt = await res.text();
      setPolicies([]);
      setError(`Failed to load repository (${res.status}). ${txt.slice(0, 120)}`);
      setLoading(false);
      return;
    }

    const data = await res.json();
    setPolicies(Array.isArray(data?.items) ? data.items : []);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, [jurisdictionFilter, stateFilter, energySourceFilter, domainFilter, yearFilter]);

  const emptyText = useMemo(() => {
    if (error) return error;
    if (loading) return "Loading public repository...";
    if (policies.length === 0) return "No public policies match this filter.";
    return "";
  }, [error, loading, policies.length]);

  const importPolicy = async (policyId: string) => {
    if (!user) return;
    try {
      setImportingId(policyId);
      const imported = await importPublicPolicyToWorkspace({
        uid: user.uid,
        userName: profile?.fullName ?? null,
        userEmail: user.email ?? null,
        publicPolicyId: policyId,
      });
      toast.success(imported.reused ? "Workspace copy already exists. Opening it now..." : "Policy added to your workspace");
      router.push(`/policies/${imported.slug}`);
    } catch (error: any) {
      console.error(error);
      toast.error(error?.message || "Could not add this policy to your workspace");
    } finally {
      setImportingId(null);
    }
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <section className="overflow-hidden rounded-[2rem] bg-[linear-gradient(135deg,#081f30_0%,#103851_52%,#125669_100%)] p-7 text-white shadow-[0_24px_70px_rgba(8,31,48,0.18)]">
            <div className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr] lg:items-end">
              <div>
                <Badge variant="outline" className="border-white/20 bg-white/10 text-white">Signed-in repository</Badge>
                <h1 className="mt-4 text-3xl font-black tracking-tight md:text-4xl">Browse public policy intelligence without leaving your workspace.</h1>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-white/78">
                  Explore public records, pull strong examples into your private workspace, then critique, simulate, and revise them there.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Card className="rounded-[1.5rem] border-white/10 bg-white/8 p-4 text-white">
                  <p className="text-xs uppercase tracking-[0.18em] text-white/68">Country focus</p>
                  <p className="mt-2 text-xl font-black">{NIGERIA_COUNTRY}</p>
                </Card>
                <Card className="rounded-[1.5rem] border-white/10 bg-white/8 p-4 text-white">
                  <p className="text-xs uppercase tracking-[0.18em] text-white/68">Workspace action</p>
                  <p className="mt-2 text-sm text-white/78">Use "Add to workspace" to create a private working copy.</p>
                </Card>
              </div>
            </div>
          </section>

          <Card className="premium-card rounded-[2rem] p-5">
            <div className="flex items-center gap-2 mb-4">
              <Filter size={16} className="text-blue-electric" />
              <p className="font-bold text-blue-deep">Repository filters</p>
            </div>

            <div className="flex flex-col gap-4">
              <div>
                <p className="mb-2 text-sm font-medium">Search</p>
                <div className="flex flex-col gap-2 md:flex-row">
                  <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search title, summary, tags..." />
                  <Button onClick={load} className="rounded-full bg-[#125669] hover:bg-[#0f4b5d]">Search</Button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3 xl:grid-cols-5">
                <div>
                  <p className="mb-2 text-sm font-medium">Jurisdiction</p>
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
                  <p className="mb-2 text-sm font-medium">State</p>
                  <Select value={stateFilter} onValueChange={setStateFilter} disabled={jurisdictionFilter === "federal"}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All states</SelectItem>
                      {NIGERIA_STATES.map((state) => (
                        <SelectItem key={state} value={state}>{state}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <p className="mb-2 text-sm font-medium">Energy source</p>
                  <Select value={energySourceFilter} onValueChange={setEnergySourceFilter}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      {POLICY_ENERGY_SOURCES.map((item) => (
                        <SelectItem key={item} value={item}>{policyEnergySourceLabel(item)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <p className="mb-2 text-sm font-medium">Domain</p>
                  <Select value={domainFilter} onValueChange={setDomainFilter}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      {POLICY_DOMAINS.map((item) => (
                        <SelectItem key={item} value={item}>{policyDomainLabel(item)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <p className="mb-2 text-sm font-medium">Year</p>
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
            </div>
          </Card>

          <Card className="premium-card rounded-[2rem] p-4">
            {emptyText ? (
              <p className="text-sm text-[var(--text-secondary)]">{emptyText}</p>
            ) : (
              <div className="space-y-3">
                {policies.map((policy) => (
                  <div key={policy.id} className="rounded-[1.5rem] border bg-white/85 p-4">
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="rounded-2xl bg-[rgba(18,86,105,0.08)] p-3 text-[#125669]">
                            <Database size={18} />
                          </div>
                          <p className="break-anywhere text-lg font-black text-blue-deep">{policy.title}</p>
                          <Badge variant="outline">{policy.jurisdictionLevel === "federal" ? "Federal" : "State"}</Badge>
                          {policy.state ? <Badge variant="outline">{policy.state}</Badge> : null}
                          {policy.policyYear ? <Badge variant="outline">{policy.policyYear}</Badge> : null}
                          {policy.energySource ? <Badge variant="outline">{policyEnergySourceLabel(policy.energySource)}</Badge> : null}
                          {policy.domain ? <Badge variant="outline">{policyDomainLabel(policy.domain)}</Badge> : null}
                        </div>
                        {policy.summary ? (
                          <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{policy.summary}</p>
                        ) : null}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {/* <Button variant="secondary" className="rounded-full" onClick={() => router.push(`/public/policies/${policy.slug ?? policy.id}`)}>
                          View record
                        </Button> */}
                        <Button
                          className="rounded-full bg-[#125669] hover:bg-[#0f4b5d]"
                          onClick={() => importPolicy(policy.id)}
                          disabled={importingId === policy.id}
                        >
                          <Sparkles size={15} />
                          {importingId === policy.id ? "Adding..." : "Add to workspace"}
                        </Button>
                        <Button
                          variant="outline"
                          className="rounded-full"
                          onClick={() => router.push(`/critique?policyId=${policy.id}`)}
                        >
                          <Lock size={14} />
                          Critique directly
                        </Button>
                        {(policy.publicPdfUrl) ? (
                          <Button variant="outline" className="rounded-full" onClick={() => window.open(policy.publicPdfUrl!, "_blank")}>
                            <Download size={14} />
                            PDF
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
