import { useEffect, useMemo, useRef, useState } from "react";

import { useNavigate } from "react-router";

import {
  loadSearchCatalog,
  searchCatalog,
  type GlobalSearchResult,
  type SearchCatalog,
} from "../../api/search";

import { useAuth } from "../../hooks/useAuth";

import NotificationBell from "../Notifications/NotificationBell";

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

  const searchInputRef = useRef<HTMLInputElement>(null);

  const searchContainerRef = useRef<HTMLDivElement>(null);

  const profileContainerRef = useRef<HTMLDivElement>(null);

  const [profileOpen, setProfileOpen] = useState(false);

  const [searchOpen, setSearchOpen] = useState(false);

  const [query, setQuery] = useState("");

  const [catalog, setCatalog] = useState<SearchCatalog | null>(null);

  const [searchLoading, setSearchLoading] = useState(false);

  const [searchError, setSearchError] = useState<string | null>(null);

  const displayName = user?.name ?? "CollabFlow User";

  const email = user?.email ?? "";

  const initials = getInitials(displayName) || "CF";

  const results = useMemo(
    () => (catalog ? searchCatalog(catalog, query) : []),
    [catalog, query],
  );

  async function handleLogout() {
    setProfileOpen(false);

    await logout();

    navigate("/login", {
      replace: true,
    });
  }

  async function ensureSearchCatalog() {
    if (catalog || searchLoading || !accessToken) {
      return;
    }

    try {
      setSearchLoading(true);

      setSearchError(null);

      const data = await loadSearchCatalog(accessToken);

      setCatalog(data);
    } catch (error) {
      setSearchError(
        error instanceof Error ? error.message : "Unable to load search",
      );
    } finally {
      setSearchLoading(false);
    }
  }

  function handleSearchFocus() {
    setSearchOpen(true);

    setProfileOpen(false);

    void ensureSearchCatalog();
  }

  function handleSelectResult(result: GlobalSearchResult) {
    setQuery("");

    setSearchOpen(false);

    if (result.type === "PROJECT") {
      navigate(
        `/workspaces/${result.workspaceId}/projects/${result.projectId}/board`,
      );

      return;
    }

    navigate(
      `/workspaces/${result.workspaceId}/projects/${result.projectId}/board?issue=${result.id}`,
    );
  }

  function handleProfileToggle() {
    setProfileOpen((current) => !current);

    setSearchOpen(false);
  }

  useEffect(() => {
    function handleKeyboardShortcut(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;

      const isTyping =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.tagName === "SELECT" ||
        target?.isContentEditable;

      if (event.key === "/" && !isTyping) {
        event.preventDefault();

        searchInputRef.current?.focus();

        setSearchOpen(true);

        setProfileOpen(false);

        void ensureSearchCatalog();
      }

      if (event.key === "Escape") {
        setSearchOpen(false);

        setProfileOpen(false);

        searchInputRef.current?.blur();
      }
    }

    window.addEventListener("keydown", handleKeyboardShortcut);

    return () => {
      window.removeEventListener("keydown", handleKeyboardShortcut);
    };
  }, [accessToken, catalog, searchLoading]);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      const target = event.target as Node;

      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(target)
      ) {
        setSearchOpen(false);
      }

      if (
        profileContainerRef.current &&
        !profileContainerRef.current.contains(target)
      ) {
        setProfileOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

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
        <div
          ref={searchContainerRef}
          className="relative hidden w-full max-w-sm sm:block"
        >
          <div
            className={`flex h-8 w-full items-center gap-2 rounded-md border bg-slate-900/50 px-2.5 transition ${
              searchOpen ? "border-cyan-500/50" : "border-slate-800"
            }`}
          >
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

            <input
              ref={searchInputRef}
              type="text"
              value={query}
              onFocus={handleSearchFocus}
              onChange={(event) => {
                setQuery(event.target.value);

                setSearchOpen(true);
              }}
              placeholder="Search projects and issues"
              aria-label="Search projects and issues"
              className="min-w-0 flex-1 bg-transparent text-[10px] text-slate-300 outline-none placeholder:text-slate-600"
            />

            {searchLoading ? (
              <span className="text-[8px] text-cyan-400">Loading</span>
            ) : query ? (
              <button
                type="button"
                onClick={() => {
                  setQuery("");

                  searchInputRef.current?.focus();
                }}
                className="rounded px-1 text-[11px] text-slate-600 transition hover:text-slate-300"
                aria-label="Clear search"
              >
                ×
              </button>
            ) : null}
          </div>

          {searchOpen && (
            <div className="absolute left-0 right-0 top-10 z-50 overflow-hidden rounded-lg border border-slate-800 bg-slate-900 shadow-2xl shadow-black/40">
              {searchError ? (
                <div
                  role="alert"
                  className="px-3 py-3 text-[10px] text-rose-300"
                >
                  {searchError}
                </div>
              ) : searchLoading ? (
                <div className="px-3 py-4">
                  <div className="flex items-center gap-2 text-[10px] text-slate-500">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-cyan-400" />
                    Loading projects and issues...
                  </div>
                </div>
              ) : !query.trim() ? (
                <div className="px-3 py-3">
                  <p className="text-[10px] font-medium text-slate-400">
                    Search CollabFlow
                  </p>

                  <p className="mt-1 text-[9px] leading-4 text-slate-600">
                    Search project names, issue titles, descriptions,
                    priorities, or statuses.
                  </p>
                </div>
              ) : results.length === 0 ? (
                <div className="px-3 py-4 text-center">
                  <p className="text-[10px] font-medium text-slate-400">
                    No results
                  </p>

                  <p className="mt-1 text-[9px] text-slate-600">
                    Nothing matched &quot;{query}&quot;.
                  </p>
                </div>
              ) : (
                <div className="max-h-80 overflow-y-auto p-1">
                  {results.map((result) => (
                    <button
                      key={`${result.type}-${result.id}`}
                      type="button"
                      onClick={() => handleSelectResult(result)}
                      className="flex w-full items-start gap-2.5 rounded-md px-2.5 py-2 text-left outline-none transition hover:bg-slate-800 focus-visible:bg-slate-800"
                    >
                      <div
                        className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${
                          result.type === "PROJECT"
                            ? "bg-cyan-500/10 text-cyan-400"
                            : "bg-violet-500/10 text-violet-400"
                        }`}
                      >
                        {result.type === "PROJECT" ? (
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            className="h-3 w-3"
                            aria-hidden="true"
                          >
                            <path d="M4 6h6l2 2h8v10H4z" />
                          </svg>
                        ) : (
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            className="h-3 w-3"
                            aria-hidden="true"
                          >
                            <circle cx="12" cy="12" r="8" />

                            <path d="M9 12h6M12 9v6" />
                          </svg>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-[10px] font-medium text-slate-300">
                            {result.name}
                          </p>

                          <span
                            className={`shrink-0 text-[7px] font-semibold uppercase tracking-wide ${
                              result.type === "PROJECT"
                                ? "text-cyan-500"
                                : "text-violet-500"
                            }`}
                          >
                            {result.type}
                          </span>
                        </div>

                        <p className="mt-0.5 truncate text-[8px] text-slate-600">
                          {result.workspaceName}

                          {result.type === "ISSUE" && (
                            <> / {result.projectName}</>
                          )}
                        </p>

                        {result.type === "ISSUE" && (
                          <div className="mt-1 flex items-center gap-1.5">
                            <span className="rounded bg-slate-800 px-1 py-0.5 text-[7px] text-slate-500">
                              {result.status}
                            </span>

                            <span className="rounded bg-slate-800 px-1 py-0.5 text-[7px] text-slate-500">
                              {result.priority}
                            </span>
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <span className="truncate text-xs font-medium text-slate-200 sm:hidden">
          CollabFlow
        </span>
      </div>

      <div className="ml-3 flex items-center gap-1.5">
        {accessToken && <NotificationBell />}

        <div ref={profileContainerRef} className="relative">
          <button
            type="button"
            onClick={handleProfileToggle}
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
