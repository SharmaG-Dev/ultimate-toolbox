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
import { useNavigate } from "react-router-dom";

const fileTools = [
  {
    title: "PDF to Images",
    description: "Convert PDF pages to individual images (JPG, PNG)",
    icon: FileImage,
    path: "/tools/pdf-to-images",
    comingSoon: false
  },
  {
    title: "Images to PDF", 
    description: "Combine multiple images into a single PDF",
    icon: FilePlus2,
    path: "/tools/images-to-pdf",
    comingSoon: false
  },
  {
    title: "Merge PDFs",
    description: "Combine multiple PDF files into one",
    icon: Merge,
    path: "/tools/merge-pdfs",
    comingSoon: false
  },
  {
    title: "Split PDF",
    description: "Split a PDF into separate pages or sections",
    icon: Split,
    path: "/tools/split-pdf",
    comingSoon: false
  },
  {
    title: "Word to PDF",
    description: "Convert Word documents to PDF format",
    icon: FileText,
    path: "/tools/word-to-pdf",
    comingSoon: false
  },
  {
    title: "PDF to Word",
    description: "Convert PDF files to editable Word documents",
    icon: FileText,
    path: "/tools/pdf-to-word",
    comingSoon: false
  },
  {
    title: "Excel to PDF",
    description: "Convert Excel spreadsheets to PDF format",
    icon: Table,
    path: "/tools/excel-to-pdf",
    comingSoon: false
  },
  {
    title: "PDF to Excel",
    description: "Extract data from PDF to Excel format",
    icon: Table,
    path: "/tools/pdf-to-excel",
    comingSoon: false
  },
  {
    title: "PowerPoint to PDF",
    description: "Convert PowerPoint presentations to PDF",
    icon: Presentation,
    path: "/tools/powerpoint-to-pdf",
    comingSoon: false
  }
];

export default function FileTools() {
  const navigate = useNavigate();

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
            onClick={() => !tool.comingSoon && tool.path && navigate(tool.path)}
          />
        ))}
      </div>
    </PageLayout>
  );
}