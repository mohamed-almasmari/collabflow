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
    <header className="sticky top-0 z-30 flex h-20 items-center border-b border-slate-800/80 bg-slate-950/80 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
      <button
        type="button"
        onClick={onMenuClick}
        className="mr-3 rounded-xl border border-slate-800 bg-slate-900 p-2.5 text-slate-400 transition hover:border-slate-700 hover:text-white lg:hidden"
        aria-label="Open navigation"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="h-5 w-5"
          aria-hidden="true"
        >
          <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
      </button>

      <div className="min-w-0 flex-1">
        <div className="hidden max-w-md items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/70 px-4 py-2.5 sm:flex">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="h-4 w-4 shrink-0 text-slate-500"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="7" />

            <path d="m16 16 4 4" />
          </svg>

          <span className="truncate text-sm text-slate-500">
            Search projects and issues...
          </span>

          <span className="ml-auto rounded-md border border-slate-700 bg-slate-800 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
            /
          </span>
        </div>

        <p className="truncate text-sm font-semibold text-white sm:hidden">
          CollabFlow
        </p>
      </div>

      <div className="ml-4 flex items-center gap-3">
        {accessToken && <NotificationBell />}

        <div className="relative">
          <button
            type="button"
            onClick={() => setProfileOpen((current) => !current)}
            className="flex items-center gap-2 rounded-xl border border-transparent p-1.5 transition hover:border-slate-800 hover:bg-slate-900"
            aria-expanded={profileOpen}
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 text-xs font-bold text-slate-950 shadow-lg shadow-cyan-950/30">
              {initials}
            </div>

            <div className="hidden min-w-0 text-left md:block">
              <p className="max-w-36 truncate text-sm font-medium text-slate-200">
                {displayName}
              </p>

              <p className="max-w-36 truncate text-[11px] text-slate-500">
                {email}
              </p>
            </div>

            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className={`hidden h-4 w-4 text-slate-500 transition md:block ${
                profileOpen ? "rotate-180" : ""
              }`}
              aria-hidden="true"
            >
              <path d="m7 10 5 5 5-5" />
            </svg>
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-3 w-64 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl shadow-black/30">
              <div className="border-b border-slate-800 px-4 py-4">
                <p className="truncate text-sm font-semibold text-white">
                  {displayName}
                </p>

                <p className="mt-1 truncate text-xs text-slate-500">{email}</p>
              </div>

              <div className="p-2">
                <button
                  type="button"
                  onClick={() => {
                    void handleLogout();
                  }}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-slate-400 transition hover:bg-slate-800 hover:text-white"
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
