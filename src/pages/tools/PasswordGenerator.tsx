import { useState, useCallback, useEffect } from "react";
import { PageLayout } from "@/components/PageLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Copy, RefreshCw, Shield, Settings, Download, History, 
  Eye, EyeOff, Zap, Clock, Lock, Save, Trash2, AlertTriangle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import React from "react";

// Error Boundary Component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Password Generator Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex items-center justify-center p-8 bg-red-50 border border-red-200 rounded-lg">
          <div className="text-center">
            <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
            <p className="text-red-700 font-medium">Something went wrong</p>
            <p className="text-red-600 text-sm mt-1">Please refresh the page</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-3"
              onClick={() => this.setState({ hasError: false })}
            >
              Try Again
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Safe Tab Wrapper
const SafeTabContent: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ErrorBoundary>
    {children}
  </ErrorBoundary>
);

interface PasswordHistory {
  id: string;
  password: string;
  timestamp: Date;
  strength: string;
}

interface CustomPreset {
  id: string;
  name: string;
  settings: {
    length: number;
    includeUppercase: boolean;
    includeLowercase: boolean;
    includeNumbers: boolean;
    includeSymbols: boolean;
    excludeSimilar: boolean;
    excludeAmbiguous: boolean;
    noSequential: boolean;
    noRepeating: boolean;
    mustIncludeEach: boolean;
    customCharset: string;
    excludeCustom: string;
  };
}

