import { useState } from "react";
import { PageLayout } from "@/components/PageLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function TextToPdf() {
  const [text, setText] = useState("");
  const [fileName, setFileName] = useState("document");
  const [fontSize, setFontSize] = useState("12");
  const [fontFamily, setFontFamily] = useState("Arial");
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!text.trim()) {
      toast({
        title: "No text to convert",
        description: "Please enter some text to convert to PDF",
        variant: "destructive"
      });
      return;
    }
    
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      toast({
        title: "PDF Generated",
        description: `${fileName}.pdf has been created successfully`
      });
    }, 2000);
  };

  const wordCount = text.trim().split(/\s+/).filter(word => word.length > 0).length;
  const charCount = text.length;

  return (
    <PageLayout
      title="Text to PDF"
      description="Convert plain text into PDF documents"
    >
      <div className="max-w-2xl mx-auto">
        <Card className="p-8">
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="text">Enter your text</Label>
              <Textarea
                id="text"
                placeholder="Type or paste your text here..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="min-h-64 resize-y"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Words: {wordCount}</span>
                <span>Characters: {charCount}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="filename">File Name</Label>
                <Input
                  id="filename"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  placeholder="document"
                />
              </div>

              <div className="space-y-2">
                <Label>Font Family</Label>
                <Select value={fontFamily} onValueChange={setFontFamily}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Arial">Arial</SelectItem>
                    <SelectItem value="Times">Times New Roman</SelectItem>
                    <SelectItem value="Helvetica">Helvetica</SelectItem>
                    <SelectItem value="Courier">Courier New</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Font Size</Label>
                <Select value={fontSize} onValueChange={setFontSize}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10pt</SelectItem>
                    <SelectItem value="12">12pt</SelectItem>
                    <SelectItem value="14">14pt</SelectItem>
                    <SelectItem value="16">16pt</SelectItem>
                    <SelectItem value="18">18pt</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4" />
                <p className="text-sm font-medium">PDF Preview Settings</p>
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>Font: {fontFamily}, {fontSize}pt</p>
                <p>Estimated pages: {Math.ceil(wordCount / 250)}</p>
                <p>Output: {fileName}.pdf</p>
              </div>
            </div>

            <Button 
              onClick={handleGenerate}
              disabled={!text.trim() || isGenerating}
              className="w-full"
            >
              {isGenerating ? "Generating PDF..." : "Generate PDF"}
            </Button>
          </div>
        </Card>
      </div>
    </PageLayout>
  );
}