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
    <AuthCard
      title="Reset password"
      subtitle="Enter your email address and we will send you a reset link."
    >
      <div className="space-y-4">
        <input
          type="email"
          placeholder="Email address"
          className="studio-input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <button
          onClick={handleReset}
          disabled={loading}
          className="w-full rounded-full bg-[#125669] px-4 py-3 font-semibold text-white shadow-[0_16px_32px_rgba(18,86,105,0.2)] transition hover:bg-[#0f4b5d] disabled:opacity-70"
        >
          {loading ? "Sending..." : "Send reset link"}
        </button>
      </div>
    </AuthCard>
  );
}
