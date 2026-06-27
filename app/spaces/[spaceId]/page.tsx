"use client";

import React, { useState, useEffect } from "react";
import { SidebarLayout, useSidebar } from "@/components/sidebar";
import { getSpace, getPages } from "../actions";
import type { Space, Page } from "@/db/schema";
import {
  Plus,
  LayoutGrid,
  List,
  Search,
  Folder,
  MoreHorizontal,
  BookOpenText,
  Star,
  Clock,
  Archive,
  FileText,
} from "lucide-react";
import Link from "next/link";
import { PagesList } from "./components/PagesList";
import { CreatePageModal } from "../components/CreatePageModal";
import { useParams } from "next/navigation";
import { cn } from "@/lib/utils";

export default function SpaceDetailsPage() {
  const params = useParams();
  const spaceId = parseInt(params.spaceId as string, 10);

  return (
    <SidebarLayout activeLabel="Pages / Spaces">
      <SpaceDetailsContent spaceId={spaceId} />
    </SidebarLayout>
  );
}

function SpaceDetailsContent({ spaceId }: { spaceId: number }) {
  const [space, setSpace] = useState<Space | null>(null);
  const [pages, setPages] = useState<Page[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [activeTab, setActiveTab] = useState<"all" | "favorites" | "recent" | "archived">("all");

  const loadData = async () => {
    try {
      const [spaceData, pagesData] = await Promise.all([
        getSpace(spaceId),
        getPages(spaceId),
      ]);
      setSpace(spaceData);
      setPages(pagesData);
    } catch (e) {
      console.error("Failed to load space data:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [spaceId]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-1 items-center justify-center bg-[#fbf7ef]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#f15f49]" />
      </div>
    );
  }

  if (!space) {
    return (
      <div className="flex min-h-screen flex-1 flex-col items-center justify-center bg-[#fbf7ef] text-slate-500">
        <h2 className="text-xl font-semibold mb-2 text-slate-700">Space not found</h2>
        <Link href="/spaces" className="text-[#f15f49] hover:underline">
          Return to All Spaces
        </Link>
      </div>
    );
  }

  // Tab filtering logic — mirrors the /spaces page approach
  const getTabPages = () => {
    const bySearch = pages.filter((p) =>
      p.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
    switch (activeTab) {
      case "favorites":
        return bySearch.filter((p) => p.isFavorite && !p.isArchived);
      case "recent":
        // Sort by updatedAt desc, take top 10
        return [...bySearch]
          .filter((p) => !p.isArchived)
          .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
          .slice(0, 10);
      case "archived":
        return bySearch.filter((p) => p.isArchived);
      default:
        return bySearch.filter((p) => !p.isArchived);
    }
  };

  const filteredPages = getTabPages();

  const allCount = pages.filter((p) => !p.isArchived).length;
  const favCount = pages.filter((p) => p.isFavorite && !p.isArchived).length;
  const archivedCount = pages.filter((p) => p.isArchived).length;

  return (
    <div className="flex min-h-screen flex-1 flex-col md:ml-0 overflow-x-hidden text-left bg-[#fbf7ef]">
      <div className="p-4 md:p-8 max-w-[1400px] mx-auto w-full">

        {/* Top Header */}
        <div className="flex flex-col gap-2 mb-8">
          <div className="flex items-center gap-2 text-[11px] font-bold text-[#f15f49] tracking-wider uppercase">
            <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#ede3fe] text-[#8b5cf6]">
              <BookOpenText className="h-4 w-4" />
            </div>
            PAGES &amp; SPACES
          </div>
          <h1 className="text-[28px] md:text-[32px] font-semibold text-slate-900 tracking-tight">
            Organize every working document by space.
          </h1>
        </div>

        {/* Main White Container */}
        <div className="rounded-[24px] border border-[#eadfc8] bg-white shadow-sm min-h-[600px] flex flex-col">

          {/* Breadcrumb */}
          <div className="px-6 py-4 border-b border-slate-100 flex items-center">
            <Link
              href="/spaces"
              className="flex items-center gap-2 text-[14px] font-medium text-slate-500 hover:text-slate-900 transition-colors"
            >
              <span>←</span> All Spaces
            </Link>
          </div>

          <div className="p-6 md:p-8 flex-1 flex flex-col">

            {/* Space Header Row */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div
                  className="flex h-14 w-14 items-center justify-center rounded-2xl"
                  style={{ backgroundColor: `${space.color}15`, color: space.color }}
                >
                  <Folder className="h-6 w-6" fill="currentColor" fillOpacity={0.2} />
                </div>
                <div>
                  <h2 className="text-[24px] font-semibold text-slate-900 leading-tight">{space.name}</h2>
                  <p className="text-[14px] text-slate-500">{allCount} pages</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-[#f15f49] px-4 text-[13px] font-semibold text-white shadow-sm transition hover:bg-[#e0503a]"
                >
                  <Plus className="h-4 w-4" />
                  New Page
                </button>
                <button className="inline-flex h-9 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50">
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Search + View Toggle Row */}
            <div className="flex flex-col sm:flex-row items-center gap-3 mb-5">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search pages…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-[#fbf7ef]/50 pl-9 pr-4 text-[13px] text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:bg-white transition"
                />
              </div>
              <div className="flex items-center gap-1 border border-slate-200 rounded-xl p-1 bg-white shadow-sm shrink-0">
                <button
                  onClick={() => setViewMode("list")}
                  className={cn(
                    "p-1.5 rounded-lg transition-colors",
                    viewMode === "list" ? "bg-slate-100 text-slate-900" : "text-slate-400 hover:text-slate-900"
                  )}
                  title="List view"
                >
                  <List className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode("grid")}
                  className={cn(
                    "p-1.5 rounded-lg transition-colors",
                    viewMode === "grid" ? "bg-slate-100 text-slate-900" : "text-slate-400 hover:text-slate-900"
                  )}
                  title="Grid view"
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Tabs — mirrors /spaces tabs */}
            <div className="flex items-center gap-1 bg-[#fbf7ef] p-1.5 rounded-[14px] mb-6 overflow-x-auto">
              <TabButton
                active={activeTab === "all"}
                onClick={() => setActiveTab("all")}
                icon={<FileText className="h-3.5 w-3.5" />}
              >
                All Pages
                <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-slate-200/80 text-slate-600 text-[10px] font-bold">
                  {allCount}
                </span>
              </TabButton>
              <TabButton
                active={activeTab === "favorites"}
                onClick={() => setActiveTab("favorites")}
                icon={<Star className="h-3.5 w-3.5" />}
              >
                Favorites
                {favCount > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold">
                    {favCount}
                  </span>
                )}
              </TabButton>
              <TabButton
                active={activeTab === "recent"}
                onClick={() => setActiveTab("recent")}
                icon={<Clock className="h-3.5 w-3.5" />}
              >
                Recently Opened
              </TabButton>
              <TabButton
                active={activeTab === "archived"}
                onClick={() => setActiveTab("archived")}
                icon={<Archive className="h-3.5 w-3.5" />}
              >
                Archived
                {archivedCount > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-slate-200/80 text-slate-600 text-[10px] font-bold">
                    {archivedCount}
                  </span>
                )}
              </TabButton>
            </div>

            {/* Pages Grid/List */}
            <div className="flex-1">
              <PagesList
                pages={filteredPages}
                spaceName={space.name}
                viewMode={viewMode}
                onRefresh={loadData}
              />
            </div>
          </div>
        </div>
      </div>

      <CreatePageModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        spaceId={space.id}
        onCreated={loadData}
      />
    </div>
  );
}

// ─── Tab button ───────────────────────────────────────────────────────────────

function TabButton({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-semibold transition-all whitespace-nowrap",
        active
          ? "bg-white text-slate-900 shadow-sm"
          : "text-slate-500 hover:text-slate-900"
      )}
    >
      {icon && (
        <span className={active ? "text-[#f15f49]" : "text-slate-400"}>
          {icon}
        </span>
      )}
      {children}
    </button>
  );
}
