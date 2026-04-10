import { Spinner } from "react-bootstrap";
import type { FileItem, PagedResponse } from "@/types";
import { Pagination } from "./Pagination";
import { API_BASE } from "@/api/client";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ru-RU", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

function formatSize(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function statusPill(status: string) {
  if (status === "failed")    return <span className="pill pill-danger">{status}</span>;
  if (status === "processing") return <span className="pill pill-warning">{status}</span>;
  if (status === "processed")  return <span className="pill pill-success">{status}</span>;
  return <span className="pill pill-secondary">{status}</span>;
}

function scanPill(file: FileItem) {
  const label = file.scan_status ?? "pending";
  if (!file.scan_status)          return <span className="pill pill-secondary">{label}</span>;
  if (file.requires_attention)    return <span className="pill pill-warning">{label}</span>;
  return <span className="pill pill-success">{label}</span>;
}

type Props = {
  data: PagedResponse<FileItem> | null;
  isLoading: boolean;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
};

export function FilesTable({ data, isLoading, page, pageSize, onPageChange }: Props) {
  return (
    <>
      {isLoading ? (
        <div className="spinner-wrap"><Spinner animation="border" style={{ color: "var(--brand)" }} /></div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table className="app-table">
            <thead>
              <tr>
                <th>Название</th>
                <th>Файл</th>
                <th>MIME</th>
                <th>Размер</th>
                <th>Статус</th>
                <th>Проверка</th>
                <th>Создан</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {!data || data.items.length === 0 ? (
                <tr className="empty-row"><td colSpan={8}>Файлы пока не загружены</td></tr>
              ) : (
                data.items.map((file) => (
                  <tr key={file.id}>
                    <td>
                      <div className="cell-title">{file.title}</div>
                      <div className="cell-sub">{file.id}</div>
                    </td>
                    <td>{file.original_name}</td>
                    <td style={{ color: "var(--text-muted)", fontSize: ".8rem" }}>{file.mime_type}</td>
                    <td style={{ whiteSpace: "nowrap" }}>{formatSize(file.size)}</td>
                    <td>{statusPill(file.processing_status)}</td>
                    <td>
                      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        {scanPill(file)}
                        <span style={{ fontSize: ".72rem", color: "var(--text-muted)" }}>
                          {file.scan_details ?? "Ожидает обработки"}
                        </span>
                      </div>
                    </td>
                    <td style={{ whiteSpace: "nowrap", color: "var(--text-muted)", fontSize: ".8rem" }}>
                      {formatDate(file.created_at)}
                    </td>
                    <td>
                      <a href={`${API_BASE}/files/${file.id}/download`} className="btn-dl">
                        ↓ Скачать
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
      <Pagination page={page} total={data?.total ?? 0} pageSize={pageSize} onPageChange={onPageChange} />
    </>
  );
}
