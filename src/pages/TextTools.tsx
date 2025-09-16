import { PageLayout } from "@/components/PageLayout";
import { ToolCard } from "@/components/ToolCard";
import { 
  FileText, 
  QrCode, 
  Lock, 
  Type, 
  Hash,
  Scan
} from "lucide-react";

const textTools = [
  {
    title: "Text to PDF",
    description: "Convert plain text into PDF documents",
    icon: FileText,
    comingSoon: false
  },
  {
    title: "QR Code Generator",
    description: "Generate QR codes from text or URLs",
    icon: QrCode,
    comingSoon: false
  },
  {
    title: "QR Code Scanner",
    description: "Scan and decode QR codes from images",
    icon: Scan,
    comingSoon: false
  },
  {
    title: "Password Generator",
    description: "Generate secure passwords with custom options",
    icon: Lock,
    comingSoon: false
  },
  {
    title: "Text Case Converter",
    description: "Convert text to uppercase, lowercase, title case",
    icon: Type,
    comingSoon: false
  },
  {
    title: "Word Counter",
    description: "Count words, characters, and paragraphs",
    icon: Hash,
    comingSoon: false
  }
];

export default function TextTools() {
  return (
    <PageLayout
      title="📑 Text & Utility Tools"
      description="Essential text processing and utility tools"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {textTools.map((tool, index) => (
          <ToolCard
            key={index}
            title={tool.title}
            description={tool.description}
            icon={tool.icon}
            category="text"
            comingSoon={tool.comingSoon}
            onClick={() => tool.comingSoon ? null : console.log(`Opening ${tool.title}`)}
          />
        ))}
      </div>
    </PageLayout>
  );
}