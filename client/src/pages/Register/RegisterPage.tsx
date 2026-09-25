import { useState, type SyntheticEvent } from "react";

import { Link, useNavigate } from "react-router";

import { registerUser } from "../../api/auth.ts";

function RegisterPage() {
  const navigate = useNavigate();

  const [name, setName] = useState("");

  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");

  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);

  const passwordsMatch = password === confirmPassword;

  async function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();

    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match");

      return;
    }

    try {
      setLoading(true);

      await registerUser({
        name,
        email,
        password,
      });

      navigate("/login", {
        replace: true,
      });
    } catch (registerError) {
      setError(
        registerError instanceof Error
          ? registerError.message
          : "Unable to create account",
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
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-violet-400">
              Work better together
            </p>

            <h1 className="mt-4 text-4xl font-semibold leading-tight tracking-tight text-white xl:text-5xl">
              Turn ideas into work.
              <span className="block text-slate-500">
                Turn work into progress.
              </span>
            </h1>

            <p className="mt-5 max-w-md text-sm leading-6 text-slate-500">
              Create a workspace, organize projects, assign issues, and
              collaborate with your team from one focused interface.
            </p>

            <div className="mt-8 space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-cyan-500/10 text-cyan-400">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className="h-3.5 w-3.5"
                    aria-hidden="true"
                  >
                    <path d="m5 12 4 4L19 6" />
                  </svg>
                </div>

                <p className="text-xs text-slate-400">
                  Real-time project collaboration
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-violet-500/10 text-violet-400">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className="h-3.5 w-3.5"
                    aria-hidden="true"
                  >
                    <path d="m5 12 4 4L19 6" />
                  </svg>
                </div>

                <p className="text-xs text-slate-400">
                  Issues, checklists, comments, and mentions
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-400">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className="h-3.5 w-3.5"
                    aria-hidden="true"
                  >
                    <path d="m5 12 4 4L19 6" />
                  </svg>
                </div>

                <p className="text-xs text-slate-400">
                  Workspace roles and team management
                </p>
              </div>
            </div>
          </div>

          <p className="text-[9px] text-slate-700">CollabFlow</p>
        </section>

        <section className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-8">
          <div className="w-full max-w-sm">
            <div className="mb-7 lg:hidden">
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
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-violet-400">
                Get started
              </p>

              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">
                Create your account
              </h2>

              <p className="mt-2 text-xs leading-5 text-slate-500">
                Set up your CollabFlow account and create your first workspace.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-3.5">
              <div>
                <label
                  htmlFor="name"
                  className="mb-1.5 block text-[10px] font-medium text-slate-400"
                >
                  Name
                </label>

                <input
                  id="name"
                  name="name"
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  autoComplete="name"
                  placeholder="Your name"
                  required
                  className="h-10 w-full rounded-lg border border-slate-800 bg-slate-900/60 px-3 text-xs text-slate-200 outline-none transition placeholder:text-slate-700 hover:border-slate-700 focus:border-violet-500/70 focus:ring-2 focus:ring-violet-500/10"
                />
              </div>

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
                  className="h-10 w-full rounded-lg border border-slate-800 bg-slate-900/60 px-3 text-xs text-slate-200 outline-none transition placeholder:text-slate-700 hover:border-slate-700 focus:border-violet-500/70 focus:ring-2 focus:ring-violet-500/10"
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
                    minLength={8}
                    autoComplete="new-password"
                    placeholder="Minimum 8 characters"
                    required
                    className="h-10 w-full rounded-lg border border-slate-800 bg-slate-900/60 px-3 pr-14 text-xs text-slate-200 outline-none transition placeholder:text-slate-700 hover:border-slate-700 focus:border-violet-500/70 focus:ring-2 focus:ring-violet-500/10"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-[9px] font-medium text-slate-600 outline-none transition hover:text-slate-300 focus-visible:text-violet-300"
                    aria-label={
                      showPassword ? "Hide passwords" : "Show passwords"
                    }
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="mb-1.5 block text-[10px] font-medium text-slate-400"
                >
                  Confirm password
                </label>

                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  minLength={8}
                  autoComplete="new-password"
                  placeholder="Repeat your password"
                  required
                  aria-invalid={
                    confirmPassword && !passwordsMatch ? true : undefined
                  }
                  className={`h-10 w-full rounded-lg border bg-slate-900/60 px-3 text-xs text-slate-200 outline-none transition placeholder:text-slate-700 focus:ring-2 ${
                    confirmPassword && !passwordsMatch
                      ? "border-rose-800 focus:border-rose-500 focus:ring-rose-500/10"
                      : "border-slate-800 hover:border-slate-700 focus:border-violet-500/70 focus:ring-violet-500/10"
                  }`}
                />

                {confirmPassword && !passwordsMatch && (
                  <p className="mt-1.5 text-[9px] text-rose-400">
                    Passwords do not match.
                  </p>
                )}
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
                disabled={
                  loading ||
                  !name.trim() ||
                  !email.trim() ||
                  password.length < 8 ||
                  !confirmPassword ||
                  !passwordsMatch
                }
                className="flex h-10 w-full items-center justify-center rounded-lg bg-violet-500 px-4 text-xs font-semibold text-white outline-none transition hover:bg-violet-400 focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {loading ? "Creating account..." : "Create account"}
              </button>
            </form>

            <div className="mt-5 border-t border-slate-800/70 pt-5 text-center">
              <p className="text-[10px] text-slate-600">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="font-semibold text-violet-400 outline-none transition hover:text-violet-300 focus-visible:underline"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

export default RegisterPage;
