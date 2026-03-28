"use client";

import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import ProtectedRoute from "@/components/guards/ProtectedRoute";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";
import type { Policy } from "@/lib/policyTypes";
import PolicyPicker from "@/components/policies/PolicyPicker";
import { Upload, BarChart3, TrendingUp, ShieldCheck, Coins, Zap } from "lucide-react";
import toast from "react-hot-toast";
import { Badge } from "@/components/ui/badge";
import { saveSimulation } from "@/lib/simulationWrites";
import { useUser } from "@/components/providers/UserProvider";
import SimulationCharts from "@/components/simulations/SimulationCharts";
import { resolvePolicyForUser } from "@/lib/workspacePolicies";

export default function SimulationsClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const policyId = searchParams.get("policyId");
  const { user, profile } = useUser();

  const [policy, setPolicy] = useState<Policy | null>(null);
  const [policyScope, setPolicyScope] = useState<"workspace" | "public">("workspace");
  const [loadingPolicy, setLoadingPolicy] = useState(false);
  const [horizonYears, setHorizonYears] = useState(5);
  const [implementationStrength, setImplementationStrength] = useState<"weak" | "moderate" | "strong">("moderate");
  const [fundingLevel, setFundingLevel] = useState<"low" | "medium" | "high">("medium");
  const [adoptionRate, setAdoptionRate] = useState(60);
  const [assumptions, setAssumptions] = useState({
    gridExpansion: true,
    miniGridGrowth: true,
    tariffReform: false,
    cleanCooking: false,
  });
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<any | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!policyId || !user) return;
      setLoadingPolicy(true);
      const resolved = await resolvePolicyForUser(user.uid, policyId);
      if (resolved) {
        setPolicy(resolved.policy);
        setPolicyScope(resolved.scope);
      } else {
        setPolicy(null);
      }
      setLoadingPolicy(false);
    };

    void load();
  }, [policyId, user]);

  const inputs = useMemo(
    () => ({ horizonYears, implementationStrength, fundingLevel, adoptionRate, assumptions }),
    [horizonYears, implementationStrength, fundingLevel, adoptionRate, assumptions]
  );

  const run = async () => {
    if (!policyId || !policy || !user) return;

    if (horizonYears < 1 || horizonYears > 20) {
      toast.error("Horizon must be between 1 and 20 years");
      return;
    }
    if (adoptionRate < 0 || adoptionRate > 100) {
      toast.error("Adoption rate must be between 0 and 100");
      return;
    }

    const text = String(policy.contentText || "").trim();
    if (text.length < 120) {
      toast.error("Policy text is too short for simulation. Upload a richer PDF or DOCX.");
      return;
    }

    try {
      setRunning(true);
      const res = await fetch("/api/ai/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          policyId,
          ownerUid: policyScope === "workspace" ? user.uid : undefined,
          inputs,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data?.code === "TEXT_TOO_SHORT") {
          throw new Error("Policy text is too short for simulation. Upload a richer PDF or DOCX.");
        }
        throw new Error(data?.error || "Simulation failed");
      }

      await saveSimulation({
        policyId,
        policyTitle: policy.title,
        policySlug: policy.slug,
        policyType: policy.type,
        jurisdictionLevel: policy.jurisdictionLevel,
        state: policy.state,
        policyYear: policy.policyYear ?? null,
        userId: user.uid,
        userName: profile?.fullName,
        userEmail: user.email ?? null,
        inputs,
        outputs: data.outputs,
        evidence: data.evidence,
        policyScope,
        ownerUid: policyScope === "workspace" ? user.uid : undefined,
      });

      setResult({ ...(data.outputs ?? {}), evidence: Array.isArray(data.evidence) ? data.evidence : [] });
      toast.success("Simulation complete");
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Simulation failed");
    } finally {
      setRunning(false);
    }
  };

  if (!policyId) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <section className="mb-6 overflow-hidden rounded-[2rem] bg-[linear-gradient(135deg,#081f30_0%,#103851_52%,#125669_100%)] p-7 text-white shadow-[0_24px_70px_rgba(8,31,48,0.18)]">
            <Badge variant="outline" className="border-white/20 bg-white/10 text-white">Scenario modeling</Badge>
              <h1 className="mt-4 text-3xl font-black tracking-tight">Test how a policy could perform before your team commits.</h1>
            <p className="mt-3 max-w-2xl text-sm text-white/78">
              Run scenario inputs against a workspace policy and see the likely impact on access, reliability, cost, emissions, and risk.
            </p>
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <PolicyPicker onSelect={(p) => router.push(`/simulations?policyId=${p.id}`)} />
            </div>

            <Card className="premium-card p-6">
              <div className="inline-flex rounded-2xl bg-blue-soft p-3 text-blue-electric">
                <Upload size={20} />
              </div>
              <h3 className="mt-4 text-lg font-bold text-blue-deep mb-2">Add a private policy</h3>
              <p className="text-sm text-[var(--text-secondary)] mb-4">
                Upload a private workspace policy, then run scenario modeling against it.
              </p>
              <Button className="w-full gap-2 rounded-full bg-[#125669] hover:bg-[#0f4b5d]" onClick={() => router.push("/policies/upload?redirect=/simulations")}>
                <Upload size={16} />
                Upload policy
              </Button>
              <Button variant="outline" className="mt-3 w-full rounded-full" onClick={() => router.push("/repository")}>
                Browse public repository
              </Button>
            </Card>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <section className="mb-6 overflow-hidden rounded-[2rem] bg-[linear-gradient(135deg,#081f30_0%,#103851_52%,#125669_100%)] p-7 text-white shadow-[0_24px_70px_rgba(8,31,48,0.18)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Badge variant="outline" className="border-white/20 bg-white/10 text-white">Scenario modeling</Badge>
              <h1 className="mt-4 text-3xl font-black tracking-tight">Model likely outcomes before you move forward.</h1>
              <p className="mt-3 max-w-2xl text-sm text-white/78">
                {loadingPolicy ? "Loading selected policy..." : policy ? `Running scenarios for ${policy.title}` : "Selected policy not found."}
              </p>
            </div>

            <Button variant="outline" className="border-white/20 bg-transparent text-white hover:bg-white/10" onClick={() => router.push(policyScope === "public" ? "/repository" : "/policies")}>
              {policyScope === "public" ? "Open repository" : "Open workspace"}
            </Button>
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <Card className="premium-card p-6">
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="text-blue-electric" size={18} />
              <h2 className="text-lg font-bold text-blue-deep">Set the simulation inputs</h2>
            </div>

            <p className="text-sm text-[var(--text-secondary)] mb-4">
              Tune the assumptions and see how the policy might behave under real-world delivery conditions.
            </p>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-[1.2rem] border p-4">
                <p className="font-bold text-blue-deep mb-2">Time horizon</p>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={horizonYears}
                  onChange={(e) => setHorizonYears(Number(e.target.value))}
                  className="studio-input"
                />
                <p className="mt-2 text-xs text-[var(--text-secondary)]">Model between 1 and 20 years.</p>
              </div>

              <div className="rounded-[1.2rem] border p-4">
                <p className="font-bold text-blue-deep mb-2">Adoption / uptake</p>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={adoptionRate}
                  onChange={(e) => setAdoptionRate(Number(e.target.value))}
                  className="studio-input"
                />
                <p className="mt-2 text-xs text-[var(--text-secondary)]">Choose a likely uptake level from 0 to 100%.</p>
              </div>

              <div className="rounded-[1.2rem] border p-4">
                <p className="font-bold text-blue-deep mb-2">Implementation strength</p>
                <div className="flex flex-wrap gap-2">
                  {(["weak", "moderate", "strong"] as const).map((v) => (
                    <button
                      key={v}
                      onClick={() => setImplementationStrength(v)}
                      className={`studio-chip ${implementationStrength === v ? "studio-chip-active" : ""}`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-[1.2rem] border p-4">
                <p className="font-bold text-blue-deep mb-2">Funding level</p>
                <div className="flex flex-wrap gap-2">
                  {(["low", "medium", "high"] as const).map((v) => (
                    <button
                      key={v}
                      onClick={() => setFundingLevel(v)}
                      className={`studio-chip ${fundingLevel === v ? "studio-chip-active" : ""}`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-[1.2rem] border p-4 md:col-span-2">
                <p className="font-bold text-blue-deep mb-2">Assumptions</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { key: "gridExpansion", label: "Grid expansion" },
                    { key: "miniGridGrowth", label: "Mini-grid growth" },
                    { key: "tariffReform", label: "Tariff reform" },
                    { key: "cleanCooking", label: "Clean cooking" },
                  ].map((a) => (
                    <button
                      key={a.key}
                      onClick={() => setAssumptions((p) => ({ ...p, [a.key]: !p[a.key as keyof typeof p] }))}
                      className={`studio-chip ${assumptions[a.key as keyof typeof assumptions] ? "studio-chip-active" : ""}`}
                    >
                      {a.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between flex-wrap gap-3">
              <p className="text-sm text-[var(--text-secondary)]">The selected inputs are saved with the simulation result.</p>
              <Button className="rounded-full bg-[#125669] hover:bg-[#0f4b5d]" onClick={run} disabled={running || !policy}>
                {running ? "Running simulation..." : "Run simulation"}
              </Button>
            </div>
          </Card>

          <Card className="rounded-[2rem] bg-[linear-gradient(180deg,#0b2336_0%,#135a6e_100%)] p-6 text-white shadow-sm">
            <div className="grid gap-4">
              {[
                { icon: <TrendingUp size={18} />, title: "Access and reliability", text: "Estimate how the policy could shift coverage and system performance." },
                { icon: <Coins size={18} />, title: "Cost view", text: "See a likely cost range before the idea moves deeper into planning." },
                { icon: <Zap size={18} />, title: "Risk profile", text: "Check where delivery risk stays low and where assumptions start to break." },
                { icon: <ShieldCheck size={18} />, title: "Saved to workspace", text: "Keep the result linked to the policy for future comparison and review." },
              ].map((item) => (
                <div key={item.title} className="rounded-[1.3rem] border border-white/10 bg-white/8 p-4">
                  <div className="flex items-center gap-2 font-semibold">{item.icon}<span>{item.title}</span></div>
                  <p className="mt-2 text-sm text-white/76">{item.text}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {result && (
          <Card className="premium-card mt-6 p-6">
            <h2 className="text-lg font-bold text-blue-deep mb-3">Simulation results</h2>

            {result.scenarioHeadline ? (
              <div className="mb-4 rounded-[1.2rem] border bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-secondary)]">Scenario headline</p>
                <p className="mt-2 text-lg font-bold text-blue-deep">{result.scenarioHeadline}</p>
              </div>
            ) : null}

            <div className="mb-4 grid gap-3 md:grid-cols-4">
              <div className="rounded-[1.2rem] border bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-secondary)]">Access</p>
                <p className="mt-2 text-2xl font-black text-blue-deep">{result.accessImpactPct}%</p>
              </div>
              <div className="rounded-[1.2rem] border bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-secondary)]">Reliability</p>
                <p className="mt-2 text-2xl font-black text-blue-deep">{result.reliabilityImpactPct}%</p>
              </div>
              <div className="rounded-[1.2rem] border bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-secondary)]">Emissions</p>
                <p className="mt-2 text-2xl font-black text-blue-deep">{result.emissionsChangePct}%</p>
              </div>
              <div className="rounded-[1.2rem] border bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-secondary)]">Risk</p>
                <p className="mt-2 text-2xl font-black capitalize text-blue-deep">{result.riskLevel}</p>
              </div>
            </div>

            <div className="border rounded-xl p-4 mb-5">
              <p className="font-bold text-blue-deep">Estimated cost range</p>
              <p className="text-sm text-[var(--text-secondary)] mt-1">
                ${result.estimatedCostUSD.low.toLocaleString()} - ${result.estimatedCostUSD.high.toLocaleString()} (USD)
              </p>
            </div>

            {(result.investmentReadiness || result.deliveryReadiness) ? (
              <div className="mb-5 grid gap-3 md:grid-cols-2">
                <div className="rounded-[1.2rem] border bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-secondary)]">Investment readiness</p>
                  <p className="mt-2 text-2xl font-black capitalize text-blue-deep">{result.investmentReadiness ?? "-"}</p>
                </div>
                <div className="rounded-[1.2rem] border bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-secondary)]">Delivery readiness</p>
                  <p className="mt-2 text-2xl font-black capitalize text-blue-deep">{result.deliveryReadiness ?? "-"}</p>
                </div>
              </div>
            ) : null}

            <p className="text-sm text-[var(--text-secondary)] mb-6">{result.narrative}</p>

            <div className="mb-6 grid gap-3 md:grid-cols-3">
              {Array.isArray(result.costDrivers) && result.costDrivers.length > 0 ? (
                <div className="rounded-[1.2rem] border bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-secondary)]">Cost drivers</p>
                  <ul className="mt-3 ml-5 list-disc space-y-1 text-sm text-[var(--text-secondary)]">
                    {result.costDrivers.map((item: string, index: number) => <li key={index}>{item}</li>)}
                  </ul>
                </div>
              ) : null}
              {Array.isArray(result.criticalRisks) && result.criticalRisks.length > 0 ? (
                <div className="rounded-[1.2rem] border bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-secondary)]">Critical risks</p>
                  <ul className="mt-3 ml-5 list-disc space-y-1 text-sm text-[var(--text-secondary)]">
                    {result.criticalRisks.map((item: string, index: number) => <li key={index}>{item}</li>)}
                  </ul>
                </div>
              ) : null}
              {Array.isArray(result.enablingActions) && result.enablingActions.length > 0 ? (
                <div className="rounded-[1.2rem] border bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-secondary)]">Enabling actions</p>
                  <ul className="mt-3 ml-5 list-disc space-y-1 text-sm text-[var(--text-secondary)]">
                    {result.enablingActions.map((item: string, index: number) => <li key={index}>{item}</li>)}
                  </ul>
                </div>
              ) : null}
            </div>

            {result.beneficiaryOutlook ? (
              <div className="mb-6 rounded-[1.2rem] border bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-secondary)]">Beneficiary outlook</p>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">{result.beneficiaryOutlook}</p>
              </div>
            ) : null}

            <SimulationCharts
              horizonYears={inputs.horizonYears}
              accessImpactPct={result.accessImpactPct}
              reliabilityImpactPct={result.reliabilityImpactPct}
              emissionsChangePct={result.emissionsChangePct}
              riskLevel={result.riskLevel}
              yearByYear={Array.isArray(result.yearByYear) ? result.yearByYear : []}
            />

            {Array.isArray(result.yearByYear) && result.yearByYear.length > 0 ? (
              <div className="mt-6 rounded-[1.4rem] border p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-secondary)]">Year-by-year outlook</p>
                <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {result.yearByYear.map((row: any) => (
                    <div key={row.year} className="rounded-[1rem] border bg-slate-50 p-4 text-sm">
                      <p className="font-bold text-blue-deep">Year {row.year}</p>
                      <p className="mt-2 text-[var(--text-secondary)]">Access: {row.accessImpactPct}%</p>
                      <p className="text-[var(--text-secondary)]">Reliability: {row.reliabilityImpactPct}%</p>
                      <p className="text-[var(--text-secondary)]">Emissions: {row.emissionsChangePct}%</p>
                      <p className="text-[var(--text-secondary)]">Investment need: ${Number(row.investmentNeedUSD ?? 0).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {Array.isArray(result.evidence) && result.evidence.length > 0 ? (
              <div className="mt-6 rounded-[1.4rem] border p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-secondary)]">Reference evidence</p>
                <div className="mt-4 space-y-3">
                  {result.evidence.map((entry: any, index: number) => (
                    <button
                      key={`${entry.url}-${index}`}
                      type="button"
                      onClick={() => window.open(entry.url, "_blank")}
                      className="w-full rounded-xl border bg-slate-50 p-3 text-left transition hover:bg-blue-soft"
                    >
                      <p className="font-semibold text-blue-deep">{entry.title}</p>
                      <p className="mt-1 text-sm text-[var(--text-secondary)]">{entry.whyRelevant || entry.url}</p>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </Card>
        )}
      </DashboardLayout>
    </ProtectedRoute>
  );
}
