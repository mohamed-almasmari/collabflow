import { useState } from "react";

import { Outlet } from "react-router";

import Sidebar from "./Sidebar";

import Topbar from "./Topbar";

function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-[18%] top-[-14rem] h-[30rem] w-[30rem] rounded-full bg-cyan-500/[0.035] blur-3xl" />

        <div className="absolute bottom-[-15rem] right-[-10rem] h-[32rem] w-[32rem] rounded-full bg-blue-500/[0.035] blur-3xl" />
      </div>

      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="relative min-h-screen lg:pl-72">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />

        <main className="min-h-[calc(100vh-5rem)]">
          <div className="mx-auto w-full max-w-[1800px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

export default AppLayout;
