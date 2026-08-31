import React, { useState, useEffect, useRef } from 'react';
import { MathSolution, SolveRequest } from './types';
import { MathKeyboard } from './components/MathKeyboard';
import { CameraScanner } from './components/CameraScanner';
import { SolutionDisplay } from './components/SolutionDisplay';
import { HandwrittenNotebookDisplay } from './components/HandwrittenNotebookDisplay';
import { MathRenderer } from './components/MathRenderer';
import { FormulaLibraryView } from './components/views/FormulaLibraryView';
import { GrapherStudioView } from './components/views/GrapherStudioView';
import { OfflineToolsView } from './components/views/OfflineToolsView';
import { HistoryView } from './components/views/HistoryView';
import { solveOffline } from './engine/offlineSolver';
import {
  Calculator,
  Camera,
  History,
  Sparkles,
  Zap,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Keyboard,
  RotateCcw,
  ArrowRight,
  Eye,
  Settings2,
  Wifi,
  WifiOff,
  Sliders,
  Cpu,
  TrendingUp,
  Grid3X3,
  Compass,
  Layers,
  Menu,
  X,
  ChevronRight,
  Smartphone,
  BookMarked,
  ArrowLeft,
  Pencil,
  Maximize,
  Minimize,
} from 'lucide-react';

export type AppMenu = 'solver' | 'notebook_steps' | 'scanner' | 'grapher' | 'tools' | 'formulas' | 'history';

