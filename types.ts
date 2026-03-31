export interface PurchaseRecord {
  id: string;
  price: number;
  units: number;
  date: string; // ISO Date string
  vat: number;
  serviceFee: number;
  meterReading: number;
  recordType?: 'PURCHASE' | 'SPOT_CHECK';
}

export interface ChartDataPoint {
  date: string;
  cost: number;
  units: number;
  reading: number;
}

export enum AppView {
  DASHBOARD = 'DASHBOARD',
  HISTORY = 'HISTORY',
  ADD = 'ADD',
  INSIGHTS = 'INSIGHTS',
  MONTHLY = 'MONTHLY'
}

export interface AnalysisResult {
  summary: string;
  trend: string;
  recommendations: string[];
}

export interface UserProfile {
  name: string;
  email: string;
  picture: string;
}

export interface BackupData {
  records: PurchaseRecord[];
  currency: string;
  lastUpdated: string;
}