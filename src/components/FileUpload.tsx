import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FileText, AlertCircle, Globe } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FileUploadProps {
  onUpload: (data: any[][], columns: string[], fileName: string) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onUpload }) => {
  const { toast } = useToast();

  const handleSampleData = () => {
    // Open a new browser window/tab to browse the internet
    window.open('https://www.google.com', '_blank');
    toast({
      title: "Browser opened!",
      description: "A new browser window has been opened for you to browse the internet.",
    });
  };

  const parseCSV = (text: string): { data: any[][]; columns: string[] } => {
    const lines = text.trim().split('\n');
    const columns = lines[0].split(',').map(col => col.trim().replace(/['"]/g, ''));
    const data = lines.slice(1).map(line => {
      return line.split(',').map(cell => {
        const cleaned = cell.trim().replace(/['"]/g, '');
        // Try to parse as number
        const num = parseFloat(cleaned);
        return isNaN(num) ? cleaned : num;
      });
    });
    
    return { data, columns };
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const { data, columns } = parseCSV(text);
        
        if (data.length === 0 || columns.length === 0) {
          throw new Error('Empty dataset');
        }

        onUpload(data, columns, file.name);
        toast({
          title: "File uploaded successfully!",
          description: `Loaded ${data.length} rows and ${columns.length} columns from ${file.name}`,
        });
      } catch (error) {
        toast({
          title: "Upload failed",
          description: "Please ensure your file is a valid CSV format.",
          variant: "destructive",
        });
      }
    };

    reader.readAsText(file);
  }, [onUpload, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    multiple: false
  });

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-300 hover:shadow-hover ${
        isDragActive 
          ? 'border-primary bg-secondary/50' 
          : 'border-border hover:border-primary/50'
      }`}
    >
      <input {...getInputProps()} />
      
      <div className="flex flex-col items-center space-y-4">
        <div className={`p-4 rounded-full ${isDragActive ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
          <Upload className="h-8 w-8" />
        </div>
        
        <div>
          <h3 className="text-lg font-semibold mb-2">
            {isDragActive ? 'Drop your file here' : 'Upload your dataset'}
          </h3>
          <p className="text-muted-foreground mb-4">
            Drag and drop your CSV or Excel file here, or click to browse
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-4">
            <Button variant="outline">
              <FileText className="h-4 w-4 mr-2" />
              Choose File
            </Button>
            <Button variant="secondary" onClick={handleSampleData}>
              <Globe className="h-4 w-4 mr-2" />
              Browse Internet
            </Button>
          </div>
          
          <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
            <AlertCircle className="h-4 w-4" />
            <span>Supported formats: CSV, XLS, XLSX</span>
          </div>
        </div>
      </div>
    </div>
  );
};