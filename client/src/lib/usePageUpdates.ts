import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

export function usePageUpdates(slug?: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const eventSource = new EventSource("/api/notifications/stream");

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "page_updated") {
          if (!slug || data.slug === slug) {
            queryClient.invalidateQueries({ queryKey: [`/api/pages/${data.slug}`] });
          }
        }
      } catch {}
    };

    return () => {
      eventSource.close();
    };
  }, [slug, queryClient]);
}
