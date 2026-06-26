"use client";

import "@excalidraw/excalidraw/index.css";
import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  Download,
  Sparkles,
  Loader2,
  StickyNote,
  FolderOpen,
  Menu,
} from "lucide-react";
import type { Whiteboard } from "@/db/schema";
import { generateDiagramPrompt } from "../ai-actions";
import { useSidebar } from "@/components/sidebar";

// ─── Lazy Excalidraw Renderer ────────────────────────────────────────────────
// We use a state-based loader to import Excalidraw only in the browser.
// This is safer than next/dynamic when the component itself needs children props.
function ExcalidrawLoader({
  excalidrawRef,
  onApiReady,
  onChange,
  onAddSticky,
  onOpenAiDialog,
}: {
  excalidrawRef: React.MutableRefObject<any>;
  onApiReady: (api: any) => void;
  onChange: (elements: readonly any[]) => void;
  onAddSticky: () => void;
  onOpenAiDialog: () => void;
}) {
  const [ExcalidrawComp, setExcalidrawComp] = useState<any>(null);
  const [WelcomeScreenComp, setWelcomeScreenComp] = useState<any>(null);

  useEffect(() => {
    import("@excalidraw/excalidraw").then((mod) => {
      setExcalidrawComp(() => mod.Excalidraw);
      setWelcomeScreenComp(() => mod.WelcomeScreen);
    });
  }, []);

  if (!ExcalidrawComp || !WelcomeScreenComp) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-slate-50">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  const WS = WelcomeScreenComp;

  return (
    <ExcalidrawComp
      excalidrawAPI={(api: any) => {
        excalidrawRef.current = api;
        onApiReady(api);
      }}
      onChange={onChange}
      UIOptions={{
        canvasActions: {
          toggleTheme: false,
          clearCanvas: true,
          export: false,
          loadScene: false,
          saveToActiveFile: false,
        },
      }}
    >
      <WS>
        <WS.Center>
          <WS.Center.Logo>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f15f49] text-white shadow-md mx-auto">
              <Sparkles className="h-6 w-6 fill-current" />
            </div>
          </WS.Center.Logo>
          <WS.Center.Heading>Flowbase Whiteboard</WS.Center.Heading>
          <p
            style={{
              fontSize: 13,
              color: "#64748b",
              marginTop: 8,
              marginBottom: 16,
              textAlign: "center",
            }}
          >
            Start with a sketch, note, or diagram.
          </p>
          <WS.Center.Menu>
            <WS.Center.MenuItem
              onSelect={onAddSticky}
              icon={<StickyNote style={{ width: 16, height: 16, color: "#f59e0b" }} />}
            >
              Add sticky note
            </WS.Center.MenuItem>
            <WS.Center.MenuItem
              onSelect={onOpenAiDialog}
              icon={<Sparkles style={{ width: 16, height: 16, color: "#7c3aed" }} />}
            >
              Generate AI diagram
            </WS.Center.MenuItem>
          </WS.Center.Menu>
        </WS.Center>
        <WS.Hints.MenuHint>Open board options from the menu.</WS.Hints.MenuHint>
        <WS.Hints.ToolbarHint>Pick a drawing tool to begin.</WS.Hints.ToolbarHint>
        <WS.Hints.HelpHint>Use help for shortcuts and canvas controls.</WS.Hints.HelpHint>
      </WS>
    </ExcalidrawComp>
  );
}

// ─── Main WhiteboardCanvas Component ─────────────────────────────────────────

interface WhiteboardCanvasProps {
  board: Whiteboard | null;
  onSaveContent: (id: number, elementsJSON: string) => Promise<void>;
}

