import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface AdminPaginationProps {
  currentPage: number;
  totalItems: number;
  itemsPerPage?: number;
  pageSize?: number;
  totalPages?: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange?: (perPage: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
  className?: string;
}

export function AdminPagination({
  currentPage,
  totalItems,
  itemsPerPage: itemsPerPageProp,
  pageSize: pageSizeProp,
  totalPages: totalPagesProp,
  onPageChange,
  onItemsPerPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50],
  className = '',
}: AdminPaginationProps) {
  const effectivePageSize = itemsPerPageProp || pageSizeProp || 25;
  const calculatedTotalPages = Math.max(1, Math.ceil(totalItems / effectivePageSize));
  const totalPages = totalPagesProp || calculatedTotalPages;
  const startIndex = totalItems === 0 ? 0 : (currentPage - 1) * effectivePageSize + 1;
  const endIndex = Math.min(currentPage * effectivePageSize, totalItems);

  const handleSizeChange = (newSize: number) => {
    if (onItemsPerPageChange) onItemsPerPageChange(newSize);
    if (onPageSizeChange) onPageSizeChange(newSize);
  };

  // Generate page numbers with ellipsis
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-[#0A2528]/80 border-t border-white/5 rounded-b-xl text-xs font-sans text-[#FAF8F5]/80 select-none ${className}`}
    >
      {/* Results Counter & Page Size */}
      <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
        <span className="text-[11px] text-[#FAF8F5]/60">
          Showing <span className="font-semibold text-[#FAF8F5]">{startIndex}</span> to{' '}
          <span className="font-semibold text-[#FAF8F5]">{endIndex}</span> of{' '}
          <span className="font-semibold text-[#D4AF37]">{totalItems}</span> entries
        </span>

        {(onItemsPerPageChange || onPageSizeChange) && (
          <div className="flex items-center gap-1.5 text-[11px]">
            <span className="text-[#FAF8F5]/50 hidden sm:inline">Per page:</span>
            <select
              value={effectivePageSize}
              onChange={(e) => handleSizeChange(Number(e.target.value))}
              className="bg-[#06191B] border border-white/10 rounded-lg px-2 py-1 text-xs text-[#FAF8F5] focus:outline-none focus:border-[#D4AF37]/50 cursor-pointer"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center gap-1.5">
        {/* First Page */}
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="w-8 h-8 rounded-lg border border-[#D4AF37]/20 text-[#FAF8F5]/70 hover:text-[#D4AF37] hover:bg-[#103A3E]/60 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center justify-center cursor-pointer"
          title="First Page"
          aria-label="First Page"
        >
          <ChevronsLeft className="w-3.5 h-3.5" />
        </button>

        {/* Previous Page */}
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="w-8 h-8 rounded-lg border border-[#D4AF37]/20 text-[#FAF8F5]/70 hover:text-[#D4AF37] hover:bg-[#103A3E]/60 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center justify-center cursor-pointer"
          title="Previous Page"
          aria-label="Previous Page"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>

        {/* Page Numbers */}
        <div className="flex items-center gap-1 px-1">
          {getPageNumbers().map((p, idx) => {
            if (p === '...') {
              return (
                <span key={`ellipsis-${idx}`} className="px-1 text-[#FAF8F5]/40 text-xs">
                  …
                </span>
              );
            }
            const isCurrent = p === currentPage;
            return (
              <button
                key={`page-${p}`}
                onClick={() => onPageChange(Number(p))}
                className={`min-w-8 h-8 px-2 rounded-lg text-xs font-mono font-bold transition-all flex items-center justify-center cursor-pointer ${
                  isCurrent
                    ? 'bg-[#D4AF37] text-black shadow-xs shadow-[#D4AF37]/20'
                    : 'text-[#FAF8F5]/70 hover:text-[#D4AF37] hover:bg-[#103A3E]/50'
                }`}
              >
                {p}
              </button>
            );
          })}
        </div>

        {/* Next Page */}
        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage >= totalPages}
          className="w-8 h-8 rounded-lg border border-[#D4AF37]/20 text-[#FAF8F5]/70 hover:text-[#D4AF37] hover:bg-[#103A3E]/60 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center justify-center cursor-pointer"
          title="Next Page"
          aria-label="Next Page"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>

        {/* Last Page */}
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage >= totalPages}
          className="w-8 h-8 rounded-lg border border-[#D4AF37]/20 text-[#FAF8F5]/70 hover:text-[#D4AF37] hover:bg-[#103A3E]/60 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center justify-center cursor-pointer"
          title="Last Page"
          aria-label="Last Page"
        >
          <ChevronsRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
