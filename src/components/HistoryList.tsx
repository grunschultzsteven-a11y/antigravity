import React from "react";
import { History, Clock, CheckCircle2, AlertCircle, Loader2, Trash2 } from "lucide-react";
import { RunHistoryItem } from "../types";

interface HistoryListProps {
  history: RunHistoryItem[];
  activeId?: string;
  onSelectRun: (id: string) => void;
  onDeleteRun: (id: string, e: React.MouseEvent) => void;
}

export const HistoryList: React.FC<HistoryListProps> = ({
  history,
  activeId,
  onSelectRun,
  onDeleteRun,
}) => {
  if (history.length === 0) {
    return (
      <div className="p-6 text-center text-xs text-slate-400">
        <History className="w-5 h-5 mx-auto mb-2 opacity-50" />
        <p>No previous runs recorded</p>
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />;
      case "failed":
        return <AlertCircle className="w-3.5 h-3.5 text-rose-600" />;
      case "in_progress":
        return <Loader2 className="w-3.5 h-3.5 text-indigo-600 animate-spin" />;
      default:
        return <Clock className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-1.5 p-2">
      {history.map((item) => {
        const isActive = item.id === activeId;
        const timeStr = new Date(item.createdAt).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });

        return (
          <div
            key={item.id}
            onClick={() => onSelectRun(item.id)}
            className={`group p-2.5 rounded-xl border text-xs transition-all cursor-pointer flex items-start justify-between gap-2 ${
              isActive
                ? "bg-indigo-50/80 border-indigo-200 shadow-xs"
                : "bg-white hover:bg-slate-50 border-slate-200"
            }`}
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mb-1">
                {getStatusIcon(item.status)}
                <span className="font-mono truncate">{item.id.slice(0, 16)}...</span>
                <span className="text-slate-300">•</span>
                <span>{timeStr}</span>
              </div>
              <p className="font-medium text-slate-800 line-clamp-2 leading-relaxed">
                {item.prompt}
              </p>
            </div>

            <button
              type="button"
              onClick={(e) => onDeleteRun(item.id, e)}
              className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-all shrink-0"
              title="Delete from history"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
