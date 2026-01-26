import { db } from "@/lib/firebase";
import { doc, collection, setDoc, serverTimestamp } from "firebase/firestore";
import { getStorage, ref, uploadBytes } from "firebase/storage";
import { slugify } from "@/lib/slugify";
import { generateScrapedPolicyPdf } from "@/lib/generatePdfFromScrapedText";

export async function writeScrapedPolicy(input: {
  title: string;
  summary: string;
  contentText: string;
  country: string;
  jurisdictionLevel: "federal" | "state";
  state?: string;
  policyYear?: number;
  sector?: string;
  tags?: string[];

  sourcePublisher: string;
  sourceUrl: string;
  licenseNote: string;
}) {
  const policyId = doc(collection(db, "policies")).id;
  const slug = `${slugify(input.title)}-${policyId.slice(0, 6)}`;

  // 🔹 Generate Dynovare PDF
  const pdfBytes = await generateScrapedPolicyPdf({
    title: input.title,
    body: input.contentText,
    meta: [
      `Source: ${input.sourcePublisher}`,
      `License: ${input.licenseNote}`,
      `Country: ${input.country}`,
      `Jurisdiction: ${input.jurisdictionLevel}`,
      `Year: ${input.policyYear ?? "N/A"}`,
    ],
  });

  const storage = getStorage();
  const storagePath = `policies/public/${policyId}.pdf`;
  await uploadBytes(ref(storage, storagePath), pdfBytes, {
    contentType: "application/pdf",
  });

  await setDoc(doc(db, "policies", policyId), {
    title: input.title,
    slug,
    summary: input.summary,
    contentText: input.contentText,

    country: input.country,
    jurisdictionLevel: input.jurisdictionLevel,
    state: input.jurisdictionLevel === "state" ? input.state ?? "" : "Federal",
    policyYear: input.policyYear ?? null,
    sector: input.sector ?? null,

    type: "public_source",
    tags: input.tags ?? [],
    storagePath,
    visibility: "public",

    source: {
      publisher: input.sourcePublisher,
      url: input.sourceUrl,
      licenseNote: input.licenseNote,
    },

    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return policyId;
}
