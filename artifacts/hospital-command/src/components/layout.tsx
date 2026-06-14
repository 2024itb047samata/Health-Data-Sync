import { Link, useLocation } from "wouter";
import { LayoutDashboard, Users, Stethoscope, Monitor } from "lucide-react";
import { useGetDashboardStats } from "@workspace/api-client-react";
import { cn } from "@/lib/utils";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  const { data: stats } = useGetDashboardStats({
    query: {
      queryKey: ["/api/dashboard/stats"],
      refetchInterval: 10000,
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
      {/* Floating particles background */}
      <div className="absolute inset-0 floating-particles mix-blend-screen pointer-events-none" />

      {/* Sidebar */}
      <aside className="w-64 border-r border-border glass-panel relative z-10 flex flex-col">
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-primary/20 flex items-center justify-center border border-primary/50 neon-glow-purple">
              <LayoutDashboard className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-sm tracking-widest text-primary-foreground uppercase">PULSE OS</h1>
              <p className="text-[10px] text-cyan-400 font-mono">v2028.1 COMMAND</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const isActive = location === item.path;
            const Icon = item.icon;

            return (
              <Link key={item.path} href={item.path} className="block">
                <div
                  className={cn(
                    "flex items-center justify-between px-4 py-3 rounded-md transition-all duration-300 cursor-pointer group",
                    isActive 
                      ? "bg-primary/20 border border-primary/30 text-primary-foreground neon-glow-purple" 
                      : "text-muted-foreground hover:bg-white/5 hover:text-white border border-transparent"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={cn("w-5 h-5 transition-colors", isActive ? "text-cyan-400" : "text-muted-foreground group-hover:text-cyan-400/70")} />
                    <span className="font-medium text-sm">{item.name}</span>
                  </div>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="bg-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded text-xs font-mono border border-cyan-500/30 neon-glow-cyan">
                      {item.badge}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border">
          <div className="bg-black/40 rounded-lg p-3 border border-white/5 flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse neon-glow-emerald" />
            <span className="text-xs font-mono text-emerald-400">SYSTEM ONLINE</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative z-10 h-screen overflow-hidden">
        <div className="flex-1 overflow-auto p-8 relative">
          {children}
        </div>
      </main>
    </div>
  );
}
