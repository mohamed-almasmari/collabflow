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
    <header className="sticky top-0 z-30 flex h-16 items-center border-b border-slate-800 bg-slate-950/95 px-4 backdrop-blur sm:px-5">
      <button
        type="button"
        onClick={onMenuClick}
        className="mr-3 rounded-lg p-2 text-slate-400 transition hover:bg-slate-900 hover:text-white lg:hidden"
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
        <div className="hidden w-full max-w-sm items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/70 px-3 py-2 sm:flex">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="h-4 w-4 shrink-0 text-slate-600"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="7" />

            <path d="m16 16 4 4" />
          </svg>

          <span className="truncate text-xs text-slate-600">
            Search projects and issues
          </span>

          <kbd className="ml-auto rounded border border-slate-700 bg-slate-800 px-1.5 py-0.5 text-[9px] text-slate-500">
            /
          </kbd>
        </div>

        <span className="text-sm font-medium text-white sm:hidden">
          Dashboard
        </span>
      </div>

      <div className="ml-3 flex items-center gap-2">
        {accessToken && <NotificationBell />}

        <div className="relative">
          <button
            type="button"
            onClick={() => setProfileOpen((current) => !current)}
            className="flex items-center gap-2 rounded-lg px-1.5 py-1 transition hover:bg-slate-900"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500 text-[11px] font-bold text-white">
              {initials}
            </div>

            <div className="hidden text-left md:block">
              <p className="max-w-32 truncate text-xs font-medium text-slate-200">
                {displayName}
              </p>

              <p className="max-w-32 truncate text-[10px] text-slate-600">
                {email}
              </p>
            </div>

            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="hidden h-3.5 w-3.5 text-slate-600 md:block"
              aria-hidden="true"
            >
              <path d="m7 10 5 5 5-5" />
            </svg>
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-slate-800 bg-slate-900 shadow-xl shadow-black/30">
              <div className="border-b border-slate-800 px-4 py-3">
                <p className="truncate text-sm font-medium text-white">
                  {displayName}
                </p>

                <p className="mt-1 truncate text-xs text-slate-500">{email}</p>
              </div>

              <div className="p-1.5">
                <button
                  type="button"
                  onClick={() => {
                    void handleLogout();
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs text-slate-400 transition hover:bg-slate-800 hover:text-white"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className="h-4 w-4"
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
