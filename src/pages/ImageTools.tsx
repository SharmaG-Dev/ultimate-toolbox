import { PageLayout } from "@/components/PageLayout";
import { ToolCard } from "@/components/ToolCard";
import { 
  Image, 
  Crop, 
  Eraser, 
  Palette, 
  RotateCcw,
  RefreshCw,
  Scissors
} from "lucide-react";

const imageTools = [
  {
    title: "Image Format Converter",
    description: "Convert between JPG, PNG, WEBP, GIF formats",
    icon: Image,
    comingSoon: false
  },
  {
    title: "Image Crop Tool",
    description: "Crop images to custom dimensions or aspect ratios",
    icon: Crop,
    comingSoon: false
  },
  {
    title: "Background Remover",
    description: "AI-powered background removal from images",
    icon: Eraser,
    comingSoon: false
  },
  {
    title: "Color Picker",
    description: "Extract hex color codes from images",
    icon: Palette,
    comingSoon: false
  },
  {
    title: "Rotate & Flip",
    description: "Rotate images and flip horizontally or vertically",
    icon: RotateCcw,
    comingSoon: false
  }
];

export default function ImageTools() {
  return (
    <PageLayout
      title="🖼️ Image Tools"
      description="Professional image editing and conversion tools"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {imageTools.map((tool, index) => (
          <ToolCard
            key={index}
            title={tool.title}
            description={tool.description}
            icon={tool.icon}
            category="image"
            comingSoon={tool.comingSoon}
            onClick={() => tool.comingSoon ? null : console.log(`Opening ${tool.title}`)}
          />
        ))}
      </div>
    </PageLayout>
  );
}