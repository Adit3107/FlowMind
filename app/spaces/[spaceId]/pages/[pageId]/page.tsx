"use client";

import React, { useState, useEffect, useRef } from "react";
import { SidebarLayout } from "@/components/sidebar";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronRight,
  FileText,
  Folder,
  Star,
  MoreHorizontal,
  MessageSquare,
  Copy,
  Trash2,
  Download,
  Link2,
  Archive,
  Loader2,
  Sparkles,
  ChevronDown,
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
  Mic,
  Send,
} from "lucide-react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import CharacterCount from "@tiptap/extension-character-count";
import { cn } from "@/lib/utils";
import { getPage, getSpace, updatePage } from "@/app/spaces/actions";
import type { Page, Space } from "@/db/schema";
import { formatDistanceToNow } from "date-fns";

export default function PageEditor() {
  const params = useParams();
  const spaceId = parseInt(params.spaceId as string, 10);
  const pageId = parseInt(params.pageId as string, 10);

  return (
    <SidebarLayout activeLabel="Pages / Spaces">
      <PageEditorContent spaceId={spaceId} pageId={pageId} />
    </SidebarLayout>
  );
}

function PageEditorContent({
  spaceId,
  pageId,
}: {
  spaceId: number;
  pageId: number;
}) {
  const router = useRouter();
  const [space, setSpace] = useState<Space | null>(null);
  const [page, setPage] = useState<Page | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "idle">(
    "saved"
  );
  const [wordCount, setWordCount] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  // Bubble menu state
  const [bubbleMenuOpen, setBubbleMenuOpen] = useState(false);
  const [bubbleMenuCoords, setBubbleMenuCoords] = useState({ top: 0, left: 0 });
  const [showAiDropdown, setShowAiDropdown] = useState(false);

  // Slash command state
  const [slashMenuOpen, setSlashMenuOpen] = useState(false);
  const [slashMenuCoords, setSlashMenuCoords] = useState({ top: 0, left: 0 });
  const [slashPos, setSlashPos] = useState<number | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Load data
  const loadData = async () => {
    try {
      const [spaceData, pageData] = await Promise.all([
        getSpace(spaceId),
        getPage(pageId),
      ]);
      setSpace(spaceData);
      setPage(pageData);
      if (pageData) setIsFavorite(pageData.isFavorite);
    } catch (e) {
      console.error("Failed to load page data:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [spaceId, pageId]);

  // Close "more" dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        moreMenuRef.current &&
        !moreMenuRef.current.contains(e.target as Node)
      ) {
        setShowMoreMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Tiptap editor
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      CharacterCount,
      Placeholder.configure({
        placeholder: "Write the page. Use / for blocks, the mic for voice, or AI Refine on selected text.",
        emptyNodeClass: "is-empty",
      }),
    ],
    content: "",
    editorProps: {
      attributes: {
        class:
          "prose prose-slate max-w-none focus:outline-none min-h-[400px] text-[15px] leading-relaxed text-slate-800 font-medium px-1",
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
            const menuTop =
              startCoords.top -
              containerRect.top +
              containerRef.current.scrollTop -
              48;
            const menuLeft =
              (startCoords.left + endCoords.left) / 2 -
              containerRect.left -
              100;
            setBubbleMenuCoords({
              top: Math.max(0, menuTop),
              left: Math.max(8, menuLeft),
            });
            setBubbleMenuOpen(true);
          }
        } catch (e) {}
      } else {
        setBubbleMenuOpen(false);
        setShowAiDropdown(false);
      }
    },
    onUpdate({ editor }) {
      setSaveStatus("saving");
      setWordCount(editor.storage.characterCount.words());

      // Slash command detection
      const { selection } = editor.state;
      const { $from } = selection;
      const currentPos = $from.pos;
      const textBefore = editor.state.doc.textBetween(
        Math.max(0, currentPos - 1),
        currentPos
      );
      if (textBefore === "/") {
        try {
          const domRect = editor.view.coordsAtPos(currentPos);
          if (containerRef.current) {
            const containerRect = containerRef.current.getBoundingClientRect();
            setSlashMenuCoords({
              top:
                domRect.bottom -
                containerRect.top +
                containerRef.current.scrollTop +
                8,
              left: domRect.left - containerRect.left + 8,
            });
            setSlashPos(currentPos);
            setSlashMenuOpen(true);
          }
        } catch (e) {}
      } else {
        setSlashMenuOpen(false);
      }
    },
  });

  // Sync editor content when page loads
  useEffect(() => {
    if (editor && page) {
      const currentHTML = editor.getHTML();
      if (currentHTML !== page.content) {
        editor.commands.setContent(page.content || "");
      }
      setSaveStatus("saved");
      setWordCount(editor.storage.characterCount.words());
    }
  }, [page?.id, editor]);

  // Auto-save debounce
  useEffect(() => {
    if (!editor || !page) return;
    const timer = setTimeout(async () => {
      if (saveStatus === "saving") {
        try {
          const html = editor.getHTML();
          await updatePage(page.id, page.spaceId, { content: html });
          setSaveStatus("saved");
        } catch (err) {
          console.error("Auto-save failed:", err);
          setSaveStatus("idle");
        }
      }
    }, 1200);
    return () => clearTimeout(timer);
  }, [editor, saveStatus, page?.id]);

  // Slash command handler
  const runSlashCommand = (type: string) => {
    if (slashPos === null || !editor) return;
    editor.chain().focus().deleteRange({ from: slashPos - 1, to: slashPos }).run();
    switch (type) {
      case "h1": editor.chain().focus().setNode("heading", { level: 1 }).run(); break;
      case "h2": editor.chain().focus().setNode("heading", { level: 2 }).run(); break;
      case "h3": editor.chain().focus().setNode("heading", { level: 3 }).run(); break;
      case "bullet": editor.chain().focus().toggleBulletList().run(); break;
      case "ordered": editor.chain().focus().toggleOrderedList().run(); break;
      case "quote": editor.chain().focus().toggleBlockquote().run(); break;
      case "code": editor.chain().focus().toggleCodeBlock().run(); break;
      case "hr": editor.chain().focus().setHorizontalRule().run(); break;
    }
    setSlashMenuOpen(false);
  };

  const handleToggleFavorite = async () => {
    if (!page) return;
    const newVal = !isFavorite;
    setIsFavorite(newVal);
    await updatePage(page.id, page.spaceId, { isFavorite: newVal });
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-1 items-center justify-center bg-[#fbf7ef]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#f15f49]" />
      </div>
    );
  }

  if (!page) {
    return (
      <div className="flex min-h-screen flex-1 flex-col items-center justify-center bg-[#fbf7ef] text-slate-500">
        <FileText className="h-12 w-12 text-slate-300 mb-4" />
        <h2 className="text-xl font-semibold mb-2 text-slate-700">Page not found</h2>
        <Link href={`/spaces/${spaceId}`} className="text-[#f15f49] hover:underline text-sm font-medium">
          Return to Space
        </Link>
      </div>
    );
  }

  const updatedAgo = page.updatedAt
    ? formatDistanceToNow(new Date(page.updatedAt), { addSuffix: false })
    : "just now";

  return (
    <div className="flex min-h-screen flex-1 flex-col md:ml-0 overflow-x-hidden text-left bg-[#fbf7ef]">
      <div className="p-4 md:p-8 max-w-[1500px] mx-auto w-full flex-1 flex flex-col gap-6">

        {/* ── Page Header ── */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-[11px] font-bold text-[#f15f49] tracking-wider uppercase">
            <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#ede3fe] text-[#8b5cf6]">
              <FileText className="h-4 w-4" />
            </div>
            PAGES &amp; SPACES
          </div>
          <h1 className="text-[28px] md:text-[32px] font-semibold text-slate-900 tracking-tight">
            {page.title}
          </h1>
        </div>

        {/* ── Main Card ── */}
        <div className="rounded-[24px] border border-[#eadfc8] bg-white shadow-sm flex-1 flex flex-col overflow-hidden">

          {/* ── Breadcrumb Bar ── */}
          <div className="px-6 py-3 border-b border-slate-100 flex items-center justify-between bg-white">
            <nav className="flex items-center gap-1.5 text-[13px] font-medium text-slate-500 flex-wrap">
              <Link
                href="/spaces"
                className="hover:text-slate-800 transition-colors flex items-center gap-1"
              >
                <span className="text-[15px] leading-none">←</span> Dev
              </Link>
              <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
              <Link
                href={`/spaces/${spaceId}`}
                className="hover:text-slate-800 transition-colors flex items-center gap-1"
              >
                <Folder className="h-3.5 w-3.5 text-slate-400" />
                {space?.name ?? "Space"}
              </Link>
              <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
              <span className="text-slate-900 font-semibold flex items-center gap-1">
                <FileText className="h-3.5 w-3.5 text-slate-400" />
                {page.title}
              </span>
            </nav>

            {/* Top-right actions */}
            <div className="flex items-center gap-2 shrink-0">
              <div
                className={cn(
                  "flex items-center gap-1.5 text-[12px] font-semibold px-2.5 py-1 rounded-lg",
                  saveStatus === "saving"
                    ? "bg-amber-50 text-amber-600"
                    : "bg-slate-100/60 text-slate-500"
                )}
              >
                {saveStatus === "saving" ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Saving…
                  </>
                ) : (
                  "Saved"
                )}
              </div>
              <div className="text-[12px] font-semibold bg-slate-100/60 text-slate-500 px-2.5 py-1 rounded-lg">
                {wordCount} words
              </div>
            </div>
          </div>

          {/* ── Two-column layout ── */}
          <div className="flex flex-1 overflow-hidden">

            {/* ── LEFT: Editor Column ── */}
            <div
              ref={containerRef}
              className="flex-1 flex flex-col overflow-y-auto relative"
            >
              {/* Page title + meta */}
              <div className="px-8 md:px-12 pt-10 pb-4">
                <h2
                  className="text-[32px] md:text-[36px] font-bold text-slate-900 outline-none leading-tight mb-3"
                  suppressContentEditableWarning
                >
                  {page.title}
                </h2>
                <div className="flex items-center flex-wrap gap-2 text-[13px] text-slate-500 pb-6 border-b border-slate-100">
                  <span className="inline-flex items-center px-2 py-0.5 rounded bg-[#f0f0ff] text-[#6366f1] font-semibold text-[11px]">
                    {page.type}
                  </span>
                  <span className="text-slate-300">·</span>
                  <span>Updated {updatedAgo} ago</span>
                  <span className="text-slate-300">·</span>
                  <span className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-full bg-[#f15f49] flex items-center justify-center text-[9px] font-bold text-white">
                      ZC
                    </div>
                    ZC
                  </span>
                </div>
              </div>

              {/* ── Fixed Toolbar ── */}
              {editor && (
                <div className="sticky top-0 z-20 border-b border-slate-100 px-5 py-2 bg-white/95 backdrop-blur-sm flex flex-wrap items-center gap-0.5 shrink-0">
                  {/* Text / Headings */}
                  <button
                    onClick={() => editor.chain().focus().setParagraph().run()}
                    className={cn(
                      "px-2 py-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition cursor-pointer text-[12px] font-bold",
                      editor.isActive("paragraph") && "bg-slate-200 text-slate-900"
                    )}
                  >
                    T
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

                  {/* Inline formatting */}
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

                  {/* Lists & blocks */}
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
                    title="Divider"
                  >
                    <Minus className="h-4 w-4" />
                  </button>

                  <div className="w-[1px] h-4 bg-slate-200 mx-1.5" />

                  {/* Voice */}
                  <button
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition cursor-pointer text-[12px] font-semibold"
                    title="Voice Input"
                  >
                    <Mic className="h-4 w-4" />
                    Voice
                  </button>
                </div>
              )}

              {/* ── Tiptap Editor Content ── */}
              <div className="flex-1 px-8 md:px-12 py-8">
                {editor && <EditorContent editor={editor} />}
              </div>

              {/* ── Floating Bubble Menu ── */}
              {bubbleMenuOpen && editor && (
                <div
                  style={{
                    position: "absolute",
                    top: bubbleMenuCoords.top,
                    left: bubbleMenuCoords.left,
                  }}
                  className="flex items-center gap-0.5 bg-slate-900 border border-slate-800 text-white rounded-xl shadow-xl px-1.5 py-1 z-40 animate-in fade-in slide-in-from-bottom-2 duration-150"
                >
                  <button
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    className={cn(
                      "p-1.5 rounded-lg hover:bg-slate-800 transition text-slate-300 hover:text-white cursor-pointer",
                      editor.isActive("bold") && "text-amber-400"
                    )}
                  >
                    <Bold className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    className={cn(
                      "p-1.5 rounded-lg hover:bg-slate-800 transition text-slate-300 hover:text-white cursor-pointer",
                      editor.isActive("italic") && "text-amber-400"
                    )}
                  >
                    <Italic className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => editor.chain().focus().toggleUnderline().run()}
                    className={cn(
                      "p-1.5 rounded-lg hover:bg-slate-800 transition text-slate-300 hover:text-white cursor-pointer",
                      editor.isActive("underline") && "text-amber-400"
                    )}
                  >
                    <UnderlineIcon className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => editor.chain().focus().toggleStrike().run()}
                    className={cn(
                      "p-1.5 rounded-lg hover:bg-slate-800 transition text-slate-300 hover:text-white cursor-pointer",
                      editor.isActive("strike") && "text-amber-400"
                    )}
                  >
                    <Strikethrough className="h-3.5 w-3.5" />
                  </button>
                  <div className="w-[1px] h-3.5 bg-slate-800 mx-1 shrink-0" />
                  {/* AI Refine */}
                  <div className="relative">
                    <button
                      onClick={() => setShowAiDropdown(!showAiDropdown)}
                      className="flex items-center gap-1 text-[12px] font-bold bg-[#f15f49] hover:bg-[#e0503a] text-white rounded-lg px-2.5 py-1 transition cursor-pointer"
                    >
                      <Sparkles className="h-3 w-3 fill-current" />
                      AI Refine
                      <ChevronDown className="h-3 w-3" />
                    </button>
                    {showAiDropdown && (
                      <div className="absolute left-0 mt-1 w-44 rounded-xl border border-slate-800 bg-slate-950 p-1 shadow-2xl z-50 text-left">
                        {[
                          "Improve grammar",
                          "Rephrase",
                          "Make shorter",
                          "Make longer",
                          "Simplify language",
                        ].map((opt) => (
                          <button
                            key={opt}
                            onClick={() => setShowAiDropdown(false)}
                            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-[12px] text-slate-300 hover:bg-slate-900 hover:text-white cursor-pointer"
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── Floating Slash Command Menu ── */}
              {slashMenuOpen && editor && (
                <div
                  style={{
                    position: "absolute",
                    top: slashMenuCoords.top,
                    left: slashMenuCoords.left,
                  }}
                  className="z-50 w-52 bg-white rounded-xl border border-slate-200 p-1.5 shadow-xl text-left animate-in fade-in zoom-in-95 duration-100"
                >
                  <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Format Blocks
                  </div>
                  {[
                    { key: "h1", label: "Heading 1", icon: <Heading1 className="h-4 w-4 text-slate-400" /> },
                    { key: "h2", label: "Heading 2", icon: <Heading2 className="h-4 w-4 text-slate-400" /> },
                    { key: "h3", label: "Heading 3", icon: <Heading3 className="h-4 w-4 text-slate-400" /> },
                    { key: "bullet", label: "Bullet List", icon: <List className="h-4 w-4 text-slate-400" /> },
                    { key: "ordered", label: "Numbered List", icon: <ListOrdered className="h-4 w-4 text-slate-400" /> },
                    { key: "quote", label: "Blockquote", icon: <Quote className="h-4 w-4 text-slate-400" /> },
                    { key: "code", label: "Code Block", icon: <Code className="h-4 w-4 text-slate-400" /> },
                    { key: "hr", label: "Divider", icon: <Minus className="h-4 w-4 text-slate-400" /> },
                  ].map(({ key, label, icon }) => (
                    <button
                      key={key}
                      onClick={() => runSlashCommand(key)}
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-[12.5px] font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                    >
                      {icon}
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* ── RIGHT: Metadata Sidebar ── */}
            <div className="hidden lg:flex flex-col w-[280px] shrink-0 border-l border-slate-100 bg-slate-50/50 overflow-y-auto">
              {/* Sidebar Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                  {page.type}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={handleToggleFavorite}
                    className="p-1.5 rounded-lg hover:bg-slate-100 transition"
                    title={isFavorite ? "Remove from favorites" : "Add to favorites"}
                  >
                    <Star
                      className={cn(
                        "h-4 w-4 transition",
                        isFavorite
                          ? "fill-amber-400 text-amber-400"
                          : "text-slate-300 hover:text-amber-400"
                      )}
                    />
                  </button>
                  {/* More actions menu */}
                  <div className="relative" ref={moreMenuRef}>
                    <button
                      onClick={() => setShowMoreMenu(!showMoreMenu)}
                      className="p-1.5 rounded-lg hover:bg-slate-100 transition text-slate-400 hover:text-slate-600"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                    {showMoreMenu && (
                      <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl border border-slate-200 shadow-lg p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                        <button className="flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-[12.5px] text-slate-700 hover:bg-slate-50 cursor-pointer">
                          <Copy className="h-3.5 w-3.5 text-slate-400" />
                          Duplicate
                        </button>
                        <button className="flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-[12.5px] text-slate-700 hover:bg-slate-50 cursor-pointer">
                          <Link2 className="h-3.5 w-3.5 text-slate-400" />
                          Copy link
                        </button>
                        <button className="flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-[12.5px] text-slate-700 hover:bg-slate-50 cursor-pointer">
                          <Download className="h-3.5 w-3.5 text-slate-400" />
                          Export
                        </button>
                        <button className="flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-[12.5px] text-slate-700 hover:bg-slate-50 cursor-pointer">
                          <Archive className="h-3.5 w-3.5 text-slate-400" />
                          Archive
                        </button>
                        <div className="my-1 border-t border-slate-100" />
                        <button className="flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-[12.5px] text-rose-600 hover:bg-rose-50 cursor-pointer">
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete page
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Page title + description */}
              <div className="px-5 py-4 border-b border-slate-100">
                <h3 className="text-[16px] font-semibold text-slate-900 leading-snug">
                  {page.title}
                </h3>
                <p className="text-[13px] text-slate-400 mt-1">
                  {space?.name ?? ""}
                </p>
                <p className="text-[12.5px] text-slate-500 mt-3 italic">
                  No description yet.
                </p>
              </div>

              {/* Metadata grid */}
              <div className="px-5 py-4 grid grid-cols-2 gap-3">
                <MetaBox label="COMMENTS" value="0" />
                <MetaBox label="LINKED TASKS" value="0" />
                <MetaBox label="LAST EDITED BY" value="ZC" />
                <MetaBox label="TEMPLATE" value={page.type} />
              </div>

              {/* ── Comments section ── */}
              <CommentsPanel />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Helper components ──

function MetaBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-3 shadow-xs">
      <div className="text-[9.5px] font-bold uppercase tracking-widest text-slate-400 mb-1">
        {label}
      </div>
      <div className="text-[13px] font-semibold text-slate-800 truncate">
        {value}
      </div>
    </div>
  );
}

// ── Interactive Comments Panel ──

interface Comment {
  id: number;
  author: string;
  initials: string;
  color: string;
  text: string;
  timestamp: string;
}

function CommentsPanel() {
  const [comments, setComments] = React.useState<Comment[]>([]);
  const [draft, setDraft] = React.useState("");
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const handleAdd = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    const newComment: Comment = {
      id: Date.now(),
      author: "You",
      initials: "ZC",
      color: "#f15f49",
      text: trimmed,
      timestamp: "just now",
    };
    setComments((prev) => [newComment, ...prev]);
    setDraft("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleAdd();
    }
  };

  const handleDelete = (id: number) => {
    setComments((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <div className="border-t border-slate-100 mt-2 pt-4 px-5 pb-5 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-slate-400" />
          <span className="text-[12px] font-bold text-slate-600 uppercase tracking-wider">
            Comments
          </span>
        </div>
        {comments.length > 0 && (
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
            {comments.length}
          </span>
        )}
      </div>

      {/* Input box */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs focus-within:border-indigo-400 transition">
        <textarea
          ref={textareaRef}
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            e.target.style.height = "auto";
            e.target.style.height = `${e.target.scrollHeight}px`;
          }}
          onKeyDown={handleKeyDown}
          placeholder="Add a comment… (Ctrl+Enter to send)"
          rows={2}
          className="w-full resize-none px-3 pt-2.5 pb-1 text-[12.5px] text-slate-800 placeholder-slate-400 focus:outline-none bg-transparent leading-relaxed"
        />
        <div className="flex items-center justify-between px-2 pb-2">
          <span className="text-[10.5px] text-slate-400">Ctrl+Enter to send</span>
          <button
            onClick={handleAdd}
            disabled={!draft.trim()}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#f15f49] text-white text-[11px] font-bold hover:bg-[#e0503a] transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send className="h-3 w-3" />
            Send
          </button>
        </div>
      </div>

      {/* Comment list */}
      {comments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-5 text-center">
          <div className="h-8 w-8 rounded-xl bg-slate-100 flex items-center justify-center mb-2">
            <MessageSquare className="h-3.5 w-3.5 text-slate-300" />
          </div>
          <p className="text-[11.5px] text-slate-400 font-medium">No comments yet</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Be the first to add one!</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[320px] overflow-y-auto pr-0.5">
          {comments.map((c) => (
            <div key={c.id} className="group flex gap-2.5">
              {/* Avatar */}
              <div
                className="h-6 w-6 rounded-full shrink-0 flex items-center justify-center text-[9px] font-bold text-white mt-0.5"
                style={{ backgroundColor: c.color }}
              >
                {c.initials}
              </div>
              {/* Bubble */}
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 mb-0.5">
                  <span className="text-[12px] font-bold text-slate-800">{c.author}</span>
                  <span className="text-[10.5px] text-slate-400">{c.timestamp}</span>
                </div>
                <div className="bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-[12.5px] text-slate-700 leading-relaxed break-words">
                  {c.text}
                </div>
              </div>
              {/* Delete */}
              <button
                onClick={() => handleDelete(c.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 p-1 rounded-lg hover:bg-rose-50 text-slate-300 hover:text-rose-500 mt-0.5"
                title="Delete comment"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
