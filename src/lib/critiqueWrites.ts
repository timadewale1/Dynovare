import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  increment,
  runTransaction,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import type { CritiqueStandardId } from "@/lib/critiqueStandards";

export async function saveCritique(params: {
  policyId: string;
  policyTitle: string;
  policySlug?: string;
  policyType?: string;
  jurisdictionLevel?: string;
  state?: string;
  policyYear?: number | null;
  userId: string;
  userName?: string;
  userEmail?: string | null;
  revisionNumber?: number;
  selectedStandards: CritiqueStandardId[];
  overallScore: number;
  perStandard: {
    standardId: CritiqueStandardId;
    score: number;
    suggestions: string[];
  }[];
  summary: string;
  executiveVerdict?: string;
  confidenceLevel?: "low" | "moderate" | "high";
  maturityProfile?: {
    policyClarity?: string;
    deliveryDesign?: string;
    financeDesign?: string;
    accountability?: string;
  } | null;
  decisionRecommendation?: {
    status?: string;
    rationale?: string;
  } | null;
  priorityActions?: string[];
  evidenceGaps?: string[];
  stakeholderImpacts?: { group?: string; impact?: string; concern?: string }[];
  evidence?: { title?: string; url?: string; whyRelevant?: string }[];
  implementationOutlook?: {
    readiness?: string;
    institutionalCapacity?: string;
    fundingConfidence?: string;
    monitoringConfidence?: string;
  } | null;
  strengths: string[];
  risks: string[];
  previousOverallScore?: number | null;
  policyScope?: "workspace" | "public";
  ownerUid?: string | null;
}) {
  const critiqueId = doc(collection(db, "critiques")).id;
  const now = serverTimestamp();
  const policyScope = params.policyScope ?? "workspace";
  const ownerUid = params.ownerUid ?? params.userId;

  const payload: any = {
    critiqueId,
    policyId: params.policyId,
    policyTitle: params.policyTitle,
    policySlug: params.policySlug ?? null,
    policyType: params.policyType ?? null,
    jurisdictionLevel: params.jurisdictionLevel ?? null,
    state: params.state ?? null,
    policyYear: params.policyYear ?? null,
    userId: params.userId,
    userName: params.userName ?? null,
    userEmail: params.userEmail ?? null,
    revisionNumber: params.revisionNumber ?? 0,
    selectedStandards: params.selectedStandards,
    overallScore: params.overallScore,
    perStandard: params.perStandard,
    summary: params.summary,
    executiveVerdict: params.executiveVerdict ?? null,
    confidenceLevel: params.confidenceLevel ?? null,
    maturityProfile: params.maturityProfile ?? null,
    decisionRecommendation: params.decisionRecommendation ?? null,
    priorityActions: params.priorityActions ?? [],
    evidenceGaps: params.evidenceGaps ?? [],
    stakeholderImpacts: params.stakeholderImpacts ?? [],
    evidence: params.evidence ?? [],
    implementationOutlook: params.implementationOutlook ?? null,
    strengths: params.strengths,
    risks: params.risks,
    previousOverallScore: params.previousOverallScore ?? null,
    scoreDelta:
      typeof params.previousOverallScore === "number"
        ? params.overallScore - params.previousOverallScore
        : null,
    createdAt: now,
  };

  const policyCritRef =
    policyScope === "public"
      ? doc(db, "policies", params.policyId, "critiques", critiqueId)
      : doc(db, "users", ownerUid, "policies", params.policyId, "critiques", critiqueId);

  const globalCritRef = doc(db, "critiques", critiqueId);
  const userIndexRef = doc(db, "users", params.userId, "critiques", params.policyId);

  await Promise.all([
    setDoc(policyCritRef, payload),
    setDoc(globalCritRef, payload),
    setDoc(
      userIndexRef,
      {
        policyId: params.policyId,
        policyTitle: params.policyTitle,
        policySlug: params.policySlug ?? null,
        lastCritiqueId: critiqueId,
        lastOverallScore: params.overallScore,
        lastUpdatedAt: now,
        critiquesCount: increment(1),
      },
      { merge: true }
    ),
  ]);

  if (policyScope !== "public") {
    return critiqueId;
  }

  const statsRef = doc(db, "policyStats", params.policyId);
  const policyRef = doc(db, "policies", params.policyId);

  await runTransaction(db, async (tx) => {
    const [policySnap, statsSnap] = await Promise.all([tx.get(policyRef), tx.get(statsRef)]);
    const policyData = policySnap.exists() ? (policySnap.data() as any) : {};
    const existing = statsSnap.exists() ? (statsSnap.data() as any) : {};

    const prevLatest =
      typeof existing.latestOverallScore === "number" ? existing.latestOverallScore : null;
    const prevCount =
      typeof existing.critiquesCount === "number" ? existing.critiquesCount : 0;
    const prevSum =
      typeof existing.sumOverallScore === "number" ? existing.sumOverallScore : 0;

    const nextCount = prevCount + 1;
    const nextSum = prevSum + Number(params.overallScore || 0);
    const nextAvgRaw = nextCount > 0 ? nextSum / nextCount : null;
    const nextAvgRounded =
      typeof nextAvgRaw === "number" ? Math.round(nextAvgRaw * 10) / 10 : null;
    const trendDelta =
      typeof prevLatest === "number" ? params.overallScore - prevLatest : null;

    tx.set(
      statsRef,
      {
        policyId: params.policyId,
        title: policyData.title ?? params.policyTitle ?? null,
        policyTitle: policyData.title ?? params.policyTitle ?? null,
        slug: policyData.slug ?? params.policySlug ?? null,
        policySlug: policyData.slug ?? params.policySlug ?? null,
        country: policyData.country ?? null,
        jurisdictionLevel: policyData.jurisdictionLevel ?? params.jurisdictionLevel ?? null,
        state: policyData.state ?? params.state ?? null,
        policyYear:
          typeof policyData.policyYear === "number"
            ? policyData.policyYear
            : params.policyYear ?? null,
        type: policyData.type ?? params.policyType ?? null,
        policyType: policyData.type ?? params.policyType ?? null,
        sector: policyData.sector ?? null,
        energySource: policyData.energySource ?? null,
        domain: policyData.domain ?? null,
        visibility: policyData.visibility ?? "public",
        critiquesCount: nextCount,
        sumOverallScore: nextSum,
        avgOverallScore: nextAvgRounded,
        latestOverallScore: params.overallScore,
        previousOverallScore: prevLatest,
        trendDelta,
        latestCritiqueId: critiqueId,
        latestCritiquedAt: now,
        updatedAt: now,
        createdAt: existing.createdAt ?? now,
      },
      { merge: true }
    );
  });

  return critiqueId;
}

export function computeAvgOverallScore(stat: {
  sumOverallScore?: number | null;
  critiquesCount?: number | null;
}) {
  const sum = typeof stat.sumOverallScore === "number" ? stat.sumOverallScore : 0;
  const count = typeof stat.critiquesCount === "number" ? stat.critiquesCount : 0;
  if (!count) return null;
  return Math.round((sum / count) * 10) / 10;
}
