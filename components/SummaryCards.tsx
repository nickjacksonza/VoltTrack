import React, { useMemo } from 'react';
import { PurchaseRecord } from '../types';
import { TrendingUp, Zap, DollarSign, Gauge } from 'lucide-react';

interface Props {
  records: PurchaseRecord[];
  currency: string;
}

export const SummaryCards: React.FC<Props> = ({ records, currency }) => {
  const stats = useMemo(() => {
    if (records.length === 0) return { totalSpent: 0, totalUnits: 0, avgCost: 0, lastReading: 0 };

    // 1. Total Spend (Exclude Spot Checks for safety, though they should be 0 cost anyway)
    const totalSpent = records.reduce((acc, curr) => {
        if (curr.recordType === 'SPOT_CHECK') return acc;
        return acc + curr.price + (curr.vat || 0) + (curr.serviceFee || 0);
    }, 0);

    // 2. Total Units (Only purchased units)
    const totalUnits = records.reduce((acc, curr) => {
        if (curr.recordType === 'SPOT_CHECK') return acc;
        return acc + curr.units;
    }, 0);

    // 3. Average Cost
    const avgCost = totalUnits > 0 ? totalSpent / totalUnits : 0;
    
    // 4. Last Reading
    // Records are passed in pre-sorted (descending) from App.tsx in most cases, 
    // but we safety sort here just for the 'lastReading' extraction to be 100% sure.
    const sorted = [...records].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const lastReading = sorted[0].meterReading;

    return { totalSpent, totalUnits, avgCost, lastReading };
  }, [records]);

  const Card = ({ icon: Icon, colorClass, bgClass, label, value, sub }: any) => (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-start justify-between">
       <div>
          <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">{label}</p>
          <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
          {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
       </div>
       <div className={`p-3 rounded-lg ${bgClass} ${colorClass}`}>
          <Icon size={20} />
       </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card 
        icon={DollarSign} 
        bgClass="bg-blue-50" 
        colorClass="text-blue-600" 
        label="Total Spend" 
        value={`${currency}${stats.totalSpent.toFixed(2)}`} 
      />
      <Card 
        icon={Zap} 
        bgClass="bg-amber-50" 
        colorClass="text-amber-600" 
        label="Total Units" 
        value={stats.totalUnits.toFixed(1)}
        sub="kWh Purchased"
      />
      <Card 
        icon={TrendingUp} 
        bgClass="bg-emerald-50" 
        colorClass="text-emerald-600" 
        label="Avg. Cost" 
        value={`${currency}${stats.avgCost.toFixed(2)}`}
        sub="per kWh"
      />
      <Card 
        icon={Gauge} 
        bgClass="bg-purple-50" 
        colorClass="text-purple-600" 
        label="Meter Reading" 
        value={stats.lastReading.toLocaleString()}
        sub="Current"
      />
    </div>
  );
};