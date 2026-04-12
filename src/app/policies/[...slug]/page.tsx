"use client";

import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import ProtectedRoute from "@/components/guards/ProtectedRoute";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRouter, useParams } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, getDocs, limit, orderBy, query } from "firebase/firestore";
import type { Policy } from "@/lib/policyTypes";
import {
  Sparkles,
  BarChart3,
  ArrowLeft,
  Link2,
  Download,
  ChevronDown,
  ChevronUp,
  Lock,
  Save,
  Wand2,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";
import { getStorage, ref as storageRef, getDownloadURL } from "firebase/storage";
import { useUser } from "@/components/providers/UserProvider";
import { resolveWorkspacePolicyBySlugOrId } from "@/lib/workspacePolicies";
import { updateWorkspacePolicyDraft } from "@/lib/workspacePolicyMutations";
import { normalizePolicySections, type PolicySection } from "@/lib/policyEditor";
import { policyDomainLabel, policyEnergySourceLabel } from "@/lib/policyTaxonomy";

function formatWhen(ts: any) {
  try {
    const d = ts?.toDate?.() ? ts.toDate() : null;
    return d ? d.toLocaleString() : "";
  } catch {
    return "";
  }
}

export default function PolicyDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useUser();
  const slugParts = (params?.slug as string[]) ?? [];
  const slugOrId = slugParts[slugParts.length - 1] || "";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refiningId, setRefiningId] = useState<string | null>(null);
  const [policy, setPolicy] = useState<Policy | null>(null);
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [sections, setSections] = useState<PolicySection[]>([]);
  const [aiInstruction, setAiInstruction] = useState<Record<string, string>>({});
  const [critiques, setCritiques] = useState<any[]>([]);
  const [simulations, setSimulations] = useState<any[]>([]);
  const [openCritique, setOpenCritique] = useState<string | null>(null);
  const [openSimulation, setOpenSimulation] = useState<string | null>(null);
  const [downloadingOriginal, setDownloadingOriginal] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!user || !slugOrId) return;
      setLoading(true);
      const record = await resolveWorkspacePolicyBySlugOrId(user.uid, slugOrId);

      if (!record) {
        setPolicy(null);
        setLoading(false);
        return;
      }

      setPolicy(record);
      setTitle(record.title ?? "");
      setSummary(record.summary ?? "");
      setSections(normalizePolicySections(record.editorSections, record.contentText ?? "", record.title));

      const critiquesSnap = await getDocs(
        query(collection(db, "users", user.uid, "policies", record.id, "critiques"), orderBy("createdAt", "desc"), limit(10))
      );
      const simsSnap = await getDocs(
        query(collection(db, "users", user.uid, "policies", record.id, "simulations"), orderBy("createdAt", "desc"), limit(10))
      );

      setCritiques(critiquesSnap.docs.map((doc) => ({ id: doc.id, ...(doc.data() as any) })));
      setSimulations(simsSnap.docs.map((doc) => ({ id: doc.id, ...(doc.data() as any) })));
      setLoading(false);
    };

    void load();
  }, [slugOrId, user]);

  const jurisdictionText = useMemo(() => {
    if (!policy) return "";
    return policy.jurisdictionLevel === "federal" ? "Federal" : policy.state;
  }, [policy]);

  const latestCritique = critiques[0] ?? null;
  const latestSimulation = simulations[0] ?? null;

  const saveDraft = async () => {
    if (!user || !policy) return;

    try {
      setSaving(true);
      await updateWorkspacePolicyDraft({
        uid: user.uid,
        policyId: policy.id,
        title,
        summary,
        sections,
        evidence: policy.aiEvidence,
        guidance: (policy as any).aiGuidance,
      });

      setPolicy((current) =>
        current
          ? {
              ...current,
              title,
              summary,
              editorSections: sections,
            }
          : current
      );
      toast.success("Draft saved");
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Failed to save draft");
    } finally {
      setSaving(false);
    }
  };

  const refineSection = async (section: PolicySection) => {
    const instructions = String(aiInstruction[section.id] || "").trim();
    if (!instructions) {
      toast.error("Add a short instruction for the AI first");
      return;
    }

    try {
      setRefiningId(section.id);
      const res = await fetch("/api/ai/revise-section", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          policyTitle: title || policy?.title,
          sectionTitle: section.title,
          sectionBody: section.body,
          instructions,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Section revision failed");

      setSections((current) =>
        current.map((item) =>
          item.id === section.id ? { ...item, title: data?.title || item.title, body: data?.body || item.body } : item
        )
      );
      setAiInstruction((current) => ({ ...current, [section.id]: "" }));
      toast.success(data?.changeSummary || "Section refined");
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Section revision failed");
    } finally {
      setRefiningId(null);
    }
  };

  const handleOriginalDownload = async () => {
    if (!policy?.storagePath) return;
    try {
      setDownloadingOriginal(true);
      const url = await getDownloadURL(storageRef(getStorage(), policy.storagePath));
      window.open(url, "_blank");
    } finally {
      setDownloadingOriginal(false);
    }
  };

  const handleStyledPdfExport = async () => {
    if (!policy || !user) return;

    try {
      setExportingPdf(true);
      await saveDraft();

      const res = await fetch("/api/policies/export-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ policyId: policy.id, ownerUid: user.uid }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.error || "PDF export failed");
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${(title || policy.title).replace(/[^a-z0-9-_]+/gi, "-").toLowerCase()}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "PDF export failed");
    } finally {
      setExportingPdf(false);
    }
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <section className="rounded-[2rem] bg-[linear-gradient(135deg,#08263d_0%,#0f4b70_52%,#1f7a8c_100%)] p-7 text-white shadow-[0_24px_80px_rgba(8,38,61,0.18)]">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
              <div className="max-w-3xl">
                <div className="flex flex-wrap items-center gap-2">
                  <Button variant="outline" className="border-white/20 bg-transparent text-white hover:bg-white/10" onClick={() => router.push("/policies")}>
                    <ArrowLeft size={16} />
                    Back
                  </Button>
                  <Badge variant="outline" className="border-white/20 bg-white/10 text-white">
                    <Lock size={12} className="mr-1" /> Private studio
                  </Badge>
                </div>
                <h1 className="mt-5 text-3xl font-black tracking-tight">
                  {loading ? "Loading policy studio..." : policy?.title ?? "Policy not found"}
                </h1>
                {!loading && policy ? (
                  <p className="mt-3 text-base text-white/78">
                    {policy.country} · {jurisdictionText} · {policy.policyYear ?? "Year N/A"} · {policy.type === "ai_generated" ? "AI draft" : "Uploaded policy"}
                  </p>
                ) : null}
              </div>

              {!loading && policy ? (
                <div className="grid gap-2 sm:grid-cols-2 xl:w-[420px]">
                  <Button className="rounded-full bg-white text-blue-deep hover:bg-white/90" onClick={saveDraft} disabled={saving}>
                    {saving ? <Loader2 className="mr-2 animate-spin" size={16} /> : <Save className="mr-2" size={16} />}
                    Save draft
                  </Button>
                  <Button className="rounded-full border border-white/20 bg-transparent text-white hover:bg-white/10" onClick={handleStyledPdfExport} disabled={exportingPdf}>
                    {exportingPdf ? <Loader2 className="mr-2 animate-spin" size={16} /> : <Download className="mr-2" size={16} />}
                    Export styled PDF
                  </Button>
                  <Button className="rounded-full border border-white/20 bg-transparent text-white hover:bg-white/10" onClick={() => router.push(`/critique?policyId=${policy.id}`)}>
                    <Sparkles className="mr-2" size={16} />
                    Run critique
                  </Button>
                  <Button className="rounded-full border border-white/20 bg-transparent text-white hover:bg-white/10" onClick={() => router.push(`/simulations?policyId=${policy.id}`)}>
                    <BarChart3 className="mr-2" size={16} />
                    Run simulation
                  </Button>
                </div>
              ) : null}
            </div>
          </section>

          {!loading && !policy ? (
            <Card className="rounded-[2rem] p-6">
              <p className="text-sm text-[var(--text-secondary)]">No workspace policy found for this route.</p>
            </Card>
          ) : null}

          {policy ? (
            <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
              <div className="space-y-6">
                <Card className="rounded-[2rem] border-white/70 bg-white/90 p-6 shadow-sm">
                  <div className="grid gap-5">
                    <div>
                      <p className="mb-2 text-xs uppercase tracking-[0.22em] text-[var(--text-secondary)]">Document metadata</p>
                      <input className="studio-title-input" value={title} onChange={(e) => setTitle(e.target.value)} />
                    </div>
                    <div>
                      <p className="mb-2 text-sm font-semibold text-blue-deep">Summary</p>
                      <textarea className="studio-textarea min-h-[110px]" value={summary} onChange={(e) => setSummary(e.target.value)} />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge>{policy.type}</Badge>
                      <Badge variant="outline">{policy.jurisdictionLevel === "federal" ? "Federal" : "State"}</Badge>
                      {policy.state ? <Badge variant="outline">{policy.state}</Badge> : null}
                      {policy.policyYear ? <Badge variant="outline">{policy.policyYear}</Badge> : null}
                      {(policy as any).sector ? <Badge variant="outline">{(policy as any).sector}</Badge> : null}
                      {(policy as any).energySource ? <Badge variant="outline">{policyEnergySourceLabel((policy as any).energySource)}</Badge> : null}
                      {(policy as any).domain ? <Badge variant="outline">{policyDomainLabel((policy as any).domain)}</Badge> : null}
                    </div>
                  </div>
                </Card>

                <div className="space-y-5">
                  {sections.map((section, index) => (
                    <Card key={section.id} className="rounded-[2rem] border-white/70 bg-white/90 p-6 shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-secondary)]">Section {index + 1}</p>
                          <input
                            className="mt-2 w-full bg-transparent text-2xl font-black text-blue-deep outline-none"
                            value={section.title}
                            onChange={(e) =>
                              setSections((current) => current.map((item) => item.id === section.id ? { ...item, title: e.target.value } : item))
                            }
                          />
                        </div>
                        <Badge variant="outline" className="rounded-full">Editable</Badge>
                      </div>

                      <textarea
                        className="studio-textarea mt-4 min-h-[260px]"
                        value={section.body}
                        onChange={(e) =>
                          setSections((current) => current.map((item) => item.id === section.id ? { ...item, body: e.target.value } : item))
                        }
                      />

                      <div className="mt-4 rounded-[1.5rem] border bg-slate-50/80 p-4">
                        <div className="flex items-center gap-2">
                          <Wand2 size={16} className="text-blue-electric" />
                          <p className="font-semibold text-blue-deep">Ask AI to improve this section</p>
                        </div>
                        <textarea
                          className="studio-textarea mt-3 min-h-[90px] bg-white"
                          placeholder="Example: tighten the implementation plan, add monitoring responsibilities, or make the financing section more realistic."
                          value={aiInstruction[section.id] ?? ""}
                          onChange={(e) => setAiInstruction((current) => ({ ...current, [section.id]: e.target.value }))}
                        />
                        <div className="mt-3 flex justify-end">
                          <Button className="rounded-full gap-2" onClick={() => refineSection(section)} disabled={refiningId === section.id}>
                            {refiningId === section.id ? <Loader2 className="animate-spin" size={15} /> : <Sparkles size={15} />}
                            {refiningId === section.id ? "Rewriting..." : "Rewrite section"}
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                <Card className="rounded-[2rem] border-white/70 bg-white/90 p-6 shadow-sm">
                  <h2 className="text-xl font-black text-blue-deep">Studio actions</h2>
                  <p className="mt-2 text-sm text-[var(--text-secondary)]">
                    Save before you leave, refine sections with AI, and export only when the draft reads the way you want.
                  </p>
                  <div className="mt-5 space-y-2">
                    <Button className="w-full rounded-full gap-2" onClick={saveDraft} disabled={saving}>
                      {saving ? <Loader2 className="animate-spin" size={15} /> : <Save size={15} />}
                      Save draft
                    </Button>
                    <Button className="w-full rounded-full gap-2" variant="outline" onClick={handleStyledPdfExport} disabled={exportingPdf}>
                      {exportingPdf ? <Loader2 className="animate-spin" size={15} /> : <Download size={15} />}
                      Export styled PDF
                    </Button>
                    {policy.storagePath ? (
                      <Button className="w-full rounded-full gap-2" variant="outline" onClick={handleOriginalDownload} disabled={downloadingOriginal}>
                        <Download size={15} />
                        {downloadingOriginal ? "Preparing original..." : "Open original file"}
                      </Button>
                    ) : null}
                  </div>
                </Card>

                <Card className="rounded-[2rem] border-white/70 bg-white/90 p-6 shadow-sm">
                  <h2 className="text-xl font-black text-blue-deep">Export preview</h2>
                  <p className="mt-2 text-sm text-[var(--text-secondary)]">
                    The styled PDF uses an A4 layout with a cover page, justified body text, highlighted actions, critique insight, simulation visuals, and appended references.
                  </p>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-[1.25rem] border bg-slate-50 p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-secondary)]">Sections</p>
                      <p className="mt-2 text-2xl font-black text-blue-deep">{sections.length}</p>
                    </div>
                    <div className="rounded-[1.25rem] border bg-slate-50 p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-secondary)]">Evidence links</p>
                      <p className="mt-2 text-2xl font-black text-blue-deep">{policy.aiEvidence?.length ?? 0}</p>
                    </div>
                    <div className="rounded-[1.25rem] border bg-slate-50 p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-secondary)]">Latest critique</p>
                      <p className="mt-2 text-2xl font-black text-blue-deep">
                        {typeof latestCritique?.overallScore === "number" ? `${latestCritique.overallScore}/100` : "-"}
                      </p>
                    </div>
                    <div className="rounded-[1.25rem] border bg-slate-50 p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-secondary)]">Scenario chart</p>
                      <p className="mt-2 text-sm font-semibold text-blue-deep">
                        {Array.isArray(latestSimulation?.outputs?.yearByYear) && latestSimulation.outputs.yearByYear.length > 0
                          ? "Included from latest simulation"
                          : "Added when year-by-year data exists"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 space-y-3">
                    {latestCritique?.executiveVerdict ? (
                      <div className="rounded-[1.25rem] border bg-[rgba(0,115,209,0.05)] p-4">
                        <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-secondary)]">Cover highlight</p>
                        <p className="mt-2 text-sm text-blue-deep">{latestCritique.executiveVerdict}</p>
                      </div>
                    ) : null}

                    {Array.isArray(latestCritique?.priorityActions) && latestCritique.priorityActions.length > 0 ? (
                      <div className="rounded-[1.25rem] border bg-slate-50 p-4">
                        <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-secondary)]">Highlighted actions</p>
                        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-[var(--text-secondary)]">
                          {latestCritique.priorityActions.slice(0, 3).map((item: string, index: number) => (
                            <li key={index}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null}

                    {policy.aiEvidence?.length ? (
                      <div className="rounded-[1.25rem] border bg-slate-50 p-4">
                        <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-secondary)]">References appendix</p>
                        <p className="mt-2 text-sm text-[var(--text-secondary)]">
                          The export appends your AI evidence links and the latest critique or simulation references in a dedicated references section.
                        </p>
                      </div>
                    ) : null}
                  </div>
                </Card>

                {policy.aiEvidence?.length ? (
                  <Card className="rounded-[2rem] border-white/70 bg-white/90 p-6 shadow-sm">
                    <h2 className="text-xl font-black text-blue-deep">AI evidence</h2>
                    <div className="mt-4 space-y-3">
                      {policy.aiEvidence.map((item) => (
                        <button
                          key={`${item.title}-${item.url}`}
                          type="button"
                          onClick={() => window.open(item.url, "_blank")}
                          className="w-full rounded-[1.25rem] border bg-slate-50 p-4 text-left transition hover:bg-blue-soft"
                        >
                          <p className="font-semibold text-blue-deep">{item.title}</p>
                          <p className="mt-1 text-xs text-[var(--text-secondary)]">{item.whyRelevant || item.url}</p>
                        </button>
                      ))}
                    </div>
                  </Card>
                ) : null}

                {(policy as any).aiGuidance ? (
                  <Card className="rounded-[2rem] border-white/70 bg-white/90 p-6 shadow-sm">
                    <h2 className="text-xl font-black text-blue-deep">AI drafting guidance</h2>
                    <div className="mt-4 space-y-4">
                      {Array.isArray((policy as any).aiGuidance?.draftingNotes) && (policy as any).aiGuidance.draftingNotes.length > 0 ? (
                        <div className="rounded-[1.25rem] border bg-slate-50 p-4">
                          <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-secondary)]">Drafting notes</p>
                          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-[var(--text-secondary)]">
                            {(policy as any).aiGuidance.draftingNotes.map((item: string, index: number) => <li key={index}>{item}</li>)}
                          </ul>
                        </div>
                      ) : null}
                      {Array.isArray((policy as any).aiGuidance?.implementationChecklist) && (policy as any).aiGuidance.implementationChecklist.length > 0 ? (
                        <div className="rounded-[1.25rem] border bg-slate-50 p-4">
                          <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-secondary)]">Implementation checklist</p>
                          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-[var(--text-secondary)]">
                            {(policy as any).aiGuidance.implementationChecklist.map((item: string, index: number) => <li key={index}>{item}</li>)}
                          </ul>
                        </div>
                      ) : null}
                      {Array.isArray((policy as any).aiGuidance?.revisionPrompts) && (policy as any).aiGuidance.revisionPrompts.length > 0 ? (
                        <div className="rounded-[1.25rem] border bg-slate-50 p-4">
                          <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-secondary)]">Revision prompts</p>
                          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-[var(--text-secondary)]">
                            {(policy as any).aiGuidance.revisionPrompts.map((item: string, index: number) => <li key={index}>{item}</li>)}
                          </ul>
                        </div>
                      ) : null}
                      {Array.isArray((policy as any).aiGuidance?.riskControls) && (policy as any).aiGuidance.riskControls.length > 0 ? (
                        <div className="rounded-[1.25rem] border bg-slate-50 p-4">
                          <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-secondary)]">Risk controls</p>
                          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-[var(--text-secondary)]">
                            {(policy as any).aiGuidance.riskControls.map((item: string, index: number) => <li key={index}>{item}</li>)}
                          </ul>
                        </div>
                      ) : null}
                    </div>
                  </Card>
                ) : null}

                <Card className="rounded-[2rem] border-white/70 bg-white/90 p-6 shadow-sm">
                  <h2 className="text-xl font-black text-blue-deep">Critique history</h2>
                  <div className="mt-4 space-y-3">
                    {critiques.length === 0 ? (
                      <p className="text-sm text-[var(--text-secondary)]">No critiques yet.</p>
                    ) : (
                      critiques.map((item) => {
                        const open = openCritique === item.id;
                        return (
                          <div key={item.id} className="overflow-hidden rounded-[1.25rem] border">
                            <button type="button" className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-blue-soft" onClick={() => setOpenCritique(open ? null : item.id)}>
                              <div>
                                <p className="font-bold text-blue-deep">Overall {item.overallScore ?? "—"}/100</p>
                                <p className="text-xs text-[var(--text-secondary)]">{formatWhen(item.createdAt)}</p>
                              </div>
                              {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                            </button>
                            {open ? (
                              <div className="space-y-3 px-4 pb-4">
                                {item.executiveVerdict ? <p className="text-sm text-blue-deep">{item.executiveVerdict}</p> : null}
                                {Array.isArray(item.priorityActions) && item.priorityActions.length > 0 ? (
                                  <div>
                                    <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-secondary)]">Priority actions</p>
                                    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[var(--text-secondary)]">
                                      {item.priorityActions.map((action: string, index: number) => <li key={index}>{action}</li>)}
                                    </ul>
                                  </div>
                                ) : null}
                              </div>
                            ) : null}
                          </div>
                        );
                      })
                    )}
                  </div>
                </Card>

                <Card className="rounded-[2rem] border-white/70 bg-white/90 p-6 shadow-sm">
                  <h2 className="text-xl font-black text-blue-deep">Simulation history</h2>
                  <div className="mt-4 space-y-3">
                    {simulations.length === 0 ? (
                      <p className="text-sm text-[var(--text-secondary)]">No simulations yet.</p>
                    ) : (
                      simulations.map((item) => {
                        const open = openSimulation === item.id;
                        const outputs = item.outputs ?? item.results ?? {};
                        return (
                          <div key={item.id} className="overflow-hidden rounded-[1.25rem] border">
                            <button type="button" className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-blue-soft" onClick={() => setOpenSimulation(open ? null : item.id)}>
                              <div>
                                <p className="font-bold text-blue-deep">Scenario run</p>
                                <p className="text-xs text-[var(--text-secondary)]">{formatWhen(item.createdAt)}</p>
                              </div>
                              {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                            </button>
                            {open ? (
                              <div className="grid gap-2 px-4 pb-4 sm:grid-cols-2">
                                {Object.entries(outputs).slice(0, 6).map(([key, value]) => (
                                  <div key={key} className="rounded-xl border bg-slate-50 px-3 py-2 text-sm">
                                    <span className="font-semibold text-blue-deep">{key}: </span>
                                    <span className="text-[var(--text-secondary)]">{typeof value === "object" ? JSON.stringify(value) : String(value)}</span>
                                  </div>
                                ))}
                              </div>
                            ) : null}
                          </div>
                        );
                      })
                    )}
                  </div>
                </Card>

                <Card className="rounded-[2rem] border-white/70 bg-white/90 p-6 shadow-sm">
                  <h2 className="text-xl font-black text-blue-deep">Source</h2>
                  {policy.source?.url ? (
                    <div className="mt-4 space-y-3">
                      {policy.source.publisher ? <p className="text-sm text-[var(--text-secondary)]">{policy.source.publisher}</p> : null}
                      <Button variant="outline" className="w-full gap-2 rounded-full" onClick={() => window.open(policy.source?.url, "_blank")}>
                        <Link2 size={15} />
                        Open source
                      </Button>
                    </div>
                  ) : (
                    <p className="mt-3 text-sm text-[var(--text-secondary)]">No external source link provided.</p>
                  )}
                </Card>
              </div>
            </div>
          ) : null}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
