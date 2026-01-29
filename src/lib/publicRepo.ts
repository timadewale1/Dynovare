// src/lib/publicRepo.ts
import "server-only";
import { adminDb } from "@/lib/firebaseAdmin";

function toMillis(ts: any): number | null {
  // Firestore Timestamp has toMillis()
  if (ts && typeof ts.toMillis === "function") return ts.toMillis();

  // Some objects come as { _seconds, _nanoseconds }
  if (ts && typeof ts._seconds === "number") {
    return ts._seconds * 1000 + Math.floor((ts._nanoseconds ?? 0) / 1_000_000);
  }

  // If it's already a number
  if (typeof ts === "number") return ts;

  // If it's a string date
  if (typeof ts === "string") {
    const d = new Date(ts);
    return isNaN(d.getTime()) ? null : d.getTime();
  }

  return null;
}

export type PublicPolicyListItem = {
  id: string;
  title: string;
  slug?: string | null;
  summary?: string | null;

  country?: string | null;
  jurisdictionLevel?: "federal" | "state" | null;
  state?: string | null;
  policyYear?: number | null;

  type?: string | null;
  sector?: string | null;
  tags?: string[] | null;

  publicPdfUrl?: string | null;
  sourceUrl?: string | null;

  // ✅ serialized timestamps (plain numbers)
  updatedAtMs?: number | null;
  createdAtMs?: number | null;
};

export async function fetchPublicPoliciesAdmin(): Promise<PublicPolicyListItem[]> {
  const snap = await adminDb
    .collection("policies")
    .orderBy("updatedAt", "desc")
    .limit(200)
    .get();

  return snap.docs.map((d) => {
    const p = d.data() as any;

    return {
      id: d.id,
      title: p.title ?? "Untitled",
      slug: p.slug ?? null,
      summary: p.summary ?? null,

      country: p.country ?? null,
      jurisdictionLevel: p.jurisdictionLevel ?? null,
      state: p.state ?? null,
      policyYear: typeof p.policyYear === "number" ? p.policyYear : null,

      type: p.type ?? null,
      sector: p.sector ?? null,
      tags: Array.isArray(p.tags) ? p.tags : null,

      publicPdfUrl: p.publicPdfUrl ?? p.pdfUrl ?? null,
      sourceUrl: p?.source?.url ?? null,

      // ✅ fix
      updatedAtMs: toMillis(p.updatedAt),
      createdAtMs: toMillis(p.createdAt),
    };
  });
}

export async function fetchPublicPolicyBySlugAdmin(slug: string) {
  const q = await adminDb
    .collection("policies")
    .where("slug", "==", slug)
    .limit(1)
    .get();

  if (q.empty) return null;

  const doc = q.docs[0];
  const p = doc.data() as any;

  // Keep this server-side usage safe too
  return {
    id: doc.id,
    ...p,
    updatedAtMs: toMillis(p.updatedAt),
    createdAtMs: toMillis(p.createdAt),
  };
}

export async function fetchPublicCritiquesAdmin(policyId: string, limitN = 20) {
  const snap = await adminDb
    .collection("policies")
    .doc(policyId)
    .collection("critiques")
    .orderBy("createdAt", "desc")
    .limit(limitN)
    .get();

  return snap.docs.map((d) => {
    const x = d.data() as any;
    return {
      id: d.id,
      ...x,
      createdAtMs: toMillis(x.createdAt),
    };
  });
}

export async function fetchPublicSimulationsAdmin(policyId: string, limitN = 20) {
  const snap = await adminDb
    .collection("policies")
    .doc(policyId)
    .collection("simulations")
    .orderBy("createdAt", "desc")
    .limit(limitN)
    .get();

  return snap.docs.map((d) => {
    const x = d.data() as any;
    return {
      id: d.id,
      ...x,
      createdAtMs: toMillis(x.createdAt),
    };
  });
}
