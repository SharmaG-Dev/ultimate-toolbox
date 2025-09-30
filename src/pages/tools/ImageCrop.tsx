import { useState, useRef, useCallback } from "react";
import { PageLayout } from "@/components/PageLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Upload, Download, RotateCcw, Crop } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Cropper, CropperRef } from "react-advanced-cropper";
import "react-advanced-cropper/dist/style.css";

export default function ImageCrop() {
  const [file, setFile] = useState<File | null>(null);
  const [src, setSrc] = useState<string>("");
  const [aspectRatio, setAspectRatio] = useState("custom");
  const [width, setWidth] = useState("800");
  const [height, setHeight] = useState("600");
  const [isCropping, setIsCropping] = useState(false);
  const [croppedImage, setCroppedImage] = useState<string | null>(null);
  const [imageNaturalSize, setImageNaturalSize] = useState({ width: 0, height: 0 });
  const cropperRef = useRef<CropperRef>(null);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type.startsWith('image/')) {
      setFile(selectedFile);
      setCroppedImage(null);
      
      const reader = new FileReader();
      reader.onload = () => {
        setSrc(reader.result as string);
        
        // Create image element to get natural dimensions
        const img = new Image();
        img.onload = () => {
          setImageNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
        };
        img.src = reader.result as string;
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
    setSrc("");
    setAspectRatio("custom");
    setWidth("800");
    setHeight("600");
    setCroppedImage(null);
    setIsCropping(false);
    setImageNaturalSize({ width: 0, height: 0 });
    
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = "";
    }
    
    toast({
      title: "Cleared",
      description: "All data has been cleared successfully"
    });
  };

  // Custom default size function jo exact dimensions set karega
  const getDefaultSize = useCallback(() => {
    if (aspectRatio === "custom" && width && height) {
      const customWidth = parseInt(width);
      const customHeight = parseInt(height);
      
      return () => ({
        width: customWidth,
        height: customHeight
      });
    }
    
    // Predefined aspect ratios ke liye
    const ratios = {
      "1:1": { width: 400, height: 400 },
      "16:9": { width: 640, height: 360 },
      "4:3": { width: 640, height: 480 },
      "3:2": { width: 600, height: 400 },
      "21:9": { width: 840, height: 360 }
    };
    
    const size = ratios[aspectRatio as keyof typeof ratios] || { width: 400, height: 400 };
    return () => size;
  }, [aspectRatio, width, height]);

  const getAspectRatio = useCallback(() => {
    switch (aspectRatio) {
      case "1:1":
        return 1;
      case "16:9":
        return 16 / 9;
      case "4:3":
        return 4 / 3;
      case "3:2":
        return 3 / 2;
      case "21:9":
        return 21 / 9;
      case "custom":
        if (width && height) {
          return parseInt(width) / parseInt(height);
        }
        return undefined;
      default:
        return undefined;
    }
  }, [aspectRatio, width, height]);

  const handleCrop = async () => {
    if (!cropperRef.current) return;
    
    setIsCropping(true);
    
    try {
      const canvas = cropperRef.current.getCanvas({
        width: parseInt(width) || 800,
        height: parseInt(height) || 600
      });
      
      if (canvas) {
        const croppedDataURL = canvas.toDataURL('image/png', 0.9);
        setCroppedImage(croppedDataURL);
        
        toast({
          title: "Image Cropped",
          description: `Cropped to ${width}x${height}px successfully`
        });
      }
    } catch (error) {
      toast({
        title: "Error cropping image",
        description: "An error occurred while cropping the image",
        variant: "destructive"
      });
    } finally {
      setIsCropping(false);
    }
  };

  const handleDownload = () => {
    if (!croppedImage) return;
    
    const link = document.createElement('a');
    link.download = `cropped-${width}x${height}-${file?.name || 'image'}.png`;
    link.href = croppedImage;
    link.click();
    
    toast({
      title: "Downloaded",
      description: `Image downloaded as ${width}x${height}px`
    });
  };

  const aspectRatios = [
    { value: "1:1", label: "Square (1:1)" },
    { value: "16:9", label: "Widescreen (16:9)" },
    { value: "4:3", label: "Standard (4:3)" },
    { value: "3:2", label: "Photo (3:2)" },
    { value: "21:9", label: "Ultrawide (21:9)" },
    { value: "custom", label: "Custom dimensions" }
  ];

  return (
    <PageLayout
      title="Image Crop Tool"
      description="Crop images to custom dimensions or aspect ratios"
    >
      <div className="max-w-4xl mx-auto">
        <Card className="p-8">
          <div className="space-y-6">
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
              <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Upload Image</h3>
                <p className="text-muted-foreground">Select an image to crop</p>
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
                      {imageNaturalSize.width > 0 && (
                        <p className="text-sm text-muted-foreground">
                          Original: {imageNaturalSize.width} x {imageNaturalSize.height}px
                        </p>
                      )}
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

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Aspect Ratio</Label>
                      <Select value={aspectRatio} onValueChange={setAspectRatio}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select aspect ratio" />
                        </SelectTrigger>
                        <SelectContent>
                          {aspectRatios.map((ratio) => (
                            <SelectItem key={ratio.value} value={ratio.value}>
                              {ratio.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="width">Output Width (px)</Label>
                        <Input
                          id="width"
                          type="number"
                          placeholder="800"
                          value={width}
                          onChange={(e) => setWidth(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="height">Output Height (px)</Label>
                        <Input
                          id="height"
                          type="number"
                          placeholder="600"
                          value={height}
                          onChange={(e) => setHeight(e.target.value)}
                        />
                      </div>
                      
                      {width && height && (
                        <div className="p-3 bg-muted rounded text-sm">
                          <p><strong>Target:</strong> {width} x {height}px</p>
                          <p><strong>Ratio:</strong> {(parseInt(width) / parseInt(height)).toFixed(2)}:1</p>
                        </div>
                      )}
                    </div>

                    <div className="pt-4 space-y-3">
                      <Button 
                        onClick={handleCrop}
                        disabled={!src || isCropping || !width || !height}
                        className="w-full flex items-center gap-2"
                      >
                        <Crop className="w-4 h-4" />
                        {isCropping ? "Cropping..." : "Crop Image"}
                      </Button>

                      {croppedImage && (
                        <Button 
                          onClick={handleDownload}
                          variant="outline"
                          className="w-full flex items-center gap-2"
                        >
                          <Download className="w-4 h-4" />
                          Download ({width}x{height}px)
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="lg:col-span-2">
                    <div className="space-y-4">
                      <Label className="text-base font-medium">
                        Crop Area - Target: {width || 800}x{height || 600}px
                      </Label>
                      <div className="border rounded-lg overflow-hidden bg-background">
                        {src && (
                          <Cropper
                            ref={cropperRef}
                            src={src}
                            className="cropper h-96 w-full"
                            defaultSize={getDefaultSize()}
                            stencilProps={{
                              aspectRatio: getAspectRatio(),
                              movable: true,
                              resizable: true,
                              lines: true,
                              handlers: true,
                            }}
                            backgroundWrapperProps={{
                              scaleImage: true,
                              moveImage: true,
                            }}
                          />
                        )}
                      </div>
                      
                      {width && height && (
                        <div className="text-sm text-muted-foreground text-center">
                          Rectangle shows exact {width}x{height}px crop area
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {croppedImage && (
                  <div className="mt-6 space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium">
                        Cropped Result ({width}x{height}px)
                      </h4>
                    </div>
                    <div className="p-4 border rounded-lg bg-muted text-center">
                      <img
                        src={croppedImage}
                        alt="Cropped result"
                        className="max-w-full h-auto rounded border mx-auto"
                        style={{ maxHeight: "400px" }}
                      />
                      <p className="text-sm text-muted-foreground mt-2">
                        Final output: {width} x {height} pixels
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>
      </div>
    </PageLayout>
  );
}
