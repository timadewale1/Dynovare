import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from "firebase/firestore";

export type RankingSort =
  | "latest_score"
  | "avg_score"
  | "most_critiqued"
  | "recent";

export async function fetchRankings(params: {
  jurisdictionLevel?: "all" | "federal" | "state";
  state?: string; // "all" or a state
  sector?: string; // "all" or sector
  policyYear?: "all" | number;
  type?: "all" | "uploaded" | "ai_generated" | "public_source";
  search?: string; // client-side filter
  sort?: RankingSort;
  take?: number;
}) {
  const take = params.take ?? 50;
  const sort = params.sort ?? "latest_score";

  const colRef = collection(db, "policyStats");

  const filters: any[] = [];

  // Nigeria-first: you can lock to Nigeria if you want:
  // filters.push(where("country", "==", "Nigeria"));

  if (params.jurisdictionLevel && params.jurisdictionLevel !== "all") {
    filters.push(where("jurisdictionLevel", "==", params.jurisdictionLevel));
  }

  if (params.state && params.state !== "all") {
    filters.push(where("state", "==", params.state));
  }

  if (params.sector && params.sector !== "all") {
    filters.push(where("sector", "==", params.sector));
  }

  if (params.type && params.type !== "all") {
    filters.push(where("type", "==", params.type));
  }

  if (params.policyYear && params.policyYear !== "all") {
    filters.push(where("policyYear", "==", params.policyYear));
  }

  // orderBy
  let qRef: any;

  if (sort === "avg_score") {
    qRef = query(colRef, ...filters, orderBy("avgOverallScore", "desc"), limit(take));
  } else if (sort === "most_critiqued") {
    qRef = query(colRef, ...filters, orderBy("critiquesCount", "desc"), limit(take));
  } else if (sort === "recent") {
    qRef = query(colRef, ...filters, orderBy("latestCritiquedAt", "desc"), limit(take));
  } else {
    // default: latest score
    qRef = query(colRef, ...filters, orderBy("latestOverallScore", "desc"), limit(take));
  }

  const snap = await getDocs(qRef);

  let items = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));

  // client-side search (Firestore can’t do contains)
  const s = (params.search ?? "").trim().toLowerCase();
  if (s) {
    items = items.filter((x) => {
      const title = String(x.title ?? "").toLowerCase();
      return title.includes(s);
    });
  }

  return items;
}
