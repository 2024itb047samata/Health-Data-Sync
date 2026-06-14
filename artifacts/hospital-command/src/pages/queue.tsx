import { useState } from "react";
import {
  useListPatients,
  useCreatePatient,
  useDeletePatient,
  useCallPatient,
  useCompleteConsultation,
  useCallNextPatient,
  getListPatientsQueryKey,
  getGetDashboardStatsQueryKey,
  getListActivityQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Users, Plus, ChevronRight, Trash2, CheckCircle2, AlertTriangle, Clock, Activity, Inbox } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

const DEPARTMENTS = [
  "General Medicine",
  "Cardiology",
  "Orthopedics",
  "Pediatrics",
  "Emergency",
  "Neurology",
];

const STATUS_COLORS: Record<string, string> = {
  waiting: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  called: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  consulting: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  completed: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  cancelled: "bg-gray-500/20 text-gray-400 border-gray-500/30",
};

const PRIORITY_COLORS: Record<string, string> = {
  normal: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  urgent: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  emergency: "bg-red-500/20 text-red-400 border-red-500/30 pulse-emergency",
};

export default function Queue() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");

  const { data: patients, isLoading } = useListPatients({
    query: { refetchInterval: 8000, queryKey: getListPatientsQueryKey() },
  });

  const createPatient = useCreatePatient({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListPatientsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardStatsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListActivityQueryKey() });
        toast({ title: "Patient registered", description: "Added to queue successfully." });
        setOpen(false);
        setForm(defaultForm);
      },
    },
  });

  const deletePatient = useDeletePatient({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListPatientsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardStatsQueryKey() });
        toast({ title: "Patient removed" });
      },
    },
  });

  const callPatient = useCallPatient({
    mutation: {
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: getListPatientsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListActivityQueryKey() });
        toast({ title: `Token ${data.token} called`, description: `${data.name} — ${data.department}` });
      },
    },
  });

  const completeConsultation = useCompleteConsultation({
    mutation: {
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: getListPatientsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardStatsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListActivityQueryKey() });
        toast({ title: "Consultation complete", description: `${data.name} discharged.` });
      },
    },
  });

  const callNext = useCallNextPatient({
    mutation: {
      onSuccess: (result) => {
        queryClient.invalidateQueries({ queryKey: getListPatientsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListActivityQueryKey() });
        if (result.queueEmpty) {
          toast({ title: "Queue is empty" });
        } else {
          toast({ title: `Called ${result.patient?.name}`, description: result.message });
        }
      },
    },
  });

  const defaultForm = { name: "", department: "", priority: "normal", reason: "", age: "", gender: "" };
  const [form, setForm] = useState(defaultForm);

  const filtered = (patients ?? []).filter((p) => {
    if (filterStatus !== "all" && p.status !== filterStatus) return false;
    if (filterPriority !== "all" && p.priority !== filterPriority) return false;
    return true;
  });

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      <header className="flex items-end justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            Queue Management
            <span className="inline-block w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
          </h1>
          <p className="text-muted-foreground mt-1 font-mono text-sm">LIVE QUEUE / PATIENT OPS</p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="border-purple-500/30 text-purple-300 hover:bg-purple-500/20 hover:text-purple-200"
            onClick={() => callNext.mutate(undefined as unknown as void)}
            disabled={callNext.isPending}
          >
            <ChevronRight className="w-4 h-4 mr-2" />
            Call Next
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-cyan-600 hover:bg-cyan-500 text-white neon-glow-cyan border border-cyan-500/50">
                <Plus className="w-4 h-4 mr-2" />
                Register Patient
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-panel border-white/10 bg-[#0a0f1e] text-white max-w-md">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold text-white">New Patient Registration</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                <div>
                  <Label className="text-muted-foreground text-sm">Full Name *</Label>
                  <Input
                    className="mt-1 bg-white/5 border-white/10 text-white placeholder:text-muted-foreground"
                    placeholder="Patient name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-muted-foreground text-sm">Age</Label>
                    <Input
                      className="mt-1 bg-white/5 border-white/10 text-white placeholder:text-muted-foreground"
                      type="number"
                      placeholder="Age"
                      value={form.age}
                      onChange={(e) => setForm({ ...form, age: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-sm">Gender</Label>
                    <Select value={form.gender} onValueChange={(v) => setForm({ ...form, gender: v })}>
                      <SelectTrigger className="mt-1 bg-white/5 border-white/10 text-white">
                        <SelectValue placeholder="Gender" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0a0f1e] border-white/10 text-white">
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground text-sm">Department *</Label>
                  <Select value={form.department} onValueChange={(v) => setForm({ ...form, department: v })}>
                    <SelectTrigger className="mt-1 bg-white/5 border-white/10 text-white">
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0a0f1e] border-white/10 text-white">
                      {DEPARTMENTS.map((d) => (
                        <SelectItem key={d} value={d}>{d}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-muted-foreground text-sm">Priority *</Label>
                  <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                    <SelectTrigger className="mt-1 bg-white/5 border-white/10 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0a0f1e] border-white/10 text-white">
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                      <SelectItem value="emergency">Emergency</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-muted-foreground text-sm">Reason for Visit</Label>
                  <Input
                    className="mt-1 bg-white/5 border-white/10 text-white placeholder:text-muted-foreground"
                    placeholder="Brief reason"
                    value={form.reason}
                    onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  />
                </div>
                <Button
                  className="w-full bg-cyan-600 hover:bg-cyan-500 text-white neon-glow-cyan border border-cyan-500/50"
                  onClick={() =>
                    createPatient.mutate({
                      data: {
                        name: form.name,
                        department: form.department,
                        priority: form.priority as "normal" | "urgent" | "emergency",
                        reason: form.reason || null,
                        age: form.age ? Number(form.age) : null,
                        gender: form.gender || null,
                      },
                    })
                  }
                  disabled={!form.name || !form.department || createPatient.isPending}
                >
                  {createPatient.isPending ? "Registering..." : "Register Patient"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        {(["all", "waiting", "called", "consulting"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={cn(
              "px-4 py-1.5 rounded-full text-sm font-medium border transition-all",
              filterStatus === s
                ? "bg-cyan-500/20 text-cyan-400 border-cyan-500/40 neon-glow-cyan"
                : "bg-white/5 text-muted-foreground border-white/10 hover:text-white hover:bg-white/10"
            )}
          >
            {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
        <div className="w-px bg-white/10 mx-1" />
        {(["all", "normal", "urgent", "emergency"] as const).map((p) => (
          <button
            key={p}
            onClick={() => setFilterPriority(p)}
            className={cn(
              "px-4 py-1.5 rounded-full text-sm font-medium border transition-all",
              filterPriority === p
                ? "bg-purple-500/20 text-purple-300 border-purple-500/40 neon-glow-purple"
                : "bg-white/5 text-muted-foreground border-white/10 hover:text-white hover:bg-white/10"
            )}
          >
            {p === "all" ? "All Priorities" : p.charAt(0).toUpperCase() + p.slice(1)}
          </button>
        ))}
      </div>

      {/* Patient List */}
      <Card className="glass-panel border-white/10">
        <CardHeader className="border-b border-white/5 pb-4">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Users className="w-5 h-5 text-cyan-400" />
            Active Queue
            {!isLoading && (
              <span className="ml-2 text-sm font-mono bg-cyan-500/10 text-cyan-400 px-2 py-0.5 rounded border border-cyan-500/20">
                {filtered.length}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full rounded-lg" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-20 h-20 rounded-full bg-cyan-500/10 flex items-center justify-center mb-6 border border-cyan-500/20 neon-glow-cyan">
                <Inbox className="w-10 h-10 text-cyan-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Queue Ready</h3>
              <p className="text-muted-foreground text-sm mb-6">Awaiting new patients</p>
              <Button
                className="bg-cyan-600 hover:bg-cyan-500 text-white border border-cyan-500/50 neon-glow-cyan"
                onClick={() => setOpen(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Register First Patient
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {filtered.map((patient) => (
                <div
                  key={patient.id}
                  className={cn(
                    "p-5 flex items-center gap-5 hover:bg-white/3 transition-all group",
                    patient.priority === "emergency" && "border-l-2 border-red-500 bg-red-500/5"
                  )}
                >
                  {/* Token */}
                  <div className="w-20 text-center">
                    <span className={cn(
                      "font-mono font-bold text-lg",
                      patient.priority === "emergency" ? "text-red-400" :
                      patient.priority === "urgent" ? "text-amber-400" : "text-cyan-400"
                    )}>
                      {patient.token}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-white font-semibold truncate">{patient.name}</span>
                      {patient.age && <span className="text-muted-foreground text-sm">{patient.age}y</span>}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-muted-foreground">{patient.department}</span>
                      {patient.reason && (
                        <span className="text-xs text-muted-foreground/60 truncate max-w-[200px]">— {patient.reason}</span>
                      )}
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="flex items-center gap-2">
                    <span className={cn("text-xs px-2 py-0.5 rounded-full border font-semibold uppercase tracking-wider", PRIORITY_COLORS[patient.priority])}>
                      {patient.priority}
                    </span>
                    <span className={cn("text-xs px-2 py-0.5 rounded-full border font-medium", STATUS_COLORS[patient.status])}>
                      {patient.status}
                    </span>
                  </div>

                  {/* Wait time */}
                  <div className="hidden md:flex items-center gap-1.5 text-xs text-muted-foreground w-24">
                    <Clock className="w-3 h-3" />
                    <span className="font-mono">{formatDistanceToNow(new Date(patient.createdAt), { addSuffix: true })}</span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {patient.status === "waiting" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-amber-500/30 text-amber-400 hover:bg-amber-500/20 h-8 px-3"
                        onClick={() => callPatient.mutate({ id: patient.id })}
                        disabled={callPatient.isPending}
                      >
                        <ChevronRight className="w-3 h-3 mr-1" />
                        Call
                      </Button>
                    )}
                    {(patient.status === "called" || patient.status === "consulting") && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 h-8 px-3"
                        onClick={() => completeConsultation.mutate({ id: patient.id })}
                        disabled={completeConsultation.isPending}
                      >
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Complete
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-400/60 hover:text-red-400 hover:bg-red-500/10 h-8 w-8 p-0"
                      onClick={() => deletePatient.mutate({ id: patient.id })}
                      disabled={deletePatient.isPending}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
