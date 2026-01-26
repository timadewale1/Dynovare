import { generatePolicyPdfBytes } from "@/lib/pdfPolicy";

export async function generateScrapedPolicyPdf(params: {
  title: string;
  body: string;
  meta: string[];
}) {
  return generatePolicyPdfBytes({
    title: params.title,
    body: params.body,
    meta: params.meta,
  });
}
