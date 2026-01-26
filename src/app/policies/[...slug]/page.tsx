"use client";

import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import ProtectedRoute from "@/components/guards/ProtectedRoute";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRouter, useParams } from "next/navigation";
import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import type { Policy } from "@/lib/policyTypes";
import {
  Sparkles,
  BarChart3,
  ArrowLeft,
  Link2,
  Download,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { getStorage, ref as storageRef, getDownloadURL } from "firebase/storage";

function formatWhen(ts: any) {
  try {
    const d = ts?.toDate?.() ? ts.toDate() : null;
    if (!d) return "";
    return d.toLocaleString();
  } catch {
    return "";
  }
}

export default function PolicyDetailPage() {
  const router = useRouter();
  const params = useParams();

  const slugParts = (params?.slug as string[]) ?? [];
  const key = slugParts.join("/");
  const slugOrId = slugParts[slugParts.length - 1] || "";

  const [loading, setLoading] = useState(true);
  const [policy, setPolicy] = useState<Policy | null>(null);

  const [critiques, setCritiques] = useState<any[]>([]);
  const [simulations, setSimulations] = useState<any[]>([]);

  const [openCritique, setOpenCritique] = useState<string | null>(null);
  const [openSimulation, setOpenSimulation] = useState<string | null>(null);

  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);

      // 1) Try find by slug
      const bySlugSnap = await getDocs(
        query(collection(db, "policies"), where("slug", "==", slugOrId), limit(1))
      );

      let p: Policy | null = null;

      if (!bySlugSnap.empty) {
        const d = bySlugSnap.docs[0];
        p = { id: d.id, ...(d.data() as any) };
      } else {
        // 2) Fallback: treat slugOrId as docId
        const byId = await getDoc(doc(db, "policies", slugOrId));
        if (byId.exists()) {
          p = { id: byId.id, ...(byId.data() as any) };
        }
      }

      if (!p) {
        setPolicy(null);
        setLoading(false);
        return;
      }

      setPolicy(p);

      // Load critique + simulation histories (accordion style)
      const critiquesSnap = await getDocs(
        query(
          collection(db, "policies", p.id, "critiques"),
          orderBy("createdAt", "desc"),
          limit(10)
        )
      );
      const simsSnap = await getDocs(
        query(
          collection(db, "policies", p.id, "simulations"),
          orderBy("createdAt", "desc"),
          limit(10)
        )
      );

      const critItems = critiquesSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
      const simItems = simsSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));

      setCritiques(critItems);
      setSimulations(simItems);

      // default closed
      setOpenCritique(null);
      setOpenSimulation(null);

      setLoading(false);
    };

    if (slugOrId) load();
    else setLoading(false);
  }, [slugOrId, key]);

  const typeLabel = (t?: string) => {
    if (t === "uploaded") return <Badge>Uploaded</Badge>;
    if (t === "ai_generated") return <Badge variant="secondary">AI Generated</Badge>;
    if (t === "public_source") return <Badge variant="outline">Public Source</Badge>;
    return <Badge variant="outline">Unknown</Badge>;
  };

  const handleDownload = async () => {
    if (!policy?.storagePath) return;
    try {
      setDownloading(true);
      const storage = getStorage();
      const url = await getDownloadURL(storageRef(storage, policy.storagePath));
      window.open(url, "_blank");
    } finally {
      setDownloading(false);
    }
  };

  const jurisdictionText = useMemo(() => {
    if (!policy) return "";
    return policy.jurisdictionLevel === "federal" ? "Federal" : policy.state;
  }, [policy]);

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => router.push("/policies")}
              className="gap-2"
            >
              <ArrowLeft size={16} />
              Back
            </Button>

            <div>
              <h1 className="text-2xl font-bold text-blue-deep">
                {loading ? "Loading policy…" : policy?.title ?? "Policy not found"}
              </h1>

              {!loading && policy && (
                <p className="text-sm text-[var(--text-secondary)] mt-1">
                  {policy.country} • {jurisdictionText} • {policy.policyYear ?? "Year N/A"}
                </p>
              )}
            </div>
          </div>

          {!loading && policy && (
            <div className="flex gap-2 flex-wrap">
{policy.storagePath && (
                  <Button
                    variant="outline"
                    onClick={handleDownload}
                    disabled={downloading}
                    className="gap-2"
                  >
                    <Download size={16} />
                    {downloading ? "Preparing…" : "Download PDF"}
                  </Button>
                )}

              <Button
                onClick={() => router.push(`/critique?policyId=${policy.id}`)}
                className="gap-2"
              >
                <Sparkles size={16} />
                Critique
              </Button>

              <Button
                variant="outline"
                onClick={() => router.push(`/simulations?policyId=${policy.id}`)}
                className="gap-2"
              >
                <BarChart3 size={16} />
                Simulate
              </Button>
            </div>
          )}
        </div>

        {!loading && !policy && (
          <Card className="p-6">
            <p className="text-sm text-[var(--text-secondary)]">
              No policy found for:{" "}
              <span className="font-semibold">{slugOrId}</span>
            </p>
          </Card>
        )}

        {policy && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* LEFT */}
            <div className="lg:col-span-2 space-y-6">
              {/* Summary + meta */}
              <Card className="p-6">
                <div className="flex items-center gap-2 flex-wrap mb-3">
                  {typeLabel(policy.type)}
                  <Badge variant="outline">
                    {policy.jurisdictionLevel === "federal" ? "Federal" : "State"}
                  </Badge>

                  {policy.jurisdictionLevel === "state" && policy.state && (
                    <Badge variant="outline">{policy.state}</Badge>
                  )}

                  {policy.policyYear && (
                    <Badge variant="outline">{policy.policyYear}</Badge>
                  )}

                  {/* ✅ Sector badge */}
                  {(policy as any).sector && (
                    <Badge variant="outline">{(policy as any).sector}</Badge>
                  )}
                </div>

                {policy.summary ? (
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                    {policy.summary}
                  </p>
                ) : (
                  <p className="text-sm text-[var(--text-secondary)]">
                    No summary provided yet.
                  </p>
                )}

                {/* Tags */}
                {policy.tags?.length ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {policy.tags.map((t) => (
                      <Badge key={t} variant="secondary">
                        {t}
                      </Badge>
                    ))}
                  </div>
                ) : null}
              </Card>

              {/* ✅ Critique history (Accordion) */}
              <Card className="p-6">
                <h2 className="text-lg font-bold text-blue-deep mb-2">
                  Critique history
                </h2>

                {critiques.length === 0 ? (
                  <p className="text-sm text-[var(--text-secondary)]">
                    No critiques yet. Run the first critique from the AI Critique page.
                  </p>
                ) : (
                  <div className="space-y-3 mt-4">
                    {critiques.map((c) => {
                      const isOpen = openCritique === c.id;
                      return (
                        <div key={c.id} className="border rounded-xl overflow-hidden">
                          <button
                            type="button"
                            onClick={() => setOpenCritique(isOpen ? null : c.id)}
                            className="w-full px-4 py-3 flex items-center justify-between hover:bg-blue-soft transition"
                          >
                            <div className="text-left">
                              <p className="font-bold text-blue-deep">
                                Overall: {c.overallScore ?? "—"}/100
                              </p>
                              <p className="text-xs text-[var(--text-secondary)] mt-1">
                                {formatWhen(c.createdAt)}
                                {typeof c.revisionNumber === "number"
                                  ? ` • Revision ${c.revisionNumber}`
                                  : ""}
                              </p>
                            </div>
                            {isOpen ? (
                              <ChevronUp className="text-blue-electric" size={18} />
                            ) : (
                              <ChevronDown className="text-blue-electric" size={18} />
                            )}
                          </button>

                          {isOpen && (
                            <div className="px-4 pb-4">
                              {c.summary && (
                                <p className="text-sm text-[var(--text-secondary)] mt-2">
                                  {c.summary}
                                </p>
                              )}

                              {Array.isArray(c.perStandard) && c.perStandard.length > 0 && (
                                <div className="mt-4 space-y-3">
                                  {c.perStandard.map((s: any) => (
                                    <div key={s.standardId} className="border rounded-xl p-3">
                                      <div className="flex items-center justify-between">
                                        <p className="font-semibold text-blue-deep">
                                          {s.standardLabel ?? s.standardId}
                                        </p>
                                        <p className="font-bold">{s.score}/100</p>
                                      </div>
                                      {Array.isArray(s.suggestions) && s.suggestions.length > 0 && (
                                        <ul className="mt-2 list-disc ml-5 text-sm text-[var(--text-secondary)] space-y-1">
                                          {s.suggestions.map((x: string, i: number) => (
                                            <li key={i}>{x}</li>
                                          ))}
                                        </ul>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>

              {/* ✅ Simulation history (Accordion) */}
              <Card className="p-6">
                <h2 className="text-lg font-bold text-blue-deep mb-2">
                  Simulation history
                </h2>

                {simulations.length === 0 ? (
                  <p className="text-sm text-[var(--text-secondary)]">
                    No simulations yet. Run the first simulation from the Simulations page.
                  </p>
                ) : (
                  <div className="space-y-3 mt-4">
                    {simulations.map((s) => {
                      const isOpen = openSimulation === s.id;

                      const horizon =
                        typeof s?.inputs?.yearsHorizon === "number"
                          ? `${s.inputs.yearsHorizon} years`
                          : s?.inputs?.yearsHorizon
                          ? String(s.inputs.yearsHorizon)
                          : "—";

                      return (
                        <div key={s.id} className="border rounded-xl overflow-hidden">
                          <button
                            type="button"
                            onClick={() => setOpenSimulation(isOpen ? null : s.id)}
                            className="w-full px-4 py-3 flex items-center justify-between hover:bg-blue-soft transition"
                          >
                            <div className="text-left">
                              <p className="font-bold text-blue-deep">
                                Scenario: {s?.inputs?.scenarioName ?? "Simulation"} • {horizon}
                              </p>
                              <p className="text-xs text-[var(--text-secondary)] mt-1">
                                {formatWhen(s.createdAt)}
                              </p>
                            </div>
                            {isOpen ? (
                              <ChevronUp className="text-blue-electric" size={18} />
                            ) : (
                              <ChevronDown className="text-blue-electric" size={18} />
                            )}
                          </button>

                          {isOpen && (
                            <div className="px-4 pb-4">
                              {/* Show inputs */}
                              {s.inputs && (
                                <div className="mt-3">
                                  <p className="text-xs font-semibold text-[var(--text-secondary)] mb-2">
                                    Inputs
                                  </p>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                                    {Object.entries(s.inputs).slice(0, 8).map(([k, v]) => (
                                      <div key={k} className="border rounded-lg px-3 py-2">
                                        <span className="font-semibold text-blue-deep">{k}:</span>{" "}
                                        <span className="text-[var(--text-secondary)]">
                                          {typeof v === "object" ? JSON.stringify(v) : String(v)}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Show high-level outputs */}
                              {s.results && (
                                <div className="mt-4">
                                  <p className="text-xs font-semibold text-[var(--text-secondary)] mb-2">
                                    Key results
                                  </p>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                                    {Object.entries(s.results).slice(0, 8).map(([k, v]) => (
                                      <div key={k} className="border rounded-lg px-3 py-2">
                                        <span className="font-semibold text-blue-deep">{k}:</span>{" "}
                                        <span className="text-[var(--text-secondary)]">
                                          {typeof v === "object" ? JSON.stringify(v) : String(v)}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Optional: link to run new sim */}
                              <div className="mt-4">
                                <Button
                                  variant="outline"
                                  className="w-full"
                                  onClick={() => router.push(`/simulations?policyId=${policy.id}`)}
                                >
                                  Run another simulation
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
            </div>

            {/* RIGHT */}
            <div className="space-y-6">
              <Card className="p-6">
                <h2 className="text-lg font-bold text-blue-deep mb-3">Source</h2>

                {policy.source?.url ? (
                  <div className="space-y-2">
                    {policy.source.publisher && (
                      <p className="text-sm">
                        <span className="font-semibold">Publisher:</span>{" "}
                        <span className="text-[var(--text-secondary)]">
                          {policy.source.publisher}
                        </span>
                      </p>
                    )}

                    <Button
                      variant="outline"
                      className="gap-2"
                      onClick={() => window.open(policy.source!.url!, "_blank")}
                    >
                      <Link2 size={16} />
                      Open source link
                    </Button>

                    {policy.source.licenseNote && (
                      <p className="text-xs text-[var(--text-secondary)]">
                        {policy.source.licenseNote}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-[var(--text-secondary)]">
                    No external source link provided.
                  </p>
                )}
              </Card>

              <Card className="p-6">
                <h2 className="text-lg font-bold text-blue-deep mb-3">
                  Quick actions
                </h2>

                <div className="space-y-2">
                    {policy.storagePath && (
                      <Button
                        variant="outline"
                        className="w-full gap-2"
                        onClick={handleDownload}
                        disabled={downloading}
                      >
                        <Download size={16} />
                        {downloading ? "Preparing download…" : "Download policy (PDF)"}
                      </Button>
                    )}

                  <Button
                    className="w-full gap-2"
                    onClick={() => router.push(`/critique?policyId=${policy.id}`)}
                  >
                    <Sparkles size={16} />
                    Run AI Critique
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full gap-2"
                    onClick={() => router.push(`/simulations?policyId=${policy.id}`)}
                  >
                    <BarChart3 size={16} />
                    Run Simulation
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        )}
      </DashboardLayout>
    </ProtectedRoute>
  );
}
