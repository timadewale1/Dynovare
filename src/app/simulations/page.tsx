"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import ProtectedRoute from "@/components/guards/ProtectedRoute";
import { Card } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

export default function SimulationsPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-xl bg-blue-soft text-blue-electric">
            <BarChart3 size={26} strokeWidth={2.2} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-blue-deep">
              Simulations
            </h1>
            <p className="text-sm text-[var(--text-secondary)]">
              Model outcomes and compare policy scenarios.
            </p>
          </div>
        </div>

        <Card className="p-6">
          <p className="text-sm text-[var(--text-secondary)]">
            Coming next. We’ll add:
          </p>
          <ul className="list-disc ml-5 mt-3 text-sm text-[var(--text-secondary)] space-y-1">
            <li>Scenario inputs (tariffs, subsidies, access targets)</li>
            <li>Charts + comparison views</li>
            <li>Export simulation results</li>
          </ul>
        </Card>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