export function WhiteboardCanvas({ board, onSaveContent }: WhiteboardCanvasProps) {
  const { setIsMobileOpen } = useSidebar();
  const [excalidrawAPI, setExcalidrawAPI] = useState<any>(null);
  const excalidrawRef = useRef<any>(null);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "idle">("saved");

  // AI Dialog state
  const [isAiDialogOpen, setIsAiDialogOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [diagramType, setDiagramType] = useState("flowchart");
  const [aiLoading, setAiLoading] = useState(false);

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sync board elements when active board changes
  useEffect(() => {
    if (excalidrawAPI && board) {
      try {
        const parsedElements = JSON.parse(board.elements || "[]");
        const validElements = parsedElements.filter(
          (el: any) =>
            el &&
            el.x !== null &&
            el.y !== null &&
            el.width !== null &&
            el.height !== null &&
            !Number.isNaN(el.x) &&
            !Number.isNaN(el.y) &&
            !Number.isNaN(el.width) &&
            !Number.isNaN(el.height)
        );
        excalidrawAPI.updateScene({ elements: validElements });
        setSaveStatus("saved");
        if (validElements.length > 0) {
          setTimeout(() => {
            excalidrawAPI.scrollToContent(validElements, { fitToViewport: true });
          }, 100);
        }
      } catch (err) {
        console.error("Failed to parse whiteboard elements:", err);
      }
    }
  }, [board?.id, excalidrawAPI]);

  const handleCanvasChange = useCallback(
    (elements: readonly any[]) => {
      if (!board) return;
      const activeElements = elements.filter(
        (el) =>
          !el.isDeleted &&
          el.x !== null &&
          el.y !== null &&
          el.width !== null &&
          el.height !== null &&
          !Number.isNaN(el.x) &&
          !Number.isNaN(el.y) &&
          !Number.isNaN(el.width) &&
          !Number.isNaN(el.height)
      );
      const serialized = JSON.stringify(activeElements);
      if (serialized === board.elements) return;
      setSaveStatus("saving");
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(async () => {
        try {
          await onSaveContent(board.id, serialized);
          setSaveStatus("saved");
        } catch {
          setSaveStatus("idle");
        }
      }, 800);
    },
    [board, onSaveContent]
  );

  const handleAddSticky = useCallback(() => {
    const api = excalidrawRef.current;
    if (!api || !board) return;
    const currentElements = api.getSceneElements();
    const uniqueId = Date.now();
    const appState = api.getAppState();
    const centerX = -appState.scrollX + appState.width / 2 - 75;
    const centerY = -appState.scrollY + appState.height / 2 - 75;

    const newSticky = {
      id: `sticky-shape-${uniqueId}`,
      type: "rectangle",
      x: centerX,
      y: centerY,
      width: 150,
      height: 150,
      strokeColor: "#d97706",
      backgroundColor: "#fef3c7",
      fillStyle: "solid",
      strokeWidth: 1,
      strokeStyle: "solid",
      roughness: 0,
      opacity: 100,
      strokeSharpness: "sharp",
      seed: Math.floor(Math.random() * 1000000),
      version: currentElements.length + 1,
      versionNonce: Math.floor(Math.random() * 1000000),
      isDeleted: false,
      updated: Date.now(),
      angle: 0,
      groupIds: [],
      frameId: null,
      roundness: { type: 3 },
      boundElements: null,
      link: null,
      locked: false,
    };
    const newText = {
      id: `sticky-text-${uniqueId}`,
      type: "text",
      x: centerX + 15,
      y: centerY + 45,
      width: 120,
      height: 60,
      strokeColor: "#78350f",
      backgroundColor: "transparent",
      fillStyle: "solid",
      strokeWidth: 1,
      strokeStyle: "solid",
      roughness: 0,
      opacity: 100,
      seed: Math.floor(Math.random() * 1000000),
      version: currentElements.length + 2,
      versionNonce: Math.floor(Math.random() * 1000000),
      isDeleted: false,
      updated: Date.now(),
      text: "Write something...",
      fontSize: 16,
      fontFamily: 1,
      textAlign: "center",
      verticalAlign: "middle",
      angle: 0,
      groupIds: [],
      frameId: null,
      roundness: null,
      boundElements: null,
      link: null,
      locked: false,
    };
    const updatedScene = [...currentElements, newSticky, newText];
    api.updateScene({ elements: updatedScene });
    handleCanvasChange(updatedScene);
  }, [board, handleCanvasChange]);

  const handleExportPNG = async () => {
    const api = excalidrawRef.current;
    if (!api || !board) return;
    try {
      const elements = api.getSceneElements();
      const appState = api.getAppState();
      const files = api.getFiles();
      const { exportToBlob } = await import("@excalidraw/excalidraw");
      const blob = await exportToBlob({
        elements,
        appState: { ...appState, exportBackground: true, viewBackgroundColor: "#ffffff" },
        files,
        mimeType: "image/png",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${board.name}.png`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export to PNG failed:", err);
    }
  };

  const handleGenerateDiagram = async (e: React.FormEvent) => {
    e.preventDefault();
    const api = excalidrawRef.current;
    if (!aiPrompt.trim() || !api || !board) return;
    setAiLoading(true);
    try {
      const structure = await generateDiagramPrompt(aiPrompt, diagramType);
      if (structure && structure.nodes) {
        const currentElements = api.getSceneElements();
        const baseIndex = currentElements.length;
        const newElements: any[] = [];
        const appState = api.getAppState();
        const offsetX = -appState.scrollX + appState.width / 4;
        const offsetY = -appState.scrollY + appState.height / 4;
        const nodesMap = new Map<string, any>();
        const colorMap: Record<string, { stroke: string; bg: string; text: string }> = {
          yellow: { stroke: "#d97706", bg: "#fef3c7", text: "#78350f" },
          blue: { stroke: "#0284c7", bg: "#e0f2fe", text: "#0369a1" },
          green: { stroke: "#10b981", bg: "#d1fae5", text: "#065f46" },
          red: { stroke: "#e11d48", bg: "#ffe4e6", text: "#9f1239" },
          orange: { stroke: "#ea580c", bg: "#ffedd5", text: "#9a3412" },
          purple: { stroke: "#8b5cf6", bg: "#ede9fe", text: "#5b21b6" },
        };
        structure.nodes.forEach((node: any, idx: number) => {
          const colors = colorMap[node.color || "blue"];
          const ax = node.x + offsetX;
          const ay = node.y + offsetY;
          const w = node.width || 160;
          const h = node.height || 75;
          const shapeId = `node-${node.id}-${Date.now()}`;
          const textId = `text-${node.id}-${Date.now()}`;
          newElements.push(
            {
              id: shapeId,
              type: node.type === "ellipse" ? "ellipse" : node.type === "diamond" ? "diamond" : "rectangle",
              x: ax, y: ay, width: w, height: h,
              strokeColor: colors.stroke, backgroundColor: colors.bg,
              fillStyle: "hachure", strokeWidth: 2, strokeStyle: "solid",
              roughness: 1, opacity: 100, strokeSharpness: "round",
              seed: Math.floor(Math.random() * 1000000),
              version: baseIndex + idx * 2 + 1,
              versionNonce: Math.floor(Math.random() * 1000000),
              isDeleted: false, updated: Date.now(),
              angle: 0,
              groupIds: [],
              frameId: null,
              roundness: node.type === "ellipse" ? { type: 2 } : node.type === "rectangle" ? { type: 3 } : null,
              boundElements: null,
              link: null,
              locked: false,
            },
            {
              id: textId, type: "text",
              x: ax + 10, y: ay + h / 2 - 10, width: w - 20, height: 30,
              strokeColor: colors.text, backgroundColor: "transparent",
              fillStyle: "solid", strokeWidth: 1, strokeStyle: "solid",
              roughness: 0, opacity: 100,
              seed: Math.floor(Math.random() * 1000000),
              version: baseIndex + idx * 2 + 2,
              versionNonce: Math.floor(Math.random() * 1000000),
              isDeleted: false, updated: Date.now(),
              text: node.label, fontSize: 14, fontFamily: 1,
              textAlign: "center", verticalAlign: "middle",
              angle: 0,
              groupIds: [],
              frameId: null,
              roundness: null,
              boundElements: null,
              link: null,
              locked: false,
            }
          );
          nodesMap.set(node.id, { ...node, x: ax, y: ay, width: w, height: h });
        });
        if (structure.edges) {
          structure.edges.forEach((edge: any, idx: number) => {
            const from = nodesMap.get(edge.from);
            const to = nodesMap.get(edge.to);
            if (!from || !to) return;
            const fx = from.x + from.width / 2;
            const fy = from.y + from.height / 2;
            const dx = (to.x + to.width / 2) - fx;
            const dy = (to.y + to.height / 2) - fy;
            newElements.push({
              id: `edge-${edge.from}-${edge.to}-${Date.now()}`,
              type: "arrow", x: fx, y: fy,
              width: Math.abs(dx), height: Math.abs(dy),
              strokeColor: "#475569", backgroundColor: "transparent",
              fillStyle: "hachure", strokeWidth: 2, strokeStyle: "solid",
              roughness: 1, opacity: 100,
              seed: Math.floor(Math.random() * 1000000),
              version: baseIndex + structure.nodes.length * 2 + idx + 1,
              versionNonce: Math.floor(Math.random() * 1000000),
              isDeleted: false, updated: Date.now(),
              points: [[0, 0], [dx, dy]],
              angle: 0,
              groupIds: [],
              frameId: null,
              roundness: { type: 2 },
              boundElements: null,
              link: null,
              locked: false,
              lastCommittedPoint: null,
              startBinding: null,
              endBinding: null,
              startArrowhead: null,
              endArrowhead: "arrow",
              elbowed: false,
            });
          });
        }
        const merged = [...currentElements, ...newElements];
        api.updateScene({ elements: merged });
        handleCanvasChange(merged);
        setTimeout(() => api.scrollToContent(newElements, { fitToViewport: true }), 150);
        setIsAiDialogOpen(false);
        setAiPrompt("");
      }
    } catch (err) {
      console.error("AI diagram error:", err);
      alert("Failed to generate AI diagram.");
    } finally {
      setAiLoading(false);
    }
  };

  if (!board) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-white text-center select-none">
        <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-50 border border-[#eadfc8] shadow-sm mb-4">
          <FolderOpen className="h-7 w-7 text-slate-300" />
        </div>
        <h3 className="text-[17px] font-bold text-slate-800">No whiteboard selected</h3>
        <p className="mt-1 text-[13px] text-slate-500 max-w-[280px] leading-relaxed">
          Select a board from the left panel or create a new one.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-white overflow-hidden relative text-left" style={{ isolation: "isolate" }}>
      {/* Top Bar */}
      <div className="flex items-center justify-between border-b border-slate-200/80 px-4 md:px-6 py-3 bg-white shrink-0 z-20">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsMobileOpen(true)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 md:hidden cursor-pointer shrink-0"
            aria-label="Toggle sidebar"
          >
            <Menu className="h-4 w-4" />
          </button>
          <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: board.color }} />
          <h1 className="text-[15px] font-bold text-slate-900 truncate max-w-[200px] md:max-w-[300px]">
            {board.name}
          </h1>
          <div className="flex items-center gap-1.5 bg-slate-100/70 px-2.5 py-1 rounded-lg text-[11.5px] font-semibold text-slate-500">
            {saveStatus === "saving" ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin text-slate-400" />
                <span>Saving…</span>
              </>
            ) : (
              <span>Saved</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleAddSticky}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-[#eadfc8] bg-white px-3 text-[13px] font-semibold text-slate-700 hover:bg-slate-50 shadow-xs cursor-pointer transition"
            title="Add sticky note"
          >
            <StickyNote className="h-4 w-4 text-amber-500" />
            <span className="hidden sm:inline">Sticky note</span>
          </button>

          <button
            onClick={() => setIsAiDialogOpen(true)}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white px-3.5 text-[13px] font-bold shadow-xs cursor-pointer transition"
          >
            <Sparkles className="h-4 w-4 fill-current" />
            AI Diagram
          </button>

          <button
            onClick={handleExportPNG}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-[#f15f49] hover:brightness-95 text-white px-3.5 text-[13px] font-bold shadow-xs cursor-pointer transition"
          >
            <Download className="h-4 w-4" />
            <span className="hidden md:inline">Export PNG</span>
          </button>
        </div>
      </div>

      {/* Excalidraw Canvas — must be absolutely positioned so Excalidraw gets a real pixel height */}
      <div className="absolute inset-0 top-[57px]">
        <ExcalidrawLoader
          excalidrawRef={excalidrawRef}
          onApiReady={setExcalidrawAPI}
          onChange={handleCanvasChange}
          onAddSticky={handleAddSticky}
          onOpenAiDialog={() => setIsAiDialogOpen(true)}
        />
      </div>

      {/* AI Diagram Dialog */}
      {isAiDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/45 backdrop-blur-sm">
          <div className="w-full max-w-[480px] bg-white rounded-[20px] shadow-xl border border-[#eadfc8]/50 p-6 md:p-8 space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-[20px] font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-violet-600 fill-current" />
                  AI Diagram Generator
                </h3>
                <p className="text-[13.5px] text-slate-500 mt-1">
                  Describe what you want to map out, and AI will draw the nodes.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAiDialogOpen(false)}
                className="text-[13.5px] font-semibold text-slate-500 hover:text-slate-950 hover:underline transition cursor-pointer"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleGenerateDiagram} className="space-y-4 text-left">
              <div className="space-y-1.5">
                <label className="text-[13.5px] font-semibold text-slate-800">Prompt</label>
                <textarea
                  required
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="e.g. Draw a login authentication flowchart with password reset…"
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border border-[#ebdcb9] bg-[#fffcf6] text-[13.5px] font-medium placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500 resize-none text-slate-800"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[13.5px] font-semibold text-slate-800">Diagram Type</label>
                <select
                  value={diagramType}
                  onChange={(e) => setDiagramType(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-[#ebdcb9] bg-[#fffcf6] text-[13.5px] font-semibold text-slate-700 focus:outline-none focus:border-violet-500 cursor-pointer"
                >
                  <option value="flowchart">Flowchart</option>
                  <option value="mindmap">Mind Map</option>
                  <option value="system">System Architecture</option>
                  <option value="journey">User Journey Map</option>
                  <option value="process">Process Timeline</option>
                </select>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAiDialogOpen(false)}
                  className="inline-flex h-10 items-center justify-center rounded-xl border border-[#ebdcb9] bg-[#fffcf6] text-slate-700 px-5 text-[13.5px] font-semibold hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={aiLoading}
                  className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white px-5 text-[13.5px] font-bold shadow-xs transition cursor-pointer disabled:opacity-50"
                >
                  {aiLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Generating…
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 fill-current" />
                      Generate
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
