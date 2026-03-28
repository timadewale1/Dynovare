import { db } from "@/lib/firebase";
import { collection, doc, getDocs, limit, query, serverTimestamp, setDoc, where } from "firebase/firestore";
import { buildSectionsFromText, summarizePolicyText } from "@/lib/policyEditor";
import { slugify } from "@/lib/slugify";
import type { PolicyType } from "@/lib/policyTypes";

type UploadPolicyInput = {
  uid: string;
  uploaderName: string;
  email?: string | null;
  title: string;
  summary?: string;
  country: string;
  jurisdictionLevel: "federal" | "state";
  state?: string;
  policyYear?: number;
  sector?: string;
  energySource?: "renewable" | "non_renewable" | "mixed";
  domain?: "electricity" | "cooking" | "transport" | "industry" | "agriculture" | "cross_sector";
  contentText?: string;
  tags?: string[];
  sourcePublisher?: string;
  sourceUrl?: string;
  storagePath: string;
  type: PolicyType;
};

export async function createUploadedPolicy(input: UploadPolicyInput) {
  const policyId = doc(collection(db, "users", input.uid, "policies")).id;
  const slug = `${slugify(input.title)}-${policyId.slice(0, 6)}`;
  const userRef = doc(db, "users", input.uid, "policies", policyId);
  const now = serverTimestamp();

  const userDoc: any = {
    id: policyId,
    title: input.title,
    slug,
    summary: input.summary ?? summarizePolicyText(input.contentText ?? "", input.title),
    country: input.country,
    jurisdictionLevel: input.jurisdictionLevel,
    state: input.jurisdictionLevel === "state" ? input.state ?? "" : "Federal",
    policyYear: input.policyYear ?? null,
    sector: input.sector ?? null,
    energySource: input.energySource ?? null,
    domain: input.domain ?? null,
    type: input.type,
    tags: input.tags ?? [],
    storagePath: input.storagePath,
    visibility: "private",
    contentText: input.contentText ?? "",
    editorSections: buildSectionsFromText(input.contentText ?? "", input.title),
    draftStatus: "ready",
    createdByUid: input.uid,
    createdByName: input.uploaderName,
    createdByEmail: input.email ?? null,
    source:
      input.sourceUrl || input.sourcePublisher
        ? {
            publisher: input.sourcePublisher ?? "",
            url: input.sourceUrl ?? "",
          }
        : null,
    createdAt: now,
    updatedAt: now,
  };

  await setDoc(userRef, userDoc);
  return { policyId, slug };
}

export async function importPublicPolicyToWorkspace(params: {
  uid: string;
  userName?: string | null;
  userEmail?: string | null;
  publicPolicyId: string;
}) {
  const existingSnap = await getDocs(
    query(
      collection(db, "users", params.uid, "policies"),
      where("createdFromPolicyId", "==", params.publicPolicyId),
      limit(1)
    )
  );

  if (!existingSnap.empty) {
    const existing = existingSnap.docs[0].data() as any;
    return {
      policyId: existingSnap.docs[0].id,
      slug: existing.slug ?? existingSnap.docs[0].id,
      reused: true,
    };
  }

  const res = await fetch(`/api/public/policy?slugOrId=${encodeURIComponent(params.publicPolicyId)}`);
  const data = await res.json();
  const policy = data?.policy;
  if (!res.ok || !policy) {
    throw new Error(data?.error || "Public policy could not be loaded");
  }

  const policyId = doc(collection(db, "users", params.uid, "policies")).id;
  const slug = `${slugify(policy.title ?? "public-policy")}-${policyId.slice(0, 6)}`;
  const userRef = doc(db, "users", params.uid, "policies", policyId);
  const now = serverTimestamp();

  const contentText = String(policy.contentText ?? "").trim();
  const sections =
    Array.isArray(policy.editorSections) && policy.editorSections.length > 0
      ? policy.editorSections
      : buildSectionsFromText(contentText, policy.title ?? "Imported policy");

  await setDoc(userRef, {
    id: policyId,
    title: policy.title ?? "Imported public policy",
    slug,
    summary: policy.summary ?? summarizePolicyText(contentText, policy.title ?? "Imported public policy"),
    contentText,
    editorSections: sections,
    aiEvidence: Array.isArray(policy.aiEvidence) ? policy.aiEvidence : [],
    country: policy.country ?? "Nigeria",
    jurisdictionLevel: policy.jurisdictionLevel ?? "federal",
    state: policy.jurisdictionLevel === "state" ? policy.state ?? "" : "Federal",
    policyYear: policy.policyYear ?? null,
    tags: Array.isArray(policy.tags) ? policy.tags : [],
    type: "uploaded",
    sector: policy.sector ?? null,
    energySource: policy.energySource ?? null,
    domain: policy.domain ?? null,
    visibility: "private",
    draftStatus: "ready",
    createdByUid: params.uid,
    createdByName: params.userName ?? null,
    createdByEmail: params.userEmail ?? null,
    createdFromPolicyId: params.publicPolicyId,
    importedFromPublic: true,
    source: policy.source ?? {
      publisher: "Dynovare Public Repository",
      url: policy.publicPdfUrl ?? null,
      licenseNote: "Imported from the public repository into a private workspace copy.",
    },
    createdAt: now,
    updatedAt: now,
  });

  return { policyId, slug, reused: false };
}
