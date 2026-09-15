import React, { useState } from "react";
import { Box, Download, ShieldCheck, Server, Check, Copy, RefreshCw } from "lucide-react";

interface EnvironmentCardProps {
  environmentId?: string;
  networkAllowlist?: string[];
  onDownloadSnapshot?: (envId: string) => void;
  isDownloading?: boolean;
}

export const EnvironmentCard: React.FC<EnvironmentCardProps> = ({
  environmentId,
  networkAllowlist = ["generativelanguage.googleapis.com"],
  onDownloadSnapshot,
  isDownloading = false,
}) => {
  const [copied, setCopied] = useState(false);

  const copyEnvId = () => {
    if (!environmentId) return;
    navigator.clipboard.writeText(environmentId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!environmentId) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4 text-xs text-slate-500">
        <div className="flex items-center gap-2 font-medium text-slate-700 mb-1">
          <Server className="w-4 h-4 text-slate-400" />
          <span>Remote Linux Sandbox</span>
        </div>
        <p className="text-slate-400">
          Sandbox environment will be provisioned by Antigravity Agent upon execution.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-50/40 via-white to-slate-50 p-4 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
            <Box className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-slate-800">Sandboxed Environment</h4>
            <div className="flex items-center gap-1 text-[11px] font-mono text-slate-500">
              <span>ID: {environmentId}</span>
              <button
                type="button"
                onClick={copyEnvId}
                className="text-slate-400 hover:text-slate-700 p-0.5"
                title="Copy Environment ID"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
          </div>
        </div>

        {onDownloadSnapshot && (
          <button
            type="button"
            onClick={() => onDownloadSnapshot(environmentId)}
            disabled={isDownloading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-indigo-700 bg-indigo-100/70 hover:bg-indigo-100 transition-colors disabled:opacity-50 cursor-pointer"
            title="Download workspace files as snapshot.tar"
          >
            {isDownloading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Archiving...</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                <span>Export Snapshot (.tar)</span>
              </>
            )}
          </button>
        )}
      </div>

      <div className="pt-2.5 border-t border-indigo-100/60 flex flex-wrap items-center gap-3 text-xs text-slate-600">
        <div className="flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span className="text-slate-500">Network:</span>
          <span className="font-mono text-[11px] text-slate-700 bg-white px-1.5 py-0.5 rounded border border-slate-200">
            {networkAllowlist.join(", ")}
          </span>
        </div>
        <div className="text-[11px] text-slate-500">
          Auth Header: <span className="font-mono text-slate-700">x-goog-api-key</span>
        </div>
      </div>
    </div>
  );
};
