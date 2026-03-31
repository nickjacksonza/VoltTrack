import { GoogleGenAI, Type } from "@google/genai";
import { PurchaseRecord, AnalysisResult } from "../types";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.warn("API_KEY not found in environment variables.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const analyzeElectricityUsage = async (records: PurchaseRecord[], currency: string = "$"): Promise<AnalysisResult | null> => {
  const ai = getClient();
  if (!ai) return null;

  // Filter out spot checks for the main financial analysis, as they have 0 cost/units
  // Records are already sorted chronologically (oldest first) from App.tsx
  const validRecords = records.filter(r => r.recordType !== 'SPOT_CHECK' && r.units > 0);

  if (validRecords.length === 0) {
    return {
      summary: "No purchase history available to analyze.",
      trend: "Start adding purchase records to see trends.",
      recommendations: ["Add your first purchase record."]
    };
  }

  // Format data for the prompt to save tokens but keep context
  // Note: price already includes VAT and service fee - they're just breakdown info
  const dataString = JSON.stringify(
    validRecords.map(r => ({
      date: r.date.split('T')[0],
      totalPaid: r.price,
      vatIncluded: r.vat,
      serviceFeeIncluded: r.serviceFee,
      units: r.units,
      ratePerUnit: r.units > 0 ? (r.price / r.units).toFixed(2) : 0,
      meter: r.meterReading
    }))
  );

  const prompt = `
    Analyze the following prepaid electricity purchase data:
    ${dataString}

    Note: 'totalPaid' is the total amount paid (VAT and service fee are already included in this amount - they're shown separately just for breakdown).
    The effective rate per kWh is 'ratePerUnit' = totalPaid / units.
    The currency symbol used is '${currency}'.

    Provide a structured JSON response containing:
    1. "summary": A concise summary of spending and consumption habits (max 2 sentences).
    2. "trend": Analysis of cost per unit (effective rate) and usage frequency over time (increasing/decreasing/stable).
    3. "recommendations": An array of 3 actionable tips to save money or optimize purchasing based on this specific data pattern.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            trend: { type: Type.STRING },
            recommendations: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          }
        }
      }
    });

    const text = response.text;
    if (text) {
      return JSON.parse(text) as AnalysisResult;
    }
    return null;

  } catch (error) {
    console.error("Error analyzing data with Gemini:", error);
    throw error;
  }
};