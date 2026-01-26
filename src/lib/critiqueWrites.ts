// src/lib/critiqueWrites.ts
import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  serverTimestamp,
  setDoc,
  increment,
  runTransaction,
} from "firebase/firestore";
import type { CritiqueStandardId } from "@/lib/critiqueStandards";

/**
 * Saves critique in 3 places + maintains policyStats/{policyId} aggregate doc.
 * - policies/{policyId}/critiques/{critiqueId}
 * - critiques/{critiqueId}
 * - users/{uid}/critiques/{policyId}   (one-per-policy index)
 * - policyStats/{policyId}            (leaderboard/Rankings)
 *
 * policyStats is updated via transaction so concurrent critiques don't corrupt aggregates.
 */

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
  strengths: string[];
  risks: string[];

  previousOverallScore?: number | null;
}) {
  // ✅ generate one critiqueId used everywhere
  const critiqueId = doc(collection(db, "critiques")).id;
  const now = serverTimestamp();

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
    strengths: params.strengths,
    risks: params.risks,

    previousOverallScore: params.previousOverallScore ?? null,
    scoreDelta:
      typeof params.previousOverallScore === "number"
        ? params.overallScore - params.previousOverallScore
        : null,

    createdAt: now,
  };

  // 1) Save under policy subcollection
  const policyCritRef = doc(
    db,
    "policies",
    params.policyId,
    "critiques",
    critiqueId
  );

  // 2) Save global critiques collection
  const globalCritRef = doc(db, "critiques", critiqueId);

  // 3) Update user index doc (one-per-policy)
  const userIndexRef = doc(
    db,
    "users",
    params.userId,
    "critiques",
    params.policyId
  );

  // 4) Rankings fast doc
  const statsRef = doc(db, "policyStats", params.policyId);

  // Policy doc reference to pull metadata (authoritative)
  const policyRef = doc(db, "policies", params.policyId);

  // ✅ Save the critique payload and user index in parallel
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

  // ✅ Maintain policyStats in a transaction (safe under concurrent critiques)
  await runTransaction(db, async (tx) => {
    const [policySnap, statsSnap] = await Promise.all([
      tx.get(policyRef),
      tx.get(statsRef),
    ]);

    const policyData = policySnap.exists() ? (policySnap.data() as any) : {};
    const existing = statsSnap.exists() ? (statsSnap.data() as any) : {};

    const prevLatest =
      typeof existing.latestOverallScore === "number"
        ? existing.latestOverallScore
        : null;

    const prevCount =
      typeof existing.critiquesCount === "number" ? existing.critiquesCount : 0;

    const prevSum =
      typeof existing.sumOverallScore === "number" ? existing.sumOverallScore : 0;

    const nextCount = prevCount + 1;
    const nextSum = prevSum + Number(params.overallScore || 0);

    // NOTE: avgOverallScore is stored for convenience, but you can also compute
    // avg client-side from sumOverallScore/critiquesCount to avoid rounding.
    const nextAvgRaw = nextCount > 0 ? nextSum / nextCount : null;
    const nextAvgRounded =
      typeof nextAvgRaw === "number"
        ? Math.round(nextAvgRaw * 10) / 10
        : null;

    const trendDelta =
      typeof prevLatest === "number" ? params.overallScore - prevLatest : null;

    tx.set(
      statsRef,
      {
        // identity / routing (use consistent keys)
        policyId: params.policyId,
        title: policyData.title ?? params.policyTitle ?? null,
    policyTitle: policyData.title ?? params.policyTitle ?? null,

    slug: policyData.slug ?? params.policySlug ?? null,
    policySlug: policyData.slug ?? params.policySlug ?? null,

        // metadata for filtering
        country: policyData.country ?? null,
        jurisdictionLevel:
          policyData.jurisdictionLevel ?? params.jurisdictionLevel ?? null,
        state: policyData.state ?? params.state ?? null,
        policyYear:
          typeof policyData.policyYear === "number"
            ? policyData.policyYear
            : params.policyYear ?? null,
        policyType: policyData.type ?? params.policyType ?? null,
        sector: policyData.sector ?? null,

        // aggregates
        critiquesCount: nextCount,
        sumOverallScore: nextSum,
        avgOverallScore: nextAvgRounded,

        // latest/trend
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

/**
 * ✅ CLIENT-SIDE AVERAGE (use this in Rankings page)
 * This avoids depending on avgOverallScore and prevents rounding drift.
 */
export function computeAvgOverallScore(stat: {
  sumOverallScore?: number | null;
  critiquesCount?: number | null;
}) {
  const sum = typeof stat.sumOverallScore === "number" ? stat.sumOverallScore : 0;
  const count =
    typeof stat.critiquesCount === "number" ? stat.critiquesCount : 0;
  if (!count) return null;
  return Math.round((sum / count) * 10) / 10; // 1dp
}
