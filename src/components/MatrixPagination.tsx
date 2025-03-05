import React from 'react';
import { useGameContext } from '../contexts/GameContext';

/**
 * 矩阵分页导航组件
 * 显示页码导航并提供页面切换功能
 * 布局: 首页 上一页 第X页 共Y页 下一页 尾页
 */
export const MatrixPagination: React.FC = () => {
  const {
    matrixCurrentPage,
    matrixTotalPages,
    matrixGoToNextPage,
    matrixGoToPreviousPage,
    matrixGoToPage,
    matrixGoToFirstPage,
    matrixGoToLastPage,
    currentInputPage,
    gameState
  } = useGameContext();

  console.log('[DEBUG] MatrixPagination组件 - 渲染', { matrixCurrentPage, matrixTotalPages });

  // 如果只有一页，不显示分页控件
  if (matrixTotalPages <= 1) {
    console.log('[DEBUG] MatrixPagination - 不显示分页，总页数<=1');
    return null;
  }

  return (
    <div className="flex items-center justify-between py-2 text-sm">
      <div className="flex items-center space-x-3">
        {/* 首页按钮 */}
        <button
          onClick={matrixGoToFirstPage}
          disabled={matrixCurrentPage === 1}
          className={`px-2 py-1 rounded ${matrixCurrentPage === 1
              ? 'text-gray-400 cursor-not-allowed'
              : 'text-blue-500 hover:bg-blue-50'
            }`}
          aria-label="首页"
        >
          首页
        </button>

        {/* 上一页按钮 */}
        <button
          onClick={matrixGoToPreviousPage}
          disabled={matrixCurrentPage === 1}
          className={`flex items-center px-2 py-1 rounded ${matrixCurrentPage === 1
              ? 'text-gray-400 cursor-not-allowed'
              : 'text-blue-500 hover:bg-blue-50'
            }`}
          aria-label="上一页"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          上一页
        </button>

        {/* 页码信息 */}
        <div className="text-gray-700">
          第<span className="font-medium text-blue-600 mx-1">{matrixCurrentPage}</span>页
          共<span className="font-medium text-blue-600 mx-1">{matrixTotalPages}</span>页
        </div>

        {/* 下一页按钮 */}
        <button
          onClick={matrixGoToNextPage}
          disabled={matrixCurrentPage === matrixTotalPages}
          className={`flex items-center px-2 py-1 rounded ${matrixCurrentPage === matrixTotalPages
              ? 'text-gray-400 cursor-not-allowed'
              : 'text-blue-500 hover:bg-blue-50'
            }`}
          aria-label="下一页"
        >
          下一页
          <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* 尾页按钮 */}
        <button
          onClick={matrixGoToLastPage}
          disabled={matrixCurrentPage === matrixTotalPages}
          className={`px-2 py-1 rounded ${matrixCurrentPage === matrixTotalPages
              ? 'text-gray-400 cursor-not-allowed'
              : 'text-blue-500 hover:bg-blue-50'
            }`}
          aria-label="尾页"
        >
          尾页
        </button>
      </div>


    </div>
  );
};
