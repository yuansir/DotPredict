import { useState, useEffect, useCallback } from 'react';
import { Move } from '../types';

/**
 * usePagination - 管理记录的分页逻辑
 */
export function usePagination(history: Move[], itemsPerPage: number = 10) {
  // 分页状态
  const [currentPage, setCurrentPage] = useState(1);
  const [displayItems, setDisplayItems] = useState<Move[]>([]);
  const [totalPages, setTotalPages] = useState(1);

  /**
   * 更新分页数据
   */
  const updatePaginationData = useCallback(() => {
    // 计算总页数
    const total = Math.max(1, Math.ceil(history.length / itemsPerPage));
    setTotalPages(total);
    
    // 确保当前页不超出范围
    const adjustedCurrentPage = Math.min(total, Math.max(1, currentPage));
    if (adjustedCurrentPage !== currentPage) {
      setCurrentPage(adjustedCurrentPage);
    }
    
    // 计算当前页的记录
    const startIndex = (adjustedCurrentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, history.length);
    setDisplayItems(history.slice(startIndex, endIndex));
  }, [history, currentPage, itemsPerPage]);

  /**
   * 跳转到指定页
   */
  const goToPage = useCallback((page: number) => {
    const targetPage = Math.min(totalPages, Math.max(1, page));
    setCurrentPage(targetPage);
  }, [totalPages]);

  /**
   * 跳转到下一页
   */
  const goToNextPage = useCallback(() => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  }, [currentPage, totalPages]);

  /**
   * 跳转到上一页
   */
  const goToPreviousPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  }, [currentPage]);

  /**
   * 跳转到第一页
   */
  const goToFirstPage = useCallback(() => {
    setCurrentPage(1);
  }, []);

  /**
   * 跳转到最后一页
   */
  const goToLastPage = useCallback(() => {
    setCurrentPage(totalPages);
  }, [totalPages]);

  // 当历史记录或当前页变化时更新分页数据
  useEffect(() => {
    updatePaginationData();
  }, [history, currentPage, itemsPerPage, updatePaginationData]);

  return {
    // 状态
    currentPage,
    totalPages,
    displayItems,
    
    // 操作
    goToPage,
    goToNextPage,
    goToPreviousPage,
    goToFirstPage,
    goToLastPage
  };
}
