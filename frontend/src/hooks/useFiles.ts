import { useState, useCallback } from "react";
import { fetchFiles } from "@/api/files";
import type { FileItem, PagedResponse } from "@/types";

const PAGE_SIZE = 10;

export function useFiles() {
  const [data, setData] = useState<PagedResponse<FileItem> | null>(null);
  const [page, setPage] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (pageIndex: number = 0) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetchFiles(pageIndex * PAGE_SIZE, PAGE_SIZE);
      setData(result);
      setPage(pageIndex);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка загрузки файлов");
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { data, page, isLoading, error, load, pageSize: PAGE_SIZE };
}
