"use client";

import { Menu } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useUser } from "@/components/providers/UserProvider";

export default function Topbar({ onMenuClick }: { onMenuClick?: () => void }) {
  const { profile } = useUser();

  const initial = profile?.fullName?.trim()?.charAt(0)?.toUpperCase() ?? "U";

  return (
    <header
      className="
        fixed top-0 z-30 h-16
        w-full md:w-[calc(100%-16rem)] md:left-64 left-0
        border-b border-[var(--border-color)]
        flex items-center justify-between
        px-6 bg-white
        overflow-x-hidden
      "
    >
      <div className="flex items-center gap-3 min-w-0">
        {onMenuClick && (
          <button
            onClick={onMenuClick}
            className="md:hidden p-2 rounded-lg hover:bg-blue-soft"
          >
            <Menu size={20} />
          </button>
        )}

        <span className="text-lg font-bold text-blue-deep truncate">
          Policy Intelligence Platform
        </span>
      </div>

      <Avatar>
        <AvatarFallback className="bg-blue-electric text-white font-bold">
          {initial}
        </AvatarFallback>
      </Avatar>
    </header>
  );
}
