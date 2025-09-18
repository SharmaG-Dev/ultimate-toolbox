import { useState, useEffect } from "react";
import { PDFDocument } from "pdf-lib";
import { PageLayout } from "@/components/PageLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Upload, X, ArrowUp, ArrowDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function MergePdfs() {
  const [files, setFiles] = useState<File[]>([]);
  const [isMerging, setIsMerging] = useState(false);
  const [mergedUrl, setMergedUrl] = useState<string | null>(null);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const pdfFiles = selectedFiles.filter(file => file.type === "application/pdf");

    if (pdfFiles.length !== selectedFiles.length) {
      toast({
        title: "Some files skipped",
        description: "Only PDF files are accepted",
        variant: "destructive",
      });
    }

    setFiles(prev => [...prev, ...pdfFiles]);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const moveFile = (index: number, direction: "up" | "down") => {
    if ((direction === "up" && index === 0) || (direction === "down" && index === files.length - 1)) return;

    const newFiles = [...files];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    [newFiles[index], newFiles[targetIndex]] = [newFiles[targetIndex], newFiles[index]];
    setFiles(newFiles);
  };

  // Cleanup merged PDF URL when component unmounts or files change
  useEffect(() => {
    return () => {
      if (mergedUrl) {
        URL.revokeObjectURL(mergedUrl);
      }
    };
  }, [mergedUrl]);

  const handleMerge = async () => {
    if (files.length < 2) return;

    setIsMerging(true);

    try {
      const mergedPdf = await PDFDocument.create();

      for (const file of files) {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await PDFDocument.load(arrayBuffer);
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach(page => mergedPdf.addPage(page));
      }

      const mergedPdfBytes = await mergedPdf.save();
      const blob = new Blob([mergedPdfBytes], { type: "application/pdf" });

      // Revoke previous URL if any
      if (mergedUrl) {
        URL.revokeObjectURL(mergedUrl);
      }
      const url = URL.createObjectURL(blob);
      setMergedUrl(url);

      toast({
        title: "PDFs Merged",
        description: `Successfully merged ${files.length} PDF files`,
      });
    } catch (error) {
      toast({
        title: "Error Merging PDFs",
        description: "An error occurred while merging the PDF files.",
        variant: "destructive",
      });
    } finally {
      setIsMerging(false);
    }
  };

  const handleDownload = () => {
    if (!mergedUrl) return;
    const a = document.createElement("a");
    a.href = mergedUrl;
    a.download = "merged.pdf";
    a.click();
  };

  return (
    <PageLayout title="Merge PDFs" description="Combine multiple PDF files into a single document">
      <div className="max-w-2xl mx-auto">
        <Card className="p-8">
          <div className="space-y-6">
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
              <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Upload PDF Files</h3>
                <p className="text-muted-foreground">Select multiple PDF files to merge</p>
              </div>
              <Input
                type="file"
                accept=".pdf"
                multiple
                onChange={handleFileChange}
                className="mt-4"
              />
            </div>

            {files.length > 0 && (
              <div className="space-y-4">
                <h4 className="font-medium">PDF Files ({files.length}) - Reorder</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {files.map((file, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                      <div className="flex flex-col gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => moveFile(index, "up")}
                          disabled={index === 0}
                        >
                          <ArrowUp className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => moveFile(index, "down")}
                          disabled={index === files.length - 1}
                        >
                          <ArrowDown className="w-3 h-3" />
                        </Button>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => removeFile(index)}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Button onClick={handleMerge} disabled={files.length < 2 || isMerging} className="w-full">
              {isMerging ? "Merging PDFs..." : `Merge ${files.length} PDF files`}
            </Button>

            {mergedUrl && (
              <div className="mt-6">
                <h4 className="font-medium mb-2">Preview Merged PDF</h4>
                <iframe
                  src={mergedUrl}
                  width="100%"
                  height="500px"
                  title="Merged PDF Preview"
                  className="border"
                />
                <Button onClick={handleDownload} className="mt-2 w-full">
                  Download Merged PDF
                </Button>
              </div>
            )}
          </div>
        </Card>
      </div>
    </PageLayout>
  );
}
