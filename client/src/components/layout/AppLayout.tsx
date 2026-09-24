import { Link, Outlet, useNavigate } from "react-router";

import NotificationBell from "../Notifications/NotificationBell";

import { useAuth } from "../../hooks/useAuth";

function AppLayout() {
  const navigate = useNavigate();

  const { user, accessToken, logout } = useAuth();

  async function handleLogout() {
    await logout();

    navigate("/login", {
      replace: true,
    });
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-4">
          <div className="flex items-center gap-8">
            <Link
              to="/dashboard"
              className="text-xl font-bold tracking-tight text-white"
            >
              Collab
              <span className="text-cyan-400">Flow</span>
            </Link>

            <nav className="hidden items-center gap-5 sm:flex">
              <Link
                to="/dashboard"
                className="text-sm font-medium text-slate-400 transition hover:text-cyan-300"
              >
                Dashboard
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {accessToken && <NotificationBell accessToken={accessToken} />}

            {user && (
              <div className="hidden text-right sm:block">
                <p className="text-sm font-medium text-white">{user.name}</p>

                <p className="text-xs text-slate-500">{user.email}</p>
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                void handleLogout();
              }}
              className="rounded-lg border border-slate-700 px-3 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main>
        <Outlet />
      </main>
    </div>
  );
}

export default AppLayout;
