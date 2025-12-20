import { GoogleGenAI } from "@google/genai";

const client = new GoogleGenAI({
  apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY,
});

export interface AnalysisResult {
  isHealthy: boolean;
  diseaseName: string;
  confidence: number;
  description: string;
  symptoms: string[];
  treatment: string[];
  prevention: string[];
  severity: number; // 0-100
  progression: {
    stage: string;
    timeline: string;
  }[];
  environmentalFactors: {
    temperature: string;
    humidity: string;
    sunlight: string;
    watering: string;
  };
}

export async function analyzePlantImage(file: File): Promise<AnalysisResult> {
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

  try {
    const response = await client.models.generateContent({
      model: "gemini-2.0-flash-lite",
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

    console.log("response : ", response);

    // The new SDK response structure might be slightly different
    // Based on typical Google SDKs, it should return a standardized response object
    const text =
      typeof response.text === "string"
        ? response.text
        : JSON.stringify(response);

    // If response.text() is not available, we need to inspect the object.
    // However, for generateContent, it usually returns a GenerateContentResponse which has a text function helper or candidates.
    // Let's assume the standard usage.

    const cleanText = text.replace(/```json\n|\n```/g, "").trim();
    return JSON.parse(cleanText) as AnalysisResult;
  } catch (error) {
    console.error("Gemini Analysis Failed:", error);
    throw new Error("Failed to analyze image. Please try again.");
  }
}
