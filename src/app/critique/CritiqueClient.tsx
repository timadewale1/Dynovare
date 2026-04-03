"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import ProtectedRoute from "@/components/guards/ProtectedRoute";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, doc, getDocs, limit, orderBy, query, serverTimestamp, updateDoc } from "firebase/firestore";
import type { Policy } from "@/lib/policyTypes";
import PolicyPicker from "@/components/policies/PolicyPicker";
import {
  Upload,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ShieldCheck,
  FilePenLine,
  Wand2,
} from "lucide-react";
import toast from "react-hot-toast";
import { CRITIQUE_STANDARDS, type CritiqueStandardId } from "@/lib/critiqueStandards";
import { saveCritique } from "@/lib/critiqueWrites";
import { Badge } from "@/components/ui/badge";
import { useUser } from "@/components/providers/UserProvider";
import { extractPolicyText } from "@/lib/extractText";
import { getStorage, ref as storageRef, uploadBytesResumable } from "firebase/storage";
import { createAIGeneratedPolicy } from "@/lib/policyAIWrites";
import { resolvePolicyForUser } from "@/lib/workspacePolicies";
import { useRotatingStatus } from "@/lib/useRotatingStatus";

export default function CritiqueClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const policyId = searchParams.get("policyId");
  const { user, profile } = useUser();

  const [policy, setPolicy] = useState<Policy | null>(null);
  const [policyScope, setPolicyScope] = useState<"workspace" | "public">("workspace");
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
  const [revising, setRevising] = useState(false);
  const [revProgress, setRevProgress] = useState(0);
  const [generating, setGenerating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const critiqueStatus = useRotatingStatus(running, [
    "Reading the policy and chosen standards...",
    "Scoring structure, feasibility, and readiness...",
    "Comparing strengths, risks, and evidence gaps...",
    "Writing the critique summary and action points...",
    "Saving the critique to your workspace...",
  ]);
  const improvedPolicyStatus = useRotatingStatus(generating, [
    "Generating an improved policy draft...",
    "Using critique findings to reshape weak sections...",
    "Adding stronger implementation detail...",
    "Building a cleaner revision path for Policy Studio...",
    "Preparing the improved draft for review...",
  ]);

  useEffect(() => {
    const load = async () => {
      if (!policyId || !user) return;
      setLoadingPolicy(true);
      const resolved = await resolvePolicyForUser(user.uid, policyId);

      if (!resolved) {
        setPolicy(null);
        setLoadingPolicy(false);
        return;
      }

      setPolicy(resolved.policy);
      setPolicyScope(resolved.scope);

      const critiquesRef =
        resolved.scope === "public"
          ? collection(db, "policies", policyId, "critiques")
          : collection(db, "users", user.uid, "policies", policyId, "critiques");
      const critSnap = await getDocs(query(critiquesRef, orderBy("createdAt", "desc"), limit(1)));

      if (!critSnap.empty) {
        const last = critSnap.docs[0].data() as any;
        setPreviousScore(typeof last.overallScore === "number" ? last.overallScore : null);
      } else {
        setPreviousScore(null);
      }

      setLoadingPolicy(false);
    };

    void load();
  }, [policyId, user]);

  const isOwner = useMemo(() => {
    if (!user || !policy) return false;
    return policyScope === "workspace" && (policy as any).createdByUid === user.uid;
  }, [user, policy, policyScope]);

  const overallTone = useMemo(() => {
    if (!result) return null;
    if (result.overallScore >= 80) return "good";
    if (result.overallScore >= 65) return "mid";
    return "bad";
  }, [result]);

  const toggle = (id: CritiqueStandardId) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  async function callCritiqueAPI(args: { targetPolicyId: string; selectedStandards: CritiqueStandardId[] }) {
    const res = await fetch("/api/ai/critique", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        policyId: args.targetPolicyId,
        ownerUid: policyScope === "workspace" ? user?.uid : undefined,
        selectedStandards: args.selectedStandards,
      }),
    });

    const out = await res.json();
    if (!res.ok) {
      if (out?.code === "TEXT_TOO_SHORT") {
        throw new Error("Policy text is too short for critique. Upload a richer PDF or DOCX.");
      }
      throw new Error(out?.error || "Critique failed");
    }

    return out;
  }

  const run = async (opts?: { forcePreviousScore?: number | null }) => {
    if (!policyId || !policy || !user) return;
    if (selected.length === 0) {
      toast.error("Select at least one standard");
      return;
    }

    const text = policy.contentText ?? "";
    if (!text || text.trim().length < 120) {
      toast.error("Policy text is too short for critique. Upload a richer PDF or DOCX.");
      return;
    }

    try {
      setRunning(true);
      const out = await callCritiqueAPI({ targetPolicyId: policyId, selectedStandards: selected });
      const prev = typeof opts?.forcePreviousScore === "number" ? opts.forcePreviousScore : previousScore;

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
        executiveVerdict: out.executiveVerdict,
        confidenceLevel: out.confidenceLevel,
        maturityProfile: out.maturityProfile,
        decisionRecommendation: out.decisionRecommendation,
        priorityActions: out.priorityActions,
        evidenceGaps: out.evidenceGaps,
        stakeholderImpacts: out.stakeholderImpacts,
        evidence: out.evidence,
        implementationOutlook: out.implementationOutlook,
        strengths: out.strengths,
        risks: out.risks,
        previousOverallScore: prev,
        policyScope,
        ownerUid: policyScope === "workspace" ? user.uid : undefined,
      });

      setResult(out);
      setPreviousScore(out.overallScore);
      toast.success("Critique complete");
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Critique failed");
    } finally {
      setRunning(false);
    }
  };

  const autoCritiqueGeneratedPolicy = async (args: {
    aiPolicyId: string;
    aiPolicySlug: string;
    aiPolicyTitle: string;
  }) => {
    if (!user) return null;

    const res = await fetch("/api/ai/critique", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        policyId: args.aiPolicyId,
        ownerUid: user.uid,
        selectedStandards: selected,
      }),
    });

    const out = await res.json();
    if (!res.ok) throw new Error(out?.error || "Critique failed");

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
      executiveVerdict: out.executiveVerdict,
      confidenceLevel: out.confidenceLevel,
      maturityProfile: out.maturityProfile,
      decisionRecommendation: out.decisionRecommendation,
      priorityActions: out.priorityActions,
      evidenceGaps: out.evidenceGaps,
      stakeholderImpacts: out.stakeholderImpacts,
      evidence: out.evidence,
      implementationOutlook: out.implementationOutlook,
      strengths: out.strengths,
      risks: out.risks,
      previousOverallScore: null,
      policyScope: "workspace",
      ownerUid: user.uid,
    });

    return out.overallScore as number;
  };

  const generateImproved = async () => {
    if (!user || !policy || !result) {
      toast.error("Missing policy or critique result");
      return;
    }

    try {
      setGenerating(true);
      const res = await fetch("/api/ai/generate-policy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          policyId,
          ownerUid: policyScope === "workspace" ? user.uid : undefined,
          critique: result,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data?.code === "TEXT_TOO_SHORT") {
          throw new Error("Policy text is too short. Upload a richer PDF or DOCX.");
        }
        throw new Error(data?.error || "Generation failed");
      }

      const improvedText = String(data?.improvedText || "").trim();
      if (improvedText.length < 200) throw new Error("Generated policy text was too short. Try again.");

      const created = await createAIGeneratedPolicy({
        uid: user.uid,
        userName: profile?.fullName,
        userEmail: user.email ?? null,
        basePolicy: policy,
        summary: data?.summary,
        sections: data?.sections,
        evidence: data?.evidence,
        guidance: data?.guidance,
        improvedText,
      });

      const aiScore = await autoCritiqueGeneratedPolicy({
        aiPolicyId: created.id,
        aiPolicySlug: created.slug,
        aiPolicyTitle: created.title,
      });

      toast.success(aiScore ? `AI policy created and scored ${aiScore}/100` : "AI policy created");
      router.push(`/policies/${created.slug}`);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Failed to generate improved policy");
    } finally {
      setGenerating(false);
    }
  };

  const triggerRevisedUpload = () => fileInputRef.current?.click();

  const handleRevisedFile = async (file: File) => {
    if (!policyId || !policy || !user || !isOwner) {
      toast.error("Only the owner can upload a revised version.");
      return;
    }

    const okTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!okTypes.includes(file.type)) {
      toast.error("Only PDF or DOCX is allowed");
      return;
    }

    try {
      setRevising(true);
      setRevProgress(0);
      const extractedText = await extractPolicyText(file);
      if (!extractedText || extractedText.length < 120) {
        throw new Error("Could not extract enough text. Try a better PDF or DOCX.");
      }

      const storage = getStorage();
      const ext = file.name.split(".").pop() ?? "file";
      const path = `policies/revisions/${user.uid}/${policyId}/${Date.now()}.${ext}`;

      await new Promise<void>((resolve, reject) => {
        const task = uploadBytesResumable(storageRef(storage, path), file);
        task.on(
          "state_changed",
          (snap) => setRevProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
          reject,
          () => resolve()
        );
      });

      const currentRev = (policy as any).revisionNumber ?? 0;
      await updateDoc(doc(db, "users", user.uid, "policies", policyId), {
        contentText: extractedText,
        storagePath: path,
        revisionNumber: currentRev + 1,
        updatedAt: serverTimestamp(),
      });

      const prevScoreSnapshot = previousScore;
      setPolicy((prev) =>
        prev
          ? ({ ...prev, contentText: extractedText, storagePath: path, revisionNumber: currentRev + 1 } as any)
          : prev
      );

      toast.success("Revised version uploaded. Re-running critique...");
      await run({ forcePreviousScore: prevScoreSnapshot });
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Revised upload failed");
    } finally {
      setRevising(false);
    }
  };

  if (!policyId) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <section className="mb-6 overflow-hidden rounded-[2rem] bg-[linear-gradient(135deg,#001b33_0%,#002c52_52%,#0073d1_100%)] p-7 text-white shadow-[0_24px_70px_rgba(0,56,105,0.18)]">
            <Badge variant="outline" className="border-white/20 bg-white/10 text-white">AI critique</Badge>
            <h1 className="mt-4 text-3xl font-black tracking-tight">Check structure, readiness, risk, and what to fix next.</h1>
            <p className="mt-3 max-w-2xl text-sm text-white/78">
              Pick a workspace policy to score against key standards, surface weak points, and build a stronger revision path.
            </p>
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <PolicyPicker onSelect={(p) => router.push(`/critique?policyId=${p.id}`)} />
            </div>

            <Card className="premium-card p-6">
              <div className="inline-flex rounded-2xl bg-blue-soft p-3 text-blue-electric">
                <Upload size={20} />
              </div>
              <h3 className="mt-4 text-lg font-bold text-blue-deep mb-2">Add a private policy</h3>
              <p className="text-sm text-[var(--text-secondary)] mb-4">
                Upload your own PDF or DOCX. It will stay private in your workspace.
              </p>
              <Button className="w-full gap-2 rounded-full bg-[#0073d1] hover:bg-[#003869]" onClick={() => router.push("/policies/upload?redirect=/critique")}>
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
        <section className="mb-6 overflow-hidden rounded-[2rem] bg-[linear-gradient(135deg,#001b33_0%,#002c52_52%,#0073d1_100%)] p-7 text-white shadow-[0_24px_70px_rgba(0,56,105,0.18)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Badge variant="outline" className="border-white/20 bg-white/10 text-white">AI critique</Badge>
              <h1 className="mt-4 text-3xl font-black tracking-tight">See how strong this policy really is.</h1>
              <p className="mt-3 max-w-2xl text-sm text-white/78">
                {loadingPolicy ? "Loading selected policy..." : policy ? `Reviewing ${policy.title}` : "Selected policy not found."}
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
              <Sparkles className="text-blue-electric" size={18} />
              <h2 className="text-lg font-bold text-blue-deep">Choose the review lenses</h2>
            </div>

            <p className="text-sm text-[var(--text-secondary)] mb-4">
              Select the standards that matter most for this review.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {CRITIQUE_STANDARDS.map((s) => {
                const on = selected.includes(s.id);
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => toggle(s.id)}
                    className={`rounded-[1.2rem] border p-4 text-left transition ${
                      on ? "border-blue-electric bg-blue-soft shadow-[0_14px_30px_rgba(30,136,229,0.1)]" : "hover:border-blue-electric"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-bold text-blue-deep">{s.label}</p>
                        <p className="text-sm text-[var(--text-secondary)] mt-1">{s.description}</p>
                      </div>
                      {on ? <CheckCircle2 className="text-blue-electric" size={18} /> : null}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-5 flex items-center justify-between gap-3 flex-wrap">
              <p className="text-sm text-[var(--text-secondary)]">
                Selected: <span className="font-semibold">{selected.length}</span>
              </p>
              <Button className="rounded-full bg-[#0073d1] hover:bg-[#003869]" onClick={() => run()} disabled={running || !policy}>
                {running ? "Running critique..." : "Run critique"}
              </Button>
            </div>
            {running ? (
              <p className="mt-3 text-sm text-[var(--text-secondary)]">{critiqueStatus}</p>
            ) : null}
          </Card>

          <Card className="rounded-[2rem] bg-[linear-gradient(180deg,#00223f_0%,#135a6e_100%)] p-6 text-white shadow-sm">
            <div className="grid gap-4">
              {[
                { icon: <ShieldCheck size={18} />, title: "Executive verdict", text: "Get a top-line judgment on how ready the policy is." },
                { icon: <Wand2 size={18} />, title: "Priority actions", text: "See the changes most likely to improve the score." },
                { icon: <FilePenLine size={18} />, title: "Next draft path", text: "Generate an improved version or upload a revised file and compare." },
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
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="premium-card p-6 lg:col-span-2">
              <h2 className="text-lg font-bold text-blue-deep mb-2">Results</h2>
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <Badge variant="outline">Overall score</Badge>
                <span className="text-2xl font-bold">{result.overallScore}/100</span>
                {overallTone === "bad" && (
                  <span className="text-sm text-red-600 font-semibold flex items-center gap-1">
                    <AlertTriangle size={16} /> Needs improvement
                  </span>
                )}
                {overallTone === "mid" && <span className="text-sm text-amber-700 font-semibold">Moderate</span>}
                {overallTone === "good" && <span className="text-sm text-green-700 font-semibold">Strong</span>}
              </div>

              {typeof previousScore === "number" && (
                <p className="text-sm text-[var(--text-secondary)] mb-4">
                  {result.overallScore > previousScore
                    ? `Improvement acknowledged: +${result.overallScore - previousScore} points compared to the previous critique.`
                    : result.overallScore < previousScore
                    ? `Score dropped by ${previousScore - result.overallScore} points compared to the previous critique.`
                    : "Score unchanged compared to the previous critique."}
                </p>
              )}

              <p className="text-sm text-[var(--text-secondary)] mb-5">{result.summary}</p>

              {result.executiveVerdict ? (
                <div className="mb-5 rounded-2xl border bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-secondary)]">Executive verdict</p>
                  <p className="mt-2 text-sm text-blue-deep">{result.executiveVerdict}</p>
                </div>
              ) : null}

              {(result.confidenceLevel || result.decisionRecommendation) ? (
                <div className="mb-5 grid gap-3 md:grid-cols-2">
                  {result.confidenceLevel ? (
                    <div className="rounded-2xl border bg-slate-50 p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-secondary)]">Confidence</p>
                      <p className="mt-2 text-lg font-bold capitalize text-blue-deep">{result.confidenceLevel}</p>
                    </div>
                  ) : null}
                  {result.decisionRecommendation ? (
                    <div className="rounded-2xl border bg-slate-50 p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-secondary)]">Recommendation</p>
                      <p className="mt-2 text-sm font-semibold capitalize text-blue-deep">{result.decisionRecommendation.status?.replace(/_/g, " ")}</p>
                      <p className="mt-1 text-sm text-[var(--text-secondary)]">{result.decisionRecommendation.rationale}</p>
                    </div>
                  ) : null}
                </div>
              ) : null}

              {result.implementationOutlook ? (
                <div className="mb-5 grid gap-3 md:grid-cols-3">
                  <div className="rounded-2xl border bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-secondary)]">Readiness</p>
                    <p className="mt-2 text-lg font-bold text-blue-deep capitalize">{result.implementationOutlook.readiness}</p>
                  </div>
                  <div className="rounded-2xl border bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-secondary)]">Institutional capacity</p>
                    <p className="mt-2 text-sm text-blue-deep">{result.implementationOutlook.institutionalCapacity}</p>
                  </div>
                  <div className="rounded-2xl border bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-secondary)]">Funding confidence</p>
                    <p className="mt-2 text-sm text-blue-deep">{result.implementationOutlook.fundingConfidence}</p>
                  </div>
                </div>
              ) : null}

              {result.maturityProfile ? (
                <div className="mb-5 grid gap-3 md:grid-cols-4">
                  {[
                    ["Policy clarity", result.maturityProfile.policyClarity],
                    ["Delivery design", result.maturityProfile.deliveryDesign],
                    ["Finance design", result.maturityProfile.financeDesign],
                    ["Accountability", result.maturityProfile.accountability],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-2xl border bg-slate-50 p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-secondary)]">{label}</p>
                      <p className="mt-2 text-lg font-bold capitalize text-blue-deep">{String(value || "-")}</p>
                    </div>
                  ))}
                </div>
              ) : null}

              {Array.isArray(result.priorityActions) && result.priorityActions.length > 0 ? (
                <div className="mb-5 rounded-2xl border bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-secondary)]">Priority actions</p>
                  <ul className="mt-3 ml-5 list-disc space-y-1 text-sm text-[var(--text-secondary)]">
                    {result.priorityActions.map((action: string, index: number) => (
                      <li key={index}>{action}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {(Array.isArray(result.evidenceGaps) && result.evidenceGaps.length > 0) || (Array.isArray(result.stakeholderImpacts) && result.stakeholderImpacts.length > 0) ? (
                <div className="mb-5 grid gap-3 md:grid-cols-2">
                  {Array.isArray(result.evidenceGaps) && result.evidenceGaps.length > 0 ? (
                    <div className="rounded-2xl border bg-slate-50 p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-secondary)]">Evidence gaps</p>
                      <ul className="mt-3 ml-5 list-disc space-y-1 text-sm text-[var(--text-secondary)]">
                        {result.evidenceGaps.map((gap: string, index: number) => (
                          <li key={index}>{gap}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  {Array.isArray(result.stakeholderImpacts) && result.stakeholderImpacts.length > 0 ? (
                    <div className="rounded-2xl border bg-slate-50 p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-secondary)]">Stakeholder impacts</p>
                      <div className="mt-3 space-y-3 text-sm">
                        {result.stakeholderImpacts.map((entry: any, index: number) => (
                          <div key={index} className="rounded-xl border bg-white p-3">
                            <p className="font-semibold text-blue-deep">{entry.group}</p>
                            <p className="mt-1 text-[var(--text-secondary)]">{entry.impact}</p>
                            <p className="mt-1 text-[var(--text-secondary)]">Watch-out: {entry.concern}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}

              {Array.isArray(result.evidence) && result.evidence.length > 0 ? (
                <div className="mb-5 rounded-2xl border bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-secondary)]">Reference evidence</p>
                  <div className="mt-3 space-y-3">
                    {result.evidence.map((entry: any, index: number) => (
                      <button
                        key={`${entry.url}-${index}`}
                        type="button"
                        onClick={() => window.open(entry.url, "_blank")}
                        className="w-full rounded-xl border bg-white p-3 text-left transition hover:bg-blue-soft"
                      >
                        <p className="font-semibold text-blue-deep">{entry.title}</p>
                        <p className="mt-1 text-sm text-[var(--text-secondary)]">{entry.whyRelevant || entry.url}</p>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="space-y-3">
                {result.perStandard.map((r: any) => (
                  <div key={r.standardId} className="rounded-xl border p-4">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-bold text-blue-deep">
                        {CRITIQUE_STANDARDS.find((x) => x.id === r.standardId)?.label}
                      </p>
                      <p className="font-bold">{r.score}/100</p>
                    </div>
                    {r.verdict ? <p className="mt-2 text-sm text-blue-deep">{r.verdict}</p> : null}
                    <ul className="mt-2 ml-5 list-disc space-y-1 text-sm text-[var(--text-secondary)]">
                      {(r.suggestions ?? []).map((s: string, i: number) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="premium-card p-6">
              <h2 className="text-lg font-bold text-blue-deep mb-2">Next steps</h2>
              <p className="text-sm text-[var(--text-secondary)] mb-4">
                Create a stronger version with AI or upload a revised file and compare results.
              </p>

              <div className="space-y-2">
                <Button className="w-full rounded-full bg-[#0073d1] hover:bg-[#003869]" onClick={generateImproved} disabled={generating}>
                  {generating ? "Generating..." : "AI generate improved policy"}
                </Button>
                {generating ? (
                  <p className="text-sm text-[var(--text-secondary)]">{improvedPolicyStatus}</p>
                ) : null}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleRevisedFile(f);
                    e.currentTarget.value = "";
                  }}
                />

                {isOwner ? (
                  <Button variant="outline" className="w-full gap-2 rounded-full" onClick={triggerRevisedUpload} disabled={revising}>
                    <RefreshCw size={16} />
                    {revising ? `Uploading... ${revProgress}%` : "Upload revised version"}
                  </Button>
                ) : (
                  <div className="rounded-xl border p-3 text-xs text-[var(--text-secondary)]">
                    Revised uploads are only available for private workspace policies you own.
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
