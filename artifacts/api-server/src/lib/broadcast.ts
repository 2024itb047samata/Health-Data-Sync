import type { Response } from "express";

const subscribers = new Set<Response>();

export function subscribe(res: Response): void {
  subscribers.add(res);
  res.on("close", () => subscribers.delete(res));
}

export function broadcast(event: string, data: unknown = {}): void {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const res of subscribers) {
    try {
      res.write(payload);
    } catch {
      subscribers.delete(res);
    }
  }
}
