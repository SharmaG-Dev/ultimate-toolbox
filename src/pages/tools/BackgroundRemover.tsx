import { useState, useRef } from "react";
import { PageLayout } from "@/components/PageLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Upload, Sparkles, Download, X, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Import the background removal library
// You'll need to install: npm install @imgly/background-removal
import { removeBackground, Config, preload } from '@imgly/background-removal';

interface ProcessedImage {
  original: string;
  processed: string;
  blob: Blob;
  filename: string;
}

export default function BackgroundRemover() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedImage, setProcessedImage] = useState<ProcessedImage | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Preload the model when component mounts
  useState(() => {
    const loadModel = async () => {
      try {
        await preload();
        setIsModelLoaded(true);
      } catch (error) {
        console.error('Failed to preload model:', error);
        setError('Failed to load AI model. Please refresh the page.');
      }
    };
    loadModel();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type.startsWith('image/')) {
      // Check file size (limit to 10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image smaller than 10MB",
          variant: "destructive"
        });
        return;
      }

      setFile(selectedFile);
      setProcessedImage(null);
      setError(null);
      setProgress(0);
    } else {
      toast({
        title: "Invalid file type",
        description: "Please select a valid image file (JPG, PNG, WEBP, etc.)",
        variant: "destructive"
      });
    }
  };

  const handleClear = () => {
    setFile(null);
    setProcessedImage(null);
    setError(null);
    setProgress(0);
    setIsProcessing(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    // Clean up blob URLs
    if (processedImage) {
      URL.revokeObjectURL(processedImage.original);
      URL.revokeObjectURL(processedImage.processed);
    }

    toast({
      title: "Cleared",
      description: "All data has been cleared successfully"
    });
  };

  const handleRemoveBackground = async () => {
    if (!file || !isModelLoaded) return;

    setIsProcessing(true);
    setError(null);
    setProgress(0);

    try {
      // Progress simulation for better UX
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev < 90) return prev + 10;
          return prev;
        });
      }, 200);

      // Configure the background removal
      const config: Config = {
        progress: (key: string, current: number, total: number) => {
          const percentage = Math.round((current / total) * 100);
          setProgress(Math.min(percentage, 90));
        }
      };

      // Remove background
      const blob = await removeBackground(file, config);

      // Clear progress interval
      clearInterval(progressInterval);
      setProgress(100);

      // Create URLs for display and download
      const originalUrl = URL.createObjectURL(file);
      const processedUrl = URL.createObjectURL(blob);

      const filename = file.name.replace(/\.[^/.]+$/, '') + '_no_bg.png';

      setProcessedImage({
        original: originalUrl,
        processed: processedUrl,
        blob,
        filename
      });

      toast({
        title: "Background Removed Successfully!",
        description: "Your image is ready for download"
      });

    } catch (error: any) {
      console.error('Background removal error:', error);
      const errorMessage = error?.message || 'Failed to remove background';
      setError(errorMessage);

      toast({
        title: "Processing Failed",
        description: errorMessage.includes('memory')
          ? "Image too large. Please try with a smaller image."
          : "Failed to process image. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const handleDownload = () => {
    if (!processedImage) return;

    try {
      const link = document.createElement('a');
      link.href = processedImage.processed;
      link.download = processedImage.filename;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Download Started",
        description: "Your transparent image is being downloaded"
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Could not download the image",
        variant: "destructive"
      });
    }
  };

  const createOriginalImageUrl = (file: File) => {
    return URL.createObjectURL(file);
  };

  return (
    <PageLayout
      title="AI Background Remover"
      description="Remove backgrounds from images instantly using AI technology"
    >
      <div className="max-w-4xl mx-auto">
        <Card className="p-8 mb-6">
          <div className="space-y-6">
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
              <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Upload Image</h3>
                <p className="text-muted-foreground">Select an image to remove its background</p>
                <p className="text-sm text-muted-foreground">Supported: JPG, PNG, WEBP (Max 10MB)</p>
              </div>
              <Input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="mt-4"
                disabled={isProcessing || !isModelLoaded}
              />

              {!isModelLoaded && (
                <div className="mt-3 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                  Loading AI model...
                </div>
              )}
            </div>

            {file && (
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-medium">Selected image:</p>
                    <p className="text-sm text-muted-foreground">{file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Size: {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClear}
                    disabled={isProcessing}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-medium text-red-800 dark:text-red-200">Processing Error</p>
                  <p className="text-sm text-red-600 dark:text-red-300">{error}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setError(null)}
                  className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                onClick={handleRemoveBackground}
                disabled={!file || isProcessing || !isModelLoaded}
                className="flex-1"
              >
                {isProcessing ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    AI Processing... {progress}%
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    Remove Background with AI
                  </div>
                )}
              </Button>

              {(file || processedImage || error) && (
                <Button
                  onClick={handleClear}
                  variant="outline"
                  disabled={isProcessing}
                  className="flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Clear All
                </Button>
              )}
            </div>

            {isProcessing && progress > 0 && (
              <div className="space-y-2">
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <p className="text-sm text-center text-muted-foreground">
                  Processing image with AI... {progress}%
                </p>
              </div>
            )}

            {(file || processedImage) && (
              <div className="p-4 bg-dark dark:bg-slate-800 border border-blue-200 dark:border-slate-700 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-blue-100 dark:text-blue-400" />
                  <p className="text-sm font-medium text-blue-100 dark:text-slate-200">AI-Powered Background Removal</p>
                </div>
                <p className="text-xs text-blue-300 dark:text-slate-400">
                  Advanced neural networks automatically detect subjects and remove backgrounds with precision.
                  Processing happens entirely in your browser for maximum privacy.
                </p>
              </div>
            )}
          </div>
        </Card>

        {(file || processedImage) && (
          <Card className="p-6">
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Image Preview</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Original Image */}
                <div className="space-y-3">
                  <p className="text-sm font-medium">Original</p>
                  <div className="aspect-square bg-muted rounded-lg overflow-hidden border">
                    {file ? (
                      <img
                        src={processedImage?.original || createOriginalImageUrl(file)}
                        alt="Original image"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <p className="text-xs text-muted-foreground text-center">
                          Original image<br />preview
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Processed Image */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Background Removed</p>
                    {processedImage && (
                      <Button
                        onClick={handleDownload}
                        size="sm"
                        variant="outline"
                        className="flex items-center gap-1"
                      >
                        <Download className="w-3 h-3" />
                        Download PNG
                      </Button>
                    )}
                  </div>
                  <div className="aspect-square bg-muted rounded-lg overflow-hidden border-2 border-dashed relative">
                    {processedImage ? (
                      <>
                        {/* Transparency checkerboard background */}
                        <div
                          className="absolute inset-0 opacity-20"
                          style={{
                            backgroundImage: `url("data:image/svg+xml,%3csvg width='20' height='20' xmlns='http://www.w3.org/2000/svg'%3e%3cg fill='%23000' fill-opacity='0.1'%3e%3crect x='0' y='0' width='10' height='10'/%3e%3crect x='10' y='10' width='10' height='10'/%3e%3c/g%3e%3c/svg%3e")`,
                          }}
                        />
                        <img
                          src={processedImage.processed}
                          alt="Background removed"
                          className="relative w-full h-full object-contain"
                        />
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <p className="text-xs text-muted-foreground text-center">
                          {isProcessing ? "Processing..." : "Processed image\nwill appear here"}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {processedImage && (
                <div className="p-4 bg-dark dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-green-600 dark:text-green-400" />
                    <p className="text-sm font-medium text-white dark:text-slate-200">Background Removed Successfully!</p>
                  </div>
                  <p className="text-xs text-gray-300 dark:text-slate-400">
                    Your image now has a transparent background. Download it as a PNG file to preserve transparency.
                  </p>
                </div>
              )}
            </div>
          </Card>
        )}
      </div>
    </PageLayout>
  );
}
