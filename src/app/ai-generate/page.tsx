"use client";

import { useMemo, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import ProtectedRoute from "@/components/guards/ProtectedRoute";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import toast from "react-hot-toast";
import { ArrowRight, Sparkles, Wand2, Plus, X, FilePenLine, Bot, PenSquare } from "lucide-react";
import { useRouter } from "next/navigation";
import { useUser } from "@/components/providers/UserProvider";
import { createAIGeneratedPolicy } from "@/lib/policyAIWrites";
import { POLICY_DOMAINS, POLICY_ENERGY_SOURCES, policyDomainLabel, policyEnergySourceLabel } from "@/lib/policyTaxonomy";
import { useRotatingStatus } from "@/lib/useRotatingStatus";

const NIGERIA_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno",
  "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT", "Gombe", "Imo",
  "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa",
  "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba",
  "Yobe", "Zamfara",
];

type GeneratePromptPayload = {
  title: string;
  country: string;
  jurisdictionLevel: "federal" | "state";
  state: string | null;
  policyYear: number | null;
  sector: string;
  energySource: "renewable" | "non_renewable" | "mixed";
  domain: "electricity" | "cooking" | "transport" | "industry" | "agriculture" | "cross_sector";
  tags: string[];
  targetPages: number | null;
  goals: string;
  context: string;
  constraints: string;
  references: string;
};

