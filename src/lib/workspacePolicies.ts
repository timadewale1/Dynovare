import { db } from "@/lib/firebase";
import type { Policy, PolicyType } from "@/lib/policyTypes";
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

export async function fetchWorkspacePolicies(
  uid: string,
  params: {
    type?: PolicyType | "all";
    jurisdictionLevel?: "all" | "federal" | "state";
    state?: string;
    sector?: string;
    energySource?: string;
    domain?: string;
    policyYear?: number | "all";
    search?: string;
  } = {}
) {
  const {
    type = "all",
    jurisdictionLevel = "all",
    state = "all",
    sector = "all",
    energySource = "all",
    domain = "all",
    policyYear = "all",
    search = "",
  } = params;

  const colRef = collection(db, "users", uid, "policies");
  const filters: any[] = [];

  if (type !== "all") filters.push(where("type", "==", type));
  if (jurisdictionLevel !== "all") {
    filters.push(where("jurisdictionLevel", "==", jurisdictionLevel));
  }
  if (state !== "all" && jurisdictionLevel !== "federal") {
    filters.push(where("state", "==", state));
  }
  if (sector !== "all") filters.push(where("sector", "==", sector));
  if (energySource !== "all") filters.push(where("energySource", "==", energySource));
  if (domain !== "all") filters.push(where("domain", "==", domain));
  if (policyYear !== "all") filters.push(where("policyYear", "==", policyYear));

  const snap = await getDocs(query(colRef, ...filters, orderBy("updatedAt", "desc"), limit(100)));

  let items = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) } as Policy));
  const q = search.trim().toLowerCase();
  if (q) {
    items = items.filter((p: any) => {
      const hay = [
        p.title,
        p.summary,
        p.country,
        p.state,
        p.jurisdictionLevel,
        p.type,
        p.sector,
        p.energySource,
        p.domain,
        ...(Array.isArray(p.tags) ? p.tags : []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }

  return items;
}

export async function resolveWorkspacePolicyBySlugOrId(uid: string, slugOrId: string) {
  const bySlug = await getDocs(
    query(collection(db, "users", uid, "policies"), where("slug", "==", slugOrId), limit(1))
  );
  if (!bySlug.empty) {
    const d = bySlug.docs[0];
    return { id: d.id, ...(d.data() as any) } as Policy;
  }

  const byId = await getDoc(doc(db, "users", uid, "policies", slugOrId));
  if (byId.exists()) {
    return { id: byId.id, ...(byId.data() as any) } as Policy;
  }

  return null;
}

export async function resolvePolicyForUser(uid: string, policyId: string) {
  const workspaceDoc = await getDoc(doc(db, "users", uid, "policies", policyId));
  if (workspaceDoc.exists()) {
    return {
      policy: { id: workspaceDoc.id, ...(workspaceDoc.data() as any) } as Policy,
      scope: "workspace" as const,
      ownerUid: uid,
    };
  }

  const publicDoc = await getDoc(doc(db, "policies", policyId));
  if (publicDoc.exists()) {
    return {
      policy: { id: publicDoc.id, ...(publicDoc.data() as any) } as Policy,
      scope: "public" as const,
      ownerUid: undefined,
    };
  }

  return null;
}
