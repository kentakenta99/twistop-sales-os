"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { Sidebar } from "./Sidebar";

export default function SidebarWrapper({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-full bg-slate-50">
      {/* モバイル用オーバーレイ */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* サイドバー：モバイルはドロワー、デスクトップは常時表示 */}
      <div
        className={`
          fixed inset-y-0 left-0 z-50 transition-transform duration-300 ease-in-out
          md:relative md:translate-x-0
          ${mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        <Sidebar onClose={() => setMobileOpen(false)} />
      </div>

      {/* メインコンテンツ */}
      <main className="flex-1 overflow-auto min-w-0">
        {/* モバイル専用ヘッダー */}
        <div className="flex items-center h-12 px-4 bg-slate-900 border-b border-slate-700 md:hidden">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="メニューを開く"
          >
            <Menu size={20} />
          </button>
          <span className="ml-3 text-slate-400 text-xs font-semibold tracking-widest uppercase">
            Sales OS
          </span>
        </div>
        {children}
      </main>
    </div>
  );
}
