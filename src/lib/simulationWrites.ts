import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  serverTimestamp,
  setDoc,
  increment,
} from "firebase/firestore";

export async function saveSimulation(params: {
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

  inputs: any;
  outputs: any;
  evidence?: { title?: string; url?: string; whyRelevant?: string }[];
  policyScope?: "workspace" | "public";
  ownerUid?: string | null;
}) {
  const simulationId = doc(collection(db, "simulations")).id;
  const now = serverTimestamp();
  const policyScope = params.policyScope ?? "workspace";
  const ownerUid = params.ownerUid ?? params.userId;

  const payload: any = {
    simulationId,
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

    inputs: params.inputs,
    outputs: params.outputs,
    evidence: params.evidence ?? [],
    createdAt: now,
  };

  const policySimRef =
    policyScope === "public"
      ? doc(db, "policies", params.policyId, "simulations", simulationId)
      : doc(db, "users", ownerUid, "policies", params.policyId, "simulations", simulationId);
  const globalSimRef = doc(db, "simulations", simulationId);
  const userIndexRef = doc(db, "users", params.userId, "simulations", params.policyId);

  await Promise.all([
    setDoc(policySimRef, payload),
    setDoc(globalSimRef, payload),
    setDoc(
      userIndexRef,
      {
        policyId: params.policyId,
        policyTitle: params.policyTitle,
        policySlug: params.policySlug ?? null,
        lastSimulationId: simulationId,
        lastUpdatedAt: now,
        simulationsCount: increment(1),
      },
      { merge: true }
    ),
  ]);

  return simulationId;
}
