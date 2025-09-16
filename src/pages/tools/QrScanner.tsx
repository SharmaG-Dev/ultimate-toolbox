import { useState } from "react";
import { PageLayout } from "@/components/PageLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Upload, Scan, Copy, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function QrScanner() {
  const [file, setFile] = useState<File | null>(null);
  const [scannedData, setScannedData] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type.startsWith('image/')) {
      setFile(selectedFile);
      setScannedData("");
    } else {
      toast({
        title: "Invalid file type",
        description: "Please select an image file",
        variant: "destructive"
      });
    }
  };

  const handleScan = async () => {
    if (!file) return;
    
    setIsScanning(true);
    // Simulate QR code scanning
    setTimeout(() => {
      const mockData = "https://example.com/sample-url";
      setScannedData(mockData);
      setIsScanning(false);
      toast({
        title: "QR Code Scanned",
        description: "Successfully decoded QR code content"
      });
    }, 2000);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(scannedData);
    toast({
      title: "Copied to clipboard",
      description: "QR code content copied successfully"
    });
  };

  const openLink = () => {
    if (scannedData.startsWith('http')) {
      window.open(scannedData, '_blank');
    }
  };

  const isUrl = scannedData.startsWith('http://') || scannedData.startsWith('https://');

  return (
    <PageLayout
      title="QR Code Scanner"
      description="Scan and decode QR codes from images"
    >
      <div className="max-w-2xl mx-auto">
        <Card className="p-8">
          <div className="space-y-6">
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
              <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Upload QR Code Image</h3>
                <p className="text-muted-foreground">Select an image containing a QR code</p>
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
                    <p className="text-sm text-muted-foreground">QR code image preview</p>
                  </div>
                </div>

                {scannedData && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Scan className="w-5 h-5 text-green-600" />
                      <h3 className="font-medium text-green-600">QR Code Content</h3>
                    </div>
                    
                    <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                      <p className="text-sm break-all">{scannedData}</p>
                    </div>

                    <div className="flex gap-2">
                      <Button variant="outline" onClick={copyToClipboard} className="flex-1">
                        <Copy className="w-4 h-4 mr-2" />
                        Copy
                      </Button>
                      {isUrl && (
                        <Button variant="outline" onClick={openLink} className="flex-1">
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Open Link
                        </Button>
                      )}
                    </div>

                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-xs text-muted-foreground">
                        <strong>Content Type:</strong> {isUrl ? 'URL' : 'Text'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        <strong>Length:</strong> {scannedData.length} characters
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            <Button 
              onClick={handleScan}
              disabled={!file || isScanning}
              className="w-full"
            >
              {isScanning ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Scanning QR Code...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Scan className="w-4 h-4" />
                  Scan QR Code
                </div>
              )}
            </Button>
          </div>
        </Card>
      </div>
    </PageLayout>
  );
}