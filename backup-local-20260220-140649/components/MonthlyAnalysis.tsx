import React, { useState, useMemo } from 'react';
import { PurchaseRecord } from '../types';
import { Calendar, ChevronLeft, ChevronRight, Zap, CalendarDays } from 'lucide-react';

interface Props {
  records: PurchaseRecord[];
  currency: string;
}

interface DailyData {
  date: string;
  usage: number;
  isProjected: boolean;
  cost: number;
}

interface WeekData {
  weekNum: number;
  startDate: Date;
  endDate: Date;
  totalUsage: number;
  totalCost: number;
  isCurrentMonth: boolean;
}

// Helper to format date as YYYY-MM-DD in local timezone (avoids UTC shift)
const toLocalDateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const MonthlyAnalysis: React.FC<Props> = ({ records, currency }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const { avgDailyUsage, avgCostPerKwh } = useMemo(() => {
    // Records are already sorted chronologically (oldest first) from App.tsx
    const validRecords = records.filter(r => r.recordType !== 'SPOT_CHECK' && (r.units > 0 || !r.recordType));

    if (records.length < 2) return { avgDailyUsage: 0, avgCostPerKwh: 0 };

    const first = records[0];
    const last = records[records.length - 1];
    const totalDays = (new Date(last.date).getTime() - new Date(first.date).getTime()) / (1000 * 60 * 60 * 24);

    const totalUsage = last.meterReading - first.meterReading;
    const calculatedAvgUsage = totalDays > 0 && totalUsage > 0 ? totalUsage / totalDays : 0;

    // Price already includes VAT and service fee
    let totalSpend = 0;
    let totalUnitsBought = 0;
    validRecords.forEach(r => {
      totalSpend += r.price;
      totalUnitsBought += r.units;
    });
    const calculatedAvgCost = totalUnitsBought > 0 ? totalSpend / totalUnitsBought : 0;

    return { avgDailyUsage: calculatedAvgUsage, avgCostPerKwh: calculatedAvgCost };
  }, [records]);

  const dailyMap = useMemo(() => {
    const map = new Map<string, DailyData>();
    // Records are already sorted chronologically (oldest first) from App.tsx

    if (records.length < 1) return map;

    const addUsage = (dateStr: string, kwh: number, isProjected: boolean) => {
      const existing = map.get(dateStr);
      if (existing) {
        if (existing.isProjected && !isProjected) {
          map.set(dateStr, { date: dateStr, usage: kwh, isProjected, cost: kwh * avgCostPerKwh });
        }
      } else {
        map.set(dateStr, { date: dateStr, usage: kwh, isProjected, cost: kwh * avgCostPerKwh });
      }
    };

    for (let i = 0; i < records.length - 1; i++) {
      const startRec = records[i];
      const endRec = records[i + 1];

      const startDate = new Date(startRec.date);
      const endDate = new Date(endRec.date);

      const diffTime = endDate.getTime() - startDate.getTime();
      const diffDays = diffTime / (1000 * 60 * 60 * 24);

      const usageDiff = endRec.meterReading - startRec.meterReading;

      if (diffDays > 0 && usageDiff >= 0) {
        const dailyUsage = usageDiff / diffDays;

        const loopDate = new Date(startDate);
        while (loopDate < endDate) {
          const dateStr = toLocalDateString(loopDate);
          addUsage(dateStr, dailyUsage, false);
          loopDate.setDate(loopDate.getDate() + 1);
        }
      }
    }

    if (avgDailyUsage > 0) {
      const lastRec = records[records.length - 1];
      const lastDate = new Date(lastRec.date);

      const projectionLimit = new Date(lastDate);
      projectionLimit.setDate(projectionLimit.getDate() + 90);

      const loopDate = new Date(lastDate);
      loopDate.setDate(loopDate.getDate() + 1);

      while (loopDate <= projectionLimit) {
        const dateStr = toLocalDateString(loopDate);
        addUsage(dateStr, avgDailyUsage, true);
        loopDate.setDate(loopDate.getDate() + 1);
      }
    }

    return map;
  }, [records, avgDailyUsage, avgCostPerKwh]);

  const monthData = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    let monthTotalUsage = 0;
    let monthTotalCost = 0;
    let projectedDaysCount = 0;

    for (let day = 1; day <= daysInMonth; day++) {
      const dateObj = new Date(year, month, day);
      const dateStr = toLocalDateString(dateObj);
      const data = dailyMap.get(dateStr);
      if (data) {
        monthTotalUsage += data.usage;
        monthTotalCost += data.cost;
        if (data.isProjected) projectedDaysCount++;
      }
    }

    const firstDayOfMonth = new Date(year, month, 1);
    const startOfGrid = new Date(firstDayOfMonth);
    const dayOfWeekStart = startOfGrid.getDay();
    const diffStart = dayOfWeekStart === 0 ? 6 : dayOfWeekStart - 1;
    startOfGrid.setDate(startOfGrid.getDate() - diffStart);

    const lastDayOfMonth = new Date(year, month + 1, 0);
    const endOfGrid = new Date(lastDayOfMonth);
    const dayOfWeekEnd = endOfGrid.getDay();
    const diffEnd = dayOfWeekEnd === 0 ? 0 : 7 - dayOfWeekEnd;
    endOfGrid.setDate(endOfGrid.getDate() + diffEnd);

    const weeks: WeekData[] = [];
    let loopDate = new Date(startOfGrid);

    while (loopDate <= endOfGrid) {
      const weekStart = new Date(loopDate);
      const weekEnd = new Date(loopDate);
      weekEnd.setDate(weekEnd.getDate() + 6);

      let weekUsage = 0;
      let weekCost = 0;
      let daysInCurrentMonth = 0;

      for (let i = 0; i < 7; i++) {
        const d = new Date(weekStart);
        d.setDate(d.getDate() + i);

        if (d.getMonth() === month) daysInCurrentMonth++;

        const dateStr = toLocalDateString(d);
        const data = dailyMap.get(dateStr);
        if (data) {
          weekUsage += data.usage;
          weekCost += data.cost;
        }
      }

      weeks.push({
        weekNum: weeks.length + 1,
        startDate: weekStart,
        endDate: weekEnd,
        totalUsage: weekUsage,
        totalCost: weekCost,
        isCurrentMonth: daysInCurrentMonth >= 4
      });

      loopDate.setDate(loopDate.getDate() + 7);
    }

    return { weeks, monthTotalUsage, monthTotalCost, projectedDaysCount };
  }, [currentDate, dailyMap]);

  const changeMonth = (offset: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + offset);
    setCurrentDate(newDate);
  };

  if (records.length === 0) {
    return (
      <div className="text-center py-12 bg-surface-700/30 rounded-2xl border border-dashed border-white/10">
        <CalendarDays className="mx-auto h-12 w-12 text-gray-600 mb-3" />
        <p className="text-gray-400">Add purchase records to unlock monthly views.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header & Navigation */}
      <div className="bg-surface-700/30 p-4 rounded-2xl border border-white/5 flex items-center justify-between">
        <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-surface-600/50 rounded-xl transition-colors text-gray-400 hover:text-white">
          <ChevronLeft size={20} />
        </button>
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Calendar size={20} className="text-volt-400" />
          {currentDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
        </h2>
        <button onClick={() => changeMonth(1)} className="p-2 hover:bg-surface-600/50 rounded-xl transition-colors text-gray-400 hover:text-white">
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Month Summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="relative overflow-hidden bg-gradient-to-br from-volt-600/20 to-volt-800/20 p-5 rounded-2xl border border-volt-500/20">
          <div className="absolute top-0 right-0 w-24 h-24 bg-volt-500/10 rounded-full blur-2xl"></div>
          <div className="relative">
            <p className="text-volt-300/70 text-xs font-semibold uppercase tracking-wider mb-1">Total Est. Usage</p>
            <div className="flex items-end gap-1">
              <span className="text-2xl font-bold text-volt-400 font-mono">{monthData.monthTotalUsage.toFixed(1)}</span>
              <span className="text-sm mb-1 text-volt-500">kWh</span>
            </div>
            <p className="text-[10px] text-volt-500/50 mt-1">For {currentDate.toLocaleDateString(undefined, { month: 'long' })}</p>
          </div>
        </div>
        <div className="relative overflow-hidden bg-surface-700/30 p-5 rounded-2xl border border-white/5">
          <div className="absolute top-0 right-0 w-24 h-24 bg-energy-500/5 rounded-full blur-2xl"></div>
          <div className="relative">
            <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">Total Est. Cost</p>
            <div className="flex items-end gap-1">
              <span className="text-2xl font-bold text-white font-mono">{currency}{monthData.monthTotalCost.toFixed(2)}</span>
            </div>
            <p className="text-[10px] text-gray-600 mt-1">Based on avg. rate of {currency}{avgCostPerKwh.toFixed(2)}/kWh</p>
          </div>
        </div>
      </div>

      {monthData.projectedDaysCount > 0 && (
        <div className="bg-volt-500/10 text-volt-300 px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 border border-volt-500/20">
          <Zap size={14} className="text-volt-400" />
          <span>Includes estimated data based on your recent daily average ({avgDailyUsage.toFixed(1)} kWh/day).</span>
        </div>
      )}

      {/* Weeks Grid */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Weekly Breakdown</h3>
        <div className="grid grid-cols-1 gap-3">
          {monthData.weeks.map((week, idx) => (
            <div key={idx} className="bg-surface-700/30 p-4 rounded-2xl border border-white/5 flex items-center justify-between hover:border-white/10 transition-colors">
              <div className="flex items-center gap-4">
                <div className="bg-surface-600/50 p-2 rounded-xl text-center min-w-[3.5rem]">
                  <span className="block text-[10px] text-gray-500 font-semibold uppercase">Week</span>
                  <span className="block text-lg font-bold text-volt-400 font-mono">{week.weekNum}</span>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-200">
                    {week.startDate.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })} - {week.endDate.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {week.startDate.toLocaleDateString(undefined, { weekday: 'short' })} to {week.endDate.toLocaleDateString(undefined, { weekday: 'short' })}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-sm font-bold text-white font-mono">
                  {week.totalUsage.toFixed(1)} <span className="text-xs font-normal text-gray-500">kWh</span>
                </div>
                <div className="text-xs text-energy-400 font-medium font-mono">
                  {currency}{week.totalCost.toFixed(2)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
