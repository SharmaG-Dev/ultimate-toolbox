import { useState } from "react";
import { PageLayout } from "@/components/PageLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Download, Upload, DownloadIcon, AlertCircle, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import JSZip from 'jszip';

// Use the stable build instead of webpack for better compatibility
import * as pdfjsLib from 'pdfjs-dist/build/pdf.min.mjs';

// Configure the worker properly - this is crucial!
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
}

interface ConvertedImage {
  id: string;
  pageNumber: number;
  dataUrl: string;
  blob: Blob;
}

export default function PdfToImages() {
  const [file, setFile] = useState<File | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [convertedImages, setConvertedImages] = useState<ConvertedImage[]>([]);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setConvertedImages([]);
      setError(null);
      setProgress(null);
    } else {
      toast({
        title: "Invalid file type",
        description: "Please select a PDF file",
        variant: "destructive"
      });
    }
  };

  // Clear function to reset everything
  const handleClear = () => {
    setFile(null);
    setIsConverting(false);
    setConvertedImages([]);
    setProgress(null);
    setError(null);
    
    // Clear file input
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
    
    // Clean up any existing blob URLs
    convertedImages.forEach((image) => {
      URL.revokeObjectURL(image.dataUrl);
    });
    
    toast({
      title: "Cleared",
      description: "All data has been cleared successfully"
    });
  };

  const handleConvert = async () => {
    if (!file) return;
    
    setIsConverting(true);
    setConvertedImages([]);
    setError(null);
    setProgress(null);
    
    try {
      // Convert file to ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      
      // Load PDF document with timeout
      const loadingTask = pdfjsLib.getDocument({
        data: arrayBuffer,
        verbosity: 0, // Reduce console output
      });

      // Add timeout for loading
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('PDF loading timeout')), 30000);
      });

      const pdf = await Promise.race([loadingTask.promise, timeoutPromise]) as any;
      
      if (!pdf || !pdf.numPages) {
        throw new Error('Invalid PDF document');
      }

      const totalPages = pdf.numPages;
      setProgress({ current: 0, total: totalPages });
      
      const images: ConvertedImage[] = [];
      
      // Process pages sequentially to avoid memory issues
      for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        try {
          setProgress({ current: pageNum - 1, total: totalPages });
          
          const page = await pdf.getPage(pageNum);
          
          // Set appropriate scale for better quality
          const scale = 1.5;
          const viewport = page.getViewport({ scale });
          
          // Create canvas with proper dimensions
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          
          if (!context) {
            throw new Error('Failed to get canvas context');
          }
          
          canvas.height = viewport.height;
          canvas.width = viewport.width;
          
          const renderContext = {
            canvasContext: context,
            viewport: viewport,
          };
          
          // Render page with timeout
          const renderPromise = page.render(renderContext).promise;
          const renderTimeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Page render timeout')), 15000);
          });
          
          await Promise.race([renderPromise, renderTimeoutPromise]);
          
          // Convert to blob with error handling
          const dataUrl = canvas.toDataURL('image/png', 0.95);
          
          if (!dataUrl || dataUrl === 'data:,') {
            throw new Error(`Failed to generate image for page ${pageNum}`);
          }
          
          const blob = await new Promise<Blob>((resolve, reject) => {
            canvas.toBlob((blob) => {
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error(`Failed to create blob for page ${pageNum}`));
              }
            }, 'image/png', 0.95);
          });
          
          images.push({
            id: `page-${pageNum}`,
            pageNumber: pageNum,
            dataUrl,
            blob
          });

          // Clean up page resources
          page.cleanup();
          
        } catch (pageError) {
          console.error(`Error processing page ${pageNum}:`, pageError);
          toast({
            title: `Page ${pageNum} Failed`,
            description: `Could not process page ${pageNum}`,
            variant: "destructive"
          });
        }
      }
      
      if (images.length === 0) {
        throw new Error('No pages could be converted');
      }
      
      setConvertedImages(images);
      setProgress({ current: totalPages, total: totalPages });
      
      toast({
        title: "Conversion Complete",
        description: `Successfully converted ${images.length} of ${totalPages} pages to images`
      });
      
    } catch (error: any) {
      console.error('PDF conversion error:', error);
      const errorMessage = error?.message || 'Unknown error occurred';
      setError(errorMessage);
      
      toast({
        title: "Conversion Failed",
        description: errorMessage.includes('timeout') 
          ? "PDF processing timed out. Try with a smaller file."
          : "There was an error converting your PDF. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsConverting(false);
      setProgress(null);
    }
  };

  const downloadSingleImage = (image: ConvertedImage) => {
    try {
      const link = document.createElement('a');
      const url = URL.createObjectURL(image.blob);
      link.href = url;
      link.download = `${file?.name?.replace('.pdf', '') || 'pdf'}_page_${image.pageNumber}.png`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up URL after a delay
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      
      toast({
        title: "Download Started",
        description: `Page ${image.pageNumber} image downloaded`
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Could not download the image",
        variant: "destructive"
      });
    }
  };

  const downloadAllAsZip = async () => {
    if (convertedImages.length === 0) return;
    
    try {
      const zip = new JSZip();
      const fileName = file?.name?.replace('.pdf', '') || 'pdf';
      
      convertedImages.forEach((image) => {
        zip.file(`${fileName}_page_${image.pageNumber.toString().padStart(3, '0')}.png`, image.blob);
      });
      
      const zipBlob = await zip.generateAsync({
        type: "blob",
        compression: "DEFLATE",
        compressionOptions: {
          level: 6
        }
      });
      
      const link = document.createElement('a');
      const url = URL.createObjectURL(zipBlob);
      link.href = url;
      link.download = `${fileName}_all_pages.zip`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up URL after a delay
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      
      toast({
        title: "ZIP Download Started",
        description: `All ${convertedImages.length} pages downloaded as ZIP`
      });
      
    } catch (error) {
      console.error('ZIP creation error:', error);
      toast({
        title: "ZIP Creation Failed",
        description: "There was an error creating the ZIP file",
        variant: "destructive"
      });
    }
  };

  return (
    <PageLayout
      title="PDF to Images"
      description="Convert PDF pages to individual PNG image files"
    >
      <div className="max-w-3xl mx-auto">
        <Card className="p-8 mb-6">
          <div className="space-y-6">
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
              <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Upload PDF File</h3>
                <p className="text-muted-foreground">Choose a PDF file to convert to PNG images</p>
                <p className="text-sm text-muted-foreground">Maximum recommended size: 50MB</p>
              </div>
              <Input
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="mt-4"
                disabled={isConverting}
              />
            </div>

            {file && (
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-medium">Selected file:</p>
                    <p className="text-sm text-muted-foreground">{file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Size: {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClear}
                    disabled={isConverting}
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
                  <p className="font-medium text-red-800 dark:text-red-200">Conversion Error</p>
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
                onClick={handleConvert}
                disabled={!file || isConverting}
                className="flex-1"
              >
                {isConverting ? "Converting..." : "Convert to Images"}
              </Button>
              
              {(file || convertedImages.length > 0 || error) && (
                <Button 
                  onClick={handleClear}
                  variant="outline"
                  disabled={isConverting}
                  className="flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Clear All
                </Button>
              )}
            </div>

            {isConverting && progress && (
              <div className="text-center space-y-3">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Converting PDF pages to images...
                  </p>
                  <p className="text-sm font-medium">
                    Page {progress.current} of {progress.total}
                  </p>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(progress.current / progress.total) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>

        {convertedImages.length > 0 && (
          <Card className="p-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  Converted Images ({convertedImages.length} pages)
                </h3>
                <div className="flex items-center gap-2">
                  <Button 
                    onClick={downloadAllAsZip}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download All as ZIP
                  </Button>
                  <Button 
                    onClick={handleClear}
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-4 h-4" />
                    Clear
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {convertedImages.map((image) => (
                  <div key={image.id} className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    <div className="aspect-[3/4] bg-gray-50 dark:bg-gray-800">
                      <img
                        src={image.dataUrl}
                        alt={`Page ${image.pageNumber}`}
                        className="w-full h-full object-contain"
                        loading="lazy"
                      />
                    </div>
                    <div className="p-3 border-t">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          Page {image.pageNumber}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => downloadSingleImage(image)}
                          className="flex items-center gap-1"
                        >
                          <DownloadIcon className="w-3 h-3" />
                          Download
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}
      </div>
    </PageLayout>
  );
}
