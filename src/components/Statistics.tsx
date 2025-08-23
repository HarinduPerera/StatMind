import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Dataset {
  data: any[][];
  columns: string[];
  fileName: string;
}

interface StatisticsProps {
  dataset: Dataset;
}

interface NumericStats {
  mean: number;
  median: number;
  min: number;
  max: number;
  stdDev: number;
  count: number;
}

interface CategoricalStats {
  uniqueValues: number;
  mostFrequent: string;
  frequency: number;
  count: number;
}

export const Statistics: React.FC<StatisticsProps> = ({ dataset }) => {
  const { data, columns } = dataset;

  const calculateNumericStats = (columnIndex: number): NumericStats => {
    const values = data
      .map(row => row[columnIndex])
      .filter(val => typeof val === 'number' && !isNaN(val));
    
    if (values.length === 0) {
      return { mean: 0, median: 0, min: 0, max: 0, stdDev: 0, count: 0 };
    }

    const sorted = [...values].sort((a, b) => a - b);
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const median = sorted.length % 2 === 0 
      ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
      : sorted[Math.floor(sorted.length / 2)];
    
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    return {
      mean: Number(mean.toFixed(2)),
      median: Number(median.toFixed(2)),
      min: Math.min(...values),
      max: Math.max(...values),
      stdDev: Number(stdDev.toFixed(2)),
      count: values.length
    };
  };

  const calculateCategoricalStats = (columnIndex: number): CategoricalStats => {
    const values = data
      .map(row => String(row[columnIndex]))
      .filter(val => val !== '' && val !== 'null' && val !== 'undefined');
    
    const frequency: { [key: string]: number } = {};
    values.forEach(val => {
      frequency[val] = (frequency[val] || 0) + 1;
    });

    const sortedFreq = Object.entries(frequency).sort((a, b) => b[1] - a[1]);
    const mostFrequent = sortedFreq[0] || ['N/A', 0];

    return {
      uniqueValues: Object.keys(frequency).length,
      mostFrequent: mostFrequent[0],
      frequency: mostFrequent[1],
      count: values.length
    };
  };

  const getColumnType = (columnIndex: number): 'numeric' | 'categorical' => {
    const sample = data.slice(0, 100).map(row => row[columnIndex]);
    const numericCount = sample.filter(val => typeof val === 'number').length;
    return numericCount > sample.length * 0.7 ? 'numeric' : 'categorical';
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Descriptive Statistics</CardTitle>
          <CardDescription>Statistical summary for all columns in your dataset</CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {columns.map((column, index) => {
          const type = getColumnType(index);
          
          return (
            <Card key={column} className="shadow-card hover:shadow-hover transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{column}</CardTitle>
                  <Badge variant={type === 'numeric' ? 'default' : 'secondary'}>
                    {type}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {type === 'numeric' ? (
                  <NumericStatsDisplay stats={calculateNumericStats(index)} />
                ) : (
                  <CategoricalStatsDisplay stats={calculateCategoricalStats(index)} />
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

const NumericStatsDisplay: React.FC<{ stats: NumericStats }> = ({ stats }) => (
  <div className="space-y-3">
    <div className="grid grid-cols-2 gap-4">
      <div className="bg-gradient-primary/10 rounded-lg p-3">
        <div className="text-lg font-semibold text-primary">{stats.mean}</div>
        <div className="text-sm text-muted-foreground">Mean</div>
      </div>
      <div className="bg-gradient-primary/10 rounded-lg p-3">
        <div className="text-lg font-semibold text-primary">{stats.median}</div>
        <div className="text-sm text-muted-foreground">Median</div>
      </div>
    </div>
    <div className="grid grid-cols-3 gap-2 text-sm">
      <div>
        <div className="font-medium">Min</div>
        <div className="text-muted-foreground">{stats.min}</div>
      </div>
      <div>
        <div className="font-medium">Max</div>
        <div className="text-muted-foreground">{stats.max}</div>
      </div>
      <div>
        <div className="font-medium">Std Dev</div>
        <div className="text-muted-foreground">{stats.stdDev}</div>
      </div>
    </div>
    <div className="text-sm text-muted-foreground">
      {stats.count.toLocaleString()} valid values
    </div>
  </div>
);

const CategoricalStatsDisplay: React.FC<{ stats: CategoricalStats }> = ({ stats }) => (
  <div className="space-y-3">
    <div className="bg-gradient-primary/10 rounded-lg p-3">
      <div className="text-lg font-semibold text-primary">{stats.uniqueValues}</div>
      <div className="text-sm text-muted-foreground">Unique Values</div>
    </div>
    <div className="space-y-2">
      <div>
        <div className="font-medium text-sm">Most Frequent</div>
        <div className="text-muted-foreground text-sm truncate" title={stats.mostFrequent}>
          {stats.mostFrequent} ({stats.frequency} times)
        </div>
      </div>
      <div className="text-sm text-muted-foreground">
        {stats.count.toLocaleString()} valid values
      </div>
    </div>
  </div>
);