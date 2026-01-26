"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/components/providers/UserProvider";

function FullPageLoader({ label }: { label: string }) {
  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
      <div className="bg-white border border-[var(--border-color)] rounded-xl px-6 py-5 shadow-sm">
        <p className="font-semibold text-blue-deep">{label}</p>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Please wait…
        </p>
      </div>
    </div>
  );
}

export default function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, profile, loading } = useUser();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    if (!profile || !profile.onboardingComplete) {
      router.replace("/onboarding");
      return;
    }
  }, [loading, user, profile, router]);

  // ✅ Show loader instead of returning null (prevents "stuck on previous page" feel)
  if (loading) return <FullPageLoader label="Checking your account…" />;

  if (!user) return <FullPageLoader label="Redirecting to login…" />;

  if (!profile || !profile.onboardingComplete)
    return <FullPageLoader label="Redirecting to onboarding…" />;

  return <>{children}</>;
}
