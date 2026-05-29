import React, { useState, useRef, useEffect } from 'react';
import { Camera, RefreshCw, Upload, AlertTriangle, FileUp, Sparkles, Check, Trash2, Sliders } from 'lucide-react';
import { translations } from '../locales';
import { LanguageType, ScannedPage } from '../types';

interface ScannerTabProps {
  language: LanguageType;
  onPageCaptured: (page: ScannedPage) => void;
  onNavigate: (tab: string) => void;
  scannedCount: number;
}

export function ScannerTab({
  language,
  onPageCaptured,
  onNavigate,
  scannedCount
}: ScannerTabProps) {
  const t = translations[language];

  // Camera settings states
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [cameraAllowed, setCameraAllowed] = useState<boolean | null>(null);
  const [flash, setFlash] = useState<boolean>(false);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [flashPulse, setFlashPulse] = useState<boolean>(false);

  // File fallback state
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [fallbackImage, setFallbackImage] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Stop camera stream on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  // Request camera list
  useEffect(() => {
    startCamera();
  }, [selectedCameraId]);

  async function startCamera() {
    try {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      const constraints: MediaStreamConstraints = {
        video: selectedCameraId 
          ? { deviceId: { exact: selectedCameraId } } 
          : { facingMode: 'environment' }
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      setCameraAllowed(true);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }

      // Query devices to list additional cameras
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(d => d.kind === 'videoinput');
      setCameras(videoDevices);
      if (!selectedCameraId && videoDevices.length > 0) {
        setSelectedCameraId(videoDevices[0].deviceId);
      }
    } catch (err) {
      console.warn('Camera access error:', err);
      setCameraAllowed(false);
    }
  }

  // Switch camera toggle
  const handleSwitchCamera = () => {
    if (cameras.length <= 1) return;
    const currentIndex = cameras.findIndex(c => c.deviceId === selectedCameraId);
    const nextIndex = (currentIndex + 1) % cameras.length;
    setSelectedCameraId(cameras[nextIndex].deviceId);
  };

  // Trigger snapshot capture
  const handleCaptureSnapshot = () => {
    if (!videoRef.current) return;
    setIsCapturing(true);
    setFlashPulse(true);

    setTimeout(() => {
      setFlashPulse(false);
    }, 150);

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      generateScannedPage(dataUrl);
    }
    setIsCapturing(false);
  };

  // Create page entity from dataurl
  const generateScannedPage = (imgUrl: string) => {
    const newPage: ScannedPage = {
      id: Math.random().toString(36).substring(4),
      originalUrl: imgUrl,
      enhancedUrl: imgUrl, // Defaults to original initially
      rotation: 0,
      brightness: 50,
      contrast: 50,
      saturation: 50,
      sharpness: 0,
      bwEnabled: false,
      bwThreshold: 128,
      filter: 'none',
      cropRect: null
    };
    onPageCaptured(newPage);
  };

  // Drag and drop back-up logic
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processPayloadFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processPayloadFile(e.target.files[0]);
    }
  };

  const processPayloadFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        const urlStr = event.target.result as string;
        setFallbackImage(urlStr);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleConfirmFilePayload = () => {
    if (fallbackImage) {
      generateScannedPage(fallbackImage);
      setFallbackImage(null);
    }
  };

  // Load beautiful sample mock scan images so the user can test editing instantly inside AI Studio:
  const loadMockDocument = (index: number) => {
    // Elegant base64 vector design documents so they don't break
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 1100;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Draw simulated paper
      ctx.fillStyle = '#FAF9F6';
      ctx.fillRect(0, 0, 800, 1100);

      // Shadow border
      ctx.strokeStyle = '#CCCCCC';
      ctx.lineWidth = 10;
      ctx.strokeRect(5, 5, 790, 1090);

      // Document branding / header
      ctx.fillStyle = '#007AFF';
      ctx.beginPath();
      ctx.arc(100, 120, 25, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#111111';
      ctx.font = 'bold 36px sans-serif';
      ctx.fillText(index === 1 ? 'QUARTERLY BILL INVOICE' : 'OFFICIAL ACQUISITION COMPACT', 150, 130);

      ctx.fillStyle = '#666666';
      ctx.font = '20px monospace';
      ctx.fillText(`SERIAL NO: 228189-A${index}`, 150, 160);

      // Horizontal lines
      ctx.strokeStyle = '#E0E0E0';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(80, 200);
      ctx.lineTo(720, 200);
      ctx.stroke();

      // Body lines representing text paragraphs
      ctx.fillStyle = '#2D2D2D';
      ctx.font = '22px sans-serif';
      ctx.fillText('Subject: Provision of High-Fidelity Desktop Document Conversion', 80, 260);

      ctx.font = '16px serif';
      const lines = [
        'Pursuant to the specifications provided in the comprehensive requirements sheet,',
        'the system utilizes optimized HTML5 Canvas pixels transformations to crop, rotate,',
        'contrast, saturate and sharpen captured documents directly in the local offline mode.',
        'This client-side execution model satisfies absolute privacy, providing rapid processing',
        'without exposing sensitive metadata records to external cloud data brokers.',
        '',
        'Terms Of Agreement:',
        '1. The operator guarantees that document scans remain sandboxed within IndexedDB.',
        '2. The OCR engine parses both English and Bangla characters accurately using Google Gemini.',
        '3. All features remain completely free, lightweight, and responsive.'
      ];

      let y = 320;
      for (const line of lines) {
        ctx.fillText(line, 80, y);
        y += 35;
      }

      // Highlight Box
      ctx.fillStyle = 'rgba(0, 122, 255, 0.08)';
      ctx.fillRect(80, y + 10, 640, 100);
      ctx.strokeStyle = '#007AFF';
      ctx.lineWidth = 1;
      ctx.strokeRect(80, y + 10, 640, 100);

      ctx.fillStyle = '#007AFF';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText('BILINGUAL SYSTEM INTEGRATION (বাংলা এবং ইংরেজি)', 100, y + 45);
      ctx.fillStyle = '#333333';
      ctx.font = '15px sans-serif';
      ctx.fillText('পরীক্ষামূলক বাংলা নথি প্রিন্টআউট সফলভাবে সম্পন্ন হয়েছে।', 100, y + 75);

      // Footer
      ctx.fillStyle = '#888888';
      ctx.font = '12px monospace';
      ctx.fillText(`SYSTEM EXECUTED ON STATE: 2026-05-29 UTC`, 80, 1020);
      ctx.fillText('PAGE 1 OF 1', 650, 1020);

      const base64Url = canvas.toDataURL('image/jpeg');
      setFallbackImage(base64Url);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 relative" id="scanner-view-container">
      {/* Ambient background lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/5 rounded-full blur-[120px] pointer-events-none z-0 animate-pulse-radial" />
      
      {/* Tab Header Card */}
      <div className="bg-white dark:bg-white/5 dark:backdrop-blur-md rounded-2xl p-6 shadow-sm border border-gray-105 dark:border-white/10 transition-colors duration-300 z-10 relative">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center space-x-2">
              <Camera className="w-5 h-5 text-[#007AFF]" />
              <span>{t.scanner.title}</span>
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t.scanner.auto_boundary}
            </p>
          </div>
          {scannedCount > 0 && (
            <button
              onClick={() => onNavigate('batch')}
              className="flex items-center space-x-2 bg-[#007AFF] hover:bg-[#0051D5] text-white font-semibold text-sm px-4 py-2.5 rounded-xl shadow-md cursor-pointer transition-transform hover:scale-[1.02]"
              id="scanner-go-to-workspace"
            >
              <Sparkles className="w-4 h-4 animation-pulse" />
              <span>{t.nav.converter} ({scannedCount} {scannedCount === 1 ? 'Page' : 'Pages'})</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Viewport Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Viewport (Camera/Fallback) */}
        <div className="lg:col-span-8 bg-black rounded-3xl overflow-hidden aspect-[3/4] relative border border-gray-800 dark:border-white/10 shadow-2xl flex flex-col justify-between p-4 bg-radial from-gray-950 to-black z-10">
          
          {/* Flash Pulsing Override Overlay */}
          {flashPulse && (
            <div className="absolute inset-0 bg-white z-50 animate-fade-out" />
          )}

          {/* Boundaries Overlay Guide Lines */}
          <div className="absolute inset-8 border border-dashed border-white/5 dark:border-white/10 rounded-2xl pointer-events-none z-20 flex items-center justify-center">
            {/* Scanning Lasers Simulation is styled inside index.css */}
            <div className="absolute left-0 w-full h-[3px] bg-blue-500/60 shadow-blue-glow animate-laser z-20 pointer-events-none" />

            <div className="w-16 h-16 border-t-4 border-l-4 border-blue-500 rounded-tl-xl absolute top-0 left-0" />
            <div className="w-16 h-16 border-t-4 border-r-4 border-blue-500 rounded-tr-xl absolute top-0 right-0" />
            <div className="w-16 h-16 border-b-4 border-l-4 border-blue-500 rounded-bl-xl absolute bottom-0 left-0" />
            <div className="w-16 h-16 border-b-4 border-r-4 border-blue-500 rounded-br-xl absolute bottom-0 right-0" />
            
            {/* Focal Point Indicator */}
            <div className="w-8 h-8 border-2 border-emerald-500/60 rounded-full animate-ping pointer-events-none" />
          </div>

          {/* Interactive Viewport Element */}
          <div className="absolute inset-0 flex items-center justify-center bg-gray-950">
            {cameraAllowed ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
                id="scanner-video-feed"
              />
            ) : (
              /* Drag Drop Local Scanner Mockup Container */
              <div 
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                className={`w-full h-full flex flex-col items-center justify-center px-6 text-center transition-colors border-2 border-dashed ${
                  dragActive 
                    ? 'border-[#007AFF] bg-[#007AFF]/10' 
                    : 'border-gray-800 bg-gray-950 hover:bg-gray-900/60'
                }`}
                id="scanner-drag-drop-zone"
              >
                <input
                  type="file"
                  id="scanner-file-picker"
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileChange}
                />
                <label 
                  htmlFor="scanner-file-picker"
                  className="flex flex-col items-center justify-center cursor-pointer group space-y-4"
                >
                  <div className="w-16 h-16 rounded-full bg-gray-900 border border-gray-800 flex items-center justify-center text-gray-400 group-hover:text-white group-hover:border-[#007AFF] transition-all">
                    <FileUp className="w-8 h-8" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-200 group-hover:text-white">
                      {t.scanner.upload_fallback}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      PNG, JPG, WebP up to 45MB
                    </p>
                  </div>
                </label>

                {/* Simulated Materials Buttons shortcuts */}
                <div className="mt-8 space-y-2.5 w-full max-w-sm">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-[#007AFF]">Test Materials</span>
                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={() => loadMockDocument(1)}
                      className="px-3.5 py-1.5 bg-gray-950 hover:bg-[#007AFF]/15 text-[#007AFF] border border-[#007AFF]/30 rounded-lg text-xs font-semibold cursor-pointer transition-all"
                    >
                      📄 Sample Bill
                    </button>
                    <button
                      onClick={() => loadMockDocument(2)}
                      className="px-3.5 py-1.5 bg-gray-950 hover:bg-[#007AFF]/15 text-[#007AFF] border border-[#007AFF]/30 rounded-lg text-xs font-semibold cursor-pointer transition-all"
                    >
                      📜 Sample Pact
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick status bar */}
          <div className="z-10 w-full flex justify-between items-center text-xs text-gray-400 font-medium bg-black/60 backdrop-blur-md p-2 rounded-lg" id="scanner-status-strip">
            <span className="flex items-center space-x-1.5">
              <span className={`w-2.5 h-2.5 rounded-full ${cameraAllowed ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
              <span>{cameraAllowed ? t.scanner.camera_allowed : t.scanner.camera_blocked}</span>
            </span>
            <span>2026-05-29 UTC</span>
          </div>

          {/* Simulated Shutter Shutter Trigger panel */}
          <div className="z-10 w-full flex justify-center py-4" id="scanner-action-pane">
            <div className="flex items-center space-x-6">
              
              {/* Flip camera if multidevices */}
              <button
                onClick={handleSwitchCamera}
                disabled={cameras.length <= 1}
                className="p-3 bg-white/10 hover:bg-white/20 disabled:opacity-40 text-white rounded-full transition-colors cursor-pointer"
                title={t.scanner.flip}
              >
                <RefreshCw className="w-5 h-5" />
              </button>

              {/* SHUTTER BUTTON */}
              <button
                onClick={handleCaptureSnapshot}
                disabled={!cameraAllowed || isCapturing}
                className="w-20 h-20 bg-white hover:scale-105 active:scale-95 disabled:opacity-30 disabled:scale-100 rounded-full flex items-center justify-center cursor-pointer shadow-[0_0_40px_rgba(255,255,255,0.4)] transition-all focus:outline-none group z-30"
                title={t.scanner.capture}
              >
                <div className="w-16 h-16 rounded-full border-4 border-black bg-white transition-all group-active:scale-90" />
              </button>

              {/* Simulated flash brightness trigger */}
              <button
                onClick={() => setFlash(!flash)}
                className={`p-3 rounded-full transition-colors cursor-pointer ${flash ? 'bg-amber-400 text-black' : 'bg-white/10 text-white hover:bg-white/20'}`}
                title={t.scanner.flash}
              >
                <Sparkles className="w-5 h-5" />
              </button>

            </div>
          </div>

        </div>

        {/* Right Preview/Awaiting Panel */}
        <div className="lg:col-span-4 space-y-6 z-10">
          <div className="bg-white dark:bg-white/5 dark:backdrop-blur-md rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-white/10 transition-colors duration-300">
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
              {t.scanner.image_source}
            </h3>

            {fallbackImage ? (
              <div className="space-y-4">
                <div className="relative aspect-[3/4] bg-gray-50 dark:bg-gray-950 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800">
                  <img 
                    src={fallbackImage} 
                    alt="Captured Source" 
                    className="w-full h-full object-contain"
                  />
                  <button
                    onClick={() => setFallbackImage(null)}
                    className="absolute top-2 right-2 p-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-lg shadow-md cursor-pointer transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <button
                  onClick={handleConfirmFilePayload}
                  className="w-full flex items-center justify-center space-x-2 bg-[#007AFF] hover:bg-[#0051D5] text-white font-bold py-3 px-4 rounded-xl shadow-md cursor-pointer transition-colors"
                  id="scanner-confirm-image-btn"
                >
                  <Check className="w-5 h-5" />
                  <span>{t.scanner.confirm} ({t.scanner.capture})</span>
                </button>
              </div>
            ) : (
              <div className="text-center py-12 px-4 rounded-xl border border-dashed border-gray-200 dark:border-gray-700 select-none">
                <Upload className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  Awaiting document source capture or workspace upload. Capturing frames registers them into the active batch session memory.
                </p>
              </div>
            )}
          </div>

          <div className="bg-gradient-to-tr from-[#007AFF]/10 to-[#00C6FF]/5 dark:from-blue-950/20 dark:to-transparent rounded-2xl p-6 border border-gray-100 dark:border-white/10 shadow-sm">
            <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-[#007AFF]" />
              <span>Offline Scan Advantage</span>
            </h4>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 leading-relaxed">
              Scanner Pro operations run locally in browser JavaScript sandbox. Your photos are never saved to cloud services or remote tracking logs. High-Contrast filters and B&W converters execute directly in high-performance CPU pixel grids.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
