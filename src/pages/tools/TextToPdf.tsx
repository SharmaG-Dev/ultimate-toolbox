import { useState, useRef } from "react";
import { PageLayout } from "@/components/PageLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Download,
  Eye,
  Settings,
  Palette,
  Layout,
  Type,
  Clock,
  Sparkles,
  AlignLeft,
  AlignCenter,
  AlignRight
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import jsPDF from 'jspdf';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

type ExtendedJsPDF = jsPDF & {
  setUserPassword?: (password: string) => jsPDF;
  saveGraphicsState?: () => jsPDF;
  restoreGraphicsState?: () => jsPDF;
  setGState?: (gState: any) => jsPDF;
  GState?: (options: { opacity: number }) => any;
};


// Interface for export history records
interface ExportRecord {
  id: number;
  fileName: string;
  timestamp: string;
  pages: number;
  size: string;
  template: string;
  settings: {
    fontSize: string;
    fontFamily: string;
    pageSize: string;
    pageOrientation: string;
  };
}

// Template configuration type
interface TemplateConfig {
  backgroundColor?: string;
  fontSize?: string;
  fontFamily?: string;
  textColor?: string;
  marginTop?: number;
  marginBottom?: number;
  enableHeader?: boolean;
  headerText?: string;
  enableFooter?: boolean;
  pageNumbers?: boolean;
  lineHeight?: number;
}

