"use client";

import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import ProtectedRoute from "@/components/guards/ProtectedRoute";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileText, Sparkles, BarChart3, Filter } from "lucide-react";
import { NIGERIA_COUNTRY, NIGERIA_STATES } from "@/lib/ngStates";
import { fetchPolicies } from "@/lib/policiesRepo";
import type { Policy, PolicyType } from "@/lib/policyTypes";
import { useRouter } from "next/navigation";

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

export default function PoliciesPage() {
  const router = useRouter();

  const [jurisdictionFilter, setJurisdictionFilter] = useState<
    "all" | "federal" | "state"
  >("all");

  const [stateFilter, setStateFilter] = useState<string>("all");
  const [sectorFilter, setSectorFilter] = useState<string>("all");
  const [yearFilter, setYearFilter] = useState<string>("all");

  const [typeFilter, setTypeFilter] = useState<PolicyType | "all">("all");
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [policies, setPolicies] = useState<Policy[]>([]);

  // If user chooses federal, stateFilter becomes irrelevant
  useEffect(() => {
    if (jurisdictionFilter === "federal") setStateFilter("all");
  }, [jurisdictionFilter]);

  const load = async () => {
    setLoading(true);

    const items = await fetchPolicies({
      jurisdictionLevel: jurisdictionFilter,
      state: stateFilter,
      type: typeFilter,
      sector: sectorFilter,
      policyYear: yearFilter === "all" ? "all" : Number(yearFilter),
      search,
    });

    setPolicies(items);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jurisdictionFilter, stateFilter, typeFilter, sectorFilter, yearFilter]);

  const onSearch = () => load();

  const emptyText = useMemo(() => {
    if (loading) return "Loading policies…";
    if (policies.length === 0) return "No policies found for this filter.";
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
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-blue-soft text-blue-electric">
              <FileText size={26} strokeWidth={2.2} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-blue-deep">Policy Repository</h1>
              <p className="text-sm text-[var(--text-secondary)]">
                Global repository of uploaded and AI-generated policies (Nigeria-first).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button onClick={() => router.push("/policies/upload")}>
              Upload New Policy
            </Button>

            <div className="text-sm font-semibold text-blue-deep bg-blue-soft px-3 py-2 rounded-lg">
              Country: {NIGERIA_COUNTRY}
            </div>
          </div>
        </div>

        {/* Controls */}
        <Card className="p-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Filter size={16} className="text-blue-electric" />
            <p className="font-bold text-blue-deep">Filters</p>
          </div>

          <div className="flex flex-col gap-4">
            {/* Search */}
            <div>
              <p className="text-sm font-medium mb-2">Search</p>
              <div className="flex gap-2">
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by title, summary, tags…"
                />
                <Button onClick={onSearch}>Search</Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Jurisdiction */}
              <div>
                <p className="text-sm font-medium mb-2">Jurisdiction</p>
                <Select
                  value={jurisdictionFilter}
                  onValueChange={(v) => setJurisdictionFilter(v as any)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select jurisdiction" />
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
                  disabled={jurisdictionFilter === "federal"}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select state" />
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
                <Select value={sectorFilter} onValueChange={setSectorFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select sector" />
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

              {/* Year */}
              <div>
                <p className="text-sm font-medium mb-2">Year</p>
                <Select value={yearFilter} onValueChange={setYearFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All years</SelectItem>
                    {Array.from({ length: 16 }).map((_, i) => {
                      const y = 2026 - i;
                      return (
                        <SelectItem key={y} value={String(y)}>
                          {y}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Type tabs */}
            <div>
              <p className="text-sm font-medium mb-2">Type</p>
              <Tabs value={typeFilter} onValueChange={(v) => setTypeFilter(v as any)}>
                <TabsList className="w-full">
                  <TabsTrigger className="flex-1" value="all">
                    All
                  </TabsTrigger>
                  <TabsTrigger className="flex-1" value="uploaded">
                    Uploaded
                  </TabsTrigger>
                  <TabsTrigger className="flex-1" value="ai_generated">
                    AI Generated
                  </TabsTrigger>
                  <TabsTrigger className="flex-1" value="public_source">
                    Public Source
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
        </Card>

        {/* List */}
        <Card className="p-4">
          {emptyText ? (
            <p className="text-sm text-[var(--text-secondary)]">{emptyText}</p>
          ) : (
            <div className="space-y-3">
              {policies.map((p: any) => (
                <div
                  key={p.id}
                  className="border rounded-xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-blue-deep truncate">{p.title}</p>
                      {typeBadge(p.type)}

                      <Badge variant="outline">
                        {p.jurisdictionLevel === "federal" ? "Federal" : "State"}
                      </Badge>

                      {p.jurisdictionLevel === "state" && p.state ? (
                        <Badge variant="outline">{p.state}</Badge>
                      ) : null}

                      {p.policyYear ? <Badge variant="outline">{p.policyYear}</Badge> : null}

                      {p.sector ? <Badge variant="outline">{p.sector}</Badge> : null}
                    </div>

                    {p.summary && (
                      <p className="text-sm text-[var(--text-secondary)] mt-1 line-clamp-2">
                        {p.summary}
                      </p>
                    )}

                    {p.source?.publisher && p.source?.url && (
                      <p className="text-xs text-[var(--text-secondary)] mt-2">
                        Source: {p.source.publisher}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    <Button
                      variant="secondary"
                      onClick={() => router.push(`/policies/${p.slug ?? p.id}`)}
                    >
                      View
                    </Button>

                    <Button
                      onClick={() => router.push(`/critique?policyId=${p.id}`)}
                      className="gap-2"
                    >
                      <Sparkles size={16} />
                      Critique
                    </Button>

                    <Button
                      variant="outline"
                      onClick={() => router.push(`/simulations?policyId=${p.id}`)}
                      className="gap-2"
                    >
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
