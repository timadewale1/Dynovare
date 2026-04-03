"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import PublicNavbar from "@/components/public/PublicNavbar";
import PublicFooter from "@/components/public/PublicFooter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Database, Filter, Globe2, Lock, MapPinned } from "lucide-react";
import { NIGERIA_COUNTRY, NIGERIA_STATES } from "@/lib/ngStates";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@/components/providers/UserProvider";
import { importPublicPolicyToWorkspace } from "@/lib/policyWrites";
import toast from "react-hot-toast";
import { POLICY_DOMAINS, POLICY_ENERGY_SOURCES, policyDomainLabel, policyEnergySourceLabel } from "@/lib/policyTaxonomy";

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
  storagePath?: string | null;
  publicPdfUrl?: string | null;
};

function PublicPoliciesPageContent() {
  const router = useRouter();
  const { user, profile } = useUser();
  const searchParams = useSearchParams();
  const [jurisdictionFilter, setJurisdictionFilter] = useState<"all" | "federal" | "state">(
    (searchParams.get("jurisdictionLevel") as any) || "all"
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

  const emptyText = useMemo(() => {
    if (error) return error;
    if (loading) return "Loading public policies...";
    if (policies.length === 0) return "No public policies match this filter.";
    return "";
  }, [error, loading, policies.length]);

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
    <div className="min-h-screen bg-[linear-gradient(180deg,#f5fbff_0%,#ffffff_24%)]">
      <PublicNavbar />

      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="premium-card rounded-[2rem] p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-blue-soft p-3 text-blue-electric">
                <Database size={24} />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl font-black text-blue-deep">Public Policy Repository</h1>
                  <Badge variant="secondary">Read-only</Badge>
                </div>
                <p className="text-sm text-[var(--text-secondary)] mt-1">
                  Explore national and subnational energy policy records, public scores, and repository metadata.
                </p>
              </div>
            </div>
          </Card>

          <Card className="rounded-[2rem] border-white/70 bg-[#003869] p-6 text-white shadow-sm">
            <div className="flex items-center gap-3">
              <MapPinned className="text-white" size={22} />
              <div>
                <p className="text-sm font-semibold">Nigeria-first public intelligence</p>
                <p className="text-sm text-white/75 mt-1">
                  Browse what is public here, then switch to your workspace when you want critique, simulation, drafting, or exports.
                </p>
              </div>
            </div>
            <div className="mt-5 flex gap-2 flex-wrap">
              {user ? (
                <Button variant="secondary" className="text-blue-deep" onClick={() => router.push("/repository")}>Open signed-in repository</Button>
              ) : (
                <Button variant="secondary" className="text-blue-deep" onClick={() => router.push("/register")}>Create account</Button>
              )}
              <Button variant="outline" className="border-white/20 bg-transparent text-white hover:bg-white/10" onClick={() => router.push(user ? "/rankings" : "/rankings")}>
                View rankings
              </Button>
            </div>
          </Card>
        </div>

        <Card className="premium-card mt-6 rounded-[2rem] bg-blue-soft/70 p-4">
          <p className="text-sm text-blue-deep">
            Uploaded policies and AI-generated drafts do not appear here automatically. They stay private until intentionally curated.
          </p>
        </Card>

        <Card className="premium-card p-5 mt-6 rounded-[2rem] shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Filter size={16} className="text-blue-electric" />
            <p className="font-bold text-blue-deep">Repository filters</p>
          </div>

          <div className="flex flex-col gap-4">
            <div>
              <p className="text-sm font-medium mb-2">Search</p>
              <div className="flex gap-2">
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search title, summary, tags..." />
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
                  <TabsTrigger className="flex-1" value="public_source">Public Source</TabsTrigger>
                  <TabsTrigger className="flex-1" value="uploaded">Curated Upload</TabsTrigger>
                  <TabsTrigger className="flex-1" value="ai_generated">Curated AI</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
        </Card>

        <Card className="premium-card mt-6 rounded-[2rem] p-4 shadow-sm">
          {emptyText ? (
            <p className="text-sm text-[var(--text-secondary)]">{emptyText}</p>
          ) : (
            <div className="space-y-3">
              {policies.map((p) => (
                <div key={p.id} className="border rounded-2xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div className="min-w-0 max-w-full">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-blue-deep break-anywhere line-clamp-2">{p.title}</p>
                      <Badge variant="outline">{p.jurisdictionLevel === "federal" ? "Federal" : "State"}</Badge>
                      {p.state ? <Badge variant="outline">{p.state}</Badge> : null}
                      {p.policyYear ? <Badge variant="outline">{p.policyYear}</Badge> : null}
                      {p.energySource ? <Badge variant="outline">{policyEnergySourceLabel(p.energySource)}</Badge> : null}
                      {p.domain ? <Badge variant="outline">{policyDomainLabel(p.domain)}</Badge> : null}
                    </div>

                    {p.summary ? <p className="text-sm text-[var(--text-secondary)] mt-1 line-clamp-2">{p.summary}</p> : null}
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    {/* <Button variant="secondary" onClick={() => router.push(`/public/policies/${p.slug ?? p.id}`)}>
                      View
                    </Button> */}
                    <Button variant="outline" className="gap-2" onClick={() => (user ? addToWorkspace(p.id) : router.push("/register"))} disabled={importingId === p.id}>
                      <Lock size={14} />
                      {user ? (importingId === p.id ? "Adding..." : "Add to workspace") : "Login for AI actions"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <div className="mt-8 flex items-center justify-between gap-3 flex-wrap">
          <div className="text-sm text-[var(--text-secondary)]">Country focus: {NIGERIA_COUNTRY}</div>
          <Button variant="outline" className="gap-2" onClick={() => router.push("/rankings")}>
            <Globe2 size={16} />
            Open rankings
          </Button>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}

export default function PublicPoliciesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[linear-gradient(180deg,#f5fbff_0%,#ffffff_24%)]" />}>
      <PublicPoliciesPageContent />
    </Suspense>
  );
}
