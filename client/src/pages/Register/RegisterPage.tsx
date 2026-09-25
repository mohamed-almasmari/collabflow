import { useState, type SyntheticEvent } from "react";

import { Link, useNavigate } from "react-router";

import { registerUser } from "../../api/auth.ts";

import AuthFlowVisual from "../../components/auth/AuthFlowVisual";

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

    if (!passwordsMatch) {
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
    <main className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="pointer-events-none absolute left-[8%] top-[10%] h-80 w-80 animate-pulse rounded-full bg-violet-500/[0.07] blur-3xl" />

      <div className="pointer-events-none absolute bottom-[5%] right-[8%] h-96 w-96 animate-pulse rounded-full bg-cyan-500/[0.07] blur-3xl [animation-delay:700ms]" />

      <div className="relative flex min-h-screen items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="w-full max-w-[1050px]">
          <div className="mb-5 flex justify-start">
            <Link
              to="/login"
              className="group inline-flex items-center gap-2.5"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-br from-violet-400 to-cyan-400 text-[10px] font-black text-slate-950 shadow-lg shadow-violet-500/20 transition group-hover:scale-105">
                CF
              </div>

              <span className="text-sm font-semibold text-slate-100">
                CollabFlow
              </span>
            </Link>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 shadow-2xl shadow-black/40 backdrop-blur-xl">
            <div className="grid lg:grid-cols-[1.08fr_0.92fr]">
              <div className="hidden border-r border-slate-800/80 lg:block">
                <AuthFlowVisual mode="register" />
              </div>

              <section className="flex min-h-[570px] items-center justify-center p-6 sm:p-9">
                <div className="w-full max-w-[340px]">
                  <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-violet-400">
                    Start collaborating
                  </p>

                  <h2 className="mt-2 text-[26px] font-semibold tracking-[-0.025em] text-white">
                    Create your account
                  </h2>

                  <p className="mt-2 text-[11px] leading-5 text-slate-500">
                    Create a workspace and start moving work forward with your
                    team.
                  </p>

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
                        type="text"
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        required
                        className="h-10 w-full rounded-lg border border-slate-800 bg-slate-950/70 px-3 text-xs text-slate-200 outline-none transition focus:border-violet-500/70 focus:ring-4 focus:ring-violet-500/[0.06]"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="email"
                        className="mb-1.5 block text-[10px] font-medium text-slate-400"
                      >
                        Email
                      </label>

                      <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        required
                        className="h-10 w-full rounded-lg border border-slate-800 bg-slate-950/70 px-3 text-xs text-slate-200 outline-none transition focus:border-violet-500/70 focus:ring-4 focus:ring-violet-500/[0.06]"
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
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(event) => setPassword(event.target.value)}
                          minLength={8}
                          required
                          className="h-10 w-full rounded-lg border border-slate-800 bg-slate-950/70 px-3 pr-14 text-xs text-slate-200 outline-none transition focus:border-violet-500/70 focus:ring-4 focus:ring-violet-500/[0.06]"
                        />

                        <button
                          type="button"
                          onClick={() => setShowPassword((current) => !current)}
                          className="absolute inset-y-0 right-0 px-3 text-[9px] text-slate-600 transition hover:text-violet-300"
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
                        type={showPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(event) =>
                          setConfirmPassword(event.target.value)
                        }
                        minLength={8}
                        required
                        className="h-10 w-full rounded-lg border border-slate-800 bg-slate-950/70 px-3 text-xs text-slate-200 outline-none transition focus:border-violet-500/70 focus:ring-4 focus:ring-violet-500/[0.06]"
                      />
                    </div>

                    {error && (
                      <div
                        role="alert"
                        className="rounded-lg border border-rose-900/50 bg-rose-950/20 px-3 py-2 text-[10px] text-rose-300"
                      >
                        {error}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={
                        loading ||
                        !name.trim() ||
                        !email.trim() ||
                        password.length < 8 ||
                        !passwordsMatch
                      }
                      className="group relative h-10 w-full overflow-hidden rounded-lg bg-violet-500 text-xs font-semibold text-white shadow-lg shadow-violet-500/10 transition hover:-translate-y-0.5 hover:bg-violet-400 hover:shadow-violet-500/20 disabled:translate-y-0 disabled:opacity-40"
                    >
                      <span className="relative z-10">
                        {loading
                          ? "Creating account..."
                          : "Create workspace account"}
                      </span>

                      <span className="absolute inset-y-0 -left-16 w-12 rotate-12 bg-white/20 blur-md transition-all duration-700 group-hover:left-[110%]" />
                    </button>
                  </form>

                  <div className="mt-5 border-t border-slate-800/70 pt-5 text-center">
                    <p className="text-[10px] text-slate-600">
                      Already have an account?{" "}
                      <Link
                        to="/login"
                        className="font-semibold text-violet-400 transition hover:text-violet-300"
                      >
                        Sign in
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

export default RegisterPage;
