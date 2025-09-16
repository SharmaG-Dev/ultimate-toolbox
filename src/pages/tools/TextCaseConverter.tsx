import { useState } from "react";
import { PageLayout } from "@/components/PageLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Copy, Type } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function TextCaseConverter() {
  const [inputText, setInputText] = useState("");
  const { toast } = useToast();

  const conversions = [
    {
      title: "UPPERCASE",
      description: "ALL LETTERS IN CAPS",
      convert: (text: string) => text.toUpperCase(),
    },
    {
      title: "lowercase",
      description: "all letters in small case",
      convert: (text: string) => text.toLowerCase(),
    },
    {
      title: "Title Case",
      description: "First Letter Of Each Word Capitalized",
      convert: (text: string) => 
        text.replace(/\w\S*/g, (txt) => 
          txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
        ),
    },
    {
      title: "Sentence case",
      description: "First letter of each sentence capitalized",
      convert: (text: string) => 
        text.toLowerCase().replace(/(^\w|[.!?]\s*\w)/g, (c) => c.toUpperCase()),
    },
    {
      title: "aLtErNaTiNg CaSe",
      description: "Alternating upper and lower case",
      convert: (text: string) => 
        text.split('').map((char, index) => 
          index % 2 === 0 ? char.toLowerCase() : char.toUpperCase()
        ).join(''),
    },
    {
      title: "InVeRsE CaSe",
      description: "Opposite case for each letter",
      convert: (text: string) => 
        text.split('').map(char => 
          char === char.toUpperCase() ? char.toLowerCase() : char.toUpperCase()
        ).join(''),
    },
  ];

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Text Copied",
      description: "Converted text copied to clipboard"
    });
  };

  const wordCount = inputText.trim().split(/\s+/).filter(word => word.length > 0).length;
  const charCount = inputText.length;

  return (
    <PageLayout
      title="Text Case Converter"
      description="Convert text to uppercase, lowercase, title case and more"
    >
      <div className="max-w-4xl mx-auto">
        <div className="space-y-6">
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Type className="w-5 h-5" />
                <h3 className="text-lg font-medium">Enter your text</h3>
              </div>
              
              <Textarea
                placeholder="Type or paste your text here..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="min-h-32 resize-y"
              />
              
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Words: {wordCount}</span>
                <span>Characters: {charCount}</span>
              </div>
            </div>
          </Card>

          {inputText && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {conversions.map((conversion, index) => (
                <Card key={index} className="p-4">
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium">{conversion.title}</h4>
                      <p className="text-xs text-muted-foreground">{conversion.description}</p>
                    </div>
                    
                    <div className="relative">
                      <Textarea
                        value={conversion.convert(inputText)}
                        readOnly
                        className="min-h-24 resize-none pr-10"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => copyToClipboard(conversion.convert(inputText))}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {!inputText && (
            <Card className="p-12 text-center">
              <Type className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">No text to convert</h3>
              <p className="text-muted-foreground">
                Enter some text above to see all the different case conversion options
              </p>
            </Card>
          )}
        </div>
      </div>
    </PageLayout>
  );
}