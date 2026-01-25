"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import ProtectedRoute from "@/components/guards/ProtectedRoute";
import { Card } from "@/components/ui/card";
import { Trophy } from "lucide-react";

export default function RankingsPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-xl bg-blue-soft text-blue-electric">
            <Trophy size={26} strokeWidth={2.2} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-blue-deep">
              Rankings
            </h1>
            <p className="text-sm text-[var(--text-secondary)]">
              Compare countries, regions, and policy performance.
            </p>
          </div>
        </div>

        <Card className="p-6">
          <p className="text-sm text-[var(--text-secondary)]">
            Coming next. We’ll implement:
          </p>
          <ul className="list-disc ml-5 mt-3 text-sm text-[var(--text-secondary)] space-y-1">
            <li>Ranking criteria and scoring model</li>
            <li>Country profiles and indicators</li>
            <li>Leaderboard + filters</li>
          </ul>
        </Card>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
