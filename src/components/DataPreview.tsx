import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Search, Download, Eye, EyeOff } from 'lucide-react';

interface Dataset {
  data: any[][];
  columns: string[];
  fileName: string;
}

interface DataPreviewProps {
  dataset: Dataset;
}

export const DataPreview: React.FC<DataPreviewProps> = ({ dataset }) => {
  const { data, columns, fileName } = dataset;
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [showAllColumns, setShowAllColumns] = useState(false);

  // Filter data based on search term
  const filteredData = data.filter(row =>
    row.some(cell => 
      String(cell).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  // Calculate pagination
  const totalPages = Math.ceil(filteredData.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const currentData = filteredData.slice(startIndex, endIndex);

  // Get visible columns (all if showAllColumns is true, otherwise first 10)
  const visibleColumns = showAllColumns ? columns : columns.slice(0, 10);

  const handlePageChange = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const exportToCSV = () => {
    const csvContent = [
      columns.join(','),
      ...data.map(row => 
        row.map(cell => {
          const cellStr = String(cell);
          return cellStr.includes(',') ? `"${cellStr}"` : cellStr;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName}_export.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

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

  return (
    <div className="space-y-6">
      <Card className="shadow-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Eye className="h-6 w-6" />
                <span>Data Preview</span>
              </CardTitle>
              <CardDescription>
                Explore your dataset with {data.length.toLocaleString()} rows and {columns.length} columns
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAllColumns(!showAllColumns)}
              >
                {showAllColumns ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                {showAllColumns ? 'Hide Columns' : 'Show All'}
              </Button>
              <Button variant="outline" size="sm" onClick={exportToCSV}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Search and Controls */}
      <Card className="shadow-card">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex items-center space-x-2 flex-1 max-w-md">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search in all columns..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">Rows per page:</span>
              <Select value={String(rowsPerPage)} onValueChange={(value) => {
                setRowsPerPage(Number(value));
                setCurrentPage(1);
              }}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                  <SelectItem value="250">250</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dataset Summary */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Dataset Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gradient-primary/10 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-primary">{data.length.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Total Rows</div>
            </div>
            <div className="bg-gradient-primary/10 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-primary">{columns.length}</div>
              <div className="text-sm text-muted-foreground">Total Columns</div>
            </div>
            <div className="bg-gradient-primary/10 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-primary">{filteredData.length.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Filtered Rows</div>
            </div>
            <div className="bg-gradient-primary/10 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-primary">{visibleColumns.length}</div>
              <div className="text-sm text-muted-foreground">Visible Columns</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Column Types Overview */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Column Types</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {['numeric', 'categorical', 'date', 'mixed'].map(type => {
              const count = columns.filter(col => getColumnType(col) === type).length;
              const colors = {
                numeric: 'bg-blue-50 border-blue-500 text-blue-700',
                categorical: 'bg-green-50 border-green-500 text-green-700',
                date: 'bg-purple-50 border-purple-500 text-purple-700',
                mixed: 'bg-orange-50 border-orange-500 text-orange-700'
              };
              
              return (
                <div key={type} className={`rounded-lg p-4 border-l-4 ${colors[type as keyof typeof colors]}`}>
                  <div className="text-2xl font-bold">{count}</div>
                  <div className="text-sm capitalize">{type} Columns</div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Data Table</CardTitle>
          <CardDescription>
            Showing rows {startIndex + 1}-{Math.min(endIndex, filteredData.length)} of {filteredData.length} filtered rows
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-border">
              <thead>
                <tr className="bg-muted/50">
                  <th className="border border-border p-2 text-left font-medium text-xs">Row #</th>
                  {visibleColumns.map((column, index) => (
                    <th key={column} className="border border-border p-2 text-left font-medium text-xs">
                      <div className="flex flex-col">
                        <span className="truncate max-w-32" title={column}>{column}</span>
                        <Badge variant="outline" className="text-xs mt-1 w-fit">
                          {getColumnType(column)}
                        </Badge>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {currentData.map((row, rowIndex) => (
                  <tr key={startIndex + rowIndex} className="hover:bg-muted/30">
                    <td className="border border-border p-2 text-xs text-muted-foreground font-mono">
                      {startIndex + rowIndex + 1}
                    </td>
                    {visibleColumns.map((column, colIndex) => {
                      const columnIndex = columns.indexOf(column);
                      const cellValue = row[columnIndex];
                      const cellType = getColumnType(column);
                      
                      return (
                        <td key={column} className="border border-border p-2 text-xs">
                          <div className={`truncate max-w-32 ${
                            cellType === 'numeric' ? 'text-right font-mono' : 
                            cellType === 'date' ? 'text-center' : 'text-left'
                          }`} title={String(cellValue)}>
                            {cellValue === null || cellValue === undefined || cellValue === '' 
                              ? <span className="text-muted-foreground italic">null</span>
                              : cellType === 'numeric' 
                                ? Number(cellValue).toLocaleString()
                                : String(cellValue)
                            }
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};