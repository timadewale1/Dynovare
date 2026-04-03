"use client";

import { useEffect, useState } from "react";
import { fetchPolicies } from "@/lib/policiesRepo";
import type { Policy } from "@/lib/policyTypes";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Sparkles, FileText, ArrowRight } from "lucide-react";
import { useUser } from "@/components/providers/UserProvider";
import { policyDomainLabel, policyEnergySourceLabel } from "@/lib/policyTaxonomy";

export default function PolicyPicker({
  onSelect,
}: {
  onSelect: (policy: Policy) => void;
}) {
  const { user } = useUser();
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Policy[]>([]);

  const load = async () => {
    if (!user) {
      setItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const res = await fetchPolicies({ uid: user.uid, search, type: "all", state: "all" });
    setItems(res);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  return (
    <section className="premium-card aurora-border rounded-[2rem] p-6 fade-up">
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(0,115,209,0.1)] bg-[rgba(0,115,209,0.06)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#0073d1]">
              <Sparkles size={12} />
              Choose a working policy
            </div>
            <h3 className="mt-4 text-2xl font-black text-blue-deep">
              Start from the policy already in your workspace.
            </h3>
            <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
              Pick a private policy or draft, then move straight into critique, simulation, or guided revision.
            </p>
          </div>

          <div className="rounded-[1.5rem] border border-[rgba(0,115,209,0.08)] bg-white/80 px-4 py-3 text-sm text-[var(--text-secondary)]">
            Only your workspace items appear here.
          </div>
        </div>

        <div className="flex flex-col gap-3 md:flex-row">
          <label className="group flex flex-1 items-center gap-3 rounded-[1.2rem] border border-[var(--line)] bg-white px-4 py-3 shadow-sm transition hover:border-[rgba(0,115,209,0.35)]">
            <Search className="text-[var(--text-secondary)] transition group-focus-within:text-[#0073d1]" size={18} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search title, state, domain, or tags"
              className="w-full bg-transparent text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-secondary)]"
            />
          </label>
          <Button onClick={load} className="h-[52px] rounded-[1.2rem] bg-[#0073d1] px-6 hover:bg-[#003869]">
            Refresh list
          </Button>
        </div>

        {loading ? (
          <div className="grid gap-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="animate-pulse rounded-[1.6rem] border border-[rgba(0,115,209,0.08)] bg-white/70 p-5"
              >
                <div className="h-4 w-40 rounded-full bg-slate-200" />
                <div className="mt-3 h-3 w-64 rounded-full bg-slate-100" />
                <div className="mt-4 flex gap-2">
                  <div className="h-7 w-20 rounded-full bg-slate-100" />
                  <div className="h-7 w-24 rounded-full bg-slate-100" />
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-[1.6rem] border border-dashed border-[rgba(0,115,209,0.18)] bg-[rgba(232,244,255,0.65)] px-5 py-8 text-center">
            <p className="text-base font-semibold text-blue-deep">No matching policies yet.</p>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              Upload a policy or generate a new draft to begin.
            </p>
          </div>
        ) : (
          <div className="max-h-[560px] space-y-3 overflow-auto pr-1">
            {items.map((policy) => (
              <button
                key={policy.id}
                type="button"
                onClick={() => onSelect(policy)}
                className="group w-full rounded-[1.6rem] border border-[rgba(0,115,209,0.08)] bg-white/88 p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[rgba(0,115,209,0.22)] hover:shadow-[0_20px_50px_rgba(0,56,105,0.08)]"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-[rgba(0,115,209,0.08)] p-2 text-[#0073d1]">
                        <FileText size={16} />
                      </span>
                      <p className="break-anywhere text-lg font-black text-blue-deep transition group-hover:text-[#0073d1]">
                        {policy.title}
                      </p>
                    </div>

                    <p className="mt-2 text-sm text-[var(--text-secondary)]">
                      {policy.jurisdictionLevel === "federal" ? "Federal" : policy.state || "State policy"}
                      {" · "}
                      {policy.policyYear ?? "Year unavailable"}
                      {policy.summary ? ` · ${policy.summary}` : ""}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <Badge variant="outline">{policy.type === "ai_generated" ? "AI draft" : "Uploaded policy"}</Badge>
                      {policy.energySource ? (
                        <Badge variant="outline">{policyEnergySourceLabel(policy.energySource)}</Badge>
                      ) : null}
                      {policy.domain ? <Badge variant="outline">{policyDomainLabel(policy.domain)}</Badge> : null}
                      {policy.tags?.slice(0, 2).map((tag) => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start rounded-full bg-[rgba(0,115,209,0.06)] px-4 py-2 text-sm font-semibold text-[#0073d1]">
                    Continue
                    <ArrowRight size={15} />
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
