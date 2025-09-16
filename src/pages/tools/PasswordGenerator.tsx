import { useState } from "react";
import { PageLayout } from "@/components/PageLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Copy, RefreshCw, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function PasswordGenerator() {
  const [password, setPassword] = useState("");
  const [length, setLength] = useState([16]);
  const [includeUppercase, setIncludeUppercase] = useState(true);
  const [includeLowercase, setIncludeLowercase] = useState(true);
  const [includeNumbers, setIncludeNumbers] = useState(true);
  const [includeSymbols, setIncludeSymbols] = useState(true);
  const [excludeSimilar, setExcludeSimilar] = useState(false);
  const { toast } = useToast();

  const generatePassword = () => {
    let charset = "";
    if (includeUppercase) charset += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    if (includeLowercase) charset += "abcdefghijklmnopqrstuvwxyz";
    if (includeNumbers) charset += "0123456789";
    if (includeSymbols) charset += "!@#$%^&*()_+-=[]{}|;:,.<>?";
    
    if (excludeSimilar) {
      charset = charset.replace(/[0O1lI]/g, "");
    }

    if (!charset) {
      toast({
        title: "Invalid settings",
        description: "Please select at least one character type",
        variant: "destructive"
      });
      return;
    }

    let newPassword = "";
    for (let i = 0; i < length[0]; i++) {
      newPassword += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    
    setPassword(newPassword);
    toast({
      title: "Password Generated",
      description: "New secure password created"
    });
  };

  const copyToClipboard = () => {
    if (!password) return;
    navigator.clipboard.writeText(password);
    toast({
      title: "Password Copied",
      description: "Password copied to clipboard"
    });
  };

  const getPasswordStrength = () => {
    if (!password) return { score: 0, label: "No password", color: "text-muted-foreground" };
    
    let score = 0;
    if (password.length >= 12) score += 2;
    else if (password.length >= 8) score += 1;
    
    if (/[a-z]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 2;
    
    if (score <= 2) return { score, label: "Weak", color: "text-red-500" };
    if (score <= 4) return { score, label: "Medium", color: "text-yellow-500" };
    if (score <= 6) return { score, label: "Strong", color: "text-green-500" };
    return { score, label: "Very Strong", color: "text-green-600" };
  };

  const strength = getPasswordStrength();

  return (
    <PageLayout
      title="Password Generator"
      description="Generate secure passwords with custom options"
    >
      <div className="max-w-2xl mx-auto">
        <Card className="p-8">
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                <Label className="text-base font-medium">Generated Password</Label>
              </div>
              
              <div className="flex gap-2">
                <Input
                  value={password}
                  readOnly
                  placeholder="Click 'Generate Password' to create a secure password"
                  className="font-mono"
                />
                <Button 
                  variant="outline" 
                  onClick={copyToClipboard}
                  disabled={!password}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>

              {password && (
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">Strength:</span>
                    <span className={`text-sm font-medium ${strength.color}`}>
                      {strength.label}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    {[...Array(6)].map((_, i) => (
                      <div
                        key={i}
                        className={`w-3 h-2 rounded-sm ${
                          i < strength.score 
                            ? strength.score <= 2 ? 'bg-red-500' 
                              : strength.score <= 4 ? 'bg-yellow-500' 
                              : 'bg-green-500'
                            : 'bg-muted-foreground/20'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Password Length: {length[0]}</Label>
                <Slider
                  value={length}
                  onValueChange={setLength}
                  max={50}
                  min={4}
                  step={1}
                  className="w-full"
                />
              </div>

              <div className="space-y-3">
                <Label className="text-base font-medium">Character Types</Label>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="uppercase" 
                    checked={includeUppercase}
                    onCheckedChange={(checked) => setIncludeUppercase(checked as boolean)}
                  />
                  <Label htmlFor="uppercase">Uppercase letters (A-Z)</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="lowercase" 
                    checked={includeLowercase}
                    onCheckedChange={(checked) => setIncludeLowercase(checked as boolean)}
                  />
                  <Label htmlFor="lowercase">Lowercase letters (a-z)</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="numbers" 
                    checked={includeNumbers}
                    onCheckedChange={(checked) => setIncludeNumbers(checked as boolean)}
                  />
                  <Label htmlFor="numbers">Numbers (0-9)</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="symbols" 
                    checked={includeSymbols}
                    onCheckedChange={(checked) => setIncludeSymbols(checked as boolean)}
                  />
                  <Label htmlFor="symbols">Symbols (!@#$%^&*)</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="exclude-similar" 
                    checked={excludeSimilar}
                    onCheckedChange={(checked) => setExcludeSimilar(checked as boolean)}
                  />
                  <Label htmlFor="exclude-similar">Exclude similar characters (0, O, 1, l, I)</Label>
                </div>
              </div>
            </div>

            <Button onClick={generatePassword} className="w-full">
              <RefreshCw className="w-4 h-4 mr-2" />
              Generate Password
            </Button>
          </div>
        </Card>
      </div>
    </PageLayout>
  );
}