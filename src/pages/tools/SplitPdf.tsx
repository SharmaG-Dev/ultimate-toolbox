import { useState, useEffect } from "react";
import { PDFDocument } from "pdf-lib";
import { PageLayout } from "@/components/PageLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Upload, X, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function SplitPdf() {
  const [file, setFile] = useState<File | null>(null);
  const [splitMode, setSplitMode] = useState<"pages" | "range" | any>("pages");
  const [pageRanges, setPageRanges] = useState("");
  const [isSplitting, setIsSplitting] = useState(false);
  const [splitFiles, setSplitFiles] = useState<{ url: string; name: string }[]>([]);
  const { toast } = useToast();

  // Cleanup Blob URLs to prevent memory leaks
  useEffect(() => {
    return () => {
      splitFiles.forEach(({ url }) => URL.revokeObjectURL(url));
    };
  }, [splitFiles]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === "application/pdf") {
      setFile(selectedFile);
      setSplitFiles([]);
      setPageRanges("");
    } else {
      toast({
        title: "Invalid file type",
        description: "Please select a PDF file",
        variant: "destructive",
      });
    }
  };

  // Clear all function to reset the component
  const handleClearAll = () => {
    // Revoke existing blob URLs to prevent memory leaks
    splitFiles.forEach(({ url }) => URL.revokeObjectURL(url));
    
    // Reset all state variables
    setFile(null);
    setSplitMode("pages");
    setPageRanges("");
    setIsSplitting(false);
    setSplitFiles([]);
    
    // Clear file input
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = "";
    }
    
    toast({
      title: "Cleared",
      description: "All data has been cleared successfully",
    });
  };

  // Parse page range input string into array of [start, end] tuples or singles
  const parseRanges = (input: string, maxPages: number): number[][] | null => {
    try {
      return input
        .split(",")
        .map(range => range.trim())
        .filter(Boolean)
        .map(range => {
          if (range.includes("-")) {
            const [startStr, endStr] = range.split("-");
            const start = parseInt(startStr, 10);
            const end = parseInt(endStr, 10);
            if (
              isNaN(start) ||
              isNaN(end) ||
              start < 1 ||
              end < start ||
              end > maxPages
            )
              throw new Error("Invalid range");
            return [start, end];
          } else {
            const page = parseInt(range, 10);
            if (isNaN(page) || page < 1 || page > maxPages)
              throw new Error("Invalid page");
            return [page, page];
          }
        });
    } catch {
      return null;
    }
  };

  const handleSplit = async () => {
    if (!file) return;

    setIsSplitting(true);
    setSplitFiles([]);

    try {
      const pdfBytes = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const totalPages = pdfDoc.getPageCount();

      let ranges: number[][] = [];

      if (splitMode === "pages") {
        // Each page as range [n, n]
        ranges = Array.from({ length: totalPages }, (_, i) => [i + 1, i + 1]);
      } else {
        const parsedRanges = parseRanges(pageRanges, totalPages);
        if (!parsedRanges) {
          toast({
            title: "Invalid page ranges",
            description: "Please enter valid page ranges within document limits",
            variant: "destructive",
          });
          setIsSplitting(false);
          return;
        }
        ranges = parsedRanges;
      }

      const newSplitFiles: { url: string; name: string }[] = [];

      for (let i = 0; i < ranges.length; i++) {
        const [start, end] = ranges[i];
        const newPdf = await PDFDocument.create();
        const pagesToCopy = await newPdf.copyPages(
          pdfDoc,
          Array.from({ length: end - start + 1 }, (_, idx) => start - 1 + idx)
        );
        pagesToCopy.forEach(page => newPdf.addPage(page));

        const newPdfBytes = await newPdf.save();
        const blob = new Blob([newPdfBytes], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        newSplitFiles.push({
          url,
          name:
            start === end
              ? `page_${start}.pdf`
              : `pages_${start}_${end}.pdf`,
        });
      }

      setSplitFiles(newSplitFiles);

      toast({
        title: "PDF Split Complete",
        description: `Split into ${newSplitFiles.length} file(s)`,
      });
    } catch (error) {
      toast({
        title: "Error splitting PDF",
        description: "An error occurred while splitting the PDF file.",
        variant: "destructive",
      });
    } finally {
      setIsSplitting(false);
    }
  };

  const handleDownload = (url: string, name: string) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
  };

  return (
    <PageLayout title="Split PDF" description="Split a PDF into separate pages or sections">
      <div className="max-w-2xl mx-auto">
        <Card className="p-8">
          <div className="space-y-6">
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
              <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Upload PDF File</h3>
                <p className="text-muted-foreground">Choose a PDF file to split</p>
              </div>
              <Input
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="mt-4"
              />
            </div>

            {file && (
              <div className="space-y-6">
                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">Selected file:</p>
                      <p className="text-sm text-muted-foreground">{file.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Size: {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
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

                <div className="space-y-4">
                  <Label className="text-base font-medium">Split Options</Label>
                  <RadioGroup value={splitMode} onValueChange={setSplitMode}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="pages" id="pages" />
                      <Label htmlFor="pages">Split into individual pages</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="range" id="range" />
                      <Label htmlFor="range">Split by page ranges</Label>
                    </div>
                  </RadioGroup>

                  {splitMode === "range" && (
                    <div className="space-y-2">
                      <Label htmlFor="ranges">Page Ranges (e.g., 1-3, 5-7, 9)</Label>
                      <Input
                        id="ranges"
                        placeholder="1-3, 5-7, 9"
                        value={pageRanges}
                        onChange={e => setPageRanges(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        Separate ranges with commas. Use hyphens for ranges (1-5) or single numbers (7).
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <Button
              onClick={handleSplit}
              disabled={
                !file ||
                isSplitting ||
                (splitMode === "range" && !pageRanges.trim())
              }
              className="w-full"
            >
              {isSplitting ? "Splitting PDF..." : "Split PDF"}
            </Button>

            {/* Preview and Download section */}
            {splitFiles.length > 0 && (
              <div className="mt-6 space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium">Split PDF Files</h4>
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
                <div className="max-h-96 overflow-y-auto space-y-4">
                  {splitFiles.map(({ url, name }, idx) => (
                    <div
                      key={idx}
                      className="p-4 border rounded-lg bg-muted relative"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <p className="font-medium">{name}</p>
                        <Button size="sm" onClick={() => handleDownload(url, name)}>
                          Download
                        </Button>
                      </div>
                      <iframe
                        src={url}
                        width="100%"
                        height="300px"
                        title={`Preview ${name}`}
                        className="border"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </PageLayout>
  );
}
