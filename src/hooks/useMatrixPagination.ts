import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { DotColor, Move } from '../types';

/**
 * 矩阵分页自定义钩子 - 专用于处理3x24矩阵的分页逻辑
 * @param matrixData 完整的矩阵数据（用于兼容旧代码）
 * @param rowsPerPage 每页显示的行数
 * @param colsPerPage 每页显示的列数
 * @param historyLength 历史记录长度（用于计算总页数）
 * @param completeHistory 完整的历史记录（用于直接构建当前页矩阵）
 * @param isInputMode 是否处于输入模式（用于控制是否自动跳转到最新页面）
 */
export function useMatrixPagination(
  matrixData: (DotColor | null)[][],
  rowsPerPage = 3,
  colsPerPage = 24,
  historyLength?: number,
  completeHistory?: Move[],
  isInputMode = false
) {
  // 当前页码
  const [currentPage, setCurrentPage] = useState(1);

  // 存储上一次的总页数，用于检测页数是否增加
  const prevTotalPagesRef = useRef(1);

  // 计算每页可容纳的球数量
  const ballsPerPage = rowsPerPage * colsPerPage;

  // 计算非null球数量（兼容旧逻辑）
  const filledBallsCount = useMemo(() => {
    let count = 0;
    if (!matrixData) return 0;

    // 打印完整矩阵数据结构
    console.log('[DEBUG] 矩阵数据结构:', {
      行数: matrixData.length,
      每行列数: matrixData.map(row => row?.length || 0)
    });

    // 输出所有非空球的位置
    const nonNullPositions: { row: number, col: number }[] = [];

    for (let rowIndex = 0; rowIndex < matrixData.length; rowIndex++) {
      const row = matrixData[rowIndex];
      if (!row) continue;
      for (let colIndex = 0; colIndex < row.length; colIndex++) {
        if (row[colIndex] !== null) {
          count++;
          nonNullPositions.push({ row: rowIndex, col: colIndex });
        }
      }
    }

    // console.log('[DEBUG] useMatrixPagination - 非null球数量计算:', { 
    //   filledBallsCount: count,
    //   nonNullPositions: nonNullPositions.length > 20 ? 
    //     `${nonNullPositions.length}个位置 (过多不全部显示)` : 
    //     nonNullPositions
    // });
    return count;
  }, [matrixData]);

  // 计算总页数
  const totalPages = useMemo(() => {
    // 优先使用历史记录长度计算
    if (historyLength !== undefined) {
      const pages = Math.max(1, Math.ceil(historyLength / ballsPerPage));
      // console.log('[DEBUG] useMatrixPagination - 分页计算(基于历史):', {
      //   historyLength,
      //   ballsPerPage,
      //   totalPages: pages
      // });
      return pages;
    }

    // 兼容旧逻辑，使用非空单元格数量
    const pages = Math.max(1, Math.ceil(filledBallsCount / ballsPerPage));
    // console.log('[DEBUG] useMatrixPagination - 分页计算(基于矩阵):', {
    //   filledBallsCount,
    //   ballsPerPage,
    //   totalPages: pages
    // });
    return pages;
  }, [historyLength, filledBallsCount, ballsPerPage]);

  // 优化的自动调整逻辑 - 只在总页数增加时才自动跳转
  useEffect(() => {
    // 情况1：如果当前页超过了总页数，调整到最后一页
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
    // 情况2：在输入模式下，只有在总页数增加时才自动跳转到最新页面
    else if (isInputMode && totalPages > prevTotalPagesRef.current) {
      // console.log('[DEBUG] useMatrixPagination - 检测到新页面创建，自动跳转', {
      //   之前总页数: prevTotalPagesRef.current,
      //   当前总页数: totalPages,
      //   当前页: currentPage
      // });
      setCurrentPage(totalPages);
    }

    // 更新引用的页数值
    prevTotalPagesRef.current = totalPages;
  }, [totalPages, currentPage, isInputMode]);

  // 页面导航方法
  const goToPage = useCallback((page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  }, [totalPages]);

  const goToNextPage = useCallback(() => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  }, [currentPage, totalPages]);

  const goToPreviousPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  }, [currentPage]);

  const goToFirstPage = useCallback(() => {
    setCurrentPage(1);
  }, []);

  const goToLastPage = useCallback(() => {
    setCurrentPage(totalPages);
  }, [totalPages]);

  // 创建当前页矩阵数据
  const currentPageMatrix = useMemo(() => {
    // 创建空矩阵
    const pageMatrix: (DotColor | null)[][] = [];
    for (let i = 0; i < rowsPerPage; i++) {
      pageMatrix[i] = Array(colsPerPage).fill(null);
    }

    // console.log('[DEBUG] currentPageMatrix - 开始计算当前页矩阵, 当前页:', currentPage);

    // 如果有完整历史记录，直接从历史记录构建当前页矩阵
    if (completeHistory && completeHistory.length > 0) {
      const startIndex = (currentPage - 1) * ballsPerPage;
      const endIndex = Math.min(startIndex + ballsPerPage, completeHistory.length);

      // 获取当前页的历史记录子集
      const pageHistory = completeHistory.slice(startIndex, endIndex);

      // 填充当前页矩阵
      pageHistory.forEach((move, index) => {
        const pageRow = index % rowsPerPage;
        const pageCol = Math.floor(index / rowsPerPage);

        if (pageRow < rowsPerPage && pageCol < colsPerPage) {
          pageMatrix[pageRow][pageCol] = move.color;
        }
      });

      // console.log('[DEBUG] currentPageMatrix - 基于历史生成完毕', {
      //   当前页: currentPage,
      //   总页数: totalPages,
      //   起始索引: startIndex,
      //   结束索引: endIndex,
      //   当前页球数: pageHistory.length
      // });

      return pageMatrix;
    }

    // 兼容旧逻辑，从matrixData构建（若未提供completeHistory）
    if (!matrixData || matrixData.length === 0) {
      // console.log('[DEBUG] currentPageMatrix - 矩阵数据为空');
      return pageMatrix;
    }

    // 计算当前页起始索引
    const startBallIndex = (currentPage - 1) * ballsPerPage;
    const endBallIndex = startBallIndex + ballsPerPage - 1;

    // 填充当前页矩阵
    let processedBalls = 0;
    let ballsInCurrentPage = 0;

    // 外层循环：逐行扫描原始矩阵
    outerLoop: for (let i = 0; i < matrixData.length; i++) {
      const row = matrixData[i];
      if (!row) continue;

      // 内层循环：处理每行中的每个球
      for (let j = 0; j < row.length; j++) {
        const ball = row[j];
        if (ball === null) continue;

        // 跳过不在当前页的球
        if (processedBalls < startBallIndex) {
          processedBalls++;
          continue;
        }

        // 如果超出当前页
        if (processedBalls > endBallIndex) {
          break outerLoop;
        }

        // 计算在当前页中的位置（先列后行填充）
        const pageRow = ballsInCurrentPage % rowsPerPage;
        const pageCol = Math.floor(ballsInCurrentPage / rowsPerPage);

        if (pageRow < rowsPerPage && pageCol < colsPerPage) {
          pageMatrix[pageRow][pageCol] = ball;
        }

        ballsInCurrentPage++;
        processedBalls++;
      }
    }

    // console.log('[DEBUG] currentPageMatrix - 基于矩阵生成完毕', {
    //   当前页: currentPage,
    //   总页数: totalPages,
    //   处理球数: processedBalls,
    //   当前页球数: ballsInCurrentPage
    // });

    return pageMatrix;
  }, [matrixData, completeHistory, currentPage, rowsPerPage, colsPerPage, ballsPerPage, totalPages]);

  // 计算当前输入页（最后一页）
  const currentInputPage = useMemo(() => totalPages, [totalPages]);

  return {
    currentPage,
    totalPages,
    currentPageMatrix,
    currentInputPage,
    goToPage,
    goToNextPage,
    goToPreviousPage,
    goToFirstPage,
    goToLastPage
  };
}
