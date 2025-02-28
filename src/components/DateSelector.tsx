import React from 'react';
import { IoCalendarOutline } from 'react-icons/io5';
import { FiEdit3, FiEye } from 'react-icons/fi';

interface DateSelectorProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
  isRecordMode: boolean;
  onModeChange: (mode: boolean) => void;
  className?: string;
  currentSessionId: number;
  latestSessionId: number | null;
  availableSessions: number[];
  selectedSession: number | null;
  onSessionChange: (sessionId: number) => void;
}

export const DateSelector: React.FC<DateSelectorProps> = ({
  selectedDate,
  onDateChange,
  isRecordMode,
  onModeChange,
  className = '',
  currentSessionId = 1,
  latestSessionId = null,
  availableSessions = [],
  selectedSession = null,
  onSessionChange
}) => {
  const today = new Date().toISOString().slice(0, 10);
  const isToday = selectedDate === today;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onDateChange(e.target.value);
  };

  return (
    <div className={`bg-white rounded-xl shadow-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
          <IoCalendarOutline className="w-6 h-6 text-blue-500" />
          日期选择
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onModeChange(!isRecordMode)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200
              ${isRecordMode
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            {isRecordMode ? (
              <>
                <FiEdit3 className="w-4 h-4" />
                <span>录入模式</span>
              </>
            ) : (
              <>
                <FiEye className="w-4 h-4" />
                <span>预览模式</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button
          className="px-3 py-2 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
          onClick={() => {
            const prevDate = new Date(selectedDate);
            prevDate.setDate(prevDate.getDate() - 1);
            onDateChange(prevDate.toISOString().split('T')[0]);
          }}
        >
          前一天
        </button>

        <div className="flex-grow relative">
          <div className="flex items-center gap-4">
            <input
              type="date"
              value={selectedDate}
              onChange={handleChange}
              className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700"
              value={selectedSession || currentSessionId}
              onChange={(e) => onSessionChange(Number(e.target.value))}
            >
              {availableSessions.map(sessionId => (
                <option key={sessionId} value={sessionId}>
                  第 {sessionId} 次输入记录
                </option>
              ))}
              {(selectedSession === currentSessionId || availableSessions.length === 0) && (
                <option value={currentSessionId}>
                  {availableSessions.length === 0 ? '新一轮输入中...' : '新一轮输入中...'}
                </option>
              )}
            </select>
            {isToday && (
              <span className="ml-2 text-green-500 font-medium text-sm whitespace-nowrap">
                今天
              </span>
            )}
          </div>
        </div>

        <button
          className="px-3 py-2 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
          onClick={() => {
            const nextDate = new Date(selectedDate);
            nextDate.setDate(nextDate.getDate() + 1);
            onDateChange(nextDate.toISOString().split('T')[0]);
          }}
        >
          后一天
        </button>
      </div>

      <div className="mt-3 text-sm text-gray-500">
        {new Date(selectedDate).toLocaleDateString('zh-CN', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          weekday: 'long'
        })}
      </div>
    </div>
  );
};
