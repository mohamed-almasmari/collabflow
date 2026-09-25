interface AuthFlowVisualProps {
  mode?: "login" | "register";
}

function AuthFlowVisual({ mode = "login" }: AuthFlowVisualProps) {
  const isRegister = mode === "register";

  return (
    <section
      aria-hidden="true"
      className={`relative flex min-h-[570px] items-center overflow-hidden p-10 ${
        isRegister
          ? "bg-gradient-to-br from-violet-950/20 via-slate-950/20 to-cyan-950/20"
          : "bg-gradient-to-br from-cyan-950/20 via-slate-950/20 to-violet-950/20"
      }`}
    >
      <div className="pointer-events-none absolute -left-20 top-16 h-64 w-64 animate-pulse rounded-full bg-cyan-500/10 blur-3xl" />

      <div className="pointer-events-none absolute -bottom-20 right-0 h-72 w-72 animate-pulse rounded-full bg-violet-500/10 blur-3xl [animation-delay:700ms]" />

      <div className="relative z-10 w-full">
        <div className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/70 px-3 py-1.5">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-40" />

            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
          </span>

          <span className="text-[8px] font-bold uppercase tracking-[0.18em] text-slate-500">
            Live workflow
          </span>
        </div>

        <h1 className="mt-5 max-w-md text-[38px] font-semibold leading-[1.08] tracking-[-0.035em] text-white xl:text-[44px]">
          Work moves.
          <span className="block bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-400 bg-clip-text text-transparent">
            Your team moves with it.
          </span>
        </h1>

        <p className="mt-5 max-w-md text-[13px] leading-6 text-slate-500">
          Plan, assign, discuss, and move work from idea to completion without
          losing context.
        </p>

        <div className="relative mt-8 overflow-hidden rounded-xl border border-slate-800 bg-slate-950/60 shadow-2xl shadow-black/20 backdrop-blur">
          <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
            <div>
              <p className="text-[8px] font-semibold uppercase tracking-[0.16em] text-slate-600">
                Project
              </p>

              <p className="mt-1 text-[11px] font-semibold text-slate-300">
                Product launch
              </p>
            </div>

            <div className="flex -space-x-1.5">
              <div className="flex h-6 w-6 animate-bounce items-center justify-center rounded-full border-2 border-slate-950 bg-cyan-500 text-[6px] font-bold text-white [animation-duration:2.8s]">
                MA
              </div>

              <div className="flex h-6 w-6 animate-bounce items-center justify-center rounded-full border-2 border-slate-950 bg-violet-500 text-[6px] font-bold text-white [animation-delay:300ms] [animation-duration:2.8s]">
                JS
              </div>

              <div className="flex h-6 w-6 animate-bounce items-center justify-center rounded-full border-2 border-slate-950 bg-emerald-500 text-[6px] font-bold text-white [animation-delay:600ms] [animation-duration:2.8s]">
                AK
              </div>
            </div>
          </div>

          <div className="relative grid grid-cols-3 gap-2 p-3">
            <div className="rounded-lg bg-slate-900/50 p-2">
              <div className="mb-2 flex items-center gap-1.5 text-[8px] font-medium text-slate-500">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-500" />
                Backlog
                <span className="ml-auto text-slate-700">3</span>
              </div>

              <div className="rounded-md border border-slate-800 bg-slate-950/70 p-2 opacity-60">
                <span className="rounded bg-blue-500/10 px-1.5 py-0.5 text-[6px] font-bold text-blue-400">
                  LOW
                </span>

                <p className="mt-2 text-[8px] leading-4 text-slate-400">
                  Update profile settings
                </p>
              </div>

              <div className="mt-2 animate-pulse rounded-md border border-cyan-500/20 bg-slate-950/80 p-2 shadow-lg shadow-cyan-500/5">
                <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[6px] font-bold text-amber-400">
                  HIGH
                </span>

                <p className="mt-2 text-[8px] leading-4 text-slate-300">
                  Build notification center
                </p>

                <div className="mt-2 flex items-center justify-between">
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-cyan-500 text-[5px] font-bold text-white">
                    MA
                  </span>

                  <span className="text-[6px] text-slate-600">3 tasks</span>
                </div>
              </div>
            </div>

            <div className="rounded-lg bg-slate-900/50 p-2">
              <div className="mb-2 flex items-center gap-1.5 text-[8px] font-medium text-slate-500">
                <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />
                In progress
                <span className="ml-auto text-slate-700">2</span>
              </div>

              <div className="rounded-md border border-violet-500/20 bg-slate-950/80 p-2 shadow-lg shadow-violet-500/5">
                <div className="flex items-center justify-between gap-2">
                  <span className="rounded bg-rose-500/10 px-1.5 py-0.5 text-[6px] font-bold text-rose-400">
                    URGENT
                  </span>

                  <span className="flex items-center gap-1 text-[6px] text-cyan-400">
                    <span className="h-1 w-1 animate-ping rounded-full bg-cyan-400" />
                    editing
                  </span>
                </div>

                <p className="mt-2 text-[8px] leading-4 text-slate-300">
                  Fix authentication refresh
                </p>

                <div className="mt-3 h-1 overflow-hidden rounded-full bg-slate-800">
                  <div className="h-full w-2/3 animate-pulse rounded-full bg-gradient-to-r from-cyan-400 to-violet-500" />
                </div>

                <div className="mt-2 flex items-center justify-between">
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-violet-500 text-[5px] font-bold text-white">
                    JS
                  </span>

                  <span className="text-[6px] text-slate-600">67%</span>
                </div>
              </div>
            </div>

            <div className="rounded-lg bg-slate-900/50 p-2">
              <div className="mb-2 flex items-center gap-1.5 text-[8px] font-medium text-slate-500">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Done
                <span className="ml-auto text-slate-700">5</span>
              </div>

              <div className="rounded-md border border-emerald-500/15 bg-emerald-950/10 p-2">
                <div className="flex items-start gap-2">
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-[7px] text-emerald-400">
                    ✓
                  </span>

                  <p className="text-[8px] leading-4 text-slate-400">
                    Create workspace API
                  </p>
                </div>

                <div className="mt-2 flex items-center justify-between text-[6px] text-slate-600">
                  <span>Completed</span>

                  <span className="text-emerald-400">✓</span>
                </div>
              </div>
            </div>

            <svg
              viewBox="0 0 600 80"
              className="pointer-events-none absolute bottom-1 left-8 right-8 h-16 w-[calc(100%-4rem)]"
            >
              <defs>
                <linearGradient id="flow-gradient" x1="0" x2="1">
                  <stop offset="0%" stopColor="#22d3ee" stopOpacity="0" />

                  <stop offset="30%" stopColor="#22d3ee" stopOpacity="0.75" />

                  <stop offset="65%" stopColor="#8b5cf6" stopOpacity="0.8" />

                  <stop offset="100%" stopColor="#34d399" stopOpacity="0" />
                </linearGradient>
              </defs>

              <path
                id="workflow-path"
                d="M20 40 C120 10, 175 70, 280 40 S450 10, 580 40"
                fill="none"
                stroke="url(#flow-gradient)"
                strokeWidth="1.5"
                strokeDasharray="5 7"
                opacity="0.6"
              >
                <animate
                  attributeName="stroke-dashoffset"
                  from="0"
                  to="-48"
                  dur="3s"
                  repeatCount="indefinite"
                />
              </path>

              <circle r="4" fill="#22d3ee">
                <animateMotion dur="4.5s" repeatCount="indefinite">
                  <mpath href="#workflow-path" />
                </animateMotion>
              </circle>

              <circle r="3" fill="#8b5cf6">
                <animateMotion
                  dur="4.5s"
                  begin="-1.5s"
                  repeatCount="indefinite"
                >
                  <mpath href="#workflow-path" />
                </animateMotion>
              </circle>

              <circle r="3" fill="#34d399">
                <animateMotion dur="4.5s" begin="-3s" repeatCount="indefinite">
                  <mpath href="#workflow-path" />
                </animateMotion>
              </circle>
            </svg>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-5 text-[9px] text-slate-600">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
            Realtime presence
          </div>

          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />
            Live updates
          </div>

          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Shared progress
          </div>
        </div>
      </div>
    </section>
  );
}

export default AuthFlowVisual;
