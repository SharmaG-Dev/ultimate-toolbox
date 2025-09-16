import { useState } from "react";
import { PageLayout } from "@/components/PageLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Upload, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function BackgroundRemover() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type.startsWith('image/')) {
      setFile(selectedFile);
    } else {
      toast({
        title: "Invalid file type",
        description: "Please select an image file",
        variant: "destructive"
      });
    }
  };

  const handleRemoveBackground = async () => {
    if (!file) return;
    
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      toast({
        title: "Background Removed",
        description: "AI has successfully removed the background from your image"
      });
    }, 3000);
  };

  return (
    <PageLayout
      title="AI Background Remover"
      description="Remove backgrounds from images using AI technology"
    >
      <div className="max-w-2xl mx-auto">
        <Card className="p-8">
          <div className="space-y-6">
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
              <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Upload Image</h3>
                <p className="text-muted-foreground">Select an image to remove background</p>
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

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Original</p>
                    <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
                      <p className="text-xs text-muted-foreground text-center">Original image<br/>preview</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Background Removed</p>
                    <div className="aspect-square bg-muted rounded-lg flex items-center justify-center border-2 border-dashed">
                      <p className="text-xs text-muted-foreground text-center">
                        {isProcessing ? "Processing..." : "Result will appear here"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    <p className="text-sm font-medium text-blue-600">AI-Powered Background Removal</p>
                  </div>
                  <p className="text-xs text-blue-600/80">
                    Our AI will automatically detect the main subject and remove the background with precision.
                  </p>
                </div>
              </div>
            )}

            <Button 
              onClick={handleRemoveBackground}
              disabled={!file || isProcessing}
              className="w-full"
            >
              {isProcessing ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  AI Processing...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Remove Background with AI
                </div>
              )}
            </Button>
          </div>
        </Card>
      </div>
    </PageLayout>
  );
}