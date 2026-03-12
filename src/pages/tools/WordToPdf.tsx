
import { useState, useRef, useCallback } from "react";
import { PageLayout } from "@/components/PageLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, FileText, Download, Zap, RefreshCw, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

import mammoth from "mammoth";
import html2pdf from "html2pdf.js";

export default function WordToPdfConverter() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [processingStep, setProcessingStep] = useState("");

  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): { valid: boolean; message?: string } => {
    const maxSize = 50 * 1024 * 1024; // 50MB
    const supportedTypes = [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword'
    ];
    if (!supportedTypes.includes(file.type)) {
      return { valid: false, message: 'Only .doc and .docx files are supported.' };
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
    setProcessingStep("Reading document...");

    try {
      const arrayBuffer = await file.arrayBuffer();
      setProgress(30);
      setProcessingStep("Converting to HTML...");
      
      const { value: html } = await mammoth.convertToHtml({ arrayBuffer });
      
      setProgress(60);
      setProcessingStep("Generating PDF...");

      const pdfContent = document.createElement('div');
      pdfContent.innerHTML = html;

      const pdfOptions = {
        margin: 15,
        filename: file.name.replace(/\.(docx?|DOCX?)$/, '.pdf'),
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
          onclone: (clonedDoc: Document) => {
            const style = clonedDoc.createElement('style');
            style.textContent = `
              body {
                color: black !important;
              }
              * {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
            `;
            clonedDoc.head.appendChild(style);
          }
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const },
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
      title="Free Word to PDF Converter"
      description="Convert your DOC and DOCX files to high-quality PDF documents for free. Our online tool is fast, secure, and preserves your formatting perfectly."
      keywords="Word to PDF, convert Word to PDF, DOC to PDF, DOCX to PDF, free PDF converter, online Word to PDF"
    >
      <div className="max-w-3xl mx-auto space-y-6">
        <Card className="p-8 border-2 border-dashed hover:border-primary transition-colors">
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Upload className="w-8 h-8 text-primary" />
            </div>
            
            <div>
              <h3 className="text-xl font-bold">Upload Your Word Document</h3>
              <p className="text-muted-foreground">
                Supports .doc & .docx files. Your files are processed locally and are secure.
              </p>
            </div>

            <Input
              ref={inputRef}
              type="file"
              accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
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
                Please select a Word document to begin the conversion process.
                </AlertDescription>
            </Alert>
        )}

      </div>
    </PageLayout>
  );
}
