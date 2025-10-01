import { useState, useRef, useEffect } from "react";
import { PageLayout } from "@/components/PageLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  Upload, 
  Scan, 
  Copy, 
  ExternalLink, 
  Camera, 
  StopCircle,
  Wifi,
  Phone,
  Calendar,
  CreditCard,
  Mail,
  MapPin,
  Smartphone
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

export default function QrScanner() {
  const [file, setFile] = useState<File | null>(null);
  const [scannedData, setScannedData] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [scanHistory, setScanHistory] = useState<string[]>([]);
  const [qrType, setQrType] = useState<string>("");
  const [isProcessingQR, setIsProcessingQR] = useState(false); 
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<number | null>(null);
  
  const { toast } = useToast();

  // Detect QR code type based on content
  const detectQRType = (data: string): string => {
    if (data.startsWith('http://') || data.startsWith('https://')) {
      return 'URL';
    } else if (data.startsWith('mailto:')) {
      return 'Email';
    } else if (data.startsWith('tel:')) {
      return 'Phone';
    } else if (data.startsWith('WIFI:')) {
      return 'WiFi';
    } else if (data.startsWith('BEGIN:VCARD')) {
      return 'vCard';
    } else if (data.startsWith('BEGIN:VEVENT')) {
      return 'Calendar';
    } else if (data.startsWith('geo:')) {
      return 'Location';
    } else if (/^\d+$/.test(data)) {
      return 'Number';
    } else if (data.includes('@') && !data.startsWith('mailto:')) {
      return 'Email';
    } else if (/^[\+]?[0-9\-\(\)\s]+$/.test(data)) {
      return 'Phone';
    } else {
      return 'Text';
    }
  };

  // Parse WiFi QR code data
  const parseWiFiData = (data: string) => {
    if (!data.startsWith('WIFI:')) return null;
    
    const parts = data.substring(5).split(';');
    const wifiInfo: any = {};
    
    parts.forEach(part => {
      if (part.startsWith('T:')) wifiInfo.security = part.substring(2);
      if (part.startsWith('S:')) wifiInfo.ssid = part.substring(2);
      if (part.startsWith('P:')) wifiInfo.password = part.substring(2);
      if (part.startsWith('H:')) wifiInfo.hidden = part.substring(2) === 'true';
    });
    
    return wifiInfo;
  };

  // Start camera for live scanning
  const startCamera = async () => {
    try {
      const constraints = {
        video: {
          facingMode: { ideal: "environment" }, // Prefer rear camera
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      
      setIsCameraActive(true);
      setIsScanning(true);
      setIsProcessingQR(false); // Reset processing flag
      
      // Start scanning loop
      scanIntervalRef.current = window.setInterval(scanFrame, 100);
      
      toast({
        title: "Camera started",
        description: "Point your camera at a QR code to scan"
      });
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast({
        title: "Camera access denied",
        description: "Please allow camera access to scan QR codes",
        variant: "destructive"
      });
    }
  };

  // Stop camera completely
  const stopCamera = () => {
    // Stop the scanning interval first
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    
    // Stop all media tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      streamRef.current = null;
    }
    
    // Clear video source
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setIsCameraActive(false);
    setIsScanning(false);
    setIsProcessingQR(false);
  };

  // Process detected QR code
  const processDetectedQR = async (qrData: string) => {
    // Prevent processing the same QR multiple times
    if (isProcessingQR) return;
    
    setIsProcessingQR(true);
    
    // Stop camera immediately after detection
    stopCamera();
    
    const type = detectQRType(qrData);
    setScannedData(qrData);
    setQrType(type);
    
    // Add to history if not already present
    setScanHistory(prev => {
      if (!prev.includes(qrData)) {
        return [qrData, ...prev.slice(0, 9)]; // Keep last 10
      }
      return prev;
    });
    
    toast({
      title: `${type} QR Code Detected!`,
      description: "Camera stopped. QR code successfully scanned.",
    });
  };

  // Scan current video frame
  const scanFrame = async () => {
    // Don't scan if already processing a QR code
    if (!videoRef.current || !canvasRef.current || !isCameraActive || isProcessingQR) {
      return;
    }
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      const imageData = ctx?.getImageData(0, 0, canvas.width, canvas.height);
      
      if (imageData) {
        try {
          // You'll need to install jsQR: npm install jsqr
          const jsQR = (await import('jsqr')).default;
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          
          if (code && code.data && code.data.trim() !== '') {
            // Process the detected QR code
            await processDetectedQR(code.data);
          }
        } catch (error) {
          console.error('Error scanning frame:', error);
        }
      }
    }
  };

  // Handle file upload and scan
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type.startsWith('image/')) {
      setFile(selectedFile);
      setScannedData("");
      setQrType("");
    } else {
      toast({
        title: "Invalid file type",
        description: "Please select an image file",
        variant: "destructive"
      });
    }
  };

  // Scan from uploaded file
  const handleScan = async () => {
    if (!file) return;
    
    setIsScanning(true);
    
    try {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      
      if (canvas && ctx) {
        const img = new Image();
        img.onload = async () => {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
          
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          
          try {
            const jsQR = (await import('jsqr')).default;
            const code = jsQR(imageData.data, imageData.width, imageData.height);
            
            if (code && code.data) {
              const type = detectQRType(code.data);
              setScannedData(code.data);
              setQrType(type);
              
              setScanHistory(prev => {
                if (!prev.includes(code.data)) {
                  return [code.data, ...prev.slice(0, 9)];
                }
                return prev;
              });
              
              toast({
                title: `${type} QR Code Scanned`,
                description: "Successfully decoded QR code content"
              });
            } else {
              toast({
                title: "No QR code found",
                description: "Could not detect a QR code in the image",
                variant: "destructive"
              });
            }
          } catch (error) {
            toast({
              title: "Scan failed",
              description: "Error processing the image",
              variant: "destructive"
            });
          }
          
          setIsScanning(false);
        };
        
        img.src = URL.createObjectURL(file);
      }
    } catch (error) {
      setIsScanning(false);
      toast({
        title: "Scan failed",
        description: "Error processing the image",
        variant: "destructive"
      });
    }
  };

  // Clear current scan and start fresh
  const startNewScan = () => {
    setScannedData("");
    setQrType("");
    setIsProcessingQR(false);
    startCamera();
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(scannedData);
    toast({
      title: "Copied to clipboard",
      description: "QR code content copied successfully"
    });
  };

  const openLink = () => {
    if (scannedData.startsWith('http')) {
      window.open(scannedData, '_blank');
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'URL': return <ExternalLink className="w-4 h-4" />;
      case 'WiFi': return <Wifi className="w-4 h-4" />;
      case 'Phone': return <Phone className="w-4 h-4" />;
      case 'Email': return <Mail className="w-4 h-4" />;
      case 'vCard': return <CreditCard className="w-4 h-4" />;
      case 'Calendar': return <Calendar className="w-4 h-4" />;
      case 'Location': return <MapPin className="w-4 h-4" />;
      default: return <Scan className="w-4 h-4" />;
    }
  };

  const renderSpecialActions = () => {
    if (qrType === 'WiFi' && scannedData.startsWith('WIFI:')) {
      const wifiData = parseWiFiData(scannedData);
      return (
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <Wifi className="w-4 h-4" />
            WiFi Network Details
          </h4>
          {wifiData && (
            <div className="space-y-1 text-sm">
              <p><strong>Network:</strong> {wifiData.ssid}</p>
              <p><strong>Security:</strong> {wifiData.security || 'Open'}</p>
              {wifiData.password && (
                <p><strong>Password:</strong> {wifiData.password}</p>
              )}
            </div>
          )}
        </div>
      );
    }
    
    return null;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const isUrl = scannedData.startsWith('http://') || scannedData.startsWith('https://');

  return (
    <PageLayout
      title="QR Code Scanner"
      description="Scan QR codes using camera or upload images"
    >
      <div className="max-w-4xl mx-auto">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Camera Scanner */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Camera className="w-5 h-5" />
              Live Camera Scanner
            </h3>
            
            <div className="space-y-4">
              <div className="aspect-video bg-black rounded-lg overflow-hidden relative">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  playsInline
                  muted
                />
                {!isCameraActive && (
                  <div className="absolute inset-0 flex items-center justify-center text-white">
                    <div className="text-center">
                      <Smartphone className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm opacity-75">Camera preview will appear here</p>
                    </div>
                  </div>
                )}
                {isCameraActive && isScanning && (
                  <div className="absolute top-4 left-4 right-4">
                    <div className="bg-black/50 text-white px-3 py-1 rounded-full text-sm text-center">
                      🔍 Scanning for QR codes...
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex gap-2">
                {!isCameraActive ? (
                  <Button onClick={startCamera} className="flex-1">
                    <Camera className="w-4 h-4 mr-2" />
                    Start Camera
                  </Button>
                ) : (
                  <Button onClick={stopCamera} variant="destructive" className="flex-1">
                    <StopCircle className="w-4 h-4 mr-2" />
                    Stop Camera
                  </Button>
                )}
              </div>
            </div>
          </Card>

          {/* File Upload Scanner */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Upload Image Scanner
            </h3>
            
            <div className="space-y-4">
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-3">
                  Select an image containing a QR code
                </p>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                />
              </div>

              {file && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              )}

              <Button 
                onClick={handleScan}
                disabled={!file || isScanning}
                className="w-full"
              >
                {isScanning ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Scanning...
                  </>
                ) : (
                  <>
                    <Scan className="w-4 h-4 mr-2" />
                    Scan QR Code
                  </>
                )}
              </Button>
            </div>
          </Card>
        </div>

        {/* Results */}
        {scannedData && (
          <Card className="p-6 mt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getTypeIcon(qrType)}
                  <h3 className="font-semibold text-green-600">QR Code Detected</h3>
                  <Badge variant="secondary">{qrType}</Badge>
                </div>
                <Button onClick={startNewScan} variant="outline" size="sm">
                  <Camera className="w-4 h-4 mr-2" />
                  Scan New QR
                </Button>
              </div>
              
              <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                <p className="text-sm break-all font-mono">{scannedData}</p>
              </div>

              {renderSpecialActions()}

              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={copyToClipboard}>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy
                </Button>
                {isUrl && (
                  <Button variant="outline" onClick={openLink}>
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Open Link
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 p-3 bg-muted rounded-lg text-xs">
                <div>
                  <span className="font-medium">Type:</span> {qrType}
                </div>
                <div>
                  <span className="font-medium">Length:</span> {scannedData.length} chars
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Scan History */}
        {scanHistory.length > 0 && (
          <Card className="p-6 mt-6">
            <h3 className="text-lg font-semibold mb-4">Recent Scans</h3>
            <div className="space-y-2">
              {scanHistory.map((scan, index) => (
                <div
                  key={index}
                  className="p-3 bg-muted rounded-lg text-sm cursor-pointer hover:bg-muted/80"
                  onClick={() => {
                    setScannedData(scan);
                    setQrType(detectQRType(scan));
                  }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {getTypeIcon(detectQRType(scan))}
                    <Badge variant="outline" className="text-xs">
                      {detectQRType(scan)}
                    </Badge>
                  </div>
                  <p className="truncate font-mono">{scan}</p>
                </div>
              ))}
            </div>
          </Card>
        )}

        <canvas ref={canvasRef} className="hidden" />
      </div>
    </PageLayout>
  );
}
