"use client";

import { AnalysisResult } from "@/lib/gemini";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, CheckCircle, Leaf, Droplets, Sun, Thermometer } from "lucide-react";
import { AnalysisCharts } from "./analysis-charts";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AnalysisResultDisplayProps {
  result: AnalysisResult;
}

export function AnalysisResultDisplay({ result }: AnalysisResultDisplayProps) {
  return (
    <div className="w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Card className="border-l-4 border-l-primary">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-2xl flex items-center gap-2">
                {result.isHealthy ? (
                  <CheckCircle className="h-6 w-6 text-green-500" />
                ) : (
                  <AlertCircle className="h-6 w-6 text-destructive" />
                )}
                {result.diseaseName}
              </CardTitle>
              <CardDescription>
                Confidence: {result.confidence}%
              </CardDescription>
            </div>
            <Badge variant={result.isHealthy ? "default" : "destructive"}>
              {result.isHealthy ? "Healthy" : "Infected"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Severity</span>
              <span>{result.severity}%</span>
            </div>
            <Progress value={result.severity} className="h-2" />
            <p className="mt-4 text-muted-foreground">{result.description}</p>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="treatment">Treatment</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Symptoms</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                            {result.symptoms.map((symptom, i) => (
                                <li key={i}>{symptom}</li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Environment</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <Thermometer className="h-4 w-4 text-orange-500" />
                                <span className="text-sm">{result.environmentalFactors.temperature}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <Droplets className="h-4 w-4 text-blue-500" />
                                <span className="text-sm">{result.environmentalFactors.humidity}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <Sun className="h-4 w-4 text-yellow-500" />
                                <span className="text-sm">{result.environmentalFactors.sunlight}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <Leaf className="h-4 w-4 text-green-500" />
                                <span className="text-sm">{result.environmentalFactors.watering}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </TabsContent>

        <TabsContent value="treatment" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Treatment Plan</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-[200px]">
                            <ol className="list-decimal pl-5 space-y-2 text-muted-foreground">
                                {result.treatment.map((step, i) => (
                                    <li key={i}>{step}</li>
                                ))}
                            </ol>
                        </ScrollArea>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Prevention</CardTitle>
                    </CardHeader>
                    <CardContent>
                         <ScrollArea className="h-[200px]">
                            <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                                {result.prevention.map((tip, i) => (
                                    <li key={i}>{tip}</li>
                                ))}
                            </ul>
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>
        </TabsContent>

        <TabsContent value="analytics" className="mt-4">
            <AnalysisCharts data={result} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
