import { db } from "@/lib/firebase";
import { collection, doc, serverTimestamp, setDoc } from "firebase/firestore";
import { getStorage, ref as storageRef, uploadBytes } from "firebase/storage";
import { slugify } from "@/lib/slugify";
import { generatePolicyPdfBytes } from "@/lib/pdfPolicy";

export async function createAIGeneratedPolicy(params: {
  uid: string;
  userName?: string;
  userEmail?: string | null;

  basePolicy: any; // can be real Policy or minimal object for from_scratch
  improvedText: string;

  // optional mode flag (safe to ignore if not passed)
  mode?: "improve" | "from_scratch";
}) {
  const policyId = doc(collection(db, "policies")).id;

  // ✅ If caller is generating from scratch, basePolicy.title is already the actual title.
  // If improving an existing policy, we append the AI suffix.
  const baseTitle = String(params.basePolicy?.title ?? "Untitled Policy").trim();

  const title =
    params.mode === "from_scratch"
      ? baseTitle
      : `${baseTitle} (Dynovare AI Generated)`;

  const slug = `${slugify(title)}-${policyId.slice(0, 6)}`;

  // 1) Create PDF bytes
  const jurisdiction = params.basePolicy?.jurisdictionLevel ?? "federal";
  const country = params.basePolicy?.country ?? "Nigeria";
  const stateValue =
    jurisdiction === "state" ? (params.basePolicy?.state ?? "") : "Federal";

  const meta = [
    `Type: ai_generated`,
    `Country: ${country}`,
    `Jurisdiction: ${jurisdiction}`,
    `State: ${jurisdiction === "state" ? stateValue : "Federal"}`,
    `Year: ${params.basePolicy?.policyYear ?? "N/A"}`,
    `Generated for: ${params.userName ?? params.userEmail ?? params.uid}`,
  ];

  const pdfBytes = await generatePolicyPdfBytes({
    title,
    body: params.improvedText,
    meta,
  });

  // 2) Upload PDF to Storage
  const storage = getStorage();
  const storagePath = `policies/ai_generated/${params.uid}/${policyId}.pdf`;

  await uploadBytes(storageRef(storage, storagePath), pdfBytes, {
    contentType: "application/pdf",
  });

  const now = serverTimestamp();

  // 3) Save global policy doc
  const globalRef = doc(db, "policies", policyId);

  // ✅ Only include createdFromPolicyId when it exists (prevents undefined)
  const createdFromPolicyId =
    typeof params.basePolicy?.id === "string" && params.basePolicy.id.trim()
      ? params.basePolicy.id.trim()
      : undefined;

  const globalDoc: any = {
    title,
    slug,
    summary: params.basePolicy?.summary ?? "",
    contentText: params.improvedText,

    country,
    jurisdictionLevel: jurisdiction,

    // keeping your existing behavior (Federal as string)
    state: jurisdiction === "state" ? (params.basePolicy?.state ?? "") : "Federal",

    policyYear: params.basePolicy?.policyYear ?? null,

    type: "ai_generated",
    tags: params.basePolicy?.tags ?? [],
    sector: params.basePolicy?.sector ?? null, // ✅
    storagePath,
    visibility: "public",

    createdByUid: params.uid,
    createdByName: params.userName ?? null,
    createdByEmail: params.userEmail ?? null,

    // ✅ conditional spread so Firestore never gets undefined field
    ...(createdFromPolicyId ? { createdFromPolicyId } : {}),

    createdAt: now,
    updatedAt: now,

    source: {
      publisher: "Dynovare AI",
      // keep as null instead of "" (cleaner)
      url: params.basePolicy?.source?.url ?? null,
      licenseNote:
        params.mode === "from_scratch"
          ? "AI-generated policy created from user requirements and selected standards."
          : "AI-generated enhancement based on selected critique standards.",
    },
  };

  // 4) Track under user as well
  const userRef = doc(db, "users", params.uid, "policies", policyId);
  const userDoc: any = {
    policyId,
    slug,
    title,
    country: globalDoc.country,
    jurisdictionLevel: globalDoc.jurisdictionLevel,
    state: globalDoc.state,
    policyYear: globalDoc.policyYear,
    type: "ai_generated",
    createdAt: now,
    sector: globalDoc.sector ?? null,
  };

  await Promise.all([setDoc(globalRef, globalDoc), setDoc(userRef, userDoc)]);

  return { id: policyId, slug, title };
}
