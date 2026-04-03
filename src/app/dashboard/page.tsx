"use client";

import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import ProtectedRoute from "@/components/guards/ProtectedRoute";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useUser } from "@/components/providers/UserProvider";
import {
  FileText,
  BarChart3,
  Globe,
  Sparkles,
  Upload,
  ArrowRight,
  MapPinned,
  ShieldCheck,
  Wand2,
} from "lucide-react";
import { getDashboardStats, type ActivityItem } from "@/lib/dashboardStats";
import { useRouter } from "next/navigation";
import Link from "next/link";
import NigeriaPolicyMap from "@/components/public/NigeriaPolicyMap";

type PublicInsights = {
  totals: {
    policies: number;
    critiques: number;
    averageScore: number | null;
  };
  leaderboard: { rank: number; title: string; slug: string | null; score: number; state: string | null }[];
  stateLeaderboard: { state: string; score: number | null; policies: number }[];
  stateScores: { state: string; score: number | null; policies: number }[];
};

function iconForActivity(type: ActivityItem["type"]) {
  if (type === "upload") return <Upload size={18} className="text-[#0073d1]" />;
  if (type === "critique") return <Sparkles size={18} className="text-[#0073d1]" />;
  return <BarChart3 size={18} className="text-[#0073d1]" />;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, profile } = useUser();

  const [loading, setLoading] = useState(true);
  const [myUploadsCount, setMyUploadsCount] = useState(0);
  const [myCritiquesCount, setMyCritiquesCount] = useState(0);
  const [mySimulationsCount, setMySimulationsCount] = useState(0);
  const [globalPoliciesCount, setGlobalPoliciesCount] = useState(0);
  const [workspaceAverageScore, setWorkspaceAverageScore] = useState<number | null>(null);
  const [stateSignalsCount, setStateSignalsCount] = useState(0);
  const [recentActivities, setRecentActivities] = useState<ActivityItem[]>([]);
  const [insights, setInsights] = useState<PublicInsights | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      setLoading(true);

      const [stats, insightRes] = await Promise.all([
        getDashboardStats(user.uid),
        fetch("/api/public/insights"),
      ]);

      setMyUploadsCount(stats.myUploadsCount);
      setMyCritiquesCount(stats.myCritiquesCount);
      setMySimulationsCount(stats.mySimulationsCount);
      setGlobalPoliciesCount(insightRes.ok ? 0 : stats.globalPoliciesCount);
      setWorkspaceAverageScore(stats.workspaceAverageScore ?? null);
      setStateSignalsCount(stats.stateSignalsCount ?? 0);
      setRecentActivities(stats.recentActivities);

      try {
        const insightData = await insightRes.json();
        if (insightRes.ok) {
          setInsights(insightData);
          setGlobalPoliciesCount(Number(insightData?.totals?.policies ?? 0));
        }
      } catch {
        // soft-fail
      }

      setLoading(false);
    };

    void load();
  }, [user]);

  const stats = useMemo(
    () => [
      { title: "Workspace policies", value: String(myUploadsCount), icon: FileText, href: "/policies" },
      { title: "AI critiques", value: String(myCritiquesCount), icon: Sparkles, href: "/my-critiques" },
      { title: "Simulations", value: String(mySimulationsCount), icon: BarChart3, href: "/my-simulations" },
      { title: "Public policies", value: String(globalPoliciesCount), icon: Globe, href: "/repository" },
    ],
    [globalPoliciesCount, myCritiquesCount, mySimulationsCount, myUploadsCount]
  );

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="w-full max-w-full space-y-6 overflow-x-clip">
          <section className="overflow-hidden rounded-[2.25rem] bg-[linear-gradient(135deg,#001b33_0%,#002c52_52%,#0073d1_100%)] p-6 md:p-8 text-white shadow-[0_30px_90px_rgba(0,56,105,0.16)]">
            <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
              <div>
                <Badge variant="outline" className="border-white/20 bg-white/10 text-white">Workspace home</Badge>
                <h1 className="mt-5 text-3xl font-black tracking-tight md:text-4xl">
                  Welcome back{profile?.fullName ? `, ${profile.fullName}` : ""}.
                </h1>
                <p className="mt-4 max-w-2xl text-white/76">
                  Pick up where you left off, move your best draft forward, and keep key public signals close while you work.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Button className="rounded-full bg-white text-blue-deep hover:bg-white/90" onClick={() => router.push("/ai-generate")}>
                    <Wand2 size={16} className="mr-2" />
                    Generate draft
                  </Button>
                  <Button className="rounded-full border border-white/20 bg-transparent text-white hover:bg-white/10" onClick={() => router.push("/policies/upload")}>
                    <Upload size={16} className="mr-2" />
                    Upload policy
                  </Button>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  ["Role", profile?.role ?? "policy_analyst"],
                  ["Workspace avg", workspaceAverageScore ? `${workspaceAverageScore}/100` : "-"],
                  ["Your critiques", String(myCritiquesCount)],
                  ["State signals", String(stateSignalsCount)],
                ].map(([title, value]) => (
                  <Card key={title} className="rounded-[1.75rem] border-white/10 bg-white/8 p-5 text-white">
                    <p className="text-xs uppercase tracking-[0.18em] text-white/68">{title}</p>
                    <p className="mt-2 max-w-full truncate text-[1.7rem] leading-none font-black capitalize tabular-nums">{loading ? "..." : value}</p>
                  </Card>
                ))}
              </div>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => (
              <Link key={stat.title} href={stat.href} className="block">
                <Card className="premium-card rounded-[2rem] p-6 transition hover:-translate-y-1 hover:shadow-[0_26px_80px_rgba(0,115,209,0.12)]">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-secondary)]">{stat.title}</p>
                      <p className="mt-3 truncate text-[1.9rem] leading-none font-black tabular-nums text-blue-deep">{loading ? "..." : stat.value}</p>
                    </div>
                    <div className="shrink-0 rounded-2xl bg-[rgba(0,115,209,0.08)] p-3 text-[#0073d1]">
                      <stat.icon size={24} />
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </section>

          <div className="grid gap-6 lg:grid-cols-[1.02fr_0.98fr]">
            <Card className="premium-card max-w-full overflow-hidden rounded-[2rem] p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-xs uppercase tracking-[0.22em] text-[var(--text-secondary)]">National signals</p>
                  <h2 className="mt-2 text-xl font-black text-blue-deep">Track where momentum is building across Nigeria</h2>
                </div>
                <MapPinned className="text-[#0073d1]" />
              </div>
              <div className="mt-5">
                <NigeriaPolicyMap
                  scores={insights?.stateScores ?? []}
                  compact
                  onSelectState={(state) => router.push(`/repository?jurisdictionLevel=state&state=${encodeURIComponent(state)}`)}
                />
              </div>
            </Card>

            <div className="space-y-6">
              <Card className="premium-card max-w-full overflow-hidden rounded-[2rem] p-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-[rgba(0,115,209,0.09)] p-3 text-[#0073d1]">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.22em] text-[var(--text-secondary)]">Quick actions</p>
                    <h2 className="mt-1 text-xl font-black text-blue-deep">Choose the next action that moves the draft forward.</h2>
                  </div>
                </div>
                <div className="mt-5 space-y-3">
                  {[
                    { label: "Open Policy Studio", href: "/policies" },
                    { label: "Generate a new draft", href: "/ai-generate" },
                    { label: "Run AI critique", href: "/critique" },
                    { label: "Run simulations", href: "/simulations" },
                    { label: "Open rankings intelligence", href: "/rankings" },
                  ].map((item) => (
                    <Button key={item.label} variant="outline" className="w-full justify-between rounded-full" onClick={() => router.push(item.href)}>
                      {item.label} <ArrowRight size={15} />
                    </Button>
                  ))}
                </div>
              </Card>

              <Card className="premium-card max-w-full overflow-hidden rounded-[2rem] p-6">
                <p className="text-xs uppercase tracking-[0.22em] text-[var(--text-secondary)]">Recent work</p>
                <h2 className="mt-2 text-xl font-black text-blue-deep">Latest workspace activity</h2>
                {loading ? (
                  <p className="mt-4 text-sm text-[var(--text-secondary)]">Loading...</p>
                ) : recentActivities.length === 0 ? (
                  <p className="mt-4 text-sm text-[var(--text-secondary)]">No recent activity yet. Upload a policy or create a draft to get started.</p>
                ) : (
                  <div className="mt-5 space-y-3">
                    {recentActivities.map((activity, index) => (
                      <Link
                        key={`${activity.type}-${index}-${activity.policySlug ?? activity.policyTitle}`}
                        href={activity.policySlug ? `/policies/${activity.policySlug}` : "/policies"}
                        className="block rounded-[1.4rem] border bg-white/80 p-4 transition hover:bg-[rgba(0,115,209,0.05)]"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            {iconForActivity(activity.type)}
                            <div>
                              <p className="font-bold text-blue-deep">{activity.title}</p>
                              <p className="text-sm text-[var(--text-secondary)]">{activity.policyTitle}</p>
                            </div>
                          </div>
                          <ArrowRight size={15} className="text-[#0073d1]" />
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          </div>
        </div>

      </DashboardLayout>
    </ProtectedRoute>
  );
}
