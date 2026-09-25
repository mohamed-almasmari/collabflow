import { useState } from "react";

import { useNavigate } from "react-router";

import NotificationBell from "../Notifications/NotificationBell";

import { useAuth } from "../../hooks/useAuth";

interface TopbarProps {
  onMenuClick: () => void;
}

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();
}

function Topbar({ onMenuClick }: TopbarProps) {
  const { user, accessToken, logout } = useAuth();

  const navigate = useNavigate();

  const [profileOpen, setProfileOpen] = useState(false);

  async function handleLogout() {
    setProfileOpen(false);

    await logout();

    navigate("/login", {
      replace: true,
    });
  }

  const displayName = user?.name ?? "CollabFlow User";

  const email = user?.email ?? "";

  const initials = getInitials(displayName) || "CF";

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center border-b border-slate-800/80 bg-slate-950/95 px-3 backdrop-blur sm:px-4 lg:px-5">
      <button
        type="button"
        onClick={onMenuClick}
        className="mr-2 rounded-md p-2 text-slate-500 outline-none transition hover:bg-slate-900 hover:text-white focus-visible:ring-2 focus-visible:ring-cyan-500/50 lg:hidden"
        aria-label="Open navigation"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="h-4 w-4"
          aria-hidden="true"
        >
          <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
      </button>

      <div className="flex min-w-0 flex-1 items-center">
        <div className="hidden h-8 w-full max-w-xs items-center gap-2 rounded-md border border-slate-800 bg-slate-900/50 px-2.5 sm:flex">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="h-3.5 w-3.5 shrink-0 text-slate-600"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="7" />

            <path d="m16 16 4 4" />
          </svg>

          <span className="truncate text-[10px] text-slate-600">
            Search projects and issues
          </span>

          <kbd className="ml-auto rounded border border-slate-800 bg-slate-950 px-1.5 py-0.5 text-[8px] text-slate-700">
            /
          </kbd>
        </div>

        <span className="truncate text-xs font-medium text-slate-200 sm:hidden">
          CollabFlow
        </span>
      </div>

      <div className="ml-3 flex items-center gap-1.5">
        {accessToken && <NotificationBell />}

        <div className="relative">
          <button
            type="button"
            onClick={() => setProfileOpen((current) => !current)}
            aria-expanded={profileOpen}
            aria-haspopup="menu"
            className="flex items-center gap-2 rounded-md px-1 py-1 outline-none transition hover:bg-slate-900 focus-visible:ring-2 focus-visible:ring-violet-500/50"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-violet-500 text-[9px] font-bold text-white">
              {initials}
            </div>

            <div className="hidden max-w-32 text-left md:block">
              <p className="truncate text-[10px] font-medium text-slate-300">
                {displayName}
              </p>

              <p className="truncate text-[8px] text-slate-600">{email}</p>
            </div>

            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className={`hidden h-3 w-3 text-slate-600 transition-transform md:block ${
                profileOpen ? "rotate-180" : ""
              }`}
              aria-hidden="true"
            >
              <path d="m7 10 5 5 5-5" />
            </svg>
          </button>

          {profileOpen && (
            <div
              role="menu"
              className="absolute right-0 mt-2 w-52 overflow-hidden rounded-lg border border-slate-800 bg-slate-900 shadow-xl shadow-black/30"
            >
              <div className="border-b border-slate-800 px-3 py-2.5">
                <p className="truncate text-xs font-medium text-slate-200">
                  {displayName}
                </p>

                <p className="mt-0.5 truncate text-[9px] text-slate-600">
                  {email}
                </p>
              </div>

              <div className="p-1">
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    void handleLogout();
                  }}
                  className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-[10px] text-slate-400 outline-none transition hover:bg-slate-800 hover:text-white focus-visible:ring-2 focus-visible:ring-cyan-500/50"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className="h-3.5 w-3.5"
                    aria-hidden="true"
                  >
                    <path d="M10 5H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h4" />

                    <path d="m14 8 4 4-4 4" />

                    <path d="M9 12h9" />
                  </svg>
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Topbar;
