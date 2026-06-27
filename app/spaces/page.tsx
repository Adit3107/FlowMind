"use client";

import React, { useState, useEffect } from "react";
import { BookOpenText, Menu, Plus, Search, Folder, MoreHorizontal, Filter, Star, Clock, LayoutGrid, List, ChevronDown, FileText } from "lucide-react";
import { SidebarLayout, useSidebar } from "@/components/sidebar";
import { getSpaces } from "./actions";
import type { Space } from "@/db/schema";
import Link from "next/link";
import { CreateSpaceModal } from "./components/CreateSpaceModal";
import { SpacesGrid } from "./components/SpacesGrid";

export default function SpacesPage() {
  return (
    <SidebarLayout activeLabel="Pages / Spaces">
      <SpacesPageContent />
    </SidebarLayout>
  );
}

function SpacesPageContent() {
  const { setIsMobileOpen } = useSidebar();
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const loadSpaces = async () => {
    try {
      // Mock userId for now, replace with actual user later
      const data = await getSpaces("mock-user-id");
      setSpaces(data);
    } catch (e) {
      console.error("Failed to load spaces:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSpaces();
  }, []);

  const filteredSpaces = spaces.filter((space) => {
    const matchesSearch = space.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (activeTab === "favorites") return matchesSearch && space.isFavorite;
    if (activeTab === "archived") return matchesSearch && space.isArchived;
    return matchesSearch && !space.isArchived;
  });

  return (
    <div className="flex min-h-screen flex-1 flex-col md:ml-0 overflow-x-hidden text-left bg-[#fbf7ef]">
      <div className="p-4 md:p-8 max-w-[1400px] mx-auto w-full">
        {/* Top Header */}
        <div className="flex flex-col gap-2 mb-8">
          <div className="flex items-center gap-2 text-[11px] font-bold text-[#f15f49] tracking-wider uppercase">
            <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#ede3fe] text-[#8b5cf6]">
              <BookOpenText className="h-4 w-4" />
            </div>
            PAGES & SPACES
          </div>
          <h1 className="text-[28px] md:text-[32px] font-semibold text-slate-900 tracking-tight">
            Organize every working document by space.
          </h1>
        </div>

        {/* Main White Container */}
        <div className="rounded-[24px] border border-[#eadfc8] bg-white p-6 md:p-8 shadow-sm min-h-[600px]">
          {/* Header row */}
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
            <div>
              <h2 className="text-[24px] font-semibold text-slate-900 leading-tight">All Spaces</h2>
              <p className="text-[14px] text-slate-500 mt-1">{spaces.length} spaces</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-[#f15f49] px-4 text-[13px] font-semibold text-white shadow-sm transition hover:bg-[#e0503a]"
              >
                <Plus className="h-4 w-4" />
                New Space
              </button>
              <button
                className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-[13px] font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                <FileText className="h-4 w-4 text-slate-400" />
                New Page
              </button>
            </div>
          </div>

          {/* Search & Layout Row */}
          <div className="flex flex-col sm:flex-row items-center gap-3 mb-6">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search spaces or pages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 w-full rounded-xl border border-slate-200 bg-[#fbf7ef]/50 pl-9 pr-4 text-[13px] text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:bg-white"
              />
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <div className="flex items-center gap-1 border border-slate-200 rounded-xl p-1 bg-white shadow-sm">
                <button className="p-1.5 rounded-lg bg-slate-100 text-slate-900"><LayoutGrid className="h-4 w-4" /></button>
                <button className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900"><List className="h-4 w-4" /></button>
              </div>
              <div className="flex items-center gap-2 text-[13px] text-slate-600">
                Sort <span className="font-semibold text-slate-900 cursor-pointer flex items-center">Recently Updated <ChevronDown className="h-3 w-3 ml-1" /></span>
              </div>
            </div>
          </div>

          {/* Tabs Container */}
          <div className="flex items-center gap-1 bg-[#fbf7ef] p-1.5 rounded-[14px] mb-8 overflow-x-auto">
            <TabButton active={activeTab === "all"} onClick={() => setActiveTab("all")}>All Spaces</TabButton>
            <TabButton active={activeTab === "favorites"} onClick={() => setActiveTab("favorites")}>Favorites</TabButton>
            <TabButton active={activeTab === "recent"} onClick={() => setActiveTab("recent")}>Recently Opened</TabButton>
            <TabButton active={activeTab === "archived"} onClick={() => setActiveTab("archived")}>Archived</TabButton>
          </div>

          {/* Grid Area */}
          <div>
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              </div>
            ) : (
              <SpacesGrid spaces={filteredSpaces} onRefresh={loadSpaces} />
            )}
          </div>
        </div>
      </div>

      <CreateSpaceModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={loadSpaces}
      />
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-5 py-2 rounded-xl text-[13px] font-semibold transition-all whitespace-nowrap ${
        active 
          ? "bg-white text-slate-900 shadow-sm" 
          : "text-slate-500 hover:text-slate-900"
      }`}
    >
      {children}
    </button>
  );
}
