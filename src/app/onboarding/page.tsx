"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { onAuthStateChanged } from "firebase/auth";

const roles = [
  {
    id: "policy_analyst",
    label: "Policy Analyst",
    description: "Analyze and evaluate energy policies",
  },
  {
    id: "researcher",
    label: "Researcher",
    description: "Conduct research and generate insights",
  },
  {
    id: "organization",
    label: "Organization",
    description: "Represent an organization or institution",
  },
  {
    id: "student",
    label: "Student",
    description: "Learning and exploring policy insights",
  },
];

type Role = "policy_analyst" | "researcher" | "organization" | "student";

export default function OnboardingPage() {
  const router = useRouter();

  const [uid, setUid] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);

  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<Role | "">("");
  const [extra, setExtra] = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }

      setUid(user.uid);
      setEmail(user.email);

      // If onboarding already complete, skip this page
      const snap = await getDoc(doc(db, "users", user.uid));
      if (snap.exists() && snap.data().onboardingComplete) {
        router.push("/dashboard");
      }
    });

    return () => unsub();
  }, [router]);

  const handleSubmit = async () => {
    if (!uid || !email || !role || !fullName) {
      toast.error("Please complete all required fields");
      return;
    }

    // Extra field required for org/student
    if ((role === "organization" || role === "student") && !extra.trim()) {
      toast.error(
        role === "organization"
          ? "Please enter your organization name"
          : "Please enter your institution name"
      );
      return;
    }

    try {
      const ref = doc(db, "users", uid);
      const existingSnap = await getDoc(ref);
      const existing = existingSnap.exists() ? existingSnap.data() : null;

      await setDoc(
        ref,
        {
          uid,
          email,
          fullName,
          role,
          onboardingComplete: true,

          // createdAt stays stable
          createdAt: existing?.createdAt ?? serverTimestamp(),

          // updatedAt changes whenever profile is updated
          updatedAt: serverTimestamp(),

          ...(role === "organization" && { organizationName: extra }),
          ...(role === "student" && { institution: extra }),
        },
        { merge: true }
      );

      toast.success("Onboarding complete");
      router.push("/dashboard");
    } catch (error: any) {
      toast.error("Failed to save profile");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-soft px-4">
      <div className="w-full max-w-lg bg-white rounded-xl p-8 shadow-md">
        <h1 className="text-2xl font-bold text-blue-deep mb-6">
          Complete your profile
        </h1>

        <div className="space-y-4">
          <input
            placeholder="Full name"
            className="w-full border rounded-md px-3 py-2"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />

          <div>
            <p className="text-sm font-medium mb-2">Select your role</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {roles.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setRole(r.id as Role)}
                  className={`border rounded-lg p-4 text-left transition ${
                    role === r.id
                      ? "border-blue-electric bg-blue-soft"
                      : "hover:border-blue-electric"
                  }`}
                >
                  <p className="font-semibold text-blue-deep">{r.label}</p>
                  <p className="text-sm text-[var(--text-secondary)] mt-1">
                    {r.description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {(role === "organization" || role === "student") && (
            <input
              placeholder={
                role === "organization"
                  ? "Organization name"
                  : "Institution name"
              }
              className="w-full border rounded-md px-3 py-2"
              value={extra}
              onChange={(e) => setExtra(e.target.value)}
            />
          )}

          <button
            onClick={handleSubmit}
            className="w-full border btn-primary py-2 rounded-md font-semibold"
          >
            Finish onboarding
          </button>
        </div>
      </div>
    </div>
  );
}
