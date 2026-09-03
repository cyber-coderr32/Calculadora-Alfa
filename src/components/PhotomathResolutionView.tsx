import React, { useState, useEffect, useRef } from 'react';
import { MathSolution } from '../types';
import { MathRenderer, MixedTextRenderer } from './MathRenderer';
import { formatSolutionSteps, FormattedStepView } from '../utils/stepFormatter';
import { toPng, toCanvas } from 'html-to-image';
import jsPDF from 'jspdf';
import {
  ArrowLeft,
  ArrowRight,
  ArrowDown,
  RotateCcw,
  ChevronDown,
  X,
  Maximize2,
  Share2,
  Edit3,
  Check,
  CheckCircle2,
  Lightbulb,
  MessageSquare,
  Sparkles,
  BookOpen,
  Volume2,
  VolumeX,
  Download,
  Image as ImageIcon,
  FileText,
  FileCode,
  Printer,
  Loader2,
  HelpCircle,
} from 'lucide-react';

interface PhotomathResolutionViewProps {
  solution: MathSolution;
  onBackToCalculator: () => void;
  onEditProblem?: () => void;
  onAskClarification: (stepIndex: number, question: string) => void;
  onSwitchToNotebook?: () => void;
}

export const PhotomathResolutionView: React.FC<PhotomathResolutionViewProps> = ({
  solution,
  onBackToCalculator,
  onEditProblem,
  onAskClarification,
  onSwitchToNotebook,
}) => {
  const formattedSteps: FormattedStepView[] = formatSolutionSteps(solution);
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);
  const [subStepIndexMap, setSubStepIndexMap] = useState<Record<number, number>>({});
  const [activeClarifyStep, setActiveClarifyStep] = useState<number | null>(null);
  const [clarifyQuestion, setClarifyQuestion] = useState('');
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [isExporting, setIsExporting] = useState<'png' | 'pdf' | 'txt' | null>(null);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  const activeCardRef = useRef<HTMLDivElement | null>(null);

  // Auto scroll to active step when it changes
  useEffect(() => {
    if (activeCardRef.current) {
      activeCardRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [activeStepIndex]);

  const currentSubStepIndex = subStepIndexMap[activeStepIndex] || 0;
  const currentStep = formattedSteps[activeStepIndex];
  const totalSteps = formattedSteps.length;

  const currentSubStep = currentStep?.subSteps?.[currentSubStepIndex] || {
    beforeLatex: currentStep?.beforeLatex || '',
    afterLatex: currentStep?.afterLatex || '',
    explanation: currentStep?.explanation || '',
    tip: currentStep?.tipOrRule,
  };

  const hasSubSteps = (currentStep?.subSteps?.length || 0) > 1;
  const totalSubSteps = currentStep?.subSteps?.length || 1;

  // Handle advancing (Next button)
  const handleNext = () => {
    if (hasSubSteps && currentSubStepIndex < totalSubSteps - 1) {
      // Advance to next sub-step in the same step
      setSubStepIndexMap((prev) => ({
        ...prev,
        [activeStepIndex]: currentSubStepIndex + 1,
      }));
    } else if (activeStepIndex < totalSteps - 1) {
      // Advance to next main step
      setActiveStepIndex(activeStepIndex + 1);
    } else {
      // Final step reached, scroll to final answer
      const finalSection = document.getElementById('photomath-final-solution');
      if (finalSection) {
        finalSection.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  // Handle going back (Previous sub-step)
  const handlePrevSubStep = () => {
    if (currentSubStepIndex > 0) {
      setSubStepIndexMap((prev) => ({
        ...prev,
        [activeStepIndex]: currentSubStepIndex - 1,
      }));
    } else if (activeStepIndex > 0) {
      const prevStepIdx = activeStepIndex - 1;
      const prevSubStepCount = formattedSteps[prevStepIdx]?.subSteps?.length || 1;
      setActiveStepIndex(prevStepIdx);
      setSubStepIndexMap((prev) => ({
        ...prev,
        [prevStepIdx]: prevSubStepCount - 1,
      }));
    }
  };

  // Handle Restart walkthrough
  const handleRestart = () => {
    setActiveStepIndex(0);
    setSubStepIndexMap({});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Generate full text representation
  const getFullTextSolution = () => {
    let text = `=== RESOLUÇÃO PASSO A PASSO: ${solution.problemTitle.toUpperCase()} ===\n`;
    text += `Categoria: ${solution.problemType}\n`;
    text += `Enunciado: ${solution.originalInput}\n`;
    text += `Resumo: ${solution.summary}\n\n`;

    if (solution.givenVariables && solution.givenVariables.length > 0) {
      text += `--- DADOS DO PROBLEMA ---\n`;
      solution.givenVariables.forEach((v) => {
        text += `• ${v.name}: ${v.value}${v.description ? ` (${v.description})` : ''}\n`;
      });
      text += `\n`;
    }

    if (solution.formulasUsed && solution.formulasUsed.length > 0) {
      text += `--- FÓRMULAS & PROPRIEDADES ---\n`;
      solution.formulasUsed.forEach((f) => {
        text += `• ${f.name}: ${f.latex}${f.explanation ? ` - ${f.explanation}` : ''}\n`;
      });
      text += `\n`;
    }

    text += `--- PASSOS DETALHADOS ---\n`;
    formattedSteps.forEach((s, idx) => {
      text += `\n[Passo ${idx + 1}] ${s.title}\n`;
      text += `Explicação: ${s.explanation}\n`;
      if (s.beforeLatex) text += `Expressão: ${s.beforeLatex}\n`;
      if (s.afterLatex && s.afterLatex !== s.beforeLatex) text += `Resultado do Passo: ${s.afterLatex}\n`;
      if (s.tipOrRule) text += `Dica: ${s.tipOrRule}\n`;
      if (s.subSteps && s.subSteps.length > 1) {
        s.subSteps.forEach((sub, subIdx) => {
          text += `  -> Subpasso ${subIdx + 1}: ${sub.explanation} [${sub.beforeLatex || ''} => ${sub.afterLatex || ''}]\n`;
        });
      }
    });

    text += `\n--- RESPOSTA FINAL ---\n`;
    text += `Resultado Exato: ${solution.finalAnswer.exact}\n`;
    if (solution.finalAnswer.approximate) {
      text += `Valor Aproximado: ${solution.finalAnswer.approximate}\n`;
    }
    if (solution.finalAnswer.explanation) {
      text += `Conclusão: ${solution.finalAnswer.explanation}\n`;
    }

    if (solution.verification) {
      text += `\n--- PROVA REAL / VERIFICAÇÃO ---\n`;
      text += `Cálculo: ${solution.verification.mathExpression}\n`;
      if (solution.verification.explanation) {
        text += `Nota: ${solution.verification.explanation}\n`;
      }
    }

    return text;
  };

  // Handle Share / Copy solution
  const handleShare = () => {
    const text = getFullTextSolution();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  // Export full resolution to PNG (Centered with theme awareness)
  const handleExportPNG = async () => {
    const element = document.getElementById('photomath-export-container');
    if (!element) return;

    setIsExporting('png');
    setExportError(null);
    try {
      const isDark = document.documentElement.classList.contains('dark');
      const bgColor = isDark ? '#0f172a' : '#ffffff';
      const fullWidth = Math.max(element.scrollWidth, element.offsetWidth, 720);
      const fullHeight = Math.max(element.scrollHeight, element.offsetHeight);

      const dataUrl = await toPng(element, {
        pixelRatio: 2,
        width: fullWidth,
        height: fullHeight,
        canvasWidth: fullWidth * 2,
        canvasHeight: fullHeight * 2,
        backgroundColor: bgColor,
        skipFonts: true,
        fontEmbedCSS: '',
        cacheBust: true,
        style: {
          transform: 'none',
          maxHeight: 'none',
          height: `${fullHeight}px`,
          width: `${fullWidth}px`,
          overflow: 'visible',
          margin: '0 auto',
        },
        filter: (node) => {
          if (node instanceof HTMLElement) {
            return (
              node.getAttribute('data-export-ignore') !== 'true' &&
              node.getAttribute('data-html2canvas-ignore') !== 'true'
            );
          }
          return true;
        },
      });

      const safeTitle = (solution.problemTitle || 'resolucao_alfa')
        .toLowerCase()
        .replace(/[^a-z0-9_-]/g, '_')
        .slice(0, 35);
      const link = document.createElement('a');
      link.download = `resolucao_${safeTitle}.png`;
      link.href = dataUrl;
      link.click();
      setExportSuccess('Foto da resolução baixada com sucesso!');
      setTimeout(() => setExportSuccess(null), 3000);
    } catch (error) {
      console.error('Erro ao exportar PNG:', error);
      setExportError('Falha ao gerar imagem PNG.');
      setTimeout(() => setExportError(null), 4000);
    } finally {
      setIsExporting(null);
    }
  };

  // Export full resolution to multi-page PDF (Centered horizontally with balanced page margins)
  const handleExportPDF = async () => {
    const element = document.getElementById('photomath-export-container');
    if (!element) return;

    setIsExporting('pdf');
    setExportError(null);
    try {
      const isDark = document.documentElement.classList.contains('dark');
      const bgColor = isDark ? '#0f172a' : '#ffffff';
      const fullWidth = Math.max(element.scrollWidth, element.offsetWidth, 720);
      const fullHeight = Math.max(element.scrollHeight, element.offsetHeight);

      const fullCanvas = await toCanvas(element, {
        pixelRatio: 2,
        width: fullWidth,
        height: fullHeight,
        canvasWidth: fullWidth * 2,
        canvasHeight: fullHeight * 2,
        backgroundColor: bgColor,
        skipFonts: true,
        fontEmbedCSS: '',
        cacheBust: true,
        style: {
          transform: 'none',
          maxHeight: 'none',
          height: `${fullHeight}px`,
          width: `${fullWidth}px`,
          overflow: 'visible',
          margin: '0 auto',
        },
        filter: (node) => {
          if (node instanceof HTMLElement) {
            return (
              node.getAttribute('data-export-ignore') !== 'true' &&
              node.getAttribute('data-html2canvas-ignore') !== 'true'
            );
          }
          return true;
        },
      });

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      // Centered margins (12mm on left and right)
      const marginX = 12;
      const marginY = 12;
      const printableWidth = pdfWidth - marginX * 2;
      const printableHeight = pdfHeight - marginY * 2;

      const pageCanvasHeight = (fullCanvas.width * printableHeight) / printableWidth;
      const totalPages = Math.ceil(fullCanvas.height / pageCanvasHeight);

      for (let pageIdx = 0; pageIdx < totalPages; pageIdx++) {
        if (pageIdx > 0) {
          pdf.addPage();
        }

        const currentSliceHeight = Math.min(
          pageCanvasHeight,
          fullCanvas.height - pageIdx * pageCanvasHeight
        );

        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = fullCanvas.width;
        pageCanvas.height = currentSliceHeight;

        const ctx = pageCanvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = bgColor;
          ctx.fillRect(0, 0, pageCanvas.width, currentSliceHeight);

          ctx.drawImage(
            fullCanvas,
            0,
            pageIdx * pageCanvasHeight,
            fullCanvas.width,
            currentSliceHeight,
            0,
            0,
            fullCanvas.width,
            currentSliceHeight
          );

          const renderedHeightMm = (currentSliceHeight / pageCanvasHeight) * printableHeight;
          const actualY = totalPages === 1 && renderedHeightMm < printableHeight
            ? (pdfHeight - renderedHeightMm) / 2
            : marginY;

          const imgData = pageCanvas.toDataURL('image/jpeg', 0.95);
          pdf.addImage(imgData, 'JPEG', marginX, actualY, printableWidth, renderedHeightMm, undefined, 'FAST');
        }
      }

      const safeTitle = (solution.problemTitle || 'resolucao_alfa')
        .toLowerCase()
        .replace(/[^a-z0-9_-]/g, '_')
        .slice(0, 35);
      pdf.save(`resolucao_${safeTitle}.pdf`);
      setExportSuccess(`PDF completo gerado e centralizado (${totalPages} pág.)!`);
      setTimeout(() => setExportSuccess(null), 3000);
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      setExportError('Falha ao gerar arquivo PDF.');
      setTimeout(() => setExportError(null), 4000);
    } finally {
      setIsExporting(null);
    }
  };

  // Download complete text file (.txt)
  const handleExportText = () => {
    try {
      setIsExporting('txt');
      const text = getFullTextSolution();
      const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const safeTitle = (solution.problemTitle || 'resolucao_matematica')
        .toLowerCase()
        .replace(/[^a-z0-9_-]/g, '_')
        .slice(0, 35);
      link.download = `resolucao_${safeTitle}.txt`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
      setExportSuccess('Arquivo TXT baixado com sucesso!');
      setTimeout(() => setExportSuccess(null), 3000);
    } catch (e) {
      setExportError('Erro ao baixar arquivo de texto.');
      setTimeout(() => setExportError(null), 4000);
    } finally {
      setIsExporting(null);
    }
  };

  // Print solution
  const handlePrint = () => {
    window.print();
  };

  // Text-To-Speech
  const handleToggleSpeech = () => {
    if (isSpeaking) {
      window.speechSynthesis?.cancel();
      setIsSpeaking(false);
      return;
    }
    if (!('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();
    let speech = `Resolução de ${solution.problemTitle || 'exercício'}. `;
    if (currentStep) {
      speech += `Passo ${activeStepIndex + 1}: ${currentStep.title}. ${currentSubStep.explanation}. `;
    }
    const utter = new SpeechSynthesisUtterance(speech);
    utter.lang = 'pt-BR';
    utter.rate = 0.95;
    utter.onend = () => setIsSpeaking(false);
    utter.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utter);
    setIsSpeaking(true);
  };

  const submitClarification = (stepIndex: number) => {
    if (!clarifyQuestion.trim()) return;
    onAskClarification(stepIndex, clarifyQuestion);
    setClarifyQuestion('');
    setActiveClarifyStep(null);
  };

  return (
    <div className="w-full max-w-xl mx-auto min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col pb-36 animate-fade-in select-none sm:select-auto">
      {/* 1. TOP HEADER (Photomath Style + Quick Export Buttons) */}
      <div className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-3 sm:px-4 py-2.5 flex items-center justify-between shadow-xs">
        <button
          type="button"
          onClick={onBackToCalculator}
          className="p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
          title="Voltar à calculadora"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>

        <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
          Resolução
        </h2>

        {/* Action Buttons Top Right: PNG, PDF, Caderno, Audio */}
        <div className="flex items-center gap-1.5">
          {/* Quick PNG Button */}
          <button
            type="button"
            id="btn-top-export-png"
            onClick={handleExportPNG}
            disabled={Boolean(isExporting)}
            className="h-8 px-2 sm:px-2.5 rounded-xl bg-emerald-950/70 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/50 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer select-none active:scale-95 disabled:opacity-50"
            title="Baixar resolução em imagem PNG de alta resolução"
          >
            {isExporting === 'png' ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <ImageIcon className="w-3.5 h-3.5" />
            )}
            <span className="text-[11px] font-bold">PNG</span>
          </button>

          {/* Quick PDF Button */}
          <button
            type="button"
            id="btn-top-export-pdf"
            onClick={handleExportPDF}
            disabled={Boolean(isExporting)}
            className="h-8 px-2 sm:px-2.5 rounded-xl bg-rose-950/70 hover:bg-rose-900 text-rose-300 border border-rose-500/50 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer select-none active:scale-95 disabled:opacity-50"
            title="Baixar resolução em documento PDF formatado"
          >
            {isExporting === 'pdf' ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <FileText className="w-3.5 h-3.5" />
            )}
            <span className="text-[11px] font-bold">PDF</span>
          </button>

          {onSwitchToNotebook && (
            <button
              type="button"
              onClick={onSwitchToNotebook}
              className="h-8 px-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700/50 text-xs font-bold transition-all cursor-pointer hidden xs:flex items-center"
              title="Alternar para visão de caderno manuscrito"
            >
              Caderno
            </button>
          )}

          <button
            type="button"
            onClick={handleToggleSpeech}
            className={`p-2 rounded-full transition-colors cursor-pointer ${
              isSpeaking
                ? 'bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400 animate-pulse'
                : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
            }`}
            title="Ouvir explicação do passo"
          >
            {isSpeaking ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* FEEDBACK TOAST NOTIFICATIONS */}
      {exportSuccess && (
        <div className="mx-4 mt-2 p-2.5 rounded-xl bg-emerald-900/80 border border-emerald-500/60 text-emerald-200 text-xs font-bold flex items-center gap-2 animate-fade-in shadow-md">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{exportSuccess}</span>
        </div>
      )}
      {exportError && (
        <div className="mx-4 mt-2 p-2.5 rounded-xl bg-rose-900/80 border border-rose-500/60 text-rose-200 text-xs font-bold flex items-center gap-2 animate-fade-in shadow-md">
          <X className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{exportError}</span>
        </div>
      )}

      {/* 2. STEPS LIST CONTAINER (EXPORT TARGET) */}
      <div id="photomath-export-container" className="p-4 space-y-4 flex-1">
        {/* Solution Title and Original Expression header */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-extrabold uppercase tracking-wider text-rose-600 dark:text-rose-400">
              {solution.problemType || 'Problema Matemático'}
            </span>
            <span className="text-xs font-medium text-slate-400">
              {solution.steps.length} passos
            </span>
          </div>
          <div className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white font-mono">
            <MathRenderer math={solution.originalInput} block />
          </div>
          {solution.summary && (
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium">
              {solution.summary}
            </p>
          )}
        </div>

        {/* Steps Loop */}
        {formattedSteps.map((step, index) => {
          const isActive = index === activeStepIndex;
          const isClarifying = activeClarifyStep === index;

          if (isActive) {
            // ==================== EXPANDED ACTIVE STEP CARD ====================
            return (
              <div
                key={index}
                ref={activeCardRef}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-md transition-all duration-300 relative space-y-5"
              >
                {/* Step header tag */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-rose-600 text-white font-bold text-xs flex items-center justify-center">
                      {index + 1}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {step.title}
                    </h4>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => setIsZoomed(!isZoomed)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Expandir visualização"
                      data-export-ignore="true"
                    >
                      <Maximize2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveStepIndex(-1)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Recolher passo"
                      data-export-ignore="true"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Top Math Expression (Before) */}
                <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white overflow-x-auto py-1 font-mono tracking-wide">
                  <MathRenderer math={currentSubStep.beforeLatex || step.beforeLatex} block />
                </div>

                {/* Middle Pedagogical Flow: Arrow Down on left + Rule Explanation on right */}
                <div className="flex items-start gap-3 sm:gap-4 my-2 pl-2">
                  <div className="flex flex-col items-center pt-1 shrink-0 text-slate-400">
                    <div className="w-0.5 h-6 bg-slate-300 dark:bg-slate-700" />
                    <ArrowDown className="w-4 h-4 text-slate-400" />
                  </div>

                  <div className="flex-1 space-y-2">
                    <div className="text-sm sm:text-base font-semibold text-slate-800 dark:text-slate-200 leading-snug">
                      <MixedTextRenderer text={currentSubStep.explanation || step.explanation} />
                    </div>

                    {/* Teacher Tip / Property */}
                    {(currentSubStep.tip || step.tipOrRule) && (
                      <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/40 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-2">
                        <Lightbulb className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                        <span>{currentSubStep.tip || step.tipOrRule}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Math Expression (After) */}
                <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white overflow-x-auto py-1 font-mono tracking-wide">
                  <MathRenderer math={currentSubStep.afterLatex || step.afterLatex} block />
                </div>

                {/* Sub-step carousel pagination controls (if multi sub-steps) */}
                <div
                  data-export-ignore="true"
                  className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between"
                >
                  <div className="flex items-center gap-1">
                    {hasSubSteps ? (
                      <button
                        type="button"
                        onClick={handlePrevSubStep}
                        disabled={currentSubStepIndex === 0 && activeStepIndex === 0}
                        className="p-1.5 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 cursor-pointer"
                        title="Sub-passo anterior"
                      >
                        <ArrowLeft className="w-4 h-4" />
                      </button>
                    ) : (
                      <span className="text-xs font-semibold text-slate-400">
                        Passo {index + 1} de {totalSteps}
                      </span>
                    )}
                  </div>

                  {/* Sub-steps indicator dots */}
                  {hasSubSteps && (
                    <div className="flex items-center gap-1.5">
                      {[...Array(totalSubSteps)].map((_, dotIdx) => (
                        <button
                          key={dotIdx}
                          type="button"
                          onClick={() =>
                            setSubStepIndexMap((prev) => ({
                              ...prev,
                              [activeStepIndex]: dotIdx,
                            }))
                          }
                          className={`w-2.5 h-2.5 rounded-full transition-all cursor-pointer ${
                            dotIdx === currentSubStepIndex
                              ? 'bg-rose-600 dark:bg-rose-500 scale-125'
                              : 'bg-slate-300 dark:bg-slate-700 hover:bg-slate-400'
                          }`}
                          title={`Sub-passo ${dotIdx + 1}`}
                        />
                      ))}
                    </div>
                  )}

                  {/* Right Navigation arrow */}
                  <div className="flex items-center gap-1">
                    {hasSubSteps && currentSubStepIndex < totalSubSteps - 1 ? (
                      <button
                        type="button"
                        onClick={handleNext}
                        className="p-1.5 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                        title="Próximo sub-passo"
                      >
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleNext}
                        className="p-1.5 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                        title="Próximo passo"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Inline Tutor clarification question */}
                <div data-export-ignore="true" className="pt-1">
                  <button
                    type="button"
                    onClick={() => setActiveClarifyStep(isClarifying ? null : index)}
                    className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Ficou com dúvida no Passo {index + 1}? Pergunte ao Tutor</span>
                  </button>

                  {isClarifying && (
                    <div className="mt-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-rose-300 dark:border-rose-900/60 space-y-2 animate-fade-in">
                      <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                        O que você gostaria de entender melhor no Passo {index + 1}?
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={clarifyQuestion}
                          onChange={(e) => setClarifyQuestion(e.target.value)}
                          placeholder="Ex: Por que multiplicou por 2? De onde veio o sinal?"
                          className="flex-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') submitClarification(index);
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => submitClarification(index)}
                          disabled={!clarifyQuestion.trim()}
                          className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md disabled:opacity-50 transition-all cursor-pointer"
                        >
                          Explicar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          } else {
            // ==================== COLLAPSED STEP ITEM ====================
            return (
              <div
                key={index}
                onClick={() => setActiveStepIndex(index)}
                className="bg-white/70 dark:bg-slate-900/60 hover:bg-white dark:hover:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 rounded-2xl p-4 transition-all duration-200 cursor-pointer flex items-center justify-between group"
              >
                <div className="space-y-0.5 flex-1 min-w-0 pr-2">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[10px] flex items-center justify-center">
                      {index + 1}
                    </span>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">
                      {step.title}
                    </span>
                  </div>
                  <div className="text-base sm:text-lg font-bold text-slate-700 dark:text-slate-300 font-mono truncate pl-7">
                    <MathRenderer math={step.beforeLatex || step.mathExpression} inline />
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate pl-7">
                    {step.explanation}
                  </p>
                </div>

                <ChevronDown className="w-5 h-5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 shrink-0 transition-transform" />
              </div>
            );
          }
        })}

        {/* 3. FINAL SOLUTION SECTION (Solução) */}
        <div
          id="photomath-final-solution"
          className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-rose-600 dark:text-rose-500" />
            <h3 className="text-lg font-extrabold text-rose-600 dark:text-rose-500 tracking-tight">
              Solução
            </h3>
          </div>

          {/* Solution Highlight Box */}
          <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border-2 border-rose-500/80 shadow-md space-y-2">
            <div className="text-center text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white font-mono overflow-x-auto py-1">
              <MathRenderer math={solution.finalAnswer.exact} block />
            </div>

            {solution.finalAnswer.approximate && (
              <div className="text-center text-sm font-semibold text-slate-500 dark:text-slate-400 font-mono">
                Valor aproximado: <MathRenderer math={solution.finalAnswer.approximate} inline />
              </div>
            )}

            {solution.finalAnswer.explanation && (
              <div className="text-center text-sm font-medium text-slate-700 dark:text-slate-300 pt-1">
                <MixedTextRenderer text={solution.finalAnswer.explanation} />
              </div>
            )}
          </div>

          {/* Verification Box if present */}
          {solution.verification && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-300 dark:border-emerald-800/40 text-xs text-emerald-900 dark:text-emerald-300 flex items-center justify-between gap-2">
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-1.5 flex-wrap font-semibold">
                  <span>✓ Verificado matematicamente:</span>
                  <MathRenderer math={solution.verification.mathExpression} inline />
                </div>
                {solution.verification.explanation && (
                  <div className="text-xs text-emerald-800 dark:text-emerald-400">
                    <MixedTextRenderer text={solution.verification.explanation} />
                  </div>
                )}
              </div>
              <span className="font-bold bg-emerald-100 dark:bg-emerald-900 px-2 py-0.5 rounded-full shrink-0">
                Correto
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 5. FLOATING BOTTOM ACTION BAR (Photomath Style: Restart, Next/Solution, Share & Edit) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-gradient-to-t from-white via-white to-transparent dark:from-slate-950 dark:via-slate-950 dark:to-transparent pt-6 pb-4 px-3 sm:px-4">
        <div className="max-w-xl mx-auto flex flex-col gap-2.5">
          {/* Main Controls Row: Restart Circle + Large Crimson Next Button */}
          <div className="flex items-center justify-between gap-3">
            {/* Restart button */}
            <button
              type="button"
              onClick={handleRestart}
              className="w-12 h-12 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer shrink-0"
              title="Recomeçar passo a passo desde o início"
            >
              <RotateCcw className="w-5 h-5" />
            </button>

            {/* Primary Action Button: "Seguinte" or "Solução" */}
            <button
              type="button"
              onClick={handleNext}
              className="flex-1 h-12 rounded-full bg-rose-600 hover:bg-rose-500 active:scale-98 text-white font-extrabold text-base flex items-center justify-center gap-2 shadow-lg shadow-rose-600/30 transition-all cursor-pointer"
            >
              <span>
                {activeStepIndex >= totalSteps - 1 ? 'Ver Solução Final' : 'Seguinte'}
              </span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>

          {/* Action Pills Row: Partilhar & Editar */}
          <div className="flex items-center justify-center gap-2 flex-wrap">
            {/* Share / Copy */}
            <button
              type="button"
              id="btn-bar-share"
              onClick={handleShare}
              className="px-4 py-2 rounded-full bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copiado!' : 'Partilhar'}</span>
            </button>

            {/* Edit problem */}
            <button
              type="button"
              id="btn-bar-edit"
              onClick={() => {
                if (onEditProblem) {
                  onEditProblem();
                } else {
                  onBackToCalculator();
                }
              }}
              className="px-4 py-2 rounded-full bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Editar</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

