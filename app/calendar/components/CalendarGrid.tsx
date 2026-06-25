"use client";

import React from "react";
import { Plus, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Task } from "@/db/schema";

const WEEKDAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

const CATEGORIES = [
  { name: "Focus", color: "#0284c7" },
  { name: "Meeting", color: "#d97706" },
  { name: "Personal", color: "#e11d48" },
  { name: "Work", color: "#10b981" },
];

interface CalendarGridProps {
  view: "month" | "week";
  daysGrid: Date[];
  currentDate: Date;
  draggedOverDate: string | null;
  isSameDay: (d1: Date, d2: Date) => boolean;
  getTasksForDay: (date: Date) => Task[];
  onDragOver: (e: React.DragEvent) => void;
  onDragEnter: (dateKey: string) => void;
  onDragLeave: () => void;
  onDropOnDay: (e: React.DragEvent, day: Date) => void;
  onDragStart: (e: React.DragEvent, taskId: number) => void;
  onEditTask: (task: Task) => void;
  onQuickAddTask: (date: Date) => void;
}

export function CalendarGrid({
  view,
  daysGrid,
  currentDate,
  draggedOverDate,
  isSameDay,
  getTasksForDay,
  onDragOver,
  onDragEnter,
  onDragLeave,
  onDropOnDay,
  onDragStart,
  onEditTask,
  onQuickAddTask,
}: CalendarGridProps) {
  return (
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
              onDragOver={onDragOver}
              onDragEnter={(e) => {
                e.preventDefault();
                onDragEnter(dateKey);
              }}
              onDragLeave={onDragLeave}
              onDrop={(e) => onDropOnDay(e, day)}
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
                  onClick={() => onQuickAddTask(day)}
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
                  return (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={(e) => onDragStart(e, task.id)}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditTask(task);
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
  );
}
