import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import type { Policy, PolicyType } from "@/lib/policyTypes";

export async function fetchPolicies(params: {
  jurisdictionLevel?: "all" | "federal" | "state";
  state?: string; // "all" or a state string
  type?: PolicyType | "all";
  sector?: string; // "all" or sector string
  policyYear?: number | "all";
  search?: string;
}) {
  const {
    jurisdictionLevel = "all",
    state = "all",
    type = "all",
    sector = "all",
    policyYear = "all",
    search = "",
  } = params;

  const colRef = collection(db, "policies");
  const wheres: any[] = [];

  // ✅ Jurisdiction
  if (jurisdictionLevel !== "all") {
    wheres.push(where("jurisdictionLevel", "==", jurisdictionLevel));
  }

  // ✅ State (only meaningful if state policies)
  if (state !== "all" && jurisdictionLevel !== "federal") {
    wheres.push(where("state", "==", state));
  }

  // ✅ Type
  if (type !== "all") {
    wheres.push(where("type", "==", type));
  }

  // ✅ Sector
  if (sector !== "all") {
    wheres.push(where("sector", "==", sector));
  }

  // ✅ Year
  if (policyYear !== "all") {
    wheres.push(where("policyYear", "==", policyYear));
  }

  // Order by updatedAt when present (fallback createdAt)
  const q = query(
    colRef,
    ...wheres,
    orderBy("updatedAt", "desc"),
    limit(80)
  );

  const snap = await getDocs(q);

  let items: Policy[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));

  // ✅ Search is best done client-side to avoid complex Firestore text indexes
  const s = search.trim().toLowerCase();
  if (s) {
    items = items.filter((p: any) => {
      const hay = [
        p.title,
        p.summary,
        p.country,
        p.state,
        p.jurisdictionLevel,
        p.type,
        p.sector,
        ...(Array.isArray(p.tags) ? p.tags : []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return hay.includes(s);
    });
  }

  return items;
}
