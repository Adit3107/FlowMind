"use client";

import { useState, type ComponentType } from "react";
import {
  ArrowLeftToLine,
  ArrowRight,
  ArrowRightToLine,
  BookOpenText,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  Circle,
  Columns3,
  HomeIcon,
  LayoutDashboard,
  LifeBuoy,
  Menu,
  MessageSquareMore,
  PenTool,
  Search,
  Settings2,
  Sparkles,
  StickyNote,
  Plus,
  TimerReset,
  Wand2,
  SquareKanban,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { SidebarLayout, useSidebar } from "@/components/sidebar";
import { useUser } from "@clerk/nextjs";

// NavGroup types and sidebar navigation config moved to components/sidebar.tsx

const quickCards = [
  {
    title: "Calendar",
    stat: "0 upcoming items",
    note: "0 drafts saved",
    color: "from-emerald-100 to-emerald-50 border-emerald-200 text-emerald-700",
    icon: CalendarDays,
  },
  {
    title: "Kanban / Tasks",
    stat: "0 tasks",
    note: "0 completed across 1 board",
    color: "from-amber-100 to-amber-50 border-amber-200 text-amber-700",
    icon: SquareKanban,
  },
  {
    title: "Notes",
    stat: "0 notes",
    note: "0 pinned notes ready",
    color: "from-sky-100 to-sky-50 border-sky-200 text-sky-700",
    icon: StickyNote,
  },
  {
    title: "Whiteboard",
    stat: "0 boards",
    note: "Canvas ready",
    color: "from-rose-100 to-rose-50 border-rose-200 text-rose-700",
    icon: PenTool,
  },
  {
    title: "AI Assistant",
    stat: "0 actions",
    note: "Today",
    color: "from-violet-100 to-violet-50 border-violet-200 text-violet-700",
    icon: Sparkles,
  },
  {
    title: "AI Template Builder",
    stat: "0 templates",
    note: "0 sidebar apps pinned",
    color: "from-pink-100 to-pink-50 border-pink-200 text-pink-700",
    icon: LayoutDashboard,
  },
];

const quickAccess = [
  {
    title: "Create Task",
    note: "Open your Kanban workspace.",
    icon: PlusIcon,
    color: "bg-amber-100 border-amber-200 text-amber-700",
  },
  {
    title: "Add Calendar Reminder",
    note: "Schedule a task or reminder.",
    icon: CalendarDays,
    color: "bg-emerald-100 border-emerald-200 text-emerald-700",
  },
  {
    title: "Create Note",
    note: "Capture a fresh thought.",
    icon: MessageSquareMore,
    color: "bg-sky-100 border-sky-200 text-sky-700",
  },
  {
    title: "Open Whiteboard",
    note: "Sketch ideas visually.",
    icon: PenTool,
    color: "bg-rose-100 border-rose-200 text-rose-700",
  },
  {
    title: "Ask AI Assistant",
    note: "Plan or act across the app.",
    icon: Sparkles,
    color: "bg-violet-100 border-violet-200 text-violet-700",
  },
  {
    title: "Generate AI Template",
    note: "Build a mini productivity app.",
    icon: Wand2,
    color: "bg-pink-100 border-pink-200 text-pink-700",
  },
];

const taskSummary = [
  { label: "Total", value: "0", color: "bg-sky-100" },
  { label: "Completed", value: "0", color: "bg-emerald-100" },
  { label: "Pending", value: "0", color: "bg-amber-100" },
  { label: "Overdue", value: "0", color: "bg-rose-100" },
];

function PlusIcon({ className }: { className?: string }) {
  return <Plus className={className} />;
}

export default function Home() {
  return (
    <SidebarLayout activeLabel="Dashboard">
      <DashboardContent />
    </SidebarLayout>
  );
}

function DashboardContent() {
  const { setIsMobileOpen } = useSidebar();
  const { user } = useUser();

  const displayName = user?.fullName ?? user?.firstName ?? user?.username ?? "there";

  return (
    <div className="flex min-h-screen flex-1 flex-col md:ml-0">
      <header className="border-b border-[#eadfc8] bg-[#fbf7ef]/85 backdrop-blur">
        <div className="flex items-center gap-3 px-4 py-3 md:px-6">
          <button
            type="button"
            onClick={() => setIsMobileOpen((value) => !value)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#eadfc8] bg-white text-slate-700 shadow-sm md:hidden"
            aria-label="Toggle sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>

              <div className="min-w-0">
                <div className="flex items-center gap-2 text-[13px] font-medium text-[#c5664f]">
                  <Circle className="h-2.5 w-2.5 fill-current text-[#c5664f]" />
                  Dashboard
                </div>
                <h1 className="mt-2 text-[46px] font-semibold leading-[1.05] tracking-[-0.04em] text-slate-950 md:text-[56px]">
                  Welcome back, {displayName}.
                </h1>
                <p className="mt-4 max-w-3xl text-[16px] leading-7 text-slate-600 md:text-[17px]">
                  Your workspace is awake: tasks, calendar, pages, and AI work are gathered here for a clear start.
                </p>

                <div className="mt-8 flex flex-wrap gap-3">
                  <button className="inline-flex items-center gap-2 rounded-xl bg-[#f15f49] px-5 py-3 text-[16px] font-semibold text-white shadow-sm shadow-orange-200 transition hover:brightness-95">
                    <ArrowRight className="h-5 w-5" />
                    New task
                  </button>
                  <button className="inline-flex items-center gap-2 rounded-xl border border-[#eadfc8] bg-white px-5 py-3 text-[16px] font-semibold text-slate-900 shadow-sm transition hover:bg-slate-50">
                    <CalendarDays className="h-5 w-5 text-emerald-600" />
                    Calendar
                  </button>
                </div>
              </div>

              <div className="hidden xl:block xl:w-[420px]">
                <div className="grid grid-cols-3 gap-2 rounded-2xl border border-white/70 bg-white/65 p-2 shadow-sm backdrop-blur">
                  {[
                    { label: "TASKS", value: "0" },
                    { label: "COMPLETE", value: "0%" },
                    { label: "UPCOMING", value: "0" },
                  ].map((item) => (
                    <div key={item.label} className="rounded-xl bg-white p-4">
                      <div className="text-[12px] font-semibold text-slate-400">{item.label}</div>
                      <div className="mt-2 text-[34px] font-semibold tracking-tight text-slate-900">{item.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </header>

          <section className="flex-1 px-4 py-6 md:px-6 md:py-7">
            <div className="space-y-6">
              <section className="relative overflow-hidden rounded-[24px] border border-[#eadfc8] bg-[linear-gradient(90deg,_#fff2ef_0%,_#f0f8ef_44%,_#e7f8fb_100%)] p-6 shadow-sm md:p-8">
                <div className="absolute right-0 top-0 h-28 w-28 rounded-bl-[90px] bg-[#f0e4a7]" />
                <div className="absolute bottom-0 right-[12%] h-24 w-24 rounded-t-full bg-[#fadbe2]" />

                <div className="grid gap-5 xl:grid-cols-[1fr_520px] xl:items-end">
                  <div className="max-w-3xl">
                    <div className="inline-flex items-center gap-2 text-[16px] font-semibold text-[#ba4c3d]">
                      <Sparkles className="h-4 w-4" />
                      Dashboard
                    </div>
                    <h2 className="mt-4 text-[24px] font-semibold tracking-tight text-slate-950 md:text-[29px]">
                      A calm launchpad for your day.
                    </h2>
                    <p className="mt-4 max-w-2xl text-[15px] leading-7 text-slate-600 md:text-[16px]">
                      Notion-style planning on the left, Miro-like exploration in the center, and the essentials surfaced with a lighter, fresher palette.
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-3 rounded-2xl border border-white/60 bg-white/55 p-3 backdrop-blur">
                    {[
                      { label: "TASKS", value: "0" },
                      { label: "COMPLETE", value: "0%" },
                      { label: "UPCOMING", value: "0" },
                    ].map((item) => (
                      <div key={item.label} className="rounded-xl bg-white/90 p-4 shadow-sm">
                        <div className="text-[12px] font-semibold text-slate-400">{item.label}</div>
                        <div className="mt-2 text-[30px] font-semibold tracking-tight text-slate-900">{item.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
                {quickCards.map((card) => {
                  const Icon = card.icon;
                  return (
                    <article
                      key={card.title}
                      className={cn(
                        "rounded-[18px] border bg-gradient-to-br p-4 shadow-sm",
                        card.color
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/75 shadow-sm">
                          <Icon className="h-5 w-5" />
                        </div>
                        <span className="rounded-full bg-white/75 px-3 py-1 text-[12px] font-semibold text-slate-500">Ready</span>
                      </div>
                      <div className="mt-5 text-[16px] font-medium text-slate-900">{card.title}</div>
                      <div className="mt-2 text-[28px] font-semibold tracking-tight text-slate-950 leading-[1.05]">{card.stat}</div>
                      <div className="mt-2 text-[13px] text-slate-600">{card.note}</div>
                    </article>
                  );
                })}
              </section>

              <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#eadfc8] bg-white shadow-sm">
                      <ArrowRight className="h-5 w-5 text-[#f15f49]" />
                    </div>
                    <h3 className="text-[20px] font-semibold tracking-tight text-slate-950">Quick access</h3>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {quickAccess.map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.title}
                          className={cn(
                            "rounded-[18px] border p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md",
                            item.color
                          )}
                        >
                          <div className="flex items-start gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/85 shadow-sm">
                              <Icon className="h-5 w-5" />
                            </div>
                            <div className="min-w-0">
                              <div className="text-[16px] font-semibold text-slate-900">{item.title}</div>
                              <div className="mt-1 text-[13px] leading-6 text-slate-600">{item.note}</div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <aside className="rounded-[22px] border border-[#eadfc8] bg-white p-5 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#eadfc8] bg-[#fff8f1]">
                      <TimerReset className="h-5 w-5 text-[#f15f49]" />
                    </div>
                    <h3 className="text-[20px] font-semibold tracking-tight text-slate-950">Task summary</h3>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    {taskSummary.map((item) => (
                      <div key={item.label} className={cn("rounded-[18px] p-4", item.color)}>
                        <div className="text-[13px] text-slate-600">{item.label}</div>
                        <div className="mt-4 text-[34px] font-semibold tracking-tight text-slate-950 leading-none">
                          {item.value}
                        </div>
                      </div>
                    ))}
                  </div>
                </aside>
              </section>
            </div>
          </section>
        </div>
  );
}
