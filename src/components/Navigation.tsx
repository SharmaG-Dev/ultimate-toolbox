import { Link, useLocation } from "react-router-dom";
import { 
  FileText, 
  Image, 
  Music, 
  Type, 
  Globe,
  Wrench
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigationItems = [
  {
    name: "All Tools",
    href: "/",
    icon: Wrench,
    color: "text-foreground"
  },
  {
    name: "File Tools", 
    href: "/file-tools",
    icon: FileText,
    color: "text-file-tools"
  },
  {
    name: "Image Tools",
    href: "/image-tools", 
    icon: Image,
    color: "text-image-tools"
  },
  {
    name: "Audio/Video",
    href: "/audio-video",
    icon: Music,
    color: "text-audio-video"
  },
  {
    name: "Text Tools",
    href: "/text-tools",
    icon: Type,
    color: "text-text-tools"
  },
  {
    name: "Online Tools",
    href: "/online-tools",
    icon: Globe,
    color: "text-online-tools"
  }
];

export const Navigation = () => {
  const location = useLocation();

  return (
    <nav className="bg-card border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                <Wrench className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-foreground">Toolbox</span>
            </Link>
            
            <div className="hidden md:flex space-x-1">
              {navigationItems.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={cn(
                      "flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                      isActive 
                        ? "bg-primary text-primary-foreground shadow-primary" 
                        : "text-muted-foreground hover:text-foreground hover:bg-accent"
                    )}
                  >
                    <item.icon className={cn("w-4 h-4", isActive ? "text-primary-foreground" : item.color)} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};