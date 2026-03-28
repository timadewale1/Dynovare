import { fetchWorkspacePolicies } from "@/lib/workspacePolicies";
import type { PolicyType } from "@/lib/policyTypes";

export async function fetchPolicies(params: {
  uid: string;
  jurisdictionLevel?: "all" | "federal" | "state";
  state?: string;
  type?: PolicyType | "all";
  sector?: string;
  energySource?: string;
  domain?: string;
  policyYear?: number | "all";
  search?: string;
}) {
  return fetchWorkspacePolicies(params.uid, {
    jurisdictionLevel: params.jurisdictionLevel,
    state: params.state,
    type: params.type,
    sector: params.sector,
    energySource: params.energySource,
    domain: params.domain,
    policyYear: params.policyYear,
    search: params.search,
  });
}
