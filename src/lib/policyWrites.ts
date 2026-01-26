import { db } from "@/lib/firebase";
import { collection, doc, serverTimestamp, setDoc } from "firebase/firestore";
import { slugify } from "@/lib/slugify";
import type { PolicyType } from "@/lib/policyTypes";

type UploadPolicyInput = {
  uid: string;
  uploaderName: string;
  email?: string | null;

  title: string;
  summary?: string;

  country: string; // "Nigeria"
  jurisdictionLevel: "federal" | "state";
  state?: string; // required if state
  policyYear?: number;

  // ✅ NEW
  sector?: string;

  contentText?: string;

  tags?: string[];

  // optional source info (even for uploads)
  sourcePublisher?: string;
  sourceUrl?: string;

  // storage path (pdf/docx)
  storagePath: string;

  // policy type for upload flow is "uploaded"
  type: PolicyType;
};

export async function createUploadedPolicy(input: UploadPolicyInput) {
  const policyId = doc(collection(db, "policies")).id; // ✅ correct way
  const slugBase = slugify(input.title);

  // Make slug stable-ish and unique enough (title + short id)
  const slug = `${slugBase}-${policyId.slice(0, 6)}`;

  const globalRef = doc(db, "policies", policyId);
  const userRef = doc(db, "users", input.uid, "policies", policyId);

  const now = serverTimestamp();

  const globalDoc: any = {
    title: input.title,
    slug,
    summary: input.summary ?? "",
    country: input.country,
    jurisdictionLevel: input.jurisdictionLevel,
    state: input.jurisdictionLevel === "state" ? input.state ?? "" : "Federal",
    policyYear: input.policyYear ?? null,

    // ✅ NEW
    sector: input.sector ?? null,

    type: input.type, // "uploaded"
    tags: input.tags ?? [],
    storagePath: input.storagePath,
    visibility: "public",
    contentText: input.contentText ?? "",

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

  // Minimal user tracking doc (reference + quick metadata)
  const userDoc: any = {
    policyId,
    slug,
    title: input.title,
    country: input.country,
    jurisdictionLevel: input.jurisdictionLevel,
    state: input.jurisdictionLevel === "state" ? input.state ?? "" : "Federal",
    policyYear: input.policyYear ?? null,

    // ✅ NEW
    sector: input.sector ?? null,

    type: input.type,
    createdAt: now,
  };

  // Write both
  await Promise.all([setDoc(globalRef, globalDoc), setDoc(userRef, userDoc)]);

  return { policyId, slug };
}
