import "server-only";
import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

export const runtime = "nodejs";

function toMillis(v: any): number | null {
  if (!v) return null;
  if (typeof v === "number") return v;
  if (typeof v?.toMillis === "function") return v.toMillis();
  if (typeof v?.seconds === "number") return v.seconds * 1000;
  if (typeof v?._seconds === "number") return v._seconds * 1000;
  return null;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const raw = String(searchParams.get("slugOrId") ?? "");
    const slugOrId = decodeURIComponent(raw).trim();

    if (!slugOrId) {
      return NextResponse.json({ error: "Missing slugOrId" }, { status: 400 });
    }

    // 1) Try by slug
    const bySlug = await adminDb
      .collection("policies")
      .where("slug", "==", slugOrId)
      .limit(1)
      .get();

    let doc: FirebaseFirestore.QueryDocumentSnapshot | null = null;

    if (!bySlug.empty) {
      doc = bySlug.docs[0];
    } else {
      // 2) Fallback by docId
      const byId = await adminDb.collection("policies").doc(slugOrId).get();
      if (byId.exists) doc = byId as any;
    }

    if (!doc) return NextResponse.json({ policy: null });

    const p = doc.data() as any;

    const policy = {
      id: doc.id,
      title: p?.title ?? "Untitled",
      slug: p?.slug ?? null,
      summary: p?.summary ?? null,
      contentText: p?.contentText ?? null,
      country: p?.country ?? "Nigeria",
      jurisdictionLevel: p?.jurisdictionLevel ?? null,
      state: p?.state ?? null,
      policyYear: p?.policyYear ?? null,
      type: p?.type ?? null,
      sector: p?.sector ?? null,
      tags: Array.isArray(p?.tags) ? p.tags : [],
      publicPdfUrl: p?.publicPdfUrl ?? null,
      storagePath: p?.storagePath ?? null,
      source: p?.source ?? null,
      updatedAtMs: toMillis(p?.updatedAt),
      createdAtMs: toMillis(p?.createdAt),
    };

    return NextResponse.json({ policy });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json(
      { error: e?.message ?? "Failed to load public policy" },
      { status: 500 }
    );
  }
}
