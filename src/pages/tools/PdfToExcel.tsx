
import { useState, useRef, useCallback } from "react";
import { PageLayout } from "@/components/PageLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, FileText, Download, Zap, RefreshCw, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import * as XLSX from "xlsx";
import Tesseract from 'tesseract.js';

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
    setProgress(0);
    setProcessingStep("Initializing...");

    try {
      const worker = await Tesseract.createWorker({
        logger: m => {
          const p = Math.floor(m.progress * 100);
          if (m.status === 'loading' || m.status === 'downloading') {
            setProcessingStep(`First-time setup: ${m.status} OCR engine... ${p}%`);
            setProgress(p * 0.2); // Initial setup is 20% of the total time
          } else if (m.status.startsWith('loading language')) {
            setProcessingStep(`Loading language model... ${p}%`);
            setProgress(20 + p * 0.1); // Language model is 10%
          } else if (m.status === 'initializing') {
            setProcessingStep(`Initializing OCR engine... ${p}%`);
            setProgress(30);
          } else if (m.status === 'recognizing text') {
            setProcessingStep(`Recognizing text... ${p}%`);
            setProgress(30 + p * 0.6); // Recognition is 60%
          }
        },
      });

      await worker.loadLanguage('eng');
      await worker.initialize('eng');

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await getDocument(arrayBuffer).promise;
      const numPages = pdf.numPages;
      let fullText = '';

      setProgress(90); 
      setProcessingStep("Reading PDF document...");

      for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2.0 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d')!;
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({ canvasContext: context, viewport: viewport }).promise;
        
        const { data: { text } } = await worker.recognize(canvas);
        fullText += text + '\n\n';
      }
      
      await worker.terminate();

      setProgress(95);
      setProcessingStep("Finalizing Excel file...");

      const lines = fullText.split('\n').filter(line => line.trim() !== '').map(line => line.trim().split(/\s+/));
      
      const ws = XLSX.utils.aoa_to_sheet(lines);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Sheet1");

      XLSX.writeFile(wb, file.name.replace(/\.pdf$/, '.xlsx'));
      
      setProgress(100);
      setProcessingStep("Conversion successful!");

      toast({
        title: "🎉 Excel File Generated!",
        description: `Your file has been converted with OCR.`,
      });

    } catch (error) {
      console.error('Conversion Error:', error);
      toast({
        title: "❌ Conversion Failed",
        description: "OCR processing failed. This could be due to a network issue or a problem with the PDF file.",
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
      title="Free PDF to Excel Converter with OCR"
      description="Easily convert your PDF documents, including scanned files, into editable Excel spreadsheets. Our free online tool uses advanced OCR to accurately extract tables and text."
      keywords="PDF to Excel, convert PDF to Excel, PDF to XLS, free PDF converter, OCR converter, scanned PDF to Excel, extract tables from PDF"
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
                Now with OCR support for scanned and image-based PDFs.
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
                    <div className="flex items-center gap-2 font-medium">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{processingStep}</span>
                    </div>
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
