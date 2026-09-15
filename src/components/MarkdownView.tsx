import React, { useState } from "react";
import { Check, Copy, ExternalLink } from "lucide-react";

interface MarkdownViewProps {
  content: string;
}

export const MarkdownView: React.FC<MarkdownViewProps> = ({ content }) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  if (!content || !content.trim()) {
    return <p className="text-slate-400 italic text-sm">No output generated yet.</p>;
  }

  // Parse markdown blocks (code fences, headings, lists, tables, paragraphs)
  const renderBlocks = () => {
    const lines = content.split("\n");
    const blocks: React.ReactNode[] = [];
    let i = 0;
    let blockKey = 0;

    while (i < lines.length) {
      const line = lines[i];

      // Code blocks ```language
      if (line.trim().startsWith("```")) {
        const langMatch = line.trim().match(/^```([a-zA-Z0-9_-]*)/);
        const language = langMatch && langMatch[1] ? langMatch[1] : "code";
        const codeLines: string[] = [];
        i++;
        while (i < lines.length && !lines[i].trim().startsWith("```")) {
          codeLines.push(lines[i]);
          i++;
        }
        i++; // skip closing ```
        const codeText = codeLines.join("\n");
        const currentIndex = blockKey++;

        blocks.push(
          <div key={currentIndex} className="my-4 rounded-lg overflow-hidden border border-slate-700/60 bg-slate-900 text-slate-100 shadow-sm">
            <div className="flex items-center justify-between px-4 py-2 bg-slate-800/80 border-b border-slate-700/50 text-xs font-mono text-slate-400">
              <span>{language || "code"}</span>
              <button
                type="button"
                onClick={() => copyToClipboard(codeText, currentIndex)}
                className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-slate-700/50 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="Copy code"
              >
                {copiedIndex === currentIndex ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-4 overflow-x-auto text-xs sm:text-sm font-mono leading-relaxed text-slate-200">
              <code>{codeText}</code>
            </pre>
          </div>
        );
        continue;
      }

      // Headings
      if (line.startsWith("# ")) {
        blocks.push(
          <h1 key={blockKey++} className="text-2xl font-bold text-slate-900 mt-6 mb-3 pb-2 border-b border-slate-200">
            {renderInline(line.slice(2))}
          </h1>
        );
        i++;
        continue;
      }
      if (line.startsWith("## ")) {
        blocks.push(
          <h2 key={blockKey++} className="text-xl font-semibold text-slate-800 mt-5 mb-2.5">
            {renderInline(line.slice(3))}
          </h2>
        );
        i++;
        continue;
      }
      if (line.startsWith("### ")) {
        blocks.push(
          <h3 key={blockKey++} className="text-lg font-semibold text-slate-800 mt-4 mb-2">
            {renderInline(line.slice(4))}
          </h3>
        );
        i++;
        continue;
      }
      if (line.startsWith("#### ")) {
        blocks.push(
          <h4 key={blockKey++} className="text-base font-semibold text-slate-800 mt-3 mb-1.5">
            {renderInline(line.slice(5))}
          </h4>
        );
        i++;
        continue;
      }

      // Horizontal rule
      if (line.trim() === "---" || line.trim() === "***" || line.trim() === "___") {
        blocks.push(<hr key={blockKey++} className="my-6 border-slate-200" />);
        i++;
        continue;
      }

      // Blockquotes
      if (line.startsWith("> ")) {
        const quoteLines: string[] = [];
        while (i < lines.length && lines[i].startsWith("> ")) {
          quoteLines.push(lines[i].slice(2));
          i++;
        }
        blocks.push(
          <blockquote key={blockKey++} className="my-3 pl-4 border-l-4 border-indigo-400 italic text-slate-700 bg-indigo-50/40 py-2 pr-3 rounded-r">
            {quoteLines.map((ql, qidx) => (
              <p key={qidx} className="my-1">{renderInline(ql)}</p>
            ))}
          </blockquote>
        );
        continue;
      }

      // Unordered list items (- or *)
      if (/^(\s*)[-*]\s+/.test(line)) {
        const listItems: string[] = [];
        while (i < lines.length && /^(\s*)[-*]\s+/.test(lines[i])) {
          listItems.push(lines[i].replace(/^(\s*)[-*]\s+/, ""));
          i++;
        }
        blocks.push(
          <ul key={blockKey++} className="my-3 space-y-1.5 pl-6 list-disc text-slate-700 leading-relaxed">
            {listItems.map((item, idx) => (
              <li key={idx}>{renderInline(item)}</li>
            ))}
          </ul>
        );
        continue;
      }

      // Numbered list items
      if (/^\s*\d+\.\s+/.test(line)) {
        const listItems: string[] = [];
        while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
          listItems.push(lines[i].replace(/^\s*\d+\.\s+/, ""));
          i++;
        }
        blocks.push(
          <ol key={blockKey++} className="my-3 space-y-1.5 pl-6 list-decimal text-slate-700 leading-relaxed">
            {listItems.map((item, idx) => (
              <li key={idx}>{renderInline(item)}</li>
            ))}
          </ol>
        );
        continue;
      }

      // Markdown Table (| col1 | col2 |)
      if (line.trim().startsWith("|") && line.trim().endsWith("|")) {
        const tableLines: string[] = [];
        while (i < lines.length && lines[i].trim().startsWith("|") && lines[i].trim().endsWith("|")) {
          tableLines.push(lines[i]);
          i++;
        }

        if (tableLines.length >= 2) {
          const parseRow = (rowStr: string) =>
            rowStr
              .split("|")
              .slice(1, -1)
              .map((c) => c.trim());

          const headerRow = parseRow(tableLines[0]);
          // check if second row is separator
          const isSeparator = /^\|?(\s*:?-+:?\s*\|)+$/.test(tableLines[1]);
          const bodyRows = (isSeparator ? tableLines.slice(2) : tableLines.slice(1)).map(parseRow);

          blocks.push(
            <div key={blockKey++} className="my-4 overflow-x-auto rounded-lg border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    {headerRow.map((header, hIdx) => (
                      <th key={hIdx} className="px-4 py-2.5 text-left font-semibold text-slate-800">
                        {renderInline(header)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {bodyRows.map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-slate-50/50">
                      {row.map((cell, cIdx) => (
                        <td key={cIdx} className="px-4 py-2 text-slate-700">
                          {renderInline(cell)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
          continue;
        }
      }

      // Empty lines
      if (line.trim() === "") {
        i++;
        continue;
      }

      // Regular paragraph
      const paragraphLines: string[] = [];
      while (
        i < lines.length &&
        lines[i].trim() !== "" &&
        !lines[i].startsWith("#") &&
        !lines[i].startsWith("> ") &&
        !lines[i].trim().startsWith("```") &&
        !/^(\s*)[-*]\s+/.test(lines[i]) &&
        !/^\s*\d+\.\s+/.test(lines[i]) &&
        !(lines[i].trim().startsWith("|") && lines[i].trim().endsWith("|"))
      ) {
        paragraphLines.push(lines[i]);
        i++;
      }

      blocks.push(
        <p key={blockKey++} className="my-2.5 leading-relaxed text-slate-700 text-sm sm:text-base">
          {renderInline(paragraphLines.join(" "))}
        </p>
      );
    }

    return blocks;
  };

  // Inline formatting: bold, italic, inline code, links
  const renderInline = (text: string): React.ReactNode => {
    // Process markdown links [text](url)
    const linkRegex = /\[(.*?)\]\((.*?)\)/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;

    while ((match = linkRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(parseFormattedText(text.slice(lastIndex, match.index)));
      }
      const label = match[1];
      const href = match[2];
      parts.push(
        <a
          key={`link-${match.index}`}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-0.5 text-indigo-600 hover:text-indigo-800 underline decoration-indigo-300 hover:decoration-indigo-600 font-medium"
        >
          {label}
          <ExternalLink className="w-3 h-3 ml-0.5 inline-block opacity-70" />
        </a>
      );
      lastIndex = linkRegex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push(parseFormattedText(text.slice(lastIndex)));
    }

    return parts.length > 0 ? parts : parseFormattedText(text);
  };

  const parseFormattedText = (raw: string): React.ReactNode => {
    // Break up code tags `code`, bold **bold**, italic *italic*
    const segments = raw.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g);
    return segments.map((segment, idx) => {
      if (segment.startsWith("`") && segment.endsWith("`")) {
        return (
          <code
            key={idx}
            className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-pink-600 font-mono text-xs sm:text-[13px]"
          >
            {segment.slice(1, -1)}
          </code>
        );
      }
      if (segment.startsWith("**") && segment.endsWith("**")) {
        return <strong key={idx} className="font-semibold text-slate-900">{segment.slice(2, -2)}</strong>;
      }
      if (segment.startsWith("*") && segment.endsWith("*")) {
        return <em key={idx} className="italic text-slate-800">{segment.slice(1, -1)}</em>;
      }
      return segment;
    });
  };

  return <div className="space-y-1">{renderBlocks()}</div>;
};
