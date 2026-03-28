import { db } from "@/lib/firebase";
import { composePolicyText, normalizePolicySections, summarizePolicyText, type PolicyEvidence, type PolicySection } from "@/lib/policyEditor";
import type { PolicyAIGuidance } from "@/lib/policyTypes";
import { doc, serverTimestamp, updateDoc } from "firebase/firestore";

export async function updateWorkspacePolicyDraft(args: {
  uid: string;
  policyId: string;
  title: string;
  summary?: string;
  sections: PolicySection[];
  evidence?: PolicyEvidence[];
  guidance?: PolicyAIGuidance;
}) {
  const sections = normalizePolicySections(args.sections);
  const contentText = composePolicyText(sections);
  const summary = (args.summary || "").trim() || summarizePolicyText(contentText, args.title);

  await updateDoc(doc(db, "users", args.uid, "policies", args.policyId), {
    title: args.title.trim(),
    summary,
    editorSections: sections,
    contentText,
    aiEvidence: Array.isArray(args.evidence) ? args.evidence : [],
    aiGuidance: args.guidance ?? null,
    updatedAt: serverTimestamp(),
  });
}
