"use server";

// =============================================================================
// SSR-only. This file runs exclusively on the Next.js server.
// - GEMINI_API_KEY and BACKEND_API_URL are read from server-side env vars.
// - The browser never imports this file (Server Action boundary enforces it).
// - DO NOT import this file from any client component.
// =============================================================================

import { GoogleGenAI } from "@google/genai";
import type { AnalysisProvider, AnalysisResult } from "@/lib/gemini";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY ?? "";
const BACKEND_API_URL = process.env.BACKEND_API_URL ?? "http://localhost:8000";

type ActionResponse =
  | { success: true; data: AnalysisResult }
  | { success: false; error: string };

export async function analyzeImageAction(formData: FormData): Promise<ActionResponse> {
  const file = formData.get("file");
  const provider = (formData.get("provider") as AnalysisProvider | null) ?? "gemini";

  if (!file || !(file instanceof File)) {
    return { success: false, error: "No file provided." };
  }

  if (provider === "custom") {
    return analyzeWithCustomBackend(file);
  }
  return analyzeWithGemini(file);
}

// -----------------------------------------------------------------------------
// Custom FastAPI backend
// -----------------------------------------------------------------------------

async function analyzeWithCustomBackend(file: File): Promise<ActionResponse> {
  const upstream = new FormData();
  upstream.append("file", file, file.name || "leaf.jpg");

  let res: Response;
  try {
    res = await fetch(`${BACKEND_API_URL}/predict`, {
      method: "POST",
      body: upstream,
      cache: "no-store",
    });
  } catch (err) {
    console.error("Backend /predict unreachable:", err);
    return {
      success: false,
      error:
        "Could not reach the custom-model backend. Is the FastAPI server running on " +
        `${BACKEND_API_URL}? Try the Gemini provider instead.`,
    };
  }

  if (!res.ok) {
    let detail = `Backend returned HTTP ${res.status}.`;
    try {
      const json = (await res.json()) as { detail?: string };
      if (json.detail) detail = json.detail;
    } catch {
      /* ignore */
    }
    return { success: false, error: detail };
  }

  const json = (await res.json()) as Record<string, unknown>;
  // The backend already returns the AnalysisResult shape minus `provider`.
  // Cast carefully and stamp the provider so downstream UI can show a badge.
  const data = { ...(json as object), provider: "custom" as const } as AnalysisResult;
  return { success: true, data };
}

// -----------------------------------------------------------------------------
// Gemini direct (server-side only — SDK is never bundled into the client)
// -----------------------------------------------------------------------------

async function analyzeWithGemini(file: File): Promise<ActionResponse> {
  if (!GEMINI_API_KEY || GEMINI_API_KEY === "your_gemini_api_key_here") {
    return {
      success: false,
      error:
        "GEMINI_API_KEY is not configured in the frontend .env.local. " +
        "Either set it or use the Custom Model provider.",
    };
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");

    const client = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

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
      model: "gemini-2.0-flash-lite",
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            { inlineData: { data: base64, mimeType: file.type || "image/jpeg" } },
          ],
        },
      ],
      config: { responseMimeType: "application/json" },
    });

    const text =
      typeof response.text === "string" ? response.text : JSON.stringify(response);
    const cleaned = text.replace(/```json\n|\n```/g, "").trim();
    const parsed = JSON.parse(cleaned) as Omit<AnalysisResult, "status" | "provider">;

    const data: AnalysisResult = {
      ...parsed,
      status: "ok",
      provider: "gemini",
    };
    return { success: true, data };
  } catch (err) {
    console.error("Gemini analysis failed:", err);
    return { success: false, error: "Failed to analyze image with Gemini. Please try again." };
  }
}
