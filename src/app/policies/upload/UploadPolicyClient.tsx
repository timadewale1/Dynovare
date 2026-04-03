"use client";

import * as React from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import ProtectedRoute from "@/components/guards/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import toast from "react-hot-toast";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@/components/providers/UserProvider";
import { NIGERIA_COUNTRY, NIGERIA_STATES } from "@/lib/ngStates";
import { createUploadedPolicy } from "@/lib/policyWrites";
import { getStorage, ref, uploadBytesResumable } from "firebase/storage";
import { ArrowLeft, FileUp, Lock, ShieldCheck, Sparkles } from "lucide-react";
import { extractPolicyText } from "@/lib/extractText";
import { POLICY_DOMAINS, POLICY_ENERGY_SOURCES, policyDomainLabel, policyEnergySourceLabel } from "@/lib/policyTaxonomy";

const DOMAIN_TO_SECTOR: Record<string, string> = {
  electricity: "Electricity",
  cooking: "Clean Cooking",
  transport: "Transport",
  industry: "Industry",
  agriculture: "Agriculture",
  cross_sector: "Climate & Emissions",
};

export default function UploadPolicyClient() {
  const router = useRouter();
  const { user, profile } = useUser();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect");

  const [title, setTitle] = React.useState("");
  const [summary, setSummary] = React.useState("");
  const [jurisdictionLevel, setJurisdictionLevel] = React.useState<"federal" | "state">("federal");
  const [stateValue, setStateValue] = React.useState<string>("");
  const [energySource, setEnergySource] = React.useState<string>("mixed");
  const [domain, setDomain] = React.useState<string>("cross_sector");
  const [policyYear, setPolicyYear] = React.useState<string>("");
  const [tags, setTags] = React.useState<string>("");
  const [sourcePublisher, setSourcePublisher] = React.useState("");
  const [sourceUrl, setSourceUrl] = React.useState("");
  const [file, setFile] = React.useState<File | null>(null);
  const [uploading, setUploading] = React.useState(false);
  const [progress, setProgress] = React.useState<number>(0);

  const tagArray = React.useMemo(
    () => tags.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean),
    [tags]
  );

  const yearNumber = React.useMemo(() => {
    const n = Number(policyYear);
    return Number.isFinite(n) && n > 1900 && n < 2200 ? n : null;
  }, [policyYear]);

  const validate = () => {
    if (!user || !profile) {
      toast.error("Please sign in first");
      router.push("/login");
      return false;
    }
    if (!title.trim()) {
      toast.error("Add a policy title");
      return false;
    }
    if (jurisdictionLevel === "state" && !stateValue) {
      toast.error("Choose a state");
      return false;
    }
    if (!file) {
      toast.error("Upload a PDF or DOCX file");
      return false;
    }

    const okTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!okTypes.includes(file.type)) {
      toast.error("Only PDF or DOCX files are supported");
      return false;
    }

    if (policyYear && !yearNumber) {
      toast.error("Policy year must be valid");
      return false;
    }
    if (sourceUrl && !/^https?:\/\//i.test(sourceUrl.trim())) {
      toast.error("Source link must start with http:// or https://");
      return false;
    }
    return true;
  };

  const handleUpload = async () => {
    if (!validate()) return;

    try {
      setUploading(true);
      setProgress(0);

      const tmpId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      const ext = file!.name.split(".").pop() ?? "file";
      const storagePath = `policies/uploads/${user!.uid}/${tmpId}.${ext}`;
      const storage = getStorage();
      const storageRef = ref(storage, storagePath);

      await new Promise<void>((resolve, reject) => {
        const task = uploadBytesResumable(storageRef, file!);
        task.on(
          "state_changed",
          (snap) => setProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
          reject,
          () => resolve()
        );
      });

      const extractedText = await extractPolicyText(file!);
      const result = await createUploadedPolicy({
        uid: user!.uid,
        uploaderName: profile!.fullName,
        email: user!.email,
        title: title.trim(),
        summary: summary.trim(),
        country: NIGERIA_COUNTRY,
        jurisdictionLevel,
        state: jurisdictionLevel === "state" ? stateValue : undefined,
        policyYear: yearNumber ?? undefined,
        sector: DOMAIN_TO_SECTOR[domain] ?? "Climate & Emissions",
        energySource: energySource as any,
        domain: domain as any,
        tags: tagArray,
        sourcePublisher: sourcePublisher.trim(),
        sourceUrl: sourceUrl.trim(),
        contentText: extractedText,
        storagePath,
        type: "uploaded",
      });

      toast.success("Policy added to your private workspace");
      router.push(redirect ? `${redirect}?policyId=${result.policyId}` : `/policies/${result.slug}`);
    } catch (e) {
      console.error(e);
      toast.error("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <section className="overflow-hidden rounded-[2.25rem] bg-[linear-gradient(135deg,#001b33_0%,#002c52_50%,#0073d1_100%)] p-8 text-white shadow-[0_30px_90px_rgba(0,56,105,0.16)] fade-up">
            <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-white/90">
                  <Lock size={12} />
                  Private workspace upload
                </div>
                <h1 className="mt-5 text-3xl font-black tracking-tight md:text-4xl">
                  Bring your policy files into a workspace built for review and revision.
                </h1>
                <p className="mt-4 max-w-2xl text-white/78">
                  Upload source material, organize it by domain and energy source, then move straight into critique,
                  simulation, or guided editing without publishing it publicly.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-[1.6rem] border border-white/10 bg-white/8 p-5">
                  <ShieldCheck className="text-white/88" size={20} />
                  <p className="mt-4 text-lg font-bold">Private by default</p>
                  <p className="mt-1 text-sm text-white/70">Nothing here appears in the public repository automatically.</p>
                </div>
                <div className="rounded-[1.6rem] border border-white/10 bg-white/8 p-5">
                  <Sparkles className="text-white/88" size={20} />
                  <p className="mt-4 text-lg font-bold">Ready for AI</p>
                  <p className="mt-1 text-sm text-white/70">Extracted text is prepared for critique, simulation, and drafting support.</p>
                </div>
              </div>
            </div>
          </section>

          <div className="flex items-center justify-between gap-3">
            <Button variant="outline" className="rounded-full gap-2" onClick={() => router.push("/policies")}>
              <ArrowLeft size={15} />
              Back to Policy Studio
            </Button>
            {uploading ? (
              <p className="text-sm font-medium text-[var(--text-secondary)]">Uploading file and preparing text... {progress}%</p>
            ) : null}
          </div>

          <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="premium-card aurora-border rounded-[2rem] p-6">
              <div className="space-y-6">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-[var(--text-secondary)]">Document details</p>
                  <h2 className="mt-2 text-2xl font-black text-blue-deep">Describe the policy clearly before you upload it.</h2>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">Policy title</Label>
                  <input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Federal Electricity Reform Act, Lagos EV Strategy, National LPG Plan..."
                    className="studio-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="summary">Short summary</Label>
                  <textarea
                    id="summary"
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    placeholder="What problem does the policy address, and what is it trying to achieve?"
                    className="studio-textarea min-h-[140px]"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Jurisdiction</Label>
                    <Select value={jurisdictionLevel} onValueChange={(v) => setJurisdictionLevel(v as any)}>
                      <SelectTrigger className="studio-input h-12">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="federal">Federal</SelectItem>
                        <SelectItem value="state">State</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>State</Label>
                    <Select value={stateValue} onValueChange={setStateValue} disabled={jurisdictionLevel !== "state"}>
                      <SelectTrigger className="studio-input h-12">
                        <SelectValue placeholder={jurisdictionLevel === "state" ? "Select a state" : "Not needed"} />
                      </SelectTrigger>
                      <SelectContent>
                        {NIGERIA_STATES.map((state) => (
                          <SelectItem key={state} value={state}>
                            {state}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="policyYear">Policy year</Label>
                    <input
                      id="policyYear"
                      value={policyYear}
                      onChange={(e) => setPolicyYear(e.target.value)}
                      placeholder="2024"
                      inputMode="numeric"
                      className="studio-input"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Energy source</Label>
                    <Select value={energySource} onValueChange={setEnergySource}>
                      <SelectTrigger className="studio-input h-12">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {POLICY_ENERGY_SOURCES.map((item) => (
                          <SelectItem key={item} value={item}>
                            {policyEnergySourceLabel(item)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Domain</Label>
                    <Select value={domain} onValueChange={setDomain}>
                      <SelectTrigger className="studio-input h-12">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {POLICY_DOMAINS.map((item) => (
                          <SelectItem key={item} value={item}>
                            {policyDomainLabel(item)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tags">Tags</Label>
                  <input
                    id="tags"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="mini-grid, tariff, grid reform, cooking access"
                    className="studio-input"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="publisher">Source publisher</Label>
                    <input
                      id="publisher"
                      value={sourcePublisher}
                      onChange={(e) => setSourcePublisher(e.target.value)}
                      placeholder="Ministry of Power, REA, World Bank..."
                      className="studio-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sourceUrl">Source link</Label>
                    <input
                      id="sourceUrl"
                      value={sourceUrl}
                      onChange={(e) => setSourceUrl(e.target.value)}
                      placeholder="https://..."
                      className="studio-input"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="file">Upload file</Label>
                  <input
                    id="file"
                    type="file"
                    accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                    className="studio-input flex items-center py-3 file:mr-4 file:rounded-full file:border-0 file:bg-[rgba(0,115,209,0.08)] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-[#0073d1] hover:file:bg-[rgba(0,115,209,0.12)]"
                  />
                  <p className="text-sm text-[var(--text-secondary)]">
                    Supported formats: PDF and DOCX. The uploaded file stays private in your workspace.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <section className="premium-card rounded-[2rem] p-6">
                <p className="text-xs uppercase tracking-[0.22em] text-[var(--text-secondary)]">What happens next</p>
                <div className="mt-4 space-y-4">
                  {[
                    "The file is stored privately under your account.",
                    "Text is extracted so AI can critique, simulate, and help revise it.",
                    "The upload opens directly in Policy Studio for editing and exports.",
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-3 rounded-[1.25rem] border border-[rgba(0,115,209,0.08)] bg-white/80 p-4">
                      <div className="mt-0.5 rounded-full bg-[rgba(0,115,209,0.08)] p-2 text-[#0073d1]">
                        <ShieldCheck size={14} />
                      </div>
                      <p className="text-sm leading-6 text-[var(--text-secondary)]">{item}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="premium-card rounded-[2rem] p-6">
                <p className="text-xs uppercase tracking-[0.22em] text-[var(--text-secondary)]">Current setup</p>
                <div className="mt-4 space-y-3">
                  <div className="rounded-[1.35rem] bg-[rgba(0,115,209,0.04)] p-4">
                    <p className="text-sm font-semibold text-blue-deep">Country focus</p>
                    <p className="mt-1 text-sm text-[var(--text-secondary)]">{NIGERIA_COUNTRY}</p>
                  </div>
                  <div className="rounded-[1.35rem] bg-[rgba(0,115,209,0.04)] p-4">
                    <p className="text-sm font-semibold text-blue-deep">Selected domain</p>
                    <p className="mt-1 text-sm text-[var(--text-secondary)]">{policyDomainLabel(domain)}</p>
                  </div>
                  <div className="rounded-[1.35rem] bg-[rgba(0,115,209,0.04)] p-4">
                    <p className="text-sm font-semibold text-blue-deep">Energy source</p>
                    <p className="mt-1 text-sm text-[var(--text-secondary)]">{policyEnergySourceLabel(energySource)}</p>
                  </div>
                </div>

                <Button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="mt-6 h-12 w-full rounded-full bg-[#0073d1] text-white hover:bg-[#003869]"
                >
                  <FileUp size={16} />
                  {uploading ? "Uploading policy..." : "Upload to workspace"}
                </Button>
              </section>
            </div>
          </section>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
