import { useGetWaitingRoom, getGetWaitingRoomQueryKey } from "@workspace/api-client-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

export default function WaitingRoom() {
  const { data, isLoading } = useGetWaitingRoom({
    query: { refetchInterval: 5000, queryKey: getGetWaitingRoomQueryKey() },
  });

  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="min-h-screen bg-[#050816] text-white flex flex-col relative overflow-hidden">
      {/* Grid background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.025) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      {/* Glow orbs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Bar */}
      <header className="relative z-10 border-b border-white/5 px-12 py-6 flex items-center justify-between glass-panel">
        <div className="flex items-center gap-4">
          <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_12px_rgba(52,211,153,0.8)]" />
          <div>
            <h1 className="text-xl font-bold tracking-widest uppercase text-white">PULSE OS</h1>
            <p className="text-[10px] font-mono text-cyan-400 tracking-widest">PATIENT QUEUE DISPLAY v2028</p>
          </div>
        </div>

        {/* Live Clock */}
        <div className="text-right">
          <div className="text-5xl font-mono font-bold tabular-nums text-white tracking-tight" style={{ fontVariantNumeric: "tabular-nums" }}>
            {format(time, "HH:mm:ss")}
          </div>
          <div className="text-xs font-mono text-muted-foreground mt-1 tracking-widest uppercase">
            {format(time, "EEEE, dd MMMM yyyy")}
          </div>
        </div>

        {/* Queue count */}
        <div className="text-right">
          <p className="text-xs text-muted-foreground font-mono uppercase tracking-wider mb-1">In Queue</p>
          <p className="text-5xl font-mono font-bold text-cyan-400 tabular-nums"
             style={{ textShadow: "0 0 20px rgba(34,211,238,0.5)" }}>
            {isLoading ? "—" : (data?.totalInQueue ?? 0)}
          </p>
        </div>
      </header>

      <div className="flex-1 relative z-10 p-12 flex flex-col gap-10">
        {/* NOW SERVING */}
        <section>
          <div className="flex items-center gap-4 mb-6">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
            <h2 className="text-sm font-mono font-bold tracking-[0.4em] text-cyan-400 uppercase px-4">
              Now Serving
            </h2>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-40 glass-panel rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : (data?.nowServing ?? []).length === 0 ? (
            <div className="text-center py-10">
              <p className="text-2xl font-bold text-muted-foreground font-mono">— No active consultations —</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(data?.nowServing ?? []).map((token) => (
                <div
                  key={token.token}
                  className="relative rounded-2xl p-6 overflow-hidden border border-cyan-500/30 neon-glow-cyan"
                  style={{
                    background: "linear-gradient(135deg, rgba(6,182,212,0.1), rgba(124,58,237,0.1))",
                    boxShadow: "0 0 30px rgba(6,182,212,0.2), inset 0 1px 0 rgba(255,255,255,0.1)",
                  }}
                >
                  {/* Animated top bar */}
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-500 via-purple-500 to-cyan-500 animate-pulse" />

                  <div className="flex items-center justify-between mb-4">
                    <span
                      className="text-5xl font-mono font-black tabular-nums text-white"
                      style={{ textShadow: "0 0 30px rgba(34,211,238,0.8), 0 0 60px rgba(34,211,238,0.4)" }}
                    >
                      {token.token}
                    </span>
                    <span className="text-xs bg-cyan-500/20 text-cyan-400 px-3 py-1 rounded-full border border-cyan-500/30 font-mono uppercase tracking-wider">
                      {token.status}
                    </span>
                  </div>

                  <p className="text-lg font-semibold text-white/90 truncate">{token.name}</p>
                  <p className="text-sm text-muted-foreground mt-1">{token.department}</p>
                  {token.doctorName && (
                    <p className="text-xs text-cyan-400/80 mt-2 font-mono">Dr. {token.doctorName}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* NEXT UP */}
        <section>
          <div className="flex items-center gap-4 mb-6">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
            <h2 className="text-sm font-mono font-bold tracking-[0.4em] text-purple-400 uppercase px-4">
              Next Tokens
            </h2>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
          </div>

          {isLoading ? (
            <div className="flex gap-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex-1 h-28 glass-panel rounded-xl animate-pulse" />
              ))}
            </div>
          ) : (data?.nextTokens ?? []).length === 0 ? (
            <div className="text-center py-8">
              <p className="text-xl font-bold text-muted-foreground font-mono">— Queue is empty —</p>
            </div>
          ) : (
            <div className="flex gap-4 flex-wrap">
              {(data?.nextTokens ?? []).map((token, i) => (
                <div
                  key={token.token}
                  className={cn(
                    "flex-1 min-w-[180px] rounded-xl p-5 glass-panel border transition-all duration-500",
                    i === 0
                      ? "border-purple-500/50 bg-purple-500/10"
                      : "border-white/10 opacity-80"
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={cn(
                        "text-3xl font-mono font-black tabular-nums",
                        i === 0 ? "text-purple-300" : "text-white/60"
                      )}
                      style={i === 0 ? { textShadow: "0 0 20px rgba(139,92,246,0.8)" } : {}}
                    >
                      {token.token}
                    </span>
                    <span className="text-xs text-muted-foreground font-mono bg-white/5 px-2 py-0.5 rounded">
                      #{i + 1}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-white/80 truncate">{token.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{token.department}</p>
                  {token.estimatedMinutes && (
                    <p className="text-xs text-purple-400/80 mt-2 font-mono">~{token.estimatedMinutes}m wait</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Footer Status */}
        <footer className="mt-auto border-t border-white/5 pt-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">System Online</span>
          </div>
          {data?.estimatedClearTime && (
            <span className="text-xs font-mono text-muted-foreground">
              Est. clear: {format(new Date(data.estimatedClearTime), "HH:mm")}
            </span>
          )}
          <p className="text-xs font-mono text-muted-foreground tracking-widest uppercase">PulseOS — Queue Display</p>
        </footer>
      </div>
    </div>
  );
}
