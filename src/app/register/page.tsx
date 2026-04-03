"use client";

import { useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import AuthCard from "@/components/auth/AuthCard";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Eye, EyeOff } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    try {
      setLoading(true);
      await createUserWithEmailAndPassword(auth, email, password);
      toast.success("Account created. Please sign in.");
      router.push("/login");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      toast.success("Signed up with Google");
      router.push("/onboarding");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <AuthCard
      title="Create an account"
      subtitle="Set up your private workspace for uploads, AI drafting, critique, simulations, and polished exports."
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
          onClick={handleRegister}
          disabled={loading}
          className="w-full rounded-full bg-[#0073d1] px-4 py-3 font-semibold text-white shadow-[0_16px_32px_rgba(0,115,209,0.2)] transition hover:bg-[#003869] disabled:opacity-70"
        >
          {loading ? "Creating account..." : "Create account"}
        </button>

        <button
          onClick={handleGoogleSignup}
          className="flex w-full items-center justify-center gap-2 rounded-full border bg-white px-4 py-3 font-semibold transition hover:bg-slate-50"
        >
          <Image src="/google.svg" alt="Google" width={18} height={18} />
          Continue with Google
        </button>

        <p className="text-center text-sm text-[var(--text-secondary)]">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-blue-electric">
            Sign in
          </Link>
        </p>
      </div>
    </AuthCard>
  );
}
