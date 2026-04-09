import { Button } from "react-bootstrap";

type Props = {
  page: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
};

export function Pagination({ page, total, pageSize, onPageChange }: Props) {
  const totalPages = Math.ceil(total / pageSize);
  if (totalPages <= 1) return null;

  return (
    <div className="d-flex align-items-center gap-2 mt-3">
      <Button
        variant="outline-secondary"
        size="sm"
        disabled={page === 0}
        onClick={() => onPageChange(page - 1)}
      >
        ←
      </Button>
      <span className="small text-secondary">
        {page + 1} / {totalPages}
      </span>
      <Button
        variant="outline-secondary"
        size="sm"
        disabled={page >= totalPages - 1}
        onClick={() => onPageChange(page + 1)}
      >
        →
      </Button>
    </div>
  );
}
