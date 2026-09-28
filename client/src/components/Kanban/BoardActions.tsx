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
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => {
          void handleCopyViewLink();
        }}
        className="rounded-lg border border-slate-800 bg-slate-900/50 px-3 py-2 text-[11px] font-medium text-slate-400 transition hover:border-slate-700 hover:text-white"
      >
        {copyState === "copied"
          ? "Copied"
          : copyState === "error"
            ? "Copy failed"
            : "Copy link"}
      </button>

      <button
        type="button"
        onClick={handleExport}
        disabled={issues.length === 0}
        className="rounded-lg border border-cyan-500/20 bg-cyan-500/10 px-3 py-2 text-[11px] font-medium text-cyan-300 transition hover:bg-cyan-500/15 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Export CSV
        <span className="ml-1 text-cyan-500">{issues.length}</span>
      </button>
    </div>
  );
}

export default BoardActions;
