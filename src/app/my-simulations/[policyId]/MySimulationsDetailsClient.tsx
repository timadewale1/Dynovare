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
import { useUser } from "@/components/providers/UserProvider";

export default function MySimulationsDetailsClient() {
  const router = useRouter();
  const params = useParams<{ policyId: string }>();
  const policyId = params.policyId;
  const { user } = useUser();

  const [loading, setLoading] = useState(true);
  const [policy, setPolicy] = useState<any | null>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        if (!user) return;

        const pSnap = await getDoc(doc(db, "users", user.uid, "policies", policyId));
        const basePolicy = pSnap.exists() ? { id: pSnap.id, ...(pSnap.data() as any) } : null;
        setPolicy(basePolicy);

        const simSnap = await getDocs(
          query(collection(db, "users", user.uid, "policies", policyId, "simulations"), orderBy("createdAt", "desc"), limit(50))
        );
        setTimeline(simSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
      } catch (e) {
        console.error("MySimulationsDetails load error:", e);
      } finally {
        setLoading(false);
      }
    };

    if (policyId && user) void load();
  }, [policyId, user]);

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
        <section className="mb-6 rounded-[2rem] bg-[linear-gradient(135deg,#081f30_0%,#103851_52%,#125669_100%)] p-7 text-white shadow-[0_24px_70px_rgba(8,31,48,0.18)]">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <Button variant="outline" onClick={() => router.push("/my-simulations")} className="gap-2 border-white/20 bg-transparent text-white hover:bg-white/10">
                <ArrowLeft size={16} />
                Back
              </Button>
              <div>
                <h1 className="text-4xl font-black tracking-tight">{policy?.title ?? "Simulation history"}</h1>
                <p className="mt-3 text-sm text-white/78">
                  Compare scenario runs, review assumptions, and reopen the full modeled outlook for each simulation.
                </p>
              </div>
            </div>

            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" onClick={() => router.push(`/simulations?policyId=${policyId}`)} className="gap-2 border-white/20 bg-transparent text-white hover:bg-white/10">
                <BarChart3 size={16} />
                Simulate again
              </Button>
              {policy?.slug ? (
                <Button variant="outline" onClick={() => router.push(`/policies/${policy.slug}`)} className="gap-2 border-white/20 bg-transparent text-white hover:bg-white/10">
                  <ExternalLink size={16} />
                  View policy
                </Button>
              ) : null}
            </div>
          </div>
        </section>

        {loading ? (
          <Card className="premium-card p-6">
            <p className="text-sm text-[var(--text-secondary)]">Loading simulations...</p>
          </Card>
        ) : timeline.length === 0 ? (
          <Card className="premium-card p-6">
            <p className="text-sm text-[var(--text-secondary)]">No simulations yet for this policy.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <Card className="premium-card p-6 lg:col-span-2">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-lg font-bold text-blue-deep">Timeline</h2>
                <Badge variant="outline">{timeline.length} runs</Badge>
              </div>

              <div className="space-y-3">
                {timeline.map((s, idx) => {
                  const isOpen = openId === s.id;
                  const out = s.outputs ?? {};
                  const inp = s.inputs ?? {};

                  return (
                    <div key={s.id} className="overflow-hidden rounded-xl border bg-white">
                      <button
                        type="button"
                        onClick={() => setOpenId(isOpen ? null : s.id)}
                        className="flex w-full items-start justify-between gap-3 p-4 text-left transition hover:bg-blue-soft"
                      >
                        <div className="min-w-0">
                          <p className="font-bold text-blue-deep">Run #{timeline.length - idx} · Risk: {out.riskLevel ?? "N/A"}</p>
                          <p className="mt-1 text-xs text-[var(--text-secondary)]">
                            Horizon: {inp.horizonYears ?? "-"} years · Adoption: {inp.adoptionRate ?? "-"}%
                          </p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <Badge variant="outline">Access {out.accessImpactPct ?? "-"}%</Badge>
                            <Badge variant="outline">Reliability {out.reliabilityImpactPct ?? "-"}%</Badge>
                            <Badge variant="outline">Emissions {out.emissionsChangePct ?? "-"}%</Badge>
                          </div>
                        </div>
                        <ChevronDown size={18} className={`text-blue-electric transition-transform ${isOpen ? "rotate-180" : ""}`} />
                      </button>

                      <div className={`grid transition-all duration-300 ease-in-out ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
                        <div className="overflow-hidden">
                          <div className="space-y-4 px-4 pb-4">
                            <SimulationCharts
                              horizonYears={inp.horizonYears ?? 5}
                              accessImpactPct={out.accessImpactPct ?? 0}
                              reliabilityImpactPct={out.reliabilityImpactPct ?? 0}
                              emissionsChangePct={out.emissionsChangePct ?? 0}
                              riskLevel={out.riskLevel ?? "medium"}
                            />

                            {out.scenarioHeadline ? (
                              <div className="rounded-xl border p-4">
                                <p className="font-bold text-blue-deep">Scenario headline</p>
                                <p className="mt-1 text-sm text-[var(--text-secondary)]">{out.scenarioHeadline}</p>
                              </div>
                            ) : null}

                            <div className="rounded-xl border p-4">
                              <p className="font-bold text-blue-deep">Narrative</p>
                              <p className="mt-1 text-sm text-[var(--text-secondary)]">{out.narrative ?? "-"}</p>
                            </div>

                            <div className="grid gap-3 md:grid-cols-2">
                              <div className="rounded-xl border p-4">
                                <p className="font-bold text-blue-deep">Estimated cost</p>
                                <p className="mt-1 text-sm text-[var(--text-secondary)]">
                                  {out.estimatedCostUSD
                                    ? `$${Number(out.estimatedCostUSD.low).toLocaleString()} - $${Number(out.estimatedCostUSD.high).toLocaleString()}`
                                    : "-"}
                                </p>
                              </div>
                              <div className="rounded-xl border p-4">
                                <p className="font-bold text-blue-deep">Readiness</p>
                                <p className="mt-1 text-sm text-[var(--text-secondary)]">
                                  Investment: <span className="font-semibold text-blue-deep capitalize">{out.investmentReadiness ?? "-"}</span>
                                </p>
                                <p className="mt-1 text-sm text-[var(--text-secondary)]">
                                  Delivery: <span className="font-semibold text-blue-deep capitalize">{out.deliveryReadiness ?? "-"}</span>
                                </p>
                              </div>
                            </div>

                            <div className="grid gap-3 md:grid-cols-3">
                              {Array.isArray(out.costDrivers) && out.costDrivers.length > 0 ? (
                                <div className="rounded-xl border p-4">
                                  <p className="font-bold text-blue-deep">Cost drivers</p>
                                  <ul className="mt-2 ml-5 list-disc space-y-1 text-sm text-[var(--text-secondary)]">
                                    {out.costDrivers.map((item: string, i: number) => <li key={i}>{item}</li>)}
                                  </ul>
                                </div>
                              ) : null}
                              {Array.isArray(out.criticalRisks) && out.criticalRisks.length > 0 ? (
                                <div className="rounded-xl border p-4">
                                  <p className="font-bold text-blue-deep">Critical risks</p>
                                  <ul className="mt-2 ml-5 list-disc space-y-1 text-sm text-[var(--text-secondary)]">
                                    {out.criticalRisks.map((item: string, i: number) => <li key={i}>{item}</li>)}
                                  </ul>
                                </div>
                              ) : null}
                              {Array.isArray(out.enablingActions) && out.enablingActions.length > 0 ? (
                                <div className="rounded-xl border p-4">
                                  <p className="font-bold text-blue-deep">Enabling actions</p>
                                  <ul className="mt-2 ml-5 list-disc space-y-1 text-sm text-[var(--text-secondary)]">
                                    {out.enablingActions.map((item: string, i: number) => <li key={i}>{item}</li>)}
                                  </ul>
                                </div>
                              ) : null}
                            </div>

                            <div className="rounded-xl border p-4">
                              <p className="font-bold text-blue-deep">Inputs used</p>
                              <div className="mt-2 space-y-1 text-sm text-[var(--text-secondary)]">
                                <p>Implementation: <span className="font-semibold capitalize text-blue-deep">{inp.implementationStrength ?? "-"}</span></p>
                                <p>Funding: <span className="font-semibold capitalize text-blue-deep">{inp.fundingLevel ?? "-"}</span></p>
                                <p>
                                  Assumptions:{" "}
                                  <span className="font-semibold text-blue-deep">
                                    {inp.assumptions
                                      ? Object.entries(inp.assumptions).filter(([, v]) => Boolean(v)).map(([k]) => k).join(", ") || "None"
                                      : "-"}
                                  </span>
                                </p>
                              </div>
                            </div>

                            {Array.isArray(s.evidence) && s.evidence.length > 0 ? (
                              <div className="rounded-xl border p-4">
                                <p className="font-bold text-blue-deep">Reference evidence</p>
                                <div className="mt-3 space-y-2">
                                  {s.evidence.map((entry: any, i: number) => (
                                    <button
                                      key={`${entry.url}-${i}`}
                                      type="button"
                                      onClick={() => window.open(entry.url, "_blank")}
                                      className="w-full rounded-lg border bg-slate-50 p-3 text-left transition hover:bg-blue-soft"
                                    >
                                      <p className="font-semibold text-blue-deep">{entry.title}</p>
                                      <p className="mt-1 text-sm text-[var(--text-secondary)]">{entry.whyRelevant || entry.url}</p>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            <Card className="premium-card p-6">
              <h2 className="text-lg font-bold text-blue-deep mb-2">Latest snapshot</h2>
              {summary ? (
                <div className="space-y-3 text-sm text-[var(--text-secondary)]">
                  <p>Latest risk: <span className="font-semibold capitalize text-blue-deep">{summary.riskLevel ?? "-"}</span></p>
                  <p>Access impact: <span className="font-semibold text-blue-deep">{summary.access ?? "-"}%</span></p>
                  <p>Emissions change: <span className="font-semibold text-blue-deep">{summary.emissions ?? "-"}%</span></p>
                  <p>Total runs: <span className="font-semibold text-blue-deep">{summary.runs}</span></p>

                  <Button className="mt-3 w-full rounded-full bg-[#125669] hover:bg-[#0f4b5d]" onClick={() => router.push("/policies")}>
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
