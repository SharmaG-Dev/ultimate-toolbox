import { PageLayout } from "@/components/PageLayout";
import { ToolCard } from "@/components/ToolCard";
import { 
  DollarSign, 
  Scale, 
  Clock, 
  StickyNote,
  Calculator
} from "lucide-react";

const onlineTools = [
  {
    title: "Currency Converter",
    description: "Convert between different currencies with live rates",
    icon: DollarSign,
    comingSoon: false
  },
  {
    title: "Unit Converter", 
    description: "Convert length, weight, temperature and more",
    icon: Scale,
    comingSoon: false
  },
  {
    title: "Timezone Converter",
    description: "Convert time between different timezones",
    icon: Clock,
    comingSoon: false
  },
  {
    title: "Online Notepad",
    description: "Quick notepad with auto-save functionality",
    icon: StickyNote,
    comingSoon: false
  },
  {
    title: "Calculator",
    description: "Advanced calculator with scientific functions",
    icon: Calculator,
    comingSoon: false
  }
];

export default function OnlineTools() {
  return (
    <PageLayout
      title="🌐 Online Tools"
      description="Everyday utilities for common tasks"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {onlineTools.map((tool, index) => (
          <ToolCard
            key={index}
            title={tool.title}
            description={tool.description}
            icon={tool.icon}
            category="online"
            comingSoon={tool.comingSoon}
            onClick={() => tool.comingSoon ? null : console.log(`Opening ${tool.title}`)}
          />
        ))}
      </div>
    </PageLayout>
  );
}