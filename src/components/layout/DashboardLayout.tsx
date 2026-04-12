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
          <div className="w-full max-w-full overflow-x-clip px-4 py-5 md:px-8 md:py-7 lg:px-10 lg:py-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
