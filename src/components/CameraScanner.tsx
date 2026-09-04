import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Camera,
  Upload,
  RefreshCw,
  Sparkles,
  X,
  CheckCircle2,
  FileImage,
  Layers,
  AlertCircle,
  Eye,
  Edit3,
  Zap,
  ZapOff,
  Scan,
  Check,
  Image as ImageIcon,
  ArrowRight,
  Play,
} from 'lucide-react';

interface CameraScannerProps {
  onScanImage: (base64Image: string, autoSolve: boolean) => void;
  onTranscribeImage: (base64Image: string) => void;
  isLoading: boolean;
  onClose?: () => void;
}

// Built-in high-quality exercise samples for instant testing
const SAMPLE_EXERCISES = [
  {
    id: 'sample-bhaskara',
    title: 'Álgebra / Bhaskara',
    desc: 'Equação quadrática $3x^2 - 5x + 2 = 0$',
    category: 'Ensino Médio',
    canvasDrawer: (ctx: CanvasRenderingContext2D, width: number, height: number) => {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
      // Ruled lines like a notebook
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      for (let y = 30; y < height; y += 30) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 20px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('Exercício 04 - Equação do 2º Grau', 20, 45);
      ctx.font = '18px "Fira Code", monospace';
      ctx.fillText('Resolva em R a equação:', 20, 85);
      ctx.font = 'bold 26px "Fira Code", monospace';
      ctx.fillStyle = '#2563eb';
      ctx.fillText('3x² - 5x + 2 = 0', 40, 135);
      ctx.fillStyle = '#64748b';
      ctx.font = 'italic 15px sans-serif';
      ctx.fillText('Encontre o discriminante Δ e as duas raízes reais.', 20, 180);
    },
  },
  {
    id: 'sample-integral',
    title: 'Cálculo / Integral',
    desc: 'Integral indefinida $\\int x \\cdot e^{2x} dx$',
    category: 'Ensino Superior',
    canvasDrawer: (ctx: CanvasRenderingContext2D, width: number, height: number) => {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 20px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('Cálculo II - Integração por Partes', 20, 45);
      ctx.font = '18px sans-serif';
      ctx.fillText('Calcule a integral indefinida:', 20, 85);
      ctx.font = 'bold 28px "Fira Code", monospace';
      ctx.fillStyle = '#7c3aed';
      ctx.fillText('∫ x · e^(2x) dx', 50, 140);
      ctx.fillStyle = '#475569';
      ctx.font = '15px sans-serif';
      ctx.fillText('Dica: Use u = x e dv = e^(2x) dx', 20, 190);
    },
  },
  {
    id: 'sample-geometry',
    title: 'Geometria / Pitágoras & Área',
    desc: 'Triângulo retângulo com catetos 6 cm e 8 cm',
    category: 'Geometria',
    canvasDrawer: (ctx: CanvasRenderingContext2D, width: number, height: number) => {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 20px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('Geometria - Triângulo Retângulo', 20, 40);
      ctx.font = '16px sans-serif';
      ctx.fillText('Encontre a hipotenusa h e a área total:', 20, 75);

      // Draw triangle
      ctx.strokeStyle = '#2563eb';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(50, 200);
      ctx.lineTo(200, 200);
      ctx.lineTo(50, 110);
      ctx.closePath();
      ctx.stroke();

      // Right angle mark
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(50, 185, 15, 15);

      // Labels
      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText('a = 6 cm', 5, 160);
      ctx.fillText('b = 8 cm', 110, 220);
      ctx.fillStyle = '#dc2626';
      ctx.fillText('h = ?', 140, 145);
    },
  },
];

// Lightweight web audio sound synthesizer for authentic shutter and scan feedback
const playShutterSound = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(160, ctx.currentTime + 0.09);
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.09);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  } catch {}
};

const playRadarPing = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(920, ctx.currentTime);
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.06);
  } catch {}
};

const triggerHaptics = (pattern: number[] = [40, 50, 40]) => {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch {}
  }
};

