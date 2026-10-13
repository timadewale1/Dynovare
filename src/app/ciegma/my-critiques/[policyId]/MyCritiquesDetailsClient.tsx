"use client";

import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import ProtectedRoute from "@/components/guards/ProtectedRoute";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRouter, useParams } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, doc, getDoc, getDocs, limit, orderBy, query, where } from "firebase/firestore";
import { ArrowLeft, ExternalLink, Sparkles, ChevronDown } from "lucide-react";
import { CRITIQUE_STANDARDS } from "@/lib/critiqueStandards";
import { useUser } from "@/components/providers/UserProvider";

function labelForStandard(id: string) {
  return CRITIQUE_STANDARDS.find((s) => s.id === id)?.label ?? id;
}

export default function MyCritiquesDetailsClient() {
  const router = useRouter();
  const params = useParams<{ policyId: string }>();
  const policyId = params.policyId;
  const { user } = useUser();

  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);
  const [policy, setPolicy] = useState<any | null>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [aiVersions, setAiVersions] = useState<
    { id: string; title: string; slug?: string; latestScore: number | null }[]
  >([]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        if (!user) return;

        const pSnap = await getDoc(doc(db, "users", user.uid, "policies", policyId));
        const basePolicy = pSnap.exists() ? { id: pSnap.id, ...(pSnap.data() as any) } : null;
        setPolicy(basePolicy);

        const privateCritSnap = await getDocs(
          query(
            collection(db, "users", user.uid, "policies", policyId, "critiques"),
            orderBy("createdAt", "desc"),
            limit(50)
          )
        );
        setTimeline(privateCritSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));

        const aiSnap = await getDocs(
          query(collection(db, "users", user.uid, "policies"), where("createdFromPolicyId", "==", policyId), limit(20))
        );

        const derived = aiSnap.docs
          .map((d) => ({ id: d.id, ...(d.data() as any) }))
          .filter((x) => x.type === "ai_generated");

        const aiWithScores = await Promise.all(
          derived.map(async (ai) => {
            const privateScoreSnap = await getDocs(
              query(collection(db, "users", user.uid, "policies", ai.id, "critiques"), orderBy("createdAt", "desc"), limit(1))
            );

            const latestScore =
              !privateScoreSnap.empty && typeof privateScoreSnap.docs[0].data().overallScore === "number"
                ? privateScoreSnap.docs[0].data().overallScore
                : null;

            return {
              id: ai.id,
              title: ai.title,
              slug: ai.slug,
              latestScore,
            };
          })
        );

        setAiVersions(aiWithScores);
      } catch (e) {
        console.error("MyCritiquesDetails load error:", e);
      } finally {
        setLoading(false);
      }
    };

    if (policyId && user) void load();
  }, [policyId, user]);

  const improvementNote = useMemo(() => {
    if (timeline.length < 2) return null;
    const newest = timeline[0];
    const prev = timeline[1];
    if (typeof newest.overallScore !== "number" || typeof prev.overallScore !== "number") return null;
    const delta = newest.overallScore - prev.overallScore;
    if (delta > 0) return { tone: "good", text: `Latest critique improved by +${delta} points vs the previous run.` };
    if (delta < 0) return { tone: "bad", text: `Latest critique dropped by ${Math.abs(delta)} points vs the previous run.` };
    return { tone: "mid", text: "Latest critique score is unchanged vs the previous run." };
  }, [timeline]);

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <section className="mb-6 rounded-[2rem] bg-[linear-gradient(135deg,#001b33_0%,#002c52_52%,#0073d1_100%)] p-7 text-white shadow-[0_24px_70px_rgba(0,56,105,0.18)]">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <Button variant="outline" onClick={() => router.push("/my-critiques")} className="gap-2 border-white/20 bg-transparent text-white hover:bg-white/10">
                <ArrowLeft size={16} />
                Back
              </Button>
              <div>
                <h1 className="text-4xl font-black tracking-tight">{policy?.title ?? "Policy critique history"}</h1>
                <p className="mt-3 text-sm text-white/78">
                  Review the full critique timeline, compare revisions, and inspect what the AI flagged in each run.
                </p>
              </div>
            </div>

            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" onClick={() => router.push(`/critique?policyId=${policyId}`)} className="gap-2 border-white/20 bg-transparent text-white hover:bg-white/10">
                <Sparkles size={16} />
                Critique again
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
            <p className="text-sm text-[var(--text-secondary)]">Loading critique history...</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <Card className="premium-card p-6 lg:col-span-2">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-lg font-bold text-blue-deep">Timeline</h2>
                <Badge variant="outline">{timeline.length} runs</Badge>
              </div>

              {improvementNote ? (
                <div
                  className={`mb-4 rounded-xl border p-4 ${
                    improvementNote.tone === "good"
                      ? "border-green-200 bg-green-50"
                      : improvementNote.tone === "bad"
                      ? "border-red-200 bg-red-50"
                      : "border-blue-200 bg-blue-soft"
                  }`}
                >
                  <p className="text-sm font-semibold">{improvementNote.text}</p>
                </div>
              ) : null}

              {timeline.length === 0 ? (
                <p className="text-sm text-[var(--text-secondary)]">No critiques yet for this policy.</p>
              ) : (
                <div className="space-y-3">
                  {timeline.map((c, idx) => {
                    const isOpen = openId === c.id;
                    return (
                      <div key={c.id} className="overflow-hidden rounded-xl border bg-white">
                        <button
                          type="button"
                          onClick={() => setOpenId(isOpen ? null : c.id)}
                          className="flex w-full items-start justify-between gap-3 p-4 text-left transition hover:bg-blue-soft"
                        >
                          <div className="min-w-0">
                            <p className="font-bold text-blue-deep">Score: {c.overallScore}/100</p>
                            <p className="mt-1 text-xs text-[var(--text-secondary)]">
                              Run #{timeline.length - idx} · Revision: {c.revisionNumber ?? 0}
                            </p>
                            {Array.isArray(c.selectedStandards) ? (
                              <div className="mt-3 flex flex-wrap gap-2">
                                {c.selectedStandards.slice(0, 4).map((s: string) => (
                                  <Badge key={s} variant="outline">{labelForStandard(s)}</Badge>
                                ))}
                                {c.selectedStandards.length > 4 ? <Badge variant="outline">+{c.selectedStandards.length - 4} more</Badge> : null}
                              </div>
                            ) : null}
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <Badge variant="outline">
                              {Array.isArray(c.selectedStandards) ? `${c.selectedStandards.length} standards` : "standards"}
                            </Badge>
                            <ChevronDown size={18} className={`text-blue-electric transition-transform ${isOpen ? "rotate-180" : ""}`} />
                          </div>
                        </button>

                        <div className={`grid transition-all duration-300 ease-in-out ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
                          <div className="overflow-hidden">
                            <div className="space-y-4 px-4 pb-4">
                              {c.executiveVerdict ? (
                                <div className="rounded-xl border p-4">
                                  <p className="font-bold text-blue-deep">Executive verdict</p>
                                  <p className="mt-1 text-sm text-[var(--text-secondary)]">{c.executiveVerdict}</p>
                                </div>
                              ) : null}

                              {c.decisionRecommendation ? (
                                <div className="rounded-xl border p-4">
                                  <p className="font-bold text-blue-deep">Recommendation</p>
                                  <p className="mt-1 text-sm font-semibold capitalize text-blue-deep">{String(c.decisionRecommendation.status || "").replace(/_/g, " ")}</p>
                                  <p className="mt-1 text-sm text-[var(--text-secondary)]">{c.decisionRecommendation.rationale}</p>
                                </div>
                              ) : null}

                              {Array.isArray(c.perStandard) && c.perStandard.length > 0 ? (
                                <div className="space-y-3">
                                  {c.perStandard.map((ps: any) => (
                                    <div key={ps.standardId} className="rounded-xl border p-4">
                                      <div className="flex items-center justify-between gap-2">
                                        <p className="font-bold text-blue-deep">{labelForStandard(ps.standardId)}</p>
                                        <p className="font-bold">{ps.score}/100</p>
                                      </div>
                                      {Array.isArray(ps.suggestions) && ps.suggestions.length > 0 ? (
                                        <ul className="mt-2 ml-5 list-disc space-y-1 text-sm text-[var(--text-secondary)]">
                                          {ps.suggestions.map((s: string, i: number) => <li key={i}>{s}</li>)}
                                        </ul>
                                      ) : null}
                                    </div>
                                  ))}
                                </div>
                              ) : null}

                              {c.summary ? (
                                <div className="rounded-xl border p-4">
                                  <p className="font-bold text-blue-deep">Summary</p>
                                  <p className="mt-1 text-sm text-[var(--text-secondary)]">{c.summary}</p>
                                </div>
                              ) : null}

                              {Array.isArray(c.evidenceGaps) && c.evidenceGaps.length > 0 ? (
                                <div className="rounded-xl border p-4">
                                  <p className="font-bold text-blue-deep">Evidence gaps</p>
                                  <ul className="mt-2 ml-5 list-disc space-y-1 text-sm text-[var(--text-secondary)]">
                                    {c.evidenceGaps.map((item: string, i: number) => <li key={i}>{item}</li>)}
                                  </ul>
                                </div>
                              ) : null}

                              {Array.isArray(c.strengths) && c.strengths.length > 0 ? (
                                <div className="rounded-xl border p-4">
                                  <p className="font-bold text-blue-deep">Strengths</p>
                                  <ul className="mt-2 ml-5 list-disc space-y-1 text-sm text-[var(--text-secondary)]">
                                    {c.strengths.map((s: string, i: number) => <li key={i}>{s}</li>)}
                                  </ul>
                                </div>
                              ) : null}

                              {Array.isArray(c.risks) && c.risks.length > 0 ? (
                                <div className="rounded-xl border p-4">
                                  <p className="font-bold text-blue-deep">Risks</p>
                                  <ul className="mt-2 ml-5 list-disc space-y-1 text-sm text-[var(--text-secondary)]">
                                    {c.risks.map((r: string, i: number) => <li key={i}>{r}</li>)}
                                  </ul>
                                </div>
                              ) : null}

                              {Array.isArray(c.evidence) && c.evidence.length > 0 ? (
                                <div className="rounded-xl border p-4">
                                  <p className="font-bold text-blue-deep">Reference evidence</p>
                                  <div className="mt-3 space-y-2">
                                    {c.evidence.map((entry: any, i: number) => (
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
              )}
            </Card>

            <Card className="premium-card p-6">
              <h2 className="text-lg font-bold text-blue-deep mb-2">AI-generated versions</h2>
              <p className="mb-4 text-sm text-[var(--text-secondary)]">
                See how the AI-generated policies derived from this one are performing.
              </p>

              {aiVersions.length === 0 ? (
                <p className="text-sm text-[var(--text-secondary)]">No AI-generated versions yet.</p>
              ) : (
                <div className="space-y-2">
                  {aiVersions.map((ai) => (
                    <button
                      key={ai.id}
                      onClick={() => ai.slug && router.push(`/policies/${ai.slug}`)}
                      className="w-full rounded-xl border p-4 text-left transition hover:bg-blue-soft"
                    >
                      <p className="truncate font-bold text-blue-deep">{ai.title}</p>
                      <p className="mt-2 text-sm text-[var(--text-secondary)]">
                        Latest score: <span className="font-semibold text-blue-deep">{ai.latestScore ?? "Not yet critiqued"}</span>
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </Card>
          </div>
        )}
      </DashboardLayout>
    </ProtectedRoute>
  );
}
