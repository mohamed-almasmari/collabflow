import { useState } from "react";

import { Outlet } from "react-router";

import Sidebar from "./Sidebar";

import Topbar from "./Topbar";

function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="min-h-screen lg:pl-56">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />

        <main className="min-h-[calc(100vh-3.5rem)] bg-slate-950">
          <div className="mx-auto w-full max-w-[1600px] px-3 py-4 sm:px-4 sm:py-5 lg:px-5 xl:px-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

export default AppLayout;
