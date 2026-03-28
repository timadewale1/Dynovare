import "server-only";
import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { NIGERIA_STATES } from "@/lib/ngStates";

type PolicyStat = {
  state?: string | null;
  latestOverallScore?: number | null;
  avgOverallScore?: number | null;
  critiquesCount?: number | null;
  visibility?: string | null;
  title?: string | null;
  slug?: string | null;
};

function asNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export async function GET() {
  try {
    const snap = await adminDb.collection("policyStats").orderBy("updatedAt", "desc").limit(250).get();
    const rows = snap.docs
      .map((d) => ({ id: d.id, ...(d.data() as PolicyStat) }))
      .filter((row) => (row.visibility ?? "public") === "public");

    const totalPolicies = rows.length;
    const totalCritiques = rows.reduce((sum, row) => sum + Number(row.critiquesCount ?? 0), 0);
    const averageScoreRows = rows.filter((row) => asNumber(row.avgOverallScore) !== null);
    const averageScore =
      averageScoreRows.length > 0
        ? Math.round(
            (averageScoreRows.reduce((sum, row) => sum + Number(row.avgOverallScore ?? 0), 0) /
              averageScoreRows.length) *
              10
          ) / 10
        : null;

    const stateScores = NIGERIA_STATES.map((state) => {
      const stateRows = rows.filter((row) => row.state === state);
      const scoreRows = stateRows.filter((row) => asNumber(row.avgOverallScore ?? row.latestOverallScore) !== null);
      const score =
        scoreRows.length > 0
          ? Math.round(
              (scoreRows.reduce(
                (sum, row) => sum + Number(row.avgOverallScore ?? row.latestOverallScore ?? 0),
                0
              ) /
                scoreRows.length) *
                10
            ) / 10
          : null;

      return {
        state,
        score,
        policies: stateRows.length,
      };
    });

    const leaderboard = [...rows]
      .filter((row) => asNumber(row.avgOverallScore ?? row.latestOverallScore) !== null)
      .sort(
        (a, b) =>
          Number(b.avgOverallScore ?? b.latestOverallScore ?? -1) -
          Number(a.avgOverallScore ?? a.latestOverallScore ?? -1)
      )
      .slice(0, 5)
      .map((row, index) => ({
        rank: index + 1,
        title: row.title ?? "Untitled policy",
        slug: row.slug ?? null,
        score: Number(row.avgOverallScore ?? row.latestOverallScore ?? 0),
        state: row.state || "Federal",
      }));

    const stateLeaderboard = [...stateScores]
      .filter((row) => row.score !== null)
      .sort((a, b) => Number(b.score ?? -1) - Number(a.score ?? -1))
      .slice(0, 5);

    return NextResponse.json({
      totals: {
        policies: totalPolicies,
        critiques: totalCritiques,
        averageScore,
      },
      leaderboard,
      stateLeaderboard,
      stateScores,
    });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e?.message ?? "Failed to load public insights" }, { status: 500 });
  }
}
