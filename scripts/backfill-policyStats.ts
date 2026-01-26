import "./env";


import admin from "firebase-admin";
import { adminDb } from "@/lib/firebaseAdmin";

/**
 * Rebuilds policyStats/{policyId} from global critiques collection.
 * - critiquesCount
 * - averageScore (and sumScore)
 * - latestOverallScore
 * - latestCritiquedAt
 * - trendDelta (latest - previous)
 * - policy metadata snapshot (title, slug, type, jurisdiction, state, year, country, sector)
 */

type CritDoc = {
  policyId: string;
  overallScore: number;
  createdAt?: any; // Firestore Timestamp
};

type Agg = {
  policyId: string;
  count: number;
  sum: number;
  // latest + previous
  latestScore: number | null;
  latestAt: any | null;
  prevScore: number | null;
  prevAt: any | null;
};

function tsToMillis(t: any): number {
  if (!t) return 0;
  // Firestore Timestamp
  if (typeof t.toMillis === "function") return t.toMillis();
  // Date
  if (t instanceof Date) return t.getTime();
  // number
  if (typeof t === "number") return t;
  return 0;
}

function chunk<T>(arr: T[], size: number) {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function main() {
  const db = adminDb;

  console.log("🔎 Loading critiques… (this may take a while if you have many)");

  // If your dataset is small, a single get() is fine.
  // If it grows, switch to pagination by createdAt.
  const critSnap = await db.collection("critiques").get();

  console.log(`✅ Found ${critSnap.size} critiques`);

  const aggMap = new Map<string, Agg>();

  for (const d of critSnap.docs) {
    const c = d.data() as CritDoc;

    if (!c?.policyId) continue;
    if (typeof c.overallScore !== "number") continue;

    const policyId = c.policyId;
    const createdAt = c.createdAt ?? null;
    const createdMs = tsToMillis(createdAt);

    let a = aggMap.get(policyId);
    if (!a) {
      a = {
        policyId,
        count: 0,
        sum: 0,
        latestScore: null,
        latestAt: null,
        prevScore: null,
        prevAt: null,
      };
      aggMap.set(policyId, a);
    }

    a.count += 1;
    a.sum += c.overallScore;

    // Update latest/previous based on createdAt
    const latestMs = tsToMillis(a.latestAt);

    if (!a.latestAt || createdMs >= latestMs) {
      // shift latest -> prev
      if (a.latestAt) {
        a.prevAt = a.latestAt;
        a.prevScore = a.latestScore;
      }
      a.latestAt = createdAt;
      a.latestScore = c.overallScore;
    } else {
      // maybe this critique is the "previous" one (second-most-recent)
      const prevMs = tsToMillis(a.prevAt);
      if (!a.prevAt || createdMs >= prevMs) {
        a.prevAt = createdAt;
        a.prevScore = c.overallScore;
      }
    }
  }

  const policyIds = Array.from(aggMap.keys());
  console.log(`📌 Aggregating ${policyIds.length} policies`);

  // Fetch policy metadata in chunks
  const policyMeta = new Map<string, any>();
  const policyRef = db.collection("policies");

  for (const ids of chunk(policyIds, 400)) {
    const refs = ids.map((id) => policyRef.doc(id));
    const snaps = await db.getAll(...refs);

    for (const s of snaps) {
      if (!s.exists) continue;
      policyMeta.set(s.id, s.data());
    }
  }

  // Write policyStats in batches (500 limit)
  let written = 0;
  const now = admin.firestore.FieldValue.serverTimestamp();

  const idsChunks = chunk(policyIds, 400); // keep it comfortably under 500 writes per batch

  for (const ids of idsChunks) {
    const batch = db.batch();

    for (const policyId of ids) {
      const a = aggMap.get(policyId)!;

      const avg =
        a.count > 0 ? Math.round((a.sum / a.count) * 10) / 10 : 0;

      const trendDelta =
        typeof a.latestScore === "number" && typeof a.prevScore === "number"
          ? a.latestScore - a.prevScore
          : null;

      const p = policyMeta.get(policyId) ?? {};

      const payload = {
        policyId,

        // aggregates
        critiquesCount: a.count,
        sumScore: a.sum,
        averageScore: avg,

        latestOverallScore: a.latestScore ?? null,
        latestCritiquedAt: a.latestAt ?? null,
        previousOverallScore: a.prevScore ?? null,
        trendDelta,

        // snapshot meta (helps rankings page)
        policyTitle: p.title ?? null,
        policySlug: p.slug ?? null,
        policyType: p.type ?? null,
        country: p.country ?? null,
        jurisdictionLevel: p.jurisdictionLevel ?? null,
        state: p.state ?? null,
        policyYear: p.policyYear ?? null,
        sector: p.sector ?? null,

        updatedAt: now,
      };

      const statRef = db.collection("policyStats").doc(policyId);
      batch.set(statRef, payload, { merge: true });
      written++;
    }

    await batch.commit();
    console.log(`✅ Wrote ${written}/${policyIds.length} policyStats…`);
  }

  console.log(`🎉 Done. policyStats updated for ${policyIds.length} policies.`);
}

main().catch((e) => {
  console.error("❌ Backfill failed:", e);
  process.exit(1);
});
