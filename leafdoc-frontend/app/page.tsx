"use client";

import { useReducer, useState } from "react";
import { FileUpload } from "@/components/file-upload";
import { AnalysisResultDisplay } from "@/components/analysis-result";
import { ComparisonView } from "@/components/comparison-view";
import { type AnalysisResult } from "@/lib/gemini";
import { analyzeImageAction } from "@/app/actions/analyze";
import { Leaf, History, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

// State Management
type State = 
  | { status: "IDLE" }
  | { status: "UPLOADING" }
  | { status: "ANALYZING" }
  | { status: "SUCCESS"; result: AnalysisResult }
  | { status: "ERROR"; error: string };

type Action =
  | { type: "START_UPLOAD" }
  | { type: "START_ANALYSIS" }
  | { type: "ANALYSIS_SUCCESS"; payload: AnalysisResult }
  | { type: "ANALYSIS_ERROR"; payload: string }
  | { type: "RESET" };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "START_UPLOAD":
      return { status: "UPLOADING" };
    case "START_ANALYSIS":
      return { status: "ANALYZING" };
    case "ANALYSIS_SUCCESS":
      return { status: "SUCCESS", result: action.payload };
    case "ANALYSIS_ERROR":
      return { status: "ERROR", error: action.payload };
    case "RESET":
      return { status: "IDLE" };
    default:
      return state;
  }
}

export default function Home() {
  const [state, dispatch] = useReducer(reducer, { status: "IDLE" });
  /* eslint-disable @typescript-eslint/no-unused-vars */
  const [history, setHistory] = useState<AnalysisResult[]>([]);
  const [comparisonList, setComparisonList] = useState<AnalysisResult[]>([]);

  const handleFileSelect = async (file: File) => {
    dispatch({ type: "START_ANALYSIS" });
    
    // Create FormData for Server Action
    const formData = new FormData();
    formData.append("file", file);

    try {
      const result = await analyzeImageAction(formData);
      
      if (result.success && result.data) {
        dispatch({ type: "ANALYSIS_SUCCESS", payload: result.data });
        setHistory(prev => [result.data!, ...prev]);
      } else {
        throw new Error(result.error || "Analysis failed");
      }
    } catch (error) {
      dispatch({ type: "ANALYSIS_ERROR", payload: error instanceof Error ? error.message : "An unexpected error occurred" });
    }
  };

  const handleReset = () => {
    dispatch({ type: "RESET" });
  };

  const addToComparison = (result: AnalysisResult) => {
    if (comparisonList.length < 5 && !comparisonList.includes(result)) {
        setComparisonList(prev => [...prev, result]);
    }
  };

  const removeFromComparison = (index: number) => {
    setComparisonList(prev => prev.filter((_, i) => i !== index));
  };
  
  const clearComparison = () => {
    setComparisonList([]);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl relative">
        <div className="absolute top-4 right-4 z-40">
           <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <History className="h-5 w-5" />
                <span className="sr-only">History</span>
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Analysis History</SheetTitle>
              </SheetHeader>
              <ScrollArea className="h-[calc(100vh-5rem)] mt-4">
                <div className="space-y-4">
                  {history.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No history yet.</p>
                  ) : (
                     history.map((item, i) => (
                      <Card key={i} className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => dispatch({ type: "ANALYSIS_SUCCESS", payload: item })}>
                        <CardContent className="p-4 space-y-2">
                           <div className="flex justify-between items-start">
                             <CardTitle className="text-sm font-medium">{item.diseaseName}</CardTitle>
                             <Badge variant={item.isHealthy ? "default" : "destructive"}>
                               {item.isHealthy ? "Healthy" : "Infected"}
                             </Badge>
                           </div>
                           <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>
                        </CardContent>
                      </Card>
                     ))
                  )}
                </div>
              </ScrollArea>
            </SheetContent>
          </Sheet>
        </div>
        <div className="space-y-8">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold sm:text-4xl md:text-5xl">Plant Disease Detector</h1>
            <p className="text-muted-foreground max-w-[700px] mx-auto text-lg">
              Identify plant diseases instantly with AI-powered analysis. Upload an image to get detailed diagnosis and treatment recommendations.
            </p>
          </div>

          <div className="max-w-xl mx-auto">
             {state.status === "IDLE" || state.status === "UPLOADING" || state.status === "ANALYZING" || state.status === "ERROR" ? (
               <div className="space-y-6">
                 <FileUpload onFileSelect={handleFileSelect} isUploading={state.status === "ANALYZING"} />
                 {state.status === "ANALYZING" && (
                    <div className="flex flex-col items-center justify-center space-y-4 animate-in fade-in zoom-in duration-300">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="text-muted-foreground animate-pulse">Analyzing plant health...</p>
                    </div>
                 )}
                 {state.status === "ERROR" && (
                    <div className="p-4 text-center rounded-lg bg-destructive/10 text-destructive animate-in shake">
                        <p>Error: {state.error}</p>
                        <Button variant="link" onClick={handleReset} className="mt-2">Try Again</Button>
                    </div>
                 )}
               </div>
             ) : (
                <div className="space-y-6">
                    <div className="flex flex-wrap gap-4 mb-4">
                        <Button variant="outline" onClick={handleReset} className="group">
                            <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
                            Analyze Another
                        </Button>
                        <Button variant="secondary" onClick={() => addToComparison(state.result)} disabled={comparisonList.some(i => i === state.result)}>
                            Add to Compare
                        </Button>
                    </div>
                    
                    {comparisonList.length > 0 && (
                        <ComparisonView 
                            items={comparisonList} 
                            onRemove={removeFromComparison} 
                            onClear={clearComparison}
                        />
                    )}
                    
                    <AnalysisResultDisplay result={state.result} />
                </div>
             )}
          </div>
        </div>
      </main>
      
      <footer className="border-t py-6 md:py-0">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row mx-auto px-4">
             <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
                Built with Next.js, shadcn/ui and Gemini AI.
             </p>
        </div>
      </footer>
    </div>
  );
}
