"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import ProtectedRoute from "@/components/guards/ProtectedRoute";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useUser } from "@/components/providers/UserProvider";
import { db } from "@/lib/firebase";
import { collection, deleteDoc, doc, getDocs, limit, orderBy, query } from "firebase/firestore";
import Link from "next/link";
import toast from "react-hot-toast";
import { ArrowRight, Trash2, Upload } from "lucide-react";
import { useRouter } from "next/navigation";

type UploadedPolicyRow = {
  id: string;
  title: string;
  slug?: string;
  country?: string | null;
  state?: string | null;
  jurisdictionLevel?: "federal" | "state" | null;
  policyYear?: number | null;
  type?: string | null;
  createdAt?: any;
};

export default function UploadedPoliciesPage() {
  const { user } = useUser();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<UploadedPolicyRow[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      setLoading(true);
      const snap = await getDocs(
        query(collection(db, "users", user.uid, "policies"), orderBy("createdAt", "desc"), limit(100))
      );

      setItems(
        snap.docs.map((d) => {
          const data = d.data() as any;
          return {
            id: d.id,
            title: data.title ?? "Untitled policy",
            slug: data.slug,
            country: data.country ?? null,
            state: data.state ?? null,
            jurisdictionLevel: data.jurisdictionLevel ?? null,
            policyYear: data.policyYear ?? null,
            type: data.type ?? null,
            createdAt: data.createdAt ?? null,
          };
        })
      );
      setLoading(false);
    };

    void load();
  }, [user]);

  const handleDelete = async (policyId: string) => {
    if (!user) return;
    const ok = window.confirm("Delete this policy from your private workspace?");
    if (!ok) return;

    try {
      setDeletingId(policyId);
      await deleteDoc(doc(db, "users", user.uid, "policies", policyId));
      setItems((prev) => prev.filter((p) => p.id !== policyId));
      toast.success("Policy deleted");
    } catch (e) {
      console.error(e);
      toast.error("Failed to delete policy");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <section className="mb-6 overflow-hidden rounded-[2rem] bg-[linear-gradient(135deg,#001b33_0%,#002c52_52%,#0073d1_100%)] p-7 text-white shadow-[0_24px_70px_rgba(0,56,105,0.18)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-4xl font-black tracking-tight">My policies</h1>
              <p className="mt-3 max-w-2xl text-sm text-white/78">
                Every policy here stays in your private workspace until you decide what to do with it next.
              </p>
            </div>
            <Button onClick={() => router.push("/policies/upload")} className="rounded-full bg-white text-blue-deep hover:bg-white/90">
              <Upload size={16} className="mr-2" />
              Upload new policy
            </Button>
          </div>
        </section>

        <Card className="premium-card rounded-3xl p-6">
          {loading ? (
            <p className="text-sm text-[var(--text-secondary)]">Loading...</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-[var(--text-secondary)]">You have not added any workspace policies yet.</p>
          ) : (
            <div className="space-y-3">
              {items.map((p) => (
                <div key={p.id} className="flex items-start justify-between gap-3 rounded-2xl border bg-white/90 p-4 transition hover:bg-blue-soft">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <Link href={`/policies/${p.slug ?? p.id}`} className="min-w-0 flex-1">
                        <p className="truncate font-bold text-blue-deep">{p.title}</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <Badge variant="outline">{p.country ?? "Nigeria"}</Badge>
                          {p.jurisdictionLevel && (
                            <Badge variant="outline">{p.jurisdictionLevel === "federal" ? "Federal" : "State"}</Badge>
                          )}
                          {p.state && <Badge variant="outline">{p.state}</Badge>}
                          {p.policyYear && <Badge variant="outline">{p.policyYear}</Badge>}
                          {p.type && <Badge variant="outline">{p.type}</Badge>}
                        </div>
                      </Link>

                      <Link href={`/policies/${p.slug ?? p.id}`} className="mt-1 shrink-0" aria-label="Open policy">
                        <ArrowRight className="text-blue-electric" size={18} />
                      </Link>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    className="gap-2 border-red-200 text-red-600 hover:bg-red-50"
                    onClick={() => handleDelete(p.id)}
                    disabled={deletingId === p.id}
                  >
                    <Trash2 size={16} />
                    {deletingId === p.id ? "Deleting..." : "Delete"}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
