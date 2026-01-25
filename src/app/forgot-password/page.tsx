"use client";

import { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";
import AuthCard from "@/components/auth/AuthCard";
import toast from "react-hot-toast";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    try {
      setLoading(true);
      await sendPasswordResetEmail(auth, email);
      toast.success("Password reset link sent to your email");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard>
      <h1 className="text-2xl font-bold text-blue-deep mb-4">
        Reset password
      </h1>

      <p className="text-sm text-[var(--text-secondary)] mb-6">
        Enter your email address and we’ll send you a reset link.
      </p>

      <input
        type="email"
        placeholder="Email address"
        className="w-full border rounded-md px-3 py-2 mb-4"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <button
        onClick={handleReset}
        disabled={loading}
        className="w-full border font-semibold btn-primary py-2 rounded-md"
      >
        Send reset link
      </button>
    </AuthCard>
  );
}
