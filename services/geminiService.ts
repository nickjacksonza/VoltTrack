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
  // However, we could potentially use them for finer grained usage analysis later.
  // For now, to prevent the AI from thinking we bought 0 units, we filter them or label them clearly.
  // Let's filter to keep the prompt focused on Purchasing habits.
  const validRecords = records.filter(r => r.recordType !== 'SPOT_CHECK' && r.units > 0);

  if (validRecords.length === 0) {
    return {
      summary: "No purchase history available to analyze.",
      trend: "Start adding purchase records to see trends.",
      recommendations: ["Add your first purchase record."]
    };
  }

  // Format data for the prompt to save tokens but keep context
  const dataString = JSON.stringify(
    validRecords.map(r => ({
      date: r.date.split('T')[0],
      price: r.price,
      vat: r.vat,
      fee: r.serviceFee,
      totalCost: r.price + r.vat + r.serviceFee,
      units: r.units,
      meter: r.meterReading
    }))
  );

  const prompt = `
    Analyze the following prepaid electricity purchase data:
    ${dataString}

    Note: 'totalCost' is the sum of price, vat, and fee.
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