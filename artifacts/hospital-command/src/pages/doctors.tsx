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
import { Stethoscope, Plus, CheckCircle2, Coffee, WifiOff, Activity, UserCheck, Award, Hash } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const DEPARTMENTS = [
  "General Medicine", "Cardiology", "Orthopedics",
  "Pediatrics", "Emergency", "Neurology", "Dermatology", "Obstetrics",
];

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType; border: string }> = {
  available: {
    label: "Available",
    color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    border: "border-emerald-500/20 hover:border-emerald-500/50",
    icon: CheckCircle2,
  },
  busy: {
    label: "In Consultation",
    color: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    border: "border-purple-500/20 hover:border-purple-500/50",
    icon: Activity,
  },
  break: {
    label: "On Break",
    color: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    border: "border-amber-500/20",
    icon: Coffee,
  },
  offline: {
    label: "Offline",
    color: "bg-gray-500/20 text-gray-400 border-gray-500/30",
    border: "border-white/5",
    icon: WifiOff,
  },
};

export default function Doctors() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", specialty: "", department: "", qualification: "", registrationNo: "" });

  const { data: doctors, isLoading } = useListDoctors({
    query: { refetchInterval: 15000, queryKey: getListDoctorsQueryKey() },
  });

  const createDoctor = useCreateDoctor({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListDoctorsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardStatsQueryKey() });
        toast({ title: "Doctor registered", description: "Added to AIIMS staff directory." });
        setOpen(false);
        setForm({ name: "", specialty: "", department: "", qualification: "", registrationNo: "" });
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
  const consulting = (doctors ?? []).filter((d) => d.status === "busy").length;
  const onBreak = (doctors ?? []).filter((d) => d.status === "break").length;
  const total = (doctors ?? []).length;

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      <header className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            Doctor Management
            <span className="inline-block w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
          </h1>
          <p className="text-muted-foreground mt-1 font-mono text-xs">AIIMS NEW DELHI — MEDICAL STAFF DIRECTORY</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-purple-700 hover:bg-purple-600 text-white neon-glow-purple border border-purple-500/50">
              <Plus className="w-4 h-4 mr-2" />
              Add Doctor
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-panel border-white/10 bg-[#060d1f] text-white max-w-md">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-purple-400" />
                Register Doctor
              </DialogTitle>
              <p className="text-xs text-muted-foreground font-mono">AIIMS NEW DELHI — DMC Registration Required</p>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div>
                <Label className="text-muted-foreground text-sm">Full Name *</Label>
                <Input
                  className="mt-1 bg-white/5 border-white/10 text-white placeholder:text-muted-foreground"
                  placeholder="Dr. Full Name"
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
                  <SelectContent className="bg-[#060d1f] border-white/10 text-white">
                    {DEPARTMENTS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-muted-foreground text-sm flex items-center gap-1">
                  <Award className="w-3 h-3" /> Qualification
                </Label>
                <Input
                  className="mt-1 bg-white/5 border-white/10 text-white placeholder:text-muted-foreground"
                  placeholder="e.g. MBBS, MD (Cardiology), AIIMS"
                  value={form.qualification}
                  onChange={(e) => setForm({ ...form, qualification: e.target.value })}
                />
              </div>
              <div>
                <Label className="text-muted-foreground text-sm flex items-center gap-1">
                  <Hash className="w-3 h-3" /> DMC Registration No.
                </Label>
                <Input
                  className="mt-1 bg-white/5 border-white/10 text-white placeholder:text-muted-foreground font-mono"
                  placeholder="e.g. DMC-2024-XXXXX"
                  value={form.registrationNo}
                  onChange={(e) => setForm({ ...form, registrationNo: e.target.value })}
                />
              </div>
              <Button
                className="w-full bg-purple-700 hover:bg-purple-600 text-white border border-purple-500/50 neon-glow-purple"
                onClick={() => createDoctor.mutate({ data: form })}
                disabled={!form.name || !form.specialty || !form.department || createDoctor.isPending}
              >
                {createDoctor.isPending ? "Registering..." : "Register Doctor"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </header>

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Available", value: available, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
          { label: "Consulting", value: consulting, color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20" },
          { label: "On Break", value: onBreak, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
          { label: "Total Staff", value: total, color: "text-cyan-400", bg: "bg-cyan-500/10 border-cyan-500/20" },
        ].map((s) => (
          <Card key={s.label} className={cn("glass-panel border", s.bg)}>
            <CardContent className="p-4 text-center">
              <p className="text-[10px] text-muted-foreground mb-2 font-mono uppercase tracking-wider">{s.label}</p>
              <p className={cn("text-3xl font-bold font-mono tabular-nums", s.color)}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Doctor Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-64 rounded-xl glass-panel" />)}
        </div>
      ) : (doctors ?? []).length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-purple-500/10 flex items-center justify-center mb-4 border border-purple-500/20">
            <Stethoscope className="w-8 h-8 text-purple-400" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No Doctors Registered</h3>
          <p className="text-muted-foreground text-sm">Add medical staff to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {(doctors ?? []).map((doctor) => {
            const cfg = STATUS_CONFIG[doctor.status] ?? STATUS_CONFIG.offline;
            const Icon = cfg.icon;
            return (
              <Card
                key={doctor.id}
                className={cn("glass-panel relative overflow-hidden transition-all duration-300 hover:scale-[1.01]", cfg.border)}
              >
                <CardContent className="p-5">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={cn("w-11 h-11 rounded-full flex items-center justify-center border flex-shrink-0", cfg.color)}>
                        <Stethoscope className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-sm">{doctor.name}</h3>
                        <p className="text-xs text-muted-foreground">{doctor.specialty}</p>
                      </div>
                    </div>
                    <span className={cn("flex items-center gap-1 text-[10px] px-2 py-1 rounded-full border font-medium flex-shrink-0", cfg.color)}>
                      <Icon className="w-2.5 h-2.5" />
                      {cfg.label}
                    </span>
                  </div>

                  {/* Dept + Qualification */}
                  <div className="space-y-1.5 mb-4">
                    <span className="text-xs bg-white/5 text-muted-foreground px-2 py-0.5 rounded border border-white/10 inline-block">
                      {doctor.department}
                    </span>
                    {doctor.qualification && (
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground/70">
                        <Award className="w-2.5 h-2.5" />
                        {doctor.qualification}
                      </div>
                    )}
                    {doctor.registrationNo && (
                      <div className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground/50">
                        <Hash className="w-2.5 h-2.5" />
                        {doctor.registrationNo}
                      </div>
                    )}
                  </div>

                  {/* Current Patient */}
                  {doctor.currentPatientName && (
                    <div className="mb-4 p-2.5 rounded-lg bg-purple-500/10 border border-purple-500/20">
                      <p className="text-[10px] text-muted-foreground mb-1 font-mono">CURRENT PATIENT</p>
                      <p className="text-xs text-white font-medium flex items-center gap-1.5">
                        <UserCheck className="w-3 h-3 text-purple-400" />
                        {doctor.currentPatientName}
                      </p>
                    </div>
                  )}

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <div className="bg-white/5 rounded-lg p-2.5 border border-white/10">
                      <p className="text-[10px] text-muted-foreground mb-1 font-mono">SEEN TODAY</p>
                      <p className="text-xl font-mono font-bold text-white">{doctor.patientsSeenToday}</p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-2.5 border border-white/10">
                      <p className="text-[10px] text-muted-foreground mb-1 font-mono">AVG. TIME</p>
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
                            className={cn("text-[10px] px-2.5 py-1 rounded-full border transition-all hover:opacity-80", sc.color)}
                          >
                            {sc.label}
                          </button>
                        );
                      })}
                  </div>
                </CardContent>

                <div className={cn(
                  "absolute bottom-0 left-0 right-0 h-0.5",
                  doctor.status === "available" && "bg-gradient-to-r from-emerald-500/0 via-emerald-500/60 to-emerald-500/0",
                  doctor.status === "busy" && "bg-gradient-to-r from-purple-500/0 via-purple-500/60 to-purple-500/0",
                  doctor.status === "break" && "bg-gradient-to-r from-amber-500/0 via-amber-500/60 to-amber-500/0",
                  doctor.status === "offline" && "bg-gradient-to-r from-gray-500/0 via-gray-500/20 to-gray-500/0"
                )} />
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
