import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface MarketData {
  gold: { current: number; changeDay: number; changeWeek: number; changeMonth: number; changeYear: number; change5Years: number };
  oil: { current: number; changeDay: number; changeWeek: number; changeMonth: number; changeYear: number; change5Years: number };
  yields: { current: number; changeDay: number; changeWeek: number; changeMonth: number; changeYear: number; change5Years: number };
  vix: { current: number; changeDay: number; changeWeek: number; changeMonth: number; changeYear: number; change5Years: number };
  dxy: { current: number; changeDay: number; changeWeek: number; changeMonth: number; changeYear: number; change5Years: number };
  lastUpdated: string;
}

export async function fetchMarketAnalysis(prompt: string) {
  const model = "gemini-3-flash-preview";
  
  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
    },
  });

  return response.text;
}

export async function getMarketData(): Promise<MarketData> {
  const model = "gemini-3-flash-preview";
  
  const prompt = `
    Get the current prices and historical changes (1 day, 1 week, 1 month, 1 year, 5 years) for:
    1. Gold (XAU/USD)
    2. Crude Oil (WTI)
    3. US 10-Year Treasury Bond Yields
    4. VIX Index (Volatility Index)
    5. US Dollar Index (DXY)
    
    Return the data in a strict JSON format:
    {
      "gold": { "current": number, "changeDay": number, "changeWeek": number, "changeMonth": number, "changeYear": number, "change5Years": number },
      "oil": { "current": number, "changeDay": number, "changeWeek": number, "changeMonth": number, "changeYear": number, "change5Years": number },
      "yields": { "current": number, "changeDay": number, "changeWeek": number, "changeMonth": number, "changeYear": number, "change5Years": number },
      "vix": { "current": number, "changeDay": number, "changeWeek": number, "changeMonth": number, "changeYear": number, "change5Years": number },
      "dxy": { "current": number, "changeDay": number, "changeWeek": number, "changeMonth": number, "changeYear": number, "change5Years": number },
      "lastUpdated": "ISO date string"
    }
    Use percentages for changes.
  `;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json"
    },
  });

  try {
    const text = response.text || "{}";
    const cleanJson = text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(cleanJson);
  } catch (e) {
    console.error("Failed to parse market data", e);
    throw e;
  }
}
