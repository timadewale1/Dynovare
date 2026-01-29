"use client";

import { useMemo, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import ProtectedRoute from "@/components/guards/ProtectedRoute";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import toast from "react-hot-toast";
import { Sparkles, CheckCircle2, Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useUser } from "@/components/providers/UserProvider";

import { CRITIQUE_STANDARDS, type CritiqueStandardId } from "@/lib/critiqueStandards";
import { saveCritique } from "@/lib/critiqueWrites";
import { createAIGeneratedPolicy } from "@/lib/policyAIWrites";

const NIGERIA_STATES = [
  "Abia","Adamawa","Akwa Ibom","Anambra","Bauchi","Bayelsa","Benue","Borno",
  "Cross River","Delta","Ebonyi","Edo","Ekiti","Enugu","FCT","Gombe","Imo",
  "Jigawa","Kaduna","Kano","Katsina","Kebbi","Kogi","Kwara","Lagos","Nasarawa",
  "Niger","Ogun","Ondo","Osun","Oyo","Plateau","Rivers","Sokoto","Taraba",
  "Yobe","Zamfara",
];

const SECTORS = [
  "Electricity",
  "Renewable Energy",
  "Oil & Gas",
  "Clean Cooking",
  "Transport",
  "Industry",
  "Buildings",
  "Agriculture",
  "Waste",
  "Climate & Emissions",
];

type GeneratePromptPayload = {
  title: string;
  country: string;
  jurisdictionLevel: "federal" | "state";
  state: string | null;
  policyYear: number | null;
  sector: string;
  tags: string[];
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

  const [goals, setGoals] = useState("");
  const [context, setContext] = useState("");
  const [constraints, setConstraints] = useState("");

  const [sector, setSector] = useState<string>("Electricity");
  const [references, setReferences] = useState<string>("");

  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);

  const [selectedStandards, setSelectedStandards] = useState<CritiqueStandardId[]>([
    "sdg_alignment",
    "inclusivity_equity",
    "implementation_feasibility",
    "monitoring_metrics",
  ]);

  const [generating, setGenerating] = useState(false);

  const toggleStandard = (id: CritiqueStandardId) => {
    setSelectedStandards((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const addTag = () => {
    const t = tagInput.trim();
    if (!t) return;
    const clean = t.toLowerCase();
    if (tags.includes(clean)) {
      setTagInput("");
      return;
    }
    setTags((prev) => [...prev, clean]);
    setTagInput("");
  };

  const removeTag = (t: string) => setTags((prev) => prev.filter((x) => x !== t));

  const canGenerate = useMemo(() => {
    if (!user) return false;
    if (!title.trim()) return false;
    if (!goals.trim()) return false;
    if (jurisdictionLevel === "state" && !stateName) return false;
    if (selectedStandards.length === 0) return false;
    return true;
  }, [user, title, goals, jurisdictionLevel, stateName, selectedStandards.length]);

  const handleGenerate = async () => {
    if (!user) {
      toast.error("Please sign in");
      router.push("/login");
      return;
    }

    if (!canGenerate) {
      toast.error("Please complete required fields");
      return;
    }

    const promptPayload: GeneratePromptPayload = {
      title: title.trim(),
      country,
      jurisdictionLevel,
      state: jurisdictionLevel === "state" ? stateName : null,
      policyYear: typeof policyYear === "number" ? policyYear : null,
      sector,
      tags,
      goals: goals.trim(),
      context: context.trim(),
      constraints: constraints.trim(),
      references: references.trim(),
    };

    try {
      setGenerating(true);

      // ✅ 1) Generate-from-prompt route (NOT generate-policy)
      const genRes = await fetch("/api/ai/generate-from-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(promptPayload),
      });

      const genData = await genRes.json();
      if (!genRes.ok) throw new Error(genData?.error || "Policy generation failed");

      const generatedText = String(genData?.generatedText || "").trim();
      if (generatedText.length < 2500) {
        toast.error("Generated policy is still too short. Add more detail and try again.");
        return;
      }

      // ✅ 2) Save AI-generated policy
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
          type: "ai_generated",
        } as any,
        improvedText: generatedText,
        mode: "from_scratch",
      } as any);

      // ✅ 3) Critique via server route
      const critRes = await fetch("/api/ai/critique", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          policyId: created.id,
          selectedStandards,
        }),
      });

      const out = await critRes.json();
      if (!critRes.ok) throw new Error(out?.error || "Critique failed");

      // ✅ 4) Save critique
      await saveCritique({
        policyId: created.id,
        policyTitle: created.title ?? promptPayload.title,
        policySlug: created.slug,
        policyType: "ai_generated",
        jurisdictionLevel: promptPayload.jurisdictionLevel,
        state: promptPayload.state ?? undefined,
        policyYear: promptPayload.policyYear ?? undefined,

        userId: user.uid,
        userName: profile?.fullName,
        userEmail: user.email ?? null,

        revisionNumber: 0,

        selectedStandards,
        overallScore: out.overallScore,
        perStandard: out.perStandard,
        summary: out.summary,
        strengths: out.strengths,
        risks: out.risks,

        previousOverallScore: null,
      });

      toast.success(`Policy generated & scored ${out.overallScore}/100`);
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
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-blue-deep">AI Policy Generation</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Generate a complete policy draft, then Dynovare auto-scores it against selected standards.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="p-6 lg:col-span-2">
            <h2 className="text-lg font-bold text-blue-deep mb-4">Policy details</h2>

            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold mb-2">Policy title *</p>
                <input
                  className="w-full border rounded-xl px-3 py-2"
                  placeholder="e.g. Nigeria Renewable Electricity Access Acceleration Policy"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm font-semibold mb-2">Country</p>
                  <input className="w-full border rounded-xl px-3 py-2 bg-gray-50" value={country} disabled />
                </div>

                <div>
                  <p className="text-sm font-semibold mb-2">Jurisdiction *</p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setJurisdictionLevel("federal")}
                      className={`flex-1 border rounded-xl px-3 py-2 font-semibold transition ${
                        jurisdictionLevel === "federal" ? "border-blue-electric bg-blue-soft" : "hover:border-blue-electric"
                      }`}
                    >
                      Federal
                    </button>
                    <button
                      type="button"
                      onClick={() => setJurisdictionLevel("state")}
                      className={`flex-1 border rounded-xl px-3 py-2 font-semibold transition ${
                        jurisdictionLevel === "state" ? "border-blue-electric bg-blue-soft" : "hover:border-blue-electric"
                      }`}
                    >
                      State
                    </button>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-semibold mb-2">Policy year</p>
                  <input
                    type="number"
                    className="w-full border rounded-xl px-3 py-2"
                    value={policyYear}
                    onChange={(e) => setPolicyYear(e.target.value ? Number(e.target.value) : "")}
                  />
                </div>
              </div>

              {jurisdictionLevel === "state" && (
                <div>
                  <p className="text-sm font-semibold mb-2">Select state *</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-56 overflow-y-auto">
                    {NIGERIA_STATES.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setStateName(s)}
                        className={`border rounded-lg px-3 py-2 text-sm font-medium transition ${
                          stateName === s ? "border-blue-electric bg-blue-soft" : "hover:border-blue-electric"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <p className="text-sm font-semibold mb-2">Tags</p>
                <div className="flex gap-2">
                  <input
                    className="flex-1 border rounded-xl px-3 py-2"
                    placeholder="e.g. renewable, emissions, grid, subsidy"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                  />
                  <Button type="button" variant="outline" onClick={addTag} className="gap-2">
                    <Plus size={16} /> Add
                  </Button>
                </div>

                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {tags.map((t) => (
                      <Badge key={t} variant="outline" className="flex items-center gap-2">
                        {t}
                        <button type="button" onClick={() => removeTag(t)} className="text-[var(--text-secondary)]">
                          <X size={14} />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <p className="text-sm font-semibold mb-2">Sector *</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {SECTORS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSector(s)}
                      className={`border rounded-xl px-3 py-2 font-semibold transition ${
                        sector === s ? "border-blue-electric bg-blue-soft" : "hover:border-blue-electric"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold mb-2">Policy goals *</p>
                <textarea
                  className="w-full border rounded-xl px-3 py-2 min-h-[120px]"
                  placeholder="List the goals, targets, and outcomes you want…"
                  value={goals}
                  onChange={(e) => setGoals(e.target.value)}
                />
              </div>

              <div>
                <p className="text-sm font-semibold mb-2">Context / problem statement (optional)</p>
                <textarea
                  className="w-full border rounded-xl px-3 py-2 min-h-[100px]"
                  placeholder="Briefly describe the background and problem this policy solves…"
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                />
              </div>

              <div>
                <p className="text-sm font-semibold mb-2">Constraints (optional)</p>
                <textarea
                  className="w-full border rounded-xl px-3 py-2 min-h-[90px]"
                  placeholder="Budget, timeline, governance capacity, political constraints…"
                  value={constraints}
                  onChange={(e) => setConstraints(e.target.value)}
                />
              </div>

              <div>
                <p className="text-sm font-semibold mb-2">Reference links (optional)</p>
                <textarea
                  className="w-full border rounded-xl px-3 py-2 min-h-[80px]"
                  placeholder="Paste any useful URLs (one per line)…"
                  value={references}
                  onChange={(e) => setReferences(e.target.value)}
                />
              </div>
            </div>
          </Card>

          <div className="space-y-6">
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="text-blue-electric" size={18} />
                <h2 className="text-lg font-bold text-blue-deep">Criteria for scoring *</h2>
              </div>

              <p className="text-sm text-[var(--text-secondary)] mb-4">
                Choose what Dynovare will score this generated policy against.
              </p>

              <div className="space-y-2">
                {CRITIQUE_STANDARDS.map((s) => {
                  const on = selectedStandards.includes(s.id);
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => toggleStandard(s.id)}
                      className={`w-full border rounded-xl p-3 text-left transition ${
                        on ? "border-blue-electric bg-blue-soft" : "hover:border-blue-electric"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-bold text-blue-deep">{s.label}</p>
                          <p className="text-xs text-[var(--text-secondary)] mt-1">{s.description}</p>
                        </div>
                        {on ? <CheckCircle2 className="text-blue-electric" size={18} /> : null}
                      </div>
                    </button>
                  );
                })}
              </div>

              <p className="text-xs text-[var(--text-secondary)] mt-3">
                Selected: <span className="font-semibold text-blue-deep">{selectedStandards.length}</span>
              </p>
            </Card>

            <Card className="p-6">
              <h2 className="text-lg font-bold text-blue-deep mb-2">Generate</h2>
              <p className="text-sm text-[var(--text-secondary)] mb-4">
                Dynovare will generate a long-form policy draft (5–10 pages), save it, create a PDF, and auto-score it.
              </p>

              <Button className="w-full gap-2" onClick={handleGenerate} disabled={!canGenerate || generating}>
                <Sparkles size={16} />
                {generating ? "Generating…" : "Generate policy"}
              </Button>

              {!canGenerate && (
                <p className="text-xs text-[var(--text-secondary)] mt-3">
                  Required: Title, Goals, Jurisdiction (and State if needed), and at least 1 criterion.
                </p>
              )}
            </Card>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
