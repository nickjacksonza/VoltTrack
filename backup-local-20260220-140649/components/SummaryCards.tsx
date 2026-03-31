import React, { useMemo } from 'react';
import { PurchaseRecord } from '../types';
import { TrendingUp, Zap, DollarSign, Gauge } from 'lucide-react';

interface Props {
  records: PurchaseRecord[];
  currency: string;
}

export const SummaryCards: React.FC<Props> = ({ records, currency }) => {
  const stats = useMemo(() => {
    if (records.length === 0) return { totalSpent: 0, totalUnitsBought: 0, actualUsage: 0, avgCost: 0, lastReading: 0, avgDailyUsage: 0 };

    // Price already includes VAT and service fee - they're just breakdown info
    const totalSpent = records.reduce((acc, curr) => {
      if (curr.recordType === 'SPOT_CHECK') return acc;
      return acc + curr.price;
    }, 0);

    const totalUnitsBought = records.reduce((acc, curr) => {
      if (curr.recordType === 'SPOT_CHECK') return acc;
      return acc + curr.units;
    }, 0);

    const avgCost = totalUnitsBought > 0 ? totalSpent / totalUnitsBought : 0;

    // Records are sorted chronologically (oldest first), so last item is most recent
    const firstReading = records[0].meterReading;
    const lastReading = records[records.length - 1].meterReading;

    // Actual usage from meter readings (more accurate than units bought)
    const actualUsage = lastReading - firstReading;

    // Calculate average daily usage
    const firstDate = new Date(records[0].date);
    const lastDate = new Date(records[records.length - 1].date);
    const totalDays = (lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24);
    const avgDailyUsage = totalDays > 0 ? actualUsage / totalDays : 0;

    return { totalSpent, totalUnitsBought, actualUsage, avgCost, lastReading, avgDailyUsage };
  }, [records]);

  // Digital meter display component
  const MeterDisplay = ({ value, decimals = 0 }: { value: number; decimals?: number }) => {
    const displayValue = value.toFixed(decimals);
    const digits = displayValue.split('');

    return (
      <div className="flex items-baseline gap-0.5">
        {digits.map((digit, i) => (
          <span
            key={i}
            className={`font-mono font-bold ${
              digit === '.' ? 'text-lg' : 'text-2xl sm:text-3xl'
            } ${digit === '.' ? 'mx-0.5' : ''}`}
          >
            {digit}
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {/* Total Spend Card */}
      <div className="relative overflow-hidden bg-surface-700/50 p-4 sm:p-5 rounded-2xl border border-white/5 card-hover group">
        <div className="absolute top-0 right-0 w-24 h-24 bg-volt-500/5 rounded-full blur-2xl group-hover:bg-volt-500/10 transition-all"></div>
        <div className="relative">
          <div className="flex items-center justify-between mb-3">
            <p className="text-gray-500 text-[10px] sm:text-xs font-semibold uppercase tracking-wider">Total Spend</p>
            <div className="p-2 bg-volt-500/10 rounded-lg">
              <DollarSign size={16} className="text-volt-400" />
            </div>
          </div>
          <div className="text-volt-400">
            <span className="text-lg sm:text-xl font-medium mr-0.5">{currency}</span>
            <MeterDisplay value={stats.totalSpent} decimals={2} />
          </div>
        </div>
      </div>

      {/* Actual Usage Card (from meter readings) */}
      <div className="relative overflow-hidden bg-surface-700/50 p-4 sm:p-5 rounded-2xl border border-white/5 card-hover group">
        <div className="absolute top-0 right-0 w-24 h-24 bg-energy-500/5 rounded-full blur-2xl group-hover:bg-energy-500/10 transition-all"></div>
        <div className="relative">
          <div className="flex items-center justify-between mb-3">
            <p className="text-gray-500 text-[10px] sm:text-xs font-semibold uppercase tracking-wider">Total Usage</p>
            <div className="p-2 bg-energy-500/10 rounded-lg">
              <Zap size={16} className="text-energy-400" />
            </div>
          </div>
          <div className="text-energy-400">
            <MeterDisplay value={stats.actualUsage} decimals={1} />
            <span className="text-xs text-gray-500 ml-1">kWh</span>
          </div>
          <p className="text-[10px] text-gray-600 mt-1">{stats.avgDailyUsage.toFixed(1)} kWh/day avg</p>
        </div>
      </div>

      {/* Average Cost Card */}
      <div className="relative overflow-hidden bg-surface-700/50 p-4 sm:p-5 rounded-2xl border border-white/5 card-hover group">
        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-all"></div>
        <div className="relative">
          <div className="flex items-center justify-between mb-3">
            <p className="text-gray-500 text-[10px] sm:text-xs font-semibold uppercase tracking-wider">Avg. Cost</p>
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <TrendingUp size={16} className="text-emerald-400" />
            </div>
          </div>
          <div className="text-emerald-400">
            <span className="text-lg sm:text-xl font-medium mr-0.5">{currency}</span>
            <MeterDisplay value={stats.avgCost} decimals={2} />
            <span className="text-xs text-gray-500 ml-1">/kWh</span>
          </div>
        </div>
      </div>

      {/* Current Meter Reading Card - Hero card with special styling */}
      <div className="relative overflow-hidden bg-gradient-to-br from-surface-700 to-surface-800 p-4 sm:p-5 rounded-2xl border border-volt-500/20 shadow-glow-cyan group">
        <div className="absolute inset-0 bg-gradient-to-br from-volt-500/5 to-transparent"></div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-volt-500/10 rounded-full blur-2xl animate-pulse-slow"></div>
        <div className="relative">
          <div className="flex items-center justify-between mb-3">
            <p className="text-volt-300/70 text-[10px] sm:text-xs font-semibold uppercase tracking-wider">Meter Reading</p>
            <div className="p-2 bg-volt-500/20 rounded-lg animate-meter-pulse">
              <Gauge size={16} className="text-volt-400" />
            </div>
          </div>
          <div className="text-volt-400 text-glow-cyan">
            <MeterDisplay value={stats.lastReading} decimals={0} />
            <span className="text-xs text-volt-500/50 ml-1">kWh</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-volt-400 rounded-full animate-pulse"></span>
            <span className="text-[10px] text-gray-500 uppercase tracking-wider">Live</span>
          </div>
        </div>
      </div>
    </div>
  );
};
