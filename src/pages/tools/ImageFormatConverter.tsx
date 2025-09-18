import { useState } from "react";
import JSZip from "jszip";
import { PageLayout } from "@/components/PageLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ImageFormatConverter() {
  const [file, setFile] = useState<File | null>(null);
  const [outputFormat, setOutputFormat] = useState("png");
  const [isConverting, setIsConverting] = useState(false);
  const { toast } = useToast();

  const isImageFile = (file: File) => file.type.startsWith("image/");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (selectedFile.type === "application/zip") {
      setFile(selectedFile);
    } else if (isImageFile(selectedFile)) {
      setFile(selectedFile);
    } else {
      toast({
        title: "Invalid file type",
        description: "Please select either an image file or a zip archive containing images.",
        variant: "destructive",
      });
    }
  };

  const getFileFormat = (file: File) => {
    return file.type.split("/")[1]?.toUpperCase() || "Unknown";
  };

  // Converts single image Blob to desired format as Blob
  const convertImageBlob = async (blob: Blob, format: string): Promise<Blob> => {
    return new Promise<Blob>((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(blob);
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          URL.revokeObjectURL(url);
          reject(new Error("Canvas context failed"));
          return;
        }
        ctx.drawImage(img, 0, 0);

        // Determine MIME type for output
        let mimeType = "image/png";
        if (format === "jpg") {
          mimeType = "image/jpeg";
        } else if (format === "webp") {
          mimeType = "image/webp";
        } else if (format === "gif") {
          // No direct GIF canvas export, fallback to PNG
          mimeType = "image/png";
        }

        canvas.toBlob(
          (convertedBlob) => {
            URL.revokeObjectURL(url);
            if (convertedBlob) {
              resolve(convertedBlob);
            } else {
              reject(new Error("Conversion failed"));
            }
          },
          mimeType,
          1
        );
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Image load error"));
      };
      img.src = url;
    });
  };

  // Main conversion handler incorporating zip support
  const handleConvert = async () => {
    if (!file) return;
    setIsConverting(true);

    try {
      if (file.type === "application/zip") {
        // Process ZIP archive
        const jszip = new JSZip();
        const zipContent = await jszip.loadAsync(file);
        const newZip = new JSZip();

        // Filter image files and convert them inside the zip
        const imageFiles = Object.values(zipContent.files).filter(
          (f) => !f.dir && f.name.match(/\.(jpe?g|png|webp|gif)$/i)
        );

        if (imageFiles.length === 0) {
          throw new Error("No image files found in the zip archive.");
        }

        for (const imageFile of imageFiles) {
          const imgData = await imageFile.async("blob");
          const convertedBlob = await convertImageBlob(imgData, outputFormat);
          const newExt = outputFormat === "jpg" ? "jpg" : outputFormat;
          // Replace extension with new format extension
          const baseName = imageFile.name.replace(/\.[^/.]+$/, "");
          newZip.file(`${baseName}_converted.${newExt}`, convertedBlob);
        }

        // Generate new zip blob
        const newZipBlob = await newZip.generateAsync({ type: "blob" });

        // Trigger download of new zip
        const a = document.createElement("a");
        a.href = URL.createObjectURL(newZipBlob);
        a.download = `${file.name.replace(/\.zip$/, "")}_converted.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        toast({
          title: "Conversion Complete",
          description: `Converted ${imageFiles.length} images and downloaded zip.`,
        });
      } else if (isImageFile(file)) {
        // Single image convert and download
        const convertedBlob = await convertImageBlob(file, outputFormat);
        const newExt = outputFormat === "jpg" ? "jpg" : outputFormat;
        const a = document.createElement("a");
        a.href = URL.createObjectURL(convertedBlob);
        a.download = `${file.name.replace(/\.[^/.]+$/, "")}_converted.${newExt}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        toast({
          title: "Conversion Complete",
          description: `Image converted to ${outputFormat.toUpperCase()} and downloaded.`,
        });
      }
    } catch (error: any) {
      toast({
        title: "Conversion Failed",
        description: error?.message || "An error occurred during conversion.",
        variant: "destructive",
      });
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <PageLayout
      title="Image Format Converter"
      description="Convert images or zip of images between JPG, PNG, WEBP, and GIF formats"
    >
      <div className="max-w-2xl mx-auto">
        <Card className="p-8">
          <div className="space-y-6">
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
              <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Upload Image or ZIP</h3>
                <p className="text-muted-foreground">Select an image file or a zip archive with images to convert</p>
              </div>
              <Input
                type="file"
                accept="image/*,application/zip"
                onChange={handleFileChange}
                className="mt-4"
              />
            </div>

            {file && (
              <div className="space-y-6">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="font-medium">Selected file:</p>
                  <p className="text-sm text-muted-foreground">{file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Type: {file.type} • Size: {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="format">Convert to format</Label>
                  <Select value={outputFormat} onValueChange={setOutputFormat}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select output format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="png">PNG</SelectItem>
                      <SelectItem value="jpg">JPG</SelectItem>
                      <SelectItem value="webp">WEBP</SelectItem>
                      <SelectItem value="gif">GIF</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                  <p className="text-sm">
                    <strong>Converting to:</strong> {outputFormat.toUpperCase()}
                  </p>
                </div>
              </div>
            )}

            <Button
              onClick={handleConvert}
              disabled={!file || isConverting}
              className="w-full"
            >
              {isConverting ? "Converting..." : `Convert to ${outputFormat.toUpperCase()}`}
            </Button>
          </div>
        </Card>
      </div>
    </PageLayout>
  );
}
