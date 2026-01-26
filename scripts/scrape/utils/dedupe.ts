import crypto from "crypto";

export function makeDedupeKey(params: {
  title: string;
  country: string;
  jurisdictionLevel: string;
  publisher: string;
}) {
  const base = [
    params.title.toLowerCase().trim(),
    params.country.toLowerCase(),
    params.jurisdictionLevel.toLowerCase(),
    params.publisher.toLowerCase(),
  ].join("|");

  return crypto.createHash("sha256").update(base).digest("hex");
}
