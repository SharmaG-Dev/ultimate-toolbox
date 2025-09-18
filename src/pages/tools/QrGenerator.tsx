import { useState, useRef, useEffect, useCallback } from "react";
import { PageLayout } from "@/components/PageLayout";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { QrCode, Download, Wifi, CreditCard, Phone, Mail, MapPin, Link as LinkIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import QRCode from "qrcode";

interface QROptions {
  errorCorrectionLevel: "low" | "medium" | "quartile" | "high";
  type: "image/png" | "image/jpeg" | "image/webp";
  quality: number;
  margin: number;
  color: {
    dark: string;
    light: string;
  };
  width: number;
}

export default function QrGenerator() {
  const [qrType, setQrType] = useState("text");
  const [qrData, setQrData] = useState("");
  const [qrImageUrl, setQrImageUrl] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [canvasReady, setCanvasReady] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  // Basic options
  const [size, setSize] = useState("256");
  const [errorCorrection, setErrorCorrection] = useState("medium");
  const [darkColor, setDarkColor] = useState("#000000");
  const [lightColor, setLightColor] = useState("#FFFFFF");

  // UPI Payment fields
  const [upiId, setUpiId] = useState("");
  const [payeeName, setPayeeName] = useState("");
  const [amount, setAmount] = useState("");
  const [transactionNote, setTransactionNote] = useState("");

  // WiFi fields
  const [wifiSSID, setWifiSSID] = useState("");
  const [wifiPassword, setWifiPassword] = useState("");
  const [wifiSecurity, setWifiSecurity] = useState("WPA");
  const [wifiHidden, setWifiHidden] = useState(false);

  // Contact fields
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactOrganization, setContactOrganization] = useState("");
  const [contactUrl, setContactUrl] = useState("");

  // SMS fields
  const [smsPhone, setSmsPhone] = useState("");
  const [smsMessage, setSmsMessage] = useState("");

  // Email fields
  const [emailTo, setEmailTo] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");

  // Location fields
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");

  // Check if canvas is ready after component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      if (canvasRef.current) {
        setCanvasReady(true);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  const generateQRData = useCallback(() => {
    switch (qrType) {
      case "upi":
        if (!upiId || !payeeName) {
          throw new Error("UPI ID and Payee Name are required");
        }
        let upiString = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payeeName)}`;
        if (amount) upiString += `&am=${encodeURIComponent(amount)}`;
        if (transactionNote) upiString += `&tn=${encodeURIComponent(transactionNote)}`;
        upiString += "&cu=INR";
        return upiString;

      case "wifi":
        if (!wifiSSID) {
          throw new Error("WiFi SSID is required");
        }
        return `WIFI:S:${wifiSSID};T:${wifiSecurity};P:${wifiPassword || ""};H:${wifiHidden ? "true" : "false"};;`;

      case "contact":
        if (!contactName) {
          throw new Error("Contact name is required");
        }
        let vcard = "BEGIN:VCARD\nVERSION:3.0\n";
        vcard += `FN:${contactName}\n`;
        if (contactPhone) vcard += `TEL:${contactPhone}\n`;
        if (contactEmail) vcard += `EMAIL:${contactEmail}\n`;
        if (contactOrganization) vcard += `ORG:${contactOrganization}\n`;
        if (contactUrl) vcard += `URL:${contactUrl}\n`;
        vcard += "END:VCARD";
        return vcard;

      case "sms":
        if (!smsPhone) {
          throw new Error("Phone number is required for SMS");
        }
        return `sms:${smsPhone}?body=${encodeURIComponent(smsMessage || "")}`;

      case "email":
        if (!emailTo) {
          throw new Error("Email address is required");
        }
        let mailString = `mailto:${emailTo}`;
        const params = [];
        if (emailSubject) params.push(`subject=${encodeURIComponent(emailSubject)}`);
        if (emailBody) params.push(`body=${encodeURIComponent(emailBody)}`);
        if (params.length > 0) mailString += `?${params.join("&")}`;
        return mailString;

      case "location":
        if (!latitude || !longitude) {
          throw new Error("Latitude and longitude are required");
        }
        return `geo:${latitude},${longitude}`;

      case "url":
        if (!qrData || (!qrData.startsWith("http://") && !qrData.startsWith("https://"))) {
          throw new Error("Please enter a valid URL starting with http:// or https://");
        }
        return qrData;

      case "text":
      default:
        if (!qrData.trim()) {
          throw new Error("Please enter text to generate QR code");
        }
        return qrData;
    }
  }, [qrType, upiId, payeeName, amount, transactionNote, wifiSSID, wifiPassword, wifiSecurity, wifiHidden, contactName, contactPhone, contactEmail, contactOrganization, contactUrl, smsPhone, smsMessage, emailTo, emailSubject, emailBody, latitude, longitude, qrData]);

  const handleGenerate = useCallback(async () => {
    try {
      setIsGenerating(true);
      
      // Wait a bit for canvas to be ready if needed
      let attempts = 0;
      const maxAttempts = 10;
      
      while (!canvasRef.current && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }

      if (!canvasRef.current) {
        throw new Error("Canvas element is not available. Please try again.");
      }

      const data = generateQRData();
      console.log("Generated QR Data:", data); // Debug log

      const options: QROptions = {
        errorCorrectionLevel: errorCorrection as "low" | "medium" | "quartile" | "high",
        type: "image/png",
        quality: 0.92,
        margin: 2,
        color: {
          dark: darkColor,
          light: lightColor,
        },
        width: parseInt(size),
      };

      // Clear previous QR code
      setQrImageUrl("");
      
      const canvas = canvasRef.current;
      
      // Clear canvas first
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }

      console.log("Generating QR code on canvas..."); // Debug log
      
      // Generate QR code on canvas
      await QRCode.toCanvas(canvas, data, options);
      
      console.log("QR code generated successfully"); // Debug log
      
      // Get image data URL
      const imageUrl = canvas.toDataURL("image/png");
      setQrImageUrl(imageUrl);

      toast({
        title: "QR Code Generated",
        description: `${getQRTypeLabel(qrType)} QR code created successfully`,
      });
      
    } catch (error) {
      console.error("QR Generation Error:", error);
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate QR code",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  }, [generateQRData, errorCorrection, darkColor, lightColor, size, qrType, toast]);

  const handleDownload = useCallback(async (format: "png" | "svg" | "jpg") => {
    try {
      const data = generateQRData();
      const link = document.createElement("a");
      
      if (format === "svg") {
        const svgString = await QRCode.toString(data, {
          type: "svg",
          width: parseInt(size),
          color: { dark: darkColor, light: lightColor },
          errorCorrectionLevel: errorCorrection as any,
          margin: 2,
        });
        
        const blob = new Blob([svgString], { type: "image/svg+xml" });
        const url = URL.createObjectURL(blob);
        link.download = `qr-code-${qrType}.svg`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
      } else {
        if (!qrImageUrl) {
          throw new Error("QR code not generated yet. Please generate first.");
        }

        let dataUrl = qrImageUrl;
        
        if (format === "jpg") {
          const canvas = canvasRef.current;
          if (canvas) {
            // Convert to JPG with white background
            const tempCanvas = document.createElement("canvas");
            const tempCtx = tempCanvas.getContext("2d");
            tempCanvas.width = canvas.width;
            tempCanvas.height = canvas.height;
            
            if (tempCtx) {
              tempCtx.fillStyle = lightColor;
              tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
              tempCtx.drawImage(canvas, 0, 0);
              dataUrl = tempCanvas.toDataURL("image/jpeg", 0.92);
            }
          }
        }
        
        link.download = `qr-code-${qrType}.${format}`;
        link.href = dataUrl;
        link.click();
      }
      
      toast({
        title: "Download Started",
        description: `QR code ${format.toUpperCase()} download started`,
      });
    } catch (error) {
      console.error("Download Error:", error);
      toast({
        title: "Download Failed",
        description: error instanceof Error ? error.message : "Failed to download QR code",
        variant: "destructive",
      });
    }
  }, [generateQRData, size, darkColor, lightColor, errorCorrection, qrType, qrImageUrl, toast]);

  const getQRTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      text: "Text",
      url: "URL",
      upi: "UPI Payment",
      wifi: "WiFi",
      contact: "Contact",
      sms: "SMS",
      email: "Email",
      location: "Location",
    };
    return labels[type] || "QR Code";
  };

  const getQRTypeIcon = (type: string) => {
    const icons: Record<string, React.ReactNode> = {
      text: <QrCode className="w-4 h-4" />,
      url: <LinkIcon className="w-4 h-4" />,
      upi: <CreditCard className="w-4 h-4" />,
      wifi: <Wifi className="w-4 h-4" />,
      contact: <Phone className="w-4 h-4" />,
      sms: <Phone className="w-4 h-4" />,
      email: <Mail className="w-4 h-4" />,
      location: <MapPin className="w-4 h-4" />,
    };
    return icons[type] || <QrCode className="w-4 h-4" />;
  };

  const clearForm = useCallback(() => {
    setQrData("");
    setUpiId("");
    setPayeeName("");
    setAmount("");
    setTransactionNote("");
    setWifiSSID("");
    setWifiPassword("");
    setContactName("");
    setContactPhone("");
    setContactEmail("");
    setContactOrganization("");
    setContactUrl("");
    setSmsPhone("");
    setSmsMessage("");
    setEmailTo("");
    setEmailSubject("");
    setEmailBody("");
    setLatitude("");
    setLongitude("");
    setQrImageUrl("");
  }, []);

  useEffect(() => {
    clearForm();
  }, [qrType, clearForm]);

  const renderQRTypeForm = () => {
    switch (qrType) {
      case "upi":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="upiId">UPI ID / VPA *</Label>
                <Input
                  id="upiId"
                  placeholder="example@paytm"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="payeeName">Payee Name *</Label>
                <Input
                  id="payeeName"
                  placeholder="Your Name"
                  value={payeeName}
                  onChange={(e) => setPayeeName(e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (₹)</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="100.00"
                  step="0.01"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="transactionNote">Transaction Note</Label>
                <Input
                  id="transactionNote"
                  placeholder="Payment for..."
                  value={transactionNote}
                  onChange={(e) => setTransactionNote(e.target.value)}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              * Required fields. This will generate a UPI payment QR code compatible with all UPI apps.
            </p>
          </div>
        );

      case "wifi":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="wifiSSID">Network Name (SSID) *</Label>
              <Input
                id="wifiSSID"
                placeholder="My-WiFi-Network"
                value={wifiSSID}
                onChange={(e) => setWifiSSID(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="wifiPassword">Password</Label>
                <Input
                  id="wifiPassword"
                  type="password"
                  placeholder="WiFi Password"
                  value={wifiPassword}
                  onChange={(e) => setWifiPassword(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Security Type</Label>
                <Select value={wifiSecurity} onValueChange={setWifiSecurity}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WPA">WPA/WPA2</SelectItem>
                    <SelectItem value="WEP">WEP</SelectItem>
                    <SelectItem value="nopass">None (Open)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="wifiHidden"
                checked={wifiHidden}
                onCheckedChange={setWifiHidden}
              />
              <Label htmlFor="wifiHidden">Hidden Network</Label>
            </div>
          </div>
        );

      case "contact":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="contactName">Full Name *</Label>
              <Input
                id="contactName"
                placeholder="John Doe"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contactPhone">Phone Number</Label>
                <Input
                  id="contactPhone"
                  placeholder="+91 9876543210"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactEmail">Email</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  placeholder="john@example.com"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contactOrganization">Organization</Label>
                <Input
                  id="contactOrganization"
                  placeholder="Company Name"
                  value={contactOrganization}
                  onChange={(e) => setContactOrganization(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactUrl">Website</Label>
                <Input
                  id="contactUrl"
                  placeholder="https://example.com"
                  value={contactUrl}
                  onChange={(e) => setContactUrl(e.target.value)}
                />
              </div>
            </div>
          </div>
        );

      case "sms":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="smsPhone">Phone Number *</Label>
              <Input
                id="smsPhone"
                placeholder="+91 9876543210"
                value={smsPhone}
                onChange={(e) => setSmsPhone(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="smsMessage">Message</Label>
              <Textarea
                id="smsMessage"
                placeholder="Your message here..."
                value={smsMessage}
                onChange={(e) => setSmsMessage(e.target.value)}
                className="min-h-20"
              />
            </div>
          </div>
        );

      case "email":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="emailTo">Email Address *</Label>
              <Input
                id="emailTo"
                type="email"
                placeholder="recipient@example.com"
                value={emailTo}
                onChange={(e) => setEmailTo(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emailSubject">Subject</Label>
              <Input
                id="emailSubject"
                placeholder="Email subject"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emailBody">Message</Label>
              <Textarea
                id="emailBody"
                placeholder="Email message..."
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                className="min-h-20"
              />
            </div>
          </div>
        );

      case "location":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="latitude">Latitude *</Label>
                <Input
                  id="latitude"
                  placeholder="28.6139"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="longitude">Longitude *</Label>
                <Input
                  id="longitude"
                  placeholder="77.2090"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              You can find coordinates using Google Maps or GPS coordinates apps.
            </p>
          </div>
        );

      case "url":
        return (
          <div className="space-y-2">
            <Label htmlFor="url">Website URL *</Label>
            <Input
              id="url"
              placeholder="https://example.com"
              value={qrData}
              onChange={(e) => setQrData(e.target.value)}
            />
          </div>
        );

      case "text":
      default:
        return (
          <div className="space-y-2">
            <Label htmlFor="content">Text Content *</Label>
            <Textarea
              id="content"
              placeholder="Enter any text to encode in QR code..."
              value={qrData}
              onChange={(e) => setQrData(e.target.value)}
              className="min-h-24"
            />
            <p className="text-xs text-muted-foreground">
              Characters: {qrData.length} / 2953 max
            </p>
          </div>
        );
    }
  };

  return (
    <PageLayout
      title="Advanced QR Code Generator"
      description="Generate QR codes for payments, WiFi, contacts, and more"
    >
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getQRTypeIcon(qrType)}
              QR Code Type
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={qrType} onValueChange={setQrType} className="space-y-6">
              <TabsList className="grid grid-cols-4 lg:grid-cols-8 gap-1">
                <TabsTrigger value="text" className="text-xs">Text</TabsTrigger>
                <TabsTrigger value="url" className="text-xs">URL</TabsTrigger>
                <TabsTrigger value="upi" className="text-xs">UPI Pay</TabsTrigger>
                <TabsTrigger value="wifi" className="text-xs">WiFi</TabsTrigger>
                <TabsTrigger value="contact" className="text-xs">Contact</TabsTrigger>
                <TabsTrigger value="sms" className="text-xs">SMS</TabsTrigger>
                <TabsTrigger value="email" className="text-xs">Email</TabsTrigger>
                <TabsTrigger value="location" className="text-xs">Location</TabsTrigger>
              </TabsList>

              <TabsContent value={qrType} className="space-y-6">
                {renderQRTypeForm()}

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Customization Options</h3>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label>Size</Label>
                      <Select value={size} onValueChange={setSize}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="128">128x128 px</SelectItem>
                          <SelectItem value="256">256x256 px</SelectItem>
                          <SelectItem value="512">512x512 px</SelectItem>
                          <SelectItem value="1024">1024x1024 px</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Error Correction</Label>
                      <Select value={errorCorrection} onValueChange={setErrorCorrection}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low (7%)</SelectItem>
                          <SelectItem value="medium">Medium (15%)</SelectItem>
                          <SelectItem value="quartile">Quartile (25%)</SelectItem>
                          <SelectItem value="high">High (30%)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Foreground Color</Label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={darkColor}
                          onChange={(e) => setDarkColor(e.target.value)}
                          className="w-12 h-8 p-0 border-0"
                        />
                        <Input
                          value={darkColor}
                          onChange={(e) => setDarkColor(e.target.value)}
                          className="flex-1"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Background Color</Label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={lightColor}
                          onChange={(e) => setLightColor(e.target.value)}
                          className="w-12 h-8 p-0 border-0"
                        />
                        <Input
                          value={lightColor}
                          onChange={(e) => setLightColor(e.target.value)}
                          className="flex-1"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={handleGenerate}
                  disabled={isGenerating || !canvasReady}
                  className="w-full"
                  size="lg"
                >
                  {isGenerating ? "Generating..." : canvasReady ? `Generate ${getQRTypeLabel(qrType)} QR Code` : "Loading Canvas..."}
                </Button>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Canvas Container - Always present to prevent ref issues */}
        <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
          <canvas 
            ref={canvasRef}
            width={parseInt(size)}
            height={parseInt(size)}
            style={{ width: `${size}px`, height: `${size}px` }}
          />
        </div>

        {qrImageUrl && (
          <Card>
            <CardHeader>
              <CardTitle>Generated QR Code</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <div className="inline-block p-4 bg-white rounded-lg border shadow-sm">
                  <img 
                    src={qrImageUrl} 
                    alt="Generated QR Code"
                    className="max-w-full h-auto mx-auto"
                    style={{ 
                      maxWidth: '300px',
                      height: 'auto',
                    }}
                  />
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Scan this QR code with any QR scanner app
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button variant="outline" onClick={() => handleDownload("png")}>
                  <Download className="w-4 h-4 mr-2" />
                  Download PNG
                </Button>
                <Button variant="outline" onClick={() => handleDownload("jpg")}>
                  <Download className="w-4 h-4 mr-2" />
                  Download JPG
                </Button>
                <Button variant="outline" onClick={() => handleDownload("svg")}>
                  <Download className="w-4 h-4 mr-2" />
                  Download SVG
                </Button>
              </div>

              <div className="p-4 bg-muted rounded-lg space-y-2">
                <h4 className="font-medium">QR Code Details</h4>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p><strong>Type:</strong> {getQRTypeLabel(qrType)}</p>
                  <p><strong>Size:</strong> {size}x{size}px</p>
                  <p><strong>Error Correction:</strong> {errorCorrection}</p>
                  <p><strong>Colors:</strong> {darkColor} on {lightColor}</p>
                  {qrType === "upi" && upiId && (
                    <p><strong>UPI ID:</strong> {upiId}</p>
                  )}
                  {qrType === "upi" && amount && (
                    <p><strong>Amount:</strong> ₹{amount}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </PageLayout>
  );
}
