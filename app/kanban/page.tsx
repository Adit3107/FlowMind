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
} from "./actions";
import type { KanbanBoard, KanbanColumn, KanbanTask } from "@/db/schema";

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

  // Column / Tasks States
  const [columns, setColumns] = useState<KanbanColumn[]>([]);
  const [tasksList, setTasksList] = useState<KanbanTask[]>([]);
  const [newColumnName, setNewColumnName] = useState("");
  const [editingColumnId, setEditingColumnId] = useState<number | null>(null);
  const [editingColumnName, setEditingColumnName] = useState("");

  // Modals States
  const [isBoardDialogOpen, setIsBoardDialogOpen] = useState(false);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  
  // Dialog Form selections
  const [selectedBoard, setSelectedBoard] = useState<KanbanBoard | null>(null);
  const [selectedTask, setSelectedTask] = useState<KanbanTask | null>(null);
  const [presetColumnId, setPresetColumnId] = useState<number | null>(null);

  // Board Form State
  const [boardName, setBoardName] = useState("");
  const [boardColor, setBoardColor] = useState("#10b981");

  // Task Form State
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskDueDate, setTaskDueDate] = useState("");
  const [taskPriority, setTaskPriority] = useState("Medium");
  const [taskLabels, setTaskLabels] = useState("");
  const [syncCalendar, setSyncCalendar] = useState(false);
  const [syncNotes, setSyncNotes] = useState(false);

  // Drag and Drop styles
  const [draggedOverColId, setDraggedOverColId] = useState<number | null>(null);

  // Fetch Boards
  const loadBoards = useCallback(async () => {
    try {
      const data = await getBoards();
      setBoards(data);
      if (data.length > 0) {
        setActiveBoard(data[0]);
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

  // Fetch Column and Task details for active board
  const loadBoardDetails = useCallback(async (boardId: number) => {
    try {
      const [colData, taskData] = await Promise.all([
        getColumns(boardId),
        getTasksForBoard(boardId),
      ]);
      setColumns(colData);
      setTasksList(taskData);
    } catch (e) {
      console.error("Failed to load board details:", e);
    }
  }, []);

  useEffect(() => {
    if (activeBoard) {
      loadBoardDetails(activeBoard.id);
    } else {
      setColumns([]);
      setTasksList([]);
    }
  }, [activeBoard, loadBoardDetails]);

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
    } catch (err) {
      console.error("Failed to delete board:", err);
      loadBoards();
    }
  };

  // Column CRUD operations
  const handleAddColumn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColumnName.trim() || !activeBoard) return;

    if (columns.length >= 5) {
      alert("Maximum of 5 columns allowed per board.");
      return;
    }

    const name = newColumnName.trim();
    setNewColumnName("");

    try {
      const tempId = -Math.floor(Math.random() * 1000000);
      const tempCol: KanbanColumn = {
        id: tempId,
        boardId: activeBoard.id,
        name,
        position: columns.length,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setColumns(prev => [...prev, tempCol]);

      const realCol = await createColumn(activeBoard.id, name);
      setColumns(prev => prev.map(c => (c.id === tempId ? realCol : c)));
    } catch (err) {
      console.error("Failed to create column:", err);
      if (activeBoard) loadBoardDetails(activeBoard.id);
    }
  };

  const handleUpdateColumnName = async (columnId: number) => {
    if (!editingColumnName.trim()) return;
    const name = editingColumnName.trim();
    setEditingColumnId(null);

    setColumns(prev =>
      prev.map(c => (c.id === columnId ? { ...c, name } : c))
    );

    try {
      await updateColumn(columnId, name);
    } catch (err) {
      console.error("Failed to rename column:", err);
      if (activeBoard) loadBoardDetails(activeBoard.id);
    }
  };

  const handleDeleteColumn = async (columnId: number) => {
    if (!confirm("Are you sure you want to delete this column and all its task cards?")) {
      return;
    }

    setColumns(prev => prev.filter(c => c.id !== columnId));
    setTasksList(prev => prev.filter(t => t.columnId !== columnId));

    try {
      await deleteColumn(columnId);
    } catch (err) {
      console.error("Failed to delete column:", err);
      if (activeBoard) loadBoardDetails(activeBoard.id);
    }
  };

  // Task Dialog Openers
  const openCreateTaskDialog = (columnId: number) => {
    setSelectedTask(null);
    setPresetColumnId(columnId);
    
    // Default today date format
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, "0");
    const d = String(today.getDate()).padStart(2, "0");
    
    setTaskTitle("");
    setTaskDescription("");
    setTaskDueDate(`${y}-${m}-${d}`);
    setTaskPriority("Medium");
    setTaskLabels("");
    setSyncCalendar(false);
    setSyncNotes(false);
    setIsTaskDialogOpen(true);
  };

  const openEditTaskDialog = (task: KanbanTask) => {
    setSelectedTask(task);
    setPresetColumnId(task.columnId);
    setTaskTitle(task.title);
    setTaskDescription(task.description || "");
    setTaskPriority(task.priority);
    setTaskLabels(task.labels || "");
    setSyncCalendar(task.syncCalendar);
    setSyncNotes(task.syncNotes);
    
    if (task.dueDate) {
      const d = new Date(task.dueDate);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      setTaskDueDate(`${year}-${month}-${day}`);
    } else {
      setTaskDueDate("");
    }
    setIsTaskDialogOpen(true);
  };

  // Task CRUD operations
  const handleSaveTaskCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim() || !presetColumnId) return;

    const parsedDueDate = taskDueDate ? new Date(taskDueDate + "T12:00:00") : null;
    
    setIsTaskDialogOpen(false);

    try {
      if (selectedTask) {
        // Edit Optimistic
        setTasksList(prev =>
          prev.map(t =>
            t.id === selectedTask.id
              ? {
                  ...t,
                  title: taskTitle,
                  description: taskDescription || null,
                  dueDate: parsedDueDate,
                  priority: taskPriority,
                  labels: taskLabels || null,
                  syncCalendar,
                  syncNotes,
                }
              : t
          )
        );
        await updateTaskCard(selectedTask.id, {
          title: taskTitle,
          description: taskDescription,
          dueDate: parsedDueDate,
          priority: taskPriority,
          labels: taskLabels,
          syncCalendar,
          syncNotes,
        });
      } else {
        // Create Optimistic Mock Task
        const tempId = -Math.floor(Math.random() * 1000000);
        const tempTask: KanbanTask = {
          id: tempId,
          columnId: presetColumnId,
          title: taskTitle,
          description: taskDescription || null,
          dueDate: parsedDueDate,
          priority: taskPriority,
          labels: taskLabels || null,
          syncCalendar,
          syncNotes,
          position: tasksList.filter(t => t.columnId === presetColumnId).length,
          calendarTaskId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        setTasksList(prev => [...prev, tempTask]);

        const realTask = await createTaskCard({
          columnId: presetColumnId,
          title: taskTitle,
          description: taskDescription,
          dueDate: parsedDueDate,
          priority: taskPriority,
          labels: taskLabels,
          syncCalendar,
          syncNotes,
        });
        setTasksList(prev => prev.map(t => (t.id === tempId ? realTask : t)));
      }
    } catch (err) {
      console.error("Failed to save task card:", err);
      if (activeBoard) loadBoardDetails(activeBoard.id);
    }
  };

  const handleDeleteTaskCard = async () => {
    if (!selectedTask) return;
    setIsTaskDialogOpen(false);

    try {
      setTasksList(prev => prev.filter(t => t.id !== selectedTask.id));
      await deleteTaskCard(selectedTask.id);
    } catch (err) {
      console.error("Failed to delete task:", err);
      if (activeBoard) loadBoardDetails(activeBoard.id);
    }
  };

  // Drag and Drop Tasks
  const handleTaskDragStart = (e: React.DragEvent, taskId: number) => {
    e.dataTransfer.setData("text/plain", taskId.toString());
    e.dataTransfer.effectAllowed = "move";
  };

  const handleTaskDrop = async (e: React.DragEvent, targetColumnId: number) => {
    e.preventDefault();
    setDraggedOverColId(null);

    const taskIdStr = e.dataTransfer.getData("text/plain");
    if (!taskIdStr) return;
    const taskId = parseInt(taskIdStr, 10);
    if (isNaN(taskId)) return;

    const task = tasksList.find(t => t.id === taskId);
    if (!task) return;
    if (task.columnId === targetColumnId) return;

    // Optimistic Move
    setTasksList(prev =>
      prev.map(t => (t.id === taskId ? { ...t, columnId: targetColumnId } : t))
    );

    try {
      await updateTaskCard(taskId, { columnId: targetColumnId });
    } catch (err) {
      console.error("Failed to drag task card:", err);
      if (activeBoard) loadBoardDetails(activeBoard.id);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // Render variables
  const getTasksForColumn = (columnId: number) => {
    return tasksList.filter(t => t.columnId === columnId);
  };

  const getBoardColorDetails = (hexColor: string) => {
    return BOARD_COLORS.find(c => c.value === hexColor) || BOARD_COLORS[0];
  };

  return (
    <div className="flex min-h-screen flex-1 flex-col md:ml-0 overflow-x-hidden bg-[#f6f1e6]/40">
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
          <div className="min-w-0">
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

      {/* Main Workspace Workspace */}
      <div className="flex-1 p-4 md:p-6 lg:grid lg:grid-cols-[280px_1fr] lg:gap-6 space-y-6 lg:space-y-0">
        {/* Left Side Boards panel */}
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
              <div className="py-8 text-center text-[13px] text-slate-400 font-medium">
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

        {/* Right side Board Workspace Area */}
        <div className="flex flex-col flex-1 min-w-0">
          {activeBoard ? (
            <div className="space-y-6">
              {/* Board Header details */}
              <div className="flex flex-wrap items-end justify-between gap-4 bg-white p-5 rounded-[22px] border border-[#eadfc8] shadow-xs">
                <div>
                  <div className="flex items-center gap-3">
                    <span className={cn("h-3.5 w-3.5 rounded-full shrink-0", getBoardColorDetails(activeBoard.color).dot)} />
                    <h2 className="text-[24px] md:text-[28px] font-semibold tracking-tight text-slate-950 leading-none">
                      {activeBoard.name}
                    </h2>
                  </div>
                  <p className="text-[12.5px] text-slate-500 mt-2 font-medium">
                    {columns.length}/5 columns • {tasksList.length} tasks
                  </p>
                  
                  {/* Collaborators row */}
                  <div className="flex items-center gap-2 mt-3.5">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-white text-[11px] font-bold shadow-xs">
                      ZC
                    </div>
                    <span className="text-[12px] text-slate-400 font-semibold italic">
                      1 active now
                    </span>
                  </div>
                </div>

                {/* Columns edit form and top buttons */}
                <div className="space-y-3.5 w-full md:w-auto">
                  <div className="flex items-center justify-end gap-2">
                    <button className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 text-[12.5px] font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer">
                      <Users className="h-3.5 w-3.5" />
                      Collaboration
                    </button>
                    <button className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 transition cursor-pointer">
                      <Settings className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Add Column input */}
                  {columns.length < 5 && (
                    <form onSubmit={handleAddColumn} className="flex items-center gap-1.5">
                      <input
                        type="text"
                        required
                        value={newColumnName}
                        onChange={(e) => setNewColumnName(e.target.value)}
                        placeholder="New column name..."
                        className="h-9 px-3 text-[13px] rounded-xl border border-[#ebdcb9] bg-[#fffcf6] focus:outline-none focus:ring-1 focus:ring-[#f15f49] focus:border-[#f15f49] text-slate-800 placeholder-slate-400 max-w-[160px]"
                      />
                      <button
                        type="submit"
                        className="inline-flex h-9 items-center justify-center rounded-xl bg-[#d97706] px-3.5 text-[12.5px] font-semibold text-white shadow-xs hover:brightness-95 transition cursor-pointer"
                      >
                        + Column
                      </button>
                    </form>
                  )}
                </div>
              </div>

              {/* Columns Horizontal Grid scrollable */}
              <div className="flex gap-5 overflow-x-auto pb-4 scrollbar-thin">
                {columns.map(col => {
                  const colTasks = getTasksForColumn(col.id);
                  const isEditing = editingColumnId === col.id;
                  const isDraggedOver = draggedOverColId === col.id;

                  return (
                    <div
                      key={col.id}
                      onDragOver={handleDragOver}
                      onDragEnter={(e) => {
                        e.preventDefault();
                        setDraggedOverColId(col.id);
                      }}
                      onDragLeave={() => setDraggedOverColId(null)}
                      onDrop={(e) => handleTaskDrop(e, col.id)}
                      className={cn(
                        "rounded-[20px] bg-slate-50 p-4 border border-slate-100 flex flex-col w-80 shrink-0 min-h-[460px] transition-all",
                        isDraggedOver && "bg-emerald-50/50 border-emerald-300 border-dashed"
                      )}
                    >
                      {/* Column Header */}
                      <div className="flex items-start justify-between pb-3.5">
                        <div className="min-w-0 flex-1">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editingColumnName}
                              onChange={(e) => setEditingColumnName(e.target.value)}
                              onBlur={() => handleUpdateColumnName(col.id)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleUpdateColumnName(col.id);
                                if (e.key === "Escape") setEditingColumnId(null);
                              }}
                              autoFocus
                              className="w-full text-[14.5px] font-semibold text-slate-900 border-b border-amber-600 focus:outline-none bg-transparent"
                            />
                          ) : (
                            <h3
                              onClick={() => {
                                setEditingColumnId(col.id);
                                setEditingColumnName(col.name);
                              }}
                              className="text-[15px] font-bold text-slate-800 tracking-tight hover:underline cursor-pointer truncate"
                            >
                              {col.name}
                            </h3>
                          )}
                          <span className="text-[12px] text-slate-400 font-semibold block mt-0.5">
                            {colTasks.length} tasks
                          </span>
                        </div>

                        {/* Column Header Actions */}
                        <div className="flex items-center gap-1 shrink-0 ml-2">
                          <button
                            onClick={() => openCreateTaskDialog(col.id)}
                            className="p-1 rounded hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition cursor-pointer"
                            title="Add task to this column"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteColumn(col.id)}
                            className="p-1 rounded hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                            title="Delete column"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Dash Box to quickly Add Task */}
                      <button
                        onClick={() => openCreateTaskDialog(col.id)}
                        className="mb-3.5 inline-flex h-11 items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-200 hover:border-[#d97706]/40 hover:bg-[#fffbeb]/20 hover:text-[#d97706] text-slate-400 text-[12.5px] font-bold transition cursor-pointer"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Add task
                      </button>

                      {/* Tasks list cards inside column */}
                      <div className="flex-1 overflow-y-auto space-y-3 max-h-[450px] scrollbar-thin">
                        {colTasks.map(task => {
                          const priorityDetails = PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.Medium;
                          const labelsList = task.labels ? task.labels.split(",").map(l => l.trim()).filter(Boolean) : [];
                          const formattedDueDate = task.dueDate ? new Date(task.dueDate).toLocaleDateString("default", { month: "short", day: "numeric" }) : "";

                          return (
                            <div
                              key={task.id}
                              draggable
                              onDragStart={(e) => handleTaskDragStart(e, task.id)}
                              onClick={() => openEditTaskDialog(task)}
                              className="rounded-xl border border-slate-200 bg-white p-3.5 text-left shadow-xs transition hover:shadow-sm hover:border-slate-300 cursor-grab active:cursor-grabbing relative group/card"
                            >
                              <h4 className="text-[13.5px] font-bold text-slate-900 leading-snug">
                                {task.title}
                              </h4>
                              {task.description && (
                                <p className="text-[11.5px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                                  {task.description}
                                </p>
                              )}

                              {/* Label pill badges */}
                              {labelsList.length > 0 && (
                                <div className="mt-2.5 flex flex-wrap gap-1">
                                  {labelsList.map((lbl, lidx) => (
                                    <span
                                      key={lidx}
                                      className="rounded-full bg-[#f6f1e6] border border-[#eadfc8] px-2 py-0.5 text-[9.5px] font-bold text-slate-600"
                                    >
                                      {lbl}
                                    </span>
                                  ))}
                                </div>
                              )}

                              {/* Task Card Footer details */}
                              <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                                <div className="flex items-center gap-2">
                                  {/* Priority pill */}
                                  <span
                                    className={cn(
                                      "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9.5px] font-bold border",
                                      priorityDetails.bg
                                    )}
                                  >
                                    <span className={cn("h-1.5 w-1.5 rounded-full", priorityDetails.bgDot)} />
                                    {task.priority}
                                  </span>

                                  {/* Due Date details */}
                                  {formattedDueDate && (
                                    <span className="inline-flex items-center gap-1 text-slate-400 font-semibold leading-none">
                                      <Clock className="h-3 w-3 shrink-0" />
                                      {formattedDueDate}
                                    </span>
                                  )}
                                </div>

                                {/* Sync Indicators */}
                                <div className="flex items-center gap-1 text-slate-400">
                                  {task.syncCalendar && (
                                    <span title="Synchronized with Calendar">
                                      <Calendar className="h-3.5 w-3.5 text-emerald-600" />
                                    </span>
                                  )}
                                  {task.syncNotes && (
                                    <span title="Linked with Notes">
                                      <StickyNote className="h-3.5 w-3.5 text-indigo-500" />
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
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

      {/* CREATE & EDIT TASK MODAL DIALOG */}
      {isTaskDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/45 backdrop-blur-xs">
          <div className="w-full max-w-[480px] bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-[#fbf7ef]/30">
              <h3 className="text-[16.5px] font-bold text-slate-900">
                {selectedTask ? "Edit Task Details" : "Create Kanban Task"}
              </h3>
              <button
                onClick={() => setIsTaskDialogOpen(false)}
                className="h-7 w-7 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500 inline-flex items-center justify-center transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveTaskCard} className="p-5 space-y-4">
              {/* Task Title */}
              <div className="space-y-1.5">
                <label className="text-[12px] font-bold text-slate-500 uppercase tracking-wider">
                  Title
                </label>
                <input
                  type="text"
                  required
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="e.g. Design review with Zack"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-[13.5px] font-medium placeholder-slate-400 focus:outline-none focus:border-[#d97706] focus:ring-1 focus:ring-[#d97706] bg-white text-slate-800"
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-[12px] font-bold text-slate-500 uppercase tracking-wider">
                  Description / Notes
                </label>
                <textarea
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  placeholder="Add details, notes, or lists..."
                  rows={3}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-[13.5px] font-medium placeholder-slate-400 focus:outline-none focus:border-[#d97706] focus:ring-1 focus:ring-[#d97706] resize-none bg-white text-slate-800"
                />
              </div>

              {/* Due Date */}
              <div className="space-y-1.5">
                <label className="text-[12px] font-bold text-slate-500 uppercase tracking-wider">
                  Due Date
                </label>
                <input
                  type="date"
                  required
                  value={taskDueDate}
                  onChange={(e) => setTaskDueDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-[13.5px] font-medium focus:outline-none focus:border-[#d97706] focus:ring-1 focus:ring-[#d97706] bg-white text-slate-700 cursor-pointer"
                />
              </div>

              {/* Priority Select */}
              <div className="space-y-1.5">
                <label className="text-[12px] font-bold text-slate-500 uppercase tracking-wider">
                  Priority
                </label>
                <select
                  value={taskPriority}
                  onChange={(e) => setTaskPriority(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-[13.5px] font-semibold text-slate-700 focus:outline-none focus:border-[#d97706] bg-white cursor-pointer"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>

              {/* Labels (comma separated) */}
              <div className="space-y-1.5">
                <label className="text-[12px] font-bold text-slate-500 uppercase tracking-wider">
                  Labels
                </label>
                <input
                  type="text"
                  value={taskLabels}
                  onChange={(e) => setTaskLabels(e.target.value)}
                  placeholder="e.g. Design, Frontend, Bug"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-[13.5px] font-medium placeholder-slate-400 focus:outline-none focus:border-[#d97706] focus:ring-1 focus:ring-[#d97706] bg-white text-slate-800"
                />
                <span className="text-[11px] text-slate-400 inline-block mt-0.5 italic">
                  Separate tags with a comma (e.g. "Work, Bug").
                </span>
              </div>

              {/* Sync Options Toggles */}
              <div className="grid grid-cols-2 gap-4 pt-1">
                {/* Sync Calendar */}
                <label className="flex items-center gap-2 cursor-pointer py-1">
                  <input
                    type="checkbox"
                    checked={syncCalendar}
                    onChange={(e) => setSyncCalendar(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-[#d97706] focus:ring-[#d97706] cursor-pointer"
                  />
                  <div className="text-[12.5px] font-semibold text-slate-700 flex items-center gap-1 leading-none select-none">
                    <Calendar className="h-3.5 w-3.5 text-emerald-600" />
                    Sync with Calendar
                  </div>
                </label>

                {/* Sync Notes */}
                <label className="flex items-center gap-2 cursor-pointer py-1">
                  <input
                    type="checkbox"
                    checked={syncNotes}
                    onChange={(e) => setSyncNotes(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-[#d97706] focus:ring-[#d97706] cursor-pointer"
                  />
                  <div className="text-[12.5px] font-semibold text-slate-700 flex items-center gap-1 leading-none select-none">
                    <StickyNote className="h-3.5 w-3.5 text-indigo-500" />
                    Link with Notes
                  </div>
                </label>
              </div>

              {/* Form Actions */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                {selectedTask ? (
                  <button
                    type="button"
                    onClick={handleDeleteTaskCard}
                    className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-600 px-4 text-[13.5px] font-bold transition cursor-pointer animate-fade-in"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsTaskDialogOpen(false)}
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
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
