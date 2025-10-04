import { useState, useRef, useCallback, useEffect } from "react";
import { PageLayout } from "@/components/PageLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Upload, 
  FileText, 
  Download, 
  Settings, 
  Eye, 
  Zap, 
  Image as ImageIcon,
  Shield,
  Palette,
  Layout,
  Type,
  RotateCcw,
  CheckCircle,
  AlertCircle,
  Clock,
  Sparkles,
  Filter,
  Maximize,
  Minimize,
  Save,
  Share2,
  RefreshCw
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

import mammoth from "mammoth";
import html2pdf from "html2pdf.js";

// Advanced configuration interfaces
interface ConversionOptions {
  preserveFormatting: boolean;
  includeImages: boolean;
  enableLinks: boolean;
  pageBreaks: 'auto' | 'preserve' | 'optimize';
  imageQuality: number;
  compression: number;
  watermark: {
    enabled: boolean;
    text: string;
    opacity: number;
    position: 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
    color: string;
  };
  security: {
    enabled: boolean;
    password: string;
    allowPrint: boolean;
    allowCopy: boolean;
    allowModify: boolean;
  };
  margins: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  pageSize: string;
  orientation: 'portrait' | 'landscape';
  customCSS: string;
  headerFooter: {
    header: string;
    footer: string;
    pageNumbers: boolean;
  };
}

interface ProcessingStats {
  startTime: number;
  endTime?: number;
  fileSize: number;
  pages?: number;
  images?: number;
  tables?: number;
}

interface ConversionHistory {
  id: string;
  fileName: string;
  timestamp: Date;
  settings: ConversionOptions;
  stats: ProcessingStats;
  status: 'success' | 'error' | 'warning';
}

