"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import ProtectedRoute from "@/components/guards/ProtectedRoute";
import { Card } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

export default function CritiquePage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-xl bg-blue-soft text-blue-electric">
            <Sparkles size={26} strokeWidth={2.2} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-blue-deep">
              AI Critique
            </h1>
            <p className="text-sm text-[var(--text-secondary)]">
              Evaluate a policy draft and receive structured feedback.
            </p>
          </div>
        </div>

        <Card className="p-6">
          <p className="text-sm text-[var(--text-secondary)]">
            Coming next. We’ll implement:
          </p>
          <ul className="list-disc ml-5 mt-3 text-sm text-[var(--text-secondary)] space-y-1">
            <li>Paste or upload policy text</li>
            <li>AI critique rubric (clarity, feasibility, equity, cost)</li>
            <li>Save critique outputs to Firestore</li>
          </ul>
        </Card>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
