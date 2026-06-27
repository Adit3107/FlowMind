"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import {
  Folder,
  MoreHorizontal,
  Star,
  FileText,
  Edit2,
  Palette,
  Plus,
  Users,
  Copy,
  Archive,
  Trash2,
  Check,
  X,
  Send,
  ChevronLeft,
  Download,
} from "lucide-react";
import Link from "next/link";
import type { Space } from "@/db/schema";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface SpacesGridProps {
  spaces: Space[];
  onRefresh: () => void;
}

export function SpacesGrid({ spaces, onRefresh }: SpacesGridProps) {
  if (spaces.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-500">
        <div className="h-16 w-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
          <Folder className="h-8 w-8 text-slate-300" />
        </div>
        <p className="text-[15px] font-semibold text-slate-700">No spaces yet</p>
        <p className="text-[13px] text-slate-400 mt-1">Create your first space to get started.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      {spaces.map((space) => (
        <SpaceCard key={space.id} space={space} onRefresh={onRefresh} />
      ))}
    </div>
  );
}

// ─── Color palette ────────────────────────────────────────────────────────────
const COLORS = [
  "#a855f7",
  "#0ea5e9",
  "#10b981",
  "#f59e0b",
  "#f15f49",
  "#ec4899",
];

// ─── SpaceCard ────────────────────────────────────────────────────────────────
function SpaceCard({
  space,
  onRefresh,
}: {
  space: Space;
  onRefresh: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const [isUpdating, setIsUpdating] = useState(false);

  // Sub-views inside dropdown
  const [view, setView] = useState<"main" | "invite" | "rename" | "color">(
    "main"
  );
  const [inviteEmail, setInviteEmail] = useState("");
  const [renameValue, setRenameValue] = useState(space.name);

  // Reset view when menu closes
  useEffect(() => {
    if (!menuOpen) {
      setView("main");
      setInviteEmail("");
      setRenameValue(space.name);
    }
  }, [menuOpen, space.name]);

  // Position the fixed dropdown next to the trigger button
  const openMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setMenuPos({
        top: rect.bottom + window.scrollY + 6,
        left: rect.right + window.scrollX - 256, // 256 = dropdown width
      });
    }
    setMenuOpen((v) => !v);
  };

  // Close on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  // ── Handlers ────────────────────────────────────────────────────────────────

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
    withUpdate(async () => {
      const { updateSpace } = await import("../actions");
      await updateSpace(space.id, { isFavorite: !space.isFavorite });
    });
  };

  const handleRename = () => {
    if (!renameValue.trim() || renameValue === space.name) {
      setMenuOpen(false);
      return;
    }
    withUpdate(async () => {
      const { updateSpace } = await import("../actions");
      await updateSpace(space.id, { name: renameValue.trim() });
    });
    setMenuOpen(false);
  };

  const handleColorChange = (color: string) => {
    withUpdate(async () => {
      const { updateSpace } = await import("../actions");
      await updateSpace(space.id, { color });
    });
    setMenuOpen(false);
  };

  const handleDuplicate = () => {
    withUpdate(async () => {
      const { createSpace } = await import("../actions");
      await createSpace({
        userId: space.userId,
        name: `${space.name} (Copy)`,
        description: space.description ?? undefined,
        color: space.color,
        isFavorite: false,
        isArchived: false,
      });
    });
    setMenuOpen(false);
  };

  const handleArchive = () => {
    withUpdate(async () => {
      const { updateSpace } = await import("../actions");
      await updateSpace(space.id, { isArchived: !space.isArchived });
    });
    setMenuOpen(false);
  };

  const handleDelete = () => {
    if (!confirm(`Are you sure you want to delete "${space.name}"? This cannot be undone.`)) return;
    withUpdate(async () => {
      const { deleteSpace } = await import("../actions");
      await deleteSpace(space.id);
    });
    setMenuOpen(false);
  };

  const handleSendInvite = () => {
    if (!inviteEmail.trim()) return;
    alert(`Invite sent to ${inviteEmail} for space "${space.name}"`);
    setMenuOpen(false);
  };

  const handleExport = () => {
    const data = JSON.stringify(
      { id: space.id, name: space.name, description: space.description, color: space.color },
      null,
      2
    );
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${space.name.replace(/\s+/g, "_")}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setMenuOpen(false);
  };

  // ── Derived ─────────────────────────────────────────────────────────────────
  const updatedAgo = formatDistanceToNow(new Date(space.updatedAt), {
    addSuffix: false,
  });

  return (
    <>
      {/* ── Card ── */}
      <div
        className={cn(
          "relative flex flex-col h-[220px] rounded-[18px] border border-[#eadfc8] bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md group",
          menuOpen ? "z-50" : "z-10"
        )}
      >
        {/* Clickable link fills card (below interactive elements) */}
        <Link href={`/spaces/${space.id}`} className="absolute inset-0 z-0 rounded-[18px]" />

        {/* ── Top Row: icon + star + dots ── */}
        <div className="relative z-10 flex items-start justify-between mb-3">
          {/* Folder icon */}
          <div
            className="flex h-11 w-11 items-center justify-center rounded-xl transition-transform group-hover:scale-105"
            style={{ backgroundColor: `${space.color}18`, color: space.color }}
          >
            <Folder className="h-5 w-5" fill="currentColor" fillOpacity={0.25} />
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-0.5">
            <button
              onClick={handleToggleFavorite}
              disabled={isUpdating}
              className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              title={space.isFavorite ? "Remove from favorites" : "Add to favorites"}
            >
              <Star
                className={cn(
                  "h-4 w-4 transition-colors",
                  space.isFavorite
                    ? "fill-amber-400 text-amber-400"
                    : "text-slate-300 hover:text-amber-400"
                )}
              />
            </button>

            <button
              ref={triggerRef}
              onClick={openMenu}
              className={cn(
                "p-1.5 rounded-lg transition-colors",
                menuOpen
                  ? "bg-slate-200 text-slate-700"
                  : "text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              )}
              title="More options"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* ── Space name + description ── */}
        <div className="relative z-10 flex-1 pointer-events-none min-h-0">
          <h3 className="text-[15px] font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1 leading-snug">
            {space.name}
          </h3>
          {space.description && (
            <p className="mt-1 text-[12.5px] text-slate-400 line-clamp-2 leading-relaxed">
              {space.description}
            </p>
          )}
        </div>

        {/* ── Bottom row: avatar + updated ── */}
        <div className="relative z-10 flex items-center justify-between pt-3 mt-3 border-t border-slate-100 pointer-events-none">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-full bg-[#f15f49] flex items-center justify-center text-[9px] font-bold text-white uppercase shrink-0">
              ZC
            </div>
            <span className="text-[11.5px] font-medium text-slate-500">ZC</span>
          </div>
          <div className="text-[11.5px] font-medium text-slate-400 truncate ml-2">
            Updated {updatedAgo} ago
          </div>
        </div>

        {/* Archived badge */}
        {space.isArchived && (
          <div className="absolute top-3 left-3 z-10 px-2 py-0.5 rounded-full bg-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wide">
            Archived
          </div>
        )}
      </div>

      {/* ── Portal Dropdown (fixed so it overlays everything) ── */}
      {menuOpen && (
        <div
          ref={menuRef}
          style={{ top: menuPos.top, left: Math.max(8, menuPos.left) }}
          className="fixed z-[9999] w-64 rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/10 overflow-hidden animate-in fade-in zoom-in-95 duration-100"
          onClick={(e) => e.stopPropagation()}
        >
          {/* ── MAIN view ── */}
          {view === "main" && (
            <div className="py-1.5">
              <MenuSection>
                <MenuItem
                  icon={<Edit2 className="h-3.5 w-3.5" />}
                  onClick={() => { setView("rename"); setRenameValue(space.name); }}
                >
                  Rename space
                </MenuItem>
                <MenuItem
                  icon={<Palette className="h-3.5 w-3.5" />}
                  onClick={() => setView("color")}
                >
                  Change color
                </MenuItem>
              </MenuSection>

              <MenuDivider />

              <MenuSection>
                <MenuItem
                  icon={<Plus className="h-3.5 w-3.5" />}
                  onClick={() => setMenuOpen(false)}
                  href={`/spaces/${space.id}`}
                >
                  Add page
                </MenuItem>
                <MenuItem
                  icon={<Users className="h-3.5 w-3.5" />}
                  onClick={() => setView("invite")}
                >
                  Invite collaborators
                </MenuItem>
                <MenuItem
                  icon={<Copy className="h-3.5 w-3.5" />}
                  onClick={handleDuplicate}
                >
                  Duplicate space
                </MenuItem>
                <MenuItem
                  icon={<Download className="h-3.5 w-3.5" />}
                  onClick={handleExport}
                >
                  Export as JSON
                </MenuItem>
              </MenuSection>

              <MenuDivider />

              <MenuSection>
                <MenuItem
                  icon={<Archive className="h-3.5 w-3.5" />}
                  onClick={handleArchive}
                >
                  {space.isArchived ? "Unarchive space" : "Archive space"}
                </MenuItem>
                <MenuItem
                  icon={<Trash2 className="h-3.5 w-3.5" />}
                  onClick={handleDelete}
                  danger
                >
                  Delete space
                </MenuItem>
              </MenuSection>
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
                Rename Space
              </div>
              <input
                type="text"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleRename();
                  if (e.key === "Escape") setMenuOpen(false);
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

          {/* ── COLOR view ── */}
          {view === "color" && (
            <div className="p-4">
              <button
                onClick={() => setView("main")}
                className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 hover:text-slate-600 mb-3 uppercase tracking-wider transition-colors"
              >
                <ChevronLeft className="h-3 w-3" /> Back
              </button>
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3">
                Choose Color
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => handleColorChange(c)}
                    title={c}
                    className={cn(
                      "h-8 w-8 rounded-full border-2 transition-transform hover:scale-110",
                      space.color === c
                        ? "border-slate-900 scale-110"
                        : "border-white shadow-sm"
                    )}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* ── INVITE view ── */}
          {view === "invite" && (
            <div className="p-4">
              <button
                onClick={() => setView("main")}
                className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 hover:text-slate-600 mb-3 uppercase tracking-wider transition-colors"
              >
                <ChevronLeft className="h-3 w-3" /> Back
              </button>
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                Invite Collaborator
              </div>
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSendInvite();
                  if (e.key === "Escape") setMenuOpen(false);
                }}
                placeholder="name@email.com"
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
                  onClick={handleSendInvite}
                  disabled={!inviteEmail.trim()}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#f15f49] text-white text-[12px] font-semibold hover:bg-[#e0503a] transition disabled:opacity-50"
                >
                  <Send className="h-3.5 w-3.5" /> Send
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}

// ─── Dropdown building blocks ─────────────────────────────────────────────────

function MenuSection({ children }: { children: React.ReactNode }) {
  return <div className="px-1.5 py-0.5">{children}</div>;
}

function MenuDivider() {
  return <div className="my-1 mx-3 border-t border-slate-100" />;
}

function MenuItem({
  icon,
  children,
  onClick,
  danger,
  href,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
  onClick?: () => void;
  danger?: boolean;
  href?: string;
}) {
  const cls = cn(
    "flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] font-medium transition-colors cursor-pointer text-left",
    danger
      ? "text-rose-600 hover:bg-rose-50"
      : "text-slate-700 hover:bg-slate-50"
  );

  if (href) {
    return (
      <Link href={href} className={cls} onClick={onClick}>
        <span className={danger ? "text-rose-500" : "text-slate-400"}>{icon}</span>
        {children}
      </Link>
    );
  }

  return (
    <button className={cls} onClick={onClick}>
      <span className={danger ? "text-rose-500" : "text-slate-400"}>{icon}</span>
      {children}
    </button>
  );
}
