import { apiFetch } from "./client";
import type { AlertItem, PagedResponse } from "@/types";

export function fetchAlerts(offset: number, limit: number): Promise<PagedResponse<AlertItem>> {
  return apiFetch(`/alerts?offset=${offset}&limit=${limit}`);
}
