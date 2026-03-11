
import { useState, useRef, useCallback } from "react";
import { PageLayout } from "@/components/PageLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, FileText, Download, Zap, RefreshCw, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import * as XLSX from "xlsx";

// Set workerSrc to load pdf.worker.js from a CDN
GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

export default function PdfToExcelConverter() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [processingStep, setProcessingStep] = useState("");

  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): { valid: boolean; message?: string } => {
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.type !== 'application/pdf') {
      return { valid: false, message: 'Only .pdf files are supported.' };
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

  const convertToExcel = useCallback(async () => {
    if (!file) return;

    setIsProcessing(true);
    setProgress(10);
    setProcessingStep("Reading PDF file...");

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await getDocument(arrayBuffer).promise;
      const numPages = pdf.numPages;
      let fullText = '';

      for (let i = 1; i <= numPages; i++) {
        setProgress(10 + Math.floor((i / numPages) * 70));
        setProcessingStep(`Processing page ${i} of ${numPages}...`);
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((s: any) => s.str).join(' ');
        fullText += pageText + '\n\n';
      }

      setProgress(90);
      setProcessingStep("Converting to Excel...");

      const lines = fullText.split('\n').map(line => line.split(/\s+/));
      const ws = XLSX.utils.aoa_to_sheet(lines);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Sheet1");

      XLSX.writeFile(wb, file.name.replace(/\.pdf$/, '.xlsx'));
      
      setProgress(100);
      setProcessingStep("Conversion successful!");

      toast({
        title: "🎉 Excel File Generated!",
        description: `Your file "${file.name}" has been converted successfully.`,
      });

    } catch (error) {
      console.error('Conversion Error:', error);
      toast({
        title: "❌ Conversion Failed",
        description: "Could not extract text from PDF. The PDF may be an image or have complex formatting.",
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
      title="PDF to Excel Converter"
      description="Extract text from your PDFs and convert it into an Excel spreadsheet."
    >
      <div className="max-w-3xl mx-auto space-y-6">
        <Card className="p-8 border-2 border-dashed hover:border-primary transition-colors">
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Upload className="w-8 h-8 text-primary" />
            </div>
            
            <div>
              <h3 className="text-xl font-bold">Upload Your PDF Document</h3>
              <p className="text-muted-foreground">
                Supports .pdf files. Text-based PDFs work best.
              </p>
            </div>

            <Input
              ref={inputRef}
              type="file"
              accept="application/pdf"
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
                <Button onClick={convertToExcel} className="gap-2">
                  <Zap className="w-4 h-4" />
                  Convert to Excel
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
                Please select a PDF file to begin the conversion process.
                </AlertDescription>
            </Alert>
        )}

      </div>
    </PageLayout>
  );
}
