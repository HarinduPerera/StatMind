import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart3, 
  TrendingUp, 
  PieChart, 
  ScatterPlot, 
  Database,
  CheckCircle,
  AlertTriangle,
  Info,
  Target
} from 'lucide-react';

interface Dataset {
  data: any[][];
  columns: string[];
  fileName: string;
}

interface VariableAnalysisProps {
  dataset: Dataset;
}

interface VariableInfo {
  name: string;
  type: 'numeric' | 'categorical' | 'mixed' | 'date';
  missingPercentage: number;
  uniqueValues: number;
  isSuitable: {
    correlation: boolean;
    regression: boolean;
    classification: boolean;
    clustering: boolean;
    timeSeries: boolean;
    visualization: boolean;
  };
  recommendations: string[];
}

export const VariableAnalysis: React.FC<VariableAnalysisProps> = ({ dataset }) => {
  const { data, columns } = dataset;
  const [activeTab, setActiveTab] = useState('overview');

  const getColumnType = (columnName: string): 'numeric' | 'categorical' | 'mixed' | 'date' => {
    const columnIndex = columns.indexOf(columnName);
    const sample = data.slice(0, 100).map(row => row[columnIndex]);
    
    // Check if it's a date column
    const datePattern = /^\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4}|\d{2}-\d{2}-\d{4}$/;
    const dateCount = sample.filter(val => 
      val && typeof val === 'string' && datePattern.test(val)
    ).length;
    
    if (dateCount > sample.length * 0.3) return 'date';
    
    const numericCount = sample.filter(val => typeof val === 'number' && !isNaN(val)).length;
    const categoricalCount = sample.filter(val => 
      val && typeof val === 'string' && val !== '' && val !== 'null'
    ).length;
    
    if (numericCount > sample.length * 0.7) return 'numeric';
    if (categoricalCount > sample.length * 0.7) return 'categorical';
    return 'mixed';
  };

  const analyzeVariable = (columnName: string): VariableInfo => {
    const columnIndex = columns.indexOf(columnName);
    const values = data.map(row => row[columnIndex]);
    const type = getColumnType(columnName);
    
    const missingCount = values.filter(val => 
      val === null || val === undefined || val === '' || val === 'null'
    ).length;
    const missingPercentage = (missingCount / values.length) * 100;
    
    const uniqueValues = new Set(values.filter(val => 
      val !== null && val !== undefined && val !== '' && val !== 'null'
    )).size;
    
    const isSuitable = {
      correlation: type === 'numeric' && missingPercentage < 20,
      regression: type === 'numeric' && missingPercentage < 10 && uniqueValues > 5,
      classification: type === 'categorical' && missingPercentage < 20 && uniqueValues > 1 && uniqueValues < 50,
      clustering: type === 'numeric' && missingPercentage < 20,
      timeSeries: type === 'date' || (type === 'numeric' && missingPercentage < 5),
      visualization: true // All variables can be visualized
    };
    
    const recommendations: string[] = [];
    
    if (missingPercentage > 20) {
      recommendations.push('High missing data - consider imputation or removal');
    }
    if (type === 'categorical' && uniqueValues > 50) {
      recommendations.push('Too many categories - consider grouping or feature engineering');
    }
    if (type === 'mixed') {
      recommendations.push('Mixed data types - consider data cleaning and standardization');
    }
    if (type === 'date') {
      recommendations.push('Date column - can be used for time series analysis');
    }
    if (isSuitable.regression) {
      recommendations.push('Good candidate for regression analysis');
    }
    if (isSuitable.classification) {
      recommendations.push('Good candidate for classification analysis');
    }
    if (isSuitable.clustering) {
      recommendations.push('Good candidate for clustering analysis');
    }
    
    return {
      name: columnName,
      type,
      missingPercentage,
      uniqueValues,
      isSuitable,
      recommendations
    };
  };

  const variableAnalysis = columns.map(analyzeVariable);
  const numericVariables = variableAnalysis.filter(v => v.type === 'numeric');
  const categoricalVariables = variableAnalysis.filter(v => v.type === 'categorical');
  const dateVariables = variableAnalysis.filter(v => v.type === 'date');
  const mixedVariables = variableAnalysis.filter(v => v.type === 'mixed');

  const getAnalysisRecommendations = () => {
    const recommendations = [];
    
    if (numericVariables.length >= 2) {
      recommendations.push('Correlation analysis between numeric variables');
      recommendations.push('Regression analysis with numeric targets');
      recommendations.push('Clustering analysis using numeric features');
    }
    
    if (categoricalVariables.length >= 1 && numericVariables.length >= 1) {
      recommendations.push('Group analysis by categorical variables');
      recommendations.push('ANOVA or t-tests for group comparisons');
    }
    
    if (dateVariables.length >= 1) {
      recommendations.push('Time series analysis and trend identification');
      recommendations.push('Seasonal pattern analysis');
    }
    
    if (categoricalVariables.length >= 1) {
      recommendations.push('Frequency analysis and distribution charts');
      recommendations.push('Classification analysis with categorical targets');
    }
    
    return recommendations;
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Database className="h-6 w-6" />
            <span>Variable Analysis & Recommendations</span>
          </CardTitle>
          <CardDescription>
            Understand your dataset variables and get recommendations for analysis
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="variables">Variables</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          <TabsTrigger value="analysis">Analysis Types</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Dataset Summary */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Dataset Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gradient-primary/10 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-primary">{data.length}</div>
                  <div className="text-sm text-muted-foreground">Total Rows</div>
                </div>
                <div className="bg-gradient-primary/10 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-primary">{columns.length}</div>
                  <div className="text-sm text-muted-foreground">Total Columns</div>
                </div>
                <div className="bg-gradient-primary/10 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-primary">{numericVariables.length}</div>
                  <div className="text-sm text-muted-foreground">Numeric Variables</div>
                </div>
                <div className="bg-gradient-primary/10 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-primary">{categoricalVariables.length}</div>
                  <div className="text-sm text-muted-foreground">Categorical Variables</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Variable Type Distribution */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Variable Types</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-500">
                  <div className="flex items-center space-x-2 mb-2">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                    <h3 className="font-semibold text-blue-900">Numeric Variables</h3>
                  </div>
                  <p className="text-blue-700 text-sm">
                    {numericVariables.length} variables suitable for mathematical operations, 
                    correlation analysis, and regression.
                  </p>
                </div>
                
                <div className="bg-green-50 rounded-lg p-4 border-l-4 border-green-500">
                  <div className="flex items-center space-x-2 mb-2">
                    <BarChart3 className="h-5 w-5 text-green-600" />
                    <h3 className="font-semibold text-green-900">Categorical Variables</h3>
                  </div>
                  <p className="text-green-700 text-sm">
                    {categoricalVariables.length} variables for grouping, classification, 
                    and frequency analysis.
                  </p>
                </div>
                
                <div className="bg-purple-50 rounded-lg p-4 border-l-4 border-purple-500">
                  <div className="flex items-center space-x-2 mb-2">
                    <PieChart className="h-5 w-5 text-purple-600" />
                    <h3 className="font-semibold text-purple-900">Date Variables</h3>
                  </div>
                  <p className="text-purple-700 text-sm">
                    {dateVariables.length} variables for time series analysis, 
                    trends, and seasonal patterns.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="variables" className="space-y-6">
          {/* Variable Details */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Variable Details</CardTitle>
              <CardDescription>
                Detailed information about each variable and its suitability for different analyses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {variableAnalysis.map((variable) => (
                  <div key={variable.name} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-lg">{variable.name}</h3>
                      <div className="flex space-x-2">
                        <Badge variant={variable.type === 'numeric' ? 'default' : 'secondary'}>
                          {variable.type}
                        </Badge>
                        <Badge variant={variable.missingPercentage > 20 ? 'destructive' : 'outline'}>
                          {variable.missingPercentage.toFixed(1)}% missing
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Unique Values:</span>
                        <span className="ml-2 font-medium">{variable.uniqueValues}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Type:</span>
                        <span className="ml-2 font-medium capitalize">{variable.type}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Missing:</span>
                        <span className="ml-2 font-medium">{variable.missingPercentage.toFixed(1)}%</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Quality:</span>
                        <span className="ml-2 font-medium">
                          {variable.missingPercentage < 10 ? 'Excellent' : 
                           variable.missingPercentage < 20 ? 'Good' : 
                           variable.missingPercentage < 30 ? 'Fair' : 'Poor'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Suitable for:</h4>
                      <div className="flex flex-wrap gap-2">
                        {variable.isSuitable.correlation && (
                          <Badge variant="outline" className="text-xs">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Correlation
                          </Badge>
                        )}
                        {variable.isSuitable.regression && (
                          <Badge variant="outline" className="text-xs">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Regression
                          </Badge>
                        )}
                        {variable.isSuitable.classification && (
                          <Badge variant="outline" className="text-xs">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Classification
                          </Badge>
                        )}
                        {variable.isSuitable.clustering && (
                          <Badge variant="outline" className="text-xs">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Clustering
                          </Badge>
                        )}
                        {variable.isSuitable.timeSeries && (
                          <Badge variant="outline" className="text-xs">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Time Series
                          </Badge>
                        )}
                        {variable.isSuitable.visualization && (
                          <Badge variant="outline" className="text-xs">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Visualization
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    {variable.recommendations.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">Recommendations:</h4>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          {variable.recommendations.map((rec, index) => (
                            <li key={index} className="flex items-start space-x-2">
                              <Info className="h-3 w-3 mt-0.5 text-blue-500 flex-shrink-0" />
                              <span>{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-6">
          {/* Analysis Recommendations */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Recommended Analyses</CardTitle>
              <CardDescription>
                Based on your dataset characteristics, here are the recommended analysis approaches
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {getAnalysisRecommendations().map((recommendation, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 bg-muted/30 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{recommendation}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Data Quality Assessment */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Data Quality Assessment</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-green-50 rounded-lg p-4 border-l-4 border-green-500">
                    <h4 className="font-semibold text-green-900 mb-2">Strengths</h4>
                    <ul className="text-sm text-green-700 space-y-1">
                      {numericVariables.length >= 2 && (
                        <li>• Sufficient numeric variables for statistical analysis</li>
                      )}
                      {categoricalVariables.length > 0 && (
                        <li>• Categorical variables available for grouping</li>
                      )}
                      {dateVariables.length > 0 && (
                        <li>• Temporal data available for time series analysis</li>
                      )}
                      {data.length >= 100 && (
                        <li>• Adequate sample size for reliable analysis</li>
                      )}
                    </ul>
                  </div>
                  
                  <div className="bg-red-50 rounded-lg p-4 border-l-4 border-red-500">
                    <h4 className="font-semibold text-red-900 mb-2">Areas of Concern</h4>
                    <ul className="text-sm text-red-700 space-y-1">
                      {variableAnalysis.some(v => v.missingPercentage > 30) && (
                        <li>• High missing data in some variables</li>
                      )}
                      {mixedVariables.length > 0 && (
                        <li>• Mixed data types requiring cleaning</li>
                      )}
                      {categoricalVariables.some(v => v.uniqueValues > 50) && (
                        <li>• Too many categories in some variables</li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-6">
          {/* Analysis Types */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="shadow-card">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  <CardTitle>Statistical Analysis</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Correlation Analysis</span>
                    <Badge variant={numericVariables.length >= 2 ? 'default' : 'secondary'}>
                      {numericVariables.length >= 2 ? 'Available' : 'Not Available'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Regression Analysis</span>
                    <Badge variant={numericVariables.filter(v => v.isSuitable.regression).length >= 2 ? 'default' : 'secondary'}>
                      {numericVariables.filter(v => v.isSuitable.regression).length >= 2 ? 'Available' : 'Not Available'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Group Comparisons</span>
                    <Badge variant={categoricalVariables.length >= 1 && numericVariables.length >= 1 ? 'default' : 'secondary'}>
                      {categoricalVariables.length >= 1 && numericVariables.length >= 1 ? 'Available' : 'Not Available'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5 text-green-600" />
                  <CardTitle>Visualization</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Histograms & Distributions</span>
                    <Badge variant="default">Available</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Scatter Plots</span>
                    <Badge variant={numericVariables.length >= 2 ? 'default' : 'secondary'}>
                      {numericVariables.length >= 2 ? 'Available' : 'Not Available'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Time Series Charts</span>
                    <Badge variant={dateVariables.length >= 1 ? 'default' : 'secondary'}>
                      {dateVariables.length >= 1 ? 'Available' : 'Not Available'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Target className="h-5 w-5 text-purple-600" />
                  <CardTitle>Machine Learning</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Classification</span>
                    <Badge variant={categoricalVariables.some(v => v.isSuitable.classification) ? 'default' : 'secondary'}>
                      {categoricalVariables.some(v => v.isSuitable.classification) ? 'Available' : 'Not Available'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Clustering</span>
                    <Badge variant={numericVariables.filter(v => v.isSuitable.clustering).length >= 2 ? 'default' : 'secondary'}>
                      {numericVariables.filter(v => v.isSuitable.clustering).length >= 2 ? 'Available' : 'Not Available'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Feature Engineering</span>
                    <Badge variant="default">Available</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <PieChart className="h-5 w-5 text-orange-600" />
                  <CardTitle>Exploratory Analysis</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Data Profiling</span>
                    <Badge variant="default">Available</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Outlier Detection</span>
                    <Badge variant={numericVariables.length >= 1 ? 'default' : 'secondary'}>
                      {numericVariables.length >= 1 ? 'Available' : 'Not Available'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Pattern Recognition</span>
                    <Badge variant="default">Available</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
