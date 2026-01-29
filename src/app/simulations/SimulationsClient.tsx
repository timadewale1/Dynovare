"use client";

import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import ProtectedRoute from "@/components/guards/ProtectedRoute";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import type { Policy } from "@/lib/policyTypes";
import PolicyPicker from "@/components/policies/PolicyPicker";
import { Upload, BarChart3 } from "lucide-react";
import toast from "react-hot-toast";
import { Badge } from "@/components/ui/badge";

import { saveSimulation } from "@/lib/simulationWrites";
import { useUser } from "@/components/providers/UserProvider";
import SimulationCharts from "@/components/simulations/SimulationCharts";

export default function SimulationsClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const policyId = searchParams.get("policyId");

  const { user, profile } = useUser();

  const [policy, setPolicy] = useState<Policy | null>(null);
  const [loadingPolicy, setLoadingPolicy] = useState(false);

  // inputs
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
      if (!policyId) return;
      setLoadingPolicy(true);
      const snap = await getDoc(doc(db, "policies", policyId));
      if (snap.exists()) setPolicy({ id: snap.id, ...(snap.data() as any) });
      else setPolicy(null);
      setLoadingPolicy(false);
    };
    load();
  }, [policyId]);

  const inputs = useMemo(() => {
    return { horizonYears, implementationStrength, fundingLevel, adoptionRate, assumptions };
  }, [horizonYears, implementationStrength, fundingLevel, adoptionRate, assumptions]);

  const run = async () => {
    if (!policyId || !policy) return;

    if (!user) {
      toast.error("Please sign in");
      router.push("/login");
      return;
    }

    if (horizonYears < 1 || horizonYears > 20) {
      toast.error("Horizon must be between 1 and 20 years");
      return;
    }

    if (adoptionRate < 0 || adoptionRate > 100) {
      toast.error("Adoption rate must be between 0 and 100");
      return;
    }

    // optional: client-side guard
    const text = String(policy.contentText || "").trim();
    if (text.length < 120) {
      toast.error("Policy text is too short for simulation. Upload a richer PDF/DOCX.");
      return;
    }

    try {
      setRunning(true);

      const res = await fetch("/api/ai/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ policyId, inputs }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data?.code === "TEXT_TOO_SHORT") {
          throw new Error("Policy text is too short for simulation. Upload a richer PDF/DOCX.");
        }
        throw new Error(data?.error || "Simulation failed");
      }

      const out = data; // expects { outputs: {...} }

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
        outputs: out.outputs,
      });

      setResult(out.outputs);
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
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-blue-deep">Simulations</h1>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              Select an existing policy or upload a new one to simulate.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <PolicyPicker onSelect={(p) => router.push(`/simulations?policyId=${p.id}`)} />
            </div>

            <Card className="p-6">
              <h3 className="text-lg font-bold text-blue-deep mb-2">Upload a policy</h3>
              <p className="text-sm text-[var(--text-secondary)] mb-4">
                Upload your own PDF/DOCX. It will be added to the repository and then you can run simulations.
              </p>

              <Button className="w-full gap-2" onClick={() => router.push("/policies/upload?redirect=/simulations")}>
                <Upload size={16} />
                Upload policy
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
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-blue-deep">Simulations</h1>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              {loadingPolicy ? "Loading selected policy…" : policy ? `Selected: ${policy.title}` : "Selected policy not found."}
            </p>
          </div>

          <Button variant="outline" onClick={() => router.push("/policies")}>
            Browse repository
          </Button>
        </div>

        <Card className="p-6 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="text-blue-electric" size={18} />
            <h2 className="text-lg font-bold text-blue-deep">Scenario inputs</h2>
          </div>

          <p className="text-sm text-[var(--text-secondary)] mb-4">
            Configure assumptions and horizon. Dynovare will estimate impacts and risks (LLM model).
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border rounded-xl p-4">
              <p className="font-bold text-blue-deep mb-2">Time horizon</p>
              <input
                type="number"
                min={1}
                max={20}
                value={horizonYears}
                onChange={(e) => setHorizonYears(Number(e.target.value))}
                className="w-full border rounded-md px-3 py-2"
              />
              <p className="text-xs text-[var(--text-secondary)] mt-2">1–20 years</p>
            </div>

            <div className="border rounded-xl p-4">
              <p className="font-bold text-blue-deep mb-2">Adoption / uptake</p>
              <input
                type="number"
                min={0}
                max={100}
                value={adoptionRate}
                onChange={(e) => setAdoptionRate(Number(e.target.value))}
                className="w-full border rounded-md px-3 py-2"
              />
              <p className="text-xs text-[var(--text-secondary)] mt-2">0–100%</p>
            </div>

            <div className="border rounded-xl p-4">
              <p className="font-bold text-blue-deep mb-2">Implementation strength</p>
              <div className="flex gap-2 flex-wrap">
                {(["weak", "moderate", "strong"] as const).map((v) => (
                  <button
                    key={v}
                    onClick={() => setImplementationStrength(v)}
                    className={`px-3 py-2 rounded-lg border font-semibold transition ${
                      implementationStrength === v ? "bg-blue-soft border-blue-electric text-blue-deep" : "hover:border-blue-electric"
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            <div className="border rounded-xl p-4">
              <p className="font-bold text-blue-deep mb-2">Funding level</p>
              <div className="flex gap-2 flex-wrap">
                {(["low", "medium", "high"] as const).map((v) => (
                  <button
                    key={v}
                    onClick={() => setFundingLevel(v)}
                    className={`px-3 py-2 rounded-lg border font-semibold transition ${
                      fundingLevel === v ? "bg-blue-soft border-blue-electric text-blue-deep" : "hover:border-blue-electric"
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            <div className="border rounded-xl p-4 md:col-span-2">
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
                    className={`px-3 py-2 rounded-lg border font-semibold transition ${
                      assumptions[a.key as keyof typeof assumptions]
                        ? "bg-blue-soft border-blue-electric text-blue-deep"
                        : "hover:border-blue-electric"
                    }`}
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between flex-wrap gap-3">
            <p className="text-sm text-[var(--text-secondary)]">Your inputs will be saved with the simulation result.</p>
            <Button onClick={run} disabled={running || !policy}>
              {running ? "Running simulation…" : "Run simulation"}
            </Button>
          </div>
        </Card>

        {result && (
          <Card className="p-6">
            <h2 className="text-lg font-bold text-blue-deep mb-3">Simulation Results</h2>

            <div className="flex flex-wrap gap-2 mb-4">
              <Badge variant="outline">Access</Badge>
              <span className="font-bold">{result.accessImpactPct}%</span>

              <Badge variant="outline">Reliability</Badge>
              <span className="font-bold">{result.reliabilityImpactPct}%</span>

              <Badge variant="outline">Emissions</Badge>
              <span className="font-bold">{result.emissionsChangePct}%</span>

              <Badge variant="outline">Risk</Badge>
              <span className="font-bold">{result.riskLevel}</span>
            </div>

            <div className="border rounded-xl p-4 mb-5">
              <p className="font-bold text-blue-deep">Estimated cost range</p>
              <p className="text-sm text-[var(--text-secondary)] mt-1">
                ${result.estimatedCostUSD.low.toLocaleString()} – ${result.estimatedCostUSD.high.toLocaleString()} (USD)
              </p>
            </div>

            <p className="text-sm text-[var(--text-secondary)] mb-6">{result.narrative}</p>

            <SimulationCharts
              horizonYears={inputs.horizonYears}
              accessImpactPct={result.accessImpactPct}
              reliabilityImpactPct={result.reliabilityImpactPct}
              emissionsChangePct={result.emissionsChangePct}
              riskLevel={result.riskLevel}
            />
          </Card>
        )}
      </DashboardLayout>
    </ProtectedRoute>
  );
}
