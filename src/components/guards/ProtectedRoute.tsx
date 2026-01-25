"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/components/providers/UserProvider";

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
      router.push("/login");
      return;
    }

    if (!profile || !profile.onboardingComplete) {
      router.push("/onboarding");
      return;
    }
  }, [loading, user, profile, router]);

  if (loading) return null;

  if (!user) return null;

  if (!profile || !profile.onboardingComplete) return null;

  return <>{children}</>;
}
