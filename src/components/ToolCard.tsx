import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

interface ToolCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  onClick?: () => void;
  category: 'file' | 'image' | 'audio-video' | 'text' | 'online';
  comingSoon?: boolean;
}

const categoryColors = {
  'file': 'text-file-tools',
  'image': 'text-image-tools', 
  'audio-video': 'text-audio-video',
  'text': 'text-text-tools',
  'online': 'text-online-tools'
};

export const ToolCard = ({ 
  title, 
  description, 
  icon: Icon, 
  onClick, 
  category,
  comingSoon = false 
}: ToolCardProps) => {
  const navigate = useNavigate();
  
  const getToolRoute = (title: string) => {
    const routeMap: { [key: string]: string } = {
      "PDF to Images": "/tools/pdf-to-images",
      "Images to PDF": "/tools/images-to-pdf", 
      "Merge PDFs": "/tools/merge-pdfs",
      "Split PDF": "/tools/split-pdf",
      "Image Format Converter": "/tools/image-format-converter",
      "Image Crop Tool": "/tools/image-crop",
      "Background Remover": "/tools/background-remover",
      "Color Picker": "/tools/color-picker",
      "Rotate & Flip": "/tools/rotate-flip",
      "Text to PDF": "/tools/text-to-pdf",
      "QR Code Generator": "/tools/qr-generator",
      "QR Code Scanner": "/tools/qr-scanner",
      "Password Generator": "/tools/password-generator",
      "Text Case Converter": "/tools/text-case-converter",
      "Word Counter": "/tools/word-counter",
      "Currency Converter": "/tools/currency-converter",
      "Unit Converter": "/tools/unit-converter"
    };
    return routeMap[title];
  };

  const handleClick = () => {
    if (comingSoon) {
      onClick?.();
      return;
    }
    
    const route = getToolRoute(title);
    if (route) {
      navigate(route);
    } else {
      onClick?.();
    }
  };
  
  return (
    <Card className="p-6 bg-gradient-card border-border hover:border-primary/50 transition-all duration-300 hover:shadow-card group cursor-pointer transform hover:scale-[1.02]" onClick={handleClick}>
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors duration-300">
          <Icon className={cn("w-6 h-6 transition-colors duration-300", categoryColors[category], "group-hover:text-primary")} />
        </div>
        
        <div className="space-y-2">
          <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors duration-300">
            {title}
          </h3>
          <p className="text-sm text-muted-foreground">
            {description}
          </p>
        </div>
        
        <Button 
          variant="tool" 
          size="sm" 
          className="w-full"
          disabled={comingSoon}
        >
          {comingSoon ? "Coming Soon" : "Use Tool"}
        </Button>
      </div>
    </Card>
  );
};