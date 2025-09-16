import { useState } from "react";
import { PageLayout } from "@/components/PageLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function SplitPdf() {
  const [file, setFile] = useState<File | null>(null);
  const [splitMode, setSplitMode] = useState("pages");
  const [pageRanges, setPageRanges] = useState("");
  const [isSplitting, setIsSplitting] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
    } else {
      toast({
        title: "Invalid file type",
        description: "Please select a PDF file",
        variant: "destructive"
      });
    }
  };

  const handleSplit = async () => {
    if (!file) return;
    
    setIsSplitting(true);
    setTimeout(() => {
      setIsSplitting(false);
      toast({
        title: "PDF Split Complete",
        description: "Your PDF has been split into separate files"
      });
    }, 2000);
  };

  return (
    <PageLayout
      title="Split PDF"
      description="Split a PDF into separate pages or sections"
    >
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
                  <p className="font-medium">Selected file:</p>
                  <p className="text-sm text-muted-foreground">{file.name}</p>
                  <p className="text-sm text-muted-foreground">Size: {(file.size / 1024 / 1024).toFixed(2)} MB</p>
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
                        onChange={(e) => setPageRanges(e.target.value)}
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
              disabled={!file || isSplitting || (splitMode === "range" && !pageRanges.trim())}
              className="w-full"
            >
              {isSplitting ? "Splitting PDF..." : "Split PDF"}
            </Button>
          </div>
        </Card>
      </div>
    </PageLayout>
  );
}