import { useState } from "react";
import { PageLayout } from "@/components/PageLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Upload, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import jsPDF from "jspdf";

export default function ImagesToPdf() {
  const [files, setFiles] = useState<File[]>([]);
  const [isConverting, setIsConverting] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const imageFiles = selectedFiles.filter((file) =>
      file.type.startsWith("image/")
    );

    if (imageFiles.length !== selectedFiles.length) {
      toast({
        title: "Some files skipped",
        description: "Only image files are accepted",
        variant: "destructive",
      });
    }

    setFiles((prev) => [...prev, ...imageFiles]);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;
    const reordered = Array.from(files);
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    setFiles(reordered);
  };

  const handleConvert = async () => {
    if (files.length === 0) return;

    setIsConverting(true);

    const pdf = new jsPDF();

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const imgData = await readFileAsDataURL(file);

      const img = new Image();
      img.src = imgData;

      await new Promise((resolve) => {
        img.onload = () => {
          const imgWidth = pdf.internal.pageSize.getWidth();
          const imgHeight =
            (img.height * imgWidth) / img.width;

          if (i > 0) pdf.addPage();
          pdf.addImage(img, "JPEG", 0, 0, imgWidth, imgHeight);
          resolve(true);
        };
      });
    }

    pdf.save("images.pdf");

    setIsConverting(false);
    toast({
      title: "PDF Created",
      description: `Successfully combined ${files.length} images into PDF`,
    });
  };

  const readFileAsDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
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
                <p className="text-muted-foreground">
                  Select multiple images to combine into PDF
                </p>
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
                <h4 className="font-medium">
                  Reorder Images by Drag & Drop ({files.length})
                </h4>
                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable droppableId="files">
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className="space-y-2 max-h-60 overflow-y-auto"
                      >
                        {files.map((file, index) => (
                          <Draggable
                            key={file.name + index}
                            draggableId={file.name + index}
                            index={index}
                          >
                            {(provided) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className="flex items-center justify-between p-3 bg-muted rounded-lg"
                              >
                                <div>
                                  <p className="text-sm font-medium">
                                    {file.name}
                                  </p>
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
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              </div>
            )}

            <Button
              onClick={handleConvert}
              disabled={files.length === 0 || isConverting}
              className="w-full"
            >
              {isConverting
                ? "Creating PDF..."
                : `Create PDF from ${files.length} images`}
            </Button>
          </div>
        </Card>
      </div>
    </PageLayout>
  );
}
