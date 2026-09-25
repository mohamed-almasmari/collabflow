import { useEffect, useState, type ReactNode } from "react";

import { NavLink, useLocation, useNavigate } from "react-router";

import { getWorkspaces, type WorkspaceSummary } from "../../api/workspaces";

import { useAuth } from "../../hooks/useAuth";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

interface NavigationItem {
  label: string;
  to: string;
  icon: ReactNode;
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
        className="h-4 w-4"
        aria-hidden="true"
      >
        <rect x="4" y="4" width="6" height="6" rx="1.5" />

        <rect x="14" y="4" width="6" height="6" rx="1.5" />

        <rect x="4" y="14" width="6" height="6" rx="1.5" />

        <rect x="14" y="14" width="6" height="6" rx="1.5" />
      </svg>
    ),
  },
];

const workspaceColors = [
  "bg-cyan-400",
  "bg-violet-400",
  "bg-emerald-400",
  "bg-amber-400",
  "bg-rose-400",
  "bg-blue-400",
];

function Sidebar({ open, onClose }: SidebarProps) {
  const { accessToken } = useAuth();

  const navigate = useNavigate();

  const location = useLocation();

  const [workspaces, setWorkspaces] = useState<WorkspaceSummary[]>([]);

  const [loadingWorkspaces, setLoadingWorkspaces] = useState(false);

  useEffect(() => {
    if (!accessToken) {
      setWorkspaces([]);

      return;
    }

    const currentAccessToken = accessToken;

    let cancelled = false;

    async function loadSidebarWorkspaces() {
      try {
        setLoadingWorkspaces(true);

        const data = await getWorkspaces(currentAccessToken);

        if (!cancelled) {
          setWorkspaces(data);
        }
      } catch (error) {
        console.error("Unable to load sidebar workspaces:", error);
      } finally {
        if (!cancelled) {
          setLoadingWorkspaces(false);
        }
      }
    }

    void loadSidebarWorkspaces();

    return () => {
      cancelled = true;
    };
  }, [accessToken, location.key]);

  const searchParams = new URLSearchParams(location.search);

  const selectedWorkspaceId = searchParams.get("workspace");

  function handleWorkspaceClick(workspaceId: string) {
    navigate(`/dashboard?workspace=${workspaceId}`);

    onClose();
  }

  return (
    <>
      {open && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-950/70 lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-56 flex-col border-r border-slate-800/80 bg-slate-950 transition-transform duration-200 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-14 items-center justify-between border-b border-slate-800/70 px-3">
          <NavLink
            to="/dashboard"
            onClick={onClose}
            className="flex items-center gap-2"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-cyan-400 text-[10px] font-black text-slate-950">
              CF
            </div>

            <span className="text-sm font-semibold tracking-tight text-slate-100">
              CollabFlow
            </span>
          </NavLink>

          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-slate-500 transition hover:bg-slate-900 hover:text-white lg:hidden"
            aria-label="Close sidebar"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-4 w-4"
              aria-hidden="true"
            >
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-3">
          <div>
            <p className="mb-1.5 px-2 text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-600">
              General
            </p>

            <nav className="space-y-1">
              {navigationItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 rounded-md px-2.5 py-2 text-xs font-medium transition ${
                      isActive
                        ? "bg-slate-800 text-white"
                        : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
                    }`
                  }
                >
                  <span className="text-slate-500">{item.icon}</span>

                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="mt-6">
            <div className="mb-1.5 flex items-center justify-between px-2">
              <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-600">
                Workspaces
              </p>

              <span className="text-[9px] text-slate-700">
                {workspaces.length}
              </span>
            </div>

            {loadingWorkspaces ? (
              <div className="space-y-1">
                {[1, 2, 3].map((item) => (
                  <div
                    key={item}
                    className="h-8 animate-pulse rounded-md bg-slate-900"
                  />
                ))}
              </div>
            ) : workspaces.length === 0 ? (
              <p className="px-2 py-2 text-[10px] text-slate-700">
                No workspaces
              </p>
            ) : (
              <div className="space-y-0.5">
                {workspaces.map((workspace, index) => {
                  const active = workspace.id === selectedWorkspaceId;

                  return (
                    <button
                      key={workspace.id}
                      type="button"
                      onClick={() => handleWorkspaceClick(workspace.id)}
                      className={`flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left transition ${
                        active
                          ? "bg-slate-900 text-white"
                          : "text-slate-500 hover:bg-slate-900/60 hover:text-slate-300"
                      }`}
                    >
                      <span
                        className={`h-2 w-2 shrink-0 rounded-full ${
                          workspaceColors[index % workspaceColors.length]
                        }`}
                      />

                      <span className="min-w-0 flex-1 truncate text-[11px] font-medium">
                        {workspace.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-slate-800/70 px-3 py-3">
          <p className="text-[9px] text-slate-500">CollabFlow</p>

          <p className="mt-0.5 text-[9px] text-slate-500">
            Collaborative project management
          </p>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
