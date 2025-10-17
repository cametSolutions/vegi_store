import React from 'react';
import { Calendar, Check } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

const DateRangeFilter = ({ onDateRangeChange, selectedRange, setSelectedRange }) => {
  // Helper function to set time to start of day (00:00:00)
  const startOfDay = (date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  // Helper function to set time to end of day (23:59:59)
  const endOfDay = (date) => {
    const d = new Date(date);
    d.setHours(23, 59, 59, 999);
    return d;
  };

  // Date range options with calculations
  const getDateRanges = () => {
    const now = new Date();
    const today = startOfDay(now);
    const todayEnd = endOfDay(now);

    // Yesterday
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const yesterdayEnd = endOfDay(yesterday);

    // This Week (Sunday to Today)
    const thisWeekStart = new Date(today);
    thisWeekStart.setDate(today.getDate() - today.getDay());
    
    // Last Week (Previous Sunday to Saturday)
    const lastWeekEnd = new Date(thisWeekStart);
    lastWeekEnd.setDate(lastWeekEnd.getDate() - 1);
    lastWeekEnd.setHours(23, 59, 59, 999);
    const lastWeekStart = new Date(lastWeekEnd);
    lastWeekStart.setDate(lastWeekEnd.getDate() - 6);
    lastWeekStart.setHours(0, 0, 0, 0);

    // Last 7 Days
    const last7DaysStart = new Date(today);
    last7DaysStart.setDate(today.getDate() - 6);

    // This Month
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    thisMonthStart.setHours(0, 0, 0, 0);
    const thisMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    thisMonthEnd.setHours(23, 59, 59, 999);

    // Last Month
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    lastMonthStart.setHours(0, 0, 0, 0);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    lastMonthEnd.setHours(23, 59, 59, 999);

    // Last 30 Days
    const last30DaysStart = new Date(today);
    last30DaysStart.setDate(today.getDate() - 29);

    // This Quarter (Q1: Jan-Mar, Q2: Apr-Jun, Q3: Jul-Sep, Q4: Oct-Dec)
    const currentQuarter = Math.floor(now.getMonth() / 3);
    const thisQuarterStart = new Date(now.getFullYear(), currentQuarter * 3, 1);
    thisQuarterStart.setHours(0, 0, 0, 0);
    const thisQuarterEnd = new Date(now.getFullYear(), (currentQuarter + 1) * 3, 0);
    thisQuarterEnd.setHours(23, 59, 59, 999);

    // Last Quarter
    const lastQuarterStart = new Date(now.getFullYear(), (currentQuarter - 1) * 3, 1);
    lastQuarterStart.setHours(0, 0, 0, 0);
    const lastQuarterEnd = new Date(now.getFullYear(), currentQuarter * 3, 0);
    lastQuarterEnd.setHours(23, 59, 59, 999);

    return [
      {
        id: 'today',
        label: 'Today',
        startDate: today,
        endDate: todayEnd,
      },
      {
        id: 'yesterday',
        label: 'Yesterday',
        startDate: yesterday,
        endDate: yesterdayEnd,
      },
      {
        id: 'thisWeek',
        label: 'This Week',
        startDate: thisWeekStart,
        endDate: todayEnd,
      },
      {
        id: 'lastWeek',
        label: 'Last Week',
        startDate: lastWeekStart,
        endDate: lastWeekEnd,
      },
      {
        id: 'last7Days',
        label: 'Last 7 Days',
        startDate: last7DaysStart,
        endDate: todayEnd,
      },
      {
        id: 'thisMonth',
        label: 'This Month',
        startDate: thisMonthStart,
        endDate: thisMonthEnd,
      },
      {
        id: 'lastMonth',
        label: 'Last Month',
        startDate: lastMonthStart,
        endDate: lastMonthEnd,
      },
      {
        id: 'last30Days',
        label: 'Last 30 Days',
        startDate: last30DaysStart,
        endDate: todayEnd,
      },
      {
        id: 'thisQuarter',
        label: 'This Quarter',
        startDate: thisQuarterStart,
        endDate: thisQuarterEnd,
      },
      {
        id: 'lastQuarter',
        label: 'Last Quarter',
        startDate: lastQuarterStart,
        endDate: lastQuarterEnd,
      }
    ];
  };

  const dateRanges = getDateRanges();

  const handleRangeSelect = (range) => {
    setSelectedRange(range.id);
    onDateRangeChange({
      startDate: range.startDate,
      endDate: range.endDate,
      rangeType: range.id
    });
  };

  const getSelectedRangeDisplay = () => {
    const range = dateRanges.find(r => r.id === selectedRange);
    return range ? range.label : 'Select Range';
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="h-8 text-xs border-gray-300 hover:bg-gray-50"
        >
          <Calendar className="w-3.5 h-3.5 mr-2" />
          {getSelectedRangeDisplay()}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-[200px] p-2"
      >
        {dateRanges.map((range) => (
          <DropdownMenuItem
            key={range.id}
            onClick={() => handleRangeSelect(range)}
            className="flex items-center justify-between px-3 py-2 cursor-pointer rounded"
          >
            <span className="text-sm text-gray-700">
              {range.label}
            </span>
            {selectedRange === range.id && (
              <Check className="w-4 h-4 text-blue-600" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default DateRangeFilter;