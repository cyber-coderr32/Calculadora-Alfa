import React, { useState, useRef, useEffect } from 'react';
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

export const CameraScanner: React.FC<CameraScannerProps> = ({
  onScanImage,
  onTranscribeImage,
  isLoading,
  onClose,
}) => {
  const [streamActive, setStreamActive] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Start live webcam stream
  const startCamera = async (mode: 'environment' | 'user' = facingMode) => {
    stopCamera();
    setCameraError(null);
    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: mode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setStreamActive(true);
    } catch (err: any) {
      console.warn('Camera access error:', err);
      // Fallback to any available video device
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
        setStreamActive(true);
      } catch (fallbackErr: any) {
        setCameraError(
          'Permissão de câmera não concedida ou dispositivo sem câmera. Você pode fazer upload de foto ou usar um exemplo abaixo.'
        );
        setStreamActive(false);
      }
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setStreamActive(false);
  };

  useEffect(() => {
    startCamera('environment');
    return () => {
      stopCamera();
    };
  }, []);

  // Listen for paste event (Ctrl+V / Cmd+V with image in clipboard)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            const reader = new FileReader();
            reader.onload = (event) => {
              if (event.target?.result) {
                setCapturedImage(event.target.result as string);
                stopCamera();
              }
            };
            reader.readAsDataURL(blob);
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

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    setCapturedImage(dataUrl);
    stopCamera();
  };

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
        setCapturedImage(e.target.result as string);
        stopCamera();
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
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    startCamera(facingMode);
  };

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-2xl backdrop-blur-md">
      {/* Hidden processing canvas */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              Scanner de Exercícios Matemáticos
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                IA Multimodal
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Aponte a câmera para uma questão, gráfico ou fórmula no caderno, livro ou tela
            </p>
          </div>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Camera Live View OR Captured Preview */}
      <div className="relative w-full aspect-video md:aspect-[16/9] max-h-[380px] bg-black rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center">
        {capturedImage ? (
          /* Preview of Captured Image */
          <div className="relative w-full h-full flex items-center justify-center bg-slate-950">
            <img
              src={capturedImage}
              alt="Exercício Capturado"
              className="max-h-full max-w-full object-contain"
            />
            <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md border border-slate-700/60 px-3 py-1 rounded-lg text-xs font-semibold text-emerald-400 flex items-center gap-1.5 shadow-lg">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Foto pronta para resolução</span>
            </div>
            <button
              type="button"
              id="btn-retake-photo"
              onClick={retakePhoto}
              className="absolute top-3 right-3 bg-slate-900/80 hover:bg-slate-800 backdrop-blur-md border border-slate-700/60 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-200 hover:text-white transition-colors flex items-center gap-1.5 shadow-lg"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Tirar outra</span>
            </button>
          </div>
        ) : streamActive ? (
          /* Live Webcam Feed with Focus Reticle */
          <div className="relative w-full h-full">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />

            {/* Target Alignment Box with Scanning Beam */}
            <div className="absolute inset-6 md:inset-10 border-2 border-indigo-500/60 rounded-2xl pointer-events-none flex flex-col justify-between p-3">
              <div className="flex justify-between items-center text-[11px] font-mono text-indigo-300 bg-slate-950/60 backdrop-blur-sm px-2 py-0.5 rounded w-fit">
                <span>ENQUADRE O EXERCÍCIO</span>
              </div>

              {/* Animated laser line */}
              <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_8px_#22d3ee] animate-pulse" />

              <div className="text-[10px] text-center text-slate-300 bg-slate-950/60 backdrop-blur-sm py-0.5 rounded">
                Mantenha a câmera estável e bem iluminada
              </div>
            </div>

            {/* Camera Controls Overlay */}
            <div className="absolute bottom-4 inset-x-0 flex items-center justify-center gap-4 px-4">
              <button
                type="button"
                id="btn-flip-camera"
                onClick={flipCamera}
                className="p-3 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-slate-700/80 shadow-lg transition-all active:scale-95"
                title="Trocar câmera frontal / traseira"
              >
                <RefreshCw className="w-5 h-5" />
              </button>

              {/* Shutter Button */}
              <button
                type="button"
                id="btn-capture-shutter"
                onClick={capturePhoto}
                className="w-16 h-16 rounded-full bg-white hover:bg-slate-100 p-1.5 border-4 border-indigo-500 shadow-xl shadow-indigo-500/40 transition-all duration-150 active:scale-90 flex items-center justify-center cursor-pointer"
                title="Capturar Foto"
              >
                <div className="w-full h-full rounded-full bg-indigo-600 hover:bg-indigo-500 flex items-center justify-center">
                  <Camera className="w-6 h-6 text-white" />
                </div>
              </button>

              <button
                type="button"
                id="btn-trigger-upload-camera"
                onClick={() => fileInputRef.current?.click()}
                className="p-3 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-slate-700/80 shadow-lg transition-all active:scale-95"
                title="Enviar arquivo de imagem"
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
                ? 'border-indigo-500 bg-indigo-950/20'
                : 'border-slate-800 hover:border-slate-700 bg-slate-950/60'
            }`}
          >
            <div className="p-3 rounded-full bg-indigo-600/20 text-indigo-400 mb-2">
              <Upload className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-200 mb-1">
              Arraste ou clique para enviar foto da questão
            </p>
            <p className="text-xs text-slate-400 max-w-xs">
              Suporta fotos em JPG, PNG, WEBP ou cole diretamente com Ctrl+V
            </p>
            {cameraError && (
              <p className="text-[11px] text-amber-400/90 mt-2 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {cameraError}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Actions when photo is ready */}
      {capturedImage ? (
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
                <span>Resolvendo Foto com IA...</span>
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
      ) : (
        /* Instant Pre-built Exercise Samples */
        <div className="mt-4 pt-3 border-t border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              Ou teste com exemplos prontos de exercícios com fotos:
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {SAMPLE_EXERCISES.map((sample) => (
              <button
                key={sample.id}
                type="button"
                id={`sample-btn-${sample.id}`}
                onClick={() => loadSampleExercise(sample)}
                className="flex flex-col items-start p-2.5 rounded-xl bg-slate-950/70 hover:bg-indigo-950/40 border border-slate-800 hover:border-indigo-500/50 text-left transition-all group"
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
