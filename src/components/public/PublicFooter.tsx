 "use client";

import Link from "next/link";
import DynovareLogo from "@/components/branding/DynovareLogo";
import { Mail, MapPinned, ShieldCheck } from "lucide-react";
import { useUser } from "@/components/providers/UserProvider";

export default function PublicFooter() {
  const { user } = useUser();
  const repoHref = user ? "/repository" : "/public/policies";

  return (
    <footer className="mt-20 border-t border-[#d8e6ec] bg-[linear-gradient(180deg,#0b2336_0%,#103851_40%,#125669_100%)] text-white">
      <div className="mx-auto max-w-7xl px-4 py-16">
        <div className="grid gap-10 md:grid-cols-[1.3fr_0.9fr_0.9fr_1fr]">
          <div>
            <DynovareLogo />
            <p className="mt-4 max-w-sm text-sm text-white/72">
              Find public policy signals, sharpen private drafts, and move faster from idea to decision-ready policy output.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <span className="rounded-full border border-white/14 bg-white/8 px-3 py-1 text-xs">Nigeria-first</span>
              <span className="rounded-full border border-white/14 bg-white/8 px-3 py-1 text-xs">Private workspaces</span>
              <span className="rounded-full border border-white/14 bg-white/8 px-3 py-1 text-xs">Styled policy exports</span>
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <p className="font-semibold text-white">Explore</p>
            <Link href={repoHref} className="block text-white/75 transition hover:text-white">Policy repository</Link>
            <Link href="/rankings" className="block text-white/75 transition hover:text-white">Rankings</Link>
            <Link href="/about" className="block text-white/75 transition hover:text-white">About</Link>
            <Link href="/faq" className="block text-white/75 transition hover:text-white">FAQ</Link>
          </div>

          <div className="space-y-2 text-sm">
            <p className="font-semibold text-white">Workspace</p>
            <Link href="/contact" className="block text-white/75 transition hover:text-white">Contact</Link>
            <Link href="/login" className="block text-white/75 transition hover:text-white">Login</Link>
            <Link href="/register" className="block text-white/75 transition hover:text-white">Create account</Link>
            <p className="text-white/60">Sign in to draft, critique, simulate, revise, and export.</p>
          </div>

          <div className="space-y-3 text-sm">
            <p className="font-semibold text-white">Contact signals</p>
            <div className="flex items-start gap-3 text-white/75">
              <Mail size={16} className="mt-0.5" />
              <span>hello@dynovare.com</span>
            </div>
            <div className="flex items-start gap-3 text-white/75">
              <MapPinned size={16} className="mt-0.5" />
              <span>Built for energy policy teams, researchers, and delivery partners working in Nigeria.</span>
            </div>
            <div className="flex items-start gap-3 text-white/75">
              <ShieldCheck size={16} className="mt-0.5" />
              <span>Your drafts, uploads, critiques, and simulations stay private in your workspace by default.</span>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-white/12 pt-6 text-sm text-white/70 md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} Dynovare. All rights reserved.</p>
          <p>Turn public signals into stronger policy action.</p>
        </div>
      </div>
    </footer>
  );
}
