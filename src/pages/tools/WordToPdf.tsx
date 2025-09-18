import { useState, useRef } from "react";
import { PageLayout } from "@/components/PageLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

import mammoth from "mammoth";
import html2pdf from "html2pdf.js";

export default function WordToPdf() {
  const [file, setFile] = useState<File | null>(null);
  const [htmlContent, setHtmlContent] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const previewRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (
      selectedFile &&
      (selectedFile.type ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        selectedFile.type === "application/msword")
    ) {
      setFile(selectedFile);
      setHtmlContent("");
    } else {
      toast({
        title: "Invalid file format",
        description: "Please upload a Word document (DOC or DOCX).",
        variant: "destructive",
      });
    }
  };

  const convertDocxToHtml = async () => {
    if (!file) return;

    setIsProcessing(true);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.convertToHtml({ arrayBuffer });
      setHtmlContent(result.value);
      toast({
        title: "Conversion Success",
        description: "Word document converted to HTML preview.",
      });
    } catch {
      toast({
        title: "Conversion Error",
        description: "Failed to process the Word document.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadPdf = async () => {
    if (!htmlContent || !previewRef.current) return;
  
    setIsProcessing(true);
  
    const clone = previewRef.current.cloneNode(true) as HTMLElement;
  
    const offscreen = document.createElement("div");
    offscreen.style.position = "fixed";
    offscreen.style.left = "-9999px";
    offscreen.style.top = "0";
    offscreen.style.width = "794px"; // approx A4 width
    offscreen.style.backgroundColor = "#fff"; // force light bg
    offscreen.style.color = "#000"; // force black text
    offscreen.style.opacity = "1";
    offscreen.style.filter = "none"; // reset filters
    offscreen.style.padding = "20px";
    offscreen.style.overflow = "visible";
  
    offscreen.appendChild(clone);
    document.body.appendChild(offscreen);
  
    await new Promise<void>(resolve => {
      const images = offscreen.querySelectorAll("img");
      if (images.length === 0) return resolve();
      let loaded = 0;
      images.forEach(img => {
        if (img.complete) {
          loaded++;
          if (loaded === images.length) resolve();
        } else {
          img.onload = () => {
            loaded++;
            if (loaded === images.length) resolve();
          };
          img.onerror = () => {
            loaded++;
            if (loaded === images.length) resolve();
          };
        }
      });
    });
  
    try {
      await html2pdf()
        .set({
          margin: [10, 10, 10, 10],
          filename: file ? file.name.replace(/\.(docx?|DOCX?)$/, ".pdf") : "document.pdf",
          html2canvas: {
            scale: 3,
            useCORS: true,
            logging: false,
            scrollX: 0,
            scrollY: -window.scrollY,
            windowWidth: 794,
          },
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        })
        .from(offscreen)
        .save();
    } catch (error) {
      toast({
        title: "PDF Generation Error",
        description: "Failed to generate PDF. Try simplifying the document.",
        variant: "destructive",
      });
    } finally {
      document.body.removeChild(offscreen);
      setIsProcessing(false);
    }
  };
  

  const clearAll = () => {
    setFile(null);
    setHtmlContent("");
    setIsProcessing(false);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <PageLayout title="Word to PDF Converter" description="Convert Word documents to PDF entirely client-side using open-source libraries">
      <div className="max-w-3xl mx-auto p-8 border-2 border-dashed border-border rounded-lg text-center select-none">
        <Upload className="mx-auto mb-4 w-14 h-14 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="file"
          accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          onChange={handleFileChange}
          className="mx-auto max-w-md"
          disabled={isProcessing}
        />
        {file && (
          <p className="mt-2 text-sm">
            Selected file: <strong>{file.name}</strong> ({(file.size / 1024 / 1024).toFixed(2)} MB)
          </p>
        )}

        <div className="mt-6 flex gap-4 justify-center">
          <Button onClick={convertDocxToHtml} disabled={!file || isProcessing}>
            {isProcessing ? "Processing..." : "Convert to HTML Preview"}
          </Button>
          <Button onClick={downloadPdf} disabled={!htmlContent || isProcessing}>
            Download PDF
          </Button>
          <Button variant="outline" onClick={clearAll} disabled={isProcessing}>
            Clear
          </Button>
        </div>

        {htmlContent && (
          <Card className="mt-8 p-4 overflow-auto max-h-[600px] prose max-w-full">
            <div
              ref={previewRef}
              dangerouslySetInnerHTML={{ __html: htmlContent }}
            />
          </Card>
        )}
      </div>
    </PageLayout>
  );
}
