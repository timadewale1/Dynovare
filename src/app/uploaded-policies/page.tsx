"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import ProtectedRoute from "@/components/guards/ProtectedRoute";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useUser } from "@/components/providers/UserProvider";
import { db } from "@/lib/firebase";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import Link from "next/link";
import toast from "react-hot-toast";
import { ArrowRight, Trash2 } from "lucide-react";

type UploadedPolicyRow = {
  id: string;
  title: string;
  slug: string;
  country?: string | null;
  state?: string | null;
  jurisdictionLevel?: "federal" | "state" | null;
  policyYear?: number | null;
  type?: string | null;
  createdAt?: any;
};

export default function UploadedPoliciesPage() {
  const { user } = useUser();

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<UploadedPolicyRow[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!user) return;

      setLoading(true);

      // Pull from global policies collection (source of truth)
      const q = query(
        collection(db, "policies"),
        where("createdByUid", "==", user.uid),
        orderBy("createdAt", "desc"),
        limit(100)
      );

      const snap = await getDocs(q);
      const rows = snap.docs.map((d) => {
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
        } as UploadedPolicyRow;
      });

      setItems(rows);
      setLoading(false);
    };

    load();
  }, [user]);

  const handleDelete = async (policyId: string) => {
    if (!user) return;

    const ok = window.confirm(
      "Delete this policy? This will remove it from the repository and your uploaded list."
    );
    if (!ok) return;

    try {
      setDeletingId(policyId);

      // 1) Delete user-owned index doc (if you store it)
      // (If you don’t have this doc, deleteDoc will just fail — we’ll ignore it safely.)
      try {
        await deleteDoc(doc(db, "users", user.uid, "policies", policyId));
      } catch {}

      // 2) Delete main policy doc
      await deleteDoc(doc(db, "policies", policyId));

      // 3) Optimistic UI update
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
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-blue-deep">Uploaded Policies</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Manage policies you uploaded. You can delete them anytime.
          </p>
        </div>

        <Card className="p-6">
          {loading ? (
            <p className="text-sm text-[var(--text-secondary)]">Loading…</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-[var(--text-secondary)]">
              You haven’t uploaded any policies yet.
            </p>
          ) : (
            <div className="space-y-3">
              {items.map((p) => (
                <div
                  key={p.id}
                  className="border rounded-xl p-4 hover:bg-blue-soft transition flex items-start justify-between gap-3"
                >
                  {/* Left: title + meta + arrow link */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <Link
                        href={`/policies/${p.slug}`}
                        className="min-w-0 flex-1"
                      >
                        <p className="font-bold text-blue-deep truncate">
                          {p.title}
                        </p>

                        <div className="mt-2 flex flex-wrap gap-2">
                          <Badge variant="outline">{p.country ?? "Nigeria"}</Badge>
                          {p.jurisdictionLevel && (
                            <Badge variant="outline">
                              {p.jurisdictionLevel === "federal"
                                ? "Federal"
                                : "State"}
                            </Badge>
                          )}
                          {p.state && <Badge variant="outline">{p.state}</Badge>}
                          {p.policyYear && (
                            <Badge variant="outline">{p.policyYear}</Badge>
                          )}
                          {p.type && <Badge variant="outline">{p.type}</Badge>}
                        </div>
                      </Link>

                      <Link
                        href={`/policies/${p.slug}`}
                        className="shrink-0 mt-1"
                        aria-label="Open policy"
                      >
                        <ArrowRight className="text-blue-electric" size={18} />
                      </Link>
                    </div>
                  </div>

                  {/* Right: delete */}
                  <Button
                    variant="outline"
                    className="gap-2 text-red-600 border-red-200 hover:bg-red-50"
                    onClick={() => handleDelete(p.id)}
                    disabled={deletingId === p.id}
                  >
                    <Trash2 size={16} />
                    {deletingId === p.id ? "Deleting…" : "Delete"}
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
