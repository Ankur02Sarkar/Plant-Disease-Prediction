"use server";

import { GoogleGenAI } from "@google/genai";

const apiKey =
  process.env.GEMINI_API_KEY;
const client = new GoogleGenAI({ apiKey });

export interface RecommendationResult {
  crops: {
    name: string;
    type: "Short-term" | "Long-term";
    suitabilityScore: number; // 0-100
    cultivationTime: string;
    description: string;
    benefits: string[];
  }[];
  cultivationGuide: string;
  bestPractices: string[];
}

export async function getRecommendationsAction(
  location: string,
  weather: any
): Promise<{ success: boolean; data?: RecommendationResult; error?: string }> {
  const prompt = `
    Based on the location "${location}" and the following weather conditions: ${JSON.stringify(
    weather
  )},
    recommend suitable crops/plants to grow.
    
    Return ONLY a JSON object with this valid structure:
    {
      "crops": [
        {
          "name": "Crop Name",
          "type": "Short-term" or "Long-term",
          "suitabilityScore": number (0-100),
          "cultivationTime": "e.g., 3 months",
          "description": "Why it is suitable here",
          "benefits": ["benefit 1", "benefit 2"]
        }
      ],
      "cultivationGuide": "General detailed guide for this season/location",
      "bestPractices": ["practice 1", "practice 2"]
    }
  `;

  try {
    const response = await client.models.generateContent({
      model: "gemini-2.0-flash-lite",
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
      config: {
        responseMimeType: "application/json",
      },
    });

    const text =
      typeof response.text === "string"
        ? response.text
        : JSON.stringify(response);
    const cleanText = text.replace(/```json\n|\n```/g, "").trim();
    const data = JSON.parse(cleanText) as RecommendationResult;

    return { success: true, data };
  } catch (error) {
    console.error("Gemini Recommendation Failed:", error);
    return { success: false, error: "Failed to generate recommendations." };
  }
}
