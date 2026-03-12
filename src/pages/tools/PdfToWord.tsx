
import { useState, useRef, useCallback } from "react";
import { PageLayout } from "@/components/PageLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, FileText, Zap, RefreshCw, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

import { Document, Packer, Paragraph, TextRun } from 'docx';
import { saveAs } from 'file-saver';

// Use the stable build for pdf.js and configure the worker from a CDN
import * as pdfjsLib from 'pdfjs-dist/build/pdf.min.mjs';

if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
}

export default function PdfToWordConverter() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [processingStep, setProcessingStep] = useState("");

  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): { valid: boolean; message?: string } => {
    const maxSize = 50 * 1024 * 1024; // 50MB
    const supportedTypes = ['application/pdf'];

    if (!supportedTypes.includes(file.type)) {
      return { valid: false, message: 'Only .pdf files are supported.' };
    }

    if (file.size > maxSize) {
      return { valid: false, message: `File size must be less than ${maxSize / 1024 / 1024}MB.` };
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

  const convertToDocx = useCallback(async () => {
    if (!file) return;

    setIsProcessing(true);
    setProcessingStep("Initializing conversion...");
    setProgress(10);

    try {
      const arrayBuffer = await file.arrayBuffer();
      setProcessingStep("Reading PDF document...");
      setProgress(30);

      const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
      const numPages = pdf.numPages;
      const docChildren: Paragraph[] = [];

      for (let i = 1; i <= numPages; i++) {
        setProcessingStep(`Processing page ${i} of ${numPages}...`);
        setProgress(30 + (i / numPages) * 60);

        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();

        // Intelligent paragraph and line break reconstruction
        let lastY = -1;
        let currentLine: TextRun[] = [];

        textContent.items.forEach((item: any, index) => {
          if ('str' in item && item.str.trim().length > 0) {
            const currentY = item.transform[5];

            if (lastY !== -1 && Math.abs(currentY - lastY) > 5) {
              // A significant vertical jump indicates a new line/paragraph.
              docChildren.push(new Paragraph({ children: currentLine }));
              currentLine = [];
            }
            
            currentLine.push(new TextRun(item.str));
            lastY = currentY;
          }

          // Add the last line on the page
          if (index === textContent.items.length - 1 && currentLine.length > 0) {
            docChildren.push(new Paragraph({ children: currentLine }));
          }
        });

        // Add a space between pages
        if (i < numPages) {
            docChildren.push(new Paragraph(""));
        }
      }

      setProcessingStep("Creating Word document...");
      setProgress(95);

      const doc = new Document({
        sections: [{
          children: docChildren,
        }],
      });

      const blob = await Packer.toBlob(doc);
      saveAs(blob, file.name.replace(/\.pdf$/, '.docx'));
      
      setProgress(100);
      setProcessingStep("Conversion successful!");

      toast({
        title: "🎉 DOCX Generated!",
        description: `Your file "${file.name}" has been converted with formatting.`,
      });

    } catch (error: any) {
      console.error('Conversion Error:', error);

      let errorMessage = "An unknown error occurred during conversion.";
      if (error.name === 'PasswordException') {
        errorMessage = 'The PDF file is encrypted and password-protected. This tool cannot process encrypted files.';
      } else if (error.name === 'InvalidPDFException') {
        errorMessage = 'The file is not a valid or is a corrupted PDF. Please try a different file.';
      } else if (error.message && error.message.includes('worker')) {
        errorMessage = 'The PDF processing engine failed to load. Please try refreshing the page.';
      }

      toast({
        title: "❌ Conversion Failed",
        description: errorMessage,
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
      title="Free PDF to Word Converter (DOCX)"
      description="Convert your PDFs into editable Word documents (.docx) for free. Our tool accurately extracts text, preserving the layout. Secure and in-browser."
      keywords="PDF to Word, convert PDF to Word, PDF to DOCX, free PDF converter, online PDF to Word, extract text from PDF"
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
                Supports .pdf files. Your files are processed locally and securely in your browser.
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
                <Button onClick={convertToDocx} className="gap-2">
                  <Zap className="w-4 h-4" />
                  Convert to Word
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
                Please select a PDF document to begin the conversion process.
                </AlertDescription>
            </Alert>
        )}

      </div>
    </PageLayout>
  );
}
