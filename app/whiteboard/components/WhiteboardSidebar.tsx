"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  Plus,
  MoreVertical,
  Trash2,
  Edit2,
  FileText,
  ChevronRight,
  FolderOpen,
  PenTool,
  Copy,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Whiteboard } from "@/db/schema";

const COLOR_PALETTE = [
  "#f15f49", // Coral
  "#10b981", // Sage
  "#0284c7", // Ocean
  "#d97706", // Amber
  "#8b5cf6", // Lavender
  "#ec4899", // Rose
];

interface WhiteboardSidebarProps {
  whiteboardsList: Whiteboard[];
  activeBoardId: number | null;
  onSelectBoard: (id: number) => void;
  onCreateBoard: () => void;
  onUpdateBoard: (id: number, data: { name?: string; color?: string }) => Promise<any>;
  onDeleteBoard: (id: number) => void;
  onDuplicateBoard: (id: number) => void;
}

export function WhiteboardSidebar({
  whiteboardsList,
  activeBoardId,
  onSelectBoard,
  onCreateBoard,
  onUpdateBoard,
  onDeleteBoard,
  onDuplicateBoard,
}: WhiteboardSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [editingBoardId, setEditingBoardId] = useState<number | null>(null);
  const [renameName, setRenameName] = useState("");
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);

  // Close dropdowns on click outside
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-dropdown-container]")) {
        setOpenDropdownId(null);
      }
    };
    document.addEventListener("mousedown", handleGlobalClick);
    return () => {
      document.removeEventListener("mousedown", handleGlobalClick);
    };
  }, []);

  const filteredBoards = whiteboardsList.filter((board) =>
    board.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleStartRename = (board: Whiteboard) => {
    setEditingBoardId(board.id);
    setRenameName(board.name);
    setOpenDropdownId(null);
  };

  const handleSaveRename = async (id: number) => {
    if (!renameName.trim()) return;
    await onUpdateBoard(id, { name: renameName });
    setEditingBoardId(null);
  };

  const formatTime = (dateInput: Date | string | null) => {
    if (!dateInput) return "just now";
    const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
    const diff = Date.now() - date.getTime();
    if (diff < 60000) return "just now";
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  };

  return (
    <aside className="border-r border-[#eadfc8] bg-[#fbf7ef] flex flex-col h-full select-none text-left w-full overflow-hidden">
      {/* Top Branding Header */}
      <div className="px-4 pt-4 pb-2.5 flex items-center gap-2 border-b border-[#eadfc8]/30">
        <PenTool className="h-4 w-4 text-[#f15f49]" />
        <span className="text-[14px] font-bold text-[#f15f49] tracking-tight">Whiteboard</span>
      </div>

      {/* Board Controls Header */}
      <div className="px-4 py-3.5 border-b border-[#eadfc8] flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#f15f49] text-white shadow-sm shrink-0">
            <PenTool className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <h2 className="text-[14px] font-bold text-slate-950 leading-tight truncate">Whiteboards</h2>
            <div className="text-[11px] font-semibold text-slate-500 mt-0.5">
              {whiteboardsList.length} {whiteboardsList.length === 1 ? "board" : "boards"}
            </div>
          </div>
        </div>
        <button
          onClick={onCreateBoard}
          className="inline-flex h-7 items-center justify-center gap-1 rounded-xl bg-[#c27a56] hover:bg-[#b06a46] text-white px-3 text-[12px] font-bold shadow-xs cursor-pointer transition shrink-0"
        >
          <Plus className="h-3.5 w-3.5" />
          New
        </button>
      </div>

      {/* Search Input */}
      <div className="px-4 py-3 border-b border-[#eadfc8]/50">
        <div className="relative flex items-center bg-white rounded-xl border border-[#eadfc8] px-3 shadow-inner">
          <Search className="h-4 w-4 text-slate-400 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search boards"
            className="w-full bg-transparent px-2.5 py-2 text-[13px] font-medium placeholder-slate-400 text-slate-800 focus:outline-none"
          />
        </div>
      </div>

      {/* Whiteboards List scrollable */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1.5 scrollbar-thin">
        {filteredBoards.length === 0 ? (
          <div className="text-center py-12 px-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white border border-[#eadfc8] text-slate-400 mx-auto shadow-xs">
              <FolderOpen className="h-5 w-5 text-[#eadfc8]" />
            </div>
            <h4 className="mt-3 text-[12.5px] font-semibold text-slate-800">No boards found</h4>
            <p className="mt-1 text-[11px] text-slate-500 max-w-[200px] mx-auto leading-relaxed">
              Create a new whiteboard to start sketching.
            </p>
          </div>
        ) : (
          filteredBoards.map((board) => {
            const active = activeBoardId === board.id;
            const editing = editingBoardId === board.id;

            return (
              <div
                key={board.id}
                onClick={editing ? undefined : () => onSelectBoard(board.id)}
                style={{
                  borderLeftColor: board.color,
                  backgroundColor: active ? `${board.color}12` : undefined, // ~7% opacity background
                  borderColor: active ? `${board.color}35` : undefined, // ~20% opacity border
                }}
                className={cn(
                  "group relative flex items-stretch rounded-xl border p-2.5 text-left transition select-none cursor-pointer border-l-[4px]",
                  active
                    ? "text-slate-900 shadow-xs"
                    : "border-slate-200/80 bg-white text-slate-800 hover:border-slate-300 hover:shadow-xs"
                )}
              >
                <div className="flex-1 min-w-0 pr-12 flex items-start gap-2.5">
                  {/* File Icon */}
                  <div className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-500 shrink-0">
                    <FileText className="h-4 w-4" />
                  </div>

                  {/* Name details */}
                  <div className="min-w-0 flex-1 text-left">
                    {editing ? (
                      <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="text"
                          value={renameName}
                          onChange={(e) => setRenameName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSaveRename(board.id);
                            if (e.key === "Escape") setEditingBoardId(null);
                          }}
                          className="w-full rounded border border-[#eadfc8] px-2 py-0.5 text-[12.5px] font-semibold text-slate-800 focus:outline-none"
                          autoFocus
                        />
                        <button
                          onClick={() => handleSaveRename(board.id)}
                          className="text-[11.5px] font-bold text-emerald-600 hover:underline shrink-0"
                        >
                          Save
                        </button>
                      </div>
                    ) : (
                      <div className="text-[13.5px] font-bold text-slate-900 truncate">
                        {board.name}
                      </div>
                    )}

                    <div className="flex items-center gap-2 mt-1 text-[11px] font-medium text-slate-400">
                      <span
                        className="inline-block h-1.5 w-1.5 rounded-full shrink-0"
                        style={{ backgroundColor: board.color }}
                      />
                      <span>{formatTime(board.updatedAt)}</span>
                    </div>
                  </div>
                </div>

                {/* Card Quick Action Buttons */}
                <div className="absolute top-1/2 -translate-y-1/2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                  {/* Duplicate icon */}
                  <button
                    onClick={() => onDuplicateBoard(board.id)}
                    className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                    title="Duplicate whiteboard"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>

                  {/* Options Trigger Dropdown Menu */}
                  <button
                    onClick={() => setOpenDropdownId(openDropdownId === board.id ? null : board.id)}
                    className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                  >
                    <MoreVertical className="h-3.5 w-3.5" />
                  </button>
                </div>

                {openDropdownId === board.id && (
                  <div
                    data-dropdown-container="true"
                    className="absolute right-2 top-10 z-30 w-40 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg text-left"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => handleStartRename(board)}
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-[12.5px] text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                      Rename
                    </button>

                    {/* Color labels option */}
                    <div className="px-2.5 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-t border-slate-100 mt-1 pt-1.5">
                      Choose Color
                    </div>
                    <div className="grid grid-cols-6 gap-1 px-2.5 pb-1.5">
                      {COLOR_PALETTE.map((color) => (
                        <button
                          key={color}
                          onClick={() => {
                            onUpdateBoard(board.id, { color });
                            setOpenDropdownId(null);
                          }}
                          style={{ backgroundColor: color }}
                          className={cn(
                            "h-3.5 w-3.5 rounded-full border border-white hover:scale-120 transition cursor-pointer shrink-0",
                            board.color === color && "ring-1 ring-slate-400"
                          )}
                        />
                      ))}
                    </div>

                    <div className="border-t border-slate-100 my-1" />
                    <button
                      onClick={() => {
                        onDeleteBoard(board.id);
                        setOpenDropdownId(null);
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-[12.5px] text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}
