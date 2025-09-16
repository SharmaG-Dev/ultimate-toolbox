import { useState } from "react";
import { PageLayout } from "@/components/PageLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Upload, Copy, Palette } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ColorPicker() {
  const [file, setFile] = useState<File | null>(null);
  const [extractedColors, setExtractedColors] = useState<string[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type.startsWith('image/')) {
      setFile(selectedFile);
      setExtractedColors([]);
    } else {
      toast({
        title: "Invalid file type",
        description: "Please select an image file",
        variant: "destructive"
      });
    }
  };

  const handleExtractColors = async () => {
    if (!file) return;
    
    setIsExtracting(true);
    // Simulate color extraction
    setTimeout(() => {
      const mockColors = [
        "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7",
        "#DDA0DD", "#98FB98", "#F4A460", "#87CEEB", "#DEB887"
      ];
      setExtractedColors(mockColors);
      setIsExtracting(false);
      toast({
        title: "Colors Extracted",
        description: "Successfully extracted color palette from image"
      });
    }, 2000);
  };

  const copyToClipboard = (color: string) => {
    navigator.clipboard.writeText(color);
    toast({
      title: "Color Copied",
      description: `${color} copied to clipboard`
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
                  <p className="font-medium">Selected image:</p>
                  <p className="text-sm text-muted-foreground">{file.name}</p>
                  <p className="text-sm text-muted-foreground">Size: {(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Image Preview</p>
                  <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                    <p className="text-sm text-muted-foreground">Image preview will appear here</p>
                  </div>
                </div>

                {extractedColors.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Palette className="w-5 h-5" />
                      <h3 className="font-medium">Extracted Colors</h3>
                    </div>
                    <div className="grid grid-cols-5 gap-3">
                      {extractedColors.map((color, index) => (
                        <div key={index} className="space-y-2">
                          <div 
                            className="aspect-square rounded-lg border-2 border-border cursor-pointer hover:scale-105 transition-transform"
                            style={{ backgroundColor: color }}
                            onClick={() => copyToClipboard(color)}
                          />
                          <div className="text-center">
                            <p className="text-xs font-mono">{color}</p>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(color)}
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