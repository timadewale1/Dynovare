"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import ProtectedRoute from "@/components/guards/ProtectedRoute";
import { Card } from "@/components/ui/card";
import { useUser } from "@/components/providers/UserProvider";
import { FileText, BarChart3, Globe, Sparkles } from "lucide-react";

export default function DashboardPage() {
  const { profile } = useUser();

  const role = profile?.role ?? "policy_analyst";

  const roleCards = {
    student: [
      { title: "Saved Insights", value: "0", icon: FileText },
      { title: "Learning Modules", value: "0", icon: Sparkles },
      { title: "Countries Covered", value: "1", icon: Globe },
    ],
    researcher: [
      { title: "Policies Reviewed", value: "0", icon: FileText },
      { title: "AI Critiques Run", value: "0", icon: Sparkles },
      { title: "Countries Covered", value: "1", icon: Globe },
    ],
    organization: [
      { title: "Reports Generated", value: "0", icon: FileText },
      { title: "Comparisons Saved", value: "0", icon: Sparkles },
      { title: "Countries Covered", value: "1", icon: Globe },
    ],
    policy_analyst: [
      { title: "Policies Analyzed", value: "0", icon: FileText },
      { title: "Simulations Run", value: "0", icon: BarChart3 },
      { title: "Countries Covered", value: "1", icon: Globe },
    ],
  } as const;

  const stats = roleCards[role];

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <h1 className="text-2xl font-bold text-blue-deep mb-2">
          Welcome, {profile?.fullName}
        </h1>

        <p className="text-sm text-[var(--text-secondary)] mb-6">
          Role: {profile?.role}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats.map((stat) => (
            <Card
              key={stat.title}
              className="p-6 flex flex-row items-start justify-between"
            >
              {/* LEFT SIDE */}
              <div className="flex flex-col">
                <h3 className="text-lg font-bold text-blue-deep">
                  {stat.title}
                </h3>
                <p className="text-2xl font-bold mt-1">
                  {stat.value}
                </p>
              </div>

              {/* RIGHT SIDE ICON */}
              <div className="p-4 rounded-xl bg-blue-soft text-blue-electric">
                <stat.icon size={38} strokeWidth={2.2} />
              </div>
            </Card>
          ))}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
