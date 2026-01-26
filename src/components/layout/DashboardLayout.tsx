"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="bg-blue-soft overflow-x-hidden">
      {/* Sidebar (fixed) */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main wrapper: add left padding on desktop to account for fixed sidebar */}
      <div className="md:pl-64">
        {/* Topbar (fixed) */}
        <Topbar onMenuClick={() => setSidebarOpen(true)} />

        {/* Scrollable content area */}
        <main className="pt-16 min-h-screen overflow-x-hidden">
          <div className="p-6 max-w-full">{children}</div>
        </main>
      </div>
    </div>
  );
}
