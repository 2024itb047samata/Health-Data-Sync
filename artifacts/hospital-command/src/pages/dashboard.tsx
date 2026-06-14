import {
  useGetDashboardStats,
  useListDepartments,
  useListActivity,
  useListInsights,
  useListPatients,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Info,
  Users,
  Clock,
  Zap,
  Target,
  ClipboardList,
  Upload,
  Brain,
  Stethoscope,
  Bell,
  ChevronRight,
  MapPin,
  Shield,
  TrendingUp,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useRealtime } from "@/hooks/useRealtime";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const JOURNEY_STEPS = [
  { key: "registered", label: "Register Patient", icon: ClipboardList, desc: "ABHA ID + vitals captured", color: "cyan" },
  { key: "records_uploaded", label: "Upload Records", icon: Upload, desc: "Previous history linked", color: "purple" },
  { key: "ai_analyzed", label: "AI Analysis", icon: Brain, desc: "Summary sent to doctor", color: "violet" },
  { key: "doctor_assigned", label: "Doctor Review", icon: Stethoscope, desc: "Consultation in progress", color: "amber" },
  { key: "completed", label: "Discharge", icon: CheckCircle2, desc: "Prescription & follow-up", color: "emerald" },
];

export default function Dashboard() {
  useRealtime();
  const [lang, setLang] = useState<"en" | "hi">("en");

  const { data: stats, isLoading: statsLoading } = useGetDashboardStats({
    query: { refetchInterval: 30000, queryKey: ["/api/stats"] },
  });
  const { data: depts, isLoading: deptsLoading } = useListDepartments({
    query: { refetchInterval: 30000, queryKey: ["/api/departments"] },
  });
  const { data: activity, isLoading: activityLoading } = useListActivity({
    query: { refetchInterval: 15000, queryKey: ["/api/activity"] },
  });
  const { data: insights, isLoading: insightsLoading } = useListInsights({
    query: { refetchInterval: 30000, queryKey: ["/api/insights"] },
  });
  const { data: patients } = useListPatients({
    query: { refetchInterval: 15000, queryKey: ["/api/patients"] },
  });

  const emergencies = patients?.filter((p) => p.priority === "emergency") ?? [];
  const criticalInsights = insights?.filter((i) => i.type === "critical") ?? [];

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <header className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-bold text-white tracking-tight">Command Center</h1>
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <div className="flex items-center gap-3">
            <p className="text-muted-foreground font-mono text-xs">AIIMS NEW DELHI — OPD BLOCK B</p>
            <span className="text-white/20">|</span>
            <MapPin className="w-3 h-3 text-cyan-400" />
            <p className="text-muted-foreground font-mono text-xs">SECTOR 12, ANSARI NAGAR</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setLang(l => l === "en" ? "hi" : "en")}
            className="px-3 py-1.5 rounded text-xs font-mono border border-white/10 text-muted-foreground hover:border-cyan-500/40 hover:text-cyan-400 transition-colors"
          >
            {lang === "en" ? "हिंदी" : "English"}
          </button>
          <div className="text-right">
            <p className="text-xs text-muted-foreground font-mono">ABHA INTEGRATION</p>
            <p className="text-xs text-emerald-400 font-mono flex items-center gap-1 justify-end">
              <Shield className="w-3 h-3" /> ACTIVE
            </p>
          </div>
        </div>
      </header>

      {/* Emergency Alert Banner */}
      {(emergencies.length > 0 || criticalInsights.length > 0) && (
        <div className="gradient-border pulse-emergency rounded-xl overflow-hidden">
          <div className="bg-red-950/60 backdrop-blur-sm p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-red-500/20 border border-red-500/50 flex items-center justify-center animate-pulse">
              <Bell className="w-5 h-5 text-red-400" />
            </div>
            <div className="flex-1">
              <p className="text-red-300 font-semibold text-sm uppercase tracking-wider">
                🚨 Emergency Alert — {emergencies.length} critical patient{emergencies.length !== 1 ? "s" : ""} in queue
              </p>
              {emergencies.map((e) => (
                <p key={e.id} className="text-red-400/80 text-xs font-mono mt-0.5">
                  Token {e.token} — {lang === "hi" && e.nameHindi ? e.nameHindi : e.name} — {e.reason} — {e.department}
                </p>
              ))}
            </div>
            <span className="text-red-400 text-xs font-mono bg-red-500/10 px-3 py-1.5 rounded border border-red-500/20">
              PROTOCOL ALPHA
            </span>
          </div>
        </div>
      )}

      {/* Patient Journey Flow */}
      <div className="glass-panel rounded-xl p-6 border border-white/10">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-cyan-400" />
            Patient Workflow
          </h2>
          <span className="text-xs font-mono text-muted-foreground">
            {patients?.length ?? 0} active patients across {JOURNEY_STEPS.length} stages
          </span>
        </div>
        <div className="flex items-start gap-0 overflow-x-auto pb-2">
          {JOURNEY_STEPS.map((step, i) => {
            const Icon = step.icon;
            const count = patients?.filter((p) => p.journeyStep === step.key).length ?? 0;
            const isLast = i === JOURNEY_STEPS.length - 1;
            const glowMap: Record<string, string> = {
              cyan: "border-cyan-500/40 text-cyan-400 bg-cyan-500/10",
              purple: "border-purple-500/40 text-purple-400 bg-purple-500/10",
              violet: "border-violet-500/40 text-violet-400 bg-violet-500/10",
              amber: "border-amber-500/40 text-amber-400 bg-amber-500/10",
              emerald: "border-emerald-500/40 text-emerald-400 bg-emerald-500/10",
            };
            const colorClass = glowMap[step.color];
            return (
              <div key={step.key} className="flex items-center flex-1 min-w-[160px]">
                <div className={cn("flex-1 p-4 rounded-lg border transition-all", colorClass, count > 0 ? "opacity-100" : "opacity-40")}>
                  <div className="flex items-center justify-between mb-2">
                    <Icon className="w-4 h-4" />
                    {count > 0 && (
                      <span className="text-xs font-mono bg-white/10 px-1.5 py-0.5 rounded-full">{count}</span>
                    )}
                  </div>
                  <p className="text-xs font-semibold text-white leading-tight">{step.label}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{step.desc}</p>
                </div>
                {!isLast && (
                  <ChevronRight className="w-4 h-4 text-white/20 flex-shrink-0 mx-1" />
                )}
              </div>
            );
          })}
        </div>
        {/* Active patients in journey */}
        {patients && patients.filter(p => p.journeyStep !== "completed").length > 0 && (
          <div className="mt-4 pt-4 border-t border-white/5">
            <p className="text-xs text-muted-foreground font-mono mb-2 uppercase tracking-wider">Active Journey Snapshots</p>
            <div className="flex flex-wrap gap-2">
              {patients.filter(p => p.journeyStep !== "completed").slice(0, 4).map(p => (
                <div key={p.id} className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs",
                  p.priority === "emergency" ? "border-red-500/40 bg-red-500/10 text-red-300" :
                  p.priority === "urgent" ? "border-amber-500/40 bg-amber-500/10 text-amber-300" :
                  "border-white/10 bg-white/5 text-gray-300"
                )}>
                  <span className="font-mono font-bold">{p.token}</span>
                  <span>{lang === "hi" && p.nameHindi ? p.nameHindi : p.name}</span>
                  {p.abhaId && <Shield className="w-3 h-3 text-emerald-400" />}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <StatCard title="Waiting" value={stats?.totalWaiting} icon={Users} loading={statsLoading} glowColor="cyan" />
        <StatCard title="Consulting" value={stats?.totalActive} icon={Activity} loading={statsLoading} glowColor="purple" />
        <StatCard title="Avg Wait" value={`${stats?.avgWaitMinutes ?? 0}m`} icon={Clock} loading={statsLoading} />
        <StatCard title="Doctors On" value={`${stats?.doctorsAvailable ?? 0}/${stats?.doctorsTotal ?? 0}`} icon={Target} loading={statsLoading} glowColor="emerald" />
        <StatCard title="Emergencies" value={stats?.emergencyCount} icon={AlertTriangle} loading={statsLoading} glowColor="red" />
        <StatCard title="AI Score" value={stats?.aiHealthScore} icon={Brain} loading={statsLoading} isPercentage />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Departments + Insights */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-cyan-400" />
              Department Load
              <span className="text-xs font-mono text-muted-foreground ml-auto">AIIMS OPD Block B</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {deptsLoading
                ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)
                : depts?.map((dept) => <DepartmentCard key={dept.id} dept={dept} />)}
            </div>
          </div>

          {/* AI Insights */}
          <div>
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-400" />
              AI Command Insights
              <span className="text-xs font-mono text-muted-foreground ml-auto">PulseOS v2028</span>
            </h2>
            <div className="space-y-3">
              {insightsLoading
                ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)
                : insights?.map((insight) => <InsightCard key={insight.id} insight={insight} />)}
            </div>
          </div>
        </div>

        {/* Right: Live Activity Feed */}
        <div>
          <Card className="glass-panel border-white/10 h-[calc(100vh-14rem)] flex flex-col">
            <CardHeader className="border-b border-white/5 pb-4 flex-shrink-0">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                Live Activity
                <span className="ml-auto w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-0">
              <div className="divide-y divide-white/5">
                {activityLoading
                  ? Array.from({ length: 8 }).map((_, i) => (
                      <div key={i} className="p-4">
                        <Skeleton className="h-12 w-full" />
                      </div>
                    ))
                  : activity?.map((event) => (
                      <div key={event.id} className="p-4 hover:bg-white/5 transition-colors">
                        <div className="flex items-start gap-3">
                          <EventIcon type={event.type} />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-200 leading-relaxed">{event.message}</p>
                            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                              <span className="text-[10px] text-muted-foreground font-mono">
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
                    ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, loading, glowColor, isPercentage }: any) {
  const borderClass =
    glowColor === "cyan" ? "border-cyan-500/20 hover:border-cyan-500/50" :
    glowColor === "purple" ? "border-purple-500/20 hover:border-purple-500/50" :
    glowColor === "emerald" ? "border-emerald-500/20 hover:border-emerald-500/50" :
    glowColor === "red" ? "border-red-500/20 hover:border-red-500/50" :
    "border-white/10";
  const iconClass =
    glowColor === "cyan" ? "text-cyan-400" :
    glowColor === "purple" ? "text-purple-400" :
    glowColor === "emerald" ? "text-emerald-400" :
    glowColor === "red" ? "text-red-400" :
    "text-muted-foreground";
  return (
    <Card className={cn("glass-panel relative overflow-hidden transition-all duration-300", borderClass)}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
          <Icon className={cn("w-4 h-4", iconClass)} />
        </div>
        {loading ? (
          <Skeleton className="h-7 w-14" />
        ) : (
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold font-mono text-white tabular-nums">{value}</span>
            {isPercentage && <span className="text-xs text-muted-foreground">%</span>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function DepartmentCard({ dept }: any) {
  const loadColors: Record<string, string> = {
    low: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    moderate: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
    high: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    critical: "bg-red-500/20 text-red-300 border-red-500/30 pulse-emergency",
  };
  return (
    <Card className={cn("glass-panel relative overflow-hidden", dept.loadLevel === "critical" ? "gradient-border" : "border-white/10")}>
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="font-semibold text-sm text-white">{dept.name}</h3>
            <p className="text-[10px] text-muted-foreground font-mono">{dept.code}</p>
          </div>
          <span className={cn("px-2 py-0.5 rounded text-[10px] font-semibold uppercase border", loadColors[dept.loadLevel] ?? loadColors.moderate)}>
            {dept.loadLevel}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <p className="text-[10px] text-muted-foreground mb-0.5">Waiting</p>
            <p className="text-lg font-mono text-white">{dept.waitingCount}</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground mb-0.5">Avg Wait</p>
            <p className="text-lg font-mono text-white">{dept.avgWaitMinutes}m</p>
          </div>
        </div>
      </CardContent>
      <div
        className="absolute bottom-0 left-0 h-0.5 transition-all duration-1000"
        style={{
          width: `${Math.min((dept.waitingCount / 10) * 100, 100)}%`,
          backgroundColor: dept.loadLevel === "critical" ? "#ef4444" : dept.loadLevel === "high" ? "#f59e0b" : "#06b6d4",
        }}
      />
    </Card>
  );
}

function InsightCard({ insight }: any) {
  const icons: Record<string, React.ReactNode> = {
    warning: <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />,
    critical: <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 animate-pulse" />,
    info: <Info className="w-4 h-4 text-cyan-400 flex-shrink-0" />,
    success: <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />,
  };
  const borders: Record<string, string> = {
    warning: "border-amber-500/20 hover:border-amber-500/40",
    critical: "border-red-500/30 pulse-emergency",
    info: "border-cyan-500/20 hover:border-cyan-500/40",
    success: "border-emerald-500/20 hover:border-emerald-500/40",
  };
  return (
    <div className={cn("glass-panel p-4 rounded-lg flex items-start gap-3 transition-all border", borders[insight.type] ?? borders.info)}>
      <div className="mt-0.5">{icons[insight.type]}</div>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-semibold text-white">{insight.title}</h4>
        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{insight.message}</p>
      </div>
      {insight.confidence && (
        <div className="text-[10px] font-mono text-cyan-400 bg-cyan-400/10 px-2 py-1 rounded border border-cyan-500/20 flex-shrink-0">
          {insight.confidence}% CONF
        </div>
      )}
    </div>
  );
}

function EventIcon({ type }: { type: string }) {
  const map: Record<string, React.ReactNode> = {
    patient_added: <div className="w-7 h-7 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 border border-cyan-500/30 flex-shrink-0"><Users className="w-3 h-3" /></div>,
    patient_called: <div className="w-7 h-7 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 border border-amber-500/30 flex-shrink-0"><Bell className="w-3 h-3" /></div>,
    consultation_completed: <div className="w-7 h-7 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 border border-emerald-500/30 flex-shrink-0"><CheckCircle2 className="w-3 h-3" /></div>,
    emergency_arrived: <div className="w-7 h-7 rounded-full bg-red-500/20 flex items-center justify-center text-red-400 border border-red-500/30 animate-pulse flex-shrink-0"><AlertTriangle className="w-3 h-3" /></div>,
    doctor_available: <div className="w-7 h-7 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 border border-emerald-500/30 flex-shrink-0"><Stethoscope className="w-3 h-3" /></div>,
  };
  return map[type] ?? <div className="w-7 h-7 rounded-full bg-gray-500/20 flex items-center justify-center text-gray-400 border border-gray-500/30 flex-shrink-0"><Info className="w-3 h-3" /></div>;
}
