export type PolicyType = "uploaded" | "ai_generated" | "public_source";
export type JurisdictionLevel = "federal" | "state";

export type Policy = {
  id: string;

  title: string;
  slug?: string; // for pretty URLs
  summary?: string;

  country: string; // "Nigeria" for now

  jurisdictionLevel: JurisdictionLevel;
  state?: string; // required if jurisdictionLevel === "state", optional if federal
  policyYear?: number;

  type: PolicyType;

  createdByUid?: string;
  createdByName?: string;

  createdAt?: any;
  updatedAt?: any;

  // uploaded
  storagePath?: string;

  // AI-generated or extracted later
  contentText?: string;

  tags?: string[];

  // for scraped / curated policies
  source?: {
    publisher?: string;
    url?: string;
    licenseNote?: string;
  };

  visibility?: "public";
};
