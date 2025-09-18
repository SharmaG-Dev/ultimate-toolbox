import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import FileTools from "./pages/FileTools";
import ImageTools from "./pages/ImageTools";
import AudioVideoTools from "./pages/AudioVideoTools";
import TextTools from "./pages/TextTools";
import OnlineTools from "./pages/OnlineTools";
import NotFound from "./pages/NotFound";

// File Tools
import PdfToImages from "./pages/tools/PdfToImages";
import ImagesToPdf from "./pages/tools/ImagesToPdf";
import MergePdfs from "./pages/tools/MergePdfs";
import SplitPdf from "./pages/tools/SplitPdf";

// Image Tools  
import ImageFormatConverter from "./pages/tools/ImageFormatConverter";
import ImageCrop from "./pages/tools/ImageCrop";
import BackgroundRemover from "./pages/tools/BackgroundRemover";
import ColorPicker from "./pages/tools/ColorPicker";
import RotateFlip from "./pages/tools/RotateFlip";

// Text Tools
import TextToPdf from "./pages/tools/TextToPdf";
import QrGenerator from "./pages/tools/QrGenerator";
import QrScanner from "./pages/tools/QrScanner";
import PasswordGenerator from "./pages/tools/PasswordGenerator";
import TextCaseConverter from "./pages/tools/TextCaseConverter";
import WordCounter from "./pages/tools/WordCounter";

// Online Tools
import CurrencyConverter from "./pages/tools/CurrencyConverter";
import UnitConverter from "./pages/tools/UnitConverter";
import WordToPdf from "./pages/tools/WordToPdf";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/file-tools" element={<FileTools />} />
          <Route path="/image-tools" element={<ImageTools />} />
          <Route path="/audio-video" element={<AudioVideoTools />} />
          <Route path="/text-tools" element={<TextTools />} />
          <Route path="/online-tools" element={<OnlineTools />} />
          
          {/* File Tool Routes */}
          <Route path="/tools/pdf-to-images" element={<PdfToImages />} />
          <Route path="/tools/images-to-pdf" element={<ImagesToPdf />} />
          <Route path="/tools/merge-pdfs" element={<MergePdfs />} />
          <Route path="/tools/split-pdf" element={<SplitPdf />} />
          <Route path="/tools/word-to-pdf" element={<WordToPdf />} />
          
          {/* Image Tool Routes */}
          <Route path="/tools/image-format-converter" element={<ImageFormatConverter />} />
          <Route path="/tools/image-crop" element={<ImageCrop />} />
          <Route path="/tools/background-remover" element={<BackgroundRemover />} />
          <Route path="/tools/color-picker" element={<ColorPicker />} />
          <Route path="/tools/rotate-flip" element={<RotateFlip />} />
          
          {/* Text Tool Routes */}
          <Route path="/tools/text-to-pdf" element={<TextToPdf />} />
          <Route path="/tools/qr-generator" element={<QrGenerator />} />
          <Route path="/tools/qr-scanner" element={<QrScanner />} />
          <Route path="/tools/password-generator" element={<PasswordGenerator />} />
          <Route path="/tools/text-case-converter" element={<TextCaseConverter />} />
          <Route path="/tools/word-counter" element={<WordCounter />} />
          
          {/* Online Tool Routes */}
          <Route path="/tools/currency-converter" element={<CurrencyConverter />} />
          <Route path="/tools/unit-converter" element={<UnitConverter />} />
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
