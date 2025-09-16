import { PageLayout } from "@/components/PageLayout";
import { ToolCard } from "@/components/ToolCard";
import { 
  Music, 
  VideoIcon, 
  Scissors, 
  Minimize2, 
  Volume2,
  VolumeX,
  Download
} from "lucide-react";

const audioVideoTools = [
  {
    title: "Video to MP3",
    description: "Extract audio from video files in MP3 format",
    icon: Music,
    comingSoon: true
  },
  {
    title: "Audio Compressor",
    description: "Reduce audio file size while maintaining quality",
    icon: Minimize2,
    comingSoon: true
  },
  {
    title: "Audio Cutter",
    description: "Trim and cut audio files to desired length",
    icon: Scissors,
    comingSoon: true
  },
  {
    title: "Video Compressor",
    description: "Compress video files to reduce size",
    icon: VideoIcon,
    comingSoon: true
  },
  {
    title: "Video Resizer",
    description: "Resize and crop video dimensions",
    icon: Minimize2,
    comingSoon: true
  },
  {
    title: "Add Audio to Video",
    description: "Merge audio tracks with video files",
    icon: Volume2,
    comingSoon: true
  },
  {
    title: "Remove Audio from Video",
    description: "Extract video without audio track",
    icon: VolumeX,
    comingSoon: true
  }
];

export default function AudioVideoTools() {
  return (
    <PageLayout
      title="🎵 Audio & Video Tools"
      description="Professional audio and video editing utilities"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {audioVideoTools.map((tool, index) => (
          <ToolCard
            key={index}
            title={tool.title}
            description={tool.description}
            icon={tool.icon}
            category="audio-video"
            comingSoon={tool.comingSoon}
            onClick={() => tool.comingSoon ? null : console.log(`Opening ${tool.title}`)}
          />
        ))}
      </div>
    </PageLayout>
  );
}