export default function TextToPdf() {
  // Basic content state - now stores HTML from Quill
  const [content, setContent] = useState<string>("");
  const [fileName, setFileName] = useState<string>("document");

  // Typography settings
  const [fontSize, setFontSize] = useState<string>("12");
  const [fontFamily, setFontFamily] = useState<string>("Arial");
  const [textColor, setTextColor] = useState<string>("#000000");
  const [lineHeight, setLineHeight] = useState<number>(1.5);
  const [textAlign, setTextAlign] = useState<"left" | "center" | "right">("left");

  // Page layout settings
  const [pageSize, setPageSize] = useState<string>("A4");
  const [pageOrientation, setPageOrientation] = useState<"portrait" | "landscape" | any>("portrait");
  const [marginTop, setMarginTop] = useState<number>(20);
  const [marginBottom, setMarginBottom] = useState<number>(20);
  const [marginLeft, setMarginLeft] = useState<number>(20);
  const [marginRight, setMarginRight] = useState<number>(20);
  const [backgroundColor, setBackgroundColor] = useState<string>("#ffffff");

  // Advanced features
  const [enableWatermark, setEnableWatermark] = useState<boolean>(false);
  const [watermarkText, setWatermarkText] = useState<string>("CONFIDENTIAL");
  const [watermarkOpacity, setWatermarkOpacity] = useState<number>(0.3);
  const [watermarkRotation, setWatermarkRotation] = useState<number>(-45);
  const [watermarkColor, setWatermarkColor] = useState<string>("#ff0000");

  // Header/Footer
  const [enableHeader, setEnableHeader] = useState<boolean>(false);
  const [headerText, setHeaderText] = useState<string>("");
  const [enableFooter, setEnableFooter] = useState<boolean>(false);
  const [footerText, setFooterText] = useState<string>("");
  const [pageNumbers, setPageNumbers] = useState<boolean>(false);

  // Template & Formatting
  const [template, setTemplate] = useState<string>("blank");

  // Export options
  const [enablePassword, setEnablePassword] = useState<boolean>(false);
  const [password, setPassword] = useState<string>("");

  // State management
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [previewMode, setPreviewMode] = useState<boolean>(false);
  const [exportHistory, setExportHistory] = useState<ExportRecord[]>([]);

  const previewRef = useRef<HTMLDivElement>(null);
  const quillRef = useRef<ReactQuill>(null);
  const { toast } = useToast();

  // Quill editor configuration
  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      [{ 'font': [] }],
      [{ 'size': ['small', false, 'large', 'huge'] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'script': 'sub' }, { 'script': 'super' }],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      [{ 'indent': '-1' }, { 'indent': '+1' }],
      [{ 'direction': 'rtl' }],
      [{ 'align': [] }],
      ['blockquote', 'code-block'],
      ['link', 'image', 'video'],
      ['clean']
    ]
  };

  const quillFormats = [
    'header', 'font', 'size',
    'bold', 'italic', 'underline', 'strike',
    'color', 'background',
    'script',
    'list', 'bullet',
    'indent',
    'direction', 'align',
    'blockquote', 'code-block',
    'link', 'image', 'video'
  ];

  // Convert HTML to plain text for PDF generation
  const htmlToPlainText = (html: string): string => {
    // Create a temporary div to parse HTML
    const temp = document.createElement('div');
    temp.innerHTML = html;

    // Extract text content with basic formatting preservation
    let text = temp.textContent || temp.innerText || '';

    // Clean up extra whitespace
    text = text.replace(/\s+/g, ' ').trim();

    return text;
  };

  // Advanced PDF generation with jsPDF
  const generateAdvancedPDF = async (): Promise<void> => {
    if (!content.trim()) {
      toast({
        title: "No content to export",
        description: "Please enter some content to convert to PDF",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);

    try {
      // Create jsPDF instance with custom settings
      const orientation = pageOrientation === 'landscape' ? 'l' : 'p';
      const format = pageSize.toLowerCase();
      const doc = new jsPDF(orientation, 'mm', format) as ExtendedJsPDF;

      // Set document properties
      doc.setProperties({
        title: fileName,
        creator: 'Advanced Text to PDF Converter',
        author: 'React PDF Generator',
     
      });

      // Page dimensions
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const contentWidth = pageWidth - marginLeft - marginRight;

      // Set background color
      if (backgroundColor !== '#ffffff') {
        doc.setFillColor(backgroundColor);
        doc.rect(0, 0, pageWidth, pageHeight, 'F');
      }

      // Configure text settings
      doc.setFont(fontFamily.toLowerCase());
      doc.setFontSize(parseInt(fontSize));
      doc.setTextColor(textColor);

      // Convert HTML content to plain text for PDF
      const textContent = htmlToPlainText(content);

      // Split text into lines that fit the page
      const lines = doc.splitTextToSize(textContent, contentWidth);

      let currentY = marginTop;
      let pageCount = 1;

      // Add header if enabled
      if (enableHeader && headerText) {
        doc.setFontSize(10);
        doc.text(headerText, marginLeft, 15);
        doc.setFontSize(parseInt(fontSize));
      }

      // Add main content
      for (let i = 0; i < lines.length; i++) {
        // Check if we need a new page
        if (currentY + (parseInt(fontSize) * lineHeight * 0.352778) > pageHeight - marginBottom) {
          // Add watermark to current page before creating new page
          if (enableWatermark) {
            addWatermark(doc, pageWidth, pageHeight);
          }

          // Add page number to current page
          if (pageNumbers) {
            addPageNumber(doc, pageCount, pageWidth, pageHeight);
          }

          doc.addPage();
          pageCount++;
          currentY = marginTop;

          // Add header to new page
          if (enableHeader && headerText) {
            doc.setFontSize(10);
            doc.text(headerText, marginLeft, 15);
            doc.setFontSize(parseInt(fontSize));
          }
        }

        // Add text with alignment
        const x = textAlign === 'center' ? pageWidth / 2 :
          textAlign === 'right' ? pageWidth - marginRight : marginLeft;

        doc.text(lines[i], x, currentY, {
          align: textAlign === 'left' ? undefined : textAlign
        });

        currentY += parseInt(fontSize) * lineHeight * 0.352778; // Convert to mm
      }

      // Add watermark to last page
      if (enableWatermark) {
        addWatermark(doc, pageWidth, pageHeight);
      }

      // Add page number to last page
      if (pageNumbers) {
        addPageNumber(doc, pageCount, pageWidth, pageHeight);
      }

      // Add footer if enabled
      if (enableFooter && footerText) {
        doc.setFontSize(10);
        doc.text(footerText, marginLeft, pageHeight - 10);
      }

      // Password protection (basic implementation)
      if (enablePassword && password && doc.setUserPassword) {
        doc.setUserPassword(password);
      }

      // Save the PDF
      doc.save(`${fileName}.pdf`);

      // Update export history
      const exportRecord: ExportRecord = {
        id: Date.now(),
        fileName: `${fileName}.pdf`,
        timestamp: new Date().toLocaleString(),
        pages: pageCount,
        size: `${(textContent.length / 1024).toFixed(1)} KB`,
        template,
        settings: {
          fontSize,
          fontFamily,
          pageSize,
          pageOrientation
        }
      };

      setExportHistory(prev => [exportRecord, ...prev.slice(0, 9)]);

      toast({
        title: "✅ PDF Generated Successfully",
        description: `${fileName}.pdf (${pageCount} pages) has been downloaded`,
      });

    } catch (error) {
      console.error('PDF generation error:', error);
      toast({
        title: "❌ Generation Failed",
        description: "There was an error generating your PDF. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Add watermark to page
  const addWatermark = (doc: ExtendedJsPDF, pageWidth: number, pageHeight: number): void => {
    if (!enableWatermark || !watermarkText) return;

    if (doc.saveGraphicsState && doc.setGState && doc.GState && doc.restoreGraphicsState) {
      doc.saveGraphicsState();
      doc.setGState(doc.GState({ opacity: watermarkOpacity }));
      doc.setTextColor(watermarkColor);
      doc.setFontSize(48);

      // Calculate center position
      const centerX = pageWidth / 2;
      const centerY = pageHeight / 2;

      // Rotate and add watermark text
      doc.text(watermarkText, centerX, centerY, {
        angle: watermarkRotation,
        align: 'center'
      });

      doc.restoreGraphicsState();
    }
  };

  // Add page numbers
  const addPageNumber = (doc: jsPDF, pageNum: number, pageWidth: number, pageHeight: number): void => {
    doc.setFontSize(10);
    doc.setTextColor('#666666');
    doc.text(`Page ${pageNum}`, pageWidth - 30, pageHeight - 10);
  };

  // Apply predefined templates
  const applyTemplate = (templateName: string): void => {
    const templates: Record<string, TemplateConfig> = {
      blank: {
        backgroundColor: '#ffffff',
        fontSize: '12',
        fontFamily: 'Arial',
        textColor: '#000000'
      },
      modern: {
        backgroundColor: '#f8f9fa',
        fontSize: '11',
        fontFamily: 'Helvetica',
        textColor: '#2c3e50',
        enableHeader: true,
        headerText: 'Modern Document Template'
      },
      professional: {
        backgroundColor: '#ffffff',
        fontSize: '12',
        fontFamily: 'Times',
        textColor: '#000000',
        marginTop: 25,
        marginBottom: 25,
        enableFooter: true,
        pageNumbers: true
      },
      creative: {
        backgroundColor: '#fef7ff',
        fontSize: '13',
        fontFamily: 'Helvetica',
        textColor: '#6a1b9a',
        lineHeight: 1.6
      }
    };

    const selectedTemplate = templates[templateName];
    if (selectedTemplate) {
      Object.keys(selectedTemplate).forEach(key => {
        const setterMap: Record<string, (value: any) => void> = {
          backgroundColor: setBackgroundColor,
          fontSize: setFontSize,
          fontFamily: setFontFamily,
          textColor: setTextColor,
          marginTop: setMarginTop,
          marginBottom: setMarginBottom,
          enableHeader: setEnableHeader,
          headerText: setHeaderText,
          enableFooter: setEnableFooter,
          pageNumbers: setPageNumbers,
          lineHeight: setLineHeight
        };

        if (setterMap[key]) {
          setterMap[key](selectedTemplate[key as keyof TemplateConfig]);
        }
      });
    }
  };

  // Real-time statistics
  const plainText = htmlToPlainText(content);
  const wordCount = plainText.trim().split(/\s+/).filter(word => word.length > 0).length;
  const charCount = plainText.length;
  const paragraphCount = content.split('</p>').length - 1 || 1;
  const estimatedPages = Math.max(1, Math.ceil(wordCount / 250));
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  return (
    <PageLayout
      title="Advanced Text to PDF Converter"
      description="Convert rich text to professional PDF documents with advanced formatting and features"
    >
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Main Content Editor */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <Type className="w-4 h-4" />
                    Rich Text Editor
                  </Label>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPreviewMode(!previewMode)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      {previewMode ? 'Edit' : 'Preview'}
                    </Button>
                  </div>
                </div>

                {!previewMode ? (
                  <div className="quill-editor-container">
                    <ReactQuill
                      ref={quillRef}
                      theme="snow"
                      value={content}
                      onChange={setContent}
                      modules={quillModules}
                      formats={quillFormats}
                      placeholder="Start typing your document content here... 

Use the toolbar above to format your text with headings, bold, italic, lists, links, and more!"
                      style={{ minHeight: '400px' }}
                    />
                  </div>
                ) : (
                  <div
                    ref={previewRef}
                    className="min-h-96 p-4 border rounded-md bg-white prose max-w-none"
                    style={{
                      fontSize: `${fontSize}px`,
                      fontFamily: fontFamily,
                      color: textColor,
                      lineHeight: lineHeight,
                      textAlign: textAlign,
                      backgroundColor: backgroundColor
                    }}
                    dangerouslySetInnerHTML={{
                      __html: content || '<p class="text-muted-foreground">Preview will appear here...</p>'
                    }}
                  />
                )}

                {/* Real-time Statistics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted rounded-lg text-sm">
                  <div className="text-center">
                    <div className="font-semibold text-lg">{wordCount}</div>
                    <div className="text-muted-foreground">Words</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-lg">{charCount}</div>
                    <div className="text-muted-foreground">Characters</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-lg">{paragraphCount}</div>
                    <div className="text-muted-foreground">Paragraphs</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-lg">{readingTime}m</div>
                    <div className="text-muted-foreground">Read time</div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Export History */}
            {exportHistory.length > 0 && (
              <Card className="p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Recent Exports
                </h3>
                <div className="space-y-3">
                  {exportHistory.slice(0, 5).map((record) => (
                    <div key={record.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div>
                        <div className="font-medium">{record.fileName}</div>
                        <div className="text-sm text-muted-foreground">
                          {record.timestamp} • {record.pages} pages • {record.size}
                        </div>
                      </div>
                      <Badge variant="outline">{record.template}</Badge>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* Settings Panel - Same as before, keeping it brief for space */}
          <div className="space-y-6">

            {/* Quick Templates */}
            <Card className="p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Quick Templates
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'blank', name: 'Blank', icon: '📄' },
                  { id: 'modern', name: 'Modern', icon: '✨' },
                  { id: 'professional', name: 'Business', icon: '💼' },
                  { id: 'creative', name: 'Creative', icon: '🎨' }
                ].map((tmpl) => (
                  <Button
                    key={tmpl.id}
                    variant={template === tmpl.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setTemplate(tmpl.id);
                      applyTemplate(tmpl.id);
                    }}
                  >
                    {tmpl.icon} {tmpl.name}
                  </Button>
                ))}
              </div>
            </Card>

            {/* Basic Settings */}
            <Card className="p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Basic Settings
              </h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="filename">File Name</Label>
                  <Input
                    id="filename"
                    value={fileName}
                    onChange={(e) => setFileName(e.target.value)}
                    placeholder="document"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Page Size</Label>
                    <Select value={pageSize} onValueChange={setPageSize}>
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
                    <Select value={pageOrientation} onValueChange={setPageOrientation}>
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
              </div>
            </Card>

            {/* Typography Settings */}
            <Card className="p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Type className="w-4 h-4" />
                Typography
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Font Family</Label>
                    <Select value={fontFamily} onValueChange={setFontFamily}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Arial">Arial</SelectItem>
                        <SelectItem value="Times">Times New Roman</SelectItem>
                        <SelectItem value="Helvetica">Helvetica</SelectItem>
                        <SelectItem value="Courier">Courier New</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Font Size</Label>
                    <Select value={fontSize} onValueChange={setFontSize}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="8">8pt</SelectItem>
                        <SelectItem value="9">9pt</SelectItem>
                        <SelectItem value="10">10pt</SelectItem>
                        <SelectItem value="11">11pt</SelectItem>
                        <SelectItem value="12">12pt</SelectItem>
                        <SelectItem value="14">14pt</SelectItem>
                        <SelectItem value="16">16pt</SelectItem>
                        <SelectItem value="18">18pt</SelectItem>
                        <SelectItem value="20">20pt</SelectItem>
                        <SelectItem value="24">24pt</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>Text Alignment</Label>
                  <div className="flex gap-1 mt-1">
                    {[
                      { value: 'left' as const, icon: AlignLeft },
                      { value: 'center' as const, icon: AlignCenter },
                      { value: 'right' as const, icon: AlignRight }
                    ].map(({ value, icon: Icon }) => (
                      <Button
                        key={value}
                        variant={textAlign === value ? "default" : "outline"}
                        size="sm"
                        onClick={() => setTextAlign(value)}
                      >
                        <Icon className="w-4 h-4" />
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Line Height: {lineHeight}</Label>
                  <Slider
                    value={[lineHeight]}
                    onValueChange={([value]) => setLineHeight(value)}
                    min={1}
                    max={3}
                    step={0.1}
                    className="mt-2"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Text Color</Label>
                    <Input
                      type="color"
                      value={textColor}
                      onChange={(e) => setTextColor(e.target.value)}
                      className="h-10 p-1"
                    />
                  </div>
                  <div>
                    <Label>Background</Label>
                    <Input
                      type="color"
                      value={backgroundColor}
                      onChange={(e) => setBackgroundColor(e.target.value)}
                      className="h-10 p-1"
                    />
                  </div>
                </div>
              </div>
            </Card>

            {/* Advanced Features */}
            <Card className="p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Advanced Features
              </h3>
              <div className="space-y-4">

                {/* Watermark Section */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="watermark"
                      checked={enableWatermark}
                      onCheckedChange={(checked) => setEnableWatermark(checked === true)}
                    />
                    <Label htmlFor="watermark">Add Watermark</Label>
                  </div>

                  {enableWatermark && (
                    <div className="ml-6 space-y-3">
                      <Input
                        placeholder="Watermark text"
                        value={watermarkText}
                        onChange={(e) => setWatermarkText(e.target.value)}
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label>Opacity: {watermarkOpacity}</Label>
                          <Slider
                            value={[watermarkOpacity]}
                            onValueChange={([value]) => setWatermarkOpacity(value)}
                            min={0.1}
                            max={1}
                            step={0.1}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label>Color</Label>
                          <Input
                            type="color"
                            value={watermarkColor}
                            onChange={(e) => setWatermarkColor(e.target.value)}
                            className="h-8 p-1"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Page Numbers */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="pageNumbers"
                    checked={pageNumbers}
                    onCheckedChange={(checked) => setPageNumbers(checked === true)}
                  />
                  <Label htmlFor="pageNumbers">Add Page Numbers</Label>
                </div>

                {/* Header/Footer */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="header"
                      checked={enableHeader}
                      onCheckedChange={(checked) => setEnableHeader(checked === true)}
                    />
                    <Label htmlFor="header">Add Header</Label>
                  </div>
                  {enableHeader && (
                    <Input
                      placeholder="Header text"
                      value={headerText}
                      onChange={(e) => setHeaderText(e.target.value)}
                      className="ml-6"
                    />
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="footer"
                      checked={enableFooter}
                      onCheckedChange={(checked) => setEnableFooter(checked === true)}
                    />
                    <Label htmlFor="footer">Add Footer</Label>
                  </div>
                  {enableFooter && (
                    <Input
                      placeholder="Footer text"
                      value={footerText}
                      onChange={(e) => setFooterText(e.target.value)}
                      className="ml-6"
                    />
                  )}
                </div>

                {/* Password Protection */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="password"
                      checked={enablePassword}
                      onCheckedChange={(checked) => setEnablePassword(checked === true)}
                    />
                    <Label htmlFor="password">Password Protection</Label>
                  </div>
                  {enablePassword && (
                    <Input
                      type="password"
                      placeholder="Enter password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="ml-6"
                    />
                  )}
                </div>
              </div>
            </Card>

            {/* PDF Preview Info */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-4 h-4" />
                <h3 className="font-medium">PDF Preview</h3>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Format:</span>
                  <Badge variant="outline">{pageSize} {pageOrientation}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Font:</span>
                  <span>{fontFamily}, {fontSize}pt</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Est. Pages:</span>
                  <span>{estimatedPages}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Template:</span>
                  <span className="capitalize">{template}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Features:</span>
                  <div className="flex gap-1">
                    {enableWatermark && <Badge variant="secondary" className="text-xs">WM</Badge>}
                    {pageNumbers && <Badge variant="secondary" className="text-xs">PG</Badge>}
                    {enablePassword && <Badge variant="secondary" className="text-xs">🔒</Badge>}
                  </div>
                </div>
              </div>
            </Card>

            {/* Generate Button */}
            <Button
              onClick={generateAdvancedPDF}
              disabled={!content.trim() || isGenerating}
              className="w-full h-12 text-lg"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Generating PDF...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5 mr-2" />
                  Generate Advanced PDF
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Custom styles for Quill editor */}
      <style>{`
        .quill-editor-container .ql-editor {
          min-height: 400px;
        }
        
        .quill-editor-container .ql-toolbar {
          border-top-left-radius: 0.5rem;
          border-top-right-radius: 0.5rem;
        }
        
        .quill-editor-container .ql-container {
          border-bottom-left-radius: 0.5rem;
          border-bottom-right-radius: 0.5rem;
        }
        
        .prose {
          max-width: none;
        }
      `}</style>
    </PageLayout>
  );
}
