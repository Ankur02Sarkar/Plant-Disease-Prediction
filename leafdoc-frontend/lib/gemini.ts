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
