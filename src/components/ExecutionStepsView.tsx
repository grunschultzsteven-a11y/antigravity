import React, { useState } from "react";
import {
  Brain,
  Terminal,
  Globe,
  Link as LinkIcon,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Code2,
  FileCode,
  Sparkles,
  Search,
  Copy,
  Check,
} from "lucide-react";
import { InteractionStep } from "../types";

interface ExecutionStepsViewProps {
  steps: InteractionStep[];
  status: string;
}

export const ExecutionStepsView: React.FC<ExecutionStepsViewProps> = ({ steps, status }) => {
  const [expandedIndices, setExpandedIndices] = useState<Record<number, boolean>>({});
  const [copiedStep, setCopiedStep] = useState<number | null>(null);

  const toggleExpand = (index: number) => {
    setExpandedIndices((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const copyStepData = (data: string, index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(data);
    setCopiedStep(index);
    setTimeout(() => setCopiedStep(null), 2000);
  };

  if (!steps || steps.length === 0) {
    return (
      <div className="p-8 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
        <Sparkles className="w-8 h-8 mx-auto text-slate-400 mb-2 animate-pulse" />
        <p className="text-sm font-medium text-slate-600">Waiting for agent steps...</p>
        <p className="text-xs text-slate-400 mt-1">
          {status === "in_progress"
            ? "Antigravity Agent is provisioning sandbox environment and planning..."
            : "Agent execution trace will appear here."}
        </p>
      </div>
    );
  }

  // Helper to format step details
  const getStepIcon = (type: string) => {
    switch (type) {
      case "thought":
        return <Brain className="w-4 h-4 text-purple-600" />;
      case "code_execution_call":
      case "code_execution_result":
        return <Terminal className="w-4 h-4 text-emerald-600" />;
      case "google_search_call":
      case "google_search_result":
        return <Search className="w-4 h-4 text-blue-600" />;
      case "url_context_call":
      case "url_context_result":
        return <LinkIcon className="w-4 h-4 text-cyan-600" />;
      case "function_call":
      case "function_result":
        return <Code2 className="w-4 h-4 text-amber-600" />;
      case "model_output":
        return <CheckCircle2 className="w-4 h-4 text-indigo-600" />;
      default:
        return <Sparkles className="w-4 h-4 text-slate-500" />;
    }
  };

  const getStepBadgeColor = (type: string) => {
    switch (type) {
      case "thought":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "code_execution_call":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "code_execution_result":
        return "bg-emerald-950 text-emerald-300 border-emerald-800";
      case "google_search_call":
      case "google_search_result":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "url_context_call":
      case "url_context_result":
        return "bg-cyan-50 text-cyan-700 border-cyan-200";
      case "function_call":
      case "function_result":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "model_output":
        return "bg-indigo-50 text-indigo-700 border-indigo-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const formatStepTitle = (step: InteractionStep, index: number) => {
    switch (step.type) {
      case "thought":
        return step.summary || "Agent Reasoning / Chain of Thought";
      case "code_execution_call":
        return "Executing Code / Shell in Sandbox";
      case "code_execution_result":
        return "Sandbox Execution Output";
      case "google_search_call":
        return `Google Search: ${step.query || step.call?.query || step.arguments?.query || "Web query"}`;
      case "google_search_result":
        return "Google Search Grounding Result";
      case "url_context_call":
        return `Fetching URL: ${step.url || step.call?.url || step.arguments?.url || "Web page"}`;
      case "url_context_result":
        return "URL Context Retrieved";
      case "function_call":
        return `Tool Call: ${step.name || "function"}`;
      case "function_result":
        return `Tool Result: ${step.name || step.call_id || "function"}`;
      case "user_input":
        return "User Input";
      case "model_output":
        return `Model Output Segment #${index + 1}`;
      default:
        return `Step: ${step.type}`;
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between pb-2 border-b border-slate-200 text-xs font-medium text-slate-500">
        <span>Timeline & Tool Trace ({steps.length} steps)</span>
        <button
          type="button"
          onClick={() => {
            const allExpanded = Object.keys(expandedIndices).length === steps.length;
            if (allExpanded) {
              setExpandedIndices({});
            } else {
              const full: Record<number, boolean> = {};
              steps.forEach((_, i) => (full[i] = true));
              setExpandedIndices(full);
            }
          }}
          className="text-indigo-600 hover:text-indigo-800 font-medium cursor-pointer"
        >
          {Object.keys(expandedIndices).length === steps.length ? "Collapse all" : "Expand all"}
        </button>
      </div>

      <div className="relative pl-6 border-l-2 border-slate-200 space-y-3">
        {steps.map((step, idx) => {
          const isExpanded = Boolean(expandedIndices[idx]);
          const stepTitle = formatStepTitle(step, idx);

          // Extract content string or representation
          let contentStr = "";
          if (step.thought) contentStr = step.thought;
          else if (step.summary) contentStr = step.summary;
          else if (step.code) contentStr = step.code;
          else if (step.call?.code) contentStr = step.call.code;
          else if (step.output) contentStr = step.output;
          else if (step.result?.output) contentStr = step.result.output;
          else if (step.content && Array.isArray(step.content)) {
            contentStr = step.content
              .map((c) => (c.type === "text" ? c.text : `[${c.type}]`))
              .join("\n");
          } else if (step.arguments) {
            contentStr = JSON.stringify(step.arguments, null, 2);
          } else if (step.result) {
            contentStr = typeof step.result === "string" ? step.result : JSON.stringify(step.result, null, 2);
          } else {
            contentStr = JSON.stringify(step, null, 2);
          }

          return (
            <div key={idx} className="relative group">
              {/* Timeline marker icon */}
              <div className="absolute -left-[31px] top-2.5 w-6 h-6 rounded-full bg-white border border-slate-300 flex items-center justify-center shadow-xs">
                {getStepIcon(step.type)}
              </div>

              {/* Step Card */}
              <div
                onClick={() => toggleExpand(idx)}
                className={`border rounded-lg transition-all duration-150 cursor-pointer overflow-hidden ${
                  isExpanded ? "border-slate-300 bg-white shadow-xs" : "border-slate-200 bg-slate-50/70 hover:bg-slate-50"
                }`}
              >
                <div className="px-3.5 py-2.5 flex items-center justify-between gap-2 select-none">
                  <div className="flex items-center gap-2 min-w-0">
                    <button type="button" className="text-slate-400 group-hover:text-slate-600">
                      {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>
                    <span
                      className={`text-[11px] font-mono px-2 py-0.5 rounded border uppercase font-medium ${getStepBadgeColor(
                        step.type
                      )}`}
                    >
                      {step.type.replace(/_/g, " ")}
                    </span>
                    <span className="text-xs sm:text-sm font-medium text-slate-800 truncate">
                      {stepTitle}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {contentStr && (
                      <button
                        type="button"
                        onClick={(e) => copyStepData(contentStr, idx, e)}
                        className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
                        title="Copy step details"
                      >
                        {copiedStep === idx ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="px-3.5 pb-3 pt-1 border-t border-slate-100 bg-white">
                    {step.type === "code_execution_call" || step.type === "code_execution_result" ? (
                      <div className="rounded-md bg-slate-950 p-3 text-emerald-400 font-mono text-xs overflow-x-auto border border-slate-800">
                        <div className="flex items-center gap-1 text-[11px] text-slate-400 mb-1 border-b border-slate-800 pb-1">
                          <Terminal className="w-3 h-3" />
                          <span>{step.type === "code_execution_call" ? "Script Code" : "Standard Output"}</span>
                        </div>
                        <pre className="whitespace-pre-wrap">{contentStr}</pre>
                      </div>
                    ) : step.type === "thought" ? (
                      <div className="rounded-md bg-purple-50/60 p-3 border border-purple-100 text-xs text-purple-900 leading-relaxed font-sans">
                        <div className="flex items-center gap-1 text-[11px] font-semibold text-purple-800 mb-1">
                          <Brain className="w-3.5 h-3.5" />
                          <span>Internal Reasoning Trace</span>
                        </div>
                        <p className="whitespace-pre-wrap">{contentStr}</p>
                      </div>
                    ) : (
                      <div className="rounded-md bg-slate-50 p-2.5 text-xs text-slate-700 font-mono overflow-x-auto border border-slate-200">
                        <pre className="whitespace-pre-wrap">{contentStr}</pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
