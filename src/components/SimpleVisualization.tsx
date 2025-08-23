import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart, 
  LineChart, 
  AreaChart, 
  PieChart, 
  ScatterChart,
  CartesianGrid, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  Legend,
  Bar,
  Line,
  Area,
  Pie,
  Scatter
} from 'recharts';
import { BarChart3, PieChart as PieChartIcon, TrendingUp } from 'lucide-react';

interface Dataset {
  data: any[][];
  columns: string[];
  fileName: string;
}

interface SimpleVisualizationProps {
  dataset: Dataset;
}

export const SimpleVisualization: React.FC<SimpleVisualizationProps> = ({ dataset }) => {
  const { data, columns } = dataset;
  const [selectedColumn, setSelectedColumn] = useState<string>('');
  const [selectedColumn2, setSelectedColumn2] = useState<string>('');
  const [selectedColumn3, setSelectedColumn3] = useState<string>('');
  const [chartType, setChartType] = useState<string>('bar');
  const [activeTab, setActiveTab] = useState('single');

  const getColumnType = (columnName: string): 'numeric' | 'categorical' | 'date' => {
    const columnIndex = columns.indexOf(columnName);
    const sample = data.slice(0, 100).map(row => row[columnIndex]);
    
    // Check if it's a date column
    const datePattern = /^\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4}|\d{2}-\d{2}-\d{4}$/;
    const dateCount = sample.filter(val => 
      val && typeof val === 'string' && datePattern.test(val)
    ).length;
    
    if (dateCount > sample.length * 0.3) return 'date';
    
    const numericCount = sample.filter(val => typeof val === 'number' && !isNaN(val)).length;
    return numericCount > sample.length * 0.7 ? 'numeric' : 'categorical';
  };

  const numericColumns = columns.filter(col => getColumnType(col) === 'numeric');
  const categoricalColumns = columns.filter(col => getColumnType(col) === 'categorical');
  const dateColumns = columns.filter(col => getColumnType(col) === 'date');

  const prepareFrequencyData = (columnName: string) => {
    const columnIndex = columns.indexOf(columnName);
    const values = data.map(row => row[columnIndex]);
    const frequency: { [key: string]: number } = {};
    
    values.forEach(value => {
      const key = String(value || 'null');
      frequency[key] = (frequency[key] || 0) + 1;
    });
    
    return Object.entries(frequency)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 20); // Limit to top 20 for readability
  };

  const prepareNumericData = (columnName: string) => {
    const columnIndex = columns.indexOf(columnName);
    const values = data.map(row => row[columnIndex]).filter(val => typeof val === 'number' && !isNaN(val));
    
    if (values.length === 0) return [];
    
    // Create histogram-like data
    const min = Math.min(...values);
    const max = Math.max(...values);
    const binCount = Math.min(10, Math.ceil(Math.sqrt(values.length)));
    const binSize = (max - min) / binCount;
    
    const bins: { [key: string]: number } = {};
    for (let i = 0; i < binCount; i++) {
      const binStart = min + i * binSize;
      const binEnd = min + (i + 1) * binSize;
      const binLabel = `${binStart.toFixed(1)}-${binEnd.toFixed(1)}`;
      bins[binLabel] = 0;
    }
    
    values.forEach(value => {
      const binIndex = Math.floor((value - min) / binSize);
      const binStart = min + binIndex * binSize;
      const binEnd = min + (binIndex + 1) * binSize;
      const binLabel = `${binStart.toFixed(1)}-${binEnd.toFixed(1)}`;
      bins[binLabel]++;
    });
    
    return Object.entries(bins).map(([name, value]) => ({ name, value }));
  };

  const prepareScatterData = (col1: string, col2: string) => {
    const col1Index = columns.indexOf(col1);
    const col2Index = columns.indexOf(col2);
    
    return data
      .map(row => ({
        x: row[col1Index],
        y: row[col2Index],
        name: `${row[col1Index]}, ${row[col2Index]}`
      }))
      .filter(point => 
        typeof point.x === 'number' && !isNaN(point.x) && 
        typeof point.y === 'number' && !isNaN(point.y)
      )
      .slice(0, 100); // Limit for performance
  };

  const prepareCorrelationData = (col1: string, col2: string) => {
    const col1Index = columns.indexOf(col1);
    const col2Index = columns.indexOf(col2);
    
    const values1 = data.map(row => row[col1Index]).filter(val => typeof val === 'number' && !isNaN(val));
    const values2 = data.map(row => row[col2Index]).filter(val => typeof val === 'number' && !isNaN(val));
    
    if (values1.length === 0 || values2.length === 0) return [];
    
    const correlation = calculateCorrelation(values1, values2);
    
    return [
      { name: 'Correlation', value: correlation },
      { name: 'Strength', value: Math.abs(correlation) }
    ];
  };

  const prepareTimeSeriesData = (dateCol: string, valueCol: string) => {
    const dateIndex = columns.indexOf(dateCol);
    const valueIndex = columns.indexOf(valueCol);
    
    return data
      .map(row => ({
        date: row[dateIndex],
        value: row[valueIndex]
      }))
      .filter(point => 
        point.date && point.value !== null && point.value !== undefined &&
        typeof point.value === 'number' && !isNaN(point.value)
      )
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 100); // Limit for performance
  };



  const calculateCorrelation = (x: number[], y: number[]): number => {
    const n = Math.min(x.length, y.length);
    if (n === 0) return 0;
    
    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = y.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * (y[i] || 0), 0);
    const sumXX = x.reduce((sum, val) => sum + val * val, 0);
    const sumYY = y.reduce((sum, val) => sum + val * val, 0);
    
    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));
    
    return denominator === 0 ? 0 : numerator / denominator;
  };

  const renderChart = () => {
    if (!selectedColumn) return null;

    const columnType = getColumnType(selectedColumn);
    
    if (chartType === 'bar') {
      const chartData = columnType === 'numeric' ? prepareNumericData(selectedColumn) : prepareFrequencyData(selectedColumn);
      return (
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="value" fill="#8884d8" />
        </BarChart>
      );
    }
    
    if (chartType === 'line') {
      const chartData = columnType === 'numeric' ? prepareNumericData(selectedColumn) : prepareFrequencyData(selectedColumn);
      return (
        <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="value" stroke="#8884d8" />
        </LineChart>
      );
    }
    
    if (chartType === 'area') {
      const chartData = columnType === 'numeric' ? prepareNumericData(selectedColumn) : prepareFrequencyData(selectedColumn);
      return (
        <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Area type="monotone" dataKey="value" stroke="#8884d8" fill="#8884d8" />
        </AreaChart>
      );
    }
    
    if (chartType === 'pie') {
      const chartData = prepareFrequencyData(selectedColumn).slice(0, 10);
      return (
        <PieChart margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={`hsl(${index * 360 / chartData.length}, 70%, 50%)`} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      );
    }
    
    return null;
  };

  const renderMultiVariableChart = () => {
    if (activeTab === 'comparison' && selectedColumn && selectedColumn2) {
      if (getColumnType(selectedColumn) === 'numeric' && getColumnType(selectedColumn2) === 'numeric') {
        const chartData = prepareScatterData(selectedColumn, selectedColumn2);
        return (
          <ScatterChart margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="x" name={selectedColumn} />
            <YAxis dataKey="y" name={selectedColumn2} />
            <Tooltip cursor={{ strokeDasharray: '3 3' }} />
            <Scatter data={chartData} fill="#8884d8" />
          </ScatterChart>
        );
      }
    }
    
    if (activeTab === 'correlation' && selectedColumn && selectedColumn2) {
      if (getColumnType(selectedColumn) === 'numeric' && getColumnType(selectedColumn2) === 'numeric') {
        const chartData = prepareCorrelationData(selectedColumn, selectedColumn2);
        return (
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" fill="#82ca9d" />
          </BarChart>
        );
      }
    }
    
    if (activeTab === 'timeSeries' && selectedColumn && selectedColumn2) {
      if (getColumnType(selectedColumn) === 'date' && getColumnType(selectedColumn2) === 'numeric') {
        const chartData = prepareTimeSeriesData(selectedColumn, selectedColumn2);
        return (
          <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="value" stroke="#8884d8" />
          </LineChart>
        );
      }
    }
    

    
    return null;
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="h-6 w-6" />
            <span>Data Visualization</span>
          </CardTitle>
          <CardDescription>
            Create charts and visualizations from your dataset
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="single">Single Variable</TabsTrigger>
          <TabsTrigger value="comparison">Comparison</TabsTrigger>
          <TabsTrigger value="correlation">Correlation</TabsTrigger>
          <TabsTrigger value="timeSeries">Time Series</TabsTrigger>
        </TabsList>

        <TabsContent value="single" className="space-y-6">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Single Variable Charts</CardTitle>
              <CardDescription>
                Visualize individual variables with different chart types
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Select Column:</label>
                  <Select value={selectedColumn} onValueChange={setSelectedColumn}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a column" />
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
                  <label className="text-sm font-medium mb-2 block">Chart Type:</label>
                  <Select value={chartType} onValueChange={setChartType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bar">Bar Chart</SelectItem>
                      <SelectItem value="line">Line Chart</SelectItem>
                      <SelectItem value="area">Area Chart</SelectItem>
                      <SelectItem value="pie">Pie Chart</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {selectedColumn && (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    {renderChart()}
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comparison" className="space-y-6">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Comparison Charts</CardTitle>
              <CardDescription>
                Compare two numeric variables with scatter plots
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">X-Axis Column:</label>
                  <Select value={selectedColumn} onValueChange={setSelectedColumn}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose X-axis column" />
                    </SelectTrigger>
                    <SelectContent>
                      {numericColumns.map(column => (
                        <SelectItem key={column} value={column}>
                          {column}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Y-Axis Column:</label>
                  <Select value={selectedColumn2} onValueChange={setSelectedColumn2}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose Y-axis column" />
                    </SelectTrigger>
                    <SelectContent>
                      {numericColumns.map(column => (
                        <SelectItem key={column} value={column}>
                          {column}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {selectedColumn && selectedColumn2 && (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    {renderMultiVariableChart()}
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="correlation" className="space-y-6">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Correlation Analysis</CardTitle>
              <CardDescription>
                Analyze correlation between two numeric variables
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">First Variable:</label>
                  <Select value={selectedColumn} onValueChange={setSelectedColumn}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose first variable" />
                    </SelectTrigger>
                    <SelectContent>
                      {numericColumns.map(column => (
                        <SelectItem key={column} value={column}>
                          {column}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Second Variable:</label>
                  <Select value={selectedColumn2} onValueChange={setSelectedColumn2}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose second variable" />
                    </SelectTrigger>
                    <SelectContent>
                      {numericColumns.map(column => (
                        <SelectItem key={column} value={column}>
                          {column}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {selectedColumn && selectedColumn2 && (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    {renderMultiVariableChart()}
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeSeries" className="space-y-6">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Time Series Charts</CardTitle>
              <CardDescription>
                Visualize data over time with line charts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Date Column:</label>
                  <Select value={selectedColumn} onValueChange={setSelectedColumn}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose date column" />
                    </SelectTrigger>
                    <SelectContent>
                      {dateColumns.map(column => (
                        <SelectItem key={column} value={column}>
                          {column}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Value Column:</label>
                  <Select value={selectedColumn2} onValueChange={setSelectedColumn2}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose value column" />
                    </SelectTrigger>
                    <SelectContent>
                      {numericColumns.map(column => (
                        <SelectItem key={column} value={column}>
                          {column}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {selectedColumn && selectedColumn2 && (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    {renderMultiVariableChart()}
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>


      </Tabs>

      {/* Chart Summary */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Chart Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gradient-primary/10 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-primary">{columns.length}</div>
              <div className="text-sm text-muted-foreground">Total Columns</div>
            </div>
            <div className="bg-gradient-primary/10 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-primary">{numericColumns.length}</div>
              <div className="text-sm text-muted-foreground">Numeric Columns</div>
            </div>
            <div className="bg-gradient-primary/10 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-primary">{categoricalColumns.length}</div>
              <div className="text-sm text-muted-foreground">Categorical Columns</div>
            </div>
            <div className="bg-gradient-primary/10 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-primary">{dateColumns.length}</div>
              <div className="text-sm text-muted-foreground">Date Columns</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};