"use client";

import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import ProtectedRoute from "@/components/guards/ProtectedRoute";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Download,
  FileText,
  Link2,
  ShieldCheck,
  Sparkles,
  Wand2,
} from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, getDocs, limit, orderBy, query } from "firebase/firestore";
import { getStorage, ref as storageRef, getDownloadURL } from "firebase/storage";
import { policyDomainLabel, policyEnergySourceLabel } from "@/lib/policyTaxonomy";
import { importPublicPolicyToWorkspace } from "@/lib/policyWrites";
import { useUser } from "@/components/providers/UserProvider";
import toast from "react-hot-toast";

function formatWhenMs(ms: number | null | undefined) {
  try {
    if (!ms) return "";
    return new Date(ms).toLocaleString();
  } catch {
    return "";
  }
}

type PublicPolicyDetail = {
  id: string;
  title: string;
  slug?: string | null;
  summary?: string | null;
  contentText?: string | null;
  editorSections?: { id: string; title: string; body: string }[];
  aiEvidence?: { title: string; url: string; whyRelevant?: string }[];
  country?: string | null;
  jurisdictionLevel?: "federal" | "state" | null;
  state?: string | null;
  policyYear?: number | null;
  type?: string | null;
  sector?: string | null;
  energySource?: string | null;
  domain?: string | null;
  tags?: string[];
  publicPdfUrl?: string | null;
  storagePath?: string | null;
  source?: { publisher?: string; url?: string; licenseNote?: string } | null;
  updatedAtMs?: number | null;
  createdAtMs?: number | null;
};

