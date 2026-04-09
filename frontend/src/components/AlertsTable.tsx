import { Badge, Spinner, Table } from "react-bootstrap";
import type { AlertItem, PagedResponse } from "@/types";
import { Pagination } from "./Pagination";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ru-RU", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

function getLevelVariant(level: string) {
  if (level === "critical") return "danger";
  if (level === "warning") return "warning";
  return "success";
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
        <div className="d-flex justify-content-center py-5">
          <Spinner animation="border" />
        </div>
      ) : (
        <div className="table-responsive">
          <Table hover bordered className="align-middle mb-0">
            <thead className="table-light">
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
                <tr>
                  <td colSpan={5} className="text-center py-4 text-secondary">
                    Алертов пока нет
                  </td>
                </tr>
              ) : (
                data.items.map((item) => (
                  <tr key={item.id}>
                    <td>{item.id}</td>
                    <td className="small">{item.file_id}</td>
                    <td>
                      <Badge bg={getLevelVariant(item.level)}>{item.level}</Badge>
                    </td>
                    <td>{item.message}</td>
                    <td>{formatDate(item.created_at)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </div>
      )}
      {data && (
        <Pagination
          page={page}
          total={data.total}
          pageSize={pageSize}
          onPageChange={onPageChange}
        />
      )}
    </>
  );
}
