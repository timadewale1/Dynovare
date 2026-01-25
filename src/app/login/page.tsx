"use client";

import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import AuthCard from "@/components/auth/AuthCard";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Eye, EyeOff } from "lucide-react";
import Image from "next/image";
import { controlledGoogleSignIn } from "@/lib/authHelpers";
import { shouldGoToOnboarding } from "@/lib/redirectAfterAuth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const routeAfterAuth = async (uid: string) => {
    const goOnboard = await shouldGoToOnboarding(uid);
    router.push(goOnboard ? "/onboarding" : "/dashboard");
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
        toast.error("Please enter your email & password to link Google");
      } else {
        toast.error("Google sign-in failed");
      }
    }
  };

  return (
    <AuthCard>
      <h1 className="text-2xl font-bold text-blue-deep mb-4">Sign in</h1>

      <div className="space-y-4">
        <input
          type="email"
          placeholder="Email address"
          className="w-full border rounded-md px-3 py-2"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            className="w-full border rounded-md px-3 py-2 pr-10"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-2.5 text-gray-500"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        <button
          onClick={handleLogin}
          className="w-full border btn-primary py-2 rounded-md font-semibold"
        >
          Sign in
        </button>

        <button
          onClick={handleGoogleLogin}
          className="w-full border btn-secondary py-2 rounded-md flex items-center justify-center gap-2"
        >
          <Image src="/google.svg" alt="Google" width={18} height={18} />
          Sign in with Google
        </button>

        <a
          href="/forgot-password"
          className="block text-sm text-blue-electric text-center"
        >
          Forgot password?
        </a>

        <p className="text-sm text-center">
          Don’t have an account?{" "}
          <a href="/register" className="text-blue-electric font-semibold">
            Sign up
          </a>
        </p>
      </div>
    </AuthCard>
  );
}
