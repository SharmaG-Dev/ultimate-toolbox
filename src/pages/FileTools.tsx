import { PageLayout } from "@/components/PageLayout";
import { ToolCard } from "@/components/ToolCard";
import { 
  FileImage, 
  FilePlus2, 
  FileX2, 
  FileText, 
  Table, 
  Presentation,
  Split,
  Merge
} from "lucide-react";

const fileTools = [
  {
    title: "PDF to Images",
    description: "Convert PDF pages to individual images (JPG, PNG)",
    icon: FileImage,
    comingSoon: false
  },
  {
    title: "Images to PDF", 
    description: "Combine multiple images into a single PDF",
    icon: FilePlus2,
    comingSoon: false
  },
  {
    title: "Merge PDFs",
    description: "Combine multiple PDF files into one",
    icon: Merge,
    comingSoon: false
  },
  {
    title: "Split PDF",
    description: "Split a PDF into separate pages or sections",
    icon: Split,
    comingSoon: false
  },
  {
    title: "Word to PDF",
    description: "Convert Word documents to PDF format",
    icon: FileText,
    comingSoon: false
  },
  {
    title: "PDF to Word",
    description: "Convert PDF files to editable Word documents",
    icon: FileText,
    comingSoon: true
  },
  {
    title: "Excel to PDF",
    description: "Convert Excel spreadsheets to PDF format",
    icon: Table,
    comingSoon: true
  },
  {
    title: "PDF to Excel",
    description: "Extract data from PDF to Excel format",
    icon: Table,
    comingSoon: true
  },
  {
    title: "PowerPoint to PDF",
    description: "Convert PowerPoint presentations to PDF",
    icon: Presentation,
    comingSoon: true
  }
];

export default function FileTools() {
  return (
    <PageLayout
      title="📄 File Tools"
      description="Powerful tools for PDF operations and document conversions"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {fileTools.map((tool, index) => (
          <ToolCard
            key={index}
            title={tool.title}
            description={tool.description}
            icon={tool.icon}
            category="file"
            comingSoon={tool.comingSoon}
            onClick={() => tool.comingSoon ? null : console.log(`Opening ${tool.title}`)}
          />
        ))}
      </div>
    </PageLayout>
  );
}