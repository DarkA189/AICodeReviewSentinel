// src/components/CodeEditor.tsx
"use client";
import { useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import type { editor } from "monaco-editor";
import type { CodeIssue, SupportedLanguage } from "@/types/review";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, Code2 } from "lucide-react";

// SSR-safe Monaco import
const MonacoEditor = dynamic(
  () => import("@monaco-editor/react").then((mod) => mod.default),
  { ssr: false, loading: () => <EditorSkeleton /> }
);

interface CodeEditorProps {
  code: string;
  language: SupportedLanguage;
  onCodeChange: (code: string) => void;
  onLanguageChange: (lang: SupportedLanguage) => void;
  issues: CodeIssue[];
}

const MONACO_LANG_MAP: Record<SupportedLanguage, string> = {
  typescript: "typescript",
  javascript: "javascript",
  python: "python",
};

export function CodeEditor({
  code,
  language,
  onCodeChange,
  onLanguageChange,
  issues,
}: CodeEditorProps) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const decorationsRef = useRef<string[]>([]);

  const handleEditorMount = useCallback(
    (ed: editor.IStandaloneCodeEditor) => {
      editorRef.current = ed;
      applyDecorations(ed, issues);
    },
    [issues]
  );

  const applyDecorations = (
    ed: editor.IStandaloneCodeEditor,
    issueList: CodeIssue[]
  ) => {
    const decorations: editor.IModelDeltaDecoration[] = issueList.map((issue) => ({
      range: {
        startLineNumber: issue.lineStart,
        startColumn: 1,
        endLineNumber: issue.lineEnd,
        endColumn: 999,
      },
      options: {
        isWholeLine: true,
        className: `issue-line-${issue.severity}`,
        glyphMarginClassName: `issue-glyph-${issue.severity}`,
        overviewRuler: {
          color: getSeverityColor(issue.severity),
          position: 1,
        },
        minimap: {
          color: getSeverityColor(issue.severity),
          position: 1,
        },
      },
    }));

    decorationsRef.current = ed.deltaDecorations(
      decorationsRef.current,
      decorations
    );
  };

  const handleFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const ext = file.name.split(".").pop()?.toLowerCase();
      const langMap: Record<string, SupportedLanguage> = {
        ts: "typescript",
        tsx: "typescript",
        js: "javascript",
        jsx: "javascript",
        mjs: "javascript",
        py: "python",
      };

      if (ext && langMap[ext]) {
        onLanguageChange(langMap[ext]);
      }

      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = ev.target?.result as string;
        if (text) onCodeChange(text);
      };
      reader.readAsText(file);
      // Reset input
      e.target.value = "";
    },
    [onCodeChange, onLanguageChange]
  );

  return (
    <div className="flex flex-col rounded-xl border border-sentinel-border overflow-hidden sentinel-panel">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-sentinel-border bg-black/30">
        <div className="flex items-center gap-2">
          <Code2 className="w-4 h-4 text-muted-foreground" />
          <Select
            value={language}
            onValueChange={(v) => onLanguageChange(v as SupportedLanguage)}
          >
            <SelectTrigger className="h-7 w-36 text-xs border-sentinel-border bg-transparent">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-sentinel-panel border-sentinel-border">
              <SelectItem value="typescript" className="text-xs">TypeScript (.ts/.tsx)</SelectItem>
              <SelectItem value="javascript" className="text-xs">JavaScript (.js/.jsx)</SelectItem>
              <SelectItem value="python" className="text-xs">Python (.py)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          {issues.length > 0 && (
            <span className="text-xs text-muted-foreground font-mono">
              {issues.length} issue{issues.length !== 1 ? "s" : ""} flagged
            </span>
          )}
          <label className="cursor-pointer flex items-center gap-1.5 px-2.5 py-1 rounded 
                            border border-sentinel-border text-xs text-muted-foreground
                            hover:border-sentinel-blue hover:text-sentinel-blue transition-all">
            <Upload className="w-3 h-3" />
            Upload
            <input
              type="file"
              accept=".ts,.tsx,.js,.jsx,.mjs,.py"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Monaco */}
      <div className="monaco-container" style={{ height: "480px" }}>
        <MonacoEditor
          height="480px"
          language={MONACO_LANG_MAP[language]}
          value={code}
          onChange={(v) => onCodeChange(v ?? "")}
          onMount={handleEditorMount}
          theme="vs-dark"
          options={{
            fontSize: 13,
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            fontLigatures: true,
            lineNumbers: "on",
            glyphMargin: true,
            folding: true,
            minimap: { enabled: true, scale: 1 },
            scrollBeyondLastLine: false,
            wordWrap: "on",
            automaticLayout: true,
            padding: { top: 12, bottom: 12 },
            renderLineHighlight: "gutter",
            scrollbar: {
              verticalScrollbarSize: 6,
              horizontalScrollbarSize: 6,
            },
          }}
        />
      </div>
    </div>
  );
}

function getSeverityColor(severity: string): string {
  const colors: Record<string, string> = {
    critical: "#FF2D55",
    high: "#FF6B35",
    medium: "#FFD60A",
    low: "#5AC8FA",
    info: "#BF5AF2",
  };
  return colors[severity] ?? "#5AC8FA";
}

function EditorSkeleton() {
  return (
    <div className="h-[480px] bg-[#1e1e1e] flex items-center justify-center">
      <div className="text-muted-foreground text-sm font-mono animate-pulse">
        Loading editor...
      </div>
    </div>
  );
}
