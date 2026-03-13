import type { Response } from "express";
import type { Notification } from "@shared/schema";

const sseClients: Response[] = [];

export function addSSEClient(res: Response) {
  sseClients.push(res);
}

export function removeSSEClient(res: Response) {
  const idx = sseClients.indexOf(res);
  if (idx !== -1) sseClients.splice(idx, 1);
}

export function broadcastNotification(notification: Notification) {
  const data = JSON.stringify(notification);
  for (const client of sseClients) {
    client.write(`data: ${data}\n\n`);
  }
}

export function broadcastPageUpdate(slug: string) {
  const data = JSON.stringify({ type: "page_updated", slug });
  for (const client of sseClients) {
    client.write(`data: ${data}\n\n`);
  }
}
