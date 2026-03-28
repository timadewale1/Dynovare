"use client";

import { Menu } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useUser } from "@/components/providers/UserProvider";
import PwaInstallButton from "@/components/branding/PwaInstallButton";

export default function Topbar({ onMenuClick }: { onMenuClick?: () => void }) {
  const { profile } = useUser();

  const initial = profile?.fullName?.trim()?.charAt(0)?.toUpperCase() ?? "U";

  return (
    <header
      className="
        fixed top-0 right-0 z-30 h-16
        left-0 w-full max-w-full md:left-72 md:w-[calc(100%-18rem)]
        border-b border-white/40
        flex items-center justify-between
        px-6 bg-white/72 backdrop-blur-xl
        overflow-x-clip
      "
    >
      <div className="flex items-center gap-3 min-w-0">
        {onMenuClick && (
          <button
            onClick={onMenuClick}
            className="rounded-lg p-2 hover:bg-blue-soft md:hidden"
          >
            <Menu size={20} />
          </button>
        )}

        <div className="min-w-0">
          <span className="block truncate text-base font-bold text-blue-deep">Policy Studio</span>
          <p className="truncate text-xs text-[var(--text-secondary)]">Draft, critique, simulate, export</p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <PwaInstallButton className="hidden rounded-full md:inline-flex" />
        <Avatar>
          <AvatarFallback className="bg-blue-electric text-white font-bold">
            {initial}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
