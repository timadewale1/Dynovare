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
import { BarChart3, ArrowRight, TrendingUp } from "lucide-react";
import Link from "next/link";

type MySimulationIndex = {
  policyId: string;
  policyTitle: string;
  policySlug?: string | null;
  lastSimulationId?: string | null;
  simulationsCount?: number | null;
  lastUpdatedAt?: any;
};

export default function MySimulationsPage() {
  const router = useRouter();
  const { user } = useUser();

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<MySimulationIndex[]>([]);

  useEffect(() => {
    const load = async () => {
      if (!user) return;

      setLoading(true);
      const ref = collection(db, "users", user.uid, "simulations");
      const q = query(ref, orderBy("lastUpdatedAt", "desc"));
      const snap = await getDocs(q);

      const rows = snap.docs.map((d) => {
        const data = d.data() as any;
        return {
          policyId: d.id,
          policyTitle: data.policyTitle ?? "Untitled policy",
          policySlug: data.policySlug ?? null,
          lastSimulationId: data.lastSimulationId ?? null,
          simulationsCount: typeof data.simulationsCount === "number" ? data.simulationsCount : null,
          lastUpdatedAt: data.lastUpdatedAt ?? null,
        } as MySimulationIndex;
      });

      setItems(rows);
      setLoading(false);
    };

    void load();
  }, [user]);

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <section className="mb-6 overflow-hidden rounded-[2rem] bg-[linear-gradient(135deg,#001b33_0%,#002c52_52%,#0073d1_100%)] p-7 text-white shadow-[0_24px_70px_rgba(0,56,105,0.18)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-4xl font-black tracking-tight">My simulations</h1>
              <p className="mt-3 max-w-2xl text-sm text-white/78">
                Reopen scenario runs, compare modeling activity by policy, and keep track of which ideas have been stress-tested.
              </p>
            </div>
            <Button onClick={() => router.push("/simulations")} className="rounded-full bg-white text-blue-deep hover:bg-white/90">
              <BarChart3 size={16} className="mr-2" />
              New simulation
            </Button>
          </div>
        </section>

        <div className="mb-6 grid gap-4 md:grid-cols-3">
          <Card className="premium-card rounded-[1.5rem] p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-secondary)]">Policies modeled</p>
            <p className="mt-2 text-3xl font-black text-blue-deep">{loading ? "..." : items.length}</p>
          </Card>
          <Card className="premium-card rounded-[1.5rem] p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-secondary)]">Total runs</p>
            <p className="mt-2 text-3xl font-black text-blue-deep">{loading ? "..." : items.reduce((sum, item) => sum + Number(item.simulationsCount ?? 0), 0)}</p>
          </Card>
          <Card className="premium-card rounded-[1.5rem] p-5">
            <div className="flex items-center gap-2 text-blue-deep">
              <TrendingUp size={16} />
              <p className="text-xs uppercase tracking-[0.18em]">Why this matters</p>
            </div>
            <p className="mt-3 text-sm text-[var(--text-secondary)]">Simulation history helps you see which policies have been pressure-tested and which still need stronger evidence.</p>
          </Card>
        </div>

        <Card className="premium-card p-6">
          {loading ? (
            <p className="text-sm text-[var(--text-secondary)]">Loading...</p>
          ) : items.length === 0 ? (
            <div className="text-sm text-[var(--text-secondary)]">
              <p>You have not run any simulations yet.</p>
              <p className="mt-2">Open Scenario Modeling to start your first run.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((it) => (
                <Link
                  key={it.policyId}
                  href={`/my-simulations/${it.policyId}`}
                  className="block rounded-[1.4rem] border bg-white/80 p-4 transition hover:bg-blue-soft"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-bold text-blue-deep">{it.policyTitle}</p>
                      <div className="mt-2 flex flex-wrap gap-3 text-sm text-[var(--text-secondary)]">
                        <span>Runs: <span className="font-semibold text-blue-deep">{it.simulationsCount ?? 0}</span></span>
                      </div>
                    </div>
                    <ArrowRight className="mt-1 text-blue-electric" size={18} />
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
