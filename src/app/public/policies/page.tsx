"use client";

import { useEffect, useMemo, useState } from "react";
import PublicNavbar from "@/components/public/PublicNavbar";
import PublicFooter from "@/components/public/PublicFooter";

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

import { FileText, Filter } from "lucide-react";
import { NIGERIA_COUNTRY, NIGERIA_STATES } from "@/lib/ngStates";
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
  tags?: string[];
  storagePath?: string | null;
  publicPdfUrl?: string | null;
};

export default function PublicPoliciesPage() {
  const router = useRouter();

  const [jurisdictionFilter, setJurisdictionFilter] = useState<"all" | "federal" | "state">("all");
  const [stateFilter, setStateFilter] = useState<string>("all");
  const [sectorFilter, setSectorFilter] = useState<string>("all");
  const [yearFilter, setYearFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<PublicPolicy["type"] | "all">("all");
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [policies, setPolicies] = useState<PublicPolicy[]>([]);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (jurisdictionFilter === "federal") setStateFilter("all");
  }, [jurisdictionFilter]);

  const load = async () => {
    setLoading(true);
    setError("");

    const qs = new URLSearchParams();
    qs.set("jurisdictionLevel", String(jurisdictionFilter));
    qs.set("state", String(stateFilter));
    qs.set("type", String(typeFilter));
    qs.set("sector", String(sectorFilter));
    qs.set("policyYear", String(yearFilter));
    qs.set("search", String(search));

    const res = await fetch(`/api/public/policies?${qs.toString()}`, { method: "GET" });

    if (!res.ok) {
      const txt = await res.text(); // may be HTML
      setLoading(false);
      setPolicies([]);
      setError(`Failed to load policies (${res.status}). ${txt.slice(0, 120)}`);
      return;
    }

    const data = await res.json();
    setPolicies(Array.isArray(data?.items) ? data.items : []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jurisdictionFilter, stateFilter, typeFilter, sectorFilter, yearFilter]);

  const onSearch = () => load();

  const emptyText = useMemo(() => {
    if (error) return error;
    if (loading) return "Loading policies…";
    if (policies.length === 0) return "No policies found for this filter.";
    return "";
  }, [loading, policies.length, error]);

  const typeBadge = (t?: PublicPolicy["type"]) => {
    if (t === "uploaded") return <Badge>Uploaded</Badge>;
    if (t === "ai_generated") return <Badge variant="secondary">AI Generated</Badge>;
    if (t === "public_source") return <Badge variant="outline">Public Source</Badge>;
    return <Badge variant="outline">Policy</Badge>;
  };

  return (
    <div className="min-h-screen bg-white">
      <PublicNavbar />

      <main className="mx-auto max-w-6xl px-4 py-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-blue-soft text-blue-electric">
              <FileText size={26} strokeWidth={2.2} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold text-blue-deep">Public Policy Repository</h1>
                <Badge variant="secondary">Public</Badge>
              </div>
              <p className="text-sm text-[var(--text-secondary)]">
                Browse policies, read details, view critique and simulation history, and download where available.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="text-sm font-semibold text-blue-deep bg-blue-soft px-3 py-2 rounded-lg">
              Country: {NIGERIA_COUNTRY}
            </div>
            <Button onClick={() => router.push("/register")}>Create account</Button>
          </div>
        </div>

        {/* Read-only banner */}
        <Card className="p-4 mb-6 border-blue-electric/30 bg-blue-soft">
          <p className="text-sm text-blue-deep">
            You are viewing the public repository in read-only mode.{" "}
            <button
              onClick={() => router.push("/login")}
              className="font-semibold underline underline-offset-4"
            >
              Login
            </button>{" "}
            or{" "}
            <button
              onClick={() => router.push("/register")}
              className="font-semibold underline underline-offset-4"
            >
              create an account
            </button>{" "}
            to run critiques, simulations, or upload policies.
          </p>
        </Card>

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
                <Select value={jurisdictionFilter} onValueChange={(v) => setJurisdictionFilter(v as any)}>
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
                <Select value={stateFilter} onValueChange={setStateFilter} disabled={jurisdictionFilter === "federal"}>
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
                  <TabsTrigger className="flex-1" value="all">All</TabsTrigger>
                  <TabsTrigger className="flex-1" value="uploaded">Uploaded</TabsTrigger>
                  <TabsTrigger className="flex-1" value="ai_generated">AI Generated</TabsTrigger>
                  <TabsTrigger className="flex-1" value="public_source">Public Source</TabsTrigger>
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
                  className="border rounded-xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3 max-w-full overflow-hidden"
                >
                  <div className="min-w-0 max-w-full">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-blue-deep break-anywhere line-clamp-2">
                        {p.title}
                      </p>
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

                    {p.summary ? (
                      <p className="text-sm text-[var(--text-secondary)] mt-1 line-clamp-2">
                        {p.summary}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex gap-2 flex-wrap max-w-full">
                    <Button
                      variant="secondary"
                      onClick={() => router.push(`/public/policies/${p.slug ?? p.id}`)}
                    >
                      View
                    </Button>

                    <Button variant="outline" onClick={() => router.push("/login")}>
                      Login to run actions
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </main>

      <PublicFooter />
    </div>
  );
}
