import React, { useState } from "react";
import {
  Play,
  Square,
  Sparkles,
  Terminal,
  Search,
  Globe,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  RotateCcw,
} from "lucide-react";
import { AgentToolsConfig } from "../types";

interface AgentConfigPanelProps {
  prompt: string;
  setPrompt: (value: string) => void;
  isRunning: boolean;
  onStart: () => void;
  onStop?: () => void;
  tools: AgentToolsConfig;
  setTools: React.Dispatch<React.SetStateAction<AgentToolsConfig>>;
  activeEnvironmentId?: string;
  reuseEnvironment: boolean;
  setReuseEnvironment: (reuse: boolean) => void;
  previousInteractionId?: string;
}

const PRESETS = [
  {
    title: "Python Benchmark & Analysis",
    prompt: "Write a Python script that benchmarks three different algorithms for finding prime numbers up to 100,000. Run it, output the execution times, and summarize the computational trade-offs.",
  },
  {
    title: "Live Web & Documentation Research",
    prompt: "Search the web for recent developments regarding Google Antigravity Agent and the Gemini Interactions API. Summarize key capabilities, supported tools, and provide a clear overview.",
  },
  {
    title: "Data Generation & Visualization Script",
    prompt: "Create a Python script that generates synthetic monthly revenue data for an AI SaaS startup over 12 months, calculates moving averages, and formats a clean Markdown report with a table and insights.",
  },
  {
    title: "URL Context Analysis",
    prompt: "Fetch and summarize the documentation from https://generativelanguage.googleapis.com, explaining the core endpoints and interaction lifecycle.",
  },
];

export const AgentConfigPanel: React.FC<AgentConfigPanelProps> = ({
  prompt,
  setPrompt,
  isRunning,
  onStart,
  onStop,
  tools,
  setTools,
  activeEnvironmentId,
  reuseEnvironment,
  setReuseEnvironment,
  previousInteractionId,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const toggleTool = (toolKey: keyof AgentToolsConfig) => {
    setTools((prev) => ({
      ...prev,
      [toolKey]: !prev[toolKey],
    }));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && !isRunning && prompt.trim()) {
      e.preventDefault();
      onStart();
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 transition-all">
      {/* Preset pills */}
      <div className="mb-3">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-2">
          <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
          <span>Quick Prompts</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setPrompt(preset.prompt)}
              disabled={isRunning}
              className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50/70 hover:bg-slate-100 hover:border-slate-300 text-slate-700 transition-colors disabled:opacity-50 text-left cursor-pointer"
            >
              {preset.title}
            </button>
          ))}
        </div>
      </div>

      {/* Main Prompt Input */}
      <div className="relative">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter prompt for Antigravity Agent (e.g. Write a script to calculate Fibonacci numbers, or search the web for latest AI news)..."
          rows={3}
          disabled={isRunning}
          className="w-full resize-y rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 p-3.5 text-sm text-slate-800 placeholder-slate-400 outline-hidden transition-all font-sans leading-relaxed disabled:bg-slate-50"
        />

        <div className="flex flex-wrap items-center justify-between gap-3 mt-3">
          {/* Tool toggles */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-slate-500 font-medium mr-1">Tools:</span>

            <button
              type="button"
              onClick={() => toggleTool("code_execution")}
              disabled={isRunning}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-medium transition-colors cursor-pointer ${
                tools.code_execution
                  ? "bg-emerald-50 text-emerald-700 border-emerald-300 shadow-2xs"
                  : "bg-slate-50 text-slate-400 border-slate-200"
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Code Execution</span>
            </button>

            <button
              type="button"
              onClick={() => toggleTool("google_search")}
              disabled={isRunning}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-medium transition-colors cursor-pointer ${
                tools.google_search
                  ? "bg-blue-50 text-blue-700 border-blue-300 shadow-2xs"
                  : "bg-slate-50 text-slate-400 border-slate-200"
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              <span>Google Search</span>
            </button>

            <button
              type="button"
              onClick={() => toggleTool("url_context")}
              disabled={isRunning}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-medium transition-colors cursor-pointer ${
                tools.url_context
                  ? "bg-cyan-50 text-cyan-700 border-cyan-300 shadow-2xs"
                  : "bg-slate-50 text-slate-400 border-slate-200"
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>URL Context</span>
            </button>
          </div>

          {/* Action Button */}
          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              title="Toggle advanced environment options"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>

            {isRunning ? (
              <button
                type="button"
                onClick={onStop}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <Square className="w-4 h-4 fill-current" />
                <span>Stop Polling</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onStart}
                disabled={!prompt.trim()}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Run Antigravity Agent</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Advanced Drawer */}
      {showAdvanced && (
        <div className="mt-4 pt-3.5 border-t border-slate-200 text-xs space-y-3 bg-slate-50/50 p-3.5 rounded-xl">
          <div className="flex items-center justify-between text-slate-700 font-medium">
            <span>Advanced Execution Settings</span>
            <span className="text-[11px] text-slate-400">agent: antigravity-preview-05-2026</span>
          </div>

          {activeEnvironmentId && (
            <div className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-slate-200">
              <div>
                <span className="font-semibold text-slate-800">Preserve Sandbox Workspace</span>
                <p className="text-[11px] text-slate-500">
                  Run next query inside active sandbox ({activeEnvironmentId}) preserving generated files.
                </p>
              </div>
              <input
                type="checkbox"
                checked={reuseEnvironment}
                onChange={(e) => setReuseEnvironment(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
              />
            </div>
          )}

          <div className="text-[11px] text-slate-500 space-y-1">
            <p>
              • <strong>Sandbox:</strong> Remote Linux environment provisioned automatically by Google.
            </p>
            <p>
              • <strong>Network Allowlist:</strong> <code className="font-mono text-slate-700">generativelanguage.googleapis.com</code> with <code className="font-mono text-slate-700">x-goog-api-key: GEMINI_API_KEY</code> header injection.
            </p>
            <p>
              • <strong>Execution Mode:</strong> Background execution (<code className="font-mono text-slate-700">background: true</code>) with reactive status polling.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
