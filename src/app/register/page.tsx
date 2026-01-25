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
    <AuthCard>
      <h1 className="text-2xl font-bold text-blue-deep mb-4">
        Create an account
      </h1>

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
          onClick={handleRegister}
          disabled={loading}
          className="w-full border btn-primary py-2 rounded-md font-semibold"
        >
          Create account
        </button>

        <button
          onClick={handleGoogleSignup}
          className="w-full border font-semibold py-2 rounded-md flex items-center justify-center gap-2"
        >
          <Image src="/google.svg" alt="Google" width={18} height={18} />
          Sign in with Google
        </button>

        <p className="text-sm text-center">
          Already have an account?{" "}
          <a href="/login" className="text-blue-electric font-semibold">
            Sign in
          </a>
        </p>
      </div>
    </AuthCard>
  );
}
