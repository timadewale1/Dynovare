"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Sparkles,
  BarChart3,
  Trophy,
  LogOut,
  X,
} from "lucide-react";
import DynovareLogo from "@/components/branding/DynovareLogo";
import { useUser } from "@/components/providers/UserProvider";

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Policy Repository", href: "/policies", icon: FileText },
  { name: "AI Critique", href: "/critique", icon: Sparkles },
{ name: "AI Generate", href: "/generate", icon: Sparkles },
  { name: "Simulations", href: "/simulations", icon: BarChart3 },
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
        fixed inset-y-0 left-0 z-40 w-64
        border-r border-[var(--border-color)]
        bg-white px-4 py-6
        flex flex-col
        transform transition-transform duration-200
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
        md:static md:translate-x-0
      `}
    >
      {/* Mobile close button */}
      <button
        onClick={onClose}
        className="md:hidden absolute top-4 right-4 p-2 rounded-lg hover:bg-blue-soft"
      >
        <X size={18} />
      </button>

      {/* Logo */}
      <div className="mb-10 px-2">
        <DynovareLogo />
      </div>

      {/* Navigation */}
      <nav className="space-y-2">
        {navItems.map((item) => {
          const active = pathname === item.href;

          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onClose}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-lg font-semibold transition
                ${
                  active
                    ? "bg-blue-soft text-blue-deep"
                    : "text-[var(--text-secondary)] hover:bg-blue-soft hover:text-blue-deep"
                }
              `}
            >
              <item.icon size={18} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Logout (always bottom) */}
      <button
        onClick={handleLogout}
        className="mt-auto flex items-center gap-3 px-4 py-3 rounded-lg
          text-sm font-semibold text-red-600 hover:bg-red-50 transition"
      >
        <LogOut size={18} />
        Logout
      </button>
    </aside>
  );
}
