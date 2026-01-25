import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  orderBy,
  query,
  where,
  limit,
  QueryConstraint,
} from "firebase/firestore";
import type { Policy, PolicyType } from "@/lib/policyTypes";
import { NIGERIA_COUNTRY } from "@/lib/ngStates";

export async function fetchPolicies(opts?: {
  state?: string;
  type?: PolicyType | "all";
  search?: string; // simple client-side filtering for now
}) {
  const constraints: QueryConstraint[] = [
    where("country", "==", NIGERIA_COUNTRY),
    orderBy("updatedAt", "desc"),
    limit(50),
  ];

  if (opts?.state && opts.state !== "all") {
    constraints.push(where("state", "==", opts.state));
  }

  if (opts?.type && opts.type !== "all") {
    constraints.push(where("type", "==", opts.type));
  }

  const q = query(collection(db, "policies"), ...constraints);
  const snap = await getDocs(q);

  let items: Policy[] = snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as any),
  }));

  // Search (client-side MVP)
  const s = (opts?.search ?? "").trim().toLowerCase();
  if (s) {
    items = items.filter((p) => {
      const title = (p.title ?? "").toLowerCase();
      const summary = (p.summary ?? "").toLowerCase();
      const tags = (p.tags ?? []).join(" ").toLowerCase();
      return title.includes(s) || summary.includes(s) || tags.includes(s);
    });
  }

  return items;
}
