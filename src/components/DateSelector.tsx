import React from 'react';
import { IoCalendarOutline } from 'react-icons/io5';

interface DateSelectorProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  className?: string;
}

export const DateSelector: React.FC<DateSelectorProps> = ({
  selectedDate,
  onDateChange,
  className = ''
}) => {
  return (
    <div className={`${className}`}>
      <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2 mb-6">
        <IoCalendarOutline className="text-blue-500" />
        选择日期
      </h2>

      <div className="flex items-center gap-4">
        <button
          className="px-4 py-2 rounded bg-blue-500 hover:bg-blue-600 text-white transition-colors flex-shrink-0"
          onClick={() => {
            const prevDate = new Date(selectedDate);
            prevDate.setDate(prevDate.getDate() - 1);
            onDateChange(prevDate);
          }}
        >
          前一天
        </button>

        <input
          type="date"
          value={selectedDate instanceof Date ? selectedDate.toISOString().split('T')[0] : ''}
          onChange={(e) => {
            const newDate = new Date(e.target.value);
            onDateChange(newDate);
          }}
          className="flex-grow px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <button
          className="px-4 py-2 rounded bg-blue-500 hover:bg-blue-600 text-white transition-colors flex-shrink-0"
          onClick={() => {
            const nextDate = new Date(selectedDate);
            nextDate.setDate(nextDate.getDate() + 1);
            onDateChange(nextDate);
          }}
        >
          后一天
        </button>
      </div>

      <p className="mt-4 text-sm text-gray-500 text-center">
        当前日期：{selectedDate instanceof Date ? selectedDate.toLocaleDateString('zh-CN', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          weekday: 'long'
        }) : ''}
      </p>
    </div>
  );
};
