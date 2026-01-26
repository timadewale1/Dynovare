"use client";

import { useEffect, useState } from "react";
import { fetchPolicies } from "@/lib/policiesRepo";
import type { Policy } from "@/lib/policyTypes";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText } from "lucide-react";

export default function PolicyPicker({
  onSelect,
}: {
  onSelect: (policy: Policy) => void;
}) {
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Policy[]>([]);

  const load = async () => {
    setLoading(true);
    const res = await fetchPolicies({ search, type: "all", state: "all" });
    setItems(res);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-lg font-bold text-blue-deep">Select a policy</h3>
          <p className="text-sm text-[var(--text-secondary)]">
            Choose an existing policy from the global repository.
          </p>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search policies…"
        />
        <Button onClick={load}>Search</Button>
      </div>

      {loading ? (
        <p className="text-sm text-[var(--text-secondary)]">Loading…</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-[var(--text-secondary)]">
          No policies found.
        </p>
      ) : (
        <div className="space-y-2 max-h-[420px] overflow-auto pr-1">
          {items.map((p) => (
            <button
              key={p.id}
              onClick={() => onSelect(p)}
              className="w-full text-left border rounded-xl p-4 hover:bg-blue-soft transition"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-bold text-blue-deep truncate">{p.title}</p>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">
                    {p.jurisdictionLevel === "federal" ? "Federal" : p.state} •{" "}
                    {p.policyYear ?? "Year N/A"}
                  </p>

                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge variant="outline">{p.type}</Badge>
                    <Badge variant="outline">{p.country}</Badge>
                  </div>
                </div>

                <div className="text-blue-electric">
                  <FileText size={18} />
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </Card>
  );
}