export default function App() {
  const [currentMenu, setCurrentMenu] = useState<AppMenu>('solver');
  const [inputProblem, setInputProblem] = useState<string>('2x^2 - 8x + 6 = 0');
  const [detailLevel, setDetailLevel] = useState<'detailed' | 'concise'>('detailed');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentSolution, setCurrentSolution] = useState<MathSolution | null>(null);
  const [useNativeKeyboard, setUseNativeKeyboard] = useState<boolean>(false);
  const [isMenuDrawerOpen, setIsMenuDrawerOpen] = useState<boolean>(false);
  const [history, setHistory] = useState<MathSolution[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isLoadingAlternative, setIsLoadingAlternative] = useState<boolean>(false);
  const [isOfflineMode, setIsOfflineMode] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Fullscreen API State Sync
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFs = Boolean(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );
      setIsFullscreen(isFs);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = async () => {
    try {
      const doc = document as any;
      const docEl = document.documentElement as any;

      if (!doc.fullscreenElement && !doc.webkitFullscreenElement && !doc.mozFullScreenElement && !doc.msFullscreenElement) {
        if (docEl.requestFullscreen) {
          await docEl.requestFullscreen();
        } else if (docEl.webkitRequestFullscreen) {
          await docEl.webkitRequestFullscreen();
        } else if (docEl.mozRequestFullScreen) {
          await docEl.mozRequestFullScreen();
        } else if (docEl.msRequestFullscreen) {
          await docEl.msRequestFullscreen();
        }
      } else {
        if (doc.exitFullscreen) {
          await doc.exitFullscreen();
        } else if (doc.webkitExitFullscreen) {
          await doc.webkitExitFullscreen();
        } else if (doc.mozCancelFullScreen) {
          await doc.mozCancelFullScreen();
        } else if (doc.msExitFullscreen) {
          await doc.msExitFullscreen();
        }
      }
    } catch (e) {
      console.warn('Fullscreen request could not be completed:', e);
    }
  };

  // Monitor online / offline network state
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => {
      setIsOnline(false);
      setIsOfflineMode(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load history & favorites from localStorage on mount
  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem('math_calc_history');
      if (savedHistory) {
        setHistory(JSON.parse(savedHistory));
      }
      const savedFavs = localStorage.getItem('math_calc_favs');
      if (savedFavs) {
        setFavorites(JSON.parse(savedFavs));
      }
    } catch (e) {
      console.warn('Could not load local history:', e);
    }
  }, []);

  // Save history to localStorage
  const saveToHistory = (newSolution: MathSolution) => {
    setHistory((prev) => {
      const updated = [newSolution, ...prev.filter((item) => item.id !== newSolution.id)].slice(0, 50);
      try {
        localStorage.setItem('math_calc_history', JSON.stringify(updated));
      } catch (e) {
        console.warn('LocalStorage save error:', e);
      }
      return updated;
    });
  };

  const handleClearHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem('math_calc_history');
    } catch (e) {
      console.warn('LocalStorage clear error:', e);
    }
  };

  const handleToggleFavorite = (id: string) => {
    setFavorites((prev) => {
      const updated = prev.includes(id) ? prev.filter((favId) => favId !== id) : [...prev, id];
      try {
        localStorage.setItem('math_calc_favs', JSON.stringify(updated));
      } catch (e) {
        console.warn('LocalStorage fav error:', e);
      }
      return updated;
    });
  };

  // Solve math problem (Text or Image) with offline first capability
  const handleSolve = async (params?: { problemOverride?: string; imageBase64?: string; autoSolve?: boolean; openNotebookDirectly?: boolean }) => {
    const textToSolve = params?.problemOverride !== undefined ? params.problemOverride : inputProblem;
    const imageToSolve = params?.imageBase64;
    const shouldOpenNotebook = params?.openNotebookDirectly ?? true;

    if (!textToSolve.trim() && !imageToSolve) {
      setError('Por favor digite uma equação ou exercício.');
      return;
    }

    setIsLoading(true);
    setError(null);

    // If in Offline Mode or no internet and we have text equation, solve 100% locally with offline engine!
    if ((isOfflineMode || !isOnline) && textToSolve.trim() && !imageToSolve) {
      try {
        const localSolution = solveOffline(textToSolve);
        setCurrentSolution(localSolution);
        saveToHistory(localSolution);
        setIsLoading(false);
        if (shouldOpenNotebook) {
          setCurrentMenu('notebook_steps');
        }
        return;
      } catch (offlineErr: any) {
        console.warn('Offline solve error:', offlineErr);
      }
    }

    try {
      const payload: SolveRequest = {
        problem: textToSolve,
        image: imageToSolve,
        detailLevel,
        action: 'solve',
      };

      const response = await fetch('/api/solve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        // Fallback to offline engine if server is unreachable or offline
        if (textToSolve.trim() && !imageToSolve) {
          const localSol = solveOffline(textToSolve);
          setCurrentSolution(localSol);
          saveToHistory(localSol);
          setIsLoading(false);
          if (shouldOpenNotebook) {
            setCurrentMenu('notebook_steps');
          }
          return;
        }
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || 'Falha ao resolver problema.');
      }

      const result: MathSolution = await response.json();
      setCurrentSolution(result);
      saveToHistory(result);
      if (shouldOpenNotebook) {
        setCurrentMenu('notebook_steps');
      }
    } catch (err: any) {
      console.error('Solve error:', err);
      // Seamless offline fallback
      if (textToSolve.trim() && !imageToSolve) {
        try {
          const fallbackSol = solveOffline(textToSolve);
          setCurrentSolution(fallbackSol);
          saveToHistory(fallbackSol);
          if (shouldOpenNotebook) {
            setCurrentMenu('notebook_steps');
          }
          return;
        } catch (e) {
          // ignore
        }
      }
      setError(err.message || 'Ocorreu um erro ao processar o cálculo. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  // Transcribe math from image into input box
  const handleTranscribeImage = async (base64Image: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/transcribe-math', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64Image }),
      });
      const data = await res.json();
      if (data.transcribedText) {
        setInputProblem(data.transcribedText);
        setCurrentMenu('solver');
      } else {
        throw new Error('Não foi possível transcrever o texto da imagem.');
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao ler imagem.');
    } finally {
      setIsLoading(false);
    }
  };

  // Ask AI for clarification on a specific step
  const handleAskClarification = async (stepIndex: number, question: string) => {
    if (!currentSolution) return;
    setIsLoading(true);
    setError(null);

    try {
      const payload: SolveRequest = {
        action: 'clarify_step',
        stepIndex,
        customQuestion: question,
        previousSolution: currentSolution,
        detailLevel: 'detailed',
      };

      const response = await fetch('/api/solve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error('Erro ao esclarecer dúvida.');

      const result: MathSolution = await response.json();
      setCurrentSolution(result);
    } catch (err: any) {
      setError(err.message || 'Não foi possível gerar a explicação deste passo.');
    } finally {
      setIsLoading(false);
    }
  };

  // Generate alternative solving method
  const handleAlternativeMethod = async () => {
    if (!currentSolution) return;
    setIsLoadingAlternative(true);
    setError(null);

    try {
      const payload: SolveRequest = {
        action: 'alternative_method',
        previousSolution: currentSolution,
        detailLevel: 'detailed',
      };

      const response = await fetch('/api/solve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error('Erro ao buscar método alternativo.');

      const result: MathSolution = await response.json();
      setCurrentSolution(result);
    } catch (err: any) {
      setError(err.message || 'Não foi possível gerar outro método de resolução.');
    } finally {
      setIsLoadingAlternative(false);
    }
  };

  // Menu items list for the Drawer/Modal
  const drawerMenuItems = [
    {
      id: 'solver' as AppMenu,
      name: 'Calculadora & Teclado',
      icon: Calculator,
      desc: 'Tela principal com campo de texto e teclado matemático completo',
      badge: 'Principal',
    },
    {
      id: 'scanner' as AppMenu,
      name: 'Scanner por Câmera / Foto',
      icon: Camera,
      badge: 'Foto IA',
      desc: 'Tire foto de livros, provas ou exercícios do caderno',
    },
    {
      id: 'grapher' as AppMenu,
      name: 'Estúdio de Gráficos 2D',
      icon: TrendingUp,
      badge: 'Gráficos',
      desc: 'Plote f(x), visualize curvas, raízes e tabela X×Y',
    },
    {
      id: 'tools' as AppMenu,
      name: 'Ferramentas & Conversores Offline',
      icon: Sliders,
      badge: '0ms Offline',
      desc: 'Bhaskara, Pitágoras, Matrizes, Estatística e Regra de 3',
    },
    {
      id: 'formulas' as AppMenu,
      name: 'Biblioteca de Fórmulas',
      icon: BookOpen,
      badge: 'Biblioteca',
      desc: 'Centenas de fórmulas de Álgebra, Geometria e Cálculo',
    },
    {
      id: 'history' as AppMenu,
      name: 'Histórico & Resoluções Salvas',
      icon: History,
      badge: history.length > 0 ? `${history.length}` : undefined,
      desc: 'Acesse novamente qualquer cálculo realizado',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased selection:bg-indigo-500 selection:text-white w-full max-w-full overflow-x-hidden">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur-md border-b border-slate-800 px-2.5 sm:px-4 py-2 sm:py-2.5 w-full max-w-full">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-1.5 sm:gap-2 w-full">
          {/* Logo & Title */}
          <div
            onClick={() => setCurrentMenu('solver')}
            className="flex items-center gap-1.5 sm:gap-2.5 cursor-pointer group min-w-0"
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-600/30 text-white group-hover:scale-105 transition-transform shrink-0">
              <Calculator className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm sm:text-base md:text-lg font-black text-white tracking-tight truncate">
                  SuperCalculadora
                </h1>
                <span className="hidden md:flex text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase tracking-wide items-center gap-1 shrink-0">
                  <CheckCircle2 className="w-3 h-3" />
                  Passo a Passo
                </span>
              </div>
            </div>
          </div>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* If there's a solution and we are not in notebook mode, quick jump to notebook button on tablet/desktop */}
            {currentSolution && currentMenu === 'solver' && (
              <button
                type="button"
                onClick={() => setCurrentMenu('notebook_steps')}
                className="hidden sm:flex h-8 px-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold items-center gap-1.5 transition-all cursor-pointer animate-pulse select-none"
                title="Abrir Resolução no Caderno"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>Caderno</span>
              </button>
            )}

            {/* Fullscreen API Toggle Button */}
            <button
              type="button"
              id="btn-toggle-fullscreen"
              onClick={toggleFullscreen}
              className={`h-8 px-2 sm:px-2.5 rounded-xl border text-xs font-bold flex items-center gap-1 transition-all cursor-pointer select-none ${
                isFullscreen
                  ? 'bg-purple-950/60 border-purple-500/50 text-purple-300 hover:bg-purple-900/80'
                  : 'bg-slate-900 hover:bg-slate-800 border-slate-700/80 text-slate-300 hover:text-white'
              }`}
              title={isFullscreen ? 'Sair da Tela Cheia' : 'Abrir em Tela Cheia Total (Fullscreen)'}
            >
              {isFullscreen ? (
                <>
                  <Minimize className="w-3.5 h-3.5 text-purple-400" />
                  <span className="hidden md:inline">Janela</span>
                </>
              ) : (
                <>
                  <Maximize className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="hidden md:inline">Tela Cheia</span>
                </>
              )}
            </button>

            {/* Offline / IA Status */}
            <button
              type="button"
              onClick={() => setIsOfflineMode(!isOfflineMode)}
              className={`h-8 px-2 sm:px-2.5 rounded-xl border text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer select-none ${
                isOfflineMode || !isOnline
                  ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'
                  : 'bg-indigo-950/60 border-indigo-500/50 text-indigo-300'
              }`}
              title={isOfflineMode ? 'Motor Offline Ativo' : 'Modo IA Ativo'}
            >
              {isOfflineMode || !isOnline ? (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden md:inline">Offline</span>
                </>
              ) : (
                <>
                  <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="hidden md:inline">IA</span>
                </>
              )}
            </button>

            {/* Menu Drawer Toggle Button */}
            <button
              type="button"
              id="btn-open-menu-drawer"
              onClick={() => setIsMenuDrawerOpen(true)}
              className="h-8 px-2.5 sm:px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-400/40 text-xs font-extrabold flex items-center gap-1 shadow-md shadow-indigo-600/30 transition-all cursor-pointer active:scale-95 select-none shrink-0"
              title="Abrir Menu com todas as Ferramentas"
            >
              <Menu className="w-4 h-4" />
              <span>Menu</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-2.5 sm:p-4 md:p-6 space-y-4 min-w-0 overflow-x-hidden">
        {/* ERROR NOTIFICATION */}
        {error && (
          <div className="p-3.5 rounded-2xl bg-red-950/40 border border-red-800/50 text-red-200 text-xs sm:text-sm flex items-center justify-between gap-3 animate-fade-in">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={() => setError(null)}
              className="text-xs text-red-400 hover:text-red-200 underline font-semibold cursor-pointer"
            >
              Fechar
            </button>
          </div>
        )}

        {/* 1. TELA PRINCIPAL: APENAS CAMPO DE TEXTO + TECLADO (FOCO TOTAL) */}
        {currentMenu === 'solver' && (
          <div className="space-y-3 sm:space-y-4 animate-fade-in w-full max-w-full">
            {/* Input Display Card */}
            <div className="p-3 sm:p-4 md:p-5 rounded-2xl sm:rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-2.5 sm:space-y-3 w-full max-w-full box-border">
              {/* Header inside Input Box */}
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Equação ou Exercício:
                  </span>
                </div>

                {/* Input Controls: Toggle Phone Keyboard & Clear */}
                <div className="flex items-center gap-1.5">
                  {/* Phone Native Keyboard Toggle */}
                  <button
                    type="button"
                    id="btn-toggle-phone-keyboard"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      const next = !useNativeKeyboard;
                      setUseNativeKeyboard(next);
                      if (next) {
                        setTimeout(() => textareaRef.current?.focus(), 50);
                      }
                    }}
                    className={`h-7 sm:h-8 px-2 sm:px-2.5 rounded-lg sm:rounded-xl text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer select-none ${
                      useNativeKeyboard
                        ? 'bg-amber-500 text-slate-950 font-extrabold shadow-sm'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700'
                    }`}
                    title="Ativar/Desativar teclado nativo do celular"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>{useNativeKeyboard ? 'Teclado Celular: Ligado' : 'Teclado Celular'}</span>
                  </button>

                  {/* Quick button to view already calculated notebook solution without pushing layout */}
                  {currentSolution && (
                    <button
                      type="button"
                      id="btn-quick-view-notebook"
                      onClick={() => setCurrentMenu('notebook_steps')}
                      className="h-7 sm:h-8 px-2 sm:px-2.5 rounded-lg sm:rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/50 text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer select-none shrink-0"
                      title="Ver resolução passo a passo no caderno"
                    >
                      <Pencil className="w-3 h-3 text-amber-400" />
                      <span>Caderno ({currentSolution.steps?.length || 1})</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      setInputProblem('');
                      if (textareaRef.current) {
                        try {
                          textareaRef.current.focus({ preventScroll: true });
                        } catch {}
                      }
                    }}
                    className="h-7 sm:h-8 px-2 rounded-lg sm:rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-[11px] font-semibold flex items-center gap-1 transition-all cursor-pointer select-none"
                    title="Limpar campo"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span className="hidden xs:inline">Limpar</span>
                  </button>
                </div>
              </div>

              {/* Textarea Input (inputMode="none" by default so mobile OS keyboard NEVER pops up automatically) */}
              <div className="relative w-full max-w-full">
                <textarea
                  id="math-input"
                  ref={textareaRef}
                  value={inputProblem}
                  onChange={(e) => setInputProblem(e.target.value)}
                  placeholder="Digite sua equação ou use o teclado abaixo (ex: 2x^2 - 8x + 6 = 0)..."
                  rows={2}
                  inputMode={useNativeKeyboard ? 'text' : 'none'}
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl sm:rounded-2xl p-3 sm:p-4 text-sm sm:text-base font-mono text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none shadow-inner box-border max-w-full"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                      e.preventDefault();
                      handleSolve();
                    }
                  }}
                />
              </div>
            </div>

            {/* Scientific Math Keyboard with Sub-menus */}
            <div className="w-full max-w-full">
              <MathKeyboard
                input={inputProblem}
                onInputChange={setInputProblem}
                onSolve={() => handleSolve({ openNotebookDirectly: true })}
                isLoading={isLoading}
                textareaRef={textareaRef}
                useNativeKeyboard={useNativeKeyboard}
              />
            </div>
          </div>
        )}

        {/* 2. TELA DO PASSO A PASSO COM FONTE MANUSCRITA (CADERNO DE PAPEL REALISTA) */}
        {currentMenu === 'notebook_steps' && currentSolution && (
          <div className="animate-fade-in w-full">
            <HandwrittenNotebookDisplay
              solution={currentSolution}
              onBackToCalculator={() => setCurrentMenu('solver')}
              onAskClarification={handleAskClarification}
              onAlternativeMethod={handleAlternativeMethod}
              isLoadingAlternative={isLoadingAlternative}
            />
          </div>
        )}

        {/* 3. MENU: SCANNER DE CÂMERA & FOTOS */}
        {currentMenu === 'scanner' && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setCurrentMenu('solver')}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Voltar à Calculadora</span>
              </button>
            </div>
            <CameraScanner
              onScanImage={(base64, autoSolve) => {
                if (autoSolve) {
                  handleSolve({ imageBase64: base64, autoSolve: true, openNotebookDirectly: true });
                }
              }}
              onTranscribeImage={handleTranscribeImage}
              isLoading={isLoading}
            />
          </div>
        )}

        {/* 4. MENU: ESTÚDIO DE GRÁFICOS 2D */}
        {currentMenu === 'grapher' && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setCurrentMenu('solver')}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Voltar à Calculadora</span>
              </button>
            </div>
            <GrapherStudioView
              onSolveInCalculator={(expr) => {
                setInputProblem(`${expr} = 0`);
                setCurrentMenu('solver');
                handleSolve({ problemOverride: `${expr} = 0`, openNotebookDirectly: true });
              }}
            />
          </div>
        )}

        {/* 5. MENU: SUPER FERRAMENTAS OFFLINE */}
        {currentMenu === 'tools' && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setCurrentMenu('solver')}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Voltar à Calculadora</span>
              </button>
            </div>
            <OfflineToolsView
              onInsertToInput={(eq) => {
                setInputProblem(eq);
                setCurrentMenu('solver');
                handleSolve({ problemOverride: eq, openNotebookDirectly: true });
              }}
            />
          </div>
        )}

        {/* 6. MENU: GUIA DE FÓRMULAS & BIBLIOTECA */}
        {currentMenu === 'formulas' && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setCurrentMenu('solver')}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Voltar à Calculadora</span>
              </button>
            </div>
            <FormulaLibraryView
              onSelectFormula={(latex) => {
                setInputProblem(latex);
                setCurrentMenu('solver');
              }}
            />
          </div>
        )}

        {/* 7. MENU: HISTÓRICO & FAVORITOS */}
        {currentMenu === 'history' && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setCurrentMenu('solver')}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Voltar à Calculadora</span>
              </button>
            </div>
            <HistoryView
              history={history}
              onSelectSolution={(sol) => {
                setCurrentSolution(sol);
                setCurrentMenu('notebook_steps');
              }}
              onClearHistory={handleClearHistory}
              favorites={favorites}
              onToggleFavorite={handleToggleFavorite}
            />
          </div>
        )}
      </main>

      {/* SLIDE-OVER DRAWER / MODAL FOR ALL TOOLS (ESCONDIDO ATÉ CLICAR EM "MENU") */}
      {isMenuDrawerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div
            className="fixed inset-0"
            onClick={() => setIsMenuDrawerOpen(false)}
          />
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto z-10">
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
                  <Menu className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">Menu de Ferramentas</h3>
                  <p className="text-xs text-slate-400">Selecione uma ferramenta ou retorne à calculadora</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMenuDrawerOpen(false)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tool Items Grid */}
            <div className="grid grid-cols-1 gap-2.5">
              {drawerMenuItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentMenu === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setCurrentMenu(item.id);
                      setIsMenuDrawerOpen(false);
                    }}
                    className={`p-3.5 rounded-2xl text-left flex items-start gap-3 transition-all cursor-pointer border ${
                      isActive
                        ? 'bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-600/30'
                        : 'bg-slate-950/80 hover:bg-slate-800/80 text-slate-300 border-slate-800'
                    }`}
                  >
                    <div
                      className={`p-2.5 rounded-xl shrink-0 ${
                        isActive ? 'bg-white/20 text-white' : 'bg-slate-900 text-indigo-400 border border-slate-800'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-white">{item.name}</span>
                        {item.badge && (
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
                              isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-300 border border-slate-700'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <p className={`text-xs mt-0.5 ${isActive ? 'text-indigo-100' : 'text-slate-400'}`}>
                        {item.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Quick Settings within Drawer */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold">
                <Settings2 className="w-4 h-4 text-indigo-400" />
                <span>Configurações Rápidas:</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={toggleFullscreen}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1 cursor-pointer transition-all ${
                    isFullscreen
                      ? 'bg-purple-950/60 border-purple-500 text-purple-300'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:text-white'
                  }`}
                >
                  {isFullscreen ? <Minimize className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5" />}
                  <span>{isFullscreen ? 'Janela Normal' : 'Tela Cheia Total'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsOfflineMode(!isOfflineMode)}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1 cursor-pointer transition-all ${
                    isOfflineMode
                      ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300'
                      : 'bg-slate-950 border-slate-800 text-slate-300'
                  }`}
                >
                  {isOfflineMode ? <WifiOff className="w-3.5 h-3.5" /> : <Wifi className="w-3.5 h-3.5" />}
                  <span>{isOfflineMode ? 'Offline (0ms)' : 'Online (IA)'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDetailLevel(detailLevel === 'detailed' ? 'concise' : 'detailed')}
                  className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 text-xs font-semibold flex items-center gap-1 cursor-pointer hover:text-white"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span>{detailLevel === 'detailed' ? 'Passos Detalhados' : 'Passos Diretos'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
