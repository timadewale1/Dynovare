import "./env";
import { adminDb } from "@/lib/firebaseAdmin";

(async () => {
  const db = adminDb;

  const statsSnap = await db.collection("policyStats").get();
  console.log(`Found ${statsSnap.size} policyStats docs`);

  let updated = 0;

  for (const s of statsSnap.docs) {
    const stats = s.data() as any;
    const policyId = s.id;

    const policySnap = await db.collection("policies").doc(policyId).get();
    if (!policySnap.exists) {
      console.log(`⚠️ Missing policy doc for stats: ${policyId}`);
      continue;
    }

    const p = policySnap.data() as any;

    const patch = {
      policyId,
      policyTitle: p.title ?? "Untitled",
      policySlug: p.slug ?? null,
      policyType: p.type ?? null,
      country: p.country ?? null,
      jurisdictionLevel: p.jurisdictionLevel ?? null,
      state: p.state ?? null,
      sector: p.sector ?? null,
      policyYear: p.policyYear ?? null,
      updatedAt: new Date(),
    };

    await db.collection("policyStats").doc(policyId).set(patch, { merge: true });
    updated++;
  }

  console.log(`✅ Done. Updated ${updated} policyStats docs.`);
})();
