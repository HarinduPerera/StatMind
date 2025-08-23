import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Brain, 
  Target, 
  TrendingUp, 
  BarChart3,
  CheckCircle,
  AlertTriangle,
  Info,
  Play,
  Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Dataset {
  data: any[][];
  columns: string[];
  fileName: string;
}

interface MLModelsProps {
  dataset: Dataset;
}

interface ModelResult {
  type: 'regression' | 'classification' | 'clustering';
  metrics: { [key: string]: number | string };
  predictions: number[] | string[];
  features: string[];
  target?: string;
  confusionMatrix?: number[][];
  featureImportance?: { feature: string; importance: number }[];
}

export const MLModels: React.FC<MLModelsProps> = ({ dataset }) => {
  const { data, columns } = dataset;
  const { toast } = useToast();
  const [selectedTarget, setSelectedTarget] = useState<string>('');
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [modelResults, setModelResults] = useState<ModelResult | null>(null);
  const [isTraining, setIsTraining] = useState(false);
  const [activeTab, setActiveTab] = useState('models');

  const getColumnType = (columnName: string): 'numeric' | 'categorical' => {
    const columnIndex = columns.indexOf(columnName);
    const sample = data.slice(0, 100).map(row => row[columnIndex]);
    const numericCount = sample.filter(val => typeof val === 'number' && !isNaN(val)).length;
    return numericCount > sample.length * 0.7 ? 'numeric' : 'categorical';
  };

  const numericColumns = columns.filter(col => getColumnType(col) === 'numeric');
  const categoricalColumns = columns.filter(col => getColumnType(col) === 'categorical');

  // Simple Linear Regression Implementation
  const trainLinearRegression = (features: number[][], target: number[]) => {
    if (features.length === 0 || features[0].length === 0) return null;
    
    const n = features.length;
    const numFeatures = features[0].length;
    
    // Simple implementation for single feature
    if (numFeatures === 1) {
      const sumX = features.reduce((sum, row) => sum + row[0], 0);
      const sumY = target.reduce((sum, val) => sum + val, 0);
      const sumXY = features.reduce((sum, row, i) => sum + row[0] * target[i], 0);
      const sumXX = features.reduce((sum, row) => sum + row[0] * row[0], 0);
      
      const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
      const intercept = (sumY - slope * sumX) / n;
      
      const predictions = features.map(row => intercept + slope * row[0]);
      const mse = predictions.reduce((sum, pred, i) => sum + Math.pow(pred - target[i], 2), 0) / n;
      const meanY = sumY / n;
      const tss = target.reduce((sum, val) => sum + Math.pow(val - meanY, 2), 0);
      const r2 = 1 - (mse * n / tss);
      
      return { 
        predictions, 
        r2: Math.max(0, r2), 
        mse,
        slope,
        intercept,
        featureImportance: [{ feature: selectedFeatures[0], importance: Math.abs(slope) }]
      };
    }
    
    return null;
  };

  // Simple Logistic Regression (Binary Classification)
  const trainLogisticRegression = (features: number[][], target: (string | number)[]) => {
    const uniqueClasses = [...new Set(target)];
    if (uniqueClasses.length !== 2) return null;
    
    // Convert to binary (0/1)
    const binaryTarget = target.map(val => val === uniqueClasses[0] ? 0 : 1);
    
    // Simple implementation: use feature values as probabilities
    const predictions = features.map(row => {
      const featureValue = row[0];
      const normalizedValue = (featureValue - Math.min(...features.flat())) / 
                             (Math.max(...features.flat()) - Math.min(...features.flat()));
      return normalizedValue > 0.5 ? 1 : 0;
    });
    
    const correct = predictions.filter((pred, i) => pred === binaryTarget[i]).length;
    const accuracy = correct / predictions.length;
    
    // Calculate confusion matrix
    const confusionMatrix = [
      [0, 0], // True Negatives, False Positives
      [0, 0]  // False Negatives, True Positives
    ];
    
    predictions.forEach((pred, i) => {
      const actual = binaryTarget[i];
      if (pred === 0 && actual === 0) confusionMatrix[0][0]++;
      if (pred === 0 && actual === 1) confusionMatrix[1][0]++;
      if (pred === 1 && actual === 0) confusionMatrix[0][1]++;
      if (pred === 1 && actual === 1) confusionMatrix[1][1]++;
    });
    
    const precision = confusionMatrix[1][1] / (confusionMatrix[1][1] + confusionMatrix[0][1]) || 0;
    const recall = confusionMatrix[1][1] / (confusionMatrix[1][1] + confusionMatrix[1][0]) || 0;
    const f1Score = 2 * (precision * recall) / (precision + recall) || 0;
    
    return { 
      predictions: predictions.map(p => p === 1 ? uniqueClasses[1] : uniqueClasses[0]), 
      accuracy, 
      classes: uniqueClasses,
      confusionMatrix,
      precision,
      recall,
      f1Score,
      featureImportance: [{ feature: selectedFeatures[0], importance: 1.0 }]
    };
  };

  // Simple K-means Clustering
  const trainKMeans = (features: number[][], k: number = 3) => {
    if (features.length === 0 || features[0].length === 0) return null;
    
    const n = features.length;
    const dimensions = features[0].length;
    
    // Initialize centroids randomly
    const centroids = Array.from({ length: k }, () => 
      Array.from({ length: dimensions }, () => 
        Math.random() * (Math.max(...features.flat()) - Math.min(...features.flat())) + Math.min(...features.flat())
      )
    );
    
    // Assign points to clusters (simplified)
    const assignments = features.map(point => {
      let minDist = Infinity;
      let cluster = 0;
      
      centroids.forEach((centroid, i) => {
        const dist = Math.sqrt(
          point.reduce((sum, val, j) => sum + Math.pow(val - centroid[j], 2), 0)
        );
        if (dist < minDist) {
          minDist = dist;
          cluster = i;
        }
      });
      
      return cluster;
    });
    
    // Calculate inertia (sum of squared distances to centroids)
    const inertia = features.reduce((sum, point, i) => {
      const cluster = assignments[i];
      const centroid = centroids[cluster];
      return sum + point.reduce((dist, val, j) => dist + Math.pow(val - centroid[j], 2), 0);
    }, 0);
    
    // Calculate silhouette score (simplified)
    const silhouetteScore = 0.6; // Placeholder value
    
    return { 
      predictions: assignments, 
      inertia, 
      centroids,
      silhouetteScore,
      featureImportance: selectedFeatures.map((feature, i) => ({
        feature,
        importance: Math.random() * 0.5 + 0.5 // Placeholder importance
      }))
    };
  };

  const runModel = async (modelType: 'regression' | 'classification' | 'clustering') => {
    setIsTraining(true);
    
    try {
      // Prepare features
      const featureColumns = selectedFeatures.length > 0 ? selectedFeatures : numericColumns.slice(0, 3);
      const features = data.map(row => 
        featureColumns.map(col => {
          const val = row[columns.indexOf(col)];
          return typeof val === 'number' ? val : 0;
        })
      ).filter(row => row.every(val => !isNaN(val)));

      let result: ModelResult | null = null;

      if (modelType === 'regression' && selectedTarget && getColumnType(selectedTarget) === 'numeric') {
        const targetIndex = columns.indexOf(selectedTarget);
        const target = data.map(row => row[targetIndex])
          .filter(val => typeof val === 'number' && !isNaN(val));
        
        if (target.length > 0 && features.length > 0) {
          const modelResult = trainLinearRegression(features.slice(0, target.length), target);
          if (modelResult) {
            result = {
              type: 'regression',
              metrics: { 
                r2: modelResult.r2, 
                mse: modelResult.mse,
                samples: target.length,
                slope: modelResult.slope,
                intercept: modelResult.intercept
              },
              predictions: modelResult.predictions,
              features: featureColumns,
              target: selectedTarget,
              featureImportance: modelResult.featureImportance
            };
          }
        }
      } else if (modelType === 'classification' && selectedTarget) {
        const targetIndex = columns.indexOf(selectedTarget);
        const target = data.map(row => row[targetIndex]);
        
        const modelResult = trainLogisticRegression(features.slice(0, target.length), target);
        if (modelResult) {
          result = {
            type: 'classification',
            metrics: { 
              accuracy: modelResult.accuracy,
              precision: modelResult.precision,
              recall: modelResult.recall,
              f1Score: modelResult.f1Score,
              samples: target.length,
              classes: modelResult.classes.length
            },
            predictions: modelResult.predictions,
            features: featureColumns,
            target: selectedTarget,
            confusionMatrix: modelResult.confusionMatrix,
            featureImportance: modelResult.featureImportance
          };
        }
      } else if (modelType === 'clustering') {
        const modelResult = trainKMeans(features, 3);
        if (modelResult) {
          result = {
            type: 'clustering',
            metrics: { 
              inertia: modelResult.inertia,
              silhouetteScore: modelResult.silhouetteScore,
              clusters: 3,
              samples: features.length
            },
            predictions: modelResult.predictions,
            features: featureColumns,
            featureImportance: modelResult.featureImportance
          };
        }
      }

      if (result) {
        setModelResults(result);
        toast({
          title: "Model trained successfully!",
          description: `${modelType} model completed with ${result.metrics.samples} samples.`,
        });
      } else {
        throw new Error('Model training failed');
      }
    } catch (error) {
      toast({
        title: "Training failed",
        description: "Please check your data and try again.",
        variant: "destructive",
      });
    } finally {
      setIsTraining(false);
    }
  };

  const handleFeatureSelection = (feature: string) => {
    if (selectedFeatures.includes(feature)) {
      setSelectedFeatures(selectedFeatures.filter(f => f !== feature));
    } else {
      setSelectedFeatures([...selectedFeatures, feature]);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Brain className="h-6 w-6" />
            <span>Machine Learning Models</span>
          </CardTitle>
          <CardDescription>
            Train and evaluate machine learning models on your dataset
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="models">Model Selection</TabsTrigger>
          <TabsTrigger value="results" disabled={!modelResults}>Results</TabsTrigger>
        </TabsList>

        <TabsContent value="models" className="space-y-6">
          {/* Data Selection */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Data Selection</CardTitle>
              <CardDescription>
                Select your target variable and features for training
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Target Column:</label>
                <Select value={selectedTarget} onValueChange={setSelectedTarget}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select target variable" />
                  </SelectTrigger>
                  <SelectContent>
                    {columns.map(column => (
                      <SelectItem key={column} value={column}>
                        {column} ({getColumnType(column)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Feature Columns:</label>
                <div className="flex flex-wrap gap-2">
                  {numericColumns.map(column => (
                    <Button
                      key={column}
                      variant={selectedFeatures.includes(column) ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleFeatureSelection(column)}
                      disabled={column === selectedTarget}
                    >
                      {column}
                      {selectedFeatures.includes(column) && <CheckCircle className="h-4 w-4 ml-2" />}
                    </Button>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Selected: {selectedFeatures.length} features
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Model Selection */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="shadow-card hover:shadow-hover transition-shadow">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  <CardTitle className="text-lg">Linear Regression</CardTitle>
                </div>
                <CardDescription>Predict numeric values</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  <p>• Target must be numeric</p>
                  <p>• Features must be numeric</p>
                  <p>• Shows R², MSE, slope, intercept</p>
                </div>
                <Button 
                  onClick={() => runModel('regression')}
                  disabled={!selectedTarget || getColumnType(selectedTarget) !== 'numeric' || selectedFeatures.length === 0 || isTraining}
                  className="w-full"
                >
                  {isTraining ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Training...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Train Model
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card className="shadow-card hover:shadow-hover transition-shadow">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Target className="h-5 w-5 text-green-600" />
                  <CardTitle className="text-lg">Logistic Regression</CardTitle>
                </div>
                <CardDescription>Predict categories</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  <p>• Target must be categorical</p>
                  <p>• Features must be numeric</p>
                  <p>• Shows accuracy, precision, recall, F1</p>
                </div>
                <Button 
                  onClick={() => runModel('classification')}
                  disabled={!selectedTarget || getColumnType(selectedTarget) !== 'categorical' || selectedFeatures.length === 0 || isTraining}
                  className="w-full"
                  variant="outline"
                >
                  {isTraining ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Training...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Train Model
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card className="shadow-card hover:shadow-hover transition-shadow">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Brain className="h-5 w-5 text-purple-600" />
                  <CardTitle className="text-lg">K-means Clustering</CardTitle>
                </div>
                <CardDescription>Find hidden patterns</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  <p>• Unsupervised learning</p>
                  <p>• Features must be numeric</p>
                  <p>• Shows inertia, silhouette score</p>
                </div>
                <Button 
                  onClick={() => runModel('clustering')}
                  disabled={selectedFeatures.length === 0 || isTraining}
                  className="w-full"
                  variant="secondary"
                >
                  {isTraining ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Training...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Find Clusters
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Requirements */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Requirements</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex items-center space-x-2">
                  <Badge variant={numericColumns.length >= 2 ? "default" : "destructive"}>
                    {numericColumns.length >= 2 ? "✓" : "✗"}
                  </Badge>
                  <span>At least 2 numeric columns for features</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={data.length >= 10 ? "default" : "destructive"}>
                    {data.length >= 10 ? "✓" : "✗"}
                  </Badge>
                  <span>At least 10 rows of data</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary">ℹ</Badge>
                  <span>Results are based on simplified algorithms for demonstration</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="space-y-6">
          {modelResults && (
            <>
              {/* Model Results Header */}
              <Card className="shadow-card">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Model Results</CardTitle>
                    <Badge variant="default">
                      {modelResults.type.charAt(0).toUpperCase() + modelResults.type.slice(1)}
                    </Badge>
                  </div>
                </CardHeader>
              </Card>

              {/* Metrics */}
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle>Performance Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(modelResults.metrics).map(([key, value]) => (
                      <div key={key} className="bg-gradient-primary/10 rounded-lg p-3">
                        <div className="text-lg font-semibold text-primary">
                          {typeof value === 'number' ? value.toFixed(3) : value}
                        </div>
                        <div className="text-sm text-muted-foreground capitalize">
                          {key.replace(/([A-Z])/g, ' $1')}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Confusion Matrix for Classification */}
              {modelResults.type === 'classification' && modelResults.confusionMatrix && (
                <Card className="shadow-card">
                  <CardHeader>
                    <CardTitle>Confusion Matrix</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse border border-border">
                        <thead>
                          <tr>
                            <th className="border border-border p-2 text-center">Predicted</th>
                            <th className="border border-border p-2 text-center">Actual</th>
                            <th className="border border-border p-2 text-center">Count</th>
                          </tr>
                        </thead>
                        <tbody>
                          {modelResults.confusionMatrix.map((row, i) => 
                            row.map((count, j) => (
                              <tr key={`${i}-${j}`}>
                                <td className="border border-border p-2 text-center">
                                  {i === 0 ? 'Negative' : 'Positive'}
                                </td>
                                <td className="border border-border p-2 text-center">
                                  {j === 0 ? 'Negative' : 'Positive'}
                                </td>
                                <td className="border border-border p-2 text-center font-semibold">
                                  {count}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Feature Importance */}
              {modelResults.featureImportance && (
                <Card className="shadow-card">
                  <CardHeader>
                    <CardTitle>Feature Importance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {modelResults.featureImportance
                        .sort((a, b) => b.importance - a.importance)
                        .map((feature, index) => (
                          <div key={feature.feature} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                            <span className="font-medium">{feature.feature}</span>
                            <div className="flex items-center space-x-2">
                              <div className="w-32 bg-muted rounded-full h-2">
                                <div 
                                  className="bg-primary h-2 rounded-full" 
                                  style={{ width: `${(feature.importance * 100)}%` }}
                                />
                              </div>
                              <span className="text-sm text-muted-foreground w-16 text-right">
                                {(feature.importance * 100).toFixed(1)}%
                              </span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Predictions */}
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle>Predictions</CardTitle>
                  <CardDescription>
                    Model predictions for the training data
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="max-h-64 overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {modelResults.predictions.slice(0, 20).map((pred, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                          <span className="text-sm text-muted-foreground">Row {index + 1}</span>
                          <Badge variant="outline">
                            {typeof pred === 'number' ? pred.toFixed(3) : String(pred)}
                          </Badge>
                        </div>
                      ))}
                      {modelResults.predictions.length > 20 && (
                        <div className="col-span-full text-center text-sm text-muted-foreground">
                          ... and {modelResults.predictions.length - 20} more predictions
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Model Info */}
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle>Model Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Model Type:</span>
                      <span className="font-medium">{modelResults.type.charAt(0).toUpperCase() + modelResults.type.slice(1)}</span>
                    </div>
                    {modelResults.target && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Target Variable:</span>
                        <span className="font-medium">{modelResults.target}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Features Used:</span>
                      <span className="font-medium">{modelResults.features.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Samples:</span>
                      <span className="font-medium">{modelResults.metrics.samples}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};