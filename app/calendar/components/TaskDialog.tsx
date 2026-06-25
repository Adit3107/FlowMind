"use client";

import React from "react";
import { cn } from "@/lib/utils";
import type { Task } from "@/db/schema";

interface TaskDialogProps {
  isOpen: boolean;
  selectedTask: Task | null;
  dialogPresetDate: Date | null;
  
  title: string;
  setTitle: (val: string) => void;
  description: string;
  setDescription: (val: string) => void;
  category: string;
  setCategory: (val: string) => void;
  taskType: string;
  setTaskType: (val: string) => void;
  scheduleDate: string;
  setScheduleDate: (val: string) => void;
  scheduleTime: string;
  setScheduleTime: (val: string) => void;

  onClose: () => void;
  onSaveAsDraft: () => void;
  onScheduleSubmit: (e: React.FormEvent) => void;
  onDeleteTask: () => void;
  onDateChange: (dateStr: string) => void;
}

export function TaskDialog({
  isOpen,
  selectedTask,
  dialogPresetDate,
  title,
  setTitle,
  description,
  setDescription,
  category,
  setCategory,
  taskType,
  setTaskType,
  scheduleDate,
  scheduleTime,
  setScheduleTime,
  onClose,
  onSaveAsDraft,
  onScheduleSubmit,
  onDeleteTask,
  onDateChange,
}: TaskDialogProps) {
  if (!isOpen) return null;

  const getFormattedPresetDate = () => {
    if (!dialogPresetDate) return "Draft / Unscheduled";
    const m = dialogPresetDate.getMonth() + 1;
    const d = dialogPresetDate.getDate();
    const y = dialogPresetDate.getFullYear();
    return `${m}/${d}/${y}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/45 backdrop-blur-xs">
      <div className="w-full max-w-[500px] bg-white rounded-[20px] shadow-xl border border-[#eadfc8]/50 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200 p-6 md:p-8 space-y-6">
        {/* Modal Header */}
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-[20px] font-semibold text-slate-900 tracking-tight">
              {selectedTask ? "Edit calendar item" : "Create calendar item"}
            </h3>
            <p className="text-[13.5px] text-slate-500 mt-1">
              Selected date: {getFormattedPresetDate()}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[13.5px] font-semibold text-slate-500 hover:text-slate-955 hover:underline transition cursor-pointer"
          >
            Close
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={onScheduleSubmit} className="space-y-5">
          {/* Task Title */}
          <div className="space-y-1.5 text-left">
            <label className="text-[13.5px] font-semibold text-slate-800">
              Task title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Write the next thing to remember"
              className="w-full px-4 py-3 rounded-xl border border-[#ebdcb9] bg-[#fffcf6] text-[13.5px] font-medium placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#f15f49] focus:border-[#f15f49] text-slate-800"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5 text-left">
            <label className="text-[13.5px] font-semibold text-slate-800">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add helpful context"
              rows={4}
              className="w-full px-4 py-3 rounded-xl border border-[#ebdcb9] bg-[#fffcf6] text-[13.5px] font-medium placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#f15f49] focus:border-[#f15f49] resize-none text-slate-800"
            />
          </div>

          {/* Grid for Date, Time, Type */}
          <div className="grid grid-cols-3 gap-4 text-left">
            {/* Date Selection */}
            <div className="space-y-1.5">
              <label className="text-[13.5px] font-semibold text-slate-800">
                Date
              </label>
              <input
                type="date"
                value={scheduleDate}
                onChange={(e) => onDateChange(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-[#ebdcb9] bg-[#fffcf6] text-[13.5px] font-medium focus:outline-none focus:ring-1 focus:ring-[#f15f49] focus:border-[#f15f49] text-slate-700 cursor-pointer"
              />
            </div>

            {/* Time Selection */}
            <div className="space-y-1.5 relative">
              <label className="text-[13.5px] font-semibold text-slate-800">
                Time
              </label>
              <input
                type="time"
                value={scheduleTime}
                onChange={(e) => setScheduleTime(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-[#ebdcb9] bg-[#fffcf6] text-[13.5px] font-medium focus:outline-none focus:ring-1 focus:ring-[#f15f49] focus:border-[#f15f49] text-slate-700 cursor-pointer"
              />
            </div>

            {/* Type Selection */}
            <div className="space-y-1.5">
              <label className="text-[13.5px] font-semibold text-slate-800">
                Type
              </label>
              <select
                value={taskType}
                onChange={(e) => setTaskType(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-[#ebdcb9] bg-[#fffcf6] text-[13.5px] font-semibold text-slate-700 focus:outline-none focus:border-[#f15f49] focus:border-[#f15f49] cursor-pointer"
              >
                <option value="task">Task</option>
                <option value="reminder">Reminder</option>
              </select>
            </div>
          </div>

          {/* Category */}
          <div className="space-y-2 text-left">
            <label className="text-[13.5px] font-semibold text-slate-800 block">
              Category
            </label>
            <div className="flex flex-wrap gap-2.5">
              {[
                { name: "Focus", dotBg: "bg-[#0284c7]", text: "text-[#0284c7]", border: "border-[#e0f2fe]" },
                { name: "Meeting", dotBg: "bg-[#d97706]", text: "text-[#d97706]", border: "border-[#fef3c7]" },
                { name: "Personal", dotBg: "bg-[#e11d48]", text: "text-[#e11d48]", border: "border-[#ffe4e6]" },
                { name: "Work", dotBg: "bg-[#10b981]", text: "text-[#10b981]", border: "border-[#d1fae5]" },
              ].map((cat) => {
                const isSelected = category === cat.name;
                return (
                  <button
                    key={cat.name}
                    type="button"
                    onClick={() => setCategory(cat.name)}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-xl px-4 py-2 border text-[13px] font-semibold transition cursor-pointer",
                      isSelected
                        ? "border-[1.5px] border-[#f15f49] bg-white text-slate-900 shadow-xs"
                        : cn(cat.border, cat.text, "bg-white hover:brightness-98")
                    )}
                  >
                    <span className={cn("h-2.5 w-2.5 rounded-full shrink-0", cat.dotBg)} />
                    {cat.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
            {selectedTask ? (
              <button
                type="button"
                onClick={onDeleteTask}
                className="text-rose-600 hover:text-rose-700 hover:underline font-bold text-[13.5px] transition cursor-pointer"
              >
                Delete task
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onSaveAsDraft}
                className="inline-flex h-[42px] items-center justify-center rounded-xl border border-[#ebdcb9] bg-[#fffcf6] text-slate-800 px-5 text-[13.5px] font-semibold hover:bg-slate-50 transition cursor-pointer shadow-xs"
              >
                Save draft
              </button>
              <button
                type="submit"
                className="inline-flex h-[42px] items-center justify-center rounded-xl bg-[#f15f49] hover:brightness-98 text-white px-6 text-[13.5px] font-semibold shadow-xs shadow-orange-100 transition cursor-pointer"
              >
                {selectedTask ? "Save changes" : "Schedule"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
