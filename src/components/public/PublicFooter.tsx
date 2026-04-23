"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import DynovareLogo from "@/components/branding/DynovareLogo";
import { Mail, MapPinned, ShieldCheck } from "lucide-react";
import { useUser } from "@/components/providers/UserProvider";
import { usePublicTheme } from "@/components/public/usePublicTheme";

export default function PublicFooter() {
  const { user } = useUser();
  const pathname = usePathname();
  const repoHref = user ? "/repository" : "/public/policies";
  const { theme, mounted } = usePublicTheme();
  const dark = !mounted || theme === "dark";

  return (
    <footer
      className={`mt-20 w-full max-w-full overflow-x-clip border-t text-white ${
        dark
          ? "border-white/10 bg-[linear-gradient(180deg,#0b1320_0%,#07111b_55%,#06101a_100%)]"
          : "border-[#d8e6ec] bg-[linear-gradient(180deg,#eaf4fb_0%,#f8fbff_40%,#eef6ff_100%)] text-[#003869]"
      }`}
    >
      <div className="mx-auto max-w-7xl overflow-x-clip px-6 py-18 md:px-10 lg:px-14">
        <div className="grid gap-12 md:grid-cols-[1.3fr_0.9fr_0.9fr_1fr]">
          <div>
            <DynovareLogo variant={dark ? "white" : "default"} />
            <p className={`mt-4 max-w-sm text-sm leading-7 ${dark ? "text-white/72" : "text-[#35516d]"}`}>
              Find public policy signals, sharpen private drafts, and move faster from idea to decision-ready policy output.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <span className={`rounded-full border px-3 py-1 text-xs ${dark ? "border-white/14 bg-white/8" : "border-[#cfe0ef] bg-white/80 text-[#003869]"}`}>Nigeria-first</span>
              <span className={`rounded-full border px-3 py-1 text-xs ${dark ? "border-white/14 bg-white/8" : "border-[#cfe0ef] bg-white/80 text-[#003869]"}`}>Private workspaces</span>
              <span className={`rounded-full border px-3 py-1 text-xs ${dark ? "border-white/14 bg-white/8" : "border-[#cfe0ef] bg-white/80 text-[#003869]"}`}>Styled policy exports</span>
            </div>
          </div>

          <div className="space-y-3 text-sm">
            <p className={`font-semibold ${dark ? "text-white" : "text-[#003869]"}`}>Explore</p>
            <Link href={repoHref} className={`block transition ${dark ? "text-white/75 hover:text-white" : "text-[#35516d] hover:text-[#003869]"}`}>Policy repository</Link>
            <Link href="/rankings" className={`block transition ${dark ? "text-white/75 hover:text-white" : "text-[#35516d] hover:text-[#003869]"}`}>Rankings</Link>
            <Link href="/about" className={`block transition ${dark ? "text-white/75 hover:text-white" : "text-[#35516d] hover:text-[#003869]"}`}>About</Link>
            <Link href="/faq" className={`block transition ${dark ? "text-white/75 hover:text-white" : "text-[#35516d] hover:text-[#003869]"}`}>FAQ</Link>
          </div>

          <div className="space-y-3 text-sm">
            <p className={`font-semibold ${dark ? "text-white" : "text-[#003869]"}`}>Workspace</p>
            <Link href="/contact" className={`block transition ${dark ? "text-white/75 hover:text-white" : "text-[#35516d] hover:text-[#003869]"}`}>Contact</Link>
            <Link href="/login" className={`block transition ${dark ? "text-white/75 hover:text-white" : "text-[#35516d] hover:text-[#003869]"}`}>Login</Link>
            <Link href="/register" className={`block transition ${dark ? "text-white/75 hover:text-white" : "text-[#35516d] hover:text-[#003869]"}`}>Create account</Link>
            <p className={dark ? "text-white/60" : "text-[#5b7893]"}>Sign in to draft, critique, simulate, revise, and export.</p>
          </div>

          <div className="space-y-4 text-sm">
            <p className={`font-semibold ${dark ? "text-white" : "text-[#003869]"}`}>Contact signals</p>
            <div className={`flex items-start gap-3 ${dark ? "text-white/75" : "text-[#35516d]"}`}>
              <Mail size={16} className="mt-0.5" />
              <span>hello@dynovare.com</span>
            </div>
            <div className={`flex items-start gap-3 ${dark ? "text-white/75" : "text-[#35516d]"}`}>
              <MapPinned size={16} className="mt-0.5" />
              <span>Built for energy policy teams, researchers, and delivery partners working in Nigeria.</span>
            </div>
            <div className={`flex items-start gap-3 ${dark ? "text-white/75" : "text-[#35516d]"}`}>
              <ShieldCheck size={16} className="mt-0.5" />
              <span>Your drafts, uploads, critiques, and simulations stay private in your workspace by default.</span>
            </div>
          </div>
        </div>

        <div className={`mt-10 flex flex-col gap-2 border-t pt-6 text-sm md:flex-row md:items-center md:justify-between ${dark ? "border-white/12 text-white/70" : "border-[#d8e6ec] text-[#5b7893]"}`}>
          <p>&copy; {new Date().getFullYear()} Dynovare. All rights reserved.</p>
          <p>Turn public signals into stronger policy action.</p>
        </div>
      </div>
    </footer>
  );
}
