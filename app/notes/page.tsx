"use client";

import React, { useState, useEffect, useCallback } from "react";
import { StickyNote, Menu } from "lucide-react";
import { SidebarLayout, useSidebar } from "@/components/sidebar";
import { NotesSidebar } from "./components/NotesSidebar";
import { NotionEditor } from "./components/NotionEditor";
import {
  getNotes,
  createNote,
  updateNote,
  duplicateNote,
  deleteNote,
  emptyTrash,
} from "./actions";
import type { Note } from "@/db/schema";

export default function NotesPage() {
  return (
    <SidebarLayout activeLabel="Notes">
      <NotesPageContent />
    </SidebarLayout>
  );
}

function NotesPageContent() {
  const { setIsMobileOpen } = useSidebar();
  const [notesList, setNotesList] = useState<Note[]>([]);
  const [activeNoteId, setActiveNoteId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load Notes from DB
  const loadNotes = useCallback(async (selectId: number | null = null) => {
    try {
      const data = await getNotes();
      setNotesList(data);
      if (data.length > 0) {
        // If selectId is provided, select it, otherwise select first non-trashed note
        if (selectId !== null && data.some((n) => n.id === selectId)) {
          setActiveNoteId(selectId);
        } else if (activeNoteId === null || !data.some((n) => n.id === activeNoteId)) {
          const firstActive = data.find((n) => !n.isTrashed);
          if (firstActive) {
            setActiveNoteId(firstActive.id);
          }
        }
      } else {
        setActiveNoteId(null);
      }
    } catch (e) {
      console.error("Failed to load notes:", e);
    } finally {
      setIsLoading(false);
    }
  }, [activeNoteId]);

  useEffect(() => {
    loadNotes();
  }, []);

  const handleSelectNote = (id: number) => {
    setActiveNoteId(id);
  };

  const handleCreateNote = async () => {
    try {
      const newNote = await createNote("Untitled note", "", "#10b981");
      setNotesList((prev) => [newNote, ...prev]);
      setActiveNoteId(newNote.id);
    } catch (e) {
      console.error("Failed to create note:", e);
    }
  };

  const handleUpdateNote = async (id: number, data: any) => {
    // Optimistic Update
    setNotesList((prev) =>
      prev.map((n) => (n.id === id ? { ...n, ...data, updatedAt: new Date() } : n))
    );
    try {
      const updated = await updateNote(id, data);
      
      // If we move the active note to trash, select another note
      if (data.isTrashed && activeNoteId === id) {
        const remainingActive = notesList.filter((n) => n.id !== id && !n.isTrashed);
        if (remainingActive.length > 0) {
          setActiveNoteId(remainingActive[0].id);
        } else {
          setActiveNoteId(null);
        }
      }
      return updated;
    } catch (e) {
      console.error("Failed to update note:", e);
      loadNotes();
    }
  };

  const handleDuplicateNote = async (id: number) => {
    try {
      const copy = await duplicateNote(id);
      setNotesList((prev) => [copy, ...prev]);
      setActiveNoteId(copy.id);
    } catch (e) {
      console.error("Failed to duplicate note:", e);
      loadNotes();
    }
  };

  const handleDeletePermanently = async (id: number) => {
    // Optimistic update
    setNotesList((prev) => prev.filter((n) => n.id !== id));
    if (activeNoteId === id) {
      setActiveNoteId(null);
    }
    try {
      await deleteNote(id);
    } catch (e) {
      console.error("Failed to permanently delete note:", e);
      loadNotes();
    }
  };

  const handleEmptyTrash = async () => {
    // Optimistic update
    setNotesList((prev) => prev.filter((n) => !n.isTrashed));
    try {
      await emptyTrash();
    } catch (e) {
      console.error("Failed to empty trash:", e);
      loadNotes();
    }
  };

  const handleSaveContent = async (id: number, content: string) => {
    // Silent update in the background (no full state reload to prevent editor cursor jump)
    setNotesList((prev) =>
      prev.map((n) => (n.id === id ? { ...n, content, updatedAt: new Date() } : n))
    );
    try {
      await updateNote(id, { content });
    } catch (e) {
      console.error("Failed to save note content:", e);
    }
  };

  const activeNote = notesList.find((note) => note.id === activeNoteId) || null;

  return (
    <div className="flex min-h-screen flex-1 flex-col md:ml-0 overflow-x-hidden text-left bg-[#f6f1e6]">
      {/* Tiptap Placeholder Styling injection */}
      <style>{`
        .prose .is-empty::before {
          content: attr(data-placeholder);
          float: left;
          color: #cbd5e1;
          pointer-events: none;
          height: 0;
          font-style: italic;
        }
        .prose blockquote {
          border-left: 4px solid #eadfc8;
          padding-left: 1rem;
          font-style: italic;
          color: #475569;
        }
        .prose pre {
          background-color: #f1f5f9;
          border-radius: 8px;
          padding: 0.75rem 1rem;
          font-family: monospace;
          color: #334155;
          overflow-x: auto;
        }
        .prose hr {
          border: 0;
          border-top: 1.5px solid #eadfc8;
          margin: 1.5rem 0;
        }
        .prose ul {
          list-style-type: disc;
          padding-left: 1.5rem;
        }
        .prose ol {
          list-style-type: decimal;
          padding-left: 1.5rem;
        }
        .prose h1 {
          font-size: 2em;
          font-weight: 700;
          margin-top: 0.83em;
          margin-bottom: 0.83em;
        }
        .prose h2 {
          font-size: 1.5em;
          font-weight: 700;
          margin-top: 1em;
          margin-bottom: 1em;
        }
        .prose h3 {
          font-size: 1.17em;
          font-weight: 700;
          margin-top: 1em;
          margin-bottom: 1em;
        }
      `}</style>

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
            <div className="flex items-center gap-2 text-[13px] font-medium text-sky-600">
              <StickyNote className="h-4 w-4 text-sky-600" />
              Notes
            </div>
            <h1 className="mt-2 text-[32px] md:text-[40px] font-semibold leading-[1.05] tracking-[-0.03em] text-slate-950">
              Capture the shape of your thinking.
            </h1>
            <p className="mt-2 text-[14px] md:text-[15px] leading-relaxed text-slate-600 max-w-4xl">
              Create rich-text note pages, assign custom color codes, format using slash commands, and polish your drafts
              in real-time with Google Gemini AI refinement.
            </p>
          </div>
        </div>
      </header>

      {/* Main Workspace split panel */}
      <div className="flex-1 p-4 md:p-6">
        {isLoading ? (
          <div className="rounded-[24px] border border-[#eadfc8] bg-white p-24 text-center shadow-sm flex flex-col items-center justify-center min-h-[500px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#f15f49]"></div>
            <span className="text-[13px] text-slate-500 font-semibold mt-4">Loading your notes desk...</span>
          </div>
        ) : (
          <div className="rounded-[24px] border border-[#eadfc8] bg-white shadow-sm flex flex-col lg:grid lg:grid-cols-[320px_1fr] min-h-[600px] overflow-hidden">
            {/* Left sidebar notes index */}
            <NotesSidebar
              notesList={notesList}
              activeNoteId={activeNoteId}
              onSelectNote={handleSelectNote}
              onCreateNote={handleCreateNote}
              onUpdateNote={handleUpdateNote}
              onDuplicateNote={handleDuplicateNote}
              onDeletePermanently={handleDeletePermanently}
              onEmptyTrash={handleEmptyTrash}
            />

            {/* Right Rich Text Editor pad */}
            <NotionEditor
              note={activeNote}
              onSaveContent={handleSaveContent}
            />
          </div>
        )}
      </div>
    </div>
  );
}
