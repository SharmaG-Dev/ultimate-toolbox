import { PageLayout } from "@/components/PageLayout";
import { ToolCard } from "@/components/ToolCard";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { 
  FileText, 
  Image, 
  Music, 
  Type, 
  Globe,
  Wrench,
  Zap,
  Shield,
  Smartphone
} from "lucide-react";

// Featured tools from all categories
const featuredTools = [
  {
    title: "PDF to Images",
    description: "Convert PDF pages to individual images",
    icon: FileText,
    category: 'file' as const,
    href: "/file-tools"
  },
  {
    title: "Background Remover",
    description: "AI-powered background removal",
    icon: Image,
    category: 'image' as const,
    href: "/image-tools"
  },
  {
    title: "Video to MP3",
    description: "Extract audio from video files",
    icon: Music,
    category: 'audio-video' as const,
    href: "/audio-video"
  },
  {
    title: "QR Code Generator",
    description: "Generate QR codes instantly",
    icon: Type,
    category: 'text' as const,
    href: "/text-tools"
  },
  {
    title: "Currency Converter",
    description: "Real-time currency conversion",
    icon: Globe,
    category: 'online' as const,
    href: "/online-tools"
  },
  {
    title: "Password Generator",
    description: "Generate secure passwords",
    icon: Shield,
    category: 'text' as const,
    href: "/text-tools"
  }
];

const features = [
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "All tools work instantly in your browser"
  },
  {
    icon: Shield,
    title: "Privacy First",
    description: "Your files never leave your device"
  },
  {
    icon: Smartphone,
    title: "Mobile Friendly",
    description: "Works perfectly on all devices"
  }
];

const Index = () => {
  return (
    <PageLayout>
      {/* Hero Section */}
      <div className="text-center mb-16">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-primary rounded-2xl mb-8 shadow-glow animate-float">
          <Wrench className="w-10 h-10 text-white" />
        </div>
        
        <h1 className="text-5xl md:text-7xl font-bold text-foreground mb-6 animate-slide-up">
          Ultimate <span className="bg-gradient-primary bg-clip-text text-transparent">Toolbox</span>
        </h1>
        
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8 animate-slide-up">
          All the essential tools you need in one place. Convert files, edit images, process audio, 
          and much more - all running securely in your browser.
        </p>
        
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          <Button variant="hero" size="lg" asChild>
            <Link to="/file-tools">
              <FileText className="w-5 h-5" />
              File Tools
            </Link>
          </Button>
          <Button variant="hero" size="lg" asChild>
            <Link to="/image-tools">
              <Image className="w-5 h-5" />
              Image Tools
            </Link>
          </Button>
        </div>
        
        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {features.map((feature, index) => (
            <div key={index} className="text-center">
              <div className="w-12 h-12 bg-muted rounded-xl flex items-center justify-center mx-auto mb-4">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Featured Tools */}
      <div className="mb-16">
        <h2 className="text-3xl font-bold text-foreground text-center mb-8">
          Popular Tools
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredTools.map((tool, index) => (
            <ToolCard
              key={index}
              title={tool.title}
              description={tool.description}
              icon={tool.icon}
              category={tool.category}
              onClick={() => window.location.href = tool.href}
            />
          ))}
        </div>
      </div>

      {/* Categories Section */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-foreground mb-8">
          Explore All Categories
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link to="/file-tools" className="group">
            <div className="p-6 bg-gradient-card border border-border rounded-xl hover:border-file-tools/50 transition-all duration-300 hover:shadow-card transform hover:scale-[1.02]">
              <FileText className="w-8 h-8 text-file-tools mx-auto mb-4" />
              <h3 className="font-semibold text-foreground mb-2">File Tools</h3>
              <p className="text-muted-foreground text-sm">PDF operations and document conversions</p>
            </div>
          </Link>
          
          <Link to="/image-tools" className="group">
            <div className="p-6 bg-gradient-card border border-border rounded-xl hover:border-image-tools/50 transition-all duration-300 hover:shadow-card transform hover:scale-[1.02]">
              <Image className="w-8 h-8 text-image-tools mx-auto mb-4" />
              <h3 className="font-semibold text-foreground mb-2">Image Tools</h3>
              <p className="text-muted-foreground text-sm">Professional image editing and conversion</p>
            </div>
          </Link>
          
          <Link to="/audio-video" className="group">
            <div className="p-6 bg-gradient-card border border-border rounded-xl hover:border-audio-video/50 transition-all duration-300 hover:shadow-card transform hover:scale-[1.02]">
              <Music className="w-8 h-8 text-audio-video mx-auto mb-4" />
              <h3 className="font-semibold text-foreground mb-2">Audio & Video</h3>
              <p className="text-muted-foreground text-sm">Media editing and conversion tools</p>
            </div>
          </Link>
          
          <Link to="/text-tools" className="group">
            <div className="p-6 bg-gradient-card border border-border rounded-xl hover:border-text-tools/50 transition-all duration-300 hover:shadow-card transform hover:scale-[1.02]">
              <Type className="w-8 h-8 text-text-tools mx-auto mb-4" />
              <h3 className="font-semibold text-foreground mb-2">Text Tools</h3>
              <p className="text-muted-foreground text-sm">Text processing and utility tools</p>
            </div>
          </Link>
          
          <Link to="/online-tools" className="group">
            <div className="p-6 bg-gradient-card border border-border rounded-xl hover:border-online-tools/50 transition-all duration-300 hover:shadow-card transform hover:scale-[1.02]">
              <Globe className="w-8 h-8 text-online-tools mx-auto mb-4" />
              <h3 className="font-semibold text-foreground mb-2">Online Tools</h3>
              <p className="text-muted-foreground text-sm">Everyday utilities and converters</p>
            </div>
          </Link>
        </div>
      </div>
    </PageLayout>
  );
};

export default Index;
