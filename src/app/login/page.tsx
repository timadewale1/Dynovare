"use client";

import { Suspense, useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import AuthCard from "@/components/auth/AuthCard";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { Eye, EyeOff } from "lucide-react";
import Image from "next/image";
import { controlledGoogleSignIn } from "@/lib/authHelpers";
import { shouldGoToOnboarding } from "@/lib/redirectAfterAuth";
import Link from "next/link";

function LoginPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const routeAfterAuth = async (uid: string) => {
    const goOnboard = await shouldGoToOnboarding(uid);
    const nextPath = searchParams.get("next");
    router.push(goOnboard ? "/onboarding" : nextPath || "/dashboard");
  };

  const handleLogin = async () => {
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      toast.success("Welcome back!");
      await routeAfterAuth(cred.user.uid);
    } catch (error: any) {
      if (error.code === "auth/user-not-found") {
        toast.error("No account found");
      } else if (error.code === "auth/wrong-password") {
        toast.error("Incorrect password");
      } else if (error.code === "auth/operation-not-allowed") {
        toast.error("Please sign in with Google");
      } else {
        toast.error("Please sign in with Google");
      }
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const user = await controlledGoogleSignIn(email, password);
      toast.success("Signed in with Google");
      await routeAfterAuth(user.uid);
    } catch (error: any) {
      if (error.code === "PASSWORD_REQUIRED_FOR_LINKING") {
        toast.error("Please enter your email and password to link Google");
      } else {
        toast.error("Google sign-in failed");
      }
    }
  };

  return (
    <AuthCard
      title="Sign in"
      subtitle="Open your workspace to draft, critique, simulate, and export policy work."
    >
      <div className="space-y-4">
        <input
          type="email"
          placeholder="Email address"
          className="studio-input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            className="studio-input pr-11"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-3.5 text-gray-500"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        <button
          onClick={handleLogin}
          className="w-full rounded-full bg-[#0073d1] px-4 py-3 font-semibold text-white shadow-[0_16px_32px_rgba(0,115,209,0.2)] transition hover:bg-[#003869]"
        >
          Sign in
        </button>

        <button
          onClick={handleGoogleLogin}
          className="flex w-full items-center justify-center gap-2 rounded-full border bg-white px-4 py-3 font-semibold transition hover:bg-slate-50"
        >
          <Image src="/google.svg" alt="Google" width={18} height={18} />
          Sign in with Google
        </button>

        <Link href="/forgot-password" className="block text-center text-sm text-blue-electric">
          Forgot password?
        </Link>

        <p className="text-center text-sm text-[var(--text-secondary)]">
          Don't have an account?{" "}
          <Link href="/register" className="font-semibold text-blue-electric">
            Create one
          </Link>
        </p>
      </div>
    </AuthCard>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <AuthCard
          title="Sign in"
          subtitle="Open your workspace to draft, critique, simulate, and export policy work."
        >
          <div className="space-y-4">
            <div className="studio-input animate-pulse bg-slate-100" />
            <div className="studio-input animate-pulse bg-slate-100" />
            <div className="h-12 rounded-full bg-slate-100" />
          </div>
        </AuthCard>
      }
    >
      <LoginPageInner />
    </Suspense>
  );
}
