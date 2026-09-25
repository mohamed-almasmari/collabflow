import { NavLink } from "react-router";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

interface NavigationItem {
  label: string;
  to: string;
  icon: React.ReactNode;
}

const navigationItems: NavigationItem[] = [
  {
    label: "Dashboard",
    to: "/dashboard",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="h-5 w-5"
        aria-hidden="true"
      >
        <rect x="3" y="3" width="7" height="7" rx="2" />

        <rect x="14" y="3" width="7" height="7" rx="2" />

        <rect x="3" y="14" width="7" height="7" rx="2" />

        <rect x="14" y="14" width="7" height="7" rx="2" />
      </svg>
    ),
  },
];

function Sidebar({ open, onClose }: SidebarProps) {
  return (
    <>
      {open && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-slate-800/80 bg-slate-950/95 backdrop-blur-xl transition-transform duration-300 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-20 items-center justify-between border-b border-slate-800/80 px-6">
          <NavLink
            to="/dashboard"
            onClick={onClose}
            className="group flex items-center gap-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-400/30 bg-cyan-400/10 shadow-lg shadow-cyan-950/40">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-5 w-5 text-cyan-300"
                aria-hidden="true"
              >
                <path d="M5 6.5A2.5 2.5 0 0 1 7.5 4H12v6H5V6.5Z" />

                <path d="M12 4h4.5A2.5 2.5 0 0 1 19 6.5V10h-7V4Z" />

                <path d="M5 14h7v6H7.5A2.5 2.5 0 0 1 5 17.5V14Z" />

                <path d="M12 14h7v3.5a2.5 2.5 0 0 1-2.5 2.5H12v-6Z" />
              </svg>
            </div>

            <div>
              <p className="text-base font-semibold tracking-tight text-white">
                CollabFlow
              </p>

              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500">
                Workspace
              </p>
            </div>
          </NavLink>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white lg:hidden"
            aria-label="Close navigation"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-5 w-5"
              aria-hidden="true"
            >
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-6">
          <div className="mb-3 px-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">
              Workspace
            </p>
          </div>

          <nav className="space-y-1">
            {navigationItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={({ isActive }) =>
                  `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                    isActive
                      ? "bg-cyan-400/10 text-cyan-300 ring-1 ring-inset ring-cyan-400/15"
                      : "text-slate-400 hover:bg-slate-900 hover:text-slate-100"
                  }`
                }
              >
                <span className="shrink-0">{item.icon}</span>

                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="my-6 border-t border-slate-800/70" />

          <div className="mb-3 px-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">
              CollabFlow
            </p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-500">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-5 w-5"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="9" />

                <path d="M12 8v4l2.5 2.5" />
              </svg>

              <span>Real-time collaboration</span>
            </div>

            <div className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-500">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-5 w-5"
                aria-hidden="true"
              >
                <path d="M12 3 4.5 6v5.5c0 4.8 3.2 7.8 7.5 9.5 4.3-1.7 7.5-4.7 7.5-9.5V6L12 3Z" />

                <path d="m9 12 2 2 4-4" />
              </svg>

              <span>Secure workspace</span>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800/80 p-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
            <div className="mb-2 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/60" />

              <span className="text-xs font-medium text-slate-300">
                System online
              </span>
            </div>

            <p className="text-xs leading-5 text-slate-500">
              Your workspace is connected and ready for collaboration.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
