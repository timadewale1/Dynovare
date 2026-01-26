"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import ProtectedRoute from "@/components/guards/ProtectedRoute";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useUser } from "@/components/providers/UserProvider";
import { db } from "@/lib/firebase";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { Sparkles, ArrowRight } from "lucide-react";
import Link from "next/link";


type MyCritiqueIndex = {
  policyId: string;
  policyTitle: string;
  policySlug?: string | null;
  lastCritiqueId?: string | null;
  lastOverallScore?: number | null;
  critiquesCount?: number | null;
  lastUpdatedAt?: any;
};

export default function MyCritiquesPage() {
  const router = useRouter();
  const { user } = useUser();

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<MyCritiqueIndex[]>([]);

  useEffect(() => {
    const load = async () => {
      if (!user) return;

      setLoading(true);
      const ref = collection(db, "users", user.uid, "critiques");
      const q = query(ref, orderBy("lastUpdatedAt", "desc"));
      const snap = await getDocs(q);

      const rows = snap.docs.map((d) => {
        const data = d.data() as any;
        return {
          policyId: d.id,
          policyTitle: data.policyTitle ?? "Untitled policy",
          policySlug: data.policySlug ?? null,
          lastCritiqueId: data.lastCritiqueId ?? null,
          lastOverallScore: typeof data.lastOverallScore === "number" ? data.lastOverallScore : null,
          critiquesCount: typeof data.critiquesCount === "number" ? data.critiquesCount : null,
          lastUpdatedAt: data.lastUpdatedAt ?? null,
        } as MyCritiqueIndex;
      });

      setItems(rows);
      setLoading(false);
    };

    load();
  }, [user]);

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-blue-deep">My Critiques</h1>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              One entry per policy. Open a policy to view the full critique history timeline.
            </p>
          </div>

          <Button onClick={() => router.push("/critique")} className="gap-2">
            <Sparkles size={16} />
            New critique
          </Button>
        </div>

        <Card className="p-6">
          {loading ? (
            <p className="text-sm text-[var(--text-secondary)]">Loading…</p>
          ) : items.length === 0 ? (
            <div className="text-sm text-[var(--text-secondary)]">
              <p>You haven’t critiqued any policies yet.</p>
              <p className="mt-2">Go to AI Critique to start.</p>
            </div>
          ) : (
            <div className="space-y-3">
             {items.map((it) => (
  <Link
    key={it.policyId}
    href={`/my-critiques/${it.policyId}`}
    className="block w-full text-left border rounded-xl p-4 hover:bg-blue-soft transition cursor-pointer"
  >
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="font-bold text-blue-deep truncate">{it.policyTitle}</p>

        <div className="mt-2 flex flex-wrap gap-3 text-sm text-[var(--text-secondary)]">
          <span>
            Latest score:{" "}
            <span className="font-semibold text-blue-deep">
              {it.lastOverallScore ?? "N/A"}
            </span>
          </span>
          <span>
            Critiques:{" "}
            <span className="font-semibold text-blue-deep">
              {it.critiquesCount ?? 0}
            </span>
          </span>
        </div>
      </div>

      <ArrowRight className="text-blue-electric mt-1" size={18} />
    </div>
  </Link>
))}

            </div>
          )}
        </Card>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
