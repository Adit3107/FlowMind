"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  X,
  Bell,
  CheckSquare,
  Sparkles,
  Inbox,
  FolderOpen,
  Menu,
} from "lucide-react";

import { SidebarLayout, useSidebar } from "@/components/sidebar";
import { cn } from "@/lib/utils";
import { getTasks, createTask, updateTask, deleteTask } from "./actions";
import type { Task } from "@/db/schema";

const CATEGORIES = [
  { name: "Work", color: "#f15f49", bg: "bg-[#fff1eb] text-[#f15f49] border-[#f6c8b8]" },
  { name: "Personal", color: "#d97706", bg: "bg-[#fffbeb] text-[#d97706] border-[#fef3c7]" },
  { name: "Urgent", color: "#e11d48", bg: "bg-[#fff1f2] text-[#e11d48] border-[#ffe4e6]" },
  { name: "Meeting", color: "#0284c7", bg: "bg-[#f0f9ff] text-[#0284c7] border-[#e0f2fe]" },
  { name: "Ideas", color: "#059669", bg: "bg-[#f0fdf4] text-[#059669] border-[#d1fae5]" },
  { name: "Study", color: "#7c3aed", bg: "bg-[#f5f3ff] text-[#7c3aed] border-[#ede9fe]" },
];

const WEEKDAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

export default function CalendarPage() {
  return (
    <SidebarLayout activeLabel="Calendar">
      <CalendarPageContent />
    </SidebarLayout>
  );
}

