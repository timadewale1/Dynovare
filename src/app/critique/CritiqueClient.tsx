"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import ProtectedRoute from "@/components/guards/ProtectedRoute";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";
import { db } from "@/lib/firebase";
import {
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
  collection,
  getDocs,
  limit,
  orderBy,
  query,
} from "firebase/firestore";
import type { Policy } from "@/lib/policyTypes";
import PolicyPicker from "@/components/policies/PolicyPicker";
import {
  Upload,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import toast from "react-hot-toast";

import {
  CRITIQUE_STANDARDS,
  type CritiqueStandardId,
} from "@/lib/critiqueStandards";
import { runCritiqueMVP } from "@/lib/critiqueEngine";
import { saveCritique } from "@/lib/critiqueWrites";
import { Badge } from "@/components/ui/badge";

import { useUser } from "@/components/providers/UserProvider";
import { extractPolicyText } from "@/lib/extractText";
import {
  getStorage,
  ref as storageRef,
  uploadBytesResumable,
} from "firebase/storage";

import { generateImprovedPolicyMVP } from "@/lib/policyImproveEngine";
import { createAIGeneratedPolicy } from "@/lib/policyAIWrites";

export default function CritiqueClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const policyId = searchParams.get("policyId");

  const { user, profile } = useUser();

  const [policy, setPolicy] = useState<Policy | null>(null);
  const [loadingPolicy, setLoadingPolicy] = useState(false);

  const [selected, setSelected] = useState<CritiqueStandardId[]>([
    "sdg_alignment",
    "inclusivity_equity",
    "implementation_feasibility",
    "monitoring_metrics",
  ]);

  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [previousScore, setPreviousScore] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [revising, setRevising] = useState(false);
  const [revProgress, setRevProgress] = useState(0);

  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!policyId) return;

      setLoadingPolicy(true);

      const snap = await getDoc(doc(db, "policies", policyId));
      if (snap.exists()) setPolicy({ id: snap.id, ...(snap.data() as any) });
      else setPolicy(null);

      const critSnap = await getDocs(
        query(
          collection(db, "policies", policyId, "critiques"),
          orderBy("createdAt", "desc"),
          limit(1)
        )
      );

      if (!critSnap.empty) {
        const last = critSnap.docs[0].data() as any;
        setPreviousScore(
          typeof last.overallScore === "number" ? last.overallScore : null
        );
      } else {
        setPreviousScore(null);
      }

      setLoadingPolicy(false);
    };

    load();
  }, [policyId]);

  const autoCritiqueGeneratedPolicy = async (args: {
    aiPolicyId: string;
    aiPolicySlug: string;
    aiPolicyTitle: string;
    improvedText: string;
  }) => {
    if (!user) return;

    const out = runCritiqueMVP({
      policyText: args.improvedText,
      standards: selected,
    });

    await saveCritique({
      policyId: args.aiPolicyId,
      policyTitle: args.aiPolicyTitle,
      policySlug: args.aiPolicySlug,
      policyType: "ai_generated",
      jurisdictionLevel: policy?.jurisdictionLevel,
      state: policy?.state,
      policyYear: policy?.policyYear ?? null,

      userId: user.uid,
      userName: profile?.fullName,
      userEmail: user.email ?? null,

      revisionNumber: 0,

      selectedStandards: selected,
      overallScore: out.overallScore,
      perStandard: out.perStandard,
      summary: out.summary,
      strengths: out.strengths,
      risks: out.risks,

      previousOverallScore: null,
    });

    return out.overallScore;
  };

  const isOwner = useMemo(() => {
    if (!user || !policy) return false;
    return (policy as any).createdByUid === user.uid;
  }, [user, policy]);

  const generateImproved = async () => {
    if (!user || !policy || !result) {
      toast.error("Missing policy or critique result");
      return;
    }

    try {
      setGenerating(true);

      const improvedText = generateImprovedPolicyMVP({
        originalTitle: policy.title,
        originalText: policy.contentText ?? "",
        selectedStandards: selected,
        perStandard: result.perStandard,
        overallScore: result.overallScore,
      });

      const created = await createAIGeneratedPolicy({
        uid: user.uid,
        userName: profile?.fullName,
        userEmail: user.email ?? null,
        basePolicy: policy,
        improvedText,
      });

      const aiScore = await autoCritiqueGeneratedPolicy({
        aiPolicyId: created.id,
        aiPolicySlug: created.slug,
        aiPolicyTitle: created.title,
        improvedText,
      });

      toast.success(
        aiScore ? `AI policy created & scored ${aiScore}/100` : "AI policy created"
      );

      router.push(`/policies/${created.slug}`);
    } catch (e) {
      console.error(e);
      toast.error("Failed to generate improved policy");
    } finally {
      setGenerating(false);
    }
  };

  const toggle = (id: CritiqueStandardId) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const overallTone = useMemo(() => {
    if (!result) return null;
    if (result.overallScore >= 80) return "good";
    if (result.overallScore >= 65) return "mid";
    return "bad";
  }, [result]);

  const run = async (opts?: { forcePreviousScore?: number | null }) => {
    if (!policyId) return;

    if (!user) {
      toast.error("Please sign in");
      router.push("/login");
      return;
    }

    if (selected.length === 0) {
      toast.error("Select at least one standard");
      return;
    }

    if (!policy) {
      toast.error("Policy not found");
      return;
    }

    const text = policy.contentText ?? "";
    if (!text || text.trim().length < 120) {
      toast.error("Policy text is too short for critique. Upload a richer PDF/DOCX.");
      return;
    }

    try {
      setRunning(true);

      const out = runCritiqueMVP({ policyText: text, standards: selected });

      const prev =
        typeof opts?.forcePreviousScore === "number"
          ? opts.forcePreviousScore
          : previousScore;

      await saveCritique({
        policyId,
        policyTitle: policy.title,
        policySlug: (policy as any).slug,
        policyType: (policy as any).type,
        jurisdictionLevel: (policy as any).jurisdictionLevel,
        state: (policy as any).state,
        policyYear: (policy as any).policyYear ?? null,

        userId: user.uid,
        userName: profile?.fullName,
        userEmail: user.email ?? null,

        revisionNumber: (policy as any).revisionNumber ?? 0,

        selectedStandards: selected,
        overallScore: out.overallScore,
        perStandard: out.perStandard,
        summary: out.summary,
        strengths: out.strengths,
        risks: out.risks,

        previousOverallScore: prev,
      });

      setResult(out);
      setPreviousScore(out.overallScore);
      toast.success("Critique complete");
    } catch (e) {
      console.error(e);
      toast.error("Critique failed");
    } finally {
      setRunning(false);
    }
  };

  const triggerRevisedUpload = () => fileInputRef.current?.click();

  const handleRevisedFile = async (file: File) => {
    if (!policyId || !policy) return;

    if (!isOwner) {
      toast.error("Only the original uploader can upload a revised version.");
      return;
    }

    const okTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
    ];
    if (!okTypes.includes(file.type)) {
      toast.error("Only PDF or Word (DOC/DOCX) is allowed");
      return;
    }

    try {
      setRevising(true);
      setRevProgress(0);

      const extractedText = await extractPolicyText(file);
      if (!extractedText || extractedText.length < 120) {
        toast.error("Could not extract enough text. Try a better PDF/DOCX.");
        return;
      }

      const storage = getStorage();
      const ext = file.name.split(".").pop() ?? "file";
      const path = `policies/revisions/${policyId}/${Date.now()}.${ext}`;

      await new Promise<void>((resolve, reject) => {
        const task = uploadBytesResumable(storageRef(storage, path), file);
        task.on(
          "state_changed",
          (snap) => {
            const pct = Math.round(
              (snap.bytesTransferred / snap.totalBytes) * 100
            );
            setRevProgress(pct);
          },
          reject,
          () => resolve()
        );
      });

      const currentRev = (policy as any).revisionNumber ?? 0;
      await updateDoc(doc(db, "policies", policyId), {
        contentText: extractedText,
        storagePath: path,
        revisionNumber: currentRev + 1,
        updatedAt: serverTimestamp(),
      });

      const prevScoreSnapshot = previousScore;

      setPolicy((p) =>
        p
          ? ({
              ...p,
              contentText: extractedText,
              storagePath: path,
              revisionNumber: currentRev + 1,
            } as any)
          : p
      );

      toast.success("Revised version uploaded. Re-running critique…");
      await run({ forcePreviousScore: prevScoreSnapshot });
    } catch (e) {
      console.error(e);
      toast.error("Revised upload failed");
    } finally {
      setRevising(false);
    }
  };

  if (!policyId) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-blue-deep">AI Critique</h1>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              Select an existing policy or upload a new one to critique.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <PolicyPicker
                onSelect={(p) => router.push(`/critique?policyId=${p.id}`)}
              />
            </div>

            <Card className="p-6">
              <h3 className="text-lg font-bold text-blue-deep mb-2">
                Upload a policy
              </h3>
              <p className="text-sm text-[var(--text-secondary)] mb-4">
                Upload your own PDF/DOCX. It will be added to the repository and
                then you can critique it.
              </p>

              <Button
                className="w-full gap-2"
                onClick={() =>
                  router.push("/policies/upload?redirect=/critique")
                }
              >
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
            <h1 className="text-2xl font-bold text-blue-deep">AI Critique</h1>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              {loadingPolicy
                ? "Loading selected policy…"
                : policy
                ? `Selected: ${policy.title}`
                : "Selected policy not found."}
            </p>
          </div>

          <Button variant="outline" onClick={() => router.push("/policies")}>
            Browse repository
          </Button>
        </div>

        <Card className="p-6 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="text-blue-electric" size={18} />
            <h2 className="text-lg font-bold text-blue-deep">
              Select critique standards
            </h2>
          </div>

          <p className="text-sm text-[var(--text-secondary)] mb-4">
            Choose the standards you want Dynovare to evaluate this policy against.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {CRITIQUE_STANDARDS.map((s) => {
              const on = selected.includes(s.id);
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => toggle(s.id)}
                  className={`border rounded-xl p-4 text-left transition ${
                    on
                      ? "border-blue-electric bg-blue-soft"
                      : "hover:border-blue-electric"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-bold text-blue-deep">{s.label}</p>
                      <p className="text-sm text-[var(--text-secondary)] mt-1">
                        {s.description}
                      </p>
                    </div>
                    {on ? (
                      <CheckCircle2 className="text-blue-electric" size={18} />
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-5 flex items-center justify-between gap-3 flex-wrap">
            <p className="text-sm text-[var(--text-secondary)]">
              Selected: <span className="font-semibold">{selected.length}</span>
            </p>

            <Button onClick={() => run()} disabled={running || !policy}>
              {running ? "Running critique…" : "Run critique"}
            </Button>
          </div>
        </Card>

        {result && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="p-6 lg:col-span-2">
              <h2 className="text-lg font-bold text-blue-deep mb-2">Results</h2>

              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <Badge variant="outline">Overall score</Badge>
                <span className="text-2xl font-bold">{result.overallScore}/100</span>

                {overallTone === "bad" && (
                  <span className="text-sm text-red-600 font-semibold flex items-center gap-1">
                    <AlertTriangle size={16} /> Needs improvement
                  </span>
                )}
                {overallTone === "mid" && (
                  <span className="text-sm text-amber-700 font-semibold">
                    Moderate
                  </span>
                )}
                {overallTone === "good" && (
                  <span className="text-sm text-green-700 font-semibold">Strong</span>
                )}
              </div>

              {typeof previousScore === "number" && (
                <p className="text-sm text-[var(--text-secondary)] mb-4">
                  {result.overallScore > previousScore ? (
                    <span className="font-semibold text-green-700">
                      Improvement acknowledged: +
                      {result.overallScore - previousScore} points compared to the previous critique.
                    </span>
                  ) : result.overallScore < previousScore ? (
                    <span className="font-semibold text-red-600">
                      Score dropped by {previousScore - result.overallScore} points compared to the previous critique.
                    </span>
                  ) : (
                    <span className="font-semibold">
                      Score unchanged compared to the previous critique.
                    </span>
                  )}
                </p>
              )}

              <p className="text-sm text-[var(--text-secondary)] mb-5">
                {result.summary}
              </p>

              <div className="space-y-3">
                {result.perStandard.map((r: any) => (
                  <div key={r.standardId} className="border rounded-xl p-4">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-bold text-blue-deep">
                        {CRITIQUE_STANDARDS.find((x) => x.id === r.standardId)?.label}
                      </p>
                      <p className="font-bold">{r.score}/100</p>
                    </div>

                    <ul className="mt-2 list-disc ml-5 text-sm text-[var(--text-secondary)] space-y-1">
                      {r.suggestions.map((s: string, i: number) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-lg font-bold text-blue-deep mb-2">Next steps</h2>

              <p className="text-sm text-[var(--text-secondary)] mb-4">
                You can either generate an improved version using AI or upload a revised version and re-run the critique.
              </p>

              <div className="space-y-2">
                <Button
                  className="w-full"
                  onClick={generateImproved}
                  disabled={generating}
                >
                  {generating ? "Generating…" : "Generate improved policy"}
                </Button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleRevisedFile(f);
                    e.currentTarget.value = "";
                  }}
                />

                {isOwner ? (
                  <Button
                    variant="outline"
                    className="w-full gap-2"
                    onClick={triggerRevisedUpload}
                    disabled={revising}
                  >
                    <RefreshCw size={16} />
                    {revising ? `Uploading… ${revProgress}%` : "Upload revised version"}
                  </Button>
                ) : (
                  <div className="text-xs text-[var(--text-secondary)] border rounded-xl p-3">
                    Only the original uploader can upload a revised version of this policy.
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}
      </DashboardLayout>
    </ProtectedRoute>
  );
}
