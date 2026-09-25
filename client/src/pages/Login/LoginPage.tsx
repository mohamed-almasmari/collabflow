import { useState, type SyntheticEvent } from "react";

import { Link, Navigate, useNavigate } from "react-router";

import AuthFlowVisual from "../../components/auth/AuthFlowVisual";

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
    <main className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="pointer-events-none absolute left-[8%] top-[10%] h-80 w-80 animate-pulse rounded-full bg-cyan-500/[0.07] blur-3xl" />

      <div className="pointer-events-none absolute bottom-[5%] right-[8%] h-96 w-96 animate-pulse rounded-full bg-violet-500/[0.07] blur-3xl [animation-delay:700ms]" />

      <div className="relative flex min-h-screen items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="w-full max-w-[1050px]">
          <div className="mb-5 flex justify-start">
            <Link
              to="/login"
              className="group inline-flex items-center gap-2.5 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-br from-cyan-300 to-cyan-500 text-[10px] font-black text-slate-950 shadow-lg shadow-cyan-500/20 transition group-hover:scale-105">
                CF
              </div>

              <span className="text-sm font-semibold tracking-tight text-slate-100">
                CollabFlow
              </span>
            </Link>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 shadow-2xl shadow-black/40 backdrop-blur-xl">
            <div className="grid lg:grid-cols-[1.08fr_0.92fr]">
              <div className="hidden border-r border-slate-800/80 lg:block">
                <AuthFlowVisual mode="login" />
              </div>

              <section className="flex min-h-[570px] items-center justify-center p-6 sm:p-10 lg:p-12">
                <div className="w-full max-w-[340px]">
                  <div>
                    <div className="mb-5 flex h-9 w-9 items-center justify-center rounded-lg border border-cyan-500/20 bg-cyan-500/10">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        className="h-4 w-4 text-cyan-400"
                        aria-hidden="true"
                      >
                        <path d="M7 10V8a5 5 0 0 1 10 0v2" />

                        <rect x="5" y="10" width="14" height="10" rx="2" />
                      </svg>
                    </div>

                    <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-cyan-400">
                      Welcome back
                    </p>

                    <h2 className="mt-2 text-[26px] font-semibold tracking-[-0.025em] text-white">
                      Sign in to CollabFlow
                    </h2>

                    <p className="mt-2 text-[11px] leading-5 text-slate-500">
                      Pick up exactly where your team left off.
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
                        placeholder="email@example.com"
                        required
                        className="h-11 w-full rounded-lg border border-slate-800 bg-slate-950/70 px-3 text-xs text-slate-200 outline-none transition placeholder:text-slate-700 hover:border-slate-700 focus:border-cyan-500/70 focus:ring-4 focus:ring-cyan-500/[0.06]"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="password"
                        className="mb-1.5 block text-[10px] font-medium text-slate-400"
                      >
                        Password
                      </label>

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
                          className="h-11 w-full rounded-lg border border-slate-800 bg-slate-950/70 px-3 pr-14 text-xs text-slate-200 outline-none transition placeholder:text-slate-700 hover:border-slate-700 focus:border-cyan-500/70 focus:ring-4 focus:ring-cyan-500/[0.06]"
                        />

                        <button
                          type="button"
                          onClick={() => setShowPassword((current) => !current)}
                          className="absolute inset-y-0 right-0 px-3 text-[9px] font-medium text-slate-600 transition hover:text-cyan-300"
                        >
                          {showPassword ? "Hide" : "Show"}
                        </button>
                      </div>
                    </div>

                    {error && (
                      <div
                        role="alert"
                        className="rounded-lg border border-rose-900/50 bg-rose-950/20 px-3 py-2.5"
                      >
                        <p className="text-[10px] leading-4 text-rose-300">
                          {error}
                        </p>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={loading || !email.trim() || !password}
                      className="group relative h-11 w-full overflow-hidden rounded-lg bg-cyan-400 text-xs font-semibold text-slate-950 shadow-lg shadow-cyan-500/10 outline-none transition hover:-translate-y-0.5 hover:bg-cyan-300 hover:shadow-cyan-500/20 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <span className="relative z-10">
                        {loading ? "Signing in..." : "Continue to workspace"}
                      </span>

                      <span className="absolute inset-y-0 -left-16 w-12 rotate-12 bg-white/25 blur-md transition-all duration-700 group-hover:left-[110%]" />
                    </button>
                  </form>

                  <div className="mt-6 border-t border-slate-800/70 pt-5 text-center">
                    <p className="text-[10px] text-slate-600">
                      New to CollabFlow?{" "}
                      <Link
                        to="/register"
                        className="font-semibold text-cyan-400 transition hover:text-cyan-300"
                      >
                        Create an account
                      </Link>
                    </p>
                  </div>
                </div>
              </section>
            </div>
          </div>

          <p className="mt-4 text-center text-[8px] uppercase tracking-[0.18em] text-slate-800">
            Plan · Collaborate · Deliver
          </p>
        </div>
      </div>
    </main>
  );
}

export default LoginPage;
