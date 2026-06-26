"use client";

import React, { useEffect, useState, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import CharacterCount from "@tiptap/extension-character-count";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code,
  Minus,
  Sparkles,
  Loader2,
  ChevronDown,
  Sparkle,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Note } from "@/db/schema";
import { refineText } from "../ai-actions";

interface NotionEditorProps {
  note: Note | null;
  onSaveContent: (id: number, content: string) => Promise<void>;
}

export function NotionEditor({ note, onSaveContent }: NotionEditorProps) {
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "idle">("saved");
  const [aiLoading, setAiLoading] = useState(false);
  const [showAiDropdown, setShowAiDropdown] = useState(false);
  
  // Custom Selection Bubble Menu state
  const [bubbleMenuOpen, setBubbleMenuOpen] = useState(false);
  const [bubbleMenuCoords, setBubbleMenuCoords] = useState({ top: 0, left: 0 });

  // Slash command menu state
  const [slashMenuOpen, setSlashMenuOpen] = useState(false);
  const [slashMenuCoords, setSlashMenuCoords] = useState({ top: 0, left: 0 });
  const [slashPos, setSlashPos] = useState<number | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize Tiptap editor
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      CharacterCount,
      Placeholder.configure({
        placeholder: "Press / for commands",
        emptyNodeClass: "is-empty",
      }),
    ],
    content: note?.content || "",
    editorProps: {
      attributes: {
        class:
          "prose prose-slate max-w-none focus:outline-none min-h-[500px] text-[15px] leading-relaxed text-slate-800 font-medium px-1",
      },
    },
    onSelectionUpdate({ editor }) {
      const { selection } = editor.state;
      if (!selection.empty) {
        try {
          const from = selection.from;
          const to = selection.to;
          const startCoords = editor.view.coordsAtPos(from);
          const endCoords = editor.view.coordsAtPos(to);
          
          if (containerRef.current) {
            const containerRect = containerRef.current.getBoundingClientRect();
            // Position bubble menu centered above selection
            const menuTop = startCoords.top - containerRect.top + containerRef.current.scrollTop - 48;
            const menuLeft = (startCoords.left + endCoords.left) / 2 - containerRect.left - 100;

            setBubbleMenuCoords({
              top: Math.max(0, menuTop),
              left: Math.max(8, menuLeft),
            });
            setBubbleMenuOpen(true);
          }
        } catch (e) {
          // ignore measurement errors
        }
      } else {
        setBubbleMenuOpen(false);
        setShowAiDropdown(false);
      }
    },
    onUpdate({ editor }) {
      setSaveStatus("saving");
      
      // Check for Slash Command trigger "/"
      const { selection } = editor.state;
      const { $from } = selection;
      const currentPos = $from.pos;
      
      // Get 1 character before cursor
      const textBefore = editor.state.doc.textBetween(
        Math.max(0, currentPos - 1),
        currentPos
      );

      if (textBefore === "/") {
        // Find screen coordinates of the cursor
        try {
          const domRect = editor.view.coordsAtPos(currentPos);
          if (containerRef.current) {
            const containerRect = containerRef.current.getBoundingClientRect();
            setSlashMenuCoords({
              top: domRect.bottom - containerRect.top + containerRef.current.scrollTop + 8,
              left: domRect.left - containerRect.left + 8,
            });
            setSlashPos(currentPos);
            setSlashMenuOpen(true);
          }
        } catch (e) {
          console.error("Failed to measure cursor coordinates", e);
        }
      } else {
        setSlashMenuOpen(false);
      }
    },
  });

  // Sync editor content when note changes
  useEffect(() => {
    if (editor && note) {
      const currentHTML = editor.getHTML();
      if (currentHTML !== note.content) {
        editor.commands.setContent(note.content || "");
      }
      setSaveStatus("saved");
    }
  }, [note?.id, editor]);

  // Debounced auto-save hook
  useEffect(() => {
    if (!editor || !note) return;

    const timer = setTimeout(async () => {
      if (saveStatus === "saving") {
        try {
          const html = editor.getHTML();
          await onSaveContent(note.id, html);
          setSaveStatus("saved");
        } catch (err) {
          console.error("Auto-save failed:", err);
          setSaveStatus("idle");
        }
      }
    }, 1000); // Save after 1 second of inactivity

    return () => clearTimeout(timer);
  }, [editor, saveStatus, note?.id]);

  if (!note || !editor) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-white/40 text-center select-none">
        <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-50 border border-[#eadfc8] text-[#eadfc8] shadow-sm mb-4">
          <Sparkle className="h-7 w-7" />
        </div>
        <h3 className="text-[17px] font-bold text-slate-800">No active note selected</h3>
        <p className="mt-1 text-[13px] text-slate-500 max-w-[280px] leading-relaxed">
          Choose a note card from the library panel or create a new note page to start writing.
        </p>
      </div>
    );
  }

  // Trigger slash command formatting block replacement
  const runSlashCommand = (type: string) => {
    if (slashPos === null) return;
    
    // Delete the "/" character typed
    editor.chain().focus().deleteRange({ from: slashPos - 1, to: slashPos }).run();

    // Insert block format
    switch (type) {
      case "h1":
        editor.chain().focus().setNode("heading", { level: 1 }).run();
        break;
      case "h2":
        editor.chain().focus().setNode("heading", { level: 2 }).run();
        break;
      case "h3":
        editor.chain().focus().setNode("heading", { level: 3 }).run();
        break;
      case "bullet":
        editor.chain().focus().toggleBulletList().run();
        break;
      case "ordered":
        editor.chain().focus().toggleOrderedList().run();
        break;
      case "quote":
        editor.chain().focus().toggleBlockquote().run();
        break;
      case "code":
        editor.chain().focus().toggleCodeBlock().run();
        break;
      case "hr":
        editor.chain().focus().setHorizontalRule().run();
        break;
    }
    setSlashMenuOpen(false);
  };

  // Run AI refinement action
  const handleAiRefine = async (option: string) => {
    const { selection } = editor.state;
    const selectedText = editor.state.doc.textBetween(
      selection.from,
      selection.to
    );

    if (!selectedText.trim()) return;

    setAiLoading(true);
    setShowAiDropdown(false);
    try {
      const result = await refineText(selectedText, option);
      if (result) {
        editor.chain().focus().insertContentAt(
          { from: selection.from, to: selection.to },
          result
        ).run();
      }
    } catch (e) {
      console.error("AI Refine failed:", e);
    } finally {
      setAiLoading(false);
      setBubbleMenuOpen(false);
    }
  };

  const wordCount = editor.storage.characterCount.words();

  return (
    <div
      ref={containerRef}
      className="flex-1 flex flex-col bg-white overflow-y-auto relative h-full text-left"
    >
      {/* Editor Header Details bar */}
      <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-[#fafbfc]/50 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-[14px] shrink-0 border border-slate-200/60" style={{ borderLeft: `3.5px solid ${note.color}` }}>
            {note.icon === "FileText" ? (
              <FileText className="h-3.5 w-3.5 text-slate-500" />
            ) : (
              <span>{note.icon}</span>
            )}
          </div>
          <h1 className="text-[17px] font-bold text-slate-900 truncate max-w-[300px]">
            {note.title || "Untitled"}
          </h1>
        </div>

        <div className="flex items-center gap-4 text-[12px] font-semibold text-slate-500">
          {/* Save status */}
          <div className="flex items-center gap-1.5 bg-slate-100/60 px-2.5 py-1 rounded-lg">
            {saveStatus === "saving" ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin text-slate-400" />
                <span>Saving...</span>
              </>
            ) : (
              <span>Saved</span>
            )}
          </div>
          {/* Word count */}
          <div className="bg-slate-100/60 px-2.5 py-1 rounded-lg">
            {wordCount} words
          </div>
        </div>
      </div>

      {/* FIXED TOOLBAR */}
      <div className="border-b border-slate-100 px-5 py-2.5 bg-slate-50/40 flex flex-wrap items-center gap-1 shrink-0">
        {/* Paragraph Headings */}
        <button
          onClick={() => editor.chain().focus().setParagraph().run()}
          className={cn(
            "p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition cursor-pointer text-[12px] font-bold px-2",
            editor.isActive("paragraph") && "bg-slate-200 text-slate-900"
          )}
        >
          Text
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={cn(
            "p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition cursor-pointer",
            editor.isActive("heading", { level: 1 }) && "bg-slate-200 text-slate-900"
          )}
          title="Heading 1"
        >
          <Heading1 className="h-4 w-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={cn(
            "p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition cursor-pointer",
            editor.isActive("heading", { level: 2 }) && "bg-slate-200 text-slate-900"
          )}
          title="Heading 2"
        >
          <Heading2 className="h-4 w-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={cn(
            "p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition cursor-pointer",
            editor.isActive("heading", { level: 3 }) && "bg-slate-200 text-slate-900"
          )}
          title="Heading 3"
        >
          <Heading3 className="h-4 w-4" />
        </button>

        <div className="w-[1px] h-4 bg-slate-200 mx-1.5" />

        {/* Inline Formatting */}
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={cn(
            "p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition cursor-pointer",
            editor.isActive("bold") && "bg-slate-200 text-slate-900"
          )}
          title="Bold"
        >
          <Bold className="h-4 w-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={cn(
            "p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition cursor-pointer",
            editor.isActive("italic") && "bg-slate-200 text-slate-900"
          )}
          title="Italic"
        >
          <Italic className="h-4 w-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={cn(
            "p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition cursor-pointer",
            editor.isActive("underline") && "bg-slate-200 text-slate-900"
          )}
          title="Underline"
        >
          <UnderlineIcon className="h-4 w-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={cn(
            "p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition cursor-pointer",
            editor.isActive("strike") && "bg-slate-200 text-slate-900"
          )}
          title="Strikethrough"
        >
          <Strikethrough className="h-4 w-4" />
        </button>

        <div className="w-[1px] h-4 bg-slate-200 mx-1.5" />

        {/* Lists & Nodes */}
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={cn(
            "p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition cursor-pointer",
            editor.isActive("bulletList") && "bg-slate-200 text-slate-900"
          )}
          title="Bullet List"
        >
          <List className="h-4 w-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={cn(
            "p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition cursor-pointer",
            editor.isActive("orderedList") && "bg-slate-200 text-slate-900"
          )}
          title="Numbered List"
        >
          <ListOrdered className="h-4 w-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={cn(
            "p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition cursor-pointer",
            editor.isActive("blockquote") && "bg-slate-200 text-slate-900"
          )}
          title="Blockquote"
        >
          <Quote className="h-4 w-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={cn(
            "p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition cursor-pointer",
            editor.isActive("codeBlock") && "bg-slate-200 text-slate-900"
          )}
          title="Code Block"
        >
          <Code className="h-4 w-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition cursor-pointer"
          title="Horizontal Rule"
        >
          <Minus className="h-4 w-4" />
        </button>
      </div>

      {/* Editor Content Area */}
      <div className="flex-1 p-8 md:px-12 md:py-10 bg-white">
        <EditorContent editor={editor} />
      </div>

      {/* FLOATING BUBBLE MENU */}
      {bubbleMenuOpen && (
        <div
          style={{
            position: "absolute",
            top: bubbleMenuCoords.top,
            left: bubbleMenuCoords.left,
          }}
          className="flex items-center gap-0.5 bg-slate-900 border border-slate-800 text-white rounded-xl shadow-xl px-1.5 py-1 z-45 animate-in fade-in slide-in-from-bottom-2 duration-150"
        >
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={cn(
              "p-1.5 rounded-lg hover:bg-slate-800 transition text-slate-300 hover:text-white cursor-pointer",
              editor.isActive("bold") && "text-amber-500 hover:text-amber-500"
            )}
          >
            <Bold className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={cn(
              "p-1.5 rounded-lg hover:bg-slate-800 transition text-slate-300 hover:text-white cursor-pointer",
              editor.isActive("italic") && "text-amber-500 hover:text-amber-500"
            )}
          >
            <Italic className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={cn(
              "p-1.5 rounded-lg hover:bg-slate-800 transition text-slate-300 hover:text-white cursor-pointer",
              editor.isActive("underline") && "text-amber-500 hover:text-amber-500"
            )}
          >
            <UnderlineIcon className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={cn(
              "p-1.5 rounded-lg hover:bg-slate-800 transition text-slate-300 hover:text-white cursor-pointer",
              editor.isActive("strike") && "text-amber-500 hover:text-amber-500"
            )}
          >
            <Strikethrough className="h-3.5 w-3.5" />
          </button>

          <div className="w-[1px] h-3.5 bg-slate-800 mx-1 shrink-0" />

          {/* AI Refine Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowAiDropdown(!showAiDropdown)}
              className="flex items-center gap-1 text-[12px] font-bold bg-[#f15f49] hover:bg-orange-600 text-white rounded-lg px-2.5 py-1 transition cursor-pointer"
            >
              {aiLoading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Sparkles className="h-3 w-3 fill-current" />
              )}
              AI Refine
              <ChevronDown className="h-3 w-3" />
            </button>

            {showAiDropdown && (
              <div className="absolute left-0 mt-1 w-44 rounded-xl border border-slate-800 bg-slate-950 p-1 shadow-2xl z-50 text-left">
                <button
                  onClick={() => handleAiRefine("improve-grammar")}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-[12px] text-slate-300 hover:bg-slate-900 hover:text-white cursor-pointer"
                >
                  Improve grammar
                </button>
                <button
                  onClick={() => handleAiRefine("rephrase")}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-[12px] text-slate-300 hover:bg-slate-900 hover:text-white cursor-pointer"
                >
                  Rephrase
                </button>
                <button
                  onClick={() => handleAiRefine("make-shorter")}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-[12px] text-slate-300 hover:bg-slate-900 hover:text-white cursor-pointer"
                >
                  Make shorter
                </button>
                <button
                  onClick={() => handleAiRefine("make-longer")}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-[12px] text-slate-300 hover:bg-slate-900 hover:text-white cursor-pointer"
                >
                  Make longer
                </button>
                <button
                  onClick={() => handleAiRefine("simplify")}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-[12px] text-slate-300 hover:bg-slate-900 hover:text-white cursor-pointer"
                >
                  Simplify language
                </button>
                <button
                  onClick={() => handleAiRefine("change-tone")}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-[12px] text-slate-300 hover:bg-slate-900 hover:text-white cursor-pointer"
                >
                  Change tone (cozy)
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* FLOATING SLASH COMMAND MENU */}
      {slashMenuOpen && (
        <div
          style={{
            position: "absolute",
            top: slashMenuCoords.top,
            left: slashMenuCoords.left,
          }}
          className="z-50 w-52 bg-white rounded-xl border border-slate-200 p-1.5 shadow-xl text-left"
        >
          <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Format Blocks
          </div>
          <button
            onClick={() => runSlashCommand("h1")}
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-[12.5px] font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
          >
            <Heading1 className="h-4 w-4 text-slate-500" />
            Heading 1
          </button>
          <button
            onClick={() => runSlashCommand("h2")}
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-[12.5px] font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
          >
            <Heading2 className="h-4 w-4 text-slate-500" />
            Heading 2
          </button>
          <button
            onClick={() => runSlashCommand("h3")}
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-[12.5px] font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
          >
            <Heading3 className="h-4 w-4 text-slate-500" />
            Heading 3
          </button>
          <button
            onClick={() => runSlashCommand("bullet")}
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-[12.5px] font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
          >
            <List className="h-4 w-4 text-slate-500" />
            Bullet list
          </button>
          <button
            onClick={() => runSlashCommand("ordered")}
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-[12.5px] font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
          >
            <ListOrdered className="h-4 w-4 text-slate-500" />
            Numbered list
          </button>
          <button
            onClick={() => runSlashCommand("quote")}
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-[12.5px] font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
          >
            <Quote className="h-4 w-4 text-slate-500" />
            Blockquote
          </button>
          <button
            onClick={() => runSlashCommand("code")}
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-[12.5px] font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
          >
            <Code className="h-4 w-4 text-slate-500" />
            Code Block
          </button>
          <button
            onClick={() => runSlashCommand("hr")}
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-[12.5px] font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
          >
            <Minus className="h-4 w-4 text-slate-500" />
            Divider
          </button>
        </div>
      )}
    </div>
  );
}
