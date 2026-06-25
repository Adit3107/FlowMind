"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  SquareKanban,
  Plus,
  Trash2,
  X,
  Edit2,
  Calendar,
  StickyNote,
  Users,
  Settings,
  Clock,
  Menu,
  MessageSquare,
  Loader2,
} from "lucide-react";

import { SidebarLayout, useSidebar } from "@/components/sidebar";
import { cn } from "@/lib/utils";
import {
  getBoards,
  createBoard,
  updateBoard,
  deleteBoard,
  getColumns,
  createColumn,
  updateColumn,
  deleteColumn,
  getTasksForBoard,
  createTaskCard,
  updateTaskCard,
  deleteTaskCard,
  getBoardShares,
  inviteUserToBoard,
  removeUserFromBoard,
  getCollaboratorProfiles,
} from "./actions";
import type { KanbanBoard, KanbanColumn, KanbanTask, KanbanBoardShare } from "@/db/schema";
import { RoomProvider, liveblocksClient } from "@/lib/liveblocks";
import { BoardWorkspace } from "./components/BoardWorkspace";



const BOARD_COLORS = [
  { name: "Emerald", value: "#10b981", bg: "bg-[#eaf2ea]", text: "text-emerald-700", dot: "bg-emerald-500" },
  { name: "Coral", value: "#f15f49", bg: "bg-[#fff1eb]", text: "text-[#f15f49]", dot: "bg-[#f15f49]" },
  { name: "Sky", value: "#0284c7", bg: "bg-[#f0f9ff]", text: "text-sky-700", dot: "bg-sky-500" },
  { name: "Amber", value: "#d97706", bg: "bg-[#fffbeb]", text: "text-amber-700", dot: "bg-amber-600" },
  { name: "Violet", value: "#7c3aed", bg: "bg-[#f5f3ff]", text: "text-violet-700", dot: "bg-violet-600" },
  { name: "Rose", value: "#e11d48", bg: "bg-[#fff1f2]", text: "text-rose-700", dot: "bg-rose-600" },
];

const PRIORITY_COLORS: Record<string, { bg: string; bgDot: string }> = {
  High: { bg: "bg-rose-50 border-rose-100 text-rose-600", bgDot: "bg-rose-500" },
  Medium: { bg: "bg-amber-50 border-amber-100 text-amber-600", bgDot: "bg-amber-500" },
  Low: { bg: "bg-slate-50 border-slate-100 text-slate-500", bgDot: "bg-slate-400" },
};

export default function KanbanPage() {
  return (
    <SidebarLayout activeLabel="Task / Kanban">
      <KanbanPageContent />
    </SidebarLayout>
  );
}

