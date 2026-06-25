"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Plus,
  Menu,
} from "lucide-react";

import { SidebarLayout, useSidebar } from "@/components/sidebar";
import { cn } from "@/lib/utils";
import { getTasks, createTask, updateTask, deleteTask } from "./actions";
import type { Task } from "@/db/schema";

import { CalendarGrid } from "./components/CalendarGrid";
import { DraftTaskPanel } from "./components/DraftTaskPanel";
import { TaskDialog } from "./components/TaskDialog";

const CATEGORIES = [
  { name: "Focus", color: "#0284c7" },
  { name: "Meeting", color: "#d97706" },
  { name: "Personal", color: "#e11d48" },
  { name: "Work", color: "#10b981" },
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
  const [scheduleTime, setScheduleTime] = useState<string>(""); // HH:mm

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

  const handleDateChange = (newDateStr: string) => {
    setScheduleDate(newDateStr);
    if (newDateStr) {
      setDialogPresetDate(new Date(newDateStr + "T00:00:00"));
    } else {
      setDialogPresetDate(null);
    }
  };

  // Modal Openers
  const openCreateDialog = (date: Date | null = null) => {
    setSelectedTask(null);
    setDialogPresetDate(date);
    setTitle("");
    setDescription("");
    setCategory("Work");
    setTaskType("task");
    setScheduleTime("");
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
    setTitle(task.title);
    setDescription(task.description || "");
    setCategory(task.category);
    setTaskType(task.type);
    if (task.date) {
      const d = new Date(task.date);
      setDialogPresetDate(d);
      
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      setScheduleDate(`${year}-${month}-${day}`);

      const hours = String(d.getHours()).padStart(2, "0");
      const minutes = String(d.getMinutes()).padStart(2, "0");
      setScheduleTime(`${hours}:${minutes}`);
    } else {
      setDialogPresetDate(null);
      setScheduleDate("");
      setScheduleTime("");
    }
    setIsDialogOpen(true);
  };

  // Save as Draft
  const handleSaveAsDraft = async () => {
    if (!title.trim()) return;
    setIsDialogOpen(false);

    const activeCat = CATEGORIES.find((c) => c.name === category) || CATEGORIES[0];

    try {
      if (selectedTask) {
        setTasksList((prev) =>
          prev.map((t) =>
            t.id === selectedTask.id
              ? {
                  ...t,
                  title,
                  description,
                  category,
                  color: activeCat.color,
                  type: taskType,
                  date: null,
                }
              : t
          )
        );
        await updateTask(selectedTask.id, {
          title,
          description,
          category,
          color: activeCat.color,
          type: taskType,
          date: null,
        });
      } else {
        const tempId = -Math.floor(Math.random() * 1000000);
        const tempTask: Task = {
          id: tempId,
          userId: "temp",
          title,
          description,
          category,
          color: activeCat.color,
          type: taskType,
          date: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        setTasksList((prev) => [...prev, tempTask]);

        const realTask = await createTask({
          title,
          description,
          date: null,
          category,
          color: activeCat.color,
          type: taskType,
        });
        setTasksList((prev) => prev.map((t) => (t.id === tempId ? realTask : t)));
      }
    } catch (err) {
      console.error("Save draft failed:", err);
      loadTasks();
    }
  };

  // Save as Scheduled
  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (!scheduleDate) {
      alert("Please select a date to schedule this item.");
      return;
    }

    setIsDialogOpen(false);

    const dateParts = scheduleDate.split("-");
    const timeParts = (scheduleTime || "12:00").split(":");
    const parsedDate = new Date(
      Number(dateParts[0]),
      Number(dateParts[1]) - 1,
      Number(dateParts[2]),
      Number(timeParts[0]),
      Number(timeParts[1])
    );

    const activeCat = CATEGORIES.find((c) => c.name === category) || CATEGORIES[0];

    try {
      if (selectedTask) {
        setTasksList((prev) =>
          prev.map((t) =>
            t.id === selectedTask.id
              ? {
                  ...t,
                  title,
                  description,
                  category,
                  color: activeCat.color,
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
          color: activeCat.color,
          type: taskType,
          date: parsedDate,
        });
      } else {
        const tempId = -Math.floor(Math.random() * 1000000);
        const tempTask: Task = {
          id: tempId,
          userId: "temp",
          title,
          description,
          category,
          color: activeCat.color,
          type: taskType,
          date: parsedDate,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        setTasksList((prev) => [...prev, tempTask]);

        const realTask = await createTask({
          title,
          description,
          date: parsedDate,
          category,
          color: activeCat.color,
          type: taskType,
        });
        setTasksList((prev) => prev.map((t) => (t.id === tempId ? realTask : t)));
      }
    } catch (err) {
      console.error("Schedule task failed:", err);
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

          <CalendarGrid
            view={view}
            daysGrid={daysGrid}
            currentDate={currentDate}
            draggedOverDate={draggedOverDate}
            isSameDay={isSameDay}
            getTasksForDay={getTasksForDay}
            onDragOver={handleDragOver}
            onDragEnter={(dateKey) => setDraggedOverDate(dateKey)}
            onDragLeave={() => setDraggedOverDate(null)}
            onDropOnDay={handleDropOnDay}
            onDragStart={handleDragStart}
            onEditTask={openEditDialog}
            onQuickAddTask={openCreateDialog}
          />
        </div>

        <DraftTaskPanel
          draftTasks={draftTasks}
          isLoading={isLoading}
          isDraggedOverDrafts={isDraggedOverDrafts}
          onDragOver={handleDragOver}
          onDragEnter={(e) => {
            e.preventDefault();
            setIsDraggedOverDrafts(true);
          }}
          onDragLeave={() => setIsDraggedOverDrafts(false)}
          onDrop={handleDropOnDrafts}
          onDragStart={handleDragStart}
          onEditTask={openEditDialog}
          onAddTask={() => openCreateDialog(null)}
        />
      </div>

      <TaskDialog
        isOpen={isDialogOpen}
        selectedTask={selectedTask}
        dialogPresetDate={dialogPresetDate}
        title={title}
        setTitle={setTitle}
        description={description}
        setDescription={setDescription}
        category={category}
        setCategory={setCategory}
        taskType={taskType}
        setTaskType={setTaskType}
        scheduleDate={scheduleDate}
        setScheduleDate={setScheduleDate}
        scheduleTime={scheduleTime}
        setScheduleTime={setScheduleTime}
        onClose={() => setIsDialogOpen(false)}
        onSaveAsDraft={handleSaveAsDraft}
        onScheduleSubmit={handleScheduleSubmit}
        onDeleteTask={handleDeleteTask}
        onDateChange={handleDateChange}
      />
    </div>
  );
}
