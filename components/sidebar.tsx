"use client";

import React, { createContext, useContext, useState, type ComponentType } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeftToLine,
  ArrowRightToLine,
  BookOpenText,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  Circle,
  Columns3,
  HomeIcon,
  LifeBuoy,
  PenTool,
  Search,
  Settings2,
  Sparkles,
  StickyNote,
  Wand2,
  SquareKanban,
} from "lucide-react";

import { cn } from "@/lib/utils";

type NavItem = {
  label: string;
  icon: ComponentType<{ className?: string }>;
  color: string;
  href: string;
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

const navGroups: NavGroup[] = [
  {
    label: "HOME",
    items: [
      { label: "Dashboard", icon: HomeIcon, color: "text-orange-500", href: "/" },
      { label: "AI Assistant", icon: Sparkles, color: "text-violet-500", href: "#" },
    ],
  },
  {
    label: "WORKSPACE",
    items: [
      { label: "Calendar", icon: CalendarDays, color: "text-emerald-600", href: "/calendar" },
      { label: "Task / Kanban", icon: SquareKanban, color: "text-amber-600", href: "#" },
      { label: "Notes", icon: StickyNote, color: "text-sky-600", href: "#" },
      { label: "Whiteboard", icon: PenTool, color: "text-rose-500", href: "#" },
      { label: "Pages / Spaces", icon: BookOpenText, color: "text-indigo-500", href: "#" },
    ],
  },
  {
    label: "BUILD",
    items: [
      { label: "AI Template Builder", icon: Wand2, color: "text-pink-500", href: "#" },
      { label: "Settings", icon: Settings2, color: "text-slate-500", href: "#" },
    ],
  },
];

const SidebarContext = createContext<{
  isCollapsed: boolean;
  setIsCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  isMobileOpen: boolean;
  setIsMobileOpen: React.Dispatch<React.SetStateAction<boolean>>;
} | null>(null);

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within SidebarProvider");
  }
  return context;
}

function BrandMark() {
  return (
    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f15f49] text-white shadow-sm shadow-orange-200">
      <Columns3 className="h-5 w-5" />
    </div>
  );
}

export function Sidebar({ activeLabel }: { activeLabel: string }) {
  const { isCollapsed, setIsCollapsed, isMobileOpen, setIsMobileOpen } = useSidebar();

  return (
    <>
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex h-screen flex-col border-r border-[#eadfc8] bg-[#fbf7ef] transition-all duration-300 ease-out md:static md:translate-x-0 shrink-0",
          isCollapsed ? "w-[86px]" : "w-[292px]",
          isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className={cn("flex items-start gap-3 px-4 pt-4", isCollapsed && "justify-center px-3")}>
          <BrandMark />
          {!isCollapsed && (
            <div className="min-w-0 pt-0.5">
              <div className="text-[18px] font-semibold leading-tight text-slate-950">Flowbase</div>
              <div className="text-[13px] text-slate-500">Cozy workspace</div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 px-4 pt-4">
          <button
            type="button"
            onClick={() => setIsCollapsed((value) => !value)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#eadfc8] bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 cursor-pointer"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? <ArrowRightToLine className="h-4 w-4" /> : <ArrowLeftToLine className="h-4 w-4" />}
          </button>

          {!isCollapsed && (
            <label className="flex h-9 flex-1 items-center gap-2 rounded-xl border border-[#eadfc8] bg-white px-3 text-slate-500 shadow-sm">
              <Search className="h-4 w-4" />
              <span className="text-[13px]">Search everything</span>
            </label>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-3 pb-4 pt-4">
          <div className="space-y-4">
            {navGroups.map((group) => (
              <section key={group.label} className="space-y-2">
                {!isCollapsed && (
                  <div className="px-3 text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400">
                    {group.label}
                  </div>
                )}
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = item.label === activeLabel;
                    return (
                      <Link
                        key={item.label}
                        href={item.href}
                        onClick={() => setIsMobileOpen(false)}
                        className={cn(
                          "group flex h-9 w-full items-center rounded-xl border px-2.5 text-[12.5px] font-medium transition cursor-pointer",
                          isActive
                            ? "border-[#f6c8b8] bg-[#fff1eb] text-[#f15f49]"
                            : "border-transparent text-slate-600 hover:border-[#eadfc8] hover:bg-white hover:text-slate-900",
                          isCollapsed ? "justify-center px-0" : "gap-2.5"
                        )}
                      >
                        <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-[#f15f49]" : item.color)} />
                        {!isCollapsed && <span className="truncate">{item.label}</span>}
                        {!isCollapsed && !isActive && <ChevronRight className="ml-auto h-3.5 w-3.5 text-slate-300" />}
                      </Link>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </div>

        <div className="border-t border-[#eadfc8] p-3">
          {!isCollapsed ? (
            <div className="rounded-2xl border border-[#eadfc8] bg-white p-3 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#eaf2ea] text-[#64806b]">
                    <Circle className="h-3.5 w-3.5 fill-current" />
                  </div>
                  <div>
                    <div className="text-[13px] font-semibold text-slate-950">Studio space</div>
                    <div className="text-[11px] text-slate-500">5 collaborators</div>
                  </div>
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 py-1">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-slate-500 shadow-sm">
                <LifeBuoy className="h-4 w-4" />
              </div>
              <div className="h-2 w-2 rounded-full bg-emerald-500" />
            </div>
          )}
        </div>
      </aside>

      {isMobileOpen && (
        <button
          type="button"
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 z-30 bg-slate-950/25 md:hidden cursor-pointer"
          aria-label="Close sidebar overlay"
        />
      )}
    </>
  );
}

export function SidebarLayout({
  activeLabel,
  children,
}: {
  activeLabel: string;
  children: React.ReactNode;
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <SidebarContext.Provider value={{ isCollapsed, setIsCollapsed, isMobileOpen, setIsMobileOpen }}>
      <div className="min-h-screen bg-[#f6f1e6] text-slate-900 flex">
        <Sidebar activeLabel={activeLabel} />
        <div className="flex flex-col flex-1 min-w-0 min-h-screen">
          {children}
        </div>
      </div>
    </SidebarContext.Provider>
  );
}