function KanbanPageContent() {
  const { setIsMobileOpen } = useSidebar();

  // Kanban Boards States
  const [boards, setBoards] = useState<KanbanBoard[]>([]);
  const [activeBoard, setActiveBoard] = useState<KanbanBoard | null>(null);
  const [isLoadingBoards, setIsLoadingBoards] = useState(true);

  // Modals States
  const [isBoardDialogOpen, setIsBoardDialogOpen] = useState(false);
  
  // Dialog Form selections
  const [selectedBoard, setSelectedBoard] = useState<KanbanBoard | null>(null);

  // Board Form State
  const [boardName, setBoardName] = useState("");
  const [boardColor, setBoardColor] = useState("#10b981");

  // Fetch Boards
  const loadBoards = useCallback(async () => {
    try {
      const data = await getBoards();
      setBoards(data);
      if (data.length > 0) {
        // If there's an active board still in the list, keep it. Otherwise default to first one.
        setActiveBoard(prev => {
          if (prev && data.some(b => b.id === prev.id)) {
            return data.find(b => b.id === prev.id) || data[0];
          }
          return data[0];
        });
      } else {
        setActiveBoard(null);
      }
    } catch (e) {
      console.error("Failed to load boards:", e);
    } finally {
      setIsLoadingBoards(false);
    }
  }, []);

  useEffect(() => {
    loadBoards();
  }, [loadBoards]);

  // Board Dialog Openers
  const openCreateBoardDialog = () => {
    setSelectedBoard(null);
    setBoardName("");
    setBoardColor("#10b981");
    setIsBoardDialogOpen(true);
  };

  const openEditBoardDialog = (e: React.MouseEvent, board: KanbanBoard) => {
    e.stopPropagation();
    setSelectedBoard(board);
    setBoardName(board.name);
    setBoardColor(board.color);
    setIsBoardDialogOpen(true);
  };

  // Board CRUD operations
  const handleSaveBoard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!boardName.trim()) return;

    setIsBoardDialogOpen(false);

    try {
      if (selectedBoard) {
        // Edit Optimistic
        setBoards(prev =>
          prev.map(b => (b.id === selectedBoard.id ? { ...b, name: boardName, color: boardColor } : b))
        );
        if (activeBoard?.id === selectedBoard.id) {
          setActiveBoard(prev => prev ? { ...prev, name: boardName, color: boardColor } : null);
        }
        await updateBoard(selectedBoard.id, boardName, boardColor);
        await loadBoards();
      } else {
        // Add
        const tempId = -Math.floor(Math.random() * 1000000);
        const tempBoard: KanbanBoard = {
          id: tempId,
          userId: "temp",
          name: boardName,
          color: boardColor,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        setBoards(prev => [...prev, tempBoard]);

        const realBoard = await createBoard(boardName, boardColor);
        setBoards(prev => prev.map(b => (b.id === tempId ? realBoard : b)));
        setActiveBoard(realBoard);
        await loadBoards();
      }
    } catch (err) {
      console.error("Failed to save board:", err);
      loadBoards();
    }
  };

  const handleDeleteBoard = async (e: React.MouseEvent, boardId: number) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this board, its columns, and all task cards?")) {
      return;
    }

    try {
      setBoards(prev => prev.filter(b => b.id !== boardId));
      if (activeBoard?.id === boardId) {
        const remaining = boards.filter(b => b.id !== boardId);
        setActiveBoard(remaining.length > 0 ? remaining[0] : null);
      }
      await deleteBoard(boardId);
      await loadBoards();
    } catch (err) {
      console.error("Failed to delete board:", err);
      loadBoards();
    }
  };

  const getBoardColorDetails = (hexColor: string) => {
    return BOARD_COLORS.find(c => c.value === hexColor) || BOARD_COLORS[0];
  };

  return (
    <div className="flex min-h-screen flex-1 flex-col md:ml-0 overflow-x-hidden bg-[#f6f1e6]/40 text-slate-800">
      {/* Top Banner Header */}
      <header className="border-b border-[#eadfc8] bg-[#fbf7ef]/85 backdrop-blur px-4 py-6 md:px-6 md:py-7">
        <div className="flex items-start gap-4">
          <button
            type="button"
            onClick={() => setIsMobileOpen(true)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#eadfc8] bg-white text-slate-700 shadow-sm md:hidden cursor-pointer shrink-0"
            aria-label="Toggle sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-[13px] font-medium text-amber-600">
              <SquareKanban className="h-4 w-4 text-amber-600" />
              Task / Kanban
            </div>
            <h1 className="mt-2 text-[32px] md:text-[40px] font-semibold leading-[1.05] tracking-[-0.03em] text-slate-950">
              Shape the work as it moves.
            </h1>
          </div>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <div className="flex-1 p-4 md:p-6 lg:grid lg:grid-cols-[280px_1fr] lg:gap-6 space-y-6 lg:space-y-0">
        {/* Left Side Boards Panel */}
        <aside className="rounded-[22px] border border-[#eadfc8] bg-white p-5 shadow-xs flex flex-col h-fit">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="text-[17px] font-semibold text-slate-900">Boards</span>
            </div>
            <button
              onClick={openCreateBoardDialog}
              className="inline-flex h-7 items-center justify-center gap-1 rounded-lg bg-[#d97706] px-2.5 text-[11px] font-bold text-white shadow-xs hover:brightness-95 transition cursor-pointer"
            >
              <Plus className="h-3 w-3" />
              New
            </button>
          </div>

          {/* Boards List */}
          <div className="mt-4 space-y-1 overflow-y-auto max-h-[400px]">
            {isLoadingBoards ? (
              <div className="py-8 text-center text-[13px] text-slate-400 font-medium flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-amber-600" />
                Loading boards...
              </div>
            ) : boards.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-[12.5px] text-slate-500">No boards created.</p>
                <button
                  onClick={openCreateBoardDialog}
                  className="mt-2 text-[12px] font-bold text-[#d97706] hover:underline cursor-pointer"
                >
                  Create one now
                </button>
              </div>
            ) : (
              boards.map(b => {
                const isActive = activeBoard?.id === b.id;
                const colDetails = getBoardColorDetails(b.color);
                return (
                  <div
                    key={b.id}
                    onClick={() => setActiveBoard(b)}
                    className={cn(
                      "flex items-center justify-between px-3 py-2.5 rounded-xl border text-[13.5px] font-semibold transition cursor-pointer group/board",
                      isActive
                        ? cn("border-[#ebdcb9]", colDetails.bg, colDetails.text)
                        : "border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className={cn("h-2.5 w-2.5 rounded-full shrink-0", colDetails.dot)} />
                      <span className="truncate">{b.name}</span>
                    </div>

                    <div className="opacity-0 group-hover/board:opacity-100 flex items-center gap-1">
                      <button
                        onClick={(e) => openEditBoardDialog(e, b)}
                        className="p-1 rounded hover:bg-slate-200 text-slate-500 hover:text-slate-700 transition cursor-pointer"
                        title="Edit board name"
                      >
                        <Edit2 className="h-3 w-3" />
                      </button>
                      <button
                        onClick={(e) => handleDeleteBoard(e, b.id)}
                        className="p-1 rounded hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                        title="Delete board"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* Right side Board Workspace Area with Liveblocks providers */}
        <div className="flex flex-col flex-1 min-w-0">
          {activeBoard ? (
            <RoomProvider
              id={`kanban-board:${activeBoard.id}`}
              initialPresence={{ activeTaskId: null, isTypingComment: false }}
            >
              <BoardWorkspace
                activeBoard={activeBoard}
                onEditBoard={(board) => {
                  setSelectedBoard(board);
                  setBoardName(board.name);
                  setBoardColor(board.color);
                  setIsBoardDialogOpen(true);
                }}
                onBoardDeleted={() => {
                  loadBoards();
                }}
              />
            </RoomProvider>
          ) : (
            <div className="flex flex-col items-center justify-center p-12 text-center rounded-[24px] border border-dashed border-[#eadfc8] bg-white min-h-[300px]">
              <SquareKanban className="h-10 w-10 text-slate-300" />
              <h3 className="mt-4 text-[16px] font-semibold text-slate-800">No board selected</h3>
              <p className="mt-1.5 text-[13px] text-slate-500 max-w-[280px]">
                Create a new board in the left panel to begin managing columns and task cards.
              </p>
              <button
                onClick={openCreateBoardDialog}
                className="mt-4 inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-[#d97706] px-4 text-[13px] font-semibold text-white shadow-xs hover:brightness-95 transition cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                Create board
              </button>
            </div>
          )}
        </div>
      </div>

      {/* CREATE & EDIT BOARD MODAL DIALOG */}
      {isBoardDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/45 backdrop-blur-xs">
          <div className="w-full max-w-[420px] bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-[#fbf7ef]/30">
              <h3 className="text-[16.5px] font-bold text-slate-900">
                {selectedBoard ? "Edit Board Details" : "Create New Kanban Board"}
              </h3>
              <button
                onClick={() => setIsBoardDialogOpen(false)}
                className="h-7 w-7 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500 inline-flex items-center justify-center transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveBoard} className="p-5 space-y-4">
              {/* Board Name */}
              <div className="space-y-1.5">
                <label className="text-[12px] font-bold text-slate-500 uppercase tracking-wider">
                  Board name
                </label>
                <input
                  type="text"
                  required
                  value={boardName}
                  onChange={(e) => setBoardName(e.target.value)}
                  placeholder="e.g. Project Alpha, Java, Marketing"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-[13.5px] font-medium placeholder-slate-400 focus:outline-none focus:border-[#d97706] focus:ring-1 focus:ring-[#d97706] bg-white text-slate-800"
                />
              </div>

              {/* Color Grid */}
              <div className="space-y-1.5">
                <label className="text-[12px] font-bold text-slate-500 uppercase tracking-wider block">
                  Select Board Color
                </label>
                <div className="grid grid-cols-6 gap-2 pt-1">
                  {BOARD_COLORS.map(color => (
                    <button
                      key={color.name}
                      type="button"
                      onClick={() => setBoardColor(color.value)}
                      className={cn(
                        "h-8 rounded-lg flex items-center justify-center transition cursor-pointer border",
                        color.dot,
                        boardColor === color.value
                          ? "border-[#d97706] border-2 scale-110 shadow-xs"
                          : "border-transparent opacity-85 hover:opacity-100"
                      )}
                      title={color.name}
                    >
                      {boardColor === color.value && (
                        <span className="block h-1.5 w-1.5 rounded-full bg-white" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsBoardDialogOpen(false)}
                  className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 px-4 text-[13.5px] font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex h-10 items-center justify-center rounded-xl bg-[#d97706] hover:brightness-95 text-white px-5 text-[13.5px] font-bold shadow-xs transition cursor-pointer"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

