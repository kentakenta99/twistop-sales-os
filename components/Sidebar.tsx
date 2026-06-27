"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Columns2,
  Users,
  FolderOpen,
  Sparkles,
  Send,
  FileText,
  Globe,
  BarChart3,
  UsersRound,
  BookUser,
  Settings,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";

const navItems = [
  { href: "/",          label: "Dashboard",       icon: LayoutDashboard, accent: false },
  { href: "/pipeline",  label: "Pipeline",         icon: Columns2,        accent: false },
  { href: "/leads",     label: "Leads",            icon: Users,           accent: false },
  { href: "/crm",       label: "CRM",              icon: BookUser,        accent: false },
  { href: "/generate",  label: "Lead Generator",   icon: Sparkles,        accent: true  },
  { href: "/outreach",  label: "Outreach Planner", icon: Send,            accent: false },
  { href: "/content",   label: "Content Store",    icon: FolderOpen,      accent: false },
  { href: "/team",      label: "Team",             icon: UsersRound,      accent: false },
  { href: "/settings",  label: "Settings",         icon: Settings,        accent: false },
];

const comingSoon = [
  { label: "Documents", icon: FileText },
  { label: "Partners",  icon: Globe },
  { label: "Analytics", icon: BarChart3 },
];

interface SidebarProps {
  onClose?: () => void;
}

export function Sidebar({ onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <div className="w-60 bg-slate-900 flex flex-col h-full flex-shrink-0">
      {/* Logo */}
      <div className="px-4 py-4 border-b border-slate-700/60 flex items-start justify-between">
        <div className="flex-1">
          <Image
            src="/logo.jpg"
            alt="TwisTop"
            width={160}
            height={66}
            className="w-full"
            style={{ filter: "invert(1) brightness(0.95)" }}
            priority
          />
          <div className="text-slate-500 text-[10px] font-semibold tracking-widest uppercase mt-1">
            Axis
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="md:hidden ml-2 mt-1 p-1 rounded text-slate-500 hover:text-white hover:bg-slate-800 transition-colors flex-shrink-0"
            aria-label="メニューを閉じる"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Primary nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon, accent }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
              accent && pathname !== href && "text-amber-400 hover:text-amber-300 hover:bg-amber-500/10",
              pathname === href
                ? "bg-slate-700 text-white"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            )}
          >
            <Icon size={15} />
            {label}
          </Link>
        ))}

        <div className="pt-5 pb-1 px-3">
          <div className="text-[10px] text-slate-600 uppercase tracking-widest font-semibold">
            Coming Soon
          </div>
        </div>

        {comingSoon.map(({ label, icon: Icon }) => (
          <div
            key={label}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 cursor-not-allowed select-none"
          >
            <Icon size={15} />
            {label}
            <span className="ml-auto text-[10px] bg-slate-800 text-slate-600 px-1.5 py-0.5 rounded font-semibold">
              Soon
            </span>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-slate-700/60">
        <div className="text-[10px] text-slate-600 font-medium">v0.1 · Demo mode</div>
        <div className="text-[10px] text-slate-700 mt-0.5">Auth disabled — open access</div>
      </div>
    </div>
  );
}