export default function AIGeneratePage() {
  const router = useRouter();
  const { user, profile } = useUser();

  const [title, setTitle] = useState("");
  const [country] = useState("Nigeria");
  const [jurisdictionLevel, setJurisdictionLevel] = useState<"federal" | "state">("federal");
  const [stateName, setStateName] = useState("");
  const [policyYear, setPolicyYear] = useState<number | "">(2026);
  const [energySource, setEnergySource] = useState<"renewable" | "non_renewable" | "mixed">("mixed");
  const [domain, setDomain] = useState<"electricity" | "cooking" | "transport" | "industry" | "agriculture" | "cross_sector">("cross_sector");
  const [targetPagesInput, setTargetPagesInput] = useState("");
  const [goals, setGoals] = useState("");
  const [context, setContext] = useState("");
  const [constraints, setConstraints] = useState("");
  const [references, setReferences] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);
  const generatingStatus = useRotatingStatus(generating, [
    "Generating your policy draft...",
    "Building the document structure...",
    "Expanding sections toward your target length...",
    "Adding implementation detail and safeguards...",
    "Grounding the draft with source-backed evidence...",
    "Preparing your Policy Studio draft...",
  ]);

  const addTag = () => {
    const value = tagInput.trim().toLowerCase();
    if (!value) return;
    if (!tags.includes(value)) setTags((current) => [...current, value]);
    setTagInput("");
  };

  const canGenerate = useMemo(() => {
    if (!user) return false;
    if (!title.trim() || !goals.trim()) return false;
    if (jurisdictionLevel === "state" && !stateName) return false;
    return true;
  }, [user, title, goals, jurisdictionLevel, stateName]);

  const parsedTargetPages = targetPagesInput.trim() ? Number(targetPagesInput) : null;

  const handleGenerate = async () => {
    if (!user) {
      toast.error("Please sign in");
      router.push("/login");
      return;
    }

    if (!canGenerate) {
      toast.error("Please complete the required fields");
      return;
    }

    const promptPayload: GeneratePromptPayload = {
      title: title.trim(),
      country,
      jurisdictionLevel,
      state: jurisdictionLevel === "state" ? stateName : null,
      policyYear: typeof policyYear === "number" ? policyYear : null,
      sector: policyDomainLabel(domain),
      energySource,
      domain,
      tags,
      targetPages: parsedTargetPages && Number.isFinite(parsedTargetPages) ? parsedTargetPages : null,
      goals: goals.trim(),
      context: context.trim(),
      constraints: constraints.trim(),
      references: references.trim(),
    };

    try {
      setGenerating(true);
      const genRes = await fetch("/api/ai/generate-from-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(promptPayload),
      });

      const genData = await genRes.json();
      if (!genRes.ok) throw new Error(genData?.error || "Policy generation failed");

      const created = await createAIGeneratedPolicy({
        uid: user.uid,
        userName: profile?.fullName,
        userEmail: user.email ?? null,
        basePolicy: {
          title: promptPayload.title,
          country: promptPayload.country,
          jurisdictionLevel: promptPayload.jurisdictionLevel,
          state: promptPayload.state ?? null,
          policyYear: promptPayload.policyYear ?? null,
          tags: promptPayload.tags,
          sector: promptPayload.sector,
          energySource: promptPayload.energySource,
          domain: promptPayload.domain,
          type: "ai_generated",
        },
        summary: genData?.summary,
        sections: genData?.sections,
        evidence: genData?.evidence,
        guidance: genData?.guidance,
        improvedText: genData?.generatedText,
        mode: "from_scratch",
      });

      toast.success("Draft created. Opening Policy Studio...");
      router.push(`/policies/${created.slug}`);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "AI generation failed");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <section className="overflow-hidden rounded-[2rem] bg-[linear-gradient(135deg,#08263d_0%,#0f4b70_52%,#1f7a8c_100%)] p-8 text-white shadow-[0_24px_80px_rgba(8,38,61,0.22)]">
            <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
              <div>
                <Badge variant="outline" className="border-white/20 bg-white/10 text-white">Policy Studio</Badge>
                <h1 className="mt-5 max-w-3xl text-3xl font-black tracking-tight md:text-4xl">
                  Generate a solid first draft, then keep shaping every section until it is ready.
                </h1>
                <p className="mt-4 max-w-2xl text-base text-white/80">
                  Start with a structured brief. You will get an editable in-app draft, section-level AI help, critique, simulation,
                  and a polished PDF export when you decide it is time.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  ["Editable by default", "Open the draft in Policy Studio and revise every section."],
                  ["Targeted AI help", "Ask AI to improve only the part that needs attention."],
                  ["Private workflow", "Your drafts stay in your workspace until you choose otherwise."],
                  ["Styled export", "Download a polished PDF only after the content is ready."],
                ].map(([title, text]) => (
                  <div key={title} className="rounded-[1.5rem] border border-white/15 bg-white/8 p-4 backdrop-blur">
                    <p className="font-bold">{title}</p>
                    <p className="mt-2 text-sm text-white/72">{text}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <Card className="premium-card rounded-[2rem] p-6">
              <div className="mb-6">
                <p className="text-xs uppercase tracking-[0.22em] text-[var(--text-secondary)]">Draft brief</p>
                <h2 className="mt-2 text-xl font-black text-blue-deep">Tell the AI what this policy needs to achieve</h2>
              </div>

              <div className="grid gap-5">
                <div>
                  <p className="mb-2 text-sm font-semibold">Policy title *</p>
                  <input className="studio-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Nigeria Distributed Solar Markets Acceleration Policy" />
                </div>

                <div className="grid gap-4 md:grid-cols-5">
                  <div>
                    <p className="mb-2 text-sm font-semibold">Country</p>
                    <input className="studio-input bg-slate-50" value={country} disabled />
                  </div>
                  <div>
                    <p className="mb-2 text-sm font-semibold">Jurisdiction *</p>
                    <div className="grid grid-cols-2 gap-2">
                      {(["federal", "state"] as const).map((item) => (
                        <button
                          key={item}
                          type="button"
                          onClick={() => setJurisdictionLevel(item)}
                          className={`studio-chip ${jurisdictionLevel === item ? "studio-chip-active" : ""}`}
                        >
                          {item === "federal" ? "Federal" : "State"}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="mb-2 text-sm font-semibold">Year</p>
                    <input
                      type="number"
                      className="studio-input"
                      value={policyYear}
                      onChange={(e) => setPolicyYear(e.target.value ? Number(e.target.value) : "")}
                    />
                  </div>
                  <div>
                    <p className="mb-2 text-sm font-semibold">State</p>
                    <select
                      className="studio-input"
                      disabled={jurisdictionLevel !== "state"}
                      value={stateName}
                      onChange={(e) => setStateName(e.target.value)}
                    >
                      <option value="">{jurisdictionLevel === "state" ? "Select state" : "Federal policy"}</option>
                      {NIGERIA_STATES.map((state) => <option key={state} value={state}>{state}</option>)}
                    </select>
                  </div>
                  <div>
                    <p className="mb-2 text-sm font-semibold">Target pages</p>
                    <input
                      type="number"
                      max={100}
                      step={1}
                      inputMode="numeric"
                      className="studio-input"
                      placeholder="e.g. 20"
                      value={targetPagesInput}
                      onChange={(e) => setTargetPagesInput(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="mb-2 text-sm font-semibold">Energy source</p>
                    <div className="flex flex-wrap gap-2">
                      {POLICY_ENERGY_SOURCES.map((item) => (
                        <button key={item} type="button" onClick={() => setEnergySource(item)} className={`studio-chip ${energySource === item ? "studio-chip-active" : ""}`}>{policyEnergySourceLabel(item)}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="mb-2 text-sm font-semibold">Domain</p>
                    <div className="flex flex-wrap gap-2">
                      {POLICY_DOMAINS.map((item) => (
                        <button key={item} type="button" onClick={() => setDomain(item)} className={`studio-chip ${domain === item ? "studio-chip-active" : ""}`}>{policyDomainLabel(item)}</button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-sm font-semibold">Goals and targets *</p>
                  <textarea className="studio-textarea min-h-[140px]" value={goals} onChange={(e) => setGoals(e.target.value)} placeholder="Describe the access, reliability, affordability, market, or climate goals this policy must deliver." />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="mb-2 text-sm font-semibold">Context and problem</p>
                    <textarea className="studio-textarea min-h-[120px]" value={context} onChange={(e) => setContext(e.target.value)} placeholder="What problem are you solving, for whom, and why now?" />
                  </div>
                  <div>
                    <p className="mb-2 text-sm font-semibold">Constraints</p>
                    <textarea className="studio-textarea min-h-[120px]" value={constraints} onChange={(e) => setConstraints(e.target.value)} placeholder="Budget, delivery, legal, political, or timing constraints." />
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-sm font-semibold">Reference links or notes</p>
                  <textarea className="studio-textarea min-h-[100px]" value={references} onChange={(e) => setReferences(e.target.value)} placeholder="Paste URLs or source notes you want the draft to reflect." />
                </div>

                <div>
                  <p className="mb-2 text-sm font-semibold">Tags</p>
                  <div className="flex gap-2">
                    <input
                      className="studio-input"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      placeholder="e.g. mini-grid, subsidy reform, access"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addTag();
                        }
                      }}
                    />
                    <Button type="button" variant="outline" onClick={addTag} className="gap-2 rounded-full">
                      <Plus size={15} />
                      Add
                    </Button>
                  </div>
                  {tags.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="rounded-full px-3 py-1">
                          {tag}
                          <button type="button" className="ml-2" onClick={() => setTags((current) => current.filter((item) => item !== tag))}>
                            <X size={14} />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            </Card>

            <div className="space-y-6">
              <Card className="premium-card rounded-[2rem] p-6">
                <div className="inline-flex rounded-2xl bg-blue-soft p-3 text-blue-electric">
                  <Wand2 size={22} />
                </div>
                <h2 className="mt-4 text-xl font-black text-blue-deep">Generate into Policy Studio</h2>
                <p className="mt-3 text-sm text-[var(--text-secondary)]">
                  Create a fuller draft sized to your target length, then open it in the editor to revise, run critique, test scenarios, request targeted AI rewrites,
                  and export a polished PDF.
                </p>

                <Button className="mt-5 w-full gap-2 rounded-full bg-[#125669] hover:bg-[#0f4b5d]" onClick={handleGenerate} disabled={!canGenerate || generating}>
                  <Sparkles size={16} />
                  {generating ? "Generating draft..." : "Generate draft"}
                </Button>
                {generating ? (
                  <p className="mt-3 text-sm text-[var(--text-secondary)]">{generatingStatus}</p>
                ) : null}

                {!canGenerate ? (
                  <p className="mt-3 text-xs text-[var(--text-secondary)]">
                    Required: title, goals, and state if you choose a state-level policy.
                  </p>
                ) : null}
              </Card>

              <Card className="rounded-[2rem] bg-[linear-gradient(180deg,#0b2336_0%,#135a6e_100%)] p-6 text-white shadow-sm">
                <div className="grid gap-4">
                  {[
                    {
                      icon: <Bot size={18} />,
                      title: "Structured first draft",
                      text: "Get sections, summary, and evidence notes instead of a plain static document.",
                    },
                    {
                      icon: <PenSquare size={18} />,
                      title: "Section-level revision",
                      text: "Fix only the section that needs attention instead of regenerating everything.",
                    },
                    {
                      icon: <FilePenLine size={18} />,
                      title: "Publication-ready export",
                      text: "Download a styled PDF after your team reviews the content in the editor.",
                    },
                  ].map((item) => (
                    <div key={item.title} className="rounded-[1.4rem] border border-white/10 bg-white/8 p-4">
                      <div className="flex items-center gap-2 font-semibold">
                        {item.icon}
                        <span>{item.title}</span>
                      </div>
                      <p className="mt-2 text-sm text-white/76">{item.text}</p>
                    </div>
                  ))}
                </div>
                <Button variant="outline" className="mt-5 w-full gap-2 border-white/20 bg-transparent text-white hover:bg-white/10" onClick={() => router.push("/policies")}>
                  Open workspace
                  <ArrowRight size={15} />
                </Button>
              </Card>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
