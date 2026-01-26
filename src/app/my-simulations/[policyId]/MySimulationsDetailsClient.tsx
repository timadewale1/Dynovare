"use client";

import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import ProtectedRoute from "@/components/guards/ProtectedRoute";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRouter, useParams } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, doc, getDoc, getDocs, limit, orderBy, query } from "firebase/firestore";
import { ArrowLeft, ExternalLink, BarChart3, ChevronDown } from "lucide-react";
import SimulationCharts from "@/components/simulations/SimulationCharts";

export default function MySimulationsDetailsClient() {
  const router = useRouter();
  const params = useParams<{ policyId: string }>();
  const policyId = params.policyId;

  const [loading, setLoading] = useState(true);
  const [policy, setPolicy] = useState<any | null>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);

        const pSnap = await getDoc(doc(db, "policies", policyId));
        const basePolicy = pSnap.exists() ? { id: pSnap.id, ...(pSnap.data() as any) } : null;
        setPolicy(basePolicy);

        const simSnap = await getDocs(
          query(
            collection(db, "policies", policyId, "simulations"),
            orderBy("createdAt", "desc"),
            limit(50)
          )
        );
        setTimeline(simSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
      } catch (e) {
        console.error("MySimulationsDetails load error:", e);
      } finally {
        setLoading(false);
      }
    };

    if (policyId) load();
  }, [policyId]);

  const baseSlug = policy?.slug;
  const baseTitle = policy?.title ?? "Policy";

  const summary = useMemo(() => {
    if (timeline.length === 0) return null;
    const latest = timeline[0];
    return {
      riskLevel: latest.outputs?.riskLevel ?? null,
      access: latest.outputs?.accessImpactPct ?? null,
      emissions: latest.outputs?.emissionsChangePct ?? null,
      runs: timeline.length,
    };
  }, [timeline]);

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="mb-6 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <Button variant="outline" onClick={() => router.push("/my-simulations")} className="gap-2">
              <ArrowLeft size={16} />
              Back
            </Button>

            <div>
              <h1 className="text-2xl font-bold text-blue-deep">{baseTitle}</h1>
              <p className="text-sm text-[var(--text-secondary)] mt-1">
                Simulation history timeline (accordion style).
              </p>
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            <Button
              variant="outline"
              onClick={() => router.push(`/simulations?policyId=${policyId}`)}
              className="gap-2"
            >
              <BarChart3 size={16} />
              Simulate again
            </Button>

            {baseSlug && (
              <Button variant="outline" onClick={() => router.push(`/policies/${baseSlug}`)} className="gap-2">
                <ExternalLink size={16} />
                View policy
              </Button>
            )}
          </div>
        </div>

        {loading ? (
          <Card className="p-6">
            <p className="text-sm text-[var(--text-secondary)]">Loading simulations…</p>
          </Card>
        ) : timeline.length === 0 ? (
          <Card className="p-6">
            <p className="text-sm text-[var(--text-secondary)]">
              No simulations yet for this policy.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Timeline */}
            <Card className="p-6 lg:col-span-2">
              <div className="flex items-center justify-between gap-3 mb-4">
                <h2 className="text-lg font-bold text-blue-deep">Timeline</h2>
                <Badge variant="outline">{timeline.length} runs</Badge>
              </div>

              <div className="space-y-3">
                {timeline.map((s, idx) => {
                  const isOpen = openId === s.id;
                  const out = s.outputs ?? {};
                  const inp = s.inputs ?? {};

                  return (
                    <div key={s.id} className="border rounded-xl overflow-hidden bg-white">
                      {/* Header */}
                      <button
                        type="button"
                        onClick={() => setOpenId(isOpen ? null : s.id)}
                        className="w-full text-left p-4 hover:bg-blue-soft transition flex items-start justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <p className="font-bold text-blue-deep">
                            Run #{timeline.length - idx} • Risk: {out.riskLevel ?? "N/A"}
                          </p>
                          <p className="text-xs text-[var(--text-secondary)] mt-1">
                            Horizon: {inp.horizonYears ?? "—"} years • Adoption: {inp.adoptionRate ?? "—"}%
                          </p>

                          <div className="flex flex-wrap gap-2 mt-3">
                            <Badge variant="outline">Access {out.accessImpactPct ?? "—"}%</Badge>
                            <Badge variant="outline">Reliability {out.reliabilityImpactPct ?? "—"}%</Badge>
                            <Badge variant="outline">Emissions {out.emissionsChangePct ?? "—"}%</Badge>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <ChevronDown
                            size={18}
                            className={`text-blue-electric transition-transform ${isOpen ? "rotate-180" : ""}`}
                          />
                        </div>
                      </button>

                      {/* Collapsible body */}
                      <div
                        className={`grid transition-all duration-300 ease-in-out ${
                          isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                        }`}
                      >
                        <div className="overflow-hidden">
                          <div className="px-4 pb-4 space-y-4">
                            {/* charts */}
                            {out && inp ? (
                              <SimulationCharts
                                horizonYears={inp.horizonYears ?? 5}
                                accessImpactPct={out.accessImpactPct ?? 0}
                                reliabilityImpactPct={out.reliabilityImpactPct ?? 0}
                                emissionsChangePct={out.emissionsChangePct ?? 0}
                                riskLevel={out.riskLevel ?? "Medium"}
                              />
                            ) : null}

                            {/* narrative + cost */}
                            <div className="border rounded-xl p-4">
                              <p className="font-bold text-blue-deep">Narrative</p>
                              <p className="text-sm text-[var(--text-secondary)] mt-1">
                                {out.narrative ?? "—"}
                              </p>
                            </div>

                            <div className="border rounded-xl p-4">
                              <p className="font-bold text-blue-deep">Estimated cost</p>
                              <p className="text-sm text-[var(--text-secondary)] mt-1">
                                {out.estimatedCostUSD
                                  ? `$${Number(out.estimatedCostUSD.low).toLocaleString()} – $${Number(
                                      out.estimatedCostUSD.high
                                    ).toLocaleString()}`
                                  : "—"}
                              </p>
                            </div>

                            {/* inputs snapshot */}
                            <div className="border rounded-xl p-4">
                              <p className="font-bold text-blue-deep">Inputs used</p>
                              <div className="text-sm text-[var(--text-secondary)] mt-2 space-y-1">
                                <p>Implementation: <span className="font-semibold text-blue-deep">{inp.implementationStrength ?? "—"}</span></p>
                                <p>Funding: <span className="font-semibold text-blue-deep">{inp.fundingLevel ?? "—"}</span></p>
                                <p>
                                  Assumptions:{" "}
                                  <span className="font-semibold text-blue-deep">
                                    {inp.assumptions
                                      ? Object.entries(inp.assumptions)
                                          .filter(([, v]) => Boolean(v))
                                          .map(([k]) => k)
                                          .join(", ") || "None"
                                      : "—"}
                                  </span>
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Summary panel */}
            <Card className="p-6">
              <h2 className="text-lg font-bold text-blue-deep mb-2">Latest snapshot</h2>
              {summary ? (
                <div className="space-y-3 text-sm text-[var(--text-secondary)]">
                  <p>
                    Latest risk:{" "}
                    <span className="font-semibold text-blue-deep">{summary.riskLevel ?? "—"}</span>
                  </p>
                  <p>
                    Access impact:{" "}
                    <span className="font-semibold text-blue-deep">{summary.access ?? "—"}%</span>
                  </p>
                  <p>
                    Emissions change:{" "}
                    <span className="font-semibold text-blue-deep">{summary.emissions ?? "—"}%</span>
                  </p>
                  <p>
                    Total runs:{" "}
                    <span className="font-semibold text-blue-deep">{summary.runs}</span>
                  </p>

                  <Button className="w-full mt-3" onClick={() => router.push("/policies")}>
                    Explore policies
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-[var(--text-secondary)]">No data.</p>
              )}
            </Card>
          </div>
        )}
      </DashboardLayout>
    </ProtectedRoute>
  );
}
