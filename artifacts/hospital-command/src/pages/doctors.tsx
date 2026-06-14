import {
  useListDoctors,
  useCreateDoctor,
  useUpdateDoctor,
  getListDoctorsQueryKey,
  getGetDashboardStatsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Stethoscope, Plus, CheckCircle2, Coffee, WifiOff, Activity, UserCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const DEPARTMENTS = [
  "General Medicine",
  "Cardiology",
  "Orthopedics",
  "Pediatrics",
  "Emergency",
  "Neurology",
];

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType; glow: string }> = {
  available: {
    label: "Available",
    color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    icon: CheckCircle2,
    glow: "neon-glow-emerald",
  },
  busy: {
    label: "In Consultation",
    color: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    icon: Activity,
    glow: "neon-glow-purple",
  },
  break: {
    label: "On Break",
    color: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    icon: Coffee,
    glow: "",
  },
  offline: {
    label: "Offline",
    color: "bg-gray-500/20 text-gray-400 border-gray-500/30",
    icon: WifiOff,
    glow: "",
  },
};

export default function Doctors() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", specialty: "", department: "" });

  const { data: doctors, isLoading } = useListDoctors({
    query: { refetchInterval: 10000, queryKey: getListDoctorsQueryKey() },
  });

  const createDoctor = useCreateDoctor({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListDoctorsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardStatsQueryKey() });
        toast({ title: "Doctor added" });
        setOpen(false);
        setForm({ name: "", specialty: "", department: "" });
      },
    },
  });

  const updateDoctor = useUpdateDoctor({
    mutation: {
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: getListDoctorsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardStatsQueryKey() });
        toast({ title: `Dr. ${data.name} status updated` });
      },
    },
  });

  const available = (doctors ?? []).filter((d) => d.status === "available").length;
  const busy = (doctors ?? []).filter((d) => d.status === "busy").length;
  const total = (doctors ?? []).length;

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      <header className="flex items-end justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            Doctor Management
            <span className="inline-block w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
          </h1>
          <p className="text-muted-foreground mt-1 font-mono text-sm">MEDICAL STAFF / AVAILABILITY</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-purple-700 hover:bg-purple-600 text-white neon-glow-purple border border-purple-500/50">
              <Plus className="w-4 h-4 mr-2" />
              Add Doctor
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-panel border-white/10 bg-[#0a0f1e] text-white max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-white">Add Doctor</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div>
                <Label className="text-muted-foreground text-sm">Full Name *</Label>
                <Input
                  className="mt-1 bg-white/5 border-white/10 text-white placeholder:text-muted-foreground"
                  placeholder="Dr. Name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div>
                <Label className="text-muted-foreground text-sm">Specialty *</Label>
                <Input
                  className="mt-1 bg-white/5 border-white/10 text-white placeholder:text-muted-foreground"
                  placeholder="e.g. Cardiologist"
                  value={form.specialty}
                  onChange={(e) => setForm({ ...form, specialty: e.target.value })}
                />
              </div>
              <div>
                <Label className="text-muted-foreground text-sm">Department *</Label>
                <Select value={form.department} onValueChange={(v) => setForm({ ...form, department: v })}>
                  <SelectTrigger className="mt-1 bg-white/5 border-white/10 text-white">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0a0f1e] border-white/10 text-white">
                    {DEPARTMENTS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Button
                className="w-full bg-purple-700 hover:bg-purple-600 text-white border border-purple-500/50 neon-glow-purple"
                onClick={() => createDoctor.mutate({ data: form })}
                disabled={!form.name || !form.specialty || !form.department || createDoctor.isPending}
              >
                {createDoctor.isPending ? "Adding..." : "Add Doctor"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </header>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Available", value: available, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
          { label: "In Consultation", value: busy, color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20" },
          { label: "Total Staff", value: total, color: "text-cyan-400", bg: "bg-cyan-500/10 border-cyan-500/20" },
        ].map((s) => (
          <Card key={s.label} className={cn("glass-panel border", s.bg)}>
            <CardContent className="p-5 text-center">
              <p className="text-xs text-muted-foreground mb-2 font-mono uppercase tracking-wider">{s.label}</p>
              <p className={cn("text-4xl font-bold font-mono tabular-nums", s.color)}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Doctor Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-56 rounded-xl glass-panel" />)}
        </div>
      ) : (doctors ?? []).length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-20 h-20 rounded-full bg-purple-500/10 flex items-center justify-center mb-6 border border-purple-500/20 neon-glow-purple">
            <Stethoscope className="w-10 h-10 text-purple-400" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-2">No Doctors Registered</h3>
          <p className="text-muted-foreground text-sm mb-6">Add medical staff to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {(doctors ?? []).map((doctor) => {
            const cfg = STATUS_CONFIG[doctor.status] ?? STATUS_CONFIG.offline;
            const Icon = cfg.icon;
            return (
              <Card
                key={doctor.id}
                className={cn(
                  "glass-panel relative overflow-hidden transition-all duration-300 hover:scale-[1.02]",
                  doctor.status === "available" && "border-emerald-500/20 hover:border-emerald-500/40",
                  doctor.status === "busy" && "border-purple-500/20 hover:border-purple-500/40",
                  doctor.status !== "available" && doctor.status !== "busy" && "border-white/10"
                )}
              >
                <CardContent className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={cn("w-12 h-12 rounded-full flex items-center justify-center border", cfg.color)}>
                        <Stethoscope className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-white">Dr. {doctor.name}</h3>
                        <p className="text-xs text-muted-foreground">{doctor.specialty}</p>
                      </div>
                    </div>
                    <span className={cn("flex items-center gap-1.5 text-xs px-2 py-1 rounded-full border font-medium", cfg.color)}>
                      <Icon className="w-3 h-3" />
                      {cfg.label}
                    </span>
                  </div>

                  {/* Department */}
                  <div className="mb-4">
                    <span className="text-xs bg-white/5 text-muted-foreground px-2 py-1 rounded border border-white/10">
                      {doctor.department}
                    </span>
                  </div>

                  {/* Current Patient */}
                  {doctor.currentPatientName && (
                    <div className="mb-4 p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                      <p className="text-xs text-muted-foreground mb-1">Current Patient</p>
                      <p className="text-sm text-white font-medium flex items-center gap-2">
                        <UserCheck className="w-3 h-3 text-purple-400" />
                        {doctor.currentPatientName}
                      </p>
                    </div>
                  )}

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                      <p className="text-xs text-muted-foreground mb-1">Seen Today</p>
                      <p className="text-xl font-mono font-bold text-white">{doctor.patientsSeenToday}</p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                      <p className="text-xs text-muted-foreground mb-1">Avg. Time</p>
                      <p className="text-xl font-mono font-bold text-white">{doctor.avgConsultMinutes}m</p>
                    </div>
                  </div>

                  {/* Status Controls */}
                  <div className="flex gap-2 flex-wrap">
                    {(["available", "busy", "break", "offline"] as const)
                      .filter((s) => s !== doctor.status)
                      .map((s) => {
                        const sc = STATUS_CONFIG[s];
                        return (
                          <button
                            key={s}
                            onClick={() => updateDoctor.mutate({ id: doctor.id, data: { status: s } })}
                            className={cn(
                              "text-xs px-2.5 py-1 rounded-full border transition-all hover:scale-105",
                              sc.color,
                              "hover:opacity-80"
                            )}
                          >
                            {sc.label}
                          </button>
                        );
                      })}
                  </div>
                </CardContent>

                {/* Status glow bar */}
                <div className={cn(
                  "absolute bottom-0 left-0 right-0 h-0.5",
                  doctor.status === "available" && "bg-gradient-to-r from-emerald-500/0 via-emerald-500/70 to-emerald-500/0",
                  doctor.status === "busy" && "bg-gradient-to-r from-purple-500/0 via-purple-500/70 to-purple-500/0",
                  doctor.status === "break" && "bg-gradient-to-r from-amber-500/0 via-amber-500/70 to-amber-500/0",
                  doctor.status === "offline" && "bg-gradient-to-r from-gray-500/0 via-gray-500/30 to-gray-500/0"
                )} />
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
