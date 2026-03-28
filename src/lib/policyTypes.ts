export type PolicyType = "uploaded" | "ai_generated" | "public_source";
export type JurisdictionLevel = "federal" | "state";
export type PolicyVisibility = "public" | "private";
export type PolicySection = {
  id: string;
  title: string;
  body: string;
};
export type PolicyEvidence = {
  title: string;
  url: string;
  whyRelevant?: string;
};

export type PolicyAIGuidance = {
  draftingNotes?: string[];
  implementationChecklist?: string[];
  revisionPrompts?: string[];
  riskControls?: string[];
};

export type Policy = {
  id: string;

  title: string;
  slug?: string; // for pretty URLs
  summary?: string;

  country: string; // "Nigeria" for now

  jurisdictionLevel: JurisdictionLevel;
  state?: string; // required if jurisdictionLevel === "state", optional if federal
  policyYear?: number;
  revisionNumber?: number;


  type: PolicyType;

  createdByUid?: string;
  createdByName?: string;
  createdByEmail?: string | null;

  createdAt?: any;
  updatedAt?: any;
  visibility?: PolicyVisibility;
  energySource?: "renewable" | "non_renewable" | "mixed";
  domain?: "electricity" | "cooking" | "transport" | "industry" | "agriculture" | "cross_sector";

  // uploaded
  storagePath?: string;

  // AI-generated or extracted later
  contentText?: string;
  editorSections?: PolicySection[];
  aiEvidence?: PolicyEvidence[];
  aiGuidance?: PolicyAIGuidance;
  draftStatus?: "draft" | "ready";

  tags?: string[];

  // for scraped / curated policies
  source?: {
    publisher?: string;
    url?: string;
    licenseNote?: string;
  };
};
