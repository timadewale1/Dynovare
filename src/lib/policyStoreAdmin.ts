import "server-only";
import { adminDb } from "@/lib/firebaseAdmin";

export async function resolvePolicyForAction(args: {
  ownerUid?: string | null;
  policyId: string;
}) {
  if (args.ownerUid) {
    const workspaceSnap = await adminDb
      .collection("users")
      .doc(args.ownerUid)
      .collection("policies")
      .doc(args.policyId)
      .get();

    if (workspaceSnap.exists) {
      return {
        policy: workspaceSnap.data() as any,
        scope: "workspace" as const,
        ownerUid: args.ownerUid,
      };
    }
  }

  const publicSnap = await adminDb.collection("policies").doc(args.policyId).get();
  if (publicSnap.exists) {
    return {
      policy: publicSnap.data() as any,
      scope: "public" as const,
      ownerUid: null,
    };
  }

  return null;
}
