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
import { FileText, Sparkles, BarChart3 } from "lucide-react";
import { NIGERIA_COUNTRY, NIGERIA_STATES } from "@/lib/ngStates";
import { fetchPolicies } from "@/lib/policiesRepo";
import type { Policy, PolicyType } from "@/lib/policyTypes";
import { useRouter } from "next/navigation";

export default function PoliciesPage() {
  const router = useRouter();

  const [stateFilter, setStateFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<PolicyType | "all">("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [policies, setPolicies] = useState<Policy[]>([]);

  const load = async () => {
    setLoading(true);
    const items = await fetchPolicies({
      state: stateFilter,
      type: typeFilter,
      search,
    });
    setPolicies(items);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stateFilter, typeFilter]);

  // search triggers manually (avoid querying per keystroke)
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

          {/* Country fixed for now */}
          <div className="text-sm font-semibold text-blue-deep bg-blue-soft px-3 py-2 rounded-lg">
            Country: {NIGERIA_COUNTRY}
          </div>
        </div>

        {/* Controls */}
        <Card className="p-4 mb-6">
          <div className="flex flex-col md:flex-row md:items-end gap-4">
            {/* Search */}
            <div className="flex-1">
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

            {/* State filter */}
            <div className="w-full md:w-64">
              <p className="text-sm font-medium mb-2">State</p>
              <Select value={stateFilter} onValueChange={setStateFilter}>
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

            {/* Type tabs */}
            <div className="w-full md:w-96">
              <p className="text-sm font-medium mb-2">Type</p>
              <Tabs
                value={typeFilter}
                onValueChange={(v) => setTypeFilter(v as any)}
              >
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
              {policies.map((p) => (
                <div
                  key={p.id}
                  className="border rounded-xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-blue-deep truncate">
                        {p.title}
                      </p>
                      {typeBadge(p.type)}
                      <Badge variant="outline">{p.state}</Badge>
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
                      onClick={() =>
                        router.push(`/simulations?policyId=${p.id}`)
                      }
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