function CalendarPageContent() {
  const { setIsMobileOpen } = useSidebar();
  
  // Date State
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [view, setView] = useState<"month" | "week">("month");

  // Tasks State
  const [tasksList, setTasksList] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [dialogPresetDate, setDialogPresetDate] = useState<Date | null>(null);

  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Work");
  const [taskType, setTaskType] = useState("task"); // 'task' | 'reminder'
  const [scheduleDate, setScheduleDate] = useState<string>(""); // yyyy-MM-dd

  // Drag and Drop Dragged Over State
  const [draggedOverDate, setDraggedOverDate] = useState<string | null>(null);
  const [isDraggedOverDrafts, setIsDraggedOverDrafts] = useState(false);

  // Load Tasks from DB
  const loadTasks = useCallback(async () => {
    try {
      const data = await getTasks();
      const parsed = data.map((t) => ({
        ...t,
        date: t.date ? new Date(t.date) : null,
      }));
      setTasksList(parsed);
    } catch (e) {
      console.error("Failed to load tasks:", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  // Helpers for date calculations
  const getMonthDays = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const startDayOfWeek = firstDayOfMonth.getDay();
    const startDate = new Date(firstDayOfMonth);
    startDate.setDate(firstDayOfMonth.getDate() - startDayOfWeek);
    
    const days: Date[] = [];
    // Render exactly 42 cells (6 rows)
    for (let i = 0; i < 42; i++) {
      days.push(new Date(startDate));
      startDate.setDate(startDate.getDate() + 1);
    }
    return days;
  };

  const getWeekDays = (date: Date) => {
    const currentDayOfWeek = date.getDay();
    const startDate = new Date(date);
    startDate.setDate(date.getDate() - currentDayOfWeek);
    
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      days.push(new Date(startDate));
      startDate.setDate(startDate.getDate() + 1);
    }
    return days;
  };

  const isSameDay = (d1: Date, d2: Date) => {
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  };

  // Navigations
  const handlePrev = () => {
    const newDate = new Date(currentDate);
    if (view === "month") {
      newDate.setMonth(currentDate.getMonth() - 1);
    } else {
      newDate.setDate(currentDate.getDate() - 7);
    }
    setCurrentDate(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(currentDate);
    if (view === "month") {
      newDate.setMonth(currentDate.getMonth() + 1);
    } else {
      newDate.setDate(currentDate.getDate() + 7);
    }
    setCurrentDate(newDate);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Modal Openers
  const openCreateDialog = (date: Date | null = null) => {
    setSelectedTask(null);
    setDialogPresetDate(date);
    setTitle("");
    setDescription("");
    setCategory("Work");
    setTaskType("task");
    if (date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      setScheduleDate(`${year}-${month}-${day}`);
    } else {
      setScheduleDate("");
    }
    setIsDialogOpen(true);
  };

  const openEditDialog = (task: Task) => {
    setSelectedTask(task);
    setDialogPresetDate(task.date);
    setTitle(task.title);
    setDescription(task.description || "");
    setCategory(task.category);
    setTaskType(task.type);
    if (task.date) {
      const dateObj = new Date(task.date);
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, "0");
      const day = String(dateObj.getDate()).padStart(2, "0");
      setScheduleDate(`${year}-${month}-${day}`);
    } else {
      setScheduleDate("");
    }
    setIsDialogOpen(true);
  };

  // CRUD handlers
  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const parsedDate = scheduleDate ? new Date(scheduleDate + "T12:00:00") : null;
    const activeCategory = CATEGORIES.find(c => c.name === category) || CATEGORIES[0];

    setIsDialogOpen(false);

    try {
      if (selectedTask) {
        // Update Optimistic
        setTasksList(prev =>
          prev.map(t =>
            t.id === selectedTask.id
              ? {
                  ...t,
                  title,
                  description,
                  category,
                  color: activeCategory.color,
                  type: taskType,
                  date: parsedDate,
                }
              : t
          )
        );
        await updateTask(selectedTask.id, {
          title,
          description,
          category,
          color: activeCategory.color,
          type: taskType,
          date: parsedDate,
        });
      } else {
        // Create optimistic mock task to prevent visual lag
        const tempId = -Math.floor(Math.random() * 1000000);
        const tempTask: Task = {
          id: tempId,
          userId: "temp",
          title,
          description,
          category,
          color: activeCategory.color,
          type: taskType,
          date: parsedDate,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        setTasksList(prev => [...prev, tempTask]);
        
        const realTask = await createTask({
          title,
          description,
          date: parsedDate,
          category,
          color: activeCategory.color,
          type: taskType,
        });

        // Replace optimistic task with DB result
        setTasksList(prev => prev.map(t => (t.id === tempId ? realTask : t)));
      }
    } catch (err) {
      console.error("Save task failed:", err);
      loadTasks();
    }
  };

  const handleDeleteTask = async () => {
    if (!selectedTask) return;
    setIsDialogOpen(false);

    try {
      // Optimistic delete
      setTasksList(prev => prev.filter(t => t.id !== selectedTask.id));
      await deleteTask(selectedTask.id);
    } catch (err) {
      console.error("Delete task failed:", err);
      loadTasks();
    }
  };

  // Drag and drop mechanics
  const handleDragStart = (e: React.DragEvent, taskId: number) => {
    e.dataTransfer.setData("text/plain", taskId.toString());
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDropOnDay = async (e: React.DragEvent, targetDate: Date) => {
    e.preventDefault();
    setDraggedOverDate(null);
    const taskIdStr = e.dataTransfer.getData("text/plain");
    if (!taskIdStr) return;
    const taskId = parseInt(taskIdStr, 10);
    if (isNaN(taskId)) return;

    // Reset date hours to prevent offset timezone errors
    const adjustedDate = new Date(targetDate);
    adjustedDate.setHours(12, 0, 0, 0);

    // Optimistic Update
    setTasksList(prev =>
      prev.map(t => (t.id === taskId ? { ...t, date: adjustedDate } : t))
    );

    try {
      await updateTask(taskId, { date: adjustedDate });
    } catch (error) {
      console.error("Reschedule task failed:", error);
      loadTasks();
    }
  };

  const handleDropOnDrafts = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggedOverDrafts(false);
    const taskIdStr = e.dataTransfer.getData("text/plain");
    if (!taskIdStr) return;
    const taskId = parseInt(taskIdStr, 10);
    if (isNaN(taskId)) return;

    // Optimistic Update
    setTasksList(prev =>
      prev.map(t => (t.id === taskId ? { ...t, date: null } : t))
    );

    try {
      await updateTask(taskId, { date: null });
    } catch (error) {
      console.error("Remove schedule failed:", error);
      loadTasks();
    }
  };

  const monthName = currentDate.toLocaleString("default", { month: "long" });
  const year = currentDate.getFullYear();

  // Filter Tasks
  const scheduledTasks = tasksList.filter(t => t.date !== null);
  const draftTasks = tasksList.filter(t => t.date === null);

  // Group scheduled tasks by date string for quick rendering lookup
  const getTasksForDay = (date: Date) => {
    return scheduledTasks.filter(t => t.date && isSameDay(new Date(t.date), date));
  };

  const daysGrid = view === "month" ? getMonthDays(currentDate) : getWeekDays(currentDate);

  return (
    <div className="flex min-h-screen flex-1 flex-col md:ml-0 overflow-x-hidden">
      {/* Navigation Header */}
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
            <div className="flex items-center gap-2 text-[13px] font-medium text-emerald-600">
              <CalendarDays className="h-4 w-4 text-emerald-600" />
              Calendar
            </div>
            <h1 className="mt-2 text-[32px] md:text-[40px] font-semibold leading-[1.05] tracking-[-0.03em] text-slate-950">
              Schedule the work, hold the maybes.
            </h1>
            <p className="mt-2 text-[14px] md:text-[15px] leading-relaxed text-slate-600 max-w-4xl">
              Add tasks and reminders to dates, keep unscheduled drafts nearby, and drag work into place when the plan
              firms up.
            </p>
          </div>
        </div>
      </header>

      {/* Main Content Workspace Layout */}
      <div className="flex-1 p-4 md:p-6 lg:grid lg:grid-cols-[1fr_320px] lg:gap-6 space-y-6 lg:space-y-0">
        {/* Calendar Grid Area */}
        <div className="rounded-[24px] border border-[#eadfc8] bg-white p-4 md:p-5 shadow-sm flex flex-col h-fit">
          {/* Calendar Controls */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-[20px] md:text-[24px] font-semibold tracking-tight text-slate-950">
                {monthName} {year}
              </h2>
              <p className="text-[12.5px] text-slate-500 mt-0.5">
                Drop drafts or scheduled items onto any date.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Month / Week switcher */}
              <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200 shadow-inner">
                <button
                  onClick={() => setView("month")}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-[12px] font-semibold transition cursor-pointer",
                    view === "month"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-900"
                  )}
                >
                  Month
                </button>
                <button
                  onClick={() => setView("week")}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-[12px] font-semibold transition cursor-pointer",
                    view === "week"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-900"
                  )}
                >
                  Week
                </button>
              </div>

              {/* Today button */}
              <button
                onClick={handleToday}
                className="inline-flex h-9 items-center justify-center rounded-xl border border-[#eadfc8] bg-white px-3 text-[13px] font-semibold text-slate-800 shadow-sm hover:bg-slate-50 transition cursor-pointer"
              >
                Today
              </button>

              {/* Previous / Next buttons */}
              <div className="inline-flex rounded-xl border border-[#eadfc8] bg-white shadow-sm overflow-hidden">
                <button
                  onClick={handlePrev}
                  className="inline-flex h-9 w-9 items-center justify-center border-r border-[#eadfc8] hover:bg-slate-50 text-slate-600 transition cursor-pointer"
                  aria-label="Previous month"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={handleNext}
                  className="inline-flex h-9 w-9 items-center justify-center hover:bg-slate-50 text-slate-600 transition cursor-pointer"
                  aria-label="Next month"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              {/* New Task button */}
              <button
                onClick={() => openCreateDialog(null)}
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-[#f15f49] px-4 text-[13px] font-semibold text-white shadow-sm shadow-orange-200 hover:brightness-95 transition cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                New task
              </button>
            </div>
          </div>

          {/* Calendar Grid Container */}
          <div className="mt-4 flex-1">
            {/* Weekday Labels */}
            <div className="grid grid-cols-7 gap-px border-b border-slate-100 pb-2 text-center">
              {WEEKDAYS.map((day) => (
                <div key={day} className="text-[11px] font-bold tracking-[0.08em] text-slate-400">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Cells */}
            <div
              className={cn(
                "grid grid-cols-7 gap-px bg-slate-100/60 mt-1 border border-slate-100 rounded-2xl overflow-hidden",
                view === "month" ? "grid-rows-6 min-h-[500px]" : "grid-rows-1 min-h-[220px]"
              )}
            >
              {daysGrid.map((day, idx) => {
                const dayTasks = getTasksForDay(day);
                const isCurrentMonth = day.getMonth() === currentDate.getMonth();
                const isToday = isSameDay(day, new Date());
                const dateKey = day.toISOString();
                const isDraggedOver = draggedOverDate === dateKey;

                return (
                  <div
                    key={idx}
                    onDragOver={handleDragOver}
                    onDragEnter={(e) => {
                      e.preventDefault();
                      setDraggedOverDate(dateKey);
                    }}
                    onDragLeave={() => setDraggedOverDate(null)}
                    onDrop={(e) => handleDropOnDay(e, day)}
                    className={cn(
                      "bg-white p-2 min-h-[90px] flex flex-col justify-between transition-colors border-r border-b border-slate-100 relative group/cell",
                      !isCurrentMonth && "bg-slate-50/50 text-slate-400",
                      isToday && "bg-[#fffbeb]/30",
                      isDraggedOver && "bg-emerald-50/70 border-emerald-300 z-10"
                    )}
                  >
                    {/* Day number and quick add trigger */}
                    <div className="flex items-center justify-between">
                      <span
                        className={cn(
                          "inline-flex h-6 w-6 items-center justify-center rounded-full text-[12.5px] font-bold",
                          isToday && "bg-[#f15f49] text-white shadow-sm",
                          !isToday && isCurrentMonth && "text-slate-800",
                          !isToday && !isCurrentMonth && "text-slate-300"
                        )}
                      >
                        {day.getDate()}
                      </span>
                      <button
                        onClick={() => openCreateDialog(day)}
                        className="opacity-0 group-hover/cell:opacity-100 inline-flex h-5 w-5 items-center justify-center rounded bg-slate-100 hover:bg-slate-200 text-slate-500 transition cursor-pointer"
                        title="Add task to this date"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>

                    {/* Task list container */}
                    <div className="mt-2 flex-1 flex flex-col gap-1.5 overflow-y-auto max-h-[85px] scrollbar-thin">
                      {dayTasks.map((task) => {
                        const isTemp = task.id < 0;
                        const catColor = CATEGORIES.find((c) => c.name === task.category) || CATEGORIES[0];
                        return (
                          <div
                            key={task.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, task.id)}
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditDialog(task);
                            }}
                            style={{ borderLeftColor: task.color }}
                            className={cn(
                              "rounded-lg border border-slate-200/80 bg-white pl-2 pr-1.5 py-1 text-left text-slate-800 hover:border-slate-300 hover:shadow-xs transition duration-150 cursor-grab active:cursor-grabbing text-[11px] font-semibold flex items-center justify-between gap-1.5 truncate border-l-[3.5px]",
                              isTemp && "opacity-60 pointer-events-none"
                            )}
                          >
                            <span className="truncate flex-1 leading-tight">{task.title}</span>
                            {task.type === "reminder" ? (
                              <Bell className="h-3 w-3 text-slate-400 shrink-0" />
                            ) : (
                              <div
                                className="h-2 w-2 rounded-full shrink-0"
                                style={{ backgroundColor: task.color }}
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Draft Sidebar Panel */}
        <aside
          onDragOver={handleDragOver}
          onDragEnter={(e) => {
            e.preventDefault();
            setIsDraggedOverDrafts(true);
          }}
          onDragLeave={() => setIsDraggedOverDrafts(false)}
          onDrop={handleDropOnDrafts}
          className={cn(
            "rounded-[24px] border border-[#eadfc8] bg-[#fbf7ef] p-5 shadow-sm flex flex-col min-h-[350px] transition-all duration-300",
            isDraggedOverDrafts && "bg-emerald-50/50 border-emerald-300 border-dashed"
          )}
        >
          {/* Draft Title Headers */}
          <div className="flex items-center justify-between pb-3 border-b border-[#eadfc8]">
            <div>
              <h3 className="text-[17px] font-semibold tracking-tight text-slate-950 flex items-center gap-1.5">
                Draft Task Panel
              </h3>
              <p className="text-[11.5px] text-slate-500 mt-0.5">
                Unscheduled work waits here.
              </p>
            </div>
            
            <div className="flex items-center gap-1.5">
              <span className="inline-flex h-6 px-2 items-center justify-center rounded-full bg-slate-200/60 text-[11.5px] font-bold text-slate-600">
                {draftTasks.length}
              </span>
              <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#eadfc8] bg-white text-slate-400 shadow-xs">
                <Inbox className="h-4 w-4" />
              </div>
            </div>
          </div>

          {/* Quick Add Draft Button */}
          <button
            onClick={() => openCreateDialog(null)}
            className="mt-4 inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-dashed border-[#eadfc8] hover:border-[#f15f49]/40 hover:bg-[#fff1eb]/30 hover:text-[#f15f49] text-slate-500 text-[13px] font-semibold transition cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            Add draft
          </button>

          {/* Draft Tasks Lists */}
          <div className="mt-4 flex-1 overflow-y-auto space-y-2 max-h-[400px] scrollbar-thin">
            {isLoading ? (
              <div className="py-12 text-center text-[13px] text-slate-400 font-medium">
                Loading drafts...
              </div>
            ) : draftTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 px-4 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-slate-400 border border-[#eadfc8] shadow-sm">
                  <FolderOpen className="h-6 w-6 text-[#eadfc8]" />
                </div>
                <h4 className="mt-4 text-[13.5px] font-semibold text-slate-800">No drafts waiting</h4>
                <p className="mt-1 text-[11px] text-slate-500 max-w-[200px] leading-relaxed">
                  Save unscheduled tasks here, then drag them onto a date.
                </p>
              </div>
            ) : (
              draftTasks.map((task) => (
                <div
                  key={task.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, task.id)}
                  onClick={() => openEditDialog(task)}
                  style={{ borderLeftColor: task.color }}
                  className="rounded-xl border border-slate-200 bg-white p-3 text-left shadow-xs transition hover:shadow-sm hover:border-slate-300 cursor-grab active:cursor-grabbing border-l-[4px] relative group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-[13px] font-semibold text-slate-900 truncate pr-4">
                        {task.title}
                      </div>
                      {task.description && (
                        <div className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                          {task.description}
                        </div>
                      )}
                    </div>
                    {task.type === "reminder" && (
                      <Bell className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                    )}
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <span
                      style={{ color: task.color, backgroundColor: `${task.color}10`, borderColor: `${task.color}30` }}
                      className="rounded-full px-2 py-0.5 text-[10px] font-bold border"
                    >
                      {task.category}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium italic">
                      Draft
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>
      </div>

      {/* CREATE & EDIT TASK MODAL DIALOG */}
      {isDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/45 backdrop-blur-xs">
          <div className="w-full max-w-[480px] bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-[#fbf7ef]/30">
              <h3 className="text-[17px] font-bold text-slate-900">
                {selectedTask ? "Edit task details" : "Schedule new task"}
              </h3>
              <button
                onClick={() => setIsDialogOpen(false)}
                className="h-7 w-7 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500 inline-flex items-center justify-center transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveTask} className="p-5 space-y-4">
              {/* Task Title */}
              <div className="space-y-1.5">
                <label className="text-[12px] font-bold text-slate-500 uppercase tracking-wider">
                  Title
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Design review with Zack"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-[13.5px] font-medium placeholder-slate-400 focus:outline-none focus:border-[#f15f49] focus:ring-1 focus:ring-[#f15f49] bg-white"
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-[12px] font-bold text-slate-500 uppercase tracking-wider">
                  Description / Notes
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add details, notes, or lists..."
                  rows={3}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-[13.5px] font-medium placeholder-slate-400 focus:outline-none focus:border-[#f15f49] focus:ring-1 focus:ring-[#f15f49] resize-none bg-white"
                />
              </div>

              {/* Schedule Date */}
              <div className="space-y-1.5">
                <label className="text-[12px] font-bold text-slate-500 uppercase tracking-wider">
                  Date
                </label>
                <input
                  type="date"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-[13.5px] font-medium focus:outline-none focus:border-[#f15f49] focus:ring-1 focus:ring-[#f15f49] bg-white text-slate-700"
                />
                <span className="text-[11px] text-slate-400 inline-block mt-1 italic">
                  Leave empty to save as a draft in the Draft Task Panel.
                </span>
              </div>

              {/* Type and Category Grid */}
              <div className="grid grid-cols-2 gap-4">
                {/* Type Selection */}
                <div className="space-y-1.5">
                  <label className="text-[12px] font-bold text-slate-500 uppercase tracking-wider">
                    Type
                  </label>
                  <select
                    value={taskType}
                    onChange={(e) => setTaskType(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-[13.5px] font-semibold text-slate-700 focus:outline-none focus:border-[#f15f49] bg-white cursor-pointer"
                  >
                    <option value="task">📝 Task</option>
                    <option value="reminder">🔔 Reminder</option>
                  </select>
                </div>

                {/* Category Selection */}
                <div className="space-y-1.5">
                  <label className="text-[12px] font-bold text-slate-500 uppercase tracking-wider">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-[13.5px] font-semibold text-slate-700 focus:outline-none focus:border-[#f15f49] bg-white cursor-pointer"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat.name} value={cat.name}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Form Actions */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                {selectedTask ? (
                  <button
                    type="button"
                    onClick={handleDeleteTask}
                    className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-600 px-4 text-[13.5px] font-bold transition cursor-pointer"
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
                    onClick={() => setIsDialogOpen(false)}
                    className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 px-4 text-[13.5px] font-bold transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="inline-flex h-10 items-center justify-center rounded-xl bg-[#f15f49] hover:brightness-95 text-white px-5 text-[13.5px] font-bold shadow-sm shadow-orange-100 transition cursor-pointer"
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
