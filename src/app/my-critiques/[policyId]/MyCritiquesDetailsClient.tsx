"use client";

import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import ProtectedRoute from "@/components/guards/ProtectedRoute";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { ArrowLeft, ExternalLink, Sparkles } from "lucide-react";
import { CRITIQUE_STANDARDS } from "@/lib/critiqueStandards";
import { ChevronDown } from "lucide-react";


function labelForStandard(id: string) {
  return CRITIQUE_STANDARDS.find((s) => s.id === id)?.label ?? id;
}

export default function MyCritiquesDetailsClient() {
  const router = useRouter();
  const params = useParams<{ policyId: string }>();
  const policyId = params.policyId;

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

        // 1) Base policy
        const pSnap = await getDoc(doc(db, "policies", policyId));
        const basePolicy = pSnap.exists()
          ? { id: pSnap.id, ...(pSnap.data() as any) }
          : null;
        setPolicy(basePolicy);

        // 2) Timeline (latest 50)
        const critSnap = await getDocs(
          query(
            collection(db, "policies", policyId, "critiques"),
            orderBy("createdAt", "desc"),
            limit(50)
          )
        );
        setTimeline(critSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));

        // 3) Find AI-generated versions derived from this policy
        const aiSnap = await getDocs(
          query(
            collection(db, "policies"),
            where("createdFromPolicyId", "==", policyId),
            limit(20)
          )
        );

        const derived = aiSnap.docs
          .map((d) => ({ id: d.id, ...(d.data() as any) }))
          .filter((x) => x.type === "ai_generated");

        // 4) Latest critique score for each AI version (if any)
        const aiWithScores = await Promise.all(
          derived.map(async (ai) => {
            const s = await getDocs(
              query(
                collection(db, "policies", ai.id, "critiques"),
                orderBy("createdAt", "desc"),
                limit(1)
              )
            );

            const latestScore =
              !s.empty && typeof s.docs[0].data().overallScore === "number"
                ? s.docs[0].data().overallScore
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

    if (policyId) load();
  }, [policyId]);

  const baseSlug = policy?.slug;
  const baseTitle = policy?.title ?? "Policy";

  const improvementNote = useMemo(() => {
    if (timeline.length < 2) return null;
    const newest = timeline[0];
    const prev = timeline[1];
    if (typeof newest.overallScore !== "number" || typeof prev.overallScore !== "number") return null;

    const delta = newest.overallScore - prev.overallScore;
    if (delta > 0) return { tone: "good", text: `Latest critique improved by +${delta} points vs the previous run.` };
    if (delta < 0) return { tone: "bad", text: `Latest critique dropped by ${Math.abs(delta)} points vs the previous run.` };
    return { tone: "mid", text: `Latest critique score is unchanged vs the previous run.` };
  }, [timeline]);

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="mb-6 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <Button variant="outline" onClick={() => router.push("/my-critiques")} className="gap-2">
              <ArrowLeft size={16} />
              Back
            </Button>

            <div>
              <h1 className="text-2xl font-bold text-blue-deep">{baseTitle}</h1>
              <p className="text-sm text-[var(--text-secondary)] mt-1">
                Critique history timeline (including revised uploads).
              </p>
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            <Button
              variant="outline"
              onClick={() => router.push(`/critique?policyId=${policyId}`)}
              className="gap-2"
            >
              <Sparkles size={16} />
              Critique again
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
            <p className="text-sm text-[var(--text-secondary)]">Loading critique history…</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="p-6 lg:col-span-2">
              <div className="flex items-center justify-between gap-3 mb-4">
                <h2 className="text-lg font-bold text-blue-deep">Timeline</h2>
                <Badge variant="outline">{timeline.length} runs</Badge>
              </div>

              {improvementNote && (
                <div
                  className={`border rounded-xl p-4 mb-4 ${
                    improvementNote.tone === "good"
                      ? "border-green-200 bg-green-50"
                      : improvementNote.tone === "bad"
                      ? "border-red-200 bg-red-50"
                      : "border-blue-200 bg-blue-soft"
                  }`}
                >
                  <p className="text-sm font-semibold">{improvementNote.text}</p>
                </div>
              )}

              {timeline.length === 0 ? (
  <p className="text-sm text-[var(--text-secondary)]">
    No critiques yet for this policy.
  </p>
) : (
  <div className="space-y-3">
    {timeline.map((c, idx) => {
      const isOpen = openId === c.id;

      return (
        <div key={c.id} className="border rounded-xl overflow-hidden bg-white">
          {/* Header row (clickable) */}
          <button
            type="button"
            onClick={() => setOpenId(isOpen ? null : c.id)}
            className="w-full text-left p-4 hover:bg-blue-soft transition flex items-start justify-between gap-3"
          >
            <div className="min-w-0">
              <p className="font-bold text-blue-deep">
                Score: {c.overallScore}/100
              </p>

              <p className="text-xs text-[var(--text-secondary)] mt-1">
                Run #{timeline.length - idx} • Revision: {c.revisionNumber ?? 0}
              </p>

              {/* Standards chips (summary) */}
              {Array.isArray(c.selectedStandards) && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {c.selectedStandards.slice(0, 4).map((s: string) => (
                    <Badge key={s} variant="outline">
                      {labelForStandard(s)}
                    </Badge>
                  ))}
                  {c.selectedStandards.length > 4 && (
                    <Badge variant="outline">
                      +{c.selectedStandards.length - 4} more
                    </Badge>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Badge variant="outline">
                {Array.isArray(c.selectedStandards)
                  ? `${c.selectedStandards.length} standards`
                  : "standards"}
              </Badge>

              <ChevronDown
                size={18}
                className={`text-blue-electric transition-transform ${
                  isOpen ? "rotate-180" : ""
                }`}
              />
            </div>
          </button>

          {/* Collapsible details */}
          <div
            className={`grid transition-all duration-300 ease-in-out ${
              isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
            }`}
          >
            <div className="overflow-hidden">
              <div className="px-4 pb-4">
                {/* Per-standard results like critique page */}
                {Array.isArray(c.perStandard) && c.perStandard.length > 0 ? (
                  <div className="space-y-3">
                    {c.perStandard.map((ps: any) => (
                      <div key={ps.standardId} className="border rounded-xl p-4">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-bold text-blue-deep">
                            {labelForStandard(ps.standardId)}
                          </p>
                          <p className="font-bold">{ps.score}/100</p>
                        </div>

                        {Array.isArray(ps.suggestions) && ps.suggestions.length > 0 && (
                          <ul className="mt-2 list-disc ml-5 text-sm text-[var(--text-secondary)] space-y-1">
                            {ps.suggestions.map((s: string, i: number) => (
                              <li key={i}>{s}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-[var(--text-secondary)]">
                    No per-standard breakdown available for this run.
                  </p>
                )}

                {/* Summary/Strengths/Risks (optional, if you stored them) */}
                {(c.summary || c.strengths?.length || c.risks?.length) && (
                  <div className="mt-4 space-y-3">
                    {c.summary && (
                      <div className="border rounded-xl p-4">
                        <p className="font-bold text-blue-deep">Summary</p>
                        <p className="text-sm text-[var(--text-secondary)] mt-1">
                          {c.summary}
                        </p>
                      </div>
                    )}

                    {Array.isArray(c.strengths) && c.strengths.length > 0 && (
                      <div className="border rounded-xl p-4">
                        <p className="font-bold text-blue-deep">Strengths</p>
                        <ul className="mt-2 list-disc ml-5 text-sm text-[var(--text-secondary)] space-y-1">
                          {c.strengths.map((s: string, i: number) => (
                            <li key={i}>{s}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {Array.isArray(c.risks) && c.risks.length > 0 && (
                      <div className="border rounded-xl p-4">
                        <p className="font-bold text-blue-deep">Risks</p>
                        <ul className="mt-2 list-disc ml-5 text-sm text-[var(--text-secondary)] space-y-1">
                          {c.risks.map((r: string, i: number) => (
                            <li key={i}>{r}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    })}
  </div>
)}

            </Card>

            <Card className="p-6">
              <h2 className="text-lg font-bold text-blue-deep mb-2">AI-generated versions</h2>
              <p className="text-sm text-[var(--text-secondary)] mb-4">
                Latest critique score for each AI-generated policy derived from this one.
              </p>

              {aiVersions.length === 0 ? (
                <p className="text-sm text-[var(--text-secondary)]">No AI-generated versions yet.</p>
              ) : (
                <div className="space-y-2">
                  {aiVersions.map((ai) => (
                    <button
                      key={ai.id}
                      onClick={() => ai.slug && router.push(`/policies/${ai.slug}`)}
                      className="w-full text-left border rounded-xl p-4 hover:bg-blue-soft transition"
                    >
                      <p className="font-bold text-blue-deep truncate">{ai.title}</p>
                      <p className="text-sm text-[var(--text-secondary)] mt-2">
                        Latest score:{" "}
                        <span className="font-semibold text-blue-deep">
                          {ai.latestScore ?? "Not yet critiqued"}
                        </span>
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
