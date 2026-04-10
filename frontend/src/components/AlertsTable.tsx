import { Spinner } from "react-bootstrap";
import type { AlertItem, PagedResponse } from "@/types";
import { Pagination } from "./Pagination";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ru-RU", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

function levelPill(level: string) {
  if (level === "critical") return <span className="pill pill-danger">{level}</span>;
  if (level === "warning")  return <span className="pill pill-warning">{level}</span>;
  return <span className="pill pill-info">{level}</span>;
}

type Props = {
  data: PagedResponse<AlertItem> | null;
  isLoading: boolean;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
};

export function AlertsTable({ data, isLoading, page, pageSize, onPageChange }: Props) {
  return (
    <>
      {isLoading ? (
        <div className="spinner-wrap"><Spinner animation="border" style={{ color: "var(--brand)" }} /></div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table className="app-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>File ID</th>
                <th>Уровень</th>
                <th>Сообщение</th>
                <th>Создан</th>
              </tr>
            </thead>
            <tbody>
              {!data || data.items.length === 0 ? (
                <tr className="empty-row"><td colSpan={5}>Алертов пока нет</td></tr>
              ) : (
                data.items.map((item) => (
                  <tr key={item.id}>
                    <td style={{ color: "var(--text-muted)", fontSize: ".8rem" }}>{item.id}</td>
                    <td style={{ color: "var(--text-muted)", fontSize: ".75rem", fontFamily: "monospace" }}>{item.file_id}</td>
                    <td>{levelPill(item.level)}</td>
                    <td>{item.message}</td>
                    <td style={{ whiteSpace: "nowrap", color: "var(--text-muted)", fontSize: ".8rem" }}>
                      {formatDate(item.created_at)}
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
