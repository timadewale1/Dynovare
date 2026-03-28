import "server-only";
import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

function safeString(v: unknown) {
  return typeof v === "string" ? v : "";
}

type PolicyStat = {
  title?: string | null;
  slug?: string | null;
  country?: string | null;
  jurisdictionLevel?: string | null;
  state?: string | null;
  policyYear?: number | null;
  type?: string | null;
  sector?: string | null;
  energySource?: string | null;
  domain?: string | null;
  critiquesCount?: number | null;
  avgOverallScore?: number | null;
  latestOverallScore?: number | null;
  trendDelta?: number | null;
  visibility?: string | null;
};

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const jurisdiction = safeString(searchParams.get("jurisdiction") ?? "all");
    const state = safeString(searchParams.get("state") ?? "all");
    const energySource = safeString(searchParams.get("energySource") ?? "all");
    const domain = safeString(searchParams.get("domain") ?? "all");
    const search = safeString(searchParams.get("search") ?? "").trim().toLowerCase();
    const sortBy = safeString(searchParams.get("sortBy") ?? "avg");

    const snap = await adminDb.collection("policyStats").orderBy("updatedAt", "desc").limit(250).get();
    const items = snap.docs
      .map((d) => ({ id: d.id, ...(d.data() as PolicyStat) }))
      .filter((row) => (row.visibility ?? "public") === "public")
      .filter((row) => {
        if (jurisdiction !== "all" && row.jurisdictionLevel !== jurisdiction) return false;
        if (state !== "all" && row.state !== state) return false;
        if (energySource !== "all" && row.energySource !== energySource) return false;
        if (domain !== "all" && row.domain !== domain) return false;
        if (!search) return true;
        const hay = [
          row.title,
          row.country,
          row.jurisdictionLevel,
          row.state,
          row.sector,
          row.domain,
          row.energySource,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return hay.includes(search);
      })
      .sort((a, b) => {
        if (sortBy === "latest") return Number(b.latestOverallScore ?? -1) - Number(a.latestOverallScore ?? -1);
        if (sortBy === "trend") return Number(b.trendDelta ?? -999) - Number(a.trendDelta ?? -999);
        if (sortBy === "count") return Number(b.critiquesCount ?? 0) - Number(a.critiquesCount ?? 0);
        return Number(b.avgOverallScore ?? -1) - Number(a.avgOverallScore ?? -1);
      });

    return NextResponse.json({ items });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e?.message ?? "Failed to load rankings" }, { status: 500 });
  }
}
