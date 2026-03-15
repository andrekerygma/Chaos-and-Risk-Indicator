import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface MarketMetric {
  current: number;
  changeDay: number;
  changeWeek: number;
  changeMonth: number;
  changeYear: number;
  change5Years: number;
}

export interface MarketData {
  gold: MarketMetric;
  oil: MarketMetric;
  yields: MarketMetric;
  vix: MarketMetric;
  dxy: MarketMetric;
  // Energy
  naturalGas: MarketMetric;
  coal: MarketMetric;
  // Industrial Metals
  copper: MarketMetric;
  ironOre: MarketMetric;
  // Battery Metals
  lithium: MarketMetric;
  nickel: MarketMetric;
  cobalt: MarketMetric;
  // Grains
  soybeans: MarketMetric;
  wheat: MarketMetric;
  corn: MarketMetric;
  // Softs
  sugar: MarketMetric;
  coffee: MarketMetric;
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
    Get the current prices and historical changes (1 day, 1 week, 1 month, 1 year, 5 years) for the following indicators.
    Use percentages for changes. Return the data in a strict JSON format.

    Indicators:
    1. Gold (XAU/USD)
    2. Crude Oil (WTI)
    3. US 10-Year Treasury Bond Yields
    4. VIX Index
    5. US Dollar Index (DXY)
    6. Natural Gas (Henry Hub)
    7. Coal (Newcastle)
    8. Copper (LME)
    9. Iron Ore (62% Fe CFR China)
    10. Lithium Carbonate (China)
    11. Nickel (LME)
    12. Cobalt (LME)
    13. Soybeans (CBOT)
    14. Wheat (CBOT)
    15. Corn (CBOT)
    16. Sugar (No. 11)
    17. Coffee (Arabica)
    
    JSON Structure:
    {
      "gold": { "current": number, "changeDay": number, "changeWeek": number, "changeMonth": number, "changeYear": number, "change5Years": number },
      "oil": { "current": number, "changeDay": number, "changeWeek": number, "changeMonth": number, "changeYear": number, "change5Years": number },
      "yields": { "current": number, "changeDay": number, "changeWeek": number, "changeMonth": number, "changeYear": number, "change5Years": number },
      "vix": { "current": number, "changeDay": number, "changeWeek": number, "changeMonth": number, "changeYear": number, "change5Years": number },
      "dxy": { "current": number, "changeDay": number, "changeWeek": number, "changeMonth": number, "changeYear": number, "change5Years": number },
      "naturalGas": { "current": number, "changeDay": number, "changeWeek": number, "changeMonth": number, "changeYear": number, "change5Years": number },
      "coal": { "current": number, "changeDay": number, "changeWeek": number, "changeMonth": number, "changeYear": number, "change5Years": number },
      "copper": { "current": number, "changeDay": number, "changeWeek": number, "changeMonth": number, "changeYear": number, "change5Years": number },
      "ironOre": { "current": number, "changeDay": number, "changeWeek": number, "changeMonth": number, "changeYear": number, "change5Years": number },
      "lithium": { "current": number, "changeDay": number, "changeWeek": number, "changeMonth": number, "changeYear": number, "change5Years": number },
      "nickel": { "current": number, "changeDay": number, "changeWeek": number, "changeMonth": number, "changeYear": number, "change5Years": number },
      "cobalt": { "current": number, "changeDay": number, "changeWeek": number, "changeMonth": number, "changeYear": number, "change5Years": number },
      "soybeans": { "current": number, "changeDay": number, "changeWeek": number, "changeMonth": number, "changeYear": number, "change5Years": number },
      "wheat": { "current": number, "changeDay": number, "changeWeek": number, "changeMonth": number, "changeYear": number, "change5Years": number },
      "corn": { "current": number, "changeDay": number, "changeWeek": number, "changeMonth": number, "changeYear": number, "change5Years": number },
      "sugar": { "current": number, "changeDay": number, "changeWeek": number, "changeMonth": number, "changeYear": number, "change5Years": number },
      "coffee": { "current": number, "changeDay": number, "changeWeek": number, "changeMonth": number, "changeYear": number, "change5Years": number },
      "lastUpdated": "ISO date string"
    }
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
