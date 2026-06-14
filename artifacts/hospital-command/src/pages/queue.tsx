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
import {
  Users, Plus, ChevronRight, Trash2, CheckCircle2, Clock, Activity,
  Inbox, Shield, MapPin, Brain, ClipboardList, Stethoscope, Upload,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

const DEPARTMENTS = [
  "General Medicine", "Cardiology", "Orthopedics",
  "Pediatrics", "Emergency", "Neurology", "Dermatology", "Obstetrics",
];

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];

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

const JOURNEY_STEPS: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  registered: { label: "Registered", icon: ClipboardList, color: "text-cyan-400" },
  records_uploaded: { label: "Records Linked", icon: Upload, color: "text-purple-400" },
  ai_analyzed: { label: "AI Analyzed", icon: Brain, color: "text-violet-400" },
  doctor_assigned: { label: "Doctor Called", icon: Stethoscope, color: "text-amber-400" },
  completed: { label: "Completed", icon: CheckCircle2, color: "text-emerald-400" },
};

const defaultForm = {
  name: "", nameHindi: "", age: "", gender: "",
  phone: "", bloodGroup: "", abhaId: "",
  village: "", district: "", referredBy: "",
  department: "", priority: "normal", reason: "",
};

export default function Queue() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [lang, setLang] = useState<"en" | "hi">("en");

  const { data: patients, isLoading } = useListPatients({
    query: { refetchInterval: 15000, queryKey: getListPatientsQueryKey() },
  });

  const createPatient = useCreatePatient({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListPatientsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardStatsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListActivityQueryKey() });
        toast({ title: "Patient registered", description: form.abhaId ? `ABHA ${form.abhaId} linked — records loaded.` : "Added to queue successfully." });
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

  const filtered = (patients ?? []).filter((p) => {
    if (filterStatus !== "all" && p.status !== filterStatus) return false;
    if (filterPriority !== "all" && p.priority !== filterPriority) return false;
    return true;
  });

  function f(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      <header className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            Queue Management
            <span className="inline-block w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
          </h1>
          <p className="text-muted-foreground mt-1 font-mono text-xs">AIIMS NEW DELHI — OPD BLOCK B / LIVE QUEUE</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setLang(l => l === "en" ? "hi" : "en")}
            className="px-3 py-1.5 rounded text-xs font-mono border border-white/10 text-muted-foreground hover:border-cyan-500/40 hover:text-cyan-400 transition-colors"
          >
            {lang === "en" ? "हिंदी" : "English"}
          </button>
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
            <DialogContent className="glass-panel border-white/10 bg-[#060d1f] text-white max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-cyan-400" />
                  New Patient Registration
                </DialogTitle>
                <p className="text-xs text-muted-foreground font-mono">AIIMS NEW DELHI — OPD BLOCK B</p>
              </DialogHeader>

              <div className="space-y-5 mt-2">
                {/* ABHA ID — prominent first */}
                <div className="p-4 rounded-lg border border-cyan-500/20 bg-cyan-500/5">
                  <Label className="text-cyan-400 text-xs font-semibold flex items-center gap-1.5 mb-2">
                    <Shield className="w-3 h-3" />
                    ABHA ID (Ayushman Bharat Health Account)
                  </Label>
                  <Input
                    className="bg-white/5 border-white/10 text-white placeholder:text-muted-foreground font-mono"
                    placeholder="XX-XXXX-XXXX-XXXX"
                    value={form.abhaId}
                    onChange={(e) => f("abhaId", e.target.value)}
                  />
                  <p className="text-[10px] text-cyan-400/60 mt-1">Linking ABHA ID loads prior medical history and generates AI summary for doctor</p>
                </div>

                {/* Patient Name */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-muted-foreground text-sm">Full Name *</Label>
                    <Input
                      className="mt-1 bg-white/5 border-white/10 text-white placeholder:text-muted-foreground"
                      placeholder="Patient name"
                      value={form.name}
                      onChange={(e) => f("name", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-sm">नाम (हिंदी / बंगाली)</Label>
                    <Input
                      className="mt-1 bg-white/5 border-white/10 text-white placeholder:text-muted-foreground"
                      placeholder="रोगी का नाम"
                      value={form.nameHindi}
                      onChange={(e) => f("nameHindi", e.target.value)}
                    />
                  </div>
                </div>

                {/* Age + Gender + Blood Group */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label className="text-muted-foreground text-sm">Age</Label>
                    <Input
                      className="mt-1 bg-white/5 border-white/10 text-white placeholder:text-muted-foreground"
                      type="number" placeholder="Age"
                      value={form.age}
                      onChange={(e) => f("age", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-sm">Gender</Label>
                    <Select value={form.gender} onValueChange={(v) => f("gender", v)}>
                      <SelectTrigger className="mt-1 bg-white/5 border-white/10 text-white">
                        <SelectValue placeholder="Gender" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#060d1f] border-white/10 text-white">
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-sm">Blood Group</Label>
                    <Select value={form.bloodGroup} onValueChange={(v) => f("bloodGroup", v)}>
                      <SelectTrigger className="mt-1 bg-white/5 border-white/10 text-white">
                        <SelectValue placeholder="Group" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#060d1f] border-white/10 text-white">
                        {BLOOD_GROUPS.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <Label className="text-muted-foreground text-sm">Mobile Number</Label>
                  <Input
                    className="mt-1 bg-white/5 border-white/10 text-white placeholder:text-muted-foreground"
                    placeholder="+91 XXXXX XXXXX"
                    value={form.phone}
                    onChange={(e) => f("phone", e.target.value)}
                  />
                </div>

                {/* Village + District */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-muted-foreground text-sm flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> Village / Mohalla
                    </Label>
                    <Input
                      className="mt-1 bg-white/5 border-white/10 text-white placeholder:text-muted-foreground"
                      placeholder="e.g. Rohini Sector 5"
                      value={form.village}
                      onChange={(e) => f("village", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-sm">District</Label>
                    <Input
                      className="mt-1 bg-white/5 border-white/10 text-white placeholder:text-muted-foreground"
                      placeholder="e.g. North Delhi"
                      value={form.district}
                      onChange={(e) => f("district", e.target.value)}
                    />
                  </div>
                </div>

                {/* Referred By */}
                <div>
                  <Label className="text-muted-foreground text-sm">Referred By (PHC / CHC / Doctor)</Label>
                  <Input
                    className="mt-1 bg-white/5 border-white/10 text-white placeholder:text-muted-foreground"
                    placeholder="e.g. PHC Dwarka, Dr. Ramesh Gupta"
                    value={form.referredBy}
                    onChange={(e) => f("referredBy", e.target.value)}
                  />
                </div>

                {/* Department + Priority */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-muted-foreground text-sm">Department *</Label>
                    <Select value={form.department} onValueChange={(v) => f("department", v)}>
                      <SelectTrigger className="mt-1 bg-white/5 border-white/10 text-white">
                        <SelectValue placeholder="Select dept." />
                      </SelectTrigger>
                      <SelectContent className="bg-[#060d1f] border-white/10 text-white">
                        {DEPARTMENTS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-sm">Priority *</Label>
                    <Select value={form.priority} onValueChange={(v) => f("priority", v)}>
                      <SelectTrigger className="mt-1 bg-white/5 border-white/10 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#060d1f] border-white/10 text-white">
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                        <SelectItem value="emergency">🚨 Emergency</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Reason */}
                <div>
                  <Label className="text-muted-foreground text-sm">Chief Complaint / Reason</Label>
                  <Input
                    className="mt-1 bg-white/5 border-white/10 text-white placeholder:text-muted-foreground"
                    placeholder="e.g. Chest pain and breathlessness since 3 hours"
                    value={form.reason}
                    onChange={(e) => f("reason", e.target.value)}
                  />
                </div>

                <Button
                  className="w-full bg-cyan-600 hover:bg-cyan-500 text-white neon-glow-cyan border border-cyan-500/50"
                  onClick={() =>
                    createPatient.mutate({
                      data: {
                        name: form.name,
                        nameHindi: form.nameHindi || null,
                        department: form.department,
                        priority: form.priority as "normal" | "urgent" | "emergency",
                        reason: form.reason || null,
                        age: form.age ? Number(form.age) : null,
                        gender: form.gender || null,
                        phone: form.phone || null,
                        bloodGroup: form.bloodGroup || null,
                        abhaId: form.abhaId || null,
                        village: form.village || null,
                        district: form.district || null,
                        referredBy: form.referredBy || null,
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
      <div className="flex gap-2 flex-wrap items-center">
        {(["all", "waiting", "called", "consulting"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
              filterStatus === s
                ? "bg-cyan-500/20 text-cyan-400 border-cyan-500/40"
                : "bg-white/5 text-muted-foreground border-white/10 hover:text-white hover:bg-white/10"
            )}
          >
            {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
        <div className="w-px bg-white/10 mx-1 h-4" />
        {(["all", "normal", "urgent", "emergency"] as const).map((p) => (
          <button
            key={p}
            onClick={() => setFilterPriority(p)}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
              filterPriority === p
                ? "bg-purple-500/20 text-purple-300 border-purple-500/40"
                : "bg-white/5 text-muted-foreground border-white/10 hover:text-white hover:bg-white/10"
            )}
          >
            {p === "all" ? "All Priorities" : p.charAt(0).toUpperCase() + p.slice(1)}
          </button>
        ))}
      </div>

      {/* Queue List */}
      <Card className="glass-panel border-white/10">
        <CardHeader className="border-b border-white/5 pb-4">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Users className="w-4 h-4 text-cyan-400" />
            Active Queue
            {!isLoading && (
              <span className="ml-2 text-xs font-mono bg-cyan-500/10 text-cyan-400 px-2 py-0.5 rounded border border-cyan-500/20">
                {filtered.length}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-full bg-cyan-500/10 flex items-center justify-center mb-4 border border-cyan-500/20">
                <Inbox className="w-8 h-8 text-cyan-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Queue Ready</h3>
              <p className="text-muted-foreground text-sm mb-5">No patients match the current filters</p>
              <Button
                className="bg-cyan-600 hover:bg-cyan-500 text-white border border-cyan-500/50"
                onClick={() => setOpen(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Register Patient
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {filtered.map((patient) => {
                const isExpanded = expandedId === patient.id;
                const journey = JOURNEY_STEPS[patient.journeyStep] ?? JOURNEY_STEPS.registered;
                const JourneyIcon = journey.icon;
                return (
                  <div
                    key={patient.id}
                    className={cn(
                      "transition-all group",
                      patient.priority === "emergency" && "border-l-2 border-red-500 bg-red-500/5"
                    )}
                  >
                    <div
                      className="p-4 flex items-center gap-4 hover:bg-white/3 cursor-pointer"
                      onClick={() => setExpandedId(isExpanded ? null : patient.id)}
                    >
                      {/* Token */}
                      <div className="w-16 text-center flex-shrink-0">
                        <span className={cn(
                          "font-mono font-bold text-lg",
                          patient.priority === "emergency" ? "text-red-400" :
                          patient.priority === "urgent" ? "text-amber-400" : "text-cyan-400"
                        )}>
                          {patient.token}
                        </span>
                      </div>

                      {/* Name + details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-white font-semibold">
                            {lang === "hi" && patient.nameHindi ? patient.nameHindi : patient.name}
                          </span>
                          {patient.age && <span className="text-muted-foreground text-xs">{patient.age}y</span>}
                          {patient.gender && <span className="text-muted-foreground text-xs">{patient.gender}</span>}
                          {patient.bloodGroup && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-300 border border-red-500/20 font-mono">
                              {patient.bloodGroup}
                            </span>
                          )}
                          {patient.abhaId && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1 font-mono">
                              <Shield className="w-2.5 h-2.5" />
                              ABHA
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                          <span>{patient.department}</span>
                          {patient.village && (
                            <>
                              <span className="text-white/20">·</span>
                              <span className="flex items-center gap-0.5">
                                <MapPin className="w-2.5 h-2.5" />{patient.village}{patient.district ? `, ${patient.district}` : ""}
                              </span>
                            </>
                          )}
                          {patient.referredBy && (
                            <>
                              <span className="text-white/20">·</span>
                              <span>Ref: {patient.referredBy}</span>
                            </>
                          )}
                          {patient.reason && (
                            <span className="text-muted-foreground/60 truncate max-w-[180px]">— {patient.reason}</span>
                          )}
                        </div>
                      </div>

                      {/* Journey Step */}
                      <div className={cn("hidden lg:flex items-center gap-1 text-xs", journey.color)}>
                        <JourneyIcon className="w-3 h-3" />
                        <span className="font-mono">{journey.label}</span>
                      </div>

                      {/* Priority + Status badges */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={cn("text-[10px] px-2 py-0.5 rounded-full border font-semibold uppercase", PRIORITY_COLORS[patient.priority])}>
                          {patient.priority}
                        </span>
                        <span className={cn("text-[10px] px-2 py-0.5 rounded-full border font-medium", STATUS_COLORS[patient.status])}>
                          {patient.status}
                        </span>
                      </div>

                      {/* Wait time */}
                      <div className="hidden md:flex items-center gap-1 text-[10px] text-muted-foreground w-20 flex-shrink-0">
                        <Clock className="w-2.5 h-2.5" />
                        <span className="font-mono">{formatDistanceToNow(new Date(patient.createdAt), { addSuffix: true })}</span>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                        {patient.status === "waiting" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-amber-500/30 text-amber-400 hover:bg-amber-500/20 h-7 px-2.5 text-xs"
                            onClick={() => callPatient.mutate({ id: patient.id })}
                            disabled={callPatient.isPending}
                          >
                            <ChevronRight className="w-3 h-3 mr-1" /> Call
                          </Button>
                        )}
                        {(patient.status === "called" || patient.status === "consulting") && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 h-7 px-2.5 text-xs"
                            onClick={() => completeConsultation.mutate({ id: patient.id })}
                            disabled={completeConsultation.isPending}
                          >
                            <CheckCircle2 className="w-3 h-3 mr-1" /> Done
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-400/50 hover:text-red-400 hover:bg-red-500/10 h-7 w-7 p-0"
                          onClick={() => deletePatient.mutate({ id: patient.id })}
                          disabled={deletePatient.isPending}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>

                    {/* Expanded: AI Summary + ABHA details */}
                    {isExpanded && (
                      <div className="px-4 pb-4 ml-20 space-y-3">
                        {patient.aiSummary && (
                          <div className="p-3 rounded-lg bg-violet-500/5 border border-violet-500/20">
                            <p className="text-[10px] text-violet-400 font-mono mb-1.5 flex items-center gap-1">
                              <Brain className="w-3 h-3" /> AI CLINICAL SUMMARY
                            </p>
                            <p className="text-xs text-gray-300 leading-relaxed">{patient.aiSummary}</p>
                          </div>
                        )}
                        <div className="flex gap-4 text-xs text-muted-foreground flex-wrap">
                          {patient.abhaId && (
                            <span className="flex items-center gap-1 text-emerald-400 font-mono">
                              <Shield className="w-3 h-3" /> {patient.abhaId}
                            </span>
                          )}
                          {patient.phone && (
                            <span className="font-mono">📞 {patient.phone}</span>
                          )}
                          {patient.doctorName && (
                            <span className="flex items-center gap-1 text-purple-400">
                              <Activity className="w-3 h-3" /> {patient.doctorName}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
