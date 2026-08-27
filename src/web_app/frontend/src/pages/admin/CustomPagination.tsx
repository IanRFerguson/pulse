import { useEffect, useState } from 'react';

const PAGE_SIZE = 10;

export function usePagination<T>(items: T[]) {
    const [page, setPage] = useState(1);
    useEffect(() => {
        setPage(1);
    }, [items]);
    const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
    const paged = items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    return { page, setPage, totalPages, paged };
}

export function Pagination({
    page,
    totalPages,
    onPageChange,
}: {
    page: number;
    totalPages: number;
    onPageChange: (p: number) => void;
}) {
    if (totalPages <= 1) return null;
    return (
        <div className="pagination">
            <button
                className="pagination__btn"
                disabled={page === 1}
                onClick={() => onPageChange(page - 1)}
            >
                ← Prev
            </button>
            <span className="pagination__info">
                Page {page} of {totalPages}
            </span>
            <button
                className="pagination__btn"
                disabled={page === totalPages}
                onClick={() => onPageChange(page + 1)}
            >
                Next →
            </button>
        </div>
    );
}