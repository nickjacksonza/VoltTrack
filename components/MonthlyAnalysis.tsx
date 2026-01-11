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
  isCurrentMonth: boolean; // Mostly in current month?
}

export const MonthlyAnalysis: React.FC<Props> = ({ records, currency }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  // --- 1. Calculate Global Averages & Costs ---
  const { avgDailyUsage, avgCostPerKwh } = useMemo(() => {
    const validRecords = records.filter(r => r.recordType !== 'SPOT_CHECK' && (r.units > 0 || !r.recordType));
    const sorted = [...records].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    if (sorted.length < 2) return { avgDailyUsage: 0, avgCostPerKwh: 0 };

    // Calculate Average Daily Usage (Total Usage / Total Time Span)
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    const totalDays = (new Date(last.date).getTime() - new Date(first.date).getTime()) / (1000 * 60 * 60 * 24);
    
    const totalUsage = sorted[sorted.length - 1].meterReading - sorted[0].meterReading;
    const calculatedAvgUsage = totalDays > 0 && totalUsage > 0 ? totalUsage / totalDays : 0;

    // Calculate Average Cost Per kWh (Weighted)
    let totalSpend = 0;
    let totalUnitsBought = 0;
    validRecords.forEach(r => {
      totalSpend += r.price + (r.vat || 0) + (r.serviceFee || 0);
      totalUnitsBought += r.units;
    });
    const calculatedAvgCost = totalUnitsBought > 0 ? totalSpend / totalUnitsBought : 0;

    return { avgDailyUsage: calculatedAvgUsage, avgCostPerKwh: calculatedAvgCost };
  }, [records]);

  // --- 2. Generate Continuous Daily Data Map ---
  const dailyMap = useMemo(() => {
    const map = new Map<string, DailyData>();
    const sorted = [...records].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    if (sorted.length < 1) return map;

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

    // A. Interpolate between known records
    for (let i = 0; i < sorted.length - 1; i++) {
      const startRec = sorted[i];
      const endRec = sorted[i + 1];
      
      const startDate = new Date(startRec.date);
      const endDate = new Date(endRec.date);
      
      const diffTime = endDate.getTime() - startDate.getTime();
      const diffDays = diffTime / (1000 * 60 * 60 * 24);
      
      const usageDiff = endRec.meterReading - startRec.meterReading;

      if (diffDays > 0 && usageDiff >= 0) {
        const dailyUsage = usageDiff / diffDays;
        
        const loopDate = new Date(startDate);
        while (loopDate < endDate) {
          const dateStr = loopDate.toISOString().split('T')[0];
          addUsage(dateStr, dailyUsage, false);
          loopDate.setDate(loopDate.getDate() + 1);
        }
      }
    }

    // B. Project Forward
    if (avgDailyUsage > 0) {
        const lastRec = sorted[sorted.length - 1];
        const lastDate = new Date(lastRec.date);
        
        // Project 90 days into future to cover next month views
        const projectionLimit = new Date(lastDate);
        projectionLimit.setDate(projectionLimit.getDate() + 90);

        const loopDate = new Date(lastDate);
        loopDate.setDate(loopDate.getDate() + 1);

        while (loopDate <= projectionLimit) {
            const dateStr = loopDate.toISOString().split('T')[0];
            addUsage(dateStr, avgDailyUsage, true);
            loopDate.setDate(loopDate.getDate() + 1);
        }
    }

    return map;
  }, [records, avgDailyUsage, avgCostPerKwh]);

  // --- 3. Construct Data for Selected Month ---
  const monthData = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth(); // 0-indexed

    // --- Strict Calendar Month Totals (1st to Last) ---
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    let monthTotalUsage = 0;
    let monthTotalCost = 0;
    let projectedDaysCount = 0;

    for (let day = 1; day <= daysInMonth; day++) {
        const dateObj = new Date(year, month, day);
        const dateStr = dateObj.toISOString().split('T')[0];
        const data = dailyMap.get(dateStr);
        if (data) {
            monthTotalUsage += data.usage;
            monthTotalCost += data.cost;
            if (data.isProjected) projectedDaysCount++;
        }
    }

    // --- Weekly Breakdown (Full Weeks Mon-Sun) ---
    // 1. Find start of grid: Monday of the week containing the 1st
    const firstDayOfMonth = new Date(year, month, 1);
    const startOfGrid = new Date(firstDayOfMonth);
    const dayOfWeekStart = startOfGrid.getDay(); // 0=Sun, 1=Mon...
    // If Sunday(0), subtract 6. If Mon(1), subtract 0. If Tue(2), subtract 1.
    const diffStart = dayOfWeekStart === 0 ? 6 : dayOfWeekStart - 1; 
    startOfGrid.setDate(startOfGrid.getDate() - diffStart);

    // 2. Find end of grid: Sunday of the week containing the last day
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const endOfGrid = new Date(lastDayOfMonth);
    const dayOfWeekEnd = endOfGrid.getDay(); // 0=Sun
    // If Sun(0), add 0. If Mon(1), add 6.
    const diffEnd = dayOfWeekEnd === 0 ? 0 : 7 - dayOfWeekEnd;
    endOfGrid.setDate(endOfGrid.getDate() + diffEnd);

    const weeks: WeekData[] = [];
    let loopDate = new Date(startOfGrid);

    // Generate weeks
    while (loopDate <= endOfGrid) {
        const weekStart = new Date(loopDate);
        const weekEnd = new Date(loopDate);
        weekEnd.setDate(weekEnd.getDate() + 6);

        let weekUsage = 0;
        let weekCost = 0;
        let daysInCurrentMonth = 0;

        // Sum 7 days
        for (let i = 0; i < 7; i++) {
            const d = new Date(weekStart);
            d.setDate(d.getDate() + i);
            
            // Check if this day is in the currently selected month
            if (d.getMonth() === month) daysInCurrentMonth++;

            const dateStr = d.toISOString().split('T')[0];
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
            isCurrentMonth: daysInCurrentMonth >= 4 // Week belongs to month if > 3 days are in it? Or just list them all.
        });

        // Increment by 7 days
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
       <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
        <CalendarDays className="mx-auto h-10 w-10 text-gray-300 mb-2" />
        <p className="text-gray-500">Add purchase records to unlock monthly views.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header & Navigation */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
        <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <ChevronLeft size={20} className="text-gray-600" />
        </button>
        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <Calendar size={20} className="text-blue-600" />
          {currentDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
        </h2>
        <button onClick={() => changeMonth(1)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <ChevronRight size={20} className="text-gray-600" />
        </button>
      </div>

      {/* Month Summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-5 rounded-xl shadow-sm text-white">
           <p className="text-blue-100 text-xs font-medium uppercase tracking-wider mb-1">Total Est. Usage</p>
           <div className="flex items-end gap-1">
              <span className="text-2xl font-bold">{monthData.monthTotalUsage.toFixed(1)}</span>
              <span className="text-sm mb-1 opacity-80">kWh</span>
           </div>
           <p className="text-[10px] text-blue-200 mt-1">For {currentDate.toLocaleDateString(undefined, { month: 'long' })}</p>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
           <p className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-1">Total Est. Cost</p>
           <div className="flex items-end gap-1">
              <span className="text-2xl font-bold text-gray-800">{currency}{monthData.monthTotalCost.toFixed(2)}</span>
           </div>
           <p className="text-[10px] text-gray-400 mt-1">Based on avg. rate of {currency}{avgCostPerKwh.toFixed(2)}/kWh</p>
        </div>
      </div>

      {monthData.projectedDaysCount > 0 && (
          <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg text-xs flex items-center gap-2 border border-blue-100">
              <Zap size={12} />
              <span>Includes estimated data based on your recent daily average ({avgDailyUsage.toFixed(1)} kWh/day).</span>
          </div>
      )}

      {/* Weeks Grid */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider ml-1">Weekly Breakdown</h3>
        <div className="grid grid-cols-1 gap-3">
          {monthData.weeks.map((week, idx) => (
            <div key={idx} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-4">
                  <div className="bg-gray-50 p-2 rounded-lg text-center min-w-[3.5rem]">
                      <span className="block text-[10px] text-gray-400 font-bold uppercase">Week</span>
                      <span className="block text-lg font-bold text-blue-600">{week.weekNum}</span>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-800">
                        {week.startDate.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })} - {week.endDate.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">
                        {week.startDate.toLocaleDateString(undefined, { weekday: 'short' })} to {week.endDate.toLocaleDateString(undefined, { weekday: 'short' })}
                    </div>
                  </div>
              </div>
              
              <div className="text-right">
                 <div className="text-sm font-bold text-gray-900">
                    {week.totalUsage.toFixed(1)} <span className="text-xs font-normal text-gray-500">kWh</span>
                 </div>
                 <div className="text-xs text-gray-500 font-medium">
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