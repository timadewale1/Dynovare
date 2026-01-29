import "server-only";
import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

export const runtime = "nodejs";

function safeString(v: any) {
  return typeof v === "string" ? v : "";
}

function serializeTs(ts: any) {
  // Firestore Timestamp -> number (ms) or null
  try {
    if (!ts) return null;
    if (typeof ts.toMillis === "function") return ts.toMillis();
    if (typeof ts.seconds === "number") return ts.seconds * 1000;
    if (typeof ts._seconds === "number") return ts._seconds * 1000;
    return null;
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const jurisdictionLevel = safeString(searchParams.get("jurisdictionLevel") ?? "all");
    const state = safeString(searchParams.get("state") ?? "all");
    const type = safeString(searchParams.get("type") ?? "all");
    const sector = safeString(searchParams.get("sector") ?? "all");
    const policyYearRaw = safeString(searchParams.get("policyYear") ?? "all");
    const search = safeString(searchParams.get("search") ?? "").trim().toLowerCase();

    // NOTE: Keep this simple + safe.
    // We'll fetch a limited list and filter in memory to avoid complex composite indexes.
    const snap = await adminDb
      .collection("policies")
      .orderBy("updatedAt", "desc")
      .limit(200)
      .get();

    const items = snap.docs.map((d) => {
      const p = d.data() as any;
      return {
        id: d.id,
        title: p?.title ?? "Untitled policy",
        slug: p?.slug ?? null,
        summary: p?.summary ?? "",
        country: p?.country ?? "Nigeria",
        jurisdictionLevel: p?.jurisdictionLevel ?? "federal",
        state: p?.state ?? null,
        policyYear: typeof p?.policyYear === "number" ? p.policyYear : null,
        type: p?.type ?? "uploaded",
        sector: p?.sector ?? null,
        tags: Array.isArray(p?.tags) ? p.tags : [],
        publicPdfUrl: p?.publicPdfUrl ?? null, // if you store one
        storagePath: p?.storagePath ?? null,   // used to download if present
        source: p?.source ?? null,
        updatedAt: serializeTs(p?.updatedAt),
        createdAt: serializeTs(p?.createdAt),
      };
    });

    const policyYear =
      policyYearRaw !== "all" && policyYearRaw ? Number(policyYearRaw) : "all";

    const filtered = items.filter((p) => {
      if (jurisdictionLevel !== "all" && p.jurisdictionLevel !== jurisdictionLevel) return false;

      if (jurisdictionLevel === "state" && state !== "all") {
        if ((p.state ?? "") !== state) return false;
      }

      if (type !== "all" && p.type !== type) return false;
      if (sector !== "all" && (p.sector ?? "") !== sector) return false;

      if (policyYear !== "all") {
        if (p.policyYear !== policyYear) return false;
      }

      if (search) {
        const hay = `${p.title} ${p.summary} ${(p.tags ?? []).join(" ")}`.toLowerCase();
        if (!hay.includes(search)) return false;
      }

      return true;
    });

    return NextResponse.json({ items: filtered });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json(
      { error: e?.message ?? "Failed to load public policies" },
      { status: 500 }
    );
  }
}