export const CameraScanner: React.FC<CameraScannerProps> = ({
  onScanImage,
  onTranscribeImage,
  isLoading,
  onClose,
}) => {
  const [streamActive, setStreamActive] = useState(false);
  const [streamInstance, setStreamInstance] = useState<MediaStream | null>(null);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Auto-scan & auto-capture states
  const [autoScanEnabled, setAutoScanEnabled] = useState(true);
  const [stabilityScore, setStabilityScore] = useState(0); // 0 to 100
  const [paperDetected, setPaperDetected] = useState(false);
  const [flashActive, setFlashActive] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>('Aponte para o exercício no caderno...');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const analysisCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const nativeCameraInputRef = useRef<HTMLInputElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const prevFramePixelsRef = useRef<Uint8ClampedArray | null>(null);
  const isCapturingRef = useRef<boolean>(false);

  // Bind video element safely whenever ref changes or stream is set
  const bindStreamToVideo = useCallback((stream: MediaStream, videoEl?: HTMLVideoElement | null) => {
    const video = videoEl || videoRef.current;
    if (!video) return;
    try {
      if (video.srcObject !== stream) {
        video.srcObject = stream;
      }
      video.muted = true;
      video.playsInline = true;
      video.setAttribute('playsinline', 'true');
      video.setAttribute('webkit-playsinline', 'true');
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setVideoPlaying(true);
          })
          .catch((err) => {
            console.warn('Auto-play blocked, waiting for user tap:', err);
            setVideoPlaying(false);
          });
      }
    } catch (e) {
      console.warn('bindStreamToVideo error:', e);
    }
  }, []);

  const setVideoRef = useCallback((node: HTMLVideoElement | null) => {
    videoRef.current = node;
    if (node && streamRef.current) {
      bindStreamToVideo(streamRef.current, node);
    }
  }, [bindStreamToVideo]);

  // Start live webcam stream with multi-level fallback constraints for mobile
  const startCamera = async (mode: 'environment' | 'user' = facingMode) => {
    stopCamera();
    setCameraError(null);
    setStabilityScore(0);
    setPaperDetected(false);
    isCapturingRef.current = false;

    const constraintAttempts: MediaStreamConstraints[] = [
      {
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      },
      {
        video: {
          facingMode: mode,
        },
        audio: false,
      },
      {
        video: {
          facingMode: { ideal: mode },
        },
        audio: false,
      },
      {
        video: true,
        audio: false,
      },
    ];

    let activeStream: MediaStream | null = null;
    let lastErr: any = null;

    for (const constraints of constraintAttempts) {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('getUserMedia não suportado neste navegador');
        }
        activeStream = await navigator.mediaDevices.getUserMedia(constraints);
        if (activeStream) break;
      } catch (err: any) {
        lastErr = err;
      }
    }

    if (!activeStream) {
      console.warn('Camera access error:', lastErr);
      setCameraError(
        'Acesso à câmera bloqueado ou indisponível. Você pode usar a câmera nativa do celular ou enviar uma foto da galeria.'
      );
      setStreamActive(false);
      setStreamInstance(null);
      return;
    }

    streamRef.current = activeStream;
    setStreamInstance(activeStream);
    setStreamActive(true);
    setStatusMessage('Enquadre o exercício no caderno ou folha...');

    // Bind immediately to video if element is already available
    bindStreamToVideo(activeStream);
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setStreamInstance(null);
    setStreamActive(false);
    setVideoPlaying(false);
    prevFramePixelsRef.current = null;
  };

  useEffect(() => {
    startCamera('environment');
    return () => {
      stopCamera();
    };
  }, []);

  // Guarantee that whenever streamInstance changes, video attaches and plays
  useEffect(() => {
    if (streamInstance && videoRef.current) {
      bindStreamToVideo(streamInstance, videoRef.current);
    }
  }, [streamInstance, bindStreamToVideo]);

  // Listen for paste event (Ctrl+V / Cmd+V with image in clipboard)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            processFile(blob);
          }
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  const flipCamera = () => {
    const newMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(newMode);
    startCamera(newMode);
  };

  // Perform full-resolution capture and trigger automatic resolution
  const capturePhoto = useCallback((isAutoTrigger = false) => {
    if (isCapturingRef.current) return;
    isCapturingRef.current = true;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) {
      isCapturingRef.current = false;
      return;
    }

    // Trigger visual flash
    setFlashActive(true);
    playShutterSound();
    triggerHaptics([60, 40, 60]);
    setTimeout(() => setFlashActive(false), 260);

    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      isCapturingRef.current = false;
      return;
    }

    // Draw video frame to high-res canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.94);
    setCapturedImage(dataUrl);
    stopCamera();

    setStatusMessage(
      isAutoTrigger
        ? 'Exercício detectado e capturado automaticamente! Resolvendo passo a passo com a IA...'
        : 'Foto capturada! Resolvendo passo a passo com a IA...'
    );

    // AUTO-RESOLVE IMMEDIATELY as requested by user
    onScanImage(dataUrl, true);
  }, [onScanImage]);

  // Real-time automatic frame scanner: sweeps viewfinder and detects paper stability
  useEffect(() => {
    if (!streamActive || !autoScanEnabled || capturedImage || isLoading) {
      return;
    }

    const intervalId = setInterval(() => {
      const video = videoRef.current;
      const analysisCanvas = analysisCanvasRef.current;
      if (!video || !analysisCanvas || video.readyState < 2 || isCapturingRef.current) {
        return;
      }

      const aWidth = 120;
      const aHeight = 90;
      analysisCanvas.width = aWidth;
      analysisCanvas.height = aHeight;
      const actx = analysisCanvas.getContext('2d', { willReadFrequently: true });
      if (!actx) return;

      actx.drawImage(video, 0, 0, aWidth, aHeight);

      // Focus on the center reticle (middle 60% x 60% of frame)
      const startX = Math.floor(aWidth * 0.2);
      const startY = Math.floor(aHeight * 0.2);
      const cropW = Math.floor(aWidth * 0.6);
      const cropH = Math.floor(aHeight * 0.6);

      const frameData = actx.getImageData(startX, startY, cropW, cropH);
      const data = frameData.data;
      const totalPixels = cropW * cropH;

      let sumLuma = 0;
      let diffSum = 0;
      const prevData = prevFramePixelsRef.current;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const luma = 0.299 * r + 0.587 * g + 0.114 * b;
        sumLuma += luma;

        if (prevData && prevData.length === data.length) {
          const prevLuma = 0.299 * prevData[i] + 0.587 * prevData[i + 1] + 0.114 * prevData[i + 2];
          diffSum += Math.abs(luma - prevLuma);
        }
      }

      prevFramePixelsRef.current = new Uint8ClampedArray(data);

      const avgBrightness = sumLuma / totalPixels;
      const avgDiff = prevData ? diffSum / totalPixels : 20;

      // Paper detection: Notebook or printed paper is typically illuminated (avgBrightness > 65 and < 245)
      const isPaperLike = avgBrightness > 65 && avgBrightness < 245;
      setPaperDetected(isPaperLike);

      if (isPaperLike) {
        // Stability check: if movement is low (camera held steady on paper)
        if (avgDiff < 14) {
          // Stable frame!
          setStabilityScore((prev) => {
            const next = Math.min(100, prev + 25);
            if (next >= 45 && prev < 45) {
              playRadarPing();
            }
            if (next >= 100 && !isCapturingRef.current) {
              // Trigger automatic capture and resolution!
              capturePhoto(true);
            }
            return next;
          });
          setStatusMessage('Caderno focado! Mantenha a câmera estável...');
        } else if (avgDiff < 22) {
          // Minor movement, hold score steady
          setStatusMessage('Estabilizando enquadramento...');
        } else {
          // Camera moving or shaking
          setStabilityScore((prev) => Math.max(0, prev - 35));
          setStatusMessage('Varrendo papel... Mantenha a câmera firme sobre o exercício');
        }
      } else {
        // Dark or non-paper background
        setStabilityScore((prev) => Math.max(0, prev - 40));
        setStatusMessage('Aponte para o exercício no caderno ou folha de papel...');
      }
    }, 180);

    return () => clearInterval(intervalId);
  }, [streamActive, autoScanEnabled, capturedImage, isLoading, capturePhoto]);

  // File upload handler (from device, gallery or file picker)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Por favor selecione um arquivo de imagem válido (JPG, PNG, WEBP).');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        const dataUrl = e.target.result as string;
        setCapturedImage(dataUrl);
        stopCamera();
        triggerHaptics([40, 50]);
        setStatusMessage('Foto do caderno carregada! Resolvendo automaticamente com a IA...');
        // AUTOMATICALLY RESOLVE ON FILE UPLOAD as requested
        onScanImage(dataUrl, true);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  // Generate sample exercise image onto hidden canvas and set as capturedImage
  const loadSampleExercise = (sample: (typeof SAMPLE_EXERCISES)[0]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = 600;
    canvas.height = 240;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    sample.canvasDrawer(ctx, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
    setCapturedImage(dataUrl);
    stopCamera();
    triggerHaptics([40]);
    setStatusMessage(`Exemplo carregado (${sample.title})! Resolvendo automaticamente com a IA...`);
    // AUTOMATICALLY RESOLVE AS REQUESTED
    onScanImage(dataUrl, true);
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    isCapturingRef.current = false;
    setStabilityScore(0);
    startCamera(facingMode);
  };

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-3 sm:p-5 shadow-2xl backdrop-blur-md">
      {/* Hidden processing & analysis canvases */}
      <canvas ref={canvasRef} className="hidden" />
      <canvas ref={analysisCanvasRef} className="hidden" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3.5 mb-3.5 border-b border-slate-800 gap-2.5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 shrink-0">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold text-white tracking-tight">
                Scanner Inteligente de Caderno
              </h3>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Varredura Automática
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Aponte a câmera para a folha do caderno ou livro para varredura e resolução automática
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
          {/* Toggle Auto-Scan Button */}
          <button
            type="button"
            onClick={() => setAutoScanEnabled(!autoScanEnabled)}
            className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer select-none ${
              autoScanEnabled
                ? 'bg-indigo-600/30 hover:bg-indigo-600/40 text-indigo-300 border-indigo-500/50'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-400 border-slate-700'
            }`}
            title={
              autoScanEnabled
                ? 'Varredura automática ativada (dispara ao enquadrar e estabilizar)'
                : 'Varredura automática desativada (disparo manual pelo botão)'
            }
          >
            {autoScanEnabled ? (
              <>
                <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                <span>Auto-Scan: Ativado</span>
              </>
            ) : (
              <>
                <ZapOff className="w-3.5 h-3.5" />
                <span>Auto-Scan: Manual</span>
              </>
            )}
          </button>

          {/* Quick Photo Upload Trigger in Header */}
          <button
            type="button"
            id="btn-header-upload-photo"
            onClick={() => fileInputRef.current?.click()}
            className="px-2.5 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/40 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            title="Fazer upload de foto do caderno ou arquivo"
          >
            <Upload className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Enviar Foto</span>
          </button>

          {onClose && (
            <button
              type="button"
              onClick={() => {
                stopCamera();
                onClose();
              }}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Fechar scanner"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Camera Live View OR Captured Preview */}
      <div className="relative w-full aspect-video md:aspect-[16/9] max-h-[420px] bg-black rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center select-none">
        {/* Camera Flash Screen Overlay */}
        <div
          className={`absolute inset-0 bg-white transition-opacity duration-200 pointer-events-none z-30 ${
            flashActive ? 'opacity-95' : 'opacity-0'
          }`}
        />

        {capturedImage ? (
          /* Preview of Captured Image (Resolving automatically) */
          <div className="relative w-full h-full flex items-center justify-center bg-slate-950">
            <img
              src={capturedImage}
              alt="Exercício Capturado"
              className="max-h-full max-w-full object-contain"
            />

            {/* Status pill on captured image */}
            <div className="absolute top-3 left-3 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 px-3 py-1.5 rounded-xl text-xs font-semibold text-emerald-400 flex items-center gap-2 shadow-xl z-10">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Exercício capturado — Resolvendo com IA</span>
            </div>

            {/* Quick Action Overlay (Retake or Upload new) */}
            <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
              <button
                type="button"
                id="btn-retake-photo"
                onClick={retakePhoto}
                className="bg-slate-900/90 hover:bg-slate-800 backdrop-blur-md border border-slate-700 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-200 hover:text-white transition-colors flex items-center gap-1.5 shadow-lg cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Nova Foto</span>
              </button>
            </div>

            {/* Loading Banner when processing */}
            {isLoading && (
              <div className="absolute bottom-4 inset-x-4 bg-slate-950/85 backdrop-blur-md border border-indigo-500/50 p-3 rounded-xl flex items-center justify-center gap-2.5 text-xs font-bold text-white shadow-2xl z-10 animate-pulse">
                <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin shrink-0" />
                <span>Identificando fórmulas e gerando resolução passo a passo...</span>
              </div>
            )}
          </div>
        ) : streamActive ? (
          /* Live Webcam Feed with Dynamic HUD, Reticle & Laser Sweep */
          <div className="relative w-full h-full">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />

            {/* Target Alignment Box with Corner Brackets & Dynamic Laser Sweep */}
            <div className="absolute inset-5 sm:inset-10 border border-indigo-500/30 rounded-2xl pointer-events-none flex flex-col justify-between p-3 overflow-hidden shadow-[inset_0_0_20px_rgba(99,102,241,0.15)]">
              {/* L-Shaped Corner Brackets */}
              <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-cyan-400 rounded-tl-xl" />
              <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-cyan-400 rounded-tr-xl" />
              <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-cyan-400 rounded-bl-xl" />
              <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-cyan-400 rounded-br-xl" />

              {/* Dynamic Laser Scanning Beam */}
              <div className="absolute inset-x-2 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_12px_#22d3ee] animate-scan-sweep pointer-events-none z-10" />

              {/* Top Status HUD in viewfinder */}
              <div className="flex items-center justify-between z-20">
                <div className="flex items-center gap-1.5 text-[11px] font-mono text-indigo-200 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-indigo-500/40">
                  <Scan className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                  <span className="font-bold">
                    {paperDetected ? 'CADERNO DETECTADO' : 'VARRENDO PAPEL'}
                  </span>
                </div>

                {autoScanEnabled && (
                  <div className="flex items-center gap-1 text-[11px] font-mono bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-indigo-500/40 text-cyan-300">
                    <span>Estabilidade:</span>
                    <span className="font-bold text-white">{stabilityScore}%</span>
                  </div>
                )}
              </div>

              {/* Center Guidance Hint & Stability Meter */}
              <div className="flex flex-col items-center gap-1.5 z-20 my-auto">
                {autoScanEnabled && stabilityScore > 0 && (
                  <div className="w-48 max-w-[80%] bg-slate-950/80 backdrop-blur-md p-1.5 rounded-full border border-slate-700/80 shadow-lg">
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 rounded-full transition-all duration-150"
                        style={{ width: `${stabilityScore}%` }}
                      />
                    </div>
                  </div>
                )}
                <div className="text-[11px] text-center text-slate-200 bg-slate-950/85 backdrop-blur-md py-1 px-3 rounded-xl border border-slate-800 shadow-md">
                  {statusMessage}
                </div>
              </div>

              {/* Bottom Target Rule */}
              <div className="text-[10px] text-center text-slate-400 bg-slate-950/70 backdrop-blur-sm py-0.5 px-2 rounded-lg self-center z-20">
                Mantenha a questão centralizada na moldura
              </div>
            </div>

            {/* Camera Controls Overlay (Bottom) */}
            <div className="absolute bottom-4 inset-x-0 flex items-center justify-center gap-5 px-4 z-20">
              {/* Flip camera */}
              <button
                type="button"
                id="btn-flip-camera"
                onClick={flipCamera}
                className="p-3 rounded-full bg-slate-900/85 hover:bg-slate-800 text-slate-200 border border-slate-700 shadow-xl transition-all active:scale-95 cursor-pointer"
                title="Trocar câmera frontal / traseira"
              >
                <RefreshCw className="w-5 h-5" />
              </button>

              {/* Shutter Button (Manual Capture with auto-resolve) */}
              <div className="relative flex items-center justify-center">
                {/* Visual circular progress halo when auto-scanning */}
                {autoScanEnabled && stabilityScore > 0 && (
                  <svg className="absolute w-20 h-20 -rotate-90 pointer-events-none">
                    <circle
                      cx="40"
                      cy="40"
                      r="36"
                      stroke="#0ea5e9"
                      strokeWidth="3"
                      fill="none"
                      strokeDasharray={226}
                      strokeDashoffset={226 - (226 * stabilityScore) / 100}
                      className="transition-all duration-150"
                    />
                  </svg>
                )}

                <button
                  type="button"
                  id="btn-capture-shutter"
                  onClick={() => capturePhoto(false)}
                  className="w-16 h-16 rounded-full bg-white hover:bg-slate-100 p-1.5 border-4 border-indigo-500 shadow-2xl shadow-indigo-500/50 transition-all duration-150 active:scale-90 flex items-center justify-center cursor-pointer group"
                  title="Capturar Foto e Resolver Agora"
                >
                  <div className="w-full h-full rounded-full bg-indigo-600 group-hover:bg-indigo-500 flex items-center justify-center">
                    <Camera className="w-6 h-6 text-white" />
                  </div>
                </button>
              </div>

              {/* Upload Photo Button beside Shutter */}
              <button
                type="button"
                id="btn-trigger-upload-camera"
                onClick={() => fileInputRef.current?.click()}
                className="p-3 rounded-full bg-slate-900/85 hover:bg-slate-800 text-purple-300 border border-purple-500/40 shadow-xl transition-all active:scale-95 cursor-pointer"
                title="Fazer upload de foto do caderno/livro"
              >
                <Upload className="w-5 h-5" />
              </button>
            </div>
          </div>
        ) : (
          /* Camera Unavailable / Upload Fallback Dropzone */
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`w-full h-full flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-all border-2 border-dashed ${
              isDragOver
                ? 'border-indigo-500 bg-indigo-950/30'
                : 'border-slate-800 hover:border-slate-700 bg-slate-950/70'
            }`}
          >
            <div className="p-3.5 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 mb-2.5">
              <Upload className="w-7 h-7" />
            </div>
            <p className="text-base font-bold text-slate-100 mb-1">
              Fazer Upload de Foto do Caderno ou Folha
            </p>
            <p className="text-xs text-slate-400 max-w-sm mb-3">
              Clique ou arraste uma foto (JPG, PNG, WEBP) ou cole com <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-300 font-mono">Ctrl+V</kbd>. O aplicativo resolve automaticamente!
            </p>
            <span className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center gap-1.5">
              <FileImage className="w-4 h-4" />
              <span>Selecionar Foto da Galeria / Arquivo</span>
            </span>
            {cameraError && (
              <p className="text-[11px] text-amber-400/90 mt-3 flex items-center gap-1 max-w-md">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {cameraError}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Hidden File Input for Device/Gallery Photo Selection */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Quick Upload Bar when camera is active */}
      {!capturedImage && streamActive && (
        <div className="mt-3 flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <Upload className="w-4 h-4 text-purple-400 shrink-0" />
            <span>Prefere enviar uma foto já salva no dispositivo?</span>
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-1.5 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/40 text-xs font-bold transition-all cursor-pointer select-none shrink-0"
          >
            Carregar Foto
          </button>
        </div>
      )}

      {/* Actions when photo is ready */}
      {capturedImage && (
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            id="btn-solve-scanned-photo"
            onClick={() => onScanImage(capturedImage, true)}
            disabled={isLoading}
            className="py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Resolvendo Foto com a IA Alfa...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Resolver Esta Foto Passo a Passo</span>
              </>
            )}
          </button>

          <button
            type="button"
            id="btn-transcribe-scanned-photo"
            onClick={() => onTranscribeImage(capturedImage)}
            disabled={isLoading}
            className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-semibold text-sm border border-slate-700 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
          >
            <Edit3 className="w-4 h-4 text-indigo-400" />
            <span>Transcrever Equação para o Teclado</span>
          </button>
        </div>
      )}

      {/* Instant Pre-built Exercise Samples (Instant testing with 1-click auto-resolve) */}
      {!capturedImage && (
        <div className="mt-4 pt-3 border-t border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              Ou teste com exemplos prontos de fotos de cadernos:
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {SAMPLE_EXERCISES.map((sample) => (
              <button
                key={sample.id}
                type="button"
                id={`sample-btn-${sample.id}`}
                onClick={() => loadSampleExercise(sample)}
                className="flex flex-col items-start p-2.5 rounded-xl bg-slate-950/70 hover:bg-indigo-950/40 border border-slate-800 hover:border-indigo-500/50 text-left transition-all group cursor-pointer"
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="text-xs font-bold text-white group-hover:text-indigo-300">
                    {sample.title}
                  </span>
                  <span className="text-[10px] text-indigo-400 bg-indigo-950/80 px-1.5 py-0.5 rounded border border-indigo-800/40">
                    {sample.category}
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 line-clamp-1">{sample.desc}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
