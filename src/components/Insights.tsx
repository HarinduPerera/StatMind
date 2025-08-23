import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, BarChart3, Database } from 'lucide-react';

interface Dataset {
  data: any[][];
  columns: string[];
  fileName: string;
}

interface InsightsProps {
  dataset: Dataset;
}

interface Insight {
  type: 'positive' | 'negative' | 'warning' | 'info';
  icon: React.ReactNode;
  title: string;
  description: string;
  metric?: string;
}

export const Insights: React.FC<InsightsProps> = ({ dataset }) => {
  const { data, columns } = dataset;

  const getColumnType = (columnIndex: number): 'numeric' | 'categorical' => {
    const sample = data.slice(0, 100).map(row => row[columnIndex]);
    const numericCount = sample.filter(val => typeof val === 'number').length;
    return numericCount > sample.length * 0.7 ? 'numeric' : 'categorical';
  };

  const generateInsights = (): Insight[] => {
    const insights: Insight[] = [];
    
    // Dataset size insights
    if (data.length > 10000) {
      insights.push({
        type: 'positive',
        icon: <Database className="h-4 w-4" />,
        title: 'Large Dataset',
        description: 'Your dataset has a substantial number of rows, which is great for statistical analysis and machine learning.',
        metric: `${data.length.toLocaleString()} rows`
      });
    } else if (data.length < 100) {
      insights.push({
        type: 'warning',
        icon: <AlertTriangle className="h-4 w-4" />,
        title: 'Small Dataset',
        description: 'Consider gathering more data for more robust statistical analysis and machine learning models.',
        metric: `${data.length} rows`
      });
    }

    // Column diversity
    const numericCount = columns.filter((_, i) => getColumnType(i) === 'numeric').length;
    const categoricalCount = columns.length - numericCount;
    
    if (numericCount > 0 && categoricalCount > 0) {
      insights.push({
        type: 'positive',
        icon: <BarChart3 className="h-4 w-4" />,
        title: 'Diverse Data Types',
        description: 'Your dataset contains both numeric and categorical columns, enabling various analysis techniques.',
        metric: `${numericCount} numeric, ${categoricalCount} categorical`
      });
    }

    // Missing data analysis
    let totalMissing = 0;
    columns.forEach((_, colIndex) => {
      const missing = data.filter(row => 
        row[colIndex] === null || 
        row[colIndex] === undefined || 
        row[colIndex] === '' ||
        row[colIndex] === 'null'
      ).length;
      totalMissing += missing;
    });

    const missingPercentage = (totalMissing / (data.length * columns.length)) * 100;
    
    if (missingPercentage < 5) {
      insights.push({
        type: 'positive',
        icon: <CheckCircle className="h-4 w-4" />,
        title: 'Clean Data',
        description: 'Your dataset has very few missing values, which is excellent for analysis.',
        metric: `${missingPercentage.toFixed(1)}% missing`
      });
    } else if (missingPercentage > 20) {
      insights.push({
        type: 'warning',
        icon: <AlertTriangle className="h-4 w-4" />,
        title: 'Significant Missing Data',
        description: 'Consider data cleaning or imputation strategies before analysis.',
        metric: `${missingPercentage.toFixed(1)}% missing`
      });
    }

    // Numeric column insights
    if (numericCount >= 2) {
      insights.push({
        type: 'info',
        icon: <TrendingUp className="h-4 w-4" />,
        title: 'Correlation Analysis Ready',
        description: 'With multiple numeric columns, you can perform correlation analysis to find relationships.',
        metric: `${numericCount} numeric columns`
      });
    }

    // Categorical analysis
    if (categoricalCount > 0) {
      const highCardinalityColumns = columns.filter((_, colIndex) => {
        if (getColumnType(colIndex) === 'categorical') {
          const uniqueValues = new Set(data.map(row => row[colIndex])).size;
          return uniqueValues > data.length * 0.5;
        }
        return false;
      });

      if (highCardinalityColumns.length > 0) {
        insights.push({
          type: 'warning',
          icon: <AlertTriangle className="h-4 w-4" />,
          title: 'High Cardinality Detected',
          description: 'Some categorical columns have many unique values. Consider grouping or feature engineering.',
          metric: `${highCardinalityColumns.length} columns affected`
        });
      }
    }

    // Machine learning readiness
    if (numericCount >= 2 || (numericCount >= 1 && categoricalCount >= 1)) {
      insights.push({
        type: 'positive',
        icon: <CheckCircle className="h-4 w-4" />,
        title: 'ML Ready',
        description: 'Your dataset structure is suitable for machine learning algorithms.',
        metric: 'Classification & Regression possible'
      });
    }

    // Data distribution insights
    const sampleSize = Math.min(1000, data.length);
    const numericColumns = columns.filter((_, i) => getColumnType(i) === 'numeric');
    
    if (numericColumns.length > 0) {
      const skewedColumns = numericColumns.filter((_, colIndex) => {
        const actualIndex = columns.indexOf(numericColumns[colIndex]);
        const values = data.slice(0, sampleSize)
          .map(row => row[actualIndex])
          .filter(val => typeof val === 'number');
        
        if (values.length < 10) return false;
        
        const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
        const median = values.sort((a, b) => a - b)[Math.floor(values.length / 2)];
        
        return Math.abs(mean - median) > Math.abs(mean) * 0.1;
      });

      if (skewedColumns.length > 0) {
        insights.push({
          type: 'info',
          icon: <TrendingDown className="h-4 w-4" />,
          title: 'Skewed Distributions',
          description: 'Some numeric columns show skewed distributions. Consider data transformation for better analysis.',
          metric: `${skewedColumns.length} columns`
        });
      }
    }

    return insights;
  };

  const insights = generateInsights();

  const getIconColor = (type: string) => {
    switch (type) {
      case 'positive': return 'text-green-600';
      case 'negative': return 'text-red-600';
      case 'warning': return 'text-yellow-600';
      default: return 'text-blue-600';
    }
  };

  const getBadgeVariant = (type: string) => {
    switch (type) {
      case 'positive': return 'default';
      case 'warning': return 'destructive';
      default: return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Data Insights</CardTitle>
          <CardDescription>
            AI-generated insights about your dataset's characteristics and quality
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {insights.map((insight, index) => (
          <Card key={index} className="shadow-card hover:shadow-hover transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2">
                  <div className={getIconColor(insight.type)}>
                    {insight.icon}
                  </div>
                  <CardTitle className="text-lg">{insight.title}</CardTitle>
                </div>
                <Badge variant={getBadgeVariant(insight.type)}>
                  {insight.type}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-3">{insight.description}</p>
              {insight.metric && (
                <div className="bg-gradient-primary/10 rounded-lg p-3">
                  <div className="font-medium text-primary">{insight.metric}</div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Summary */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Dataset Quality Score</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span>Data Completeness</span>
              <div className="flex items-center space-x-2">
                <div className="w-24 h-2 bg-muted rounded-full">
                  <div 
                    className="h-2 bg-gradient-primary rounded-full"
                    style={{ width: `${Math.max(0, Math.min(100, 100 - (insights.find(i => i.title === 'Significant Missing Data') ? 20 : 5)))}%` }}
                  />
                </div>
                <span className="text-sm text-muted-foreground">
                  {Math.max(0, Math.min(100, 100 - (insights.find(i => i.title === 'Significant Missing Data') ? 20 : 5)))}%
                </span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span>Diversity Score</span>
              <div className="flex items-center space-x-2">
                <div className="w-24 h-2 bg-muted rounded-full">
                  <div 
                    className="h-2 bg-gradient-primary rounded-full"
                    style={{ width: `${insights.find(i => i.title === 'Diverse Data Types') ? 85 : 50}%` }}
                  />
                </div>
                <span className="text-sm text-muted-foreground">
                  {insights.find(i => i.title === 'Diverse Data Types') ? 85 : 50}%
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span>ML Readiness</span>
              <div className="flex items-center space-x-2">
                <div className="w-24 h-2 bg-muted rounded-full">
                  <div 
                    className="h-2 bg-gradient-primary rounded-full"
                    style={{ width: `${insights.find(i => i.title === 'ML Ready') ? 90 : 30}%` }}
                  />
                </div>
                <span className="text-sm text-muted-foreground">
                  {insights.find(i => i.title === 'ML Ready') ? 90 : 30}%
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};