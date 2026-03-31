import React, { useMemo } from 'react';
import { PurchaseRecord } from '../types';
import { AlertTriangle } from 'lucide-react';

interface Props {
  records: PurchaseRecord[];
}

export const AnomalyAlert: React.FC<Props> = ({ records }) => {
  const anomalies = useMemo(() => {
    // Filter out Spot Checks to only analyze usage between Recharges (Purchases)
    // If we include Spot Checks, the intervals become tiny and skew the average usage per "log" downwards.
    const purchaseRecords = records.filter(r => r.recordType !== 'SPOT_CHECK' && (r.units > 0 || !r.recordType));

    if (purchaseRecords.length < 3) return [];

    // Sort chronological: Oldest first
    const sorted = [...purchaseRecords].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    const intervals: { start: string; end: string; usage: number }[] = [];
    let validIntervalSum = 0;
    let validIntervalCount = 0;

    for (let i = 1; i < sorted.length; i++) {
      const usage = sorted[i].meterReading - sorted[i - 1].meterReading;
      if (usage > 0) {
        intervals.push({
          start: sorted[i - 1].date,
          end: sorted[i].date,
          usage
        });
        validIntervalSum += usage;
        validIntervalCount++;
      }
    }

    if (validIntervalCount < 2) return [];

    const averageUsage = validIntervalSum / validIntervalCount;
    // Threshold: 1.8x average usage (indicates potential missed log between recharges)
    const THRESHOLD_MULTIPLIER = 1.8;

    return intervals
      .filter(i => i.usage > averageUsage * THRESHOLD_MULTIPLIER)
      .map(i => ({
        ...i,
        average: averageUsage
      }));
  }, [records]);

  if (anomalies.length === 0) return null;

  // Only show the most recent anomaly to avoid clutter, or list summary
  const latestAnomaly = anomalies[anomalies.length - 1];

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-start gap-3 animate-fade-in">
      <div className="bg-amber-100 p-2 rounded-lg text-amber-600 mt-0.5">
        <AlertTriangle size={20} />
      </div>
      <div>
        <h4 className="font-semibold text-amber-900 text-sm">Potential Missed Log Detected</h4>
        <p className="text-amber-800 text-sm mt-1">
          Between <strong>{new Date(latestAnomaly.start).toLocaleDateString()}</strong> and <strong>{new Date(latestAnomaly.end).toLocaleDateString()}</strong>, 
          you used <strong>{latestAnomaly.usage.toFixed(1)} kWh</strong>. 
          This is significantly higher than your average usage between recharges ({latestAnomaly.average.toFixed(1)} kWh), suggesting a purchase might not have been logged.
        </p>
      </div>
    </div>
  );
};