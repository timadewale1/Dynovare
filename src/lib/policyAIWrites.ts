import { db } from "@/lib/firebase";
import { collection, doc, serverTimestamp, setDoc } from "firebase/firestore";
import { composePolicyText, normalizePolicySections, summarizePolicyText, type PolicyEvidence, type PolicySection } from "@/lib/policyEditor";
import type { PolicyAIGuidance } from "@/lib/policyTypes";
import { slugify } from "@/lib/slugify";

export async function createAIGeneratedPolicy(params: {
  uid: string;
  userName?: string;
  userEmail?: string | null;
  basePolicy: any;
  improvedText?: string;
  sections?: PolicySection[];
  summary?: string;
  evidence?: PolicyEvidence[];
  guidance?: PolicyAIGuidance;
  mode?: "improve" | "from_scratch";
}) {
  const policyId = doc(collection(db, "users", params.uid, "policies")).id;
  const baseTitle = String(params.basePolicy?.title ?? "Untitled Policy").trim();
  const title =
    params.mode === "from_scratch"
      ? baseTitle
      : `${baseTitle} (Dynovare AI Generated)`;
  const slug = `${slugify(title)}-${policyId.slice(0, 6)}`;

  const jurisdiction = params.basePolicy?.jurisdictionLevel ?? "federal";
  const country = params.basePolicy?.country ?? "Nigeria";
  const sections = normalizePolicySections(params.sections, params.improvedText ?? "", title);
  const contentText = composePolicyText(sections);
  const summary = params.summary?.trim() || summarizePolicyText(contentText, title);

  const now = serverTimestamp();
  const createdFromPolicyId =
    typeof params.basePolicy?.id === "string" && params.basePolicy.id.trim()
      ? params.basePolicy.id.trim()
      : undefined;

  const userRef = doc(db, "users", params.uid, "policies", policyId);
  const userDoc: any = {
    id: policyId,
    title,
    slug,
    summary,
    contentText,
    editorSections: sections,
    aiEvidence: Array.isArray(params.evidence) ? params.evidence : [],
    aiGuidance: params.guidance ?? null,
    country,
    jurisdictionLevel: jurisdiction,
    state: jurisdiction === "state" ? (params.basePolicy?.state ?? "") : "Federal",
    policyYear: params.basePolicy?.policyYear ?? null,
    type: "ai_generated",
    tags: params.basePolicy?.tags ?? [],
    sector: params.basePolicy?.sector ?? null,
    energySource: params.basePolicy?.energySource ?? null,
    domain: params.basePolicy?.domain ?? null,
    visibility: "private",
    draftStatus: "draft",
    createdByUid: params.uid,
    createdByName: params.userName ?? null,
    createdByEmail: params.userEmail ?? null,
    ...(createdFromPolicyId ? { createdFromPolicyId } : {}),
    createdAt: now,
    updatedAt: now,
    source: {
      publisher: "Dynovare AI",
      url: params.basePolicy?.source?.url ?? null,
      licenseNote:
        params.mode === "from_scratch"
          ? "AI-generated policy created from user requirements and selected standards."
          : "AI-generated enhancement based on selected critique standards.",
    },
  };

  await setDoc(userRef, userDoc);
  return { id: policyId, slug, title };
}
