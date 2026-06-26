"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  Plus,
  Pin,
  MoreVertical,
  Trash2,
  FileText,
  Copy,
  Edit2,
  RotateCcw,
  Palette,
  FolderOpen,
  ChevronDown,
  ChevronUp,
  StickyNote,
  Smile,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Note } from "@/db/schema";

const COLOR_PALETTE = [
  { name: "Sage", value: "#10b981" },
  { name: "Ocean", value: "#0284c7" },
  { name: "Amber", value: "#d97706" },
  { name: "Coral", value: "#e11d48" },
  { name: "Lavender", value: "#8b5cf6" },
  { name: "Rose", value: "#ec4899" },
];

const EMOJI_PALETTE = ["📝", "💡", "📅", "🎯", "🌟", "🏠", "💼", "🎨", "✈️", "🎓", "🔑", "❤️"];

interface NotesSidebarProps {
  notesList: Note[];
  activeNoteId: number | null;
  onSelectNote: (id: number) => void;
  onCreateNote: () => void;
  onUpdateNote: (id: number, data: {
    title?: string;
    content?: string;
    color?: string;
    icon?: string;
    isPinned?: boolean;
    isTrashed?: boolean;
  }) => Promise<any>;
  onDuplicateNote: (id: number) => void;
  onDeletePermanently: (id: number) => void;
  onEmptyTrash: () => void;
}

