import { useGetDashboardStats, useListDepartments, useListActivity, useListInsights, useListPatients } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, AlertTriangle, CheckCircle2, Info, Users, Clock, Zap, Target } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats({
    query: { refetchInterval: 10000, queryKey: ["/api/dashboard/stats"] }
  });
  const { data: depts, isLoading: deptsLoading } = useListDepartments({
    query: { refetchInterval: 10000, queryKey: ["/api/departments"] }
  });
  const { data: activity, isLoading: activityLoading } = useListActivity({
    query: { refetchInterval: 5000, queryKey: ["/api/activity"] }
  });
  const { data: insights, isLoading: insightsLoading } = useListInsights({
    query: { refetchInterval: 15000, queryKey: ["/api/insights"] }
  });

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      <header className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            Command Center
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </h1>
          <p className="text-muted-foreground mt-1 font-mono text-sm">LIVE OPS / OVERVIEW</p>
        </div>
      </header>

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard title="Total Waiting" value={stats?.totalWaiting} icon={Users} loading={statsLoading} glowColor="cyan" />
        <StatCard title="Active Consults" value={stats?.totalActive} icon={Activity} loading={statsLoading} glowColor="purple" />
        <StatCard title="Avg Wait" value={`${stats?.avgWaitMinutes || 0}m`} icon={Clock} loading={statsLoading} />
        <StatCard title="Doctors Available" value={`${stats?.doctorsAvailable}/${stats?.doctorsTotal}`} icon={Target} loading={statsLoading} glowColor="emerald" />
        <StatCard title="Queue Velocity" value={`${stats?.queueVelocity || 0}/hr`} icon={Zap} loading={statsLoading} />
        <StatCard title="AI Health Score" value={stats?.aiHealthScore} icon={Activity} loading={statsLoading} isPercentage />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Overview */}
        <div className="lg:col-span-2 space-y-6">
          {/* Departments */}
          <div>
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-cyan-400" />
              Department Load
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {deptsLoading ? (
                Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-32 glass-panel rounded-xl" />)
              ) : (
                depts?.map(dept => (
                  <DepartmentCard key={dept.id} dept={dept} />
                ))
              )}
            </div>
          </div>

          {/* AI Insights */}
          <div>
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-purple-400" />
              AI Command Insights
            </h2>
            <div className="space-y-3">
              {insightsLoading ? (
                Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 glass-panel rounded-xl" />)
              ) : (
                insights?.map(insight => (
                  <InsightCard key={insight.id} insight={insight} />
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Feed */}
        <div className="space-y-6">
          <Card className="glass-panel border-white/10 h-[calc(100vh-12rem)] flex flex-col">
            <CardHeader className="border-b border-white/5 pb-4">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Activity className="w-5 h-5 text-cyan-400" />
                Live Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-0">
              <div className="divide-y divide-white/5">
                {activityLoading ? (
                  Array.from({ length: 10 }).map((_, i) => (
                    <div key={i} className="p-4"><Skeleton className="h-12 w-full" /></div>
                  ))
                ) : (
                  activity?.map(event => (
                    <div key={event.id} className="p-4 hover:bg-white/5 transition-colors">
                      <div className="flex items-start gap-3">
                        <EventIcon type={event.type} />
                        <div>
                          <p className="text-sm text-gray-200">{event.message}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-muted-foreground font-mono">
                              {formatDistanceToNow(new Date(event.timestamp), { addSuffix: true })}
                            </span>
                            {event.department && (
                              <span className="text-[10px] px-1.5 py-0.5 bg-white/10 rounded text-gray-400">
                                {event.department}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, loading, glowColor, isPercentage }: any) {
  return (
    <Card className={cn(
      "glass-panel relative overflow-hidden transition-all duration-500",
      glowColor === 'cyan' && "hover:neon-glow-cyan border-cyan-500/20 hover:border-cyan-500/50",
      glowColor === 'purple' && "hover:neon-glow-purple border-purple-500/20 hover:border-purple-500/50",
      glowColor === 'emerald' && "hover:neon-glow-emerald border-emerald-500/20 hover:border-emerald-500/50"
    )}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <Icon className={cn("w-4 h-4", 
            glowColor === 'cyan' ? "text-cyan-400" :
            glowColor === 'purple' ? "text-purple-400" :
            glowColor === 'emerald' ? "text-emerald-400" : "text-muted-foreground"
          )} />
        </div>
        <div className="mt-4 flex items-baseline gap-2">
          {loading ? (
            <Skeleton className="h-8 w-16" />
          ) : (
            <>
              <span className="text-3xl font-bold font-mono text-white tabular-nums">{value}</span>
              {isPercentage && <span className="text-sm text-muted-foreground">%</span>}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function DepartmentCard({ dept }: any) {
  const loadColors = {
    low: "bg-emerald-500 text-emerald-100 neon-glow-emerald",
    moderate: "bg-cyan-500 text-cyan-100 neon-glow-cyan",
    high: "bg-amber-500 text-amber-100 neon-glow-amber",
    critical: "bg-red-500 text-red-100 neon-glow-red pulse-emergency"
  };

  return (
    <Card className={cn("glass-panel relative overflow-hidden group", dept.loadLevel === 'critical' ? 'gradient-border pulse-emergency' : '')}>
      <CardContent className="p-5">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="font-semibold text-lg text-white">{dept.name}</h3>
            <p className="text-xs text-muted-foreground font-mono">{dept.code}</p>
          </div>
          <span className={cn("px-2 py-1 rounded text-xs font-semibold uppercase tracking-wider", loadColors[dept.loadLevel as keyof typeof loadColors])}>
            {dept.loadLevel}
          </span>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Waiting</p>
            <p className="text-xl font-mono text-white">{dept.waitingCount}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Wait Time</p>
            <p className="text-xl font-mono text-white">{dept.avgWaitMinutes}m</p>
          </div>
        </div>
      </CardContent>
      {/* Background Load Indicator */}
      <div 
        className="absolute bottom-0 left-0 h-1 transition-all duration-1000 ease-in-out"
        style={{ 
          width: `${Math.min((dept.waitingCount / 20) * 100, 100)}%`,
          backgroundColor: dept.loadLevel === 'critical' ? '#ef4444' : dept.loadLevel === 'high' ? '#f59e0b' : '#06b6d4'
        }}
      />
    </Card>
  );
}

function InsightCard({ insight }: any) {
  const icons = {
    warning: <AlertTriangle className="w-5 h-5 text-amber-400" />,
    critical: <AlertTriangle className="w-5 h-5 text-red-400" />,
    info: <Info className="w-5 h-5 text-cyan-400" />,
    success: <CheckCircle2 className="w-5 h-5 text-emerald-400" />
  };

  const borders = {
    warning: "border-amber-500/30 hover:border-amber-500/60",
    critical: "gradient-border pulse-emergency",
    info: "border-cyan-500/30 hover:border-cyan-500/60",
    success: "border-emerald-500/30 hover:border-emerald-500/60"
  };

  return (
    <div className={cn("glass-panel p-4 rounded-lg flex items-start gap-4 transition-all", borders[insight.type as keyof typeof borders])}>
      <div className="mt-1">{icons[insight.type as keyof typeof icons]}</div>
      <div className="flex-1">
        <h4 className="text-sm font-semibold text-white">{insight.title}</h4>
        <p className="text-sm text-muted-foreground mt-1">{insight.message}</p>
      </div>
      {insight.confidence && (
        <div className="text-xs font-mono text-cyan-400 bg-cyan-400/10 px-2 py-1 rounded">
          {insight.confidence}% CONF
        </div>
      )}
    </div>
  );
}

function EventIcon({ type }: { type: string }) {
  const map: Record<string, React.ReactNode> = {
    patient_added: <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 border border-cyan-500/30"><Users className="w-4 h-4" /></div>,
    patient_called: <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 border border-amber-500/30"><Activity className="w-4 h-4" /></div>,
    consultation_completed: <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 border border-emerald-500/30"><CheckCircle2 className="w-4 h-4" /></div>,
    emergency_arrived: <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center text-red-400 border border-red-500/30 animate-pulse"><AlertTriangle className="w-4 h-4" /></div>,
  };
  return map[type] || <div className="w-8 h-8 rounded-full bg-gray-500/20 flex items-center justify-center text-gray-400 border border-gray-500/30"><Info className="w-4 h-4" /></div>;
}
