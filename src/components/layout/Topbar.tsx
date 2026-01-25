"use client";

import { Menu } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useUser } from "@/components/providers/UserProvider";

export default function Topbar({ onMenuClick }: { onMenuClick?: () => void }) {
  const { profile } = useUser();

  const initial =
    profile?.fullName?.trim()?.charAt(0)?.toUpperCase() ?? "U";

  return (
    <header className="h-16 border-b border-[var(--border-color)] flex items-center justify-between px-6 bg-white">
      <div className="flex items-center gap-3">
        {onMenuClick && (
          <button
            onClick={onMenuClick}
            className="md:hidden p-2 rounded-lg hover:bg-blue-soft"
          >
            <Menu size={20} />
          </button>
        )}

        <span className="text-lg font-bold text-blue-deep">
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
