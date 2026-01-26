type GenerateArgs = {
  title: string;
  country: string;
  jurisdictionLevel: "federal" | "state";
  state: string | null;
  policyYear: number | null;
  tags: string[];
  goals: string;
  context: string;
  constraints: string;
  sectors: string[];
  references: string;
};

// MVP deterministic generator (no external API yet).
// Later we’ll replace this with real LLM calls.
export function generatePolicyFromPromptMVP(args: GenerateArgs) {
  const lines = args.references
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const refBlock =
    lines.length > 0
      ? `\nReferences (provided):\n${lines.map((l) => `- ${l}`).join("\n")}\n`
      : "";

  const tagBlock =
    args.tags.length > 0 ? args.tags.map((t) => `#${t}`).join(" ") : "";

  const scope =
    args.jurisdictionLevel === "federal"
      ? `${args.country} (Federal)`
      : `${args.country} (${args.state})`;

  const yearLine = args.policyYear ? `${args.policyYear}` : "—";

  const sectors = args.sectors.length ? args.sectors.join(", ") : "—";

  // A structured policy layout that reads like a real draft.
  return `
${args.title}
${tagBlock}
Jurisdiction: ${scope}
Policy Year: ${yearLine}
Sectors: ${sectors}

1. Executive Summary
This policy outlines a coordinated approach to improve energy outcomes in ${scope}. It targets reliability, affordability, equity, climate alignment, and implementability through clear programs, governance, funding, and monitoring.

2. Background and Problem Statement
${args.context?.trim() ? args.context.trim() : "This policy addresses persistent gaps in access, reliability, affordability, and emissions performance in the energy system."}

3. Policy Goals and Targets
${args.goals?.trim() ? args.goals.trim() : "Define measurable targets for access, reliability, affordability, clean energy uptake, and emissions reductions."}

4. Strategic Pillars and Programs
4.1 Access & Service Delivery
- Expand last-mile access (grid and off-grid) with clear rollout phases and beneficiary targeting.
- Strengthen distribution networks, metering, loss reduction, and customer service reforms.

4.2 Clean Energy Transition
- Scale renewable capacity (utility-scale and distributed) through transparent procurement and incentives.
- Support local manufacturing and workforce development where feasible.

4.3 Affordability & Equity
- Protect vulnerable groups via targeted subsidies or lifeline tariffs (where applicable).
- Ensure gender and social inclusion in program design, consultation, and benefit distribution.

4.4 Governance & Institutional Framework
- Assign lead institutions, clarify responsibilities, and create a delivery unit for execution.
- Establish a coordination mechanism across ministries, regulators, utilities, and development partners.

4.5 Financing Strategy
- Blend public funding, private capital, and concessional finance via bankable pipelines.
- Introduce performance-based disbursement for priority programs.

5. Implementation Plan
- Phase 1 (0–18 months): reforms, pilots, pipeline creation, and enabling regulations.
- Phase 2 (18–48 months): scale deployment, grid upgrades, and financing rollout.
- Phase 3 (48+ months): optimization, expansion, and institutional maturity.

6. Monitoring, Evaluation, and Learning (MEL)
- Define KPIs for access, reliability, affordability, renewable capacity, emissions, and inclusion.
- Publish quarterly performance reports and conduct annual independent evaluations.

7. Risk Management
- Political, fiscal, and delivery risks will be mitigated through transparency, stakeholder buy-in, and contingency planning.

8. Stakeholder Engagement
- Conduct consultations with government, communities, private sector, CSOs, academia, and development partners.
- Include mechanisms for grievance redress and continuous feedback.

9. Legal/Regulatory Alignment
- Align with national development plans and relevant energy/climate frameworks.
- Propose regulatory updates needed for implementation.

10. Constraints and Assumptions
${args.constraints?.trim() ? args.constraints.trim() : "Assumes predictable funding, institutional coordination, and a stable policy environment to sustain implementation."}

${refBlock}
`.trim();
}