export function NotesSidebar({
  notesList,
  activeNoteId,
  onSelectNote,
  onCreateNote,
  onUpdateNote,
  onDuplicateNote,
  onDeletePermanently,
  onEmptyTrash,
}: NotesSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isTrashOpen, setIsTrashOpen] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [renameTitle, setRenameTitle] = useState("");
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
  const [showColorPaletteId, setShowColorPaletteId] = useState<number | null>(null);
  const [showIconPaletteId, setShowIconPaletteId] = useState<number | null>(null);

  // Click outside dropdown/palettes handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest("[data-dropdown-container]")) {
        setOpenDropdownId(null);
        setShowColorPaletteId(null);
        setShowIconPaletteId(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Group notes into Active and Trashed
  const activeNotes = notesList.filter((note) => !note.isTrashed);
  const trashedNotes = notesList.filter((note) => note.isTrashed);

  // Filter active notes by search query
  const filteredActiveNotes = activeNotes.filter((note) =>
    note.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pinnedNotes = filteredActiveNotes.filter((note) => note.isPinned);
  const unpinnedNotes = filteredActiveNotes.filter((note) => !note.isPinned);

  const activeCount = activeNotes.length;
  const pinnedCount = activeNotes.filter((n) => n.isPinned).length;
  const trashedCount = trashedNotes.length;

  const handleStartRename = (note: Note) => {
    setEditingNoteId(note.id);
    setRenameTitle(note.title);
    setOpenDropdownId(null);
  };

  const handleSaveRename = async (id: number) => {
    if (!renameTitle.trim()) return;
    await onUpdateNote(id, { title: renameTitle });
    setEditingNoteId(null);
  };

  const handleTogglePin = async (note: Note) => {
    await onUpdateNote(note.id, { isPinned: !note.isPinned });
    setOpenDropdownId(null);
  };

  const handleMoveToTrash = async (id: number) => {
    await onUpdateNote(id, { isTrashed: true, isPinned: false });
    setOpenDropdownId(null);
  };

  const handleRestore = async (id: number) => {
    await onUpdateNote(id, { isTrashed: false });
  };

  const handleUpdateColor = async (id: number, hex: string) => {
    await onUpdateNote(id, { color: hex });
    setShowColorPaletteId(null);
    setOpenDropdownId(null);
  };

  const handleUpdateIcon = async (id: number, iconStr: string) => {
    await onUpdateNote(id, { icon: iconStr });
    setShowIconPaletteId(null);
    setOpenDropdownId(null);
  };

  const formatTime = (dateInput: Date | string | null) => {
    if (!dateInput) return "just now";
    const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
    const diff = Date.now() - date.getTime();
    if (diff < 60000) return "just now";
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  };

  return (
    <aside className="border-r border-[#eadfc8] bg-[#fbf7ef] flex flex-col h-full select-none">
      {/* Title Header */}
      <div className="p-5 border-b border-[#eadfc8] flex items-center justify-between">
        <div className="text-left">
          <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400">
            Library
          </div>
          <h2 className="text-[20px] font-bold text-slate-950 mt-1">Notes desk</h2>
          <div className="flex items-center gap-2 mt-1 text-[11px] font-semibold text-slate-500">
            <span>{activeCount} active</span>
            <span>•</span>
            <span>{pinnedCount} pinned</span>
            <span>•</span>
            <span>{trashedCount} trashed</span>
          </div>
        </div>
        <button
          onClick={onCreateNote}
          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-[#f15f49] hover:brightness-98 text-white px-3.5 text-[13px] font-bold shadow-xs cursor-pointer transition shrink-0"
        >
          <Plus className="h-4 w-4" />
          New
        </button>
      </div>

      {/* Search Input */}
      <div className="px-4 py-3 border-b border-[#eadfc8]/50">
        <div className="relative flex items-center bg-white rounded-xl border border-[#eadfc8] px-3 shadow-inner">
          <Search className="h-4 w-4 text-slate-400 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes"
            className="w-full bg-transparent px-2.5 py-2 text-[13px] font-medium placeholder-slate-400 text-slate-800 focus:outline-none"
          />
        </div>
      </div>

      {/* Note List Scrollable Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4 max-h-[calc(100vh-270px)] scrollbar-thin">
        {/* Pinned Section */}
        {pinnedNotes.length > 0 && (
          <div className="space-y-1">
            <div className="px-2 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400 flex items-center gap-1">
              <Pin className="h-3 w-3 text-slate-400" />
              Pinned
            </div>
            {pinnedNotes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                active={activeNoteId === note.id}
                editing={editingNoteId === note.id}
                renameTitle={renameTitle}
                setRenameTitle={setRenameTitle}
                openDropdown={openDropdownId === note.id}
                showColorPalette={showColorPaletteId === note.id}
                showIconPalette={showIconPaletteId === note.id}
                onSelect={() => onSelectNote(note.id)}
                onStartRename={() => handleStartRename(note)}
                onSaveRename={() => handleSaveRename(note.id)}
                onCancelRename={() => setEditingNoteId(null)}
                onTogglePin={() => handleTogglePin(note)}
                onDuplicate={() => onDuplicateNote(note.id)}
                onMoveToTrash={() => handleMoveToTrash(note.id)}
                onToggleDropdown={() => setOpenDropdownId(openDropdownId === note.id ? null : note.id)}
                onToggleColorPalette={() => {
                  setShowColorPaletteId(showColorPaletteId === note.id ? null : note.id);
                  setShowIconPaletteId(null);
                }}
                onToggleIconPalette={() => {
                  setShowIconPaletteId(showIconPaletteId === note.id ? null : note.id);
                  setShowColorPaletteId(null);
                }}
                onSelectColor={(hex) => handleUpdateColor(note.id, hex)}
                onSelectIcon={(icon) => handleUpdateIcon(note.id, icon)}
                formatTime={formatTime}
              />
            ))}
          </div>
        )}

        {/* Regular Section */}
        <div className="space-y-1">
          {pinnedNotes.length > 0 && unpinnedNotes.length > 0 && (
            <div className="px-2 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
              Active Notes
            </div>
          )}
          {filteredActiveNotes.length === 0 ? (
            <div className="text-center py-8 px-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white border border-[#eadfc8] text-slate-400 mx-auto shadow-xs">
                <StickyNote className="h-5 w-5 text-[#eadfc8]" />
              </div>
              <h4 className="mt-3 text-[12.5px] font-semibold text-slate-800">No notes found</h4>
              <p className="mt-1 text-[11px] text-slate-500 max-w-[200px] mx-auto leading-relaxed">
                Create a new note or change your search query.
              </p>
            </div>
          ) : (
            unpinnedNotes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                active={activeNoteId === note.id}
                editing={editingNoteId === note.id}
                renameTitle={renameTitle}
                setRenameTitle={setRenameTitle}
                openDropdown={openDropdownId === note.id}
                showColorPalette={showColorPaletteId === note.id}
                showIconPalette={showIconPaletteId === note.id}
                onSelect={() => onSelectNote(note.id)}
                onStartRename={() => handleStartRename(note)}
                onSaveRename={() => handleSaveRename(note.id)}
                onCancelRename={() => setEditingNoteId(null)}
                onTogglePin={() => handleTogglePin(note)}
                onDuplicate={() => onDuplicateNote(note.id)}
                onMoveToTrash={() => handleMoveToTrash(note.id)}
                onToggleDropdown={() => setOpenDropdownId(openDropdownId === note.id ? null : note.id)}
                onToggleColorPalette={() => {
                  setShowColorPaletteId(showColorPaletteId === note.id ? null : note.id);
                  setShowIconPaletteId(null);
                }}
                onToggleIconPalette={() => {
                  setShowIconPaletteId(showIconPaletteId === note.id ? null : note.id);
                  setShowColorPaletteId(null);
                }}
                onSelectColor={(hex) => handleUpdateColor(note.id, hex)}
                onSelectIcon={(icon) => handleUpdateIcon(note.id, icon)}
                formatTime={formatTime}
              />
            ))
          )}
        </div>
      </div>

      {/* Trash Panel Accordion */}
      <div className="border-t border-[#eadfc8]/60 bg-slate-50/50">
        <button
          onClick={() => setIsTrashOpen(!isTrashOpen)}
          className="w-full flex items-center justify-between px-5 py-3 hover:bg-slate-50 transition cursor-pointer text-left"
        >
          <div className="flex items-center gap-2">
            <Trash2 className="h-4 w-4 text-slate-500" />
            <span className="text-[13px] font-semibold text-slate-700">Trash bin</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11.5px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-600">
              {trashedCount}
            </span>
            {isTrashOpen ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
          </div>
        </button>

        {isTrashOpen && (
          <div className="p-3 border-t border-[#eadfc8]/30 max-h-[220px] overflow-y-auto bg-[#faf8f5]/60 text-left space-y-1.5 scrollbar-thin">
            {trashedCount > 0 && (
              <div className="flex items-center justify-between px-2 pb-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Trashed note list</span>
                <button
                  onClick={onEmptyTrash}
                  className="text-[11px] font-bold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer"
                >
                  Empty Trash
                </button>
              </div>
            )}

            {trashedNotes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 px-4 text-center">
                <FolderOpen className="h-5 w-5 text-slate-300" />
                <p className="mt-1 text-[11px] text-slate-400 font-medium">Trash is empty</p>
              </div>
            ) : (
              trashedNotes.map((note) => (
                <div
                  key={note.id}
                  className="flex items-center justify-between gap-2 p-2 rounded-xl bg-white border border-slate-200/80 hover:border-slate-300 shadow-xs"
                >
                  <div className="min-w-0 flex-1 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-slate-400 shrink-0" />
                    <span className="text-[12.5px] font-semibold text-slate-700 truncate">
                      {note.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleRestore(note.id)}
                      title="Restore Note"
                      className="p-1 hover:bg-slate-100 rounded-lg text-emerald-600 hover:text-emerald-700 transition cursor-pointer"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => onDeletePermanently(note.id)}
                      title="Delete permanently"
                      className="p-1 hover:bg-slate-100 rounded-lg text-rose-600 hover:text-rose-700 transition cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </aside>
  );
}

// Inner helper component for Note cards
interface NoteCardProps {
  note: Note;
  active: boolean;
  editing: boolean;
  renameTitle: string;
  setRenameTitle: (val: string) => void;
  openDropdown: boolean;
  showColorPalette: boolean;
  showIconPalette: boolean;
  onSelect: () => void;
  onStartRename: () => void;
  onSaveRename: () => void;
  onCancelRename: () => void;
  onTogglePin: () => void;
  onDuplicate: () => void;
  onMoveToTrash: () => void;
  onToggleDropdown: () => void;
  onToggleColorPalette: () => void;
  onToggleIconPalette: () => void;
  onSelectColor: (hex: string) => void;
  onSelectIcon: (icon: string) => void;
  formatTime: (date: Date | string | null) => string;
}

function NoteCard({
  note,
  active,
  editing,
  renameTitle,
  setRenameTitle,
  openDropdown,
  showColorPalette,
  showIconPalette,
  onSelect,
  onStartRename,
  onSaveRename,
  onCancelRename,
  onTogglePin,
  onDuplicate,
  onMoveToTrash,
  onToggleDropdown,
  onToggleColorPalette,
  onToggleIconPalette,
  onSelectColor,
  onSelectIcon,
  formatTime,
}: NoteCardProps) {
  return (
    <div
      onClick={editing ? undefined : onSelect}
      className={cn(
        "group relative flex items-stretch rounded-xl border p-2.5 text-left transition select-none cursor-pointer border-l-[4px]",
        active
          ? "border-[#f6c8b8] bg-[#fff1eb]/60 text-slate-900 shadow-xs"
          : "border-slate-200/80 bg-white text-slate-800 hover:border-slate-300 hover:shadow-xs"
      )}
      style={{ borderLeftColor: note.color }}
    >
      <div className="flex-1 min-w-0 pr-6 flex items-start gap-2.5">
        {/* Note Icon */}
        <div className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-500 shrink-0 text-[14px]">
          {note.icon === "FileText" ? (
            <FileText className="h-4 w-4" />
          ) : (
            <span>{note.icon}</span>
          )}
        </div>

        {/* Note Details */}
        <div className="min-w-0 flex-1 text-left">
          {editing ? (
            <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
              <input
                type="text"
                value={renameTitle}
                onChange={(e) => setRenameTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") onSaveRename();
                  if (e.key === "Escape") onCancelRename();
                }}
                className="w-full rounded border border-[#eadfc8] px-2 py-0.5 text-[12.5px] font-semibold text-slate-800 focus:outline-none"
                autoFocus
              />
              <button
                onClick={onSaveRename}
                className="text-[11.5px] font-bold text-emerald-600 hover:underline shrink-0"
              >
                Save
              </button>
            </div>
          ) : (
            <div className="text-[13.5px] font-bold text-slate-900 truncate">
              {note.title || "Untitled"}
            </div>
          )}

          <div className="flex items-center gap-2 mt-1 text-[11px] font-medium text-slate-400">
            <span
              className="inline-block h-1.5 w-1.5 rounded-full shrink-0"
              style={{ backgroundColor: note.color }}
            />
            <span className="truncate">{formatTime(note.updatedAt)}</span>
          </div>
        </div>
      </div>

      {/* Floating pin indicator if pinned */}
      {note.isPinned && !editing && (
        <span className="absolute top-2.5 right-8 text-slate-400">
          <Pin className="h-3.5 w-3.5 fill-current" />
        </span>
      )}

      {/* Actions Trigger Dropdown Menu */}
      <div data-dropdown-container="true" className="absolute top-2.5 right-2" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onToggleDropdown}
          className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition cursor-pointer"
        >
          <MoreVertical className="h-3.5 w-3.5" />
        </button>

        {openDropdown && (
          <div className="absolute right-0 mt-1 z-30 w-44 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg text-left max-h-[300px] overflow-y-auto scrollbar-thin">
            <button
              onClick={onStartRename}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-[12.5px] text-slate-700 hover:bg-slate-50 transition cursor-pointer"
            >
              <Edit2 className="h-3.5 w-3.5" />
              Rename
            </button>
            <button
              onClick={onTogglePin}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-[12.5px] text-slate-700 hover:bg-slate-50 transition cursor-pointer"
            >
              <Pin className="h-3.5 w-3.5" />
              {note.isPinned ? "Unpin note" : "Pin note"}
            </button>
            <button
              onClick={onDuplicate}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-[12.5px] text-slate-700 hover:bg-slate-50 transition cursor-pointer"
            >
              <Copy className="h-3.5 w-3.5" />
              Duplicate
            </button>

            {/* Note Icon Palette trigger */}
            <button
              onClick={onToggleIconPalette}
              className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-[12.5px] text-slate-700 hover:bg-slate-50 transition cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Smile className="h-3.5 w-3.5" />
                Note icon
              </span>
              <span className="text-[12px] font-bold text-slate-500">
                {note.icon === "FileText" ? "None" : note.icon}
              </span>
            </button>

            {showIconPalette && (
              <div className="mt-1 border-t border-slate-100 pt-1.5">
                <div className="grid grid-cols-6 gap-1 p-1 bg-slate-50 rounded-lg">
                  {EMOJI_PALETTE.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => onSelectIcon(emoji)}
                      className={cn(
                        "h-6 w-6 flex items-center justify-center text-[13px] rounded-lg hover:bg-slate-200 transition cursor-pointer shrink-0",
                        note.icon === emoji && "bg-slate-200"
                      )}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => onSelectIcon("FileText")}
                  className="w-full text-center text-[11px] font-bold text-slate-500 hover:text-slate-700 py-1 hover:underline mt-1 cursor-pointer block"
                >
                  Reset icon
                </button>
              </div>
            )}

            {/* Color Code Palette trigger */}
            <button
              onClick={onToggleColorPalette}
              className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-[12.5px] text-slate-700 hover:bg-slate-50 transition cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Palette className="h-3.5 w-3.5" />
                Color code
              </span>
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: note.color }}
              />
            </button>

            {showColorPalette && (
              <div className="grid grid-cols-6 gap-1 p-2 border-t border-slate-100 mt-1 bg-slate-50 rounded-lg">
                {COLOR_PALETTE.map((color) => (
                  <button
                    key={color.name}
                    onClick={() => onSelectColor(color.value)}
                    style={{ backgroundColor: color.value }}
                    className={cn(
                      "h-4 w-4 rounded-full border border-white hover:scale-115 transition cursor-pointer shrink-0",
                      note.color === color.value && "ring-1 ring-slate-400"
                    )}
                    title={color.name}
                  />
                ))}
              </div>
            )}

            <div className="border-t border-slate-100 my-1" />
            <button
              onClick={onMoveToTrash}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-[12.5px] text-rose-600 hover:bg-rose-50 transition cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Move to Trash
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
