import { useState, useRef, useCallback } from "react";
import { PageLayout } from "@/components/PageLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Upload, Copy, Palette, RotateCcw, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ExtractedColor {
  hex: string;
  rgb: { r: number; g: number; b: number };
  population: number;
}

export default function ColorPicker() {
  const [file, setFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string>("");
  const [extractedColors, setExtractedColors] = useState<ExtractedColor[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type.startsWith('image/')) {
      setFile(selectedFile);
      setExtractedColors([]);
      
      const reader = new FileReader();
      reader.onload = () => {
        setImageUrl(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    } else {
      toast({
        title: "Invalid file type",
        description: "Please select an image file",
        variant: "destructive"
      });
    }
  };

  const handleClearAll = () => {
    setFile(null);
    setImageUrl("");
    setExtractedColors([]);
    
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = "";
    }
    
    toast({
      title: "Cleared",
      description: "All data has been cleared successfully"
    });
  };

  // Simple and effective color extraction using canvas
  const extractColorsFromCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    
    if (!canvas || !img) return [];

    const ctx = canvas.getContext('2d');
    if (!ctx) return [];

    // Set canvas dimensions to match image
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;

    // Draw image to canvas
    ctx.drawImage(img, 0, 0);

    // Get image data
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Color frequency map
    const colorMap = new Map<string, { count: number; r: number; g: number; b: number }>();

    // Sample every 10th pixel for performance
    for (let i = 0; i < data.length; i += 40) { // 40 = 4 * 10 (RGBA * skip rate)
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const alpha = data[i + 3];

      // Skip transparent pixels
      if (alpha < 125) continue;

      // Round colors to reduce similar shades
      const roundedR = Math.round(r / 10) * 10;
      const roundedG = Math.round(g / 10) * 10;
      const roundedB = Math.round(b / 10) * 10;

      const colorKey = `${roundedR},${roundedG},${roundedB}`;
      
      if (colorMap.has(colorKey)) {
        colorMap.get(colorKey)!.count++;
      } else {
        colorMap.set(colorKey, { count: 1, r: roundedR, g: roundedG, b: roundedB });
      }
    }

    // Convert to array and sort by frequency
    const sortedColors = Array.from(colorMap.entries())
      .map(([_, color]) => ({
        hex: `#${color.r.toString(16).padStart(2, '0')}${color.g.toString(16).padStart(2, '0')}${color.b.toString(16).padStart(2, '0')}`,
        rgb: { r: color.r, g: color.g, b: color.b },
        population: color.count
      }))
      .sort((a, b) => b.population - a.population)
      .slice(0, 10); // Top 10 colors

    return sortedColors;
  }, []);

  const handleExtractColors = async () => {
    if (!imageUrl || !imageRef.current) return;
    
    setIsExtracting(true);
    
    try {
      // Wait for image to load if not already loaded
      if (!imageRef.current.complete) {
        await new Promise((resolve) => {
          if (imageRef.current) {
            imageRef.current.onload = resolve;
          }
        });
      }

      // Small delay to ensure everything is ready
      setTimeout(() => {
        const colors = extractColorsFromCanvas();
        setExtractedColors(colors);
        setIsExtracting(false);
        
        toast({
          title: "Colors Extracted",
          description: `Successfully extracted ${colors.length} colors from image`
        });
      }, 100);
      
    } catch (error) {
      console.error("Color extraction error:", error);
      setIsExtracting(false);
      toast({
        title: "Error extracting colors",
        description: "Please try with a different image",
        variant: "destructive"
      });
    }
  };

  const copyToClipboard = (color: string) => {
    navigator.clipboard.writeText(color);
    toast({
      title: "Color Copied",
      description: `${color} copied to clipboard`
    });
  };

  const downloadPalette = () => {
    if (extractedColors.length === 0) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const swatchSize = 100;
    canvas.width = swatchSize * extractedColors.length;
    canvas.height = swatchSize;

    extractedColors.forEach((color, index) => {
      ctx.fillStyle = color.hex;
      ctx.fillRect(index * swatchSize, 0, swatchSize, swatchSize);
    });

    const link = document.createElement('a');
    link.download = `color-palette-${Date.now()}.png`;
    link.href = canvas.toDataURL();
    link.click();

    toast({
      title: "Palette Downloaded",
      description: "Color palette saved as PNG"
    });
  };

  return (
    <PageLayout
      title="Color Picker"
      description="Extract hex color codes from images"
    >
      <div className="max-w-2xl mx-auto">
        <Card className="p-8">
          <div className="space-y-6">
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
              <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Upload Image</h3>
                <p className="text-muted-foreground">Select an image to extract colors</p>
              </div>
              <Input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="mt-4"
              />
            </div>

            {file && (
              <div className="space-y-6">
                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">Selected image:</p>
                      <p className="text-sm text-muted-foreground">{file.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Size: {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleClearAll}
                      className="flex items-center gap-2"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Clear All
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Image Preview</p>
                  <div className="relative border rounded-lg overflow-hidden bg-muted">
                    {imageUrl && (
                      <>
                        <img
                          ref={imageRef}
                          src={imageUrl}
                          alt="Selected"
                          className="w-full max-h-96 object-contain"
                          crossOrigin="anonymous"
                        />
                        <canvas
                          ref={canvasRef}
                          className="hidden"
                        />
                      </>
                    )}
                  </div>
                </div>

                {extractedColors.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Palette className="w-5 h-5" />
                        <h3 className="font-medium">Extracted Colors</h3>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={downloadPalette}
                        className="flex items-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Download
                      </Button>
                    </div>
                    <div className="grid grid-cols-5 gap-3">
                      {extractedColors.map((color, index) => (
                        <div key={index} className="space-y-2">
                          <div 
                            className="aspect-square rounded-lg border-2 border-border cursor-pointer hover:scale-105 transition-transform"
                            style={{ backgroundColor: color.hex }}
                            onClick={() => copyToClipboard(color.hex)}
                            title={`${color.hex} - Used ${color.population} times`}
                          />
                          <div className="text-center">
                            <p className="text-xs font-mono">{color.hex}</p>
                            <p className="text-xs text-muted-foreground">{color.population}px</p>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(color.hex)}
                              className="h-6 px-2 text-xs"
                            >
                              <Copy className="w-3 h-3 mr-1" />
                              Copy
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <Button 
              onClick={handleExtractColors}
              disabled={!file || isExtracting}
              className="w-full"
            >
              {isExtracting ? "Extracting Colors..." : "Extract Color Palette"}
            </Button>
          </div>
        </Card>
      </div>
    </PageLayout>
  );
}
