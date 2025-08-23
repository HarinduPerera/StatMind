import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileUpload } from '@/components/FileUpload';
import { DataPreview } from '@/components/DataPreview';
import { Statistics } from '@/components/Statistics';
import { SimpleVisualization } from '@/components/SimpleVisualization';
import { MLModels } from '@/components/MLModels';
import { VariableAnalysis } from '@/components/VariableAnalysis';
import { Insights } from '@/components/Insights';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Brain, BarChart3, Database, TrendingUp, Lightbulb } from 'lucide-react';

interface Dataset {
  data: any[][];
  columns: string[];
  fileName: string;
}

const Index = () => {
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [activeTab, setActiveTab] = useState('upload');

  const handleDatasetUpload = (data: any[][], columns: string[], fileName: string) => {
    setDataset({ data, columns, fileName });
    setActiveTab('data');
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <header className="bg-card border-b shadow-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-primary rounded-lg">
                <Brain className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">StatMind</h1>
                <p className="text-sm text-muted-foreground">Intelligent Data Analysis Platform</p>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-7 lg:w-fit lg:grid-cols-7">
            <TabsTrigger value="upload" className="flex items-center space-x-2">
              <Database className="h-4 w-4" />
              <span className="hidden sm:inline">Upload</span>
            </TabsTrigger>
            <TabsTrigger 
              value="data" 
              disabled={!dataset}
              className="flex items-center space-x-2"
            >
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Data</span>
            </TabsTrigger>
            <TabsTrigger 
              value="statistics" 
              disabled={!dataset}
              className="flex items-center space-x-2"
            >
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Stats</span>
            </TabsTrigger>
            <TabsTrigger 
              value="visualizations" 
              disabled={!dataset}
              className="flex items-center space-x-2"
            >
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Charts</span>
            </TabsTrigger>
            <TabsTrigger 
              value="insights" 
              disabled={!dataset}
              className="flex items-center space-x-2"
            >
              <Lightbulb className="h-4 w-4" />
              <span className="hidden sm:inline">Insights</span>
            </TabsTrigger>
            <TabsTrigger 
              value="ml" 
              disabled={!dataset}
              className="flex items-center space-x-2"
            >
              <Brain className="h-4 w-4" />
              <span className="hidden sm:inline">ML</span>
            </TabsTrigger>
            <TabsTrigger 
              value="variables" 
              disabled={!dataset}
              className="flex items-center space-x-2"
            >
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Variables</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-6">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Upload Your Dataset</CardTitle>
                <CardDescription>
                  Upload a CSV or Excel file to begin analyzing your data. We'll automatically detect columns and data types.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FileUpload onUpload={handleDatasetUpload} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="data" className="space-y-6">
            {dataset && <DataPreview dataset={dataset} />}
          </TabsContent>

          <TabsContent value="statistics" className="space-y-6">
            {dataset && <Statistics dataset={dataset} />}
          </TabsContent>

          <TabsContent value="visualizations" className="space-y-6">
            {dataset && <SimpleVisualization dataset={dataset} />}
          </TabsContent>

          <TabsContent value="insights" className="space-y-6">
            {dataset && <Insights dataset={dataset} />}
          </TabsContent>

          <TabsContent value="ml" className="space-y-6">
            {dataset && <MLModels dataset={dataset} />}
          </TabsContent>

          <TabsContent value="variables" className="space-y-6">
            {dataset && <VariableAnalysis dataset={dataset} />}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;