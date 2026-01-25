"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import ProtectedRoute from "@/components/guards/ProtectedRoute";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRouter, useParams } from "next/navigation";
import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import type { Policy } from "@/lib/policyTypes";
import { Sparkles, BarChart3, ArrowLeft, Link2, Download } from "lucide-react";
import { getStorage, ref as storageRef, getDownloadURL } from "firebase/storage";

export default function PolicyDetailPage() {
  const router = useRouter();
  const params = useParams();

  // catch-all param: { slug: string[] }
  const slugParts = (params?.slug as string[]) ?? [];
  const key = slugParts.join("/"); // usually just 1 part
  const slugOrId = slugParts[slugParts.length - 1] || "";

  const [loading, setLoading] = useState(true);
  const [policy, setPolicy] = useState<Policy | null>(null);
  const [critiquesCount, setCritiquesCount] = useState(0);
  const [simulationsCount, setSimulationsCount] = useState(0);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);

      // 1) Try find by slug
      const bySlugSnap = await getDocs(
        query(collection(db, "policies"), where("slug", "==", slugOrId), limit(1))
      );

      let p: Policy | null = null;

      if (!bySlugSnap.empty) {
        const d = bySlugSnap.docs[0];
        p = { id: d.id, ...(d.data() as any) };
      } else {
        // 2) Fallback: treat slugOrId as docId
        const byId = await getDoc(doc(db, "policies", slugOrId));
        if (byId.exists()) {
          p = { id: byId.id, ...(byId.data() as any) };
        }
      }

      if (!p) {
        setPolicy(null);
        setLoading(false);
        return;
      }

      setPolicy(p);

      // counts (latest 5)
      const critiquesSnap = await getDocs(
        query(
          collection(db, "policies", p.id, "critiques"),
          orderBy("createdAt", "desc"),
          limit(5)
        )
      );
      const simsSnap = await getDocs(
        query(
          collection(db, "policies", p.id, "simulations"),
          orderBy("createdAt", "desc"),
          limit(5)
        )
      );

      setCritiquesCount(critiquesSnap.size);
      setSimulationsCount(simsSnap.size);
      setLoading(false);
    };

    if (slugOrId) load();
    else setLoading(false);
  }, [slugOrId, key]);

  const typeLabel = (t?: string) => {
    if (t === "uploaded") return <Badge>Uploaded</Badge>;
    if (t === "ai_generated") return <Badge variant="secondary">AI Generated</Badge>;
    if (t === "public_source") return <Badge variant="outline">Public Source</Badge>;
    return <Badge variant="outline">Unknown</Badge>;
  };

  const handleDownload = async () => {
    if (!policy?.storagePath) return;
    try {
      setDownloading(true);
      const storage = getStorage();
      const url = await getDownloadURL(storageRef(storage, policy.storagePath));
      window.open(url, "_blank");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => router.push("/policies")}
              className="gap-2"
            >
              <ArrowLeft size={16} />
              Back
            </Button>

            <div>
              <h1 className="text-2xl font-bold text-blue-deep">
                {loading ? "Loading policy…" : policy?.title ?? "Policy not found"}
              </h1>

              {!loading && policy && (
                <p className="text-sm text-[var(--text-secondary)] mt-1">
                  {policy.country} •{" "}
                  {policy.jurisdictionLevel === "federal" ? "Federal" : policy.state} •{" "}
                  {policy.policyYear ?? "Year N/A"}
                </p>
              )}
            </div>
          </div>

          {!loading && policy && (
            <div className="flex gap-2 flex-wrap">
{(policy.type === "uploaded" || policy.type === "ai_generated") && policy.storagePath && (
                <Button
                  variant="outline"
                  onClick={handleDownload}
                  disabled={downloading}
                  className="gap-2"
                >
                  <Download size={16} />
                  {downloading ? "Preparing…" : "Download PDF"}
                </Button>
              )}

              <Button
                onClick={() => router.push(`/critique?policyId=${policy.id}`)}
                className="gap-2"
              >
                <Sparkles size={16} />
                Critique
              </Button>

              <Button
                variant="outline"
                onClick={() => router.push(`/simulations?policyId=${policy.id}`)}
                className="gap-2"
              >
                <BarChart3 size={16} />
                Simulate
              </Button>
            </div>
          )}
        </div>

        {!loading && !policy && (
          <Card className="p-6">
            <p className="text-sm text-[var(--text-secondary)]">
              No policy found for: <span className="font-semibold">{slugOrId}</span>
            </p>
          </Card>
        )}

        {policy && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card className="p-6">
                <div className="flex items-center gap-2 flex-wrap mb-3">
                  {typeLabel(policy.type)}
                  <Badge variant="outline">
                    {policy.jurisdictionLevel === "federal" ? "Federal" : "State"}
                  </Badge>
                  {policy.jurisdictionLevel === "state" && policy.state && (
                    <Badge variant="outline">{policy.state}</Badge>
                  )}
                  {policy.policyYear && <Badge variant="outline">{policy.policyYear}</Badge>}
                </div>

                {policy.summary ? (
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                    {policy.summary}
                  </p>
                ) : (
                  <p className="text-sm text-[var(--text-secondary)]">No summary provided yet.</p>
                )}

                {policy.tags?.length ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {policy.tags.map((t) => (
                      <Badge key={t} variant="secondary">
                        {t}
                      </Badge>
                    ))}
                  </div>
                ) : null}
              </Card>

              <Card className="p-6">
                <h2 className="text-lg font-bold text-blue-deep mb-2">Critique history</h2>
                <p className="text-sm text-[var(--text-secondary)]">
                  {critiquesCount === 0
                    ? "No critiques yet. Run the first critique from the AI Critique page."
                    : `Loaded: ${critiquesCount} recent critique(s).`}
                </p>
              </Card>

              <Card className="p-6">
                <h2 className="text-lg font-bold text-blue-deep mb-2">Simulation history</h2>
                <p className="text-sm text-[var(--text-secondary)]">
                  {simulationsCount === 0
                    ? "No simulations yet. Run the first simulation from the Simulations page."
                    : `Loaded: ${simulationsCount} recent simulation(s).`}
                </p>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="p-6">
                <h2 className="text-lg font-bold text-blue-deep mb-3">Source</h2>

                {policy.source?.url ? (
                  <div className="space-y-2">
                    {policy.source.publisher && (
                      <p className="text-sm">
                        <span className="font-semibold">Publisher:</span>{" "}
                        <span className="text-[var(--text-secondary)]">
                          {policy.source.publisher}
                        </span>
                      </p>
                    )}

                    <Button
                      variant="outline"
                      className="gap-2"
                      onClick={() => window.open(policy.source!.url!, "_blank")}
                    >
                      <Link2 size={16} />
                      Open source link
                    </Button>

                    {policy.source.licenseNote && (
                      <p className="text-xs text-[var(--text-secondary)]">
                        {policy.source.licenseNote}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-[var(--text-secondary)]">
                    No external source link provided.
                  </p>
                )}
              </Card>
<Card className="p-6">
  <h2 className="text-lg font-bold text-blue-deep mb-3">
    Quick actions
  </h2>

  <div className="space-y-2">
    {/* Download (uploaded policies only) */}
{(policy.type === "uploaded" || policy.type === "ai_generated") && policy.storagePath && (
      <Button
        variant="outline"
        className="w-full gap-2"
        onClick={handleDownload}
        disabled={downloading}
      >
        <Download size={16} />
        {downloading ? "Preparing download…" : "Download policy (PDF)"}
      </Button>
    )}

    <Button
      className="w-full gap-2"
      onClick={() => router.push(`/critique?policyId=${policy.id}`)}
    >
      <Sparkles size={16} />
      Run AI Critique
    </Button>

    <Button
      variant="outline"
      className="w-full gap-2"
      onClick={() => router.push(`/simulations?policyId=${policy.id}`)}
    >
      <BarChart3 size={16} />
      Run Simulation
    </Button>
  </div>
</Card>

            </div>
          </div>
        )}
      </DashboardLayout>
    </ProtectedRoute>
  );
}
