import { PurchaseRecord } from "./types";

export const APP_NAME = "VoltTrack";
export const DEFAULT_CURRENCY_SYMBOL = "$"; // Configurable symbol default

// NOTE: For Backup/Restore to work, you need a valid Google Cloud Client ID.
// 1. Go to Google Cloud Console -> APIs & Services -> Credentials
// 2. Create OAuth Client ID (Web Application)
// 3. Add your domain (or localhost) to Authorized JavaScript Origins
export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || ""; 

export const MOCK_DATA: PurchaseRecord[] = [
  {
    id: '1',
    price: 50.00,
    units: 25.5,
    date: '2023-10-01T10:00:00.000Z',
    vat: 7.50,
    serviceFee: 0,
    meterReading: 10025.5
  },
  {
    id: '2',
    price: 100.00,
    units: 48.2,
    date: '2023-10-15T14:30:00.000Z',
    vat: 15.00,
    serviceFee: 2.00,
    meterReading: 10073.7
  },
  {
    id: '3',
    price: 50.00,
    units: 24.1,
    date: '2023-11-01T09:15:00.000Z',
    vat: 7.50,
    serviceFee: 0,
    meterReading: 10097.8
  }
];