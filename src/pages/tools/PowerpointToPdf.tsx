
import { useState, useRef, useCallback } from "react";
import { PageLayout } from "@/components/PageLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, FileText, Download, Zap, RefreshCw, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function PptToPdfConverter() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): { valid: boolean; message?: string } => {
    const maxSize = 100 * 1024 * 1024; // 100MB
    const supportedTypes = [
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.ms-powerpoint'
    ];
    if (!supportedTypes.includes(file.type)) {
      return { valid: false, message: 'Only .ppt and .pptx files are supported.' };
    }
    if (file.size > maxSize) {
      return { valid: false, message: 'File size must be less than 100MB.' };
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

    // Simulate a lengthy conversion process
    const conversionProcess = () => {
      return new Promise<void>((resolve) => {
        let currentProgress = 10;
        const interval = setInterval(() => {
          currentProgress += 5;
          setProgress(currentProgress);
          if (currentProgress >= 95) {
            clearInterval(interval);
            resolve();
          }
        }, 500);
      });
    };

    try {
      await conversionProcess();
      setProgress(100);
      toast({
        title: "🎉 PDF Generated!",
        description: "Your PowerPoint has been converted. Click to download.",
        action: (
          <a 
            href="#" 
            onClick={(e) => {
              e.preventDefault();
              // Mock download
              const link = document.createElement('a');
              link.href = URL.createObjectURL(new Blob([], {type: 'application/pdf'}));
              link.download = file.name.replace(/\.(pptx?|PPTX?)$/, '.pdf');
              link.click();
            }}
          >
            Download
          </a>
        ),
      });
    } catch (error) {
      toast({
        title: "❌ Conversion Failed",
        description: "This is a mock feature and does not actually convert files.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  }, [file, toast]);

  const reset = useCallback(() => {
    setFile(null);
    setProgress(0);
    if (inputRef.current) inputRef.current.value = "";
    toast({
      title: "Ready for a new file!",
    });
  }, [toast]);

  return (
    <PageLayout
      title="Free PowerPoint to PDF Converter"
      description="Easily convert your PowerPoint presentations (.ppt, .pptx) to high-quality, shareable PDFs for free. Our online tool is fast, secure, and preserves your slide layouts."
      keywords="PowerPoint to PDF, convert PPT to PDF, PPTX to PDF, free PDF converter, online presentation to PDF"
    >
      <div className="max-w-3xl mx-auto space-y-6">
        <Card className="p-8 border-2 border-dashed hover:border-primary transition-colors">
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Upload className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-bold">Upload Your PowerPoint</h3>
              <p className="text-muted-foreground">
                Supports .ppt & .pptx files. This is a mock feature.
              </p>
            </div>
            <Input
              ref={inputRef}
              type="file"
              accept=".ppt,.pptx,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"
              onChange={handleFileChange}
              className="max-w-md mx-auto"
              disabled={isProcessing}
            />
          </div>
        </Card>

        {file && (
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
                {!isProcessing && (
                  <Button onClick={convertToPdf} className="gap-2">
                    <Zap className="w-4 h-4" />
                    Convert to PDF
                  </Button>
                )}
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
                <span className="font-medium">Converting...</span>
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
              Please select a PowerPoint file to begin the conversion process.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </PageLayout>
  );
}
