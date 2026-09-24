import { useState } from "react";

import type { Issue } from "../../api/issues";

import { exportIssuesToCsv } from "../../utils/exportIssuesCsv";

interface BoardActionsProps {
  issues: Issue[];

  projectName: string;
}

type CopyState = "idle" | "copied" | "error";

function BoardActions({ issues, projectName }: BoardActionsProps) {
  const [copyState, setCopyState] = useState<CopyState>("idle");

  async function handleCopyViewLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);

      setCopyState("copied");

      window.setTimeout(() => {
        setCopyState("idle");
      }, 2000);
    } catch {
      setCopyState("error");

      window.setTimeout(() => {
        setCopyState("idle");
      }, 2000);
    }
  }

  function handleExport() {
    exportIssuesToCsv(issues, projectName);
  }

  return (
    <section className="mb-6 flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="text-sm font-semibold text-white">Board Actions</h2>

        <p className="mt-1 text-xs text-slate-500">
          Share this exact board view or export the visible issues.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => {
            void handleCopyViewLink();
          }}
          className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 transition hover:border-cyan-500/50 hover:bg-slate-800 hover:text-white"
        >
          {copyState === "copied"
            ? "Link Copied"
            : copyState === "error"
              ? "Copy Failed"
              : "Copy View Link"}
        </button>

        <button
          type="button"
          onClick={handleExport}
          disabled={issues.length === 0}
          className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Export CSV ({issues.length})
        </button>
      </div>
    </section>
  );
}

export default BoardActions;