export default function RepositoryPolicyDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user, profile } = useUser();
  const slugParts = (params?.slug as string[]) ?? [];
  const slugOrId = slugParts[slugParts.length - 1] || "";

  const [loading, setLoading] = useState(true);
  const [policy, setPolicy] = useState<PublicPolicyDetail | null>(null);
  const [critiques, setCritiques] = useState<any[]>([]);
  const [simulations, setSimulations] = useState<any[]>([]);
  const [openCritique, setOpenCritique] = useState<string | null>(null);
  const [openSimulation, setOpenSimulation] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/public/policy?slugOrId=${encodeURIComponent(slugOrId)}`);
        const data = await res.json();
        const current = data?.policy ?? null;
        if (!current) {
          setPolicy(null);
          setLoading(false);
          return;
        }

        setPolicy(current);

        const [critSnap, simSnap] = await Promise.all([
          getDocs(query(collection(db, "policies", current.id, "critiques"), orderBy("createdAt", "desc"), limit(8))),
          getDocs(query(collection(db, "policies", current.id, "simulations"), orderBy("createdAt", "desc"), limit(8))),
        ]);

        setCritiques(critSnap.docs.map((doc) => ({ id: doc.id, ...(doc.data() as any) })));
        setSimulations(simSnap.docs.map((doc) => ({ id: doc.id, ...(doc.data() as any) })));
      } catch (error) {
        console.error(error);
        setPolicy(null);
      } finally {
        setLoading(false);
      }
    };

    if (slugOrId) void load();
    else setLoading(false);
  }, [slugOrId]);

  const handleDownload = async () => {
    if (!policy) return;
    if (policy.publicPdfUrl) {
      window.open(policy.publicPdfUrl, "_blank");
      return;
    }
    if (!policy.storagePath) return;

    try {
      setDownloading(true);
      const storage = getStorage();
      const url = await getDownloadURL(storageRef(storage, policy.storagePath));
      window.open(url, "_blank");
    } finally {
      setDownloading(false);
    }
  };

  const addToWorkspace = async () => {
    if (!user || !policy) return;
    try {
      setAdding(true);
      const imported = await importPublicPolicyToWorkspace({
        uid: user.uid,
        userName: profile?.fullName ?? null,
        userEmail: user.email ?? null,
        publicPolicyId: policy.id,
      });
      toast.success(imported.reused ? "Workspace copy already exists. Opening it now..." : "Policy added to your workspace");
      router.push(`/policies/${imported.slug}`);
    } catch (error: any) {
      console.error(error);
      toast.error(error?.message || "Could not add this policy to your workspace");
    } finally {
      setAdding(false);
    }
  };

  const jurisdictionText = useMemo(() => {
    if (!policy) return "";
    return policy.jurisdictionLevel === "federal" ? "Federal" : policy.state || "State";
  }, [policy]);

  const keyEvidence = policy?.aiEvidence?.slice(0, 4) ?? [];
  const sections = policy?.editorSections?.filter((section) => section.body?.trim()) ?? [];

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <section className="overflow-hidden rounded-[2.3rem] bg-[linear-gradient(135deg,#081f30_0%,#103851_50%,#125669_100%)] p-8 text-white shadow-[0_30px_90px_rgba(8,31,48,0.16)] fade-up">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Button variant="outline" className="rounded-full border-white/20 bg-white/10 text-white hover:bg-white/15" onClick={() => router.push("/repository")}>
                <ArrowLeft size={15} />
                Back to repository
              </Button>

              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="border-white/20 bg-white/10 text-white">Repository policy</Badge>
                {policy?.energySource ? <Badge variant="outline" className="border-white/20 bg-white/10 text-white">{policyEnergySourceLabel(policy.energySource)}</Badge> : null}
                {policy?.domain ? <Badge variant="outline" className="border-white/20 bg-white/10 text-white">{policyDomainLabel(policy.domain)}</Badge> : null}
              </div>
            </div>

            <div className="mt-8 grid gap-6 lg:grid-cols-[1.08fr_0.92fr] lg:items-end">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-white/68">Signed-in repository record</p>
                <h1 className="mt-4 text-3xl font-black tracking-tight md:text-4xl">{loading ? "Loading policy..." : policy?.title ?? "Policy not found"}</h1>
                {!loading && policy ? (
                  <p className="mt-4 max-w-3xl text-base leading-7 text-white/78">
                    {policy.summary || "Review the policy record, related critique history, simulation history, and source material without leaving the workspace."}
                  </p>
                ) : null}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  { label: "Jurisdiction", value: jurisdictionText || "-" },
                  { label: "Policy year", value: policy?.policyYear ? String(policy.policyYear) : "-" },
                  { label: "Critiques logged", value: String(critiques.length) },
                  { label: "Simulations logged", value: String(simulations.length) },
                ].map((item) => (
                  <Card key={item.label} className="rounded-[1.7rem] border-white/10 bg-white/8 p-5 text-white">
                    <p className="text-xs uppercase tracking-[0.2em] text-white/66">{item.label}</p>
                    <p className="mt-3 truncate text-[1.7rem] leading-none font-black tabular-nums">{item.value}</p>
                  </Card>
                ))}
              </div>
            </div>
          </section>

          {policy ? (
            <div className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
              <div className="space-y-6">
                <Card className="premium-card rounded-[2rem] p-6">
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-[rgba(18,86,105,0.08)] p-3 text-[#125669]"><FileText size={20} /></div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.22em] text-[var(--text-secondary)]">Policy snapshot</p>
                      <h2 className="mt-1 text-xl font-black text-blue-deep">Review the public record quickly.</h2>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    <Badge variant="outline">{policy.type === "ai_generated" ? "Curated AI draft" : policy.type === "uploaded" ? "Curated upload" : "Public source"}</Badge>
                    <Badge variant="outline">{policy.country ?? "Nigeria"}</Badge>
                    <Badge variant="outline">{jurisdictionText}</Badge>
                    {policy.policyYear ? <Badge variant="outline">{policy.policyYear}</Badge> : null}
                    {policy.sector ? <Badge variant="outline">{policy.sector}</Badge> : null}
                  </div>

                  {policy.tags?.length ? <div className="mt-4 flex flex-wrap gap-2">{policy.tags.map((tag) => <Badge key={tag} variant="secondary">{tag}</Badge>)}</div> : null}

                  <div className="mt-6 grid gap-4 md:grid-cols-2">
                    <div className="rounded-[1.5rem] bg-[rgba(18,86,105,0.04)] p-4">
                      <p className="text-sm font-semibold text-blue-deep">Last updated</p>
                      <p className="mt-2 text-sm text-[var(--text-secondary)]">{formatWhenMs(policy.updatedAtMs) || "Not available"}</p>
                    </div>
                    <div className="rounded-[1.5rem] bg-[rgba(18,86,105,0.04)] p-4">
                      <p className="text-sm font-semibold text-blue-deep">Created</p>
                      <p className="mt-2 text-sm text-[var(--text-secondary)]">{formatWhenMs(policy.createdAtMs) || "Not available"}</p>
                    </div>
                  </div>
                </Card>

                <Card className="premium-card rounded-[2rem] p-6">
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-[rgba(18,86,105,0.08)] p-3 text-[#125669]"><ShieldCheck size={20} /></div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.22em] text-[var(--text-secondary)]">Policy content</p>
                      <h2 className="mt-1 text-xl font-black text-blue-deep">Read the parts that matter most.</h2>
                    </div>
                  </div>

                  {sections.length > 0 ? (
                    <div className="mt-5 space-y-4">
                      {sections.slice(0, 6).map((section) => (
                        <div key={section.id} className="rounded-[1.5rem] border border-[rgba(18,86,105,0.08)] bg-white/85 p-5">
                          <p className="text-lg font-bold text-blue-deep">{section.title}</p>
                          <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[var(--text-secondary)]">{section.body}</p>
                        </div>
                      ))}
                    </div>
                  ) : policy.contentText ? (
                    <div className="mt-5 rounded-[1.5rem] border border-[rgba(18,86,105,0.08)] bg-white/85 p-5">
                      <p className="whitespace-pre-wrap text-sm leading-7 text-[var(--text-secondary)]">{policy.contentText.slice(0, 4000)}</p>
                    </div>
                  ) : (
                    <p className="mt-5 text-sm text-[var(--text-secondary)]">No policy text is available on this public record.</p>
                  )}
                </Card>

                <Card className="premium-card rounded-[2rem] p-6">
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-[rgba(18,86,105,0.08)] p-3 text-[#125669]"><Sparkles size={20} /></div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.22em] text-[var(--text-secondary)]">Critique history</p>
                      <h2 className="mt-1 text-xl font-black text-blue-deep">See how this policy has been assessed.</h2>
                    </div>
                  </div>

                  {critiques.length === 0 ? (
                    <p className="mt-5 text-sm text-[var(--text-secondary)]">No public critiques have been logged yet.</p>
                  ) : (
                    <div className="mt-5 space-y-3">
                      {critiques.map((critique) => {
                        const isOpen = openCritique === critique.id;
                        return (
                          <div key={critique.id} className="overflow-hidden rounded-[1.5rem] border border-[rgba(18,86,105,0.08)] bg-white/85">
                            <button type="button" onClick={() => setOpenCritique(isOpen ? null : critique.id)} className="flex w-full items-center justify-between px-5 py-4 text-left transition hover:bg-[rgba(18,86,105,0.04)]">
                              <div>
                                <p className="font-bold text-blue-deep">Overall score {typeof critique.overallScore === "number" ? `${critique.overallScore}/100` : "-"}</p>
                                <p className="mt-1 text-xs text-[var(--text-secondary)]">{critique?.createdAt?.toDate?.()?.toLocaleString?.() || "Date unavailable"}</p>
                              </div>
                              {isOpen ? <ChevronUp className="text-[#125669]" size={18} /> : <ChevronDown className="text-[#125669]" size={18} />}
                            </button>
                            {isOpen && critique.summary ? <div className="px-5 pb-5 text-sm leading-6 text-[var(--text-secondary)]">{critique.summary}</div> : null}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </Card>

                <Card className="premium-card rounded-[2rem] p-6">
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-[rgba(18,86,105,0.08)] p-3 text-[#125669]"><Wand2 size={20} /></div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.22em] text-[var(--text-secondary)]">Simulation history</p>
                      <h2 className="mt-1 text-xl font-black text-blue-deep">Explore public scenario runs.</h2>
                    </div>
                  </div>

                  {simulations.length === 0 ? (
                    <p className="mt-5 text-sm text-[var(--text-secondary)]">No public simulations have been logged yet.</p>
                  ) : (
                    <div className="mt-5 space-y-3">
                      {simulations.map((simulation) => {
                        const isOpen = openSimulation === simulation.id;
                        const inputs = simulation.inputs ?? {};
                        return (
                          <div key={simulation.id} className="overflow-hidden rounded-[1.5rem] border border-[rgba(18,86,105,0.08)] bg-white/85">
                            <button type="button" onClick={() => setOpenSimulation(isOpen ? null : simulation.id)} className="flex w-full items-center justify-between px-5 py-4 text-left transition hover:bg-[rgba(18,86,105,0.04)]">
                              <div>
                                <p className="font-bold text-blue-deep">{inputs?.scenarioName ?? "Simulation scenario"}</p>
                                <p className="mt-1 text-xs text-[var(--text-secondary)]">{simulation?.createdAt?.toDate?.()?.toLocaleString?.() || "Date unavailable"}</p>
                              </div>
                              {isOpen ? <ChevronUp className="text-[#125669]" size={18} /> : <ChevronDown className="text-[#125669]" size={18} />}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </Card>
              </div>

              <div className="space-y-6">
                <Card className="premium-card rounded-[2rem] p-6">
                  <p className="text-xs uppercase tracking-[0.22em] text-[var(--text-secondary)]">Actions</p>
                  <h2 className="mt-2 text-xl font-black text-blue-deep">Use this policy inside your workspace.</h2>
                  <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">Bring it into Policy Studio, run critique, or test scenarios without leaving the signed-in flow.</p>

                  <div className="mt-5 space-y-3">
                    <Button className="h-12 w-full rounded-full bg-[#125669] hover:bg-[#0f4b5d]" onClick={addToWorkspace} disabled={adding}>
                      <Sparkles size={15} />
                      {adding ? "Adding to workspace..." : "Add to workspace"}
                    </Button>
                    <Button variant="outline" className="h-12 w-full rounded-full" onClick={() => router.push(`/critique?policyId=${policy.id}`)}>
                      <Sparkles size={15} />
                      Run AI critique
                    </Button>
                    <Button variant="outline" className="h-12 w-full rounded-full" onClick={() => router.push(`/simulations?policyId=${policy.id}`)}>
                      <Wand2 size={15} />
                      Run simulation
                    </Button>
                  </div>
                </Card>

                <Card className="premium-card rounded-[2rem] p-6">
                  <p className="text-xs uppercase tracking-[0.22em] text-[var(--text-secondary)]">Downloads and source</p>
                  <div className="mt-4 space-y-3">
                    {(policy.publicPdfUrl || policy.storagePath) ? (
                      <Button variant="outline" className="h-12 w-full rounded-full justify-between" onClick={handleDownload} disabled={downloading}>
                        <span className="inline-flex items-center gap-2">
                          <Download size={15} />
                          {downloading ? "Preparing download..." : "Download PDF"}
                        </span>
                      </Button>
                    ) : null}
                    {policy.source?.url ? (
                      <Button variant="outline" className="h-12 w-full rounded-full justify-between" onClick={() => window.open(policy.source?.url, "_blank")}>
                        <span className="inline-flex items-center gap-2">
                          <Link2 size={15} />
                          Open source link
                        </span>
                      </Button>
                    ) : null}
                  </div>
                </Card>

                <Card className="premium-card rounded-[2rem] p-6">
                  <p className="text-xs uppercase tracking-[0.22em] text-[var(--text-secondary)]">Evidence and references</p>
                  {keyEvidence.length > 0 ? (
                    <div className="mt-4 space-y-3">
                      {keyEvidence.map((item) => (
                        <a key={`${item.title}-${item.url}`} href={item.url} target="_blank" rel="noreferrer" className="block rounded-[1.25rem] border border-[rgba(18,86,105,0.08)] bg-white/85 p-4 transition hover:-translate-y-0.5 hover:border-[rgba(18,86,105,0.22)]">
                          <p className="font-semibold text-blue-deep">{item.title}</p>
                          {item.whyRelevant ? <p className="mt-2 text-sm text-[var(--text-secondary)]">{item.whyRelevant}</p> : null}
                        </a>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-4 text-sm text-[var(--text-secondary)]">No additional evidence links are attached to this public record yet.</p>
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