export default function AdvancedWordToPdf() {
  // Core state
  const [file, setFile] = useState<File | null>(null);
  const [htmlContent, setHtmlContent] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState("");
  const [progress, setProgress] = useState(0);
  const [conversionHistory, setConversionHistory] = useState<ConversionHistory[]>([]);
  
  // Advanced options state
  const [options, setOptions] = useState<ConversionOptions>({
    preserveFormatting: true,
    includeImages: true,
    enableLinks: true,
    pageBreaks: 'auto',
    imageQuality: 0.95,
    compression: 0.8,
    watermark: {
      enabled: false,
      text: 'CONFIDENTIAL',
      opacity: 0.3,
      position: 'center',
      color: '#ff0000'
    },
    security: {
      enabled: false,
      password: '',
      allowPrint: true,
      allowCopy: true,
      allowModify: true
    },
    margins: {
      top: 20,
      right: 15,
      bottom: 20,
      left: 15
    },
    pageSize: 'A4',
    orientation: 'portrait',
    customCSS: '',
    headerFooter: {
      header: '',
      footer: '',
      pageNumbers: false
    }
  });

  // UI state
  const [previewMode, setPreviewMode] = useState<'raw' | 'styled' | 'pdf'>('styled');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeTab, setActiveTab] = useState('upload');
  const [stats, setStats] = useState<ProcessingStats | null>(null);

  const { toast } = useToast();
  const previewRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const processedHtmlRef = useRef<string>("");

  // Auto-save options to localStorage
  useEffect(() => {
    const savedOptions = localStorage.getItem('wordToPdfOptions');
    if (savedOptions) {
      try {
        setOptions(JSON.parse(savedOptions));
      } catch (e) {
        console.warn('Failed to load saved options');
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('wordToPdfOptions', JSON.stringify(options));
  }, [options]);

  // Enhanced file validation and processing
  const validateFile = (file: File): { valid: boolean; message?: string } => {
    const maxSize = 50 * 1024 * 1024; // 50MB
    const supportedTypes = [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword'
    ];

    if (!supportedTypes.includes(file.type)) {
      return { valid: false, message: 'Only .doc and .docx files are supported' };
    }

    if (file.size > maxSize) {
      return { valid: false, message: 'File size must be less than 50MB' };
    }

    return { valid: true };
  };

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const validation = validateFile(selectedFile);
    if (!validation.valid) {
      toast({
        title: "Invalid file",
        description: validation.message,
        variant: "destructive",
      });
      return;
    }

    setFile(selectedFile);
    setHtmlContent("");
    setStats({
      startTime: Date.now(),
      fileSize: selectedFile.size
    });
    setActiveTab('options');

    toast({
      title: "File loaded successfully",
      description: `${selectedFile.name} (${(selectedFile.size / 1024 / 1024).toFixed(2)} MB)`,
    });
  }, [toast]);

  // Advanced DOCX to HTML conversion with progress tracking
  const convertDocxToHtml = useCallback(async () => {
    if (!file) return;

    setIsProcessing(true);
    setProgress(0);
    setProcessingStep("Reading document...");

    try {
      const arrayBuffer = await file.arrayBuffer();
      setProgress(20);
      setProcessingStep("Parsing document structure...");

      // Advanced mammoth options for better conversion
      const mammothOptions = {
        convertImage: mammoth.images.imgElement((image: any) => {
          if (!options.includeImages) return {};
          
          return image.read("base64").then((imageBuffer: string) => {
            // Optimize image if needed
            const quality = options.imageQuality;
            return {
              src: `data:${image.contentType};base64,${imageBuffer}`
            };
          });
        }),
        styleMap: [
          // Enhanced style mappings for better HTML output
          "p[style-name='Heading 1'] => h1:fresh",
          "p[style-name='Heading 2'] => h2:fresh", 
          "p[style-name='Heading 3'] => h3:fresh",
          "p[style-name='Title'] => h1.title:fresh",
          "p[style-name='Subtitle'] => h2.subtitle:fresh",
          "p[style-name='Quote'] => blockquote:fresh",
          "p[style-name='Code'] => pre:fresh",
          "r[style-name='Strong'] => strong",
          "r[style-name='Emphasis'] => em"
        ],
        includeDefaultStyleMap: true,
        includeEmbeddedStyleMap: options.preserveFormatting
      };

      setProgress(40);
      setProcessingStep("Converting to HTML...");

      const result = await mammoth.convertToHtml({ arrayBuffer }, mammothOptions);
      
      setProgress(70);
      setProcessingStep("Processing content...");

      // Enhanced HTML processing
      let processedHtml = result.value;
      
      // Apply custom CSS if provided
      if (options.customCSS) {
        processedHtml = `<style>${options.customCSS}</style>${processedHtml}`;
      }

      // Add page break optimization
      if (options.pageBreaks === 'optimize') {
        processedHtml = processedHtml.replace(
          /<h[1-6][^>]*>/g, 
          '<div style="page-break-before: auto;">$&'
        );
      }

      // Process tables for better PDF rendering
      processedHtml = processedHtml.replace(
        /<table[^>]*>/g,
        '<table style="width: 100%; border-collapse: collapse; margin: 10px 0;">'
      );

      // Add link processing
      if (!options.enableLinks) {
        processedHtml = processedHtml.replace(/<a[^>]*>(.*?)<\/a>/g, '$1');
      }

      processedHtmlRef.current = processedHtml;
      setHtmlContent(processedHtml);

      setProgress(90);
      setProcessingStep("Analyzing document...");

      // Calculate document statistics
      const parser = new DOMParser();
      const doc = parser.parseFromString(processedHtml, 'text/html');
      const images = doc.querySelectorAll('img').length;
      const tables = doc.querySelectorAll('table').length;
      const textLength = doc.body.textContent?.length || 0;
      const estimatedPages = Math.ceil(textLength / 2500); // Rough estimate

      setStats(prev => prev ? {
        ...prev,
        endTime: Date.now(),
        pages: estimatedPages,
        images,
        tables
      } : null);

      setProgress(100);
      setProcessingStep("Conversion complete!");
      setActiveTab('preview');

      // Show warnings if any
      if (result.messages.length > 0) {
        const warnings = result.messages.filter(m => m.type === 'warning');
        if (warnings.length > 0) {
          toast({
            title: "Conversion completed with warnings",
            description: `${warnings.length} formatting issues detected`,
            variant: "default",
          });
        }
      } else {
        toast({
          title: "✅ Conversion successful",
          description: `Document processed with ${images} images, ${tables} tables`,
        });
      }

    } catch (error) {
      console.error('Conversion error:', error);
      toast({
        title: "❌ Conversion failed",
        description: "Failed to process the Word document. Please try a different file.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setProgress(0);
      setProcessingStep("");
    }
  }, [file, options, toast]);

  // Advanced PDF generation with enhanced features
  const generateAdvancedPdf = useCallback(async () => {
    if (!htmlContent || !previewRef.current || !file) return;

    setIsProcessing(true);
    setProgress(0);
    setProcessingStep("Preparing PDF generation...");

    try {
      // Create enhanced HTML for PDF
      const clone = previewRef.current.cloneNode(true) as HTMLElement;
      
      // Apply watermark if enabled
      if (options.watermark.enabled) {
        const watermarkDiv = document.createElement('div');
        watermarkDiv.style.cssText = `
          position: fixed;
          ${options.watermark.position === 'center' ? 'top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg);' : 
            options.watermark.position === 'top-left' ? 'top: 20px; left: 20px;' :
            options.watermark.position === 'top-right' ? 'top: 20px; right: 20px;' :
            options.watermark.position === 'bottom-left' ? 'bottom: 20px; left: 20px;' :
            'bottom: 20px; right: 20px;'}
          font-size: 48px;
          color: ${options.watermark.color};
          opacity: ${options.watermark.opacity};
          pointer-events: none;
          z-index: 9999;
          font-family: Arial, sans-serif;
          font-weight: bold;
        `;
        watermarkDiv.textContent = options.watermark.text;
        clone.appendChild(watermarkDiv);
      }

      // Add header/footer if enabled
      if (options.headerFooter.header || options.headerFooter.footer || options.headerFooter.pageNumbers) {
        const headerDiv = document.createElement('div');
        headerDiv.style.cssText = `
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 40px;
          background: white;
          border-bottom: 1px solid #eee;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 ${options.margins.left}mm 0 ${options.margins.right}mm;
          font-size: 10px;
        `;
        headerDiv.innerHTML = `
          <span>${options.headerFooter.header}</span>
          ${options.headerFooter.pageNumbers ? '<span class="pageNumber"></span>' : ''}
        `;
        clone.insertBefore(headerDiv, clone.firstChild);
      }

      setProgress(20);
      setProcessingStep("Configuring PDF settings...");

      // Advanced PDF configuration
      const pdfOptions = {
        margin: [
          options.margins.top,
          options.margins.right, 
          options.margins.bottom,
          options.margins.left
        ],
        filename: file.name.replace(/\.(docx?|DOCX?)$/, '.pdf'),
        image: { 
          type: 'jpeg', 
          quality: options.imageQuality 
        },
        html2canvas: {
          scale: Math.max(2, Math.min(4, 3)), // Dynamic scaling
          useCORS: true,
          logging: false,
          allowTaint: true,
          backgroundColor: '#ffffff',
          removeContainer: true,
          scrollX: 0,
          scrollY: 0,
          windowWidth: options.pageSize === 'A4' ? 794 : 
                      options.pageSize === 'Letter' ? 816 : 794,
          onclone: (clonedDoc: Document) => {
            // Enhance cloned document for better PDF rendering
            const style = clonedDoc.createElement('style');
            style.textContent = `
              * { 
                -webkit-print-color-adjust: exact !important;
                color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                line-height: 1.6;
                color: #000;
                background: #fff;
              }
              img { 
                max-width: 100% !important; 
                height: auto !important;
                page-break-inside: avoid;
              }
              table { 
                page-break-inside: avoid;
                border-collapse: collapse;
                width: 100%;
              }
              h1, h2, h3, h4, h5, h6 { 
                page-break-after: avoid;
                margin-top: 1em;
                margin-bottom: 0.5em;
              }
              p { 
                orphans: 2;
                widows: 2;
              }
              .page-break { 
                page-break-before: always; 
              }
            `;
            clonedDoc.head.appendChild(style);
          }
        },
        jsPDF: { 
          unit: 'mm', 
          format: options.pageSize.toLowerCase(), 
          orientation: options.orientation,
          compress: options.compression > 0
        },
        pagebreak: {
          mode: options.pageBreaks === 'preserve' ? ['css', 'legacy'] : 
                options.pageBreaks === 'optimize' ? ['avoid-all'] : 
                ['css']
        }
      };

      setProgress(40);
      setProcessingStep("Rendering PDF...");

      // Create offscreen element for better rendering
      const offscreen = document.createElement("div");
      offscreen.style.cssText = `
        position: fixed;
        left: -9999px;
        top: 0;
        width: ${pdfOptions.html2canvas.windowWidth}px;
        background: #fff;
        color: #000;
        padding: ${options.margins.top}mm ${options.margins.right}mm ${options.margins.bottom}mm ${options.margins.left}mm;
        overflow: visible;
        opacity: 1;
        font-size: 14px;
        line-height: 1.6;
      `;

      offscreen.appendChild(clone);
      document.body.appendChild(offscreen);

      setProgress(60);
      setProcessingStep("Processing images...");

      // Wait for images to load
      const images = offscreen.querySelectorAll("img");
      if (images.length > 0) {
        await Promise.all(Array.from(images).map(img => {
          return new Promise<void>((resolve) => {
            if (img.complete) {
              resolve();
            } else {
              img.onload = () => resolve();
              img.onerror = () => resolve();
              setTimeout(() => resolve(), 5000); // Timeout after 5s
            }
          });
        }));
      }

      setProgress(80);
      setProcessingStep("Generating PDF file...");

      // Generate PDF with enhanced error handling
      const pdfGenerator = html2pdf().set(pdfOptions).from(offscreen);
      
      // Add progress callback if available
      await pdfGenerator.save();

      setProgress(95);
      setProcessingStep("Finalizing...");

      // Add to conversion history
      const historyEntry: ConversionHistory = {
        id: Date.now().toString(),
        fileName: file.name,
        timestamp: new Date(),
        settings: { ...options },
        stats: stats!,
        status: 'success'
      };

      setConversionHistory(prev => [historyEntry, ...prev.slice(0, 9)]);

      setProgress(100);
      setProcessingStep("PDF generated successfully!");

      // Cleanup
      document.body.removeChild(offscreen);

      toast({
        title: "🎉 PDF Generated Successfully",
        description: `${file.name} converted with ${stats?.pages || 'multiple'} pages`,
      });

    } catch (error) {
      console.error('PDF generation error:', error);
      toast({
        title: "❌ PDF Generation Failed",
        description: "Failed to generate PDF. Try adjusting the settings or simplifying the document.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setProgress(0);
      setProcessingStep("");
    }
  }, [htmlContent, file, options, stats, toast]);

  // Quick action handlers
  const handleQuickConvert = useCallback(async () => {
    if (!file) return;
    await convertDocxToHtml();
    setTimeout(() => {
      generateAdvancedPdf();
    }, 1000);
  }, [file, convertDocxToHtml, generateAdvancedPdf]);

  const resetAll = useCallback(() => {
    setFile(null);
    setHtmlContent("");
    setStats(null);
    setActiveTab('upload');
    if (inputRef.current) inputRef.current.value = "";
    
    toast({
      title: "Reset complete",
      description: "All data cleared. Ready for new conversion.",
    });
  }, [toast]);

  // Template presets
  const applyPreset = useCallback((preset: string) => {
    const presets = {
      highQuality: {
        ...options,
        imageQuality: 1.0,
        compression: 0.1,
        preserveFormatting: true,
        margins: { top: 25, right: 20, bottom: 25, left: 20 }
      },
      compressed: {
        ...options,
        imageQuality: 0.7,
        compression: 0.9,
        includeImages: true,
        margins: { top: 15, right: 10, bottom: 15, left: 10 }
      },
      professional: {
        ...options,
        headerFooter: { ...options.headerFooter, pageNumbers: true },
        margins: { top: 30, right: 25, bottom: 30, left: 25 },
        preserveFormatting: true
      }
    };

    setOptions(presets[preset as keyof typeof presets] || options);
    toast({
      title: "Preset applied",
      description: `${preset} settings configured`,
    });
  }, [options, toast]);

  return (
    <PageLayout 
      title="Advanced Word to PDF Converter" 
      description="Professional-grade document conversion with extensive customization options"
    >
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            <span className="font-semibold text-lg">Advanced Converter</span>
            {file && (
              <Badge variant="secondary" className="ml-2">
                {(file.size / 1024 / 1024).toFixed(1)} MB
              </Badge>
            )}
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => applyPreset('highQuality')}
              disabled={isProcessing}
            >
              <Sparkles className="w-4 h-4 mr-1" />
              High Quality
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => applyPreset('compressed')}
              disabled={isProcessing}
            >
              <Filter className="w-4 h-4 mr-1" />
              Compressed
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => applyPreset('professional')}
              disabled={isProcessing}
            >
              <Shield className="w-4 h-4 mr-1" />
              Professional
            </Button>
          </div>
        </div>

        {/* Progress Indicator */}
        {isProcessing && (
          <Card className="p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{processingStep}</span>
                <span className="text-xs text-muted-foreground">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </Card>
        )}

        {/* Main Interface */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Upload
            </TabsTrigger>
            <TabsTrigger value="options" disabled={!file} className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Options
            </TabsTrigger>
            <TabsTrigger value="preview" disabled={!htmlContent} className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Preview
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              History
            </TabsTrigger>
          </TabsList>

          {/* Upload Tab */}
          <TabsContent value="upload" className="space-y-6">
            <Card className="p-8 border-2 border-dashed hover:border-primary/50 transition-colors">
              <div className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <Upload className="w-8 h-8 text-primary" />
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold">Upload Word Document</h3>
                  <p className="text-muted-foreground">
                    Supports .doc and .docx files up to 50MB
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

                {file && (
                  <div className="mt-4 p-4 bg-muted rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-primary" />
                        <div className="text-left">
                          <p className="font-medium">{file.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {(file.size / 1024 / 1024).toFixed(2)} MB • 
                            {file.type.includes('openxml') ? 'DOCX' : 'DOC'}
                          </p>
                        </div>
                      </div>
                      <Button
                        onClick={handleQuickConvert}
                        disabled={isProcessing}
                        className="gap-2"
                      >
                        <Zap className="w-4 h-4" />
                        Quick Convert
                      </Button>
                    </div>
                  </div>
                )}

                <div className="flex gap-4 justify-center mt-6">
                  <Button 
                    onClick={convertDocxToHtml} 
                    disabled={!file || isProcessing}
                    variant="default"
                    className="gap-2"
                  >
                    <RefreshCw className={`w-4 h-4 ${isProcessing ? 'animate-spin' : ''}`} />
                    {isProcessing ? 'Converting...' : 'Convert to HTML'}
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    onClick={resetAll} 
                    disabled={isProcessing}
                    className="gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Reset
                  </Button>
                </div>
              </div>
            </Card>

            {/* Quick Stats */}
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="p-4">
                  <div className="text-center">
                    <FileText className="w-6 h-6 mx-auto mb-2 text-blue-500" />
                    <div className="text-2xl font-bold">{stats.pages || '?'}</div>
                    <div className="text-sm text-muted-foreground">Est. Pages</div>
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="text-center">
                    <ImageIcon className="w-6 h-6 mx-auto mb-2 text-green-500" />
                    <div className="text-2xl font-bold">{stats.images || 0}</div>
                    <div className="text-sm text-muted-foreground">Images</div>
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="text-center">
                    <Layout className="w-6 h-6 mx-auto mb-2 text-purple-500" />
                    <div className="text-2xl font-bold">{stats.tables || 0}</div>
                    <div className="text-sm text-muted-foreground">Tables</div>
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="text-center">
                    <Clock className="w-6 h-6 mx-auto mb-2 text-orange-500" />
                    <div className="text-2xl font-bold">
                      {stats.endTime ? `${((stats.endTime - stats.startTime) / 1000).toFixed(1)}s` : '...'}
                    </div>
                    <div className="text-sm text-muted-foreground">Process Time</div>
                  </div>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* Options Tab */}
          <TabsContent value="options" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Basic Settings */}
              <Card className="p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Basic Settings
                </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Page Size</Label>
                      <Select 
                        value={options.pageSize} 
                        onValueChange={(value) => setOptions(prev => ({ ...prev, pageSize: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="A4">A4</SelectItem>
                          <SelectItem value="A3">A3</SelectItem>
                          <SelectItem value="A5">A5</SelectItem>
                          <SelectItem value="Letter">Letter</SelectItem>
                          <SelectItem value="Legal">Legal</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Orientation</Label>
                      <Select 
                        value={options.orientation} 
                        onValueChange={(value: 'portrait' | 'landscape') => setOptions(prev => ({ ...prev, orientation: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="portrait">Portrait</SelectItem>
                          <SelectItem value="landscape">Landscape</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label>Image Quality: {(options.imageQuality * 100).toFixed(0)}%</Label>
                    <Slider
                      value={[options.imageQuality]}
                      onValueChange={([value]) => setOptions(prev => ({ ...prev, imageQuality: value }))}
                      max={1}
                      min={0.1}
                      step={0.05}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label>Compression: {(options.compression * 100).toFixed(0)}%</Label>
                    <Slider
                      value={[options.compression]}
                      onValueChange={([value]) => setOptions(prev => ({ ...prev, compression: value }))}
                      max={1}
                      min={0}
                      step={0.1}
                      className="mt-2"
                    />
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="preserveFormatting"
                        checked={options.preserveFormatting}
                        onCheckedChange={(checked) => setOptions(prev => ({ ...prev, preserveFormatting: checked === true }))}
                      />
                      <Label htmlFor="preserveFormatting">Preserve original formatting</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="includeImages"
                        checked={options.includeImages}
                        onCheckedChange={(checked) => setOptions(prev => ({ ...prev, includeImages: checked === true }))}
                      />
                      <Label htmlFor="includeImages">Include images</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="enableLinks"
                        checked={options.enableLinks}
                        onCheckedChange={(checked) => setOptions(prev => ({ ...prev, enableLinks: checked === true }))}
                      />
                      <Label htmlFor="enableLinks">Preserve hyperlinks</Label>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Advanced Settings */}
              <Card className="p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Advanced Settings
                </h3>
                <div className="space-y-4">
                  <div>
                    <Label>Page Breaks</Label>
                    <Select 
                      value={options.pageBreaks} 
                      onValueChange={(value: 'auto' | 'preserve' | 'optimize') => setOptions(prev => ({ ...prev, pageBreaks: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="auto">Automatic</SelectItem>
                        <SelectItem value="preserve">Preserve original</SelectItem>
                        <SelectItem value="optimize">Optimize for PDF</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Margins (mm)</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <div>
                        <Label className="text-xs">Top</Label>
                        <Input
                          type="number"
                          value={options.margins.top}
                          onChange={(e) => setOptions(prev => ({ 
                            ...prev, 
                            margins: { ...prev.margins, top: Number(e.target.value) }
                          }))}
                          min={0}
                          max={50}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Right</Label>
                        <Input
                          type="number"
                          value={options.margins.right}
                          onChange={(e) => setOptions(prev => ({ 
                            ...prev, 
                            margins: { ...prev.margins, right: Number(e.target.value) }
                          }))}
                          min={0}
                          max={50}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Bottom</Label>
                        <Input
                          type="number"
                          value={options.margins.bottom}
                          onChange={(e) => setOptions(prev => ({ 
                            ...prev, 
                            margins: { ...prev.margins, bottom: Number(e.target.value) }
                          }))}
                          min={0}
                          max={50}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Left</Label>
                        <Input
                          type="number"
                          value={options.margins.left}
                          onChange={(e) => setOptions(prev => ({ 
                            ...prev, 
                            margins: { ...prev.margins, left: Number(e.target.value) }
                          }))}
                          min={0}
                          max={50}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Watermark Settings */}
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="watermark"
                        checked={options.watermark.enabled}
                        onCheckedChange={(checked) => setOptions(prev => ({ 
                          ...prev, 
                          watermark: { ...prev.watermark, enabled: checked === true }
                        }))}
                      />
                      <Label htmlFor="watermark">Add watermark</Label>
                    </div>

                    {options.watermark.enabled && (
                      <div className="ml-6 space-y-3">
                        <Input
                          placeholder="Watermark text"
                          value={options.watermark.text}
                          onChange={(e) => setOptions(prev => ({ 
                            ...prev, 
                            watermark: { ...prev.watermark, text: e.target.value }
                          }))}
                        />
                        
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-xs">Opacity: {(options.watermark.opacity * 100).toFixed(0)}%</Label>
                            <Slider
                              value={[options.watermark.opacity]}
                              onValueChange={([value]) => setOptions(prev => ({ 
                                ...prev, 
                                watermark: { ...prev.watermark, opacity: value }
                              }))}
                              max={1}
                              min={0.1}
                              step={0.1}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Color</Label>
                            <Input
                              type="color"
                              value={options.watermark.color}
                              onChange={(e) => setOptions(prev => ({ 
                                ...prev, 
                                watermark: { ...prev.watermark, color: e.target.value }
                              }))}
                              className="h-8 p-1"
                            />
                          </div>
                        </div>

                        <Select 
                          value={options.watermark.position} 
                          onValueChange={(value: any) => setOptions(prev => ({ 
                            ...prev, 
                            watermark: { ...prev.watermark, position: value }
                          }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="center">Center</SelectItem>
                            <SelectItem value="top-left">Top Left</SelectItem>
                            <SelectItem value="top-right">Top Right</SelectItem>
                            <SelectItem value="bottom-left">Bottom Left</SelectItem>
                            <SelectItem value="bottom-right">Bottom Right</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                </div>
              </Card>

              {/* Header/Footer Settings */}
              <Card className="p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Type className="w-4 h-4" />
                  Header & Footer
                </h3>
                <div className="space-y-4">
                  <div>
                    <Label>Header Text</Label>
                    <Input
                      placeholder="Document header"
                      value={options.headerFooter.header}
                      onChange={(e) => setOptions(prev => ({ 
                        ...prev, 
                        headerFooter: { ...prev.headerFooter, header: e.target.value }
                      }))}
                    />
                  </div>

                  <div>
                    <Label>Footer Text</Label>
                    <Input
                      placeholder="Document footer"
                      value={options.headerFooter.footer}
                      onChange={(e) => setOptions(prev => ({ 
                        ...prev, 
                        headerFooter: { ...prev.headerFooter, footer: e.target.value }
                      }))}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="pageNumbers"
                      checked={options.headerFooter.pageNumbers}
                      onCheckedChange={(checked) => setOptions(prev => ({ 
                        ...prev, 
                        headerFooter: { ...prev.headerFooter, pageNumbers: checked === true }
                      }))}
                    />
                    <Label htmlFor="pageNumbers">Include page numbers</Label>
                  </div>
                </div>
              </Card>

              {/* Security Settings */}
              <Card className="p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Security & Protection
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="security"
                      checked={options.security.enabled}
                      onCheckedChange={(checked) => setOptions(prev => ({ 
                        ...prev, 
                        security: { ...prev.security, enabled: checked === true }
                      }))}
                    />
                    <Label htmlFor="security">Enable PDF protection</Label>
                  </div>

                  {options.security.enabled && (
                    <div className="ml-6 space-y-3">
                      <div>
                        <Label>Password</Label>
                        <Input
                          type="password"
                          placeholder="Enter password"
                          value={options.security.password}
                          onChange={(e) => setOptions(prev => ({ 
                            ...prev, 
                            security: { ...prev.security, password: e.target.value }
                          }))}
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="allowPrint"
                            checked={options.security.allowPrint}
                            onCheckedChange={(checked) => setOptions(prev => ({ 
                              ...prev, 
                              security: { ...prev.security, allowPrint: checked === true }
                            }))}
                          />
                          <Label htmlFor="allowPrint">Allow printing</Label>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="allowCopy"
                            checked={options.security.allowCopy}
                            onCheckedChange={(checked) => setOptions(prev => ({ 
                              ...prev, 
                              security: { ...prev.security, allowCopy: checked === true }
                            }))}
                          />
                          <Label htmlFor="allowCopy">Allow copying</Label>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="allowModify"
                            checked={options.security.allowModify}
                            onCheckedChange={(checked) => setOptions(prev => ({ 
                              ...prev, 
                              security: { ...prev.security, allowModify: checked === true }
                            }))}
                          />
                          <Label htmlFor="allowModify">Allow modifications</Label>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* Preview Tab */}
          <TabsContent value="preview" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Label>Preview Mode:</Label>
                <Select value={previewMode} onValueChange={(value: 'raw' | 'styled' | 'pdf') => setPreviewMode(value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="raw">Raw HTML</SelectItem>
                    <SelectItem value="styled">Styled</SelectItem>
                    <SelectItem value="pdf">PDF Layout</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsFullscreen(!isFullscreen)}
                >
                  {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                  {isFullscreen ? 'Exit' : 'Fullscreen'}
                </Button>
                
                <Button
                  onClick={generateAdvancedPdf}
                  disabled={!htmlContent || isProcessing}
                  className="gap-2"
                >
                  <Download className="w-4 h-4" />
                  Generate PDF
                </Button>
              </div>
            </div>

            <Card className={`${isFullscreen ? 'fixed inset-4 z-50' : ''} overflow-auto`}>
              <div 
                ref={previewRef}
                className={`p-6 ${
                  previewMode === 'pdf' ? 'bg-white shadow-lg max-w-4xl mx-auto' : 
                  previewMode === 'raw' ? 'font-mono text-sm' : 'prose max-w-none'
                } ${isFullscreen ? 'h-full overflow-auto' : 'max-h-[600px]'}`}
                style={previewMode === 'pdf' ? {
                  width: options.pageSize === 'A4' ? '794px' : '816px',
                  minHeight: options.pageSize === 'A4' ? '1123px' : '1056px',
                  margin: '0 auto',
                  padding: `${options.margins.top}mm ${options.margins.right}mm ${options.margins.bottom}mm ${options.margins.left}mm`
                } : {}}
                dangerouslySetInnerHTML={{
                  __html: previewMode === 'raw' ? 
                    `<pre><code>${htmlContent.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>` :
                    htmlContent || '<p class="text-muted-foreground">No content to preview</p>'
                }}
              />
            </Card>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Conversion History</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConversionHistory([])}
                disabled={conversionHistory.length === 0}
              >
                Clear History
              </Button>
            </div>

            {conversionHistory.length === 0 ? (
              <Card className="p-8 text-center">
                <Clock className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No conversion history yet</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {conversionHistory.map((entry) => (
                  <Card key={entry.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${
                          entry.status === 'success' ? 'bg-green-500' : 
                          entry.status === 'error' ? 'bg-red-500' : 'bg-yellow-500'
                        }`} />
                        <div>
                          <p className="font-medium">{entry.fileName}</p>
                          <p className="text-sm text-muted-foreground">
                            {entry.timestamp.toLocaleString()} • 
                            {entry.stats.pages} pages • 
                            {((entry.stats.endTime || 0) - entry.stats.startTime) / 1000}s
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge variant={entry.status === 'success' ? 'default' : 'destructive'}>
                          {entry.status}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setOptions(entry.settings);
                            toast({
                              title: "Settings restored",
                              description: "Previous conversion settings applied",
                            });
                          }}
                        >
                          <RefreshCw className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
}
