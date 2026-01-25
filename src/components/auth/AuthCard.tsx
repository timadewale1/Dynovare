"use client";

import { ReactNode } from "react";

export default function AuthCard({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-soft px-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-md p-8">
        {children}
      </div>
    </div>
  );
}
