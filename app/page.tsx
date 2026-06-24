import Image from "next/image";
import { prospects, recentActivity, AXIS_A_STAGES } from "@/lib/mockData";
import { TrendingUp, Users, Handshake, Send, MessageSquare, Calendar } from "lucide-react";

const stats = [
  { label: "Total Leads",             value: "15",   icon: Users,          change: "+3 this week",       color: "text-slate-900" },
  { label: "Active Deals (Axis A)",   value: "7",    icon: TrendingUp,     change: "2 in Demo stage",    color: "text-amber-600" },
  { label: "Partner Negotiations (B)",value: "5",    icon: Handshake,      change: "1 contract signed",  color: "text-blue-600"  },
  { label: "Outreach Sent",           value: "142",  icon: Send,           change: "This month",         color: "text-violet-600"},
  { label: "Response Rate",           value: "8.4%", icon: MessageSquare,  change: "vs 5% target ✓",    color: "text-green-600" },
  { label: "Meetings This Week",      value: "3",    icon: Calendar,       change: "Next: Jun 24",       color: "text-orange-600"},
];

const stageBarColors: Record<string, string> = {
  Cold:       "bg-slate-300",
  Contacted:  "bg-blue-400",
  Responded:  "bg-violet-400",
  Demo:       "bg-amber-400",
  Proposal:   "bg-orange-400",
  Won:        "bg-green-500",
};

const activityIcons: Record<string, string> = {
  reply: "💬",
  deal:  "📋",
  doc:   "📄",
  win:   "🏆",
};

export default function DashboardPage() {
  const pipeline = AXIS_A_STAGES.map((stage) => ({
    stage,
    count: prospects.filter((p) => p.axis === "A" && p.stage === stage).length,
  }));
  const maxCount = Math.max(...pipeline.map((p) => p.count), 1);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">TwisTop Global Sales Overview</p>
      </div>

      {/* Hero banner */}
      <div className="relative rounded-2xl overflow-hidden mb-8 bg-slate-900 h-44 flex items-center">
        {/* Left product image */}
        <div className="absolute left-0 top-0 h-full w-52 overflow-hidden">
          <Image
            src="/combo-wilkinson.jpg"
            alt="Nikka × Wilkinson TANSAN"
            fill
            className="object-cover object-center opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-slate-900" />
        </div>

        {/* Right product image */}
        <div className="absolute right-0 top-0 h-full w-52 overflow-hidden">
          <Image
            src="/combo-monster.jpg"
            alt="Grey Goose × Monster Energy"
            fill
            className="object-cover object-center opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-l from-transparent to-slate-900" />
        </div>

        {/* Center content */}
        <div className="relative z-10 w-full flex flex-col items-center justify-center text-center px-4">
          <Image
            src="/logo.jpg"
            alt="TwisTop"
            width={180}
            height={75}
            className="mb-2"
            style={{ filter: "invert(1) brightness(0.95)" }}
          />
          <p className="text-slate-400 text-xs tracking-widest uppercase">
            Global Sales Operations · Axis A + B
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {stats.map(({ label, value, icon: Icon, change, color }) => (
          <div key={label} className="bg-white rounded-xl border border-slate-200 p-5 hover:border-slate-300 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</div>
              <Icon size={14} className="text-slate-300" />
            </div>
            <div className={`text-3xl font-bold ${color}`}>{value}</div>
            <div className="text-xs text-slate-400 mt-1">{change}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Axis A Pipeline funnel */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="text-sm font-semibold text-slate-900">Axis A Pipeline</div>
            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-semibold">End Users</span>
          </div>
          <div className="space-y-2.5">
            {pipeline.map(({ stage, count }) => (
              <div key={stage} className="flex items-center gap-3">
                <div className="w-20 text-xs text-slate-500 text-right flex-shrink-0">{stage}</div>
                <div className="flex-1 bg-slate-100 rounded-full h-5 overflow-hidden">
                  <div
                    className={`${stageBarColors[stage]} h-5 rounded-full transition-all`}
                    style={{ width: count > 0 ? `${(count / maxCount) * 100}%` : "0%" }}
                  />
                </div>
                <div className="w-5 text-xs font-bold text-slate-600 text-right flex-shrink-0">{count}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Activity Feed */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="text-sm font-semibold text-slate-900 mb-5">Recent Activity</div>
          <div className="space-y-4">
            {recentActivity.map(({ id, type, message, time, axis }) => (
              <div key={id} className="flex gap-3 items-start">
                <div className="text-lg leading-none mt-0.5">{activityIcons[type]}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-slate-700 leading-snug">{message}</div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-xs text-slate-400">{time}</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      axis === "A" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"
                    }`}>
                      Axis {axis}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
