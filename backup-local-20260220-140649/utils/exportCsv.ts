import { PurchaseRecord } from '../types';

export const exportRecordsToCsv = (records: PurchaseRecord[], currency: string): void => {
  if (records.length === 0) {
    alert('No records to export');
    return;
  }

  // Sort records chronologically for export
  const sortedRecords = [...records].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // CSV headers
  const headers = [
    'Date',
    'Time',
    'Type',
    'Meter Reading (kWh)',
    'Units Purchased (kWh)',
    `Price (${currency})`,
    `VAT (${currency})`,
    `Service Fee (${currency})`,
    `Rate (${currency}/kWh)`,
    'Days Since Previous',
    'Usage Since Previous (kWh)',
    'Daily Avg Usage (kWh/day)'
  ];

  // Build CSV rows
  const rows: string[][] = [];

  for (let i = 0; i < sortedRecords.length; i++) {
    const record = sortedRecords[i];
    const date = new Date(record.date);
    const isSpotCheck = record.recordType === 'SPOT_CHECK';
    const rate = !isSpotCheck && record.units > 0 ? record.price / record.units : 0;

    // Calculate usage since previous record
    let daysSincePrev = '';
    let usageSincePrev = '';
    let dailyAvgUsage = '';

    if (i > 0) {
      const prevRecord = sortedRecords[i - 1];
      const prevDate = new Date(prevRecord.date);
      const msDiff = date.getTime() - prevDate.getTime();
      const days = msDiff / (1000 * 60 * 60 * 24);
      const usage = record.meterReading - prevRecord.meterReading;

      daysSincePrev = days.toFixed(1);
      usageSincePrev = usage.toFixed(2);
      dailyAvgUsage = days > 0 ? (usage / days).toFixed(2) : '0';
    }

    rows.push([
      date.toLocaleDateString(),
      date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }),
      isSpotCheck ? 'Spot Check' : 'Purchase',
      record.meterReading.toFixed(1),
      isSpotCheck ? '' : record.units.toFixed(2),
      isSpotCheck ? '' : record.price.toFixed(2),
      isSpotCheck ? '' : record.vat.toFixed(2),
      isSpotCheck ? '' : record.serviceFee.toFixed(2),
      isSpotCheck ? '' : rate.toFixed(2),
      daysSincePrev,
      usageSincePrev,
      dailyAvgUsage
    ]);
  }

  // Add summary rows
  const purchaseRecords = sortedRecords.filter(r => r.recordType !== 'SPOT_CHECK' && r.units > 0);
  const totalSpend = purchaseRecords.reduce((sum, r) => sum + r.price, 0);
  const totalUnits = purchaseRecords.reduce((sum, r) => sum + r.units, 0);
  const avgRate = totalUnits > 0 ? totalSpend / totalUnits : 0;

  const firstRecord = sortedRecords[0];
  const lastRecord = sortedRecords[sortedRecords.length - 1];
  const totalUsage = lastRecord.meterReading - firstRecord.meterReading;
  const totalDays = (new Date(lastRecord.date).getTime() - new Date(firstRecord.date).getTime()) / (1000 * 60 * 60 * 24);
  const avgDailyUsage = totalDays > 0 ? totalUsage / totalDays : 0;

  rows.push([]); // Empty row
  rows.push(['SUMMARY']);
  rows.push(['Total Records', sortedRecords.length.toString()]);
  rows.push(['Total Purchases', purchaseRecords.length.toString()]);
  rows.push([`Total Spend (${currency})`, totalSpend.toFixed(2)]);
  rows.push(['Total Units Purchased (kWh)', totalUnits.toFixed(2)]);
  rows.push([`Average Rate (${currency}/kWh)`, avgRate.toFixed(2)]);
  rows.push(['Total Usage (kWh)', totalUsage.toFixed(2)]);
  rows.push(['Average Daily Usage (kWh/day)', avgDailyUsage.toFixed(2)]);
  rows.push(['Date Range', `${new Date(firstRecord.date).toLocaleDateString()} - ${new Date(lastRecord.date).toLocaleDateString()}`]);
  rows.push(['Total Days', totalDays.toFixed(0)]);

  // Convert to CSV string
  const escapeCell = (cell: string): string => {
    if (cell.includes(',') || cell.includes('"') || cell.includes('\n')) {
      return `"${cell.replace(/"/g, '""')}"`;
    }
    return cell;
  };

  const csvContent = [
    headers.map(escapeCell).join(','),
    ...rows.map(row => row.map(escapeCell).join(','))
  ].join('\n');

  // Create and trigger download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  const timestamp = new Date().toISOString().split('T')[0];
  link.setAttribute('href', url);
  link.setAttribute('download', `VoltTrack_Export_${timestamp}.csv`);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
};
