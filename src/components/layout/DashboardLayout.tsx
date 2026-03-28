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
    <div className="overflow-x-hidden bg-transparent">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="md:pl-72">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="min-h-screen overflow-x-hidden pt-16">
          <div className="max-w-full p-4 md:p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
