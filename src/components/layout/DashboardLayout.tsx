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
    <div className="w-full max-w-full overflow-x-clip bg-transparent">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="w-full max-w-full md:pl-72">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="min-h-screen max-w-full overflow-x-clip pt-16">
          <div className="w-full max-w-full overflow-x-clip p-4 md:p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
