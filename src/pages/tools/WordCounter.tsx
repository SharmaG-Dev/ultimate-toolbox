import { useState, useMemo } from "react";
import { PageLayout } from "@/components/PageLayout";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Hash, FileText, Clock, BookOpen } from "lucide-react";

export default function WordCounter() {
  const [text, setText] = useState("");

  const stats = useMemo(() => {
    const trimmedText = text.trim();
    
    // Character counts
    const characters = text.length;
    const charactersNoSpaces = text.replace(/\s/g, '').length;
    
    // Word count
    const words = trimmedText === '' ? 0 : trimmedText.split(/\s+/).length;
    
    // Sentence count
    const sentences = trimmedText === '' ? 0 : trimmedText.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
    
    // Paragraph count
    const paragraphs = trimmedText === '' ? 0 : trimmedText.split(/\n\s*\n/).filter(p => p.trim().length > 0).length;
    
    // Reading time (average 200 words per minute)
    const readingTimeMinutes = Math.ceil(words / 200);
    
    // Speaking time (average 150 words per minute)
    const speakingTimeMinutes = Math.ceil(words / 150);
    
    return {
      characters,
      charactersNoSpaces,
      words,
      sentences,
      paragraphs,
      readingTimeMinutes,
      speakingTimeMinutes
    };
  }, [text]);

  const statCards = [
    {
      title: "Characters",
      value: stats.characters.toLocaleString(),
      description: "Including spaces",
      icon: Hash,
      color: "text-blue-600"
    },
    {
      title: "Characters (no spaces)",
      value: stats.charactersNoSpaces.toLocaleString(),
      description: "Excluding spaces",
      icon: Hash,
      color: "text-purple-600"
    },
    {
      title: "Words",
      value: stats.words.toLocaleString(),
      description: "Total word count",
      icon: FileText,
      color: "text-green-600"
    },
    {
      title: "Sentences",
      value: stats.sentences.toLocaleString(),
      description: "Based on punctuation",
      icon: BookOpen,
      color: "text-orange-600"
    },
    {
      title: "Paragraphs",
      value: stats.paragraphs.toLocaleString(),
      description: "Separated by line breaks",
      icon: FileText,
      color: "text-red-600"
    },
    {
      title: "Reading Time",
      value: `${stats.readingTimeMinutes} min`,
      description: "Average reading speed",
      icon: Clock,
      color: "text-cyan-600"
    },
    {
      title: "Speaking Time",
      value: `${stats.speakingTimeMinutes} min`,
      description: "Average speaking speed",
      icon: Clock,
      color: "text-pink-600"
    }
  ];

  return (
    <PageLayout
      title="Word Counter"
      description="Count words, characters, and analyze your text"
    >
      <div className="max-w-4xl mx-auto">
        <div className="space-y-6">
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Hash className="w-5 h-5" />
                <h3 className="text-lg font-medium">Enter your text</h3>
              </div>
              
              <Textarea
                placeholder="Type or paste your text here to analyze..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="min-h-48 resize-y"
              />
            </div>
          </Card>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards.map((stat, index) => (
              <Card key={index} className="p-4">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg bg-muted`}>
                    <stat.icon className={`w-4 h-4 ${stat.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="font-medium text-sm">{stat.title}</p>
                    <p className="text-xs text-muted-foreground">{stat.description}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {text && (
            <Card className="p-6">
              <h3 className="text-lg font-medium mb-4">Additional Statistics</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <h4 className="font-medium">Averages</h4>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p>Average words per sentence: {stats.sentences > 0 ? (stats.words / stats.sentences).toFixed(1) : 0}</p>
                    <p>Average characters per word: {stats.words > 0 ? (stats.charactersNoSpaces / stats.words).toFixed(1) : 0}</p>
                    <p>Average sentences per paragraph: {stats.paragraphs > 0 ? (stats.sentences / stats.paragraphs).toFixed(1) : 0}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Text Density</h4>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p>Character density: {((stats.charactersNoSpaces / stats.characters) * 100).toFixed(1)}%</p>
                    <p>Word density: {stats.characters > 0 ? ((stats.words / stats.characters) * 100).toFixed(1) : 0}%</p>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {!text && (
            <Card className="p-12 text-center">
              <Hash className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">No text to analyze</h3>
              <p className="text-muted-foreground">
                Enter some text above to see detailed word count and text statistics
              </p>
            </Card>
          )}
        </div>
      </div>
    </PageLayout>
  );
}