export default function AdvancedPasswordGenerator() {
  // Basic settings
  const [password, setPassword] = useState("");
  const [length, setLength] = useState([16]);
  const [includeUppercase, setIncludeUppercase] = useState(true);
  const [includeLowercase, setIncludeLowercase] = useState(true);
  const [includeNumbers, setIncludeNumbers] = useState(true);
  const [includeSymbols, setIncludeSymbols] = useState(true);
  
  // Advanced settings
  const [excludeSimilar, setExcludeSimilar] = useState(false);
  const [excludeAmbiguous, setExcludeAmbiguous] = useState(false);
  const [noSequential, setNoSequential] = useState(false);
  const [noRepeating, setNoRepeating] = useState(false);
  const [mustIncludeEach, setMustIncludeEach] = useState(false);
  const [customCharset, setCustomCharset] = useState("");
  const [excludeCustom, setExcludeCustom] = useState("");
  
  // Passphrase settings
  const [passphraseLength, setPassphraseLength] = useState([4]);
  const [separator, setSeparator] = useState("-");
  const [capitalizeWords, setCapitalizeWords] = useState(false);
  const [includeNumbers2, setIncludeNumbers2] = useState(false);
  
  // Bulk generation
  const [bulkCount, setBulkCount] = useState([5]);
  const [bulkPasswords, setBulkPasswords] = useState<string[]>([]);
  
  // History and presets
  const [passwordHistory, setPasswordHistory] = useState<PasswordHistory[]>([]);
  const [customPresets, setCustomPresets] = useState<CustomPreset[]>([]);
  const [presetName, setPresetName] = useState("");
  
  // UI states
  const [showPassword, setShowPassword] = useState(true);
  const [advancedMode, setAdvancedMode] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const { toast } = useToast();

  // Passphrase word list
  const wordList = [
    "apple", "bridge", "castle", "dragon", "elephant", "forest", "guitar", "house",
    "island", "jungle", "kitchen", "lion", "mountain", "ocean", "piano", "queen",
    "rainbow", "sunset", "tiger", "umbrella", "village", "window", "xenon", "yellow", 
    "zebra", "anchor", "bottle", "cloud", "diamond", "eagle", "flower", "golden",
    "harbor", "internet", "jazz", "keyboard", "laptop", "magic", "nature", "orange",
    "purple", "quartz", "river", "silver", "thunder", "unique", "violet", "wisdom"
  ];

  const safeGetRandomChar = (charSet: string, excludeSim: boolean, excludeAmb: boolean): string => {
    try {
      let chars = charSet;
      if (excludeSim) chars = chars.replace(/[0O1lI]/g, "");
      if (excludeAmb) chars = chars.replace(/[{}[\]()\/\\'"~,;.<>]/g, "");
      if (chars.length === 0) return charSet.charAt(0) || 'a';
      return chars.charAt(Math.floor(Math.random() * chars.length));
    } catch (error) {
      console.error('Error getting random character:', error);
      return 'a';
    }
  };

  const generatePassword = useCallback(async () => {
    if (isGenerating) return;
    
    try {
      setIsGenerating(true);
      
      let charset = "";
      
      if (includeUppercase) charset += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
      if (includeLowercase) charset += "abcdefghijklmnopqrstuvwxyz";
      if (includeNumbers) charset += "0123456789";
      if (includeSymbols) charset += "!@#$%^&*()_+-=[]{}|;:,.<>?~`";
      
      // Add custom characters safely
      if (customCharset) {
        const sanitizedCustom = customCharset.replace(/[^\x20-\x7E]/g, '');
        charset += sanitizedCustom;
      }
      
      // Exclude similar characters
      if (excludeSimilar) {
        charset = charset.replace(/[0O1lI]/g, "");
      }
      
      // Exclude ambiguous characters
      if (excludeAmbiguous) {
        charset = charset.replace(/[{}[\]()\/\\'"~,;.<>]/g, "");
      }
      
      // Remove custom excluded characters safely
      if (excludeCustom) {
        try {
          for (const char of excludeCustom) {
            const escapedChar = char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            charset = charset.replace(new RegExp(escapedChar, 'g'), '');
          }
        } catch (regexError) {
          console.warn('Regex error in exclude custom:', regexError);
        }
      }

      if (!charset || charset.length === 0) {
        throw new Error("No valid characters available for password generation");
      }

      let newPassword = "";
      const passwordLength = Math.max(4, Math.min(128, length[0]));
      
      // Ensure at least one character from each selected type if mustIncludeEach is true
      if (mustIncludeEach) {
        if (includeUppercase && "ABCDEFGHIJKLMNOPQRSTUVWXYZ".length > 0) {
          newPassword += safeGetRandomChar("ABCDEFGHIJKLMNOPQRSTUVWXYZ", excludeSimilar, excludeAmbiguous);
        }
        if (includeLowercase && "abcdefghijklmnopqrstuvwxyz".length > 0) {
          newPassword += safeGetRandomChar("abcdefghijklmnopqrstuvwxyz", excludeSimilar, excludeAmbiguous);
        }
        if (includeNumbers && "0123456789".length > 0) {
          newPassword += safeGetRandomChar("0123456789", excludeSimilar, excludeAmbiguous);
        }
        if (includeSymbols && "!@#$%^&*()_+-=[]{}|;:,.<>?~`".length > 0) {
          newPassword += safeGetRandomChar("!@#$%^&*()_+-=[]{}|;:,.<>?~`", excludeSimilar, excludeAmbiguous);
        }
      }

      // Fill the rest randomly with safety checks
      let attempts = 0;
      const maxAttempts = passwordLength * 10;
      
      for (let i = newPassword.length; i < passwordLength && attempts < maxAttempts; i++) {
        let char;
        let charAttempts = 0;
        const maxCharAttempts = 50;
        
        do {
          char = charset.charAt(Math.floor(Math.random() * charset.length));
          charAttempts++;
          
          if (charAttempts > maxCharAttempts) {
            char = charset.charAt(0);
            break;
          }
        } while (
          (noRepeating && newPassword.includes(char)) ||
          (noSequential && i > 0 && Math.abs(char.charCodeAt(0) - newPassword.charCodeAt(i-1)) === 1)
        );
        
        newPassword += char;
        attempts++;
      }
      
      // Shuffle the password if mustIncludeEach was used
      if (mustIncludeEach && newPassword.length > 1) {
        try {
          newPassword = newPassword.split('').sort(() => Math.random() - 0.5).join('');
        } catch (shuffleError) {
          console.warn('Shuffle error:', shuffleError);
        }
      }
      
      setPassword(newPassword);
      addToHistory(newPassword);
      
      toast({
        title: "Password Generated",
        description: "New secure password created successfully"
      });
      
    } catch (error) {
      console.error('Password generation error:', error);
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate password",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  }, [
    length, includeUppercase, includeLowercase, includeNumbers, includeSymbols, 
    excludeSimilar, excludeAmbiguous, noSequential, noRepeating, mustIncludeEach,
    customCharset, excludeCustom, isGenerating, toast
  ]);

  const generatePassphrase = useCallback(async () => {
    if (isGenerating) return;
    
    try {
      setIsGenerating(true);
      
      const numWords = Math.max(2, Math.min(8, passphraseLength[0]));
      const selectedWords = [];
      
      for (let i = 0; i < numWords; i++) {
        let word = wordList[Math.floor(Math.random() * wordList.length)];
        
        if (capitalizeWords) {
          word = word.charAt(0).toUpperCase() + word.slice(1);
        }
        
        if (includeNumbers2) {
          word += Math.floor(Math.random() * 100);
        }
        
        selectedWords.push(word);
      }
      
      const passphrase = selectedWords.join(separator || '-');
      setPassword(passphrase);
      addToHistory(passphrase);
      
      toast({
        title: "Passphrase Generated",
        description: "New secure passphrase created successfully"
      });
      
    } catch (error) {
      console.error('Passphrase generation error:', error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate passphrase",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  }, [passphraseLength, separator, capitalizeWords, includeNumbers2, isGenerating, toast]);

  const generateBulkPasswords = useCallback(async () => {
    if (isGenerating) return;
    
    try {
      setIsGenerating(true);
      
      const passwords = [];
      const count = Math.max(1, Math.min(50, bulkCount[0]));
      
      for (let i = 0; i < count; i++) {
        let charset = "";
        if (includeUppercase) charset += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        if (includeLowercase) charset += "abcdefghijklmnopqrstuvwxyz";
        if (includeNumbers) charset += "0123456789";
        if (includeSymbols) charset += "!@#$%^&*()_+-=[]{}|;:,.<>?~`";
        
        if (excludeSimilar) charset = charset.replace(/[0O1lI]/g, "");
        if (excludeAmbiguous) charset = charset.replace(/[{}[\]()\/\\'"~,;.<>]/g, "");
        
        if (!charset) {
          charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        }
        
        let pwd = "";
        const pwdLength = Math.max(4, Math.min(128, length[0]));
        
        for (let j = 0; j < pwdLength; j++) {
          pwd += charset.charAt(Math.floor(Math.random() * charset.length));
        }
        
        passwords.push(pwd);
      }
      
      setBulkPasswords(passwords);
      
      toast({
        title: "Bulk Passwords Generated",
        description: `Generated ${count} passwords successfully`
      });
      
    } catch (error) {
      console.error('Bulk generation error:', error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate bulk passwords",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  }, [bulkCount, length, includeUppercase, includeLowercase, includeNumbers, includeSymbols, excludeSimilar, excludeAmbiguous, isGenerating, toast]);

  const addToHistory = useCallback((pwd: string) => {
    try {
      const strength = getPasswordStrength(pwd);
      const historyItem: PasswordHistory = {
        id: `${Date.now()}-${Math.random()}`,
        password: pwd,
        timestamp: new Date(),
        strength: strength.label
      };
      
      setPasswordHistory(prev => {
        const newHistory = [historyItem, ...prev.slice(0, 9)];
        return newHistory;
      });
    } catch (error) {
      console.error('Error adding to history:', error);
    }
  }, []);

  const copyToClipboard = async (text: string) => {
    if (!text) return;
    
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied Successfully",
        description: "Password copied to clipboard"
      });
    } catch (error) {
      console.error('Copy error:', error);
      
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      
      try {
        document.execCommand('copy');
        toast({
          title: "Copied Successfully",
          description: "Password copied to clipboard"
        });
      } catch (fallbackError) {
        toast({
          title: "Copy Failed",
          description: "Could not copy to clipboard",
          variant: "destructive"
        });
      }
      
      document.body.removeChild(textArea);
    }
  };

  const exportPasswords = () => {
    try {
      if (bulkPasswords.length === 0) {
        toast({
          title: "No Passwords",
          description: "Generate passwords first",
          variant: "destructive"
        });
        return;
      }
      
      const data = bulkPasswords.join('\n');
      const blob = new Blob([data], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `passwords-${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Export Successful",
        description: "Passwords exported to file"
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: "Could not export passwords",
        variant: "destructive"
      });
    }
  };

  const savePreset = () => {
    try {
      if (!presetName.trim()) {
        toast({
          title: "Preset Name Required",
          description: "Please enter a name for your preset",
          variant: "destructive"
        });
        return;
      }

      const preset: CustomPreset = {
        id: `${Date.now()}-${Math.random()}`,
        name: presetName.trim(),
        settings: {
          length: length[0],
          includeUppercase,
          includeLowercase,
          includeNumbers,
          includeSymbols,
          excludeSimilar,
          excludeAmbiguous,
          noSequential,
          noRepeating,
          mustIncludeEach,
          customCharset,
          excludeCustom
        }
      };

      setCustomPresets(prev => [...prev, preset]);
      setPresetName("");
      
      toast({
        title: "Preset Saved",
        description: `Preset "${preset.name}" saved successfully`
      });
    } catch (error) {
      console.error('Save preset error:', error);
      toast({
        title: "Save Failed",
        description: "Could not save preset",
        variant: "destructive"
      });
    }
  };

  const loadPreset = (preset: CustomPreset) => {
    try {
      const settings = preset.settings;
      setLength([settings.length]);
      setIncludeUppercase(settings.includeUppercase);
      setIncludeLowercase(settings.includeLowercase);
      setIncludeNumbers(settings.includeNumbers);
      setIncludeSymbols(settings.includeSymbols);
      setExcludeSimilar(settings.excludeSimilar);
      setExcludeAmbiguous(settings.excludeAmbiguous);
      setNoSequential(settings.noSequential);
      setNoRepeating(settings.noRepeating);
      setMustIncludeEach(settings.mustIncludeEach);
      setCustomCharset(settings.customCharset);
      setExcludeCustom(settings.excludeCustom);
      
      toast({
        title: "Preset Loaded",
        description: `Settings from "${preset.name}" applied successfully`
      });
    } catch (error) {
      console.error('Load preset error:', error);
      toast({
        title: "Load Failed",
        description: "Could not load preset",
        variant: "destructive"
      });
    }
  };

  const deletePreset = (id: string) => {
    try {
      setCustomPresets(prev => prev.filter(p => p.id !== id));
      toast({
        title: "Preset Deleted",
        description: "Preset removed successfully"
      });
    } catch (error) {
      console.error('Delete preset error:', error);
      toast({
        title: "Delete Failed",
        description: "Could not delete preset",
        variant: "destructive"
      });
    }
  };

  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { score: 0, label: "No password", color: "text-muted-foreground" };
    
    try {
      let score = 0;
      
      // Length scoring
      if (pwd.length >= 16) score += 3;
      else if (pwd.length >= 12) score += 2;
      else if (pwd.length >= 8) score += 1;
      
      // Character type scoring
      if (/[a-z]/.test(pwd)) score += 1;
      if (/[A-Z]/.test(pwd)) score += 1;
      if (/[0-9]/.test(pwd)) score += 1;
      if (/[^A-Za-z0-9]/.test(pwd)) score += 2;
      
      // Bonus scoring
      if (pwd.length > 20) score += 1;
      
      // Unique character bonus
      const uniqueChars = new Set(pwd).size;
      if (uniqueChars > pwd.length * 0.7) score += 1;
      
      // Return strength assessment
      if (score <= 3) return { score, label: "Weak", color: "text-red-500" };
      if (score <= 5) return { score, label: "Fair", color: "text-orange-500" };
      if (score <= 7) return { score, label: "Good", color: "text-yellow-500" };
      if (score <= 9) return { score, label: "Strong", color: "text-green-500" };
      return { score, label: "Very Strong", color: "text-green-600" };
      
    } catch (error) {
      console.error('Password strength calculation error:', error);
      return { score: 0, label: "Unknown", color: "text-muted-foreground" };
    }
  };

  const strength = getPasswordStrength(password);

  // Safe initialization
  useEffect(() => {
    const initializeGenerator = async () => {
      try {
        await generatePassword();
      } catch (error) {
        console.error('Initialization error:', error);
        setPassword("TempPassword123!");
      }
    };
    
    initializeGenerator();
  }, []); // Empty dependency array for initial load only

  return (
    <ErrorBoundary>
      <PageLayout
        title="Advanced Password Generator"
        description="Generate ultra-secure passwords with advanced customization options"
      >
        <div className="max-w-6xl mx-auto space-y-6">
          <Tabs defaultValue="password" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="password">Password</TabsTrigger>
              <TabsTrigger value="passphrase">Passphrase</TabsTrigger>
              <TabsTrigger value="bulk">Bulk Generate</TabsTrigger>
              <TabsTrigger value="history">History & Presets</TabsTrigger>
            </TabsList>

            <TabsContent value="password">
              <SafeTabContent>
                <Card className="p-6">
                  <div className="space-y-6">
                    {/* Password Display */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-lg font-semibold flex items-center gap-2">
                          <Shield className="w-5 h-5" />
                          Generated Password
                        </Label>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                      </div>
                      
                      <div className="flex gap-2">
                        <Input
                          value={showPassword ? password : "••••••••••••••••"}
                          readOnly
                          placeholder="Click 'Generate Password' to create a secure password"
                          className="font-mono text-lg"
                        />
                        <Button 
                          variant="outline" 
                          onClick={() => copyToClipboard(password)} 
                          disabled={!password}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>

                      {password && (
                        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <span className="text-sm">Strength:</span>
                              <Badge variant="outline" className={strength.color}>
                                {strength.label}
                              </Badge>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Length: {password.length} | Entropy: ~{Math.log2(Math.pow(95, password.length)).toFixed(1)} bits
                            </div>
                          </div>
                          <div className="flex gap-1">
                            {[...Array(10)].map((_, i) => (
                              <div
                                key={i}
                                className={`w-2 h-4 rounded-sm ${
                                  i < Math.min(strength.score, 10)
                                    ? strength.score <= 3 ? 'bg-red-500'
                                      : strength.score <= 5 ? 'bg-orange-500'
                                      : strength.score <= 7 ? 'bg-yellow-500'
                                      : 'bg-green-500'
                                    : 'bg-muted-foreground/20'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Settings */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-base font-medium">Settings</Label>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setAdvancedMode(!advancedMode)}
                        >
                          <Settings className="w-4 h-4 mr-2" />
                          {advancedMode ? "Basic" : "Advanced"}
                        </Button>
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Password Length: {length[0]}</Label>
                          <Slider
                            value={length}
                            onValueChange={setLength}
                            max={128}
                            min={4}
                            step={1}
                            className="w-full"
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-3">
                            <Label className="text-sm font-medium">Character Types</Label>
                            
                            <div className="space-y-2">
                              <div className="flex items-center space-x-2">
                                <Checkbox 
                                  id="uppercase" 
                                  checked={includeUppercase}
                                  onCheckedChange={(checked) => setIncludeUppercase(checked as boolean)}
                                />
                                <Label htmlFor="uppercase" className="text-sm">Uppercase (A-Z)</Label>
                              </div>

                              <div className="flex items-center space-x-2">
                                <Checkbox 
                                  id="lowercase" 
                                  checked={includeLowercase}
                                  onCheckedChange={(checked) => setIncludeLowercase(checked as boolean)}
                                />
                                <Label htmlFor="lowercase" className="text-sm">Lowercase (a-z)</Label>
                              </div>

                              <div className="flex items-center space-x-2">
                                <Checkbox 
                                  id="numbers" 
                                  checked={includeNumbers}
                                  onCheckedChange={(checked) => setIncludeNumbers(checked as boolean)}
                                />
                                <Label htmlFor="numbers" className="text-sm">Numbers (0-9)</Label>
                              </div>

                              <div className="flex items-center space-x-2">
                                <Checkbox 
                                  id="symbols" 
                                  checked={includeSymbols}
                                  onCheckedChange={(checked) => setIncludeSymbols(checked as boolean)}
                                />
                                <Label htmlFor="symbols" className="text-sm">Symbols (!@#$%^&*)</Label>
                              </div>
                            </div>
                          </div>

                          {advancedMode && (
                            <div className="space-y-3">
                              <Label className="text-sm font-medium">Advanced Options</Label>
                              
                              <div className="space-y-2">
                                <div className="flex items-center space-x-2">
                                  <Checkbox 
                                    id="exclude-similar" 
                                    checked={excludeSimilar}
                                    onCheckedChange={(checked) => setExcludeSimilar(checked as boolean)}
                                  />
                                  <Label htmlFor="exclude-similar" className="text-sm">Exclude similar (0, O, 1, l, I)</Label>
                                </div>

                                <div className="flex items-center space-x-2">
                                  <Checkbox 
                                    id="exclude-ambiguous" 
                                    checked={excludeAmbiguous}
                                    onCheckedChange={(checked) => setExcludeAmbiguous(checked as boolean)}
                                  />
                                  <Label htmlFor="exclude-ambiguous" className="text-sm">Exclude ambiguous ({}, [], (), etc.)</Label>
                                </div>

                                <div className="flex items-center space-x-2">
                                  <Checkbox 
                                    id="no-sequential" 
                                    checked={noSequential}
                                    onCheckedChange={(checked) => setNoSequential(checked as boolean)}
                                  />
                                  <Label htmlFor="no-sequential" className="text-sm">No sequential characters</Label>
                                </div>

                                <div className="flex items-center space-x-2">
                                  <Checkbox 
                                    id="no-repeating" 
                                    checked={noRepeating}
                                    onCheckedChange={(checked) => setNoRepeating(checked as boolean)}
                                  />
                                  <Label htmlFor="no-repeating" className="text-sm">No repeating characters</Label>
                                </div>

                                <div className="flex items-center space-x-2">
                                  <Checkbox 
                                    id="must-include-each" 
                                    checked={mustIncludeEach}
                                    onCheckedChange={(checked) => setMustIncludeEach(checked as boolean)}
                                  />
                                  <Label htmlFor="must-include-each" className="text-sm">Include each type at least once</Label>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {advancedMode && (
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="custom-charset" className="text-sm">Custom Characters to Include</Label>
                                <Input
                                  id="custom-charset"
                                  value={customCharset}
                                  onChange={(e) => setCustomCharset(e.target.value)}
                                  placeholder="e.g., äöü"
                                  className="font-mono"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="exclude-custom" className="text-sm">Custom Characters to Exclude</Label>
                                <Input
                                  id="exclude-custom"
                                  value={excludeCustom}
                                  onChange={(e) => setExcludeCustom(e.target.value)}
                                  placeholder="e.g., @#$"
                                  className="font-mono"
                                />
                              </div>
                            </div>

                            <div className="flex gap-2">
                              <Input
                                placeholder="Preset name"
                                value={presetName}
                                onChange={(e) => setPresetName(e.target.value)}
                              />
                              <Button variant="outline" onClick={savePreset}>
                                <Save className="w-4 h-4 mr-2" />
                                Save Preset
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>

                      <Button 
                        onClick={generatePassword} 
                        className="w-full" 
                        size="lg"
                        disabled={isGenerating}
                      >
                        <RefreshCw className={`w-4 h-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
                        {isGenerating ? 'Generating...' : 'Generate New Password'}
                      </Button>
                    </div>
                  </div>
                </Card>
              </SafeTabContent>
            </TabsContent>

            <TabsContent value="passphrase">
              <SafeTabContent>
                <Card className="p-6">
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <Label className="text-lg font-semibold flex items-center gap-2">
                        <Zap className="w-5 h-5" />
                        Passphrase Settings
                      </Label>

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Number of Words: {passphraseLength[0]}</Label>
                          <Slider
                            value={passphraseLength}
                            onValueChange={setPassphraseLength}
                            max={8}
                            min={2}
                            step={1}
                            className="w-full"
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="separator">Word Separator</Label>
                            <Select value={separator} onValueChange={setSeparator}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="-">Hyphen (-)</SelectItem>
                                <SelectItem value="_">Underscore (_)</SelectItem>
                                <SelectItem value=".">Period (.)</SelectItem>
                                <SelectItem value=" ">Space</SelectItem>
                                <SelectItem value="">No separator</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id="capitalize-words" 
                              checked={capitalizeWords}
                              onCheckedChange={(checked) => setCapitalizeWords(checked as boolean)}
                            />
                            <Label htmlFor="capitalize-words">Capitalize first letter of each word</Label>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id="include-numbers-passphrase" 
                              checked={includeNumbers2}
                              onCheckedChange={(checked) => setIncludeNumbers2(checked as boolean)}
                            />
                            <Label htmlFor="include-numbers-passphrase">Add numbers to words</Label>
                          </div>
                        </div>
                      </div>

                      <Button 
                        onClick={generatePassphrase} 
                        className="w-full" 
                        size="lg"
                        disabled={isGenerating}
                      >
                        <Zap className={`w-4 h-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
                        {isGenerating ? 'Generating...' : 'Generate Passphrase'}
                      </Button>
                    </div>
                  </div>
                </Card>
              </SafeTabContent>
            </TabsContent>

            <TabsContent value="bulk">
              <SafeTabContent>
                <Card className="p-6">
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <Label className="text-lg font-semibold">Bulk Password Generation</Label>

                      <div className="space-y-2">
                        <Label>Number of Passwords: {bulkCount[0]}</Label>
                        <Slider
                          value={bulkCount}
                          onValueChange={setBulkCount}
                          max={50}
                          min={1}
                          step={1}
                          className="w-full"
                        />
                      </div>

                      <div className="flex gap-2">
                        <Button 
                          onClick={generateBulkPasswords} 
                          className="flex-1"
                          disabled={isGenerating}
                        >
                          <RefreshCw className={`w-4 h-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
                          {isGenerating ? 'Generating...' : `Generate ${bulkCount[0]} Passwords`}
                        </Button>
                        {bulkPasswords.length > 0 && (
                          <Button variant="outline" onClick={exportPasswords}>
                            <Download className="w-4 h-4 mr-2" />
                            Export
                          </Button>
                        )}
                      </div>

                      {bulkPasswords.length > 0 && (
                        <div className="space-y-2">
                          <Label>Generated Passwords:</Label>
                          <Textarea
                            value={bulkPasswords.join('\n')}
                            readOnly
                            rows={Math.min(bulkPasswords.length, 10)}
                            className="font-mono"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </SafeTabContent>
            </TabsContent>

            <TabsContent value="history">
              <SafeTabContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Password History */}
                  <Card className="p-6">
                    <div className="space-y-4">
                      <Label className="text-lg font-semibold flex items-center gap-2">
                        <History className="w-5 h-5" />
                        Password History
                      </Label>

                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {passwordHistory.length === 0 ? (
                          <p className="text-muted-foreground text-sm">No passwords generated yet</p>
                        ) : (
                          passwordHistory.map((item) => (
                            <div key={item.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                              <div className="flex-1 min-w-0">
                                <div className="font-mono text-sm truncate">{item.password}</div>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <Clock className="w-3 h-3" />
                                  {item.timestamp.toLocaleTimeString()}
                                  <Badge variant="outline" className="text-xs">{item.strength}</Badge>
                                </div>
                              </div>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => copyToClipboard(item.password)}
                              >
                                <Copy className="w-3 h-3" />
                              </Button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </Card>

                  {/* Custom Presets */}
                  <Card className="p-6">
                    <div className="space-y-4">
                      <Label className="text-lg font-semibold flex items-center gap-2">
                        <Lock className="w-5 h-5" />
                        Custom Presets
                      </Label>

                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {customPresets.length === 0 ? (
                          <p className="text-muted-foreground text-sm">No custom presets saved</p>
                        ) : (
                          customPresets.map((preset) => (
                            <div key={preset.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                              <div className="flex-1">
                                <div className="font-medium text-sm">{preset.name}</div>
                                <div className="text-xs text-muted-foreground">
                                  Length: {preset.settings.length} | 
                                  {preset.settings.includeUppercase ? ' ABC' : ''}
                                  {preset.settings.includeLowercase ? ' abc' : ''}
                                  {preset.settings.includeNumbers ? ' 123' : ''}
                                  {preset.settings.includeSymbols ? ' !@#' : ''}
                                </div>
                              </div>
                              <div className="flex gap-1">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => loadPreset(preset)}
                                >
                                  <RefreshCw className="w-3 h-3" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => deletePreset(preset.id)}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </Card>
                </div>
              </SafeTabContent>
            </TabsContent>
          </Tabs>
        </div>
      </PageLayout>
    </ErrorBoundary>
  );
}
