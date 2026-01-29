import Link from "next/link";
import DynovareLogo from "@/components/branding/DynovareLogo";

export default function PublicFooter() {
  return (
<footer className="bg-[var(--blue-deep)] text-white">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-center gap-2">
            <div>
                              <p className="font-bold">Dynovare</p>

              <p className="text-sm text-white/75">
                Energy policy intelligence for better decisions.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link href="/public/policies" className="px-3 py-2 rounded-xl hover:bg-white/10 transition">
              Policies
            </Link>
            <Link href="/login" className="px-3 py-2 rounded-xl hover:bg-white/10 transition">
              Login
            </Link>
            <Link href="/register" className="px-3 py-2 rounded-xl hover:bg-white/10 transition">
              Create account
            </Link>
          </div>
        </div>

        <div className="mt-8 border-t border-white/15 pt-6 text-sm text-white/70 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <p>© {new Date().getFullYear()} Dynovare. All rights reserved.</p>
          <p>Public repository is read-only. Actions require login.</p>
        </div>
      </div>
    </footer>
  );
}
