"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Sparkles,
  BarChart3,
  Trophy,
  Database,
  LogOut,
  X,
} from "lucide-react";
import DynovareLogo from "@/components/branding/DynovareLogo";
import { useUser } from "@/components/providers/UserProvider";

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "My Workspace", href: "/policies", icon: FileText },
  { name: "My Policies", href: "/uploaded-policies", icon: FileText },
  { name: "AI Critique", href: "/critique", icon: Sparkles },
  { name: "AI Generate", href: "/ai-generate", icon: Sparkles },
  { name: "Simulations", href: "/simulations", icon: BarChart3 },
  { name: "My Critiques", href: "/my-critiques", icon: Sparkles },
  { name: "My Simulations", href: "/my-simulations", icon: BarChart3 },
  { name: "Repository", href: "/repository", icon: Database },
  { name: "Rankings", href: "/rankings", icon: Trophy },
];

export default function Sidebar({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useUser();

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <aside
      className={`
        fixed inset-y-0 left-0 z-40 w-72
        border-r border-white/45
        bg-[linear-gradient(180deg,rgba(7,17,27,0.96)_0%,rgba(11,60,93,0.96)_48%,rgba(20,96,120,0.96)_100%)] px-5 py-6
        flex flex-col
        transform transition-transform duration-200
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
        md:translate-x-0
      `}
    >
      {/* Mobile close button */}
      <button
        onClick={onClose}
        className="absolute right-4 top-4 rounded-lg p-2 text-white/80 hover:bg-white/10 md:hidden"
      >
        <X size={18} />
      </button>

      <div className="mb-8 rounded-[1.75rem] border border-white/12 bg-white/8 px-4 py-4 backdrop-blur">
        <DynovareLogo size={30} />
        <p className="mt-3 text-sm text-white/68">Draft, test, revise, and export your policy work without leaving the workspace.</p>
      </div>

      <nav className="space-y-2 overflow-y-auto pr-1 flex-1">
        {navItems.map((item) => {
          const active = pathname === item.href;

          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onClose}
              className={`
                flex items-center gap-3 rounded-2xl px-4 py-3 font-semibold transition
                ${
                  active
                    ? "bg-white text-blue-deep shadow-[0_16px_36px_rgba(7,17,27,0.24)]"
                    : "text-white/76 hover:bg-white/10 hover:text-white"
                }
              `}
            >
              <item.icon size={18} />
              <span className="truncate">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <button
        onClick={handleLogout}
        className="mt-4 flex items-center gap-3 rounded-2xl border border-white/12 px-4 py-3
          text-sm font-semibold text-white/86 transition hover:bg-white/10"
      >
        <LogOut size={18} />
        Logout
      </button>
    </aside>
  );
}
