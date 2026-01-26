"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import ProtectedRoute from "@/components/guards/ProtectedRoute";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useUser } from "@/components/providers/UserProvider";
import {
  FileText,
  BarChart3,
  Globe,
  Sparkles,
  Upload,
  ArrowRight,
} from "lucide-react";
import { getDashboardStats, type ActivityItem } from "@/lib/dashboardStats";
import { useRouter } from "next/navigation";
import Link from "next/link";

function iconForActivity(type: ActivityItem["type"]) {
  if (type === "upload") return <Upload size={18} className="text-blue-electric" />;
  if (type === "critique") return <Sparkles size={18} className="text-blue-electric" />;
  return <BarChart3 size={18} className="text-blue-electric" />;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, profile } = useUser();

  const [loading, setLoading] = useState(true);

  const [myUploadsCount, setMyUploadsCount] = useState(0);
  const [myCritiquesCount, setMyCritiquesCount] = useState(0);
  const [mySimulationsCount, setMySimulationsCount] = useState(0);
  const [globalPoliciesCount, setGlobalPoliciesCount] = useState(0);

  const [recentActivities, setRecentActivities] = useState<ActivityItem[]>([]);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      setLoading(true);

      const stats = await getDashboardStats(user.uid);

      setMyUploadsCount(stats.myUploadsCount);
      setMyCritiquesCount(stats.myCritiquesCount);
      setMySimulationsCount(stats.mySimulationsCount);
      setGlobalPoliciesCount(stats.globalPoliciesCount);

      setRecentActivities(stats.recentActivities);

      setLoading(false);
    };

    load();
  }, [user]);

  // ✅ Keep your role system but upgrade the KPI cards with real counts
  const role = profile?.role ?? "policy_analyst";

  const roleCards = {
    student: [
      { title: "My Uploaded Policies", value: String(myUploadsCount), icon: Upload, href: "/uploaded-policies" },
      { title: "My Critiques", value: String(myCritiquesCount), icon: Sparkles, href: "/my-critiques" },
            { title: "My Simulations", value: String(mySimulationsCount), icon: BarChart3, href: "/my-simulations" },

      { title: "All Policies", value: String(globalPoliciesCount), icon: Globe, href: "/policies" },
    ],
    researcher: [
      { title: "My Uploaded Policies", value: String(myUploadsCount), icon: Upload, href: "/uploaded-policies" },
      { title: "My Critiques", value: String(myCritiquesCount), icon: Sparkles, href: "/my-critiques" },
            { title: "My Simulations", value: String(mySimulationsCount), icon: BarChart3, href: "/my-simulations" },

      { title: "All Policies", value: String(globalPoliciesCount), icon: Globe, href: "/policies" },
    ],
    organization: [
      { title: "My Uploaded Policies", value: String(myUploadsCount), icon: Upload, href: "/uploaded-policies" },
      { title: "My Simulations", value: String(mySimulationsCount), icon: BarChart3, href: "/my-simulations" },
      { title: "All Policies", value: String(globalPoliciesCount), icon: Globe, href: "/policies" },
    ],
    policy_analyst: [
      { title: "My Uploaded Policies", value: String(myUploadsCount), icon: Upload, href: "/uploaded-policies" },
      { title: "My Simulations", value: String(mySimulationsCount), icon: BarChart3, href: "/my-simulations" },
            { title: "My Critiques", value: String(myCritiquesCount), icon: Sparkles, href: "/my-critiques" },

      { title: "All Policies", value: String(globalPoliciesCount), icon: Globe, href: "/policies" },
    ],
  } as const;

  const stats = roleCards[role];

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-blue-deep">
            Welcome, {profile?.fullName}
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Role: {profile?.role}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {stats.map((stat) => (
            <Link key={stat.title} href={stat.href} className="block">
              <Card className="p-6 flex flex-row items-start justify-between hover:bg-blue-soft transition">
                <div className="flex flex-col">
                  <h3 className="text-lg font-bold text-blue-deep">
                    {stat.title}
                  </h3>
                  <p className="text-2xl font-bold mt-1">
                    {loading ? "…" : stat.value}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-blue-soft text-blue-electric">
                  <stat.icon size={38} strokeWidth={2.2} />
                </div>
              </Card>
            </Link>
          ))}
        </div>

        {/* Quick actions + Recent activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick actions */}
          <Card className="p-6 lg:col-span-1">
            <h2 className="text-lg font-bold text-blue-deep mb-4">
              Quick actions
            </h2>

            <div className="space-y-3">
              <Button
                className="w-full justify-between"
                onClick={() => router.push("/policies/upload")}
              >
                Upload a policy <ArrowRight size={16} />
              </Button>

              <Button
                variant="outline"
                className="w-full justify-between"
                onClick={() => router.push("/policies")}
              >
                Browse repository <ArrowRight size={16} />
              </Button>

              <Button
                variant="outline"
                className="w-full justify-between"
                onClick={() => router.push("/critique")}
              >
                Run AI critique <ArrowRight size={16} />
              </Button>

              <Button
                variant="outline"
                className="w-full justify-between"
                onClick={() => router.push("/simulations")}
              >
                Run simulation <ArrowRight size={16} />
              </Button>

              {/* ✅ We’ll build this next */}
              <Button
                variant="outline"
                className="w-full justify-between"
                onClick={() => router.push("/ai-generate")}
              >
                Generate policy (AI) <ArrowRight size={16} />
              </Button>
            </div>
          </Card>

          {/* Recent activities */}
          <Card className="p-6 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-blue-deep">
                Recent activities
              </h2>
              <Button variant="outline" onClick={() => router.push("/policies")}>
                View repository
              </Button>
            </div>

            {loading ? (
              <p className="text-sm text-[var(--text-secondary)]">Loading…</p>
            ) : recentActivities.length === 0 ? (
              <div className="text-sm text-[var(--text-secondary)]">
                <p>No recent activity yet.</p>
                <p className="mt-2">
                  Upload a policy, run critique, or run simulations to see activity here.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentActivities.map((a, idx) => (
                  <Link
                    key={`${a.type}-${idx}-${a.policySlug ?? a.policyTitle}`}
                    href={a.policySlug ? `/policies/${a.policySlug}` : "/policies"}
                    className="block w-full text-left border rounded-xl p-4 hover:bg-blue-soft transition"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {iconForActivity(a.type)}

                        <div className="min-w-0">
                          <p className="font-bold text-blue-deep truncate">
                            {a.title}{" "}
                            <span className="font-normal text-[var(--text-secondary)]">
                              {a.policyTitle}
                            </span>
                          </p>
                          <p className="text-xs text-[var(--text-secondary)] mt-1">
                            {a.type === "upload"
                              ? "Added to repository"
                              : a.type === "critique"
                              ? "AI critique saved"
                              : "Simulation saved"}
                          </p>
                        </div>
                      </div>

                      <ArrowRight size={16} className="text-blue-electric" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
