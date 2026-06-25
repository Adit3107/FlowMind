"use client";

import React from "react";
import { Plus, Bell, Inbox, FolderOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Task } from "@/db/schema";

interface DraftTaskPanelProps {
  draftTasks: Task[];
  isLoading: boolean;
  isDraggedOverDrafts: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragEnter: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  onDragStart: (e: React.DragEvent, taskId: number) => void;
  onEditTask: (task: Task) => void;
  onAddTask: () => void;
}

export function DraftTaskPanel({
  draftTasks,
  isLoading,
  isDraggedOverDrafts,
  onDragOver,
  onDragEnter,
  onDragLeave,
  onDrop,
  onDragStart,
  onEditTask,
  onAddTask,
}: DraftTaskPanelProps) {
  return (
    <aside
      onDragOver={onDragOver}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={cn(
        "rounded-[24px] border border-[#eadfc8] bg-[#fbf7ef] p-5 shadow-sm flex flex-col min-h-[350px] transition-all duration-300",
        isDraggedOverDrafts && "bg-emerald-50/50 border-emerald-300 border-dashed"
      )}
    >
      {/* Draft Title Headers */}
      <div className="flex items-center justify-between pb-3 border-b border-[#eadfc8]">
        <div className="text-left">
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
        onClick={onAddTask}
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
              onDragStart={(e) => onDragStart(e, task.id)}
              onClick={() => onEditTask(task)}
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
  );
}
