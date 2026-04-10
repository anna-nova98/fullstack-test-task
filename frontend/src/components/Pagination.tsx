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
    <div className="pagination-bar">
      <button disabled={page === 0} onClick={() => onPageChange(page - 1)}>‹</button>
      <span>{page + 1} / {totalPages}</span>
      <button disabled={page >= totalPages - 1} onClick={() => onPageChange(page + 1)}>›</button>
    </div>
  );
}
