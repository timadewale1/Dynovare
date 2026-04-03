"use client";

import { ReactNode } from "react";
import DynovareLogo from "@/components/branding/DynovareLogo";

export default function AuthCard({
  children,
  title,
  subtitle,
}: {
  children: ReactNode;
  title?: string;
  subtitle?: string;
}) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#d9edf2_0%,#f6fbfd_38%,#ffffff_100%)] px-4 py-10">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="hidden rounded-[2.25rem] bg-[linear-gradient(135deg,#001b33_0%,#002c52_52%,#0073d1_100%)] p-10 text-white shadow-[0_30px_90px_rgba(0,56,105,0.18)] lg:flex lg:flex-col lg:justify-between">
          <div>
            <DynovareLogo size={38} variant="white" />
            <p className="mt-8 text-xs uppercase tracking-[0.22em] text-white/70">Policy intelligence workspace</p>
            <h1 className="mt-4 text-4xl font-black leading-[0.98]">
              Research, draft, critique, simulate, and export from one place.
            </h1>
            <p className="mt-4 max-w-xl text-sm text-white/78">
              Built for serious energy policy work across Nigeria, with private drafting flows and public intelligence working side by side.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ["Private drafts", "Keep uploads, revisions, critiques, and simulations inside your workspace."],
              ["State intelligence", "Track public policy movement across Nigeria with the map and rankings."],
              ["AI drafting", "Generate editable sections instead of being locked into a plain document."],
              ["Styled export", "Download polished PDFs when the draft is ready to share."],
            ].map(([itemTitle, itemText]) => (
              <div key={itemTitle} className="rounded-[1.4rem] border border-white/10 bg-white/8 p-4">
                <p className="font-bold">{itemTitle}</p>
                <p className="mt-2 text-sm text-white/74">{itemText}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-center">
          <div className="premium-card w-full max-w-xl rounded-[2rem] p-8 shadow-[0_24px_70px_rgba(0,56,105,0.12)]">
            <div className="mb-6 lg:hidden">
              <DynovareLogo size={34} />
            </div>
            {title ? <h1 className="text-3xl font-black text-blue-deep">{title}</h1> : null}
            {subtitle ? <p className="mt-3 text-sm text-[var(--text-secondary)]">{subtitle}</p> : null}
            <div className={title || subtitle ? "mt-8" : ""}>{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
