import { useState, type SyntheticEvent } from "react";

import { Link, Navigate, useNavigate } from "react-router";

import { useAuth } from "../../hooks/useAuth";

function LoginPage() {
  const navigate = useNavigate();

  const { login, isAuthenticated } = useAuth();

  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  async function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();

    setError(null);

    try {
      setLoading(true);

      await login({
        email,
        password,
      });

      navigate("/dashboard", {
        replace: true,
      });
    } catch (loginError) {
      setError(
        loginError instanceof Error ? loginError.message : "Unable to sign in",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="grid min-h-screen lg:grid-cols-[1fr_520px]">
        <section className="hidden border-r border-slate-800/80 lg:flex lg:flex-col lg:justify-between lg:p-10 xl:p-14">
          <div>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-cyan-400 text-[10px] font-black text-slate-950">
                CF
              </div>

              <span className="text-sm font-semibold tracking-tight text-slate-100">
                CollabFlow
              </span>
            </Link>
          </div>

          <div className="max-w-lg">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-400">
              Collaborative project management
            </p>

            <h1 className="mt-4 text-4xl font-semibold leading-tight tracking-tight text-white xl:text-5xl">
              Keep your team aligned.
              <span className="block text-slate-500">Keep work moving.</span>
            </h1>

            <p className="mt-5 max-w-md text-sm leading-6 text-slate-500">
              Organize projects, manage issues, collaborate in real time, and
              keep every update in one place.
            </p>

            <div className="mt-8 grid max-w-md grid-cols-3 gap-3">
              <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-3">
                <div className="mb-2 h-1.5 w-1.5 rounded-full bg-cyan-400" />

                <p className="text-[10px] font-medium text-slate-300">
                  Realtime
                </p>

                <p className="mt-1 text-[9px] text-slate-600">Live teamwork</p>
              </div>

              <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-3">
                <div className="mb-2 h-1.5 w-1.5 rounded-full bg-violet-400" />

                <p className="text-[10px] font-medium text-slate-300">Kanban</p>

                <p className="mt-1 text-[9px] text-slate-600">Track progress</p>
              </div>

              <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-3">
                <div className="mb-2 h-1.5 w-1.5 rounded-full bg-emerald-400" />

                <p className="text-[10px] font-medium text-slate-300">Teams</p>

                <p className="mt-1 text-[9px] text-slate-600">Work together</p>
              </div>
            </div>
          </div>

          <p className="text-[9px] text-slate-700">CollabFlow</p>
        </section>

        <section className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-8">
          <div className="w-full max-w-sm">
            <div className="mb-8 lg:hidden">
              <Link to="/login" className="inline-flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-cyan-400 text-[10px] font-black text-slate-950">
                  CF
                </div>

                <span className="text-sm font-semibold text-slate-100">
                  CollabFlow
                </span>
              </Link>
            </div>

            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-400">
                Welcome back
              </p>

              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">
                Sign in to your account
              </h2>

              <p className="mt-2 text-xs leading-5 text-slate-500">
                Continue to your workspaces, projects, and team activity.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="mt-7 space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="mb-1.5 block text-[10px] font-medium text-slate-400"
                >
                  Email address
                </label>

                <input
                  id="email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  placeholder="you@example.com"
                  required
                  aria-invalid={error ? true : undefined}
                  className="h-10 w-full rounded-lg border border-slate-800 bg-slate-900/60 px-3 text-xs text-slate-200 outline-none transition placeholder:text-slate-700 hover:border-slate-700 focus:border-cyan-500/70 focus:ring-2 focus:ring-cyan-500/10"
                />
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="text-[10px] font-medium text-slate-400"
                  >
                    Password
                  </label>
                </div>

                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    required
                    aria-invalid={error ? true : undefined}
                    className="h-10 w-full rounded-lg border border-slate-800 bg-slate-900/60 px-3 pr-14 text-xs text-slate-200 outline-none transition placeholder:text-slate-700 hover:border-slate-700 focus:border-cyan-500/70 focus:ring-2 focus:ring-cyan-500/10"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-[9px] font-medium text-slate-600 outline-none transition hover:text-slate-300 focus-visible:text-cyan-300"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              {error && (
                <div
                  role="alert"
                  className="rounded-lg border border-rose-900/50 bg-rose-950/25 px-3 py-2.5"
                >
                  <div className="flex items-start gap-2">
                    <span
                      className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-400"
                      aria-hidden="true"
                    />

                    <p className="text-[10px] leading-4 text-rose-300">
                      {error}
                    </p>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !email.trim() || !password}
                className="flex h-10 w-full items-center justify-center rounded-lg bg-cyan-400 px-4 text-xs font-semibold text-slate-950 outline-none transition hover:bg-cyan-300 focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {loading ? "Signing in..." : "Sign in"}
              </button>
            </form>

            <div className="mt-6 border-t border-slate-800/70 pt-5 text-center">
              <p className="text-[10px] text-slate-600">
                Don&apos;t have an account?{" "}
                <Link
                  to="/register"
                  className="font-semibold text-cyan-400 outline-none transition hover:text-cyan-300 focus-visible:underline"
                >
                  Create an account
                </Link>
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

export default LoginPage;
