import "server-only";
import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { generatePolicyPdfBytes } from "@/lib/pdfPolicy";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const policyId = String(body?.policyId || "").trim();
    const ownerUid = String(body?.ownerUid || "").trim();

    if (!policyId || !ownerUid) {
      return NextResponse.json({ error: "Missing policyId or ownerUid" }, { status: 400 });
    }

    const snap = await adminDb.collection("users").doc(ownerUid).collection("policies").doc(policyId).get();
    if (!snap.exists) {
      return NextResponse.json({ error: "Policy not found" }, { status: 404 });
    }

    const policy = snap.data() as any;
    const [critiqueSnap, simulationSnap] = await Promise.all([
      adminDb
        .collection("users")
        .doc(ownerUid)
        .collection("policies")
        .doc(policyId)
        .collection("critiques")
        .orderBy("createdAt", "desc")
        .limit(1)
        .get(),
      adminDb
        .collection("users")
        .doc(ownerUid)
        .collection("policies")
        .doc(policyId)
        .collection("simulations")
        .orderBy("createdAt", "desc")
        .limit(1)
        .get(),
    ]);

    const latestCritique = critiqueSnap.empty ? null : (critiqueSnap.docs[0].data() as any);
    const latestSimulation = simulationSnap.empty ? null : (simulationSnap.docs[0].data() as any);
    const meta = [
      `Country: ${policy?.country ?? "Nigeria"}`,
      `Jurisdiction: ${policy?.jurisdictionLevel === "state" ? policy?.state ?? "State" : "Federal"}`,
      `Year: ${policy?.policyYear ?? "N/A"}`,
      `Type: ${policy?.type ?? "workspace_draft"}`,
    ];

    const pdfBytes = await generatePolicyPdfBytes({
      title: policy?.title ?? "Untitled policy",
      summary: policy?.summary ?? "",
      body: policy?.contentText ?? "",
      sections: Array.isArray(policy?.editorSections) ? policy.editorSections : [],
      meta,
      evidence: Array.isArray(policy?.aiEvidence) ? policy.aiEvidence : [],
      guidance: policy?.aiGuidance ?? null,
      critique: latestCritique,
      simulation: latestSimulation,
    });

    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${(policy?.title ?? "policy").replace(/[^a-z0-9-_]+/gi, "-").toLowerCase()}.pdf"`,
      },
    });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e?.message ?? "PDF export failed" }, { status: 500 });
  }
}
