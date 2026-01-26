import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  serverTimestamp,
  setDoc,
  increment,
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
  perStandard: { standardId: CritiqueStandardId; score: number; suggestions: string[] }[];
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
  const policyCritRef = doc(db, "policies", params.policyId, "critiques", critiqueId);

  // 2) Save global critiques collection
  const globalCritRef = doc(db, "critiques", critiqueId);

  // 3) Update user index doc (one-per-policy)
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

  return critiqueId;
}
