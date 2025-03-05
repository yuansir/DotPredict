import React, { useState } from 'react';
import { DotColor } from '../types';
import { BiUndo } from 'react-icons/bi';
import { FiTrash2, FiStopCircle } from 'react-icons/fi';

interface ControlPanelProps {
  selectedColor?: DotColor;
  onColorSelect: (color: DotColor) => void;
  onUndo: () => void;
  onClear: () => void;
  onEndSession?: () => void;
  isViewingHistory?: boolean;
  totalMoves?: number;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  selectedColor = 'red',
  onColorSelect,
  onUndo,
  onClear,
  onEndSession,
  isViewingHistory = false,
  totalMoves = 0
}) => {
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h3 className="text-xl font-bold text-white text-center mb-4">基础操作</h3>
      <p className="text-sm text-gray-400 text-center mb-4">选择颜色放置点</p>
      
      {/* 颜色选择器 */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <button
          onClick={() => onColorSelect('red')}
          className={`relative h-16 rounded-lg overflow-hidden ${selectedColor === 'red' ? 'border-2 border-red-500' : 'border border-gray-600'} flex items-center justify-center transition-all duration-200`}
        >
          <div className="w-14 h-14 flex items-center justify-center relative">
            <div className={`w-14 h-14 rounded-full bg-red-500 flex items-center justify-center transform transition-transform duration-150 ease-in-out ${selectedColor === 'red' ? 'scale-95' : ''}`}>
              <span className="text-white font-bold text-xl">R</span>
            </div>
          </div>
          {selectedColor === 'red' && (
            <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-green-500"></div>
          )}
        </button>
        
        <button
          onClick={() => onColorSelect('black')}
          className={`relative h-16 rounded-lg overflow-hidden ${selectedColor === 'black' ? 'border-2 border-gray-400' : 'border border-gray-600'} flex items-center justify-center transition-all duration-200`}
        >
          <div className="w-14 h-14 flex items-center justify-center relative">
            <div className={`w-14 h-14 rounded-full bg-black flex items-center justify-center transform transition-transform duration-150 ease-in-out ${selectedColor === 'black' ? 'scale-95' : ''}`}>
              <span className="text-white font-bold text-xl">B</span>
            </div>
          </div>
          {selectedColor === 'black' && (
            <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-green-500"></div>
          )}
        </button>
      </div>
      
      {/* 操作按钮 */}
      <div className="space-y-3">
        <button
          onClick={onUndo}
          disabled={isViewingHistory || totalMoves === 0}
          className={`w-full py-3 px-4 rounded-lg ${
            isViewingHistory 
              ? 'bg-blue-300 cursor-not-allowed' 
              : totalMoves === 0 
                ? 'bg-blue-300 cursor-not-allowed' 
                : 'bg-blue-500 hover:bg-blue-600'
          } text-white flex items-center justify-center space-x-2 transition-colors`}
          title={isViewingHistory ? "预览模式下不可用" : totalMoves === 0 ? "没有操作可撤销" : "撤销上一步操作"}
        >
          <BiUndo className="w-5 h-5" />
          <span>撤销</span>
          {isViewingHistory && <span className="text-xs ml-1">(预览中)</span>}
        </button>
        
        <button
          onClick={onEndSession}
          disabled={isViewingHistory || totalMoves === 0}
          className={`w-full py-3 px-4 rounded-lg ${
            isViewingHistory 
              ? 'bg-yellow-300 cursor-not-allowed' 
              : totalMoves === 0 
                ? 'bg-yellow-300 cursor-not-allowed' 
                : 'bg-yellow-500 hover:bg-yellow-600'
          } text-white flex items-center justify-center space-x-2 transition-colors`}
          title={isViewingHistory ? "预览模式下不可用" : totalMoves === 0 ? "没有数据可终止" : "终止当前输入"}
        >
          <FiStopCircle className="w-5 h-5" />
          <span>终止输入</span>
          {isViewingHistory && <span className="text-xs ml-1">(预览中)</span>}
        </button>
        
        <button
          onClick={() => !isViewingHistory && totalMoves > 0 && setShowClearConfirm(true)}
          disabled={isViewingHistory || totalMoves === 0}
          className={`w-full py-3 px-4 rounded-lg ${
            isViewingHistory 
              ? 'bg-red-300 cursor-not-allowed' 
              : totalMoves === 0 
                ? 'bg-red-300 cursor-not-allowed' 
                : 'bg-red-500 hover:bg-red-600'
          } text-white flex items-center justify-center space-x-2 transition-colors`}
          title={isViewingHistory ? "预览模式下不可用" : totalMoves === 0 ? "没有数据可清空" : "清空所有数据"}
        >
          <FiTrash2 className="w-5 h-5" />
          <span>清空数据</span>
          {isViewingHistory && <span className="text-xs ml-1">(预览中)</span>}
        </button>
      </div>
      
      {/* 确认清空对话框 */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">确认清空数据</h3>
            <p className="mb-6">确定要清空所有数据吗？此操作不可撤销。</p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={() => {
                  onClear();
                  setShowClearConfirm(false);
                }}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
              >
                确认清空
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
