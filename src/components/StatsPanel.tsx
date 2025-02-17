import React from 'react';

interface StatsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  history: Array<{
    timestamp: number;
    score: {
      totalPredictions: number;
      correctPredictions: number;
      accuracy: number;
    };
  }>;
}

export const StatsPanel: React.FC<StatsPanelProps> = ({
  isOpen,
  onClose,
  history,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl m-4 p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">游戏统计</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            aria-label="关闭"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="space-y-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">
              总体表现
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">平均准确率</p>
                <p className="text-2xl font-bold text-blue-600">
                  {(
                    history.reduce((acc, game) => acc + game.score.accuracy, 0) /
                    history.length
                  ).toFixed(1)}
                  %
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">总游戏次数</p>
                <p className="text-2xl font-bold text-blue-600">
                  {history.length}
                </p>
              </div>
            </div>
          </div>

          <div className="overflow-auto max-h-96">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">
                    日期
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">
                    预测次数
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">
                    正确次数
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">
                    准确率
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {history.map((game, index) => (
                  <tr
                    key={index}
                    className="hover:bg-gray-50 transition-colors duration-150"
                  >
                    <td className="px-4 py-2 text-sm text-gray-600">
                      {new Date(game.timestamp).toLocaleString()}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-600">
                      {game.score.totalPredictions}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-600">
                      {game.score.correctPredictions}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-600">
                      {game.score.accuracy.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
