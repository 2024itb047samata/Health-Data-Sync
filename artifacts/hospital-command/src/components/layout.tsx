import { Link, useLocation } from "wouter";
import { LayoutDashboard, Users, Stethoscope, Monitor } from "lucide-react";
import { useGetDashboardStats } from "@workspace/api-client-react";
import { cn } from "@/lib/utils";
import { useRealtime } from "@/hooks/useRealtime";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  useRealtime();

  const { data: stats } = useGetDashboardStats({
    query: {
      queryKey: ["/api/stats"],
      refetchInterval: 30000,
    }
  });

  const navItems = [
    { name: "Command Center", path: "/", icon: LayoutDashboard },
    { name: "Queue Management", path: "/queue", icon: Users, badge: stats?.totalWaiting },
    { name: "Doctors", path: "/doctors", icon: Stethoscope },
    { name: "Waiting Room", path: "/waiting-room", icon: Monitor, external: true },
  ];

  return (
    <div className="flex min-h-screen bg-background text-foreground relative overflow-hidden">
      <div className="absolute inset-0 floating-particles mix-blend-screen pointer-events-none" />

      {/* Sidebar */}
      <aside className="w-64 border-r border-border glass-panel relative z-10 flex flex-col flex-shrink-0">
        {/* Logo + Branding */}
        <div className="p-5 border-b border-border">
          <div className="flex items-center gap-3">
            {/* PulseOS cross logo */}
            <div className="w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center border border-primary/40 neon-glow-purple flex-shrink-0">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <rect x="7" y="1" width="4" height="16" rx="1" fill="currentColor" className="text-cyan-400" />
                <rect x="1" y="7" width="16" height="4" rx="1" fill="currentColor" className="text-purple-400" />
              </svg>
            </div>
            <div>
              <h1 className="font-bold text-sm tracking-widest text-white uppercase">PULSE OS</h1>
              <p className="text-[9px] text-cyan-400 font-mono tracking-wider">v2028.1 COMMAND</p>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-white/5">
            <p className="text-[9px] text-muted-foreground font-mono leading-relaxed">
              AIIMS NEW DELHI<br />
              OPD BLOCK B — SECTOR 12<br />
              <span className="text-emerald-400/70">● ABHA INTEGRATION ACTIVE</span>
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => {
            const isActive = location === item.path;
            const Icon = item.icon;

            return (
              <Link key={item.path} href={item.path} className="block">
                <div
                  className={cn(
                    "flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-200 cursor-pointer group",
                    isActive
                      ? "bg-primary/15 border border-primary/25 text-white"
                      : "text-muted-foreground hover:bg-white/5 hover:text-white border border-transparent"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={cn("w-4 h-4 transition-colors", isActive ? "text-cyan-400" : "text-muted-foreground group-hover:text-cyan-400/70")} />
                    <span className="font-medium text-sm">{item.name}</span>
                  </div>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="bg-cyan-500/20 text-cyan-400 px-1.5 py-0.5 rounded text-[10px] font-mono border border-cyan-500/30">
                      {item.badge}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Emergency stat + status */}
        <div className="p-3 space-y-2 border-t border-border">
          {stats && stats.emergencyCount > 0 && (
            <div className="bg-red-950/60 rounded-lg p-2.5 border border-red-500/30 flex items-center gap-2 pulse-emergency">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[10px] font-mono text-red-400">{stats.emergencyCount} EMERGENCY ACTIVE</span>
            </div>
          )}
          <div className="bg-black/40 rounded-lg p-2.5 border border-white/5 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-mono text-emerald-400">SYSTEM ONLINE</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative z-10 h-screen overflow-hidden">
        <div className="flex-1 overflow-auto p-7 relative">
          {children}
        </div>
      </main>
    </div>
  );
}
