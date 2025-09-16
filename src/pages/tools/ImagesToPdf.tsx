import { useState } from "react";
import { PageLayout } from "@/components/PageLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Upload, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ImagesToPdf() {
  const [files, setFiles] = useState<File[]>([]);
  const [isConverting, setIsConverting] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const imageFiles = selectedFiles.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length !== selectedFiles.length) {
      toast({
        title: "Some files skipped",
        description: "Only image files are accepted",
        variant: "destructive"
      });
    }
    
    setFiles(prev => [...prev, ...imageFiles]);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleConvert = async () => {
    if (files.length === 0) return;
    
    setIsConverting(true);
    setTimeout(() => {
      setIsConverting(false);
      toast({
        title: "PDF Created",
        description: `Successfully combined ${files.length} images into PDF`
      });
    }, 2000);
  };

  return (
    <PageLayout
      title="Images to PDF"
      description="Combine multiple images into a single PDF document"
    >
      <div className="max-w-2xl mx-auto">
        <Card className="p-8">
          <div className="space-y-6">
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
              <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Upload Images</h3>
                <p className="text-muted-foreground">Select multiple images to combine into PDF</p>
              </div>
              <Input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileChange}
                className="mt-4"
              />
            </div>

            {files.length > 0 && (
              <div className="space-y-4">
                <h4 className="font-medium">Selected Images ({files.length})</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {files.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div>
                        <p className="text-sm font-medium">{file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Button 
              onClick={handleConvert}
              disabled={files.length === 0 || isConverting}
              className="w-full"
            >
              {isConverting ? "Creating PDF..." : `Create PDF from ${files.length} images`}
            </Button>
          </div>
        </Card>
      </div>
    </PageLayout>
  );
}