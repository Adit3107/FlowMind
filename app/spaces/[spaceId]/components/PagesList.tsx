"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  FileText,
  MoreHorizontal,
  Star,
  Clock,
  Copy,
  Archive,
  Trash2,
  Download,
  Check,
  X,
  ChevronLeft,
  Edit2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { Page } from "@/db/schema";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface PagesListProps {
  pages: Page[];
  spaceName: string;
  viewMode: "list" | "grid";
  onRefresh: () => void;
}

export function PagesList({ pages, spaceName, viewMode, onRefresh }: PagesListProps) {
  const router = useRouter();

  if (pages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-500">
        <div className="h-16 w-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
          <FileText className="h-8 w-8 text-slate-300" />
        </div>
        <p className="text-[15px] font-semibold text-slate-700">No pages yet</p>
        <p className="text-[13px] text-slate-400 mt-1">Create your first page to get started.</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {viewMode === "list" ? (
        <div className="bg-white rounded-2xl border border-[#eadfc8] shadow-sm overflow-visible">
          {/* Table header */}
          <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-[#eadfc8] bg-[#fbf7ef] text-[11px] font-bold text-slate-500 uppercase tracking-wider rounded-t-2xl">
            <div className="col-span-6">Page Name</div>
            <div className="col-span-3">Type</div>
            <div className="col-span-3">Updated</div>
          </div>

          <div className="divide-y divide-slate-100">
            {pages.map((page) => (
              <PageListRow
                key={page.id}
                page={page}
                spaceName={spaceName}
                onRefresh={onRefresh}
                onClick={() => router.push(`/spaces/${page.spaceId}/pages/${page.id}`)}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {pages.map((page) => (
            <PageGridCard
              key={page.id}
              page={page}
              spaceName={spaceName}
              onRefresh={onRefresh}
              onClick={() => router.push(`/spaces/${page.spaceId}/pages/${page.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Shared dropdown hook ─────────────────────────────────────────────────────

function usePageMenu(page: Page, onRefresh: () => void) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<"main" | "rename">("main");
  const [renameValue, setRenameValue] = useState(page.title);
  const [isUpdating, setIsUpdating] = useState(false);

  // Reset on close
  useEffect(() => {
    if (!menuOpen) {
      setView("main");
      setRenameValue(page.title);
    }
  }, [menuOpen, page.title]);

  const openMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setMenuPos({
        top: rect.bottom + window.scrollY + 6,
        left: Math.max(8, rect.right + window.scrollX - 256),
      });
    }
    setMenuOpen((v) => !v);
  };

  // Close on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handle = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [menuOpen]);

  const withUpdate = async (fn: () => Promise<void>) => {
    if (isUpdating) return;
    setIsUpdating(true);
    try {
      await fn();
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    withUpdate(async () => {
      const { updatePage } = await import("@/app/spaces/actions");
      await updatePage(page.id, page.spaceId, { isFavorite: !page.isFavorite });
    });
  };

  const handleRename = () => {
    if (!renameValue.trim() || renameValue === page.title) {
      setMenuOpen(false);
      return;
    }
    withUpdate(async () => {
      const { updatePage } = await import("@/app/spaces/actions");
      await updatePage(page.id, page.spaceId, { title: renameValue.trim() });
    });
    setMenuOpen(false);
  };

  const handleArchive = () => {
    withUpdate(async () => {
      const { updatePage } = await import("@/app/spaces/actions");
      await updatePage(page.id, page.spaceId, { isArchived: !page.isArchived });
    });
    setMenuOpen(false);
  };

  const handleDuplicate = () => {
    withUpdate(async () => {
      const { createPage } = await import("@/app/spaces/actions");
      await createPage({
        spaceId: page.spaceId,
        userId: page.userId,
        title: `${page.title} (Copy)`,
        type: page.type,
        content: page.content,
        isFavorite: false,
        isArchived: false,
      });
    });
    setMenuOpen(false);
  };

  const handleExportTxt = () => {
    const blob = new Blob(
      [`${page.title}\n${"=".repeat(page.title.length)}\n\n${page.content ?? ""}`],
      { type: "text/plain" }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${page.title.replace(/\s+/g, "_")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    setMenuOpen(false);
  };

  const handleDelete = () => {
    if (!confirm(`Delete "${page.title}"? This cannot be undone.`)) return;
    withUpdate(async () => {
      const { deletePage } = await import("@/app/spaces/actions");
      await deletePage(page.id, page.spaceId);
    });
    setMenuOpen(false);
  };

  return {
    menuOpen,
    menuPos,
    menuRef,
    triggerRef,
    view,
    setView,
    renameValue,
    setRenameValue,
    isUpdating,
    openMenu,
    handleToggleFavorite,
    handleRename,
    handleArchive,
    handleDuplicate,
    handleExportTxt,
    handleDelete,
  };
}

// ─── Dropdown portal ──────────────────────────────────────────────────────────

function PageDropdown({
  page,
  menuRef,
  menuPos,
  view,
  setView,
  renameValue,
  setRenameValue,
  handleRename,
  handleArchive,
  handleDuplicate,
  handleExportTxt,
  handleDelete,
}: {
  page: Page;
  menuRef: React.RefObject<HTMLDivElement | null>;
  menuPos: { top: number; left: number };
  view: "main" | "rename";
  setView: (v: "main" | "rename") => void;
  renameValue: string;
  setRenameValue: (v: string) => void;
  handleRename: () => void;
  handleArchive: () => void;
  handleDuplicate: () => void;
  handleExportTxt: () => void;
  handleDelete: () => void;
}) {
  return (
    <div
      ref={menuRef}
      style={{ top: menuPos.top, left: menuPos.left }}
      className="fixed z-[9999] w-64 rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/10 overflow-hidden animate-in fade-in zoom-in-95 duration-100"
      onClick={(e) => e.stopPropagation()}
    >
      {/* ── MAIN view ── */}
      {view === "main" && (
        <div className="py-1.5">
          <div className="px-1.5 py-0.5">
            <DdItem icon={<Edit2 className="h-3.5 w-3.5" />} onClick={() => setView("rename")}>
              Rename page
            </DdItem>
            <DdItem icon={<Copy className="h-3.5 w-3.5" />} onClick={handleDuplicate}>
              Duplicate page
            </DdItem>
          </div>
          <div className="my-1 mx-3 border-t border-slate-100" />
          <div className="px-1.5 py-0.5">
            <DdItem icon={<Download className="h-3.5 w-3.5" />} onClick={handleExportTxt}>
              Export as TXT
            </DdItem>
            <DdItem icon={<Archive className="h-3.5 w-3.5" />} onClick={handleArchive}>
              {page.isArchived ? "Unarchive page" : "Archive page"}
            </DdItem>
          </div>
          <div className="my-1 mx-3 border-t border-slate-100" />
          <div className="px-1.5 py-0.5">
            <DdItem icon={<Trash2 className="h-3.5 w-3.5" />} onClick={handleDelete} danger>
              Delete page
            </DdItem>
          </div>
        </div>
      )}

      {/* ── RENAME view ── */}
      {view === "rename" && (
        <div className="p-4">
          <button
            onClick={() => setView("main")}
            className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 hover:text-slate-600 mb-3 uppercase tracking-wider transition-colors"
          >
            <ChevronLeft className="h-3 w-3" /> Back
          </button>
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
            Rename Page
          </div>
          <input
            type="text"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleRename();
              if (e.key === "Escape") setView("main");
            }}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[13px] font-medium text-slate-900 focus:outline-none focus:border-indigo-400 focus:bg-white transition mb-3"
            autoFocus
          />
          <div className="flex items-center gap-2">
            <button
              onClick={() => setView("main")}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 text-[12px] font-semibold hover:bg-slate-50 transition"
            >
              <X className="h-3.5 w-3.5" /> Cancel
            </button>
            <button
              onClick={handleRename}
              disabled={!renameValue.trim()}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 text-white text-[12px] font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
            >
              <Check className="h-3.5 w-3.5" /> Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── LIST ROW ─────────────────────────────────────────────────────────────────

function PageListRow({
  page,
  spaceName,
  onRefresh,
  onClick,
}: {
  page: Page;
  spaceName: string;
  onRefresh: () => void;
  onClick: () => void;
}) {
  const {
    menuOpen,
    menuPos,
    menuRef,
    triggerRef,
    view,
    setView,
    renameValue,
    setRenameValue,
    openMenu,
    handleToggleFavorite,
    handleRename,
    handleArchive,
    handleDuplicate,
    handleExportTxt,
    handleDelete,
  } = usePageMenu(page, onRefresh);

  return (
    <>
      <div
        onClick={onClick}
        className="grid grid-cols-12 gap-4 px-6 py-4 items-center transition-colors cursor-pointer group hover:bg-slate-50"
      >
        {/* Name */}
        <div className="col-span-6 flex items-start gap-3 min-w-0">
          <div
            className="mt-0.5 shrink-0 flex items-center justify-center text-[#8b5cf6]"
          >
            <FileText className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <span className="block font-semibold text-[14px] text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
              {page.title}
            </span>
            <span className="block text-[12px] text-slate-400 mt-0.5">By ZC</span>
          </div>
          {page.isArchived && (
            <span className="shrink-0 px-1.5 py-0.5 rounded-full bg-slate-100 text-[10px] font-bold text-slate-400 uppercase">
              Archived
            </span>
          )}
        </div>

        {/* Type */}
        <div className="col-span-3">
          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[11px] font-semibold">
            {page.type}
          </span>
        </div>

        {/* Updated + actions */}
        <div className="col-span-3 flex items-center justify-between text-[13px] text-slate-500">
          <span className="text-[12px]">{formatDistanceToNow(new Date(page.updatedAt))} ago</span>
          <div
            className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={handleToggleFavorite}
              className="p-1.5 hover:bg-slate-200 rounded-lg transition"
              title={page.isFavorite ? "Remove from favorites" : "Add to favorites"}
            >
              <Star
                className={cn(
                  "h-4 w-4 transition-colors",
                  page.isFavorite ? "fill-amber-400 text-amber-400" : "text-slate-300 hover:text-amber-400"
                )}
              />
            </button>
            <button
              ref={triggerRef}
              onClick={openMenu}
              className={cn(
                "p-1.5 rounded-lg transition-colors",
                menuOpen ? "bg-slate-200 text-slate-700" : "text-slate-400 hover:bg-slate-200"
              )}
              title="More options"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {menuOpen && (
        <PageDropdown
          page={page}
          menuRef={menuRef}
          menuPos={menuPos}
          view={view}
          setView={setView}
          renameValue={renameValue}
          setRenameValue={setRenameValue}
          handleRename={handleRename}
          handleArchive={handleArchive}
          handleDuplicate={handleDuplicate}
          handleExportTxt={handleExportTxt}
          handleDelete={handleDelete}
        />
      )}
    </>
  );
}

// ─── GRID CARD ────────────────────────────────────────────────────────────────

function PageGridCard({
  page,
  spaceName,
  onRefresh,
  onClick,
}: {
  page: Page;
  spaceName: string;
  onRefresh: () => void;
  onClick: () => void;
}) {
  const {
    menuOpen,
    menuPos,
    menuRef,
    triggerRef,
    view,
    setView,
    renameValue,
    setRenameValue,
    openMenu,
    handleToggleFavorite,
    handleRename,
    handleArchive,
    handleDuplicate,
    handleExportTxt,
    handleDelete,
  } = usePageMenu(page, onRefresh);

  return (
    <>
      <div
        onClick={onClick}
        className="relative flex flex-col h-44 rounded-2xl border border-[#eadfc8] bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md hover:border-indigo-200 cursor-pointer group"
      >
        {/* Top row */}
        <div className="flex items-start justify-between mb-auto">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition">
            <FileText className="h-5 w-5" />
          </div>
          <div
            className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={handleToggleFavorite}
              className="p-1.5 rounded-lg hover:bg-slate-100 transition"
              title={page.isFavorite ? "Remove from favorites" : "Add to favorites"}
            >
              <Star
                className={cn(
                  "h-4 w-4",
                  page.isFavorite ? "fill-amber-400 text-amber-400" : "text-slate-300 hover:text-amber-400"
                )}
              />
            </button>
            <button
              ref={triggerRef}
              onClick={openMenu}
              className={cn(
                "p-1.5 rounded-lg transition-colors",
                menuOpen ? "bg-slate-200 text-slate-700" : "text-slate-400 hover:bg-slate-100"
              )}
              title="More options"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Bottom info */}
        <div className="mt-auto">
          <h3 className="font-semibold text-[15px] text-slate-900 line-clamp-1 group-hover:text-indigo-600 transition-colors">
            {page.title}
          </h3>
          <div className="flex items-center gap-2 mt-2 text-[12px] text-slate-500 flex-wrap">
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-semibold text-[11px]">
              {page.type}
            </span>
            {page.isArchived && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500 font-semibold text-[11px]">
                Archived
              </span>
            )}
            <span className="flex items-center gap-1 text-slate-400">
              <Clock className="h-3 w-3" />
              {formatDistanceToNow(new Date(page.updatedAt))} ago
            </span>
          </div>
        </div>
      </div>

      {menuOpen && (
        <PageDropdown
          page={page}
          menuRef={menuRef}
          menuPos={menuPos}
          view={view}
          setView={setView}
          renameValue={renameValue}
          setRenameValue={setRenameValue}
          handleRename={handleRename}
          handleArchive={handleArchive}
          handleDuplicate={handleDuplicate}
          handleExportTxt={handleExportTxt}
          handleDelete={handleDelete}
        />
      )}
    </>
  );
}

// ─── Dropdown item ────────────────────────────────────────────────────────────

function DdItem({
  icon,
  children,
  onClick,
  danger,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
  onClick?: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] font-medium transition-colors cursor-pointer text-left",
        danger ? "text-rose-600 hover:bg-rose-50" : "text-slate-700 hover:bg-slate-50"
      )}
    >
      <span className={danger ? "text-rose-500" : "text-slate-400"}>{icon}</span>
      {children}
    </button>
  );
}
