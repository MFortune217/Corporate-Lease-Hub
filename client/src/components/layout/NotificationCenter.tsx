import { useState, useEffect, useRef } from "react";
import { Bell, CreditCard, Landmark, Bitcoin, DollarSign, CheckCircle2, AlertCircle, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient, getQueryFn } from "@/lib/queryClient";
import { useAuth } from "@/lib/authContext";
import type { Notification } from "@shared/schema";

function getMethodIcon(method: string | null) {
  if (!method) return <DollarSign className="h-4 w-4" />;
  switch (method.toUpperCase()) {
    case "CARD": return <CreditCard className="h-4 w-4" />;
    case "ACH": return <Landmark className="h-4 w-4" />;
    case "BTC":
    case "ETH":
    case "USDC":
    case "SOL": return <Bitcoin className="h-4 w-4" />;
    default: return <DollarSign className="h-4 w-4" />;
  }
}

function getTypeColor(type: string) {
  switch (type) {
    case "payment_received":
    case "payment_confirmed": return "bg-green-100 text-green-600";
    case "payout_processed": return "bg-blue-100 text-blue-600";
    case "payout_requested":
    case "payment_initiated": return "bg-amber-100 text-amber-600";
    case "payment_failed": return "bg-red-100 text-red-600";
    default: return "bg-gray-100 text-gray-600";
  }
}

function getTypeIcon(type: string) {
  switch (type) {
    case "payment_received":
    case "payment_confirmed": return <CheckCircle2 className="h-4 w-4" />;
    case "payment_failed": return <AlertCircle className="h-4 w-4" />;
    default: return <DollarSign className="h-4 w-4" />;
  }
}

function timeAgo(date: string | Date) {
  const now = new Date();
  const d = new Date(date);
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const { isAuthenticated, token } = useAuth();

  const { data: allNotifications = [] } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    refetchInterval: isAuthenticated ? 10000 : false,
    enabled: isAuthenticated,
  });

  const markReadMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("PATCH", `/api/notifications/${id}/read`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/notifications/read-all", {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
  });

  const esRef = useRef<EventSource | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      if (esRef.current) {
        esRef.current.close();
        esRef.current = null;
      }
      return;
    }

    let mounted = true;

    function connect() {
      if (esRef.current) {
        esRef.current.close();
        esRef.current = null;
      }
      const es = new EventSource("/api/notifications/stream");
      esRef.current = es;

      es.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type !== "connected") {
            queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
          }
        } catch {}
      };

      es.onerror = () => {
        es.close();
        esRef.current = null;
        if (mounted) {
          reconnectTimer.current = setTimeout(connect, 5000);
        }
      };
    }

    connect();

    return () => {
      mounted = false;
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      if (esRef.current) esRef.current.close();
    };
  }, [isAuthenticated]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const unreadCount = allNotifications.filter(n => !n.read).length;

  return (
    <div className="relative" ref={panelRef}>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(!open)}
        className="relative"
        data-testid="button-notifications-bell"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center animate-pulse" data-testid="badge-unread-count">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Button>

      {open && (
        <div className="absolute right-0 top-12 w-[380px] bg-background border rounded-xl shadow-xl z-50 overflow-hidden" data-testid="panel-notifications">
          <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm">Notifications</h3>
              {unreadCount > 0 && (
                <Badge variant="secondary" className="text-xs">{unreadCount} new</Badge>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs h-7"
                  onClick={() => markAllReadMutation.mutate()}
                  data-testid="button-mark-all-read"
                >
                  <Check className="h-3 w-3 mr-1" /> Mark all read
                </Button>
              )}
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="max-h-[400px] overflow-y-auto">
            {allNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Bell className="h-8 w-8 mb-2 opacity-30" />
                <p className="text-sm">No notifications yet</p>
              </div>
            ) : (
              allNotifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`flex items-start gap-3 px-4 py-3 border-b last:border-0 hover:bg-muted/30 transition-colors cursor-pointer ${!notif.read ? "bg-blue-50/50" : ""}`}
                  onClick={() => {
                    if (!notif.read) markReadMutation.mutate(notif.id);
                  }}
                  data-testid={`notification-item-${notif.id}`}
                >
                  <div className={`p-2 rounded-full shrink-0 mt-0.5 ${getTypeColor(notif.type)}`}>
                    {notif.method ? getMethodIcon(notif.method) : getTypeIcon(notif.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`text-sm ${!notif.read ? "font-bold" : "font-medium"}`}>{notif.title}</p>
                      {!notif.read && (
                        <span className="w-2 h-2 bg-blue-500 rounded-full shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notif.message}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {notif.method && (
                        <Badge variant="outline" className="text-[10px] h-4 px-1">{notif.method}</Badge>
                      )}
                      <Badge variant="outline" className="text-[10px] h-4 px-1 capitalize">{notif.portal}</Badge>
                      <span className="text-[10px] text-muted-foreground">{timeAgo(notif.createdAt)}</span>
                    </div>
                  </div>
                  {notif.amount && (
                    <p className={`text-sm font-bold shrink-0 ${notif.type.includes("received") || notif.type.includes("confirmed") ? "text-green-600" : ""}`}>
                      ${notif.amount.toLocaleString()}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
