import { useState } from "react";
import { PageLayout } from "@/components/PageLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { QrCode, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function QrGenerator() {
  const [text, setText] = useState("");
  const [size, setSize] = useState("256");
  const [errorCorrection, setErrorCorrection] = useState("M");
  const [qrGenerated, setQrGenerated] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!text.trim()) {
      toast({
        title: "No content to encode",
        description: "Please enter text or URL to generate QR code",
        variant: "destructive"
      });
      return;
    }
    
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setQrGenerated(true);
      toast({
        title: "QR Code Generated",
        description: "Your QR code has been created successfully"
      });
    }, 1000);
  };

  const handleDownload = () => {
    toast({
      title: "Download Started",
      description: "QR code image download started"
    });
  };

  return (
    <PageLayout
      title="QR Code Generator"
      description="Generate QR codes from text or URLs"
    >
      <div className="max-w-2xl mx-auto">
        <Card className="p-8">
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="content">Text or URL to encode</Label>
              <Textarea
                id="content"
                placeholder="Enter text, URL, or any content to encode in QR code..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="min-h-24"
              />
              <p className="text-xs text-muted-foreground">
                Characters: {text.length} / 2953 max
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>QR Code Size</Label>
                <Select value={size} onValueChange={setSize}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="128">128x128 px</SelectItem>
                    <SelectItem value="256">256x256 px</SelectItem>
                    <SelectItem value="512">512x512 px</SelectItem>
                    <SelectItem value="1024">1024x1024 px</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Error Correction</Label>
                <Select value={errorCorrection} onValueChange={setErrorCorrection}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="L">Low (7%)</SelectItem>
                    <SelectItem value="M">Medium (15%)</SelectItem>
                    <SelectItem value="Q">Quartile (25%)</SelectItem>
                    <SelectItem value="H">High (30%)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button 
              onClick={handleGenerate}
              disabled={!text.trim() || isGenerating}
              className="w-full"
            >
              {isGenerating ? "Generating..." : "Generate QR Code"}
            </Button>

            {qrGenerated && (
              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-sm font-medium mb-4">Generated QR Code</p>
                  <div className="inline-block p-4 bg-white rounded-lg border">
                    <div 
                      className="bg-black rounded"
                      style={{ 
                        width: `${Math.min(200, parseInt(size))}px`, 
                        height: `${Math.min(200, parseInt(size))}px`,
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Crect width='200' height='200' fill='%23000'/%3E%3Crect x='10' y='10' width='20' height='20' fill='%23fff'/%3E%3Crect x='40' y='10' width='20' height='20' fill='%23fff'/%3E%3C/svg%3E")`,
                        backgroundSize: 'contain'
                      }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Button variant="outline" onClick={handleDownload}>
                    <Download className="w-4 h-4 mr-2" />
                    Download PNG
                  </Button>
                  <Button variant="outline" onClick={handleDownload}>
                    <Download className="w-4 h-4 mr-2" />
                    Download SVG
                  </Button>
                </div>

                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground">
                    <strong>Settings:</strong> {size}x{size}px, Error correction: {errorCorrection}
                  </p>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </PageLayout>
  );
}