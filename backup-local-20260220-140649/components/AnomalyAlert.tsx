import React, { useMemo } from 'react';
import { PurchaseRecord } from '../types';
import { AlertTriangle, Zap } from 'lucide-react';

interface Props {
  records: PurchaseRecord[];
}

export const AnomalyAlert: React.FC<Props> = ({ records }) => {
  const anomalies = useMemo(() => {
    // Records are already sorted chronologically (oldest first) from App.tsx
    const purchaseRecords = records.filter(r => r.recordType !== 'SPOT_CHECK' && (r.units > 0 || !r.recordType));

    if (purchaseRecords.length < 3) return [];

    const intervals: { start: string; end: string; usage: number }[] = [];
    let validIntervalSum = 0;
    let validIntervalCount = 0;

    for (let i = 1; i < purchaseRecords.length; i++) {
      const usage = purchaseRecords[i].meterReading - purchaseRecords[i - 1].meterReading;
      if (usage > 0) {
        intervals.push({
          start: purchaseRecords[i - 1].date,
          end: purchaseRecords[i].date,
          usage
        });
        validIntervalSum += usage;
        validIntervalCount++;
      }
    }

    if (validIntervalCount < 2) return [];

    const averageUsage = validIntervalSum / validIntervalCount;
    const THRESHOLD_MULTIPLIER = 1.8;

    return intervals
      .filter(i => i.usage > averageUsage * THRESHOLD_MULTIPLIER)
      .map(i => ({
        ...i,
        average: averageUsage
      }));
  }, [records]);

  if (anomalies.length === 0) return null;

  const latestAnomaly = anomalies[anomalies.length - 1];

  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-start gap-4 animate-slide-up">
      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl"></div>
      <div className="relative bg-amber-500/20 p-3 rounded-xl">
        <AlertTriangle size={20} className="text-amber-400" />
      </div>
      <div className="relative flex-1">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-semibold text-amber-300 text-sm">Potential Missed Log Detected</h4>
          <Zap size={14} className="text-amber-500" />
        </div>
        <p className="text-amber-200/70 text-sm leading-relaxed">
          Between <span className="font-medium text-amber-200">{new Date(latestAnomaly.start).toLocaleDateString()}</span> and{' '}
          <span className="font-medium text-amber-200">{new Date(latestAnomaly.end).toLocaleDateString()}</span>,
          you used <span className="font-mono font-bold text-amber-300">{latestAnomaly.usage.toFixed(1)} kWh</span>.
          This is significantly higher than your average ({latestAnomaly.average.toFixed(1)} kWh), suggesting a purchase might not have been logged.
        </p>
      </div>
    </div>
  );
};
