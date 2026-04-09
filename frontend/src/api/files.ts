import { apiFetch } from "./client";
import type { FileItem, PagedResponse } from "@/types";

export function fetchFiles(offset: number, limit: number): Promise<PagedResponse<FileItem>> {
  return apiFetch(`/files?offset=${offset}&limit=${limit}`);
}

export function uploadFile(title: string, file: File): Promise<FileItem> {
  const formData = new FormData();
  formData.append("title", title);
  formData.append("file", file);
  return apiFetch("/files", { method: "POST", body: formData });
}
