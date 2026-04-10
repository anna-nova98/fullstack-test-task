import { useState, useCallback } from "react";
import { fetchAlerts } from "@/api/alerts";
import type { AlertItem, PagedResponse } from "@/types";

const PAGE_SIZE = 10;

export function useAlerts() {
  const [data, setData] = useState<PagedResponse<AlertItem> | null>(null);
  const [page, setPage] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (pageIndex: number = 0) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetchAlerts(pageIndex * PAGE_SIZE, PAGE_SIZE);
      setData(result);
      setPage(pageIndex);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка загрузки алертов");
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { data, page, isLoading, error, load, pageSize: PAGE_SIZE };
}
