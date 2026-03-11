
import { useState, useRef, useCallback } from "react";
import { PageLayout } from "@/components/PageLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, FileText, Download, Zap, RefreshCw, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

import * as XLSX from "xlsx";
import html2pdf from "html2pdf.js";

export default function ExcelToPdfConverter() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [processingStep, setProcessingStep] = useState("");

  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): { valid: boolean; message?: string } => {
    const maxSize = 50 * 1024 * 1024; // 50MB
    const supportedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ];
    if (!supportedTypes.includes(file.type)) {
      return { valid: false, message: 'Only .xls and .xlsx files are supported.' };
    }
    if (file.size > maxSize) {
      return { valid: false, message: 'File size must be less than 50MB.' };
    }
    return { valid: true };
  };

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const validation = validateFile(selectedFile);
    if (!validation.valid) {
      toast({
        title: "Invalid File",
        description: validation.message,
        variant: "destructive",
      });
      return;
    }
    setFile(selectedFile);
    toast({
      title: "File Ready",
      description: `Ready to convert "${selectedFile.name}".`,
    });
  }, [toast]);

  const convertToPdf = useCallback(async () => {
    if (!file) return;

    setIsProcessing(true);
    setProgress(10);
    setProcessingStep("Reading Excel file...");

    try {
      const arrayBuffer = await file.arrayBuffer();
      const data = new Uint8Array(arrayBuffer);
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const html = XLSX.utils.sheet_to_html(worksheet);

      setProgress(60);
      setProcessingStep("Generating PDF...");

      const pdfContent = document.createElement('div');
      pdfContent.innerHTML = html;

      const pdfOptions = {
        margin: 10,
        filename: file.name.replace(/\.(xlsx?|XLSX?)$/, '.pdf'),
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' as const },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] } 
      };

      await html2pdf().from(pdfContent).set(pdfOptions).save();
      
      setProgress(100);
      setProcessingStep("Conversion successful!");

      toast({
        title: "🎉 PDF Generated!",
        description: `Your file "${file.name}" has been converted successfully.`,
      });

    } catch (error) {
      console.error('Conversion Error:', error);
      toast({
        title: "❌ Conversion Failed",
        description: "Something went wrong. Please try another file.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setProgress(0);
      setProcessingStep("");
    }
  }, [file, toast]);

  const reset = useCallback(() => {
    setFile(null);
    if (inputRef.current) inputRef.current.value = "";
    toast({
      title: "Ready for a new file!",
    });
  }, [toast]);

  return (
    <PageLayout
      title="Excel to PDF Converter"
      description="Easily convert your Excel spreadsheets to high-quality PDFs."
    >
      <div className="max-w-3xl mx-auto space-y-6">
        <Card className="p-8 border-2 border-dashed hover:border-primary transition-colors">
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Upload className="w-8 h-8 text-primary" />
            </div>
            
            <div>
              <h3 className="text-xl font-bold">Upload Your Excel Spreadsheet</h3>
              <p className="text-muted-foreground">
                Supports .xls & .xlsx files. Your files are processed locally and are secure.
              </p>
            </div>

            <Input
              ref={inputRef}
              type="file"
              accept=".xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              onChange={handleFileChange}
              className="max-w-md mx-auto"
              disabled={isProcessing}
            />
          </div>
        </Card>

        {file && !isProcessing && (
          <Card className="p-4 bg-muted">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="w-6 h-6 text-primary" />
                <div>
                  <p className="font-semibold">{file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    ({(file.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={convertToPdf} className="gap-2">
                  <Zap className="w-4 h-4" />
                  Convert to PDF
                </Button>
                <Button variant="outline" onClick={reset} className="gap-2">
                  <RefreshCw className="w-4 h-4" />
                  New File
                </Button>
              </div>
            </div>
          </Card>
        )}

        {isProcessing && (
          <Card className="p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-medium">{processingStep}</span>
                <span className="text-muted-foreground">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </Card>
        )}

        {!file && (
            <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                Please select an Excel file to begin the conversion process.
                </AlertDescription>
            </Alert>
        )}

      </div>
    </PageLayout>
  );
}
