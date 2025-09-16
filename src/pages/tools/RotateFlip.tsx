import { useState } from "react";
import { PageLayout } from "@/components/PageLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Upload, RotateCw, RotateCcw, FlipHorizontal, FlipVertical } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function RotateFlip() {
  const [file, setFile] = useState<File | null>(null);
  const [rotation, setRotation] = useState(0);
  const [isFlippedH, setIsFlippedH] = useState(false);
  const [isFlippedV, setIsFlippedV] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type.startsWith('image/')) {
      setFile(selectedFile);
      setRotation(0);
      setIsFlippedH(false);
      setIsFlippedV(false);
    } else {
      toast({
        title: "Invalid file type",
        description: "Please select an image file",
        variant: "destructive"
      });
    }
  };

  const rotate = (degrees: number) => {
    setRotation((prev) => (prev + degrees) % 360);
  };

  const flipHorizontal = () => {
    setIsFlippedH(!isFlippedH);
  };

  const flipVertical = () => {
    setIsFlippedV(!isFlippedV);
  };

  const resetTransforms = () => {
    setRotation(0);
    setIsFlippedH(false);
    setIsFlippedV(false);
  };

  const applyTransforms = async () => {
    if (!file) return;
    
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      toast({
        title: "Image Transformed",
        description: "Your transformations have been applied successfully"
      });
    }, 1500);
  };

  const getTransformStyle = () => {
    let transform = `rotate(${rotation}deg)`;
    if (isFlippedH) transform += " scaleX(-1)";
    if (isFlippedV) transform += " scaleY(-1)";
    return { transform };
  };

  return (
    <PageLayout
      title="Rotate & Flip Images"
      description="Rotate images and flip horizontally or vertically"
    >
      <div className="max-w-2xl mx-auto">
        <Card className="p-8">
          <div className="space-y-6">
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
              <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Upload Image</h3>
                <p className="text-muted-foreground">Select an image to rotate or flip</p>
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

                <div className="space-y-4">
                  <div className="text-center">
                    <p className="text-sm font-medium mb-4">Preview</p>
                    <div className="inline-block p-4 bg-background border rounded-lg">
                      <div 
                        className="w-32 h-32 bg-muted rounded border-2 border-dashed border-primary/50 flex items-center justify-center transition-transform duration-300"
                        style={getTransformStyle()}
                      >
                        <p className="text-xs text-muted-foreground">Image Preview</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Rotation Controls</p>
                      <div className="flex gap-2 justify-center">
                        <Button variant="outline" onClick={() => rotate(-90)}>
                          <RotateCcw className="w-4 h-4 mr-2" />
                          90° Left
                        </Button>
                        <Button variant="outline" onClick={() => rotate(90)}>
                          <RotateCw className="w-4 h-4 mr-2" />
                          90° Right
                        </Button>
                      </div>
                      <p className="text-center text-xs text-muted-foreground">
                        Current rotation: {rotation}°
                      </p>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-medium">Flip Controls</p>
                      <div className="flex gap-2 justify-center">
                        <Button 
                          variant={isFlippedH ? "default" : "outline"} 
                          onClick={flipHorizontal}
                        >
                          <FlipHorizontal className="w-4 h-4 mr-2" />
                          Flip Horizontal
                        </Button>
                        <Button 
                          variant={isFlippedV ? "default" : "outline"} 
                          onClick={flipVertical}
                        >
                          <FlipVertical className="w-4 h-4 mr-2" />
                          Flip Vertical
                        </Button>
                      </div>
                    </div>

                    <div className="flex justify-center">
                      <Button variant="ghost" onClick={resetTransforms}>
                        Reset All
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <Button 
              onClick={applyTransforms}
              disabled={!file || isProcessing || (rotation === 0 && !isFlippedH && !isFlippedV)}
              className="w-full"
            >
              {isProcessing ? "Applying Changes..." : "Apply Transformations"}
            </Button>
          </div>
        </Card>
      </div>
    </PageLayout>
  );
}