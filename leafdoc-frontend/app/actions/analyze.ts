"use server";

import { GoogleGenAI } from "@google/genai";
import { AnalysisResult } from "@/lib/gemini";

const apiKey =
  process.env.GEMINI_API_KEY;
const client = new GoogleGenAI({ apiKey });

export async function analyzeImageAction(
  formData: FormData
): Promise<{ success: boolean; data?: AnalysisResult; error?: string }> {
  try {
    const file = formData.get("file") as File;
    if (!file) {
      return { success: false, error: "No file provided" };
    }

    const arrayBuffer = await file.arrayBuffer();
    const base64String = Buffer.from(arrayBuffer).toString("base64");

    const prompt = `
      Analyze this plant image for diseases. 
      Return ONLY a JSON object with this structure:
      {
        "isHealthy": boolean,
        "diseaseName": "string or 'Healthy'",
        "confidence": number (0-100),
        "description": "brief description of condition",
        "symptoms": ["list", "of", "observable", "symptoms"],
        "treatment": ["step by step", "treatment", "instructions"],
        "prevention": ["prevention", "tips"],
        "severity": number (0-100, 0 if healthy),
        "progression": [
          {"stage": "Early", "timeline": "Days 1-3"},
          {"stage": "Mid", "timeline": "Days 4-7"},
          {"stage": "Late", "timeline": "Week 2+"}
        ],
        "environmentalFactors": {
          "temperature": "ideal range",
          "humidity": "ideal range",
          "sunlight": "requirements",
          "watering": "requirements"
        }
      }
    `;

    const response = await client.models.generateContent({
      model: "gemini-2.0-flash-lite", // Using the model user requested/changed to
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            {
              inlineData: {
                data: base64String,
                mimeType: file.type,
              },
            },
          ],
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
    const data = JSON.parse(cleanText) as AnalysisResult;

    return { success: true, data };
  } catch (error) {
    console.error("Gemini Analysis Failed:", error);
    return {
      success: false,
      error: "Failed to analyze image. Please try again.",
    };
  }
}
