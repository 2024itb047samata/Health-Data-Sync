import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

export function useRealtime() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const apiBase = (import.meta.env.VITE_API_URL as string | undefined)
      ? (import.meta.env.VITE_API_URL as string).replace(/\/+$/, "")
      : import.meta.env.BASE_URL.replace(/\/+$/, "");

    const url = `${apiBase}/api/events`;

    let source: EventSource;
    let retryTimer: ReturnType<typeof setTimeout>;

    function connect() {
      source = new EventSource(url);

      source.addEventListener("queue_updated", () => {
        queryClient.invalidateQueries({ queryKey: ["/api/patients"] });
        queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
        queryClient.invalidateQueries({ queryKey: ["/api/waiting-room"] });
        queryClient.invalidateQueries({ queryKey: ["/api/activity"] });
        queryClient.invalidateQueries({ queryKey: ["/api/departments"] });
      });

      source.onerror = () => {
        source.close();
        retryTimer = setTimeout(connect, 3000);
      };
    }

    connect();

    return () => {
      clearTimeout(retryTimer);
      source?.close();
    };
  }, [queryClient]);
}
