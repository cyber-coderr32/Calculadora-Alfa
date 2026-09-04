import React, { useState } from 'react';
import { toPng, toCanvas } from 'html-to-image';
import jsPDF from 'jspdf';
import { MathSolution, MathStep } from '../types';
import { MathRenderer, MixedTextRenderer } from './MathRenderer';
import {
  BookOpen,
  ArrowLeft,
  Volume2,
  VolumeX,
  Copy,
  Check,
  Printer,
  Sparkles,
  RotateCw,
  Lightbulb,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Share2,
  HelpCircle,
  Pencil,
  FileText,
  Image as ImageIcon,
  Download,
  Loader2,
  FileCode,
} from 'lucide-react';

interface HandwrittenNotebookDisplayProps {
  solution: MathSolution;
  onBackToCalculator: () => void;
  onAskClarification: (stepIndex: number, question: string) => void;
  onAlternativeMethod: () => void;
  isLoadingAlternative?: boolean;
  onSwitchToPhotomath?: () => void;
}

export const HandwrittenNotebookDisplay: React.FC<HandwrittenNotebookDisplayProps> = ({
  solution,
  onBackToCalculator,
  onAskClarification,
  onAlternativeMethod,
  isLoadingAlternative = false,
  onSwitchToPhotomath,
}) => {
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [paperStyle, setPaperStyle] = useState<'grid' | 'lined' | 'dots' | 'dark'>('grid');
  const [inkColor, setInkColor] = useState<'blue' | 'black' | 'pencil' | 'purple'>('blue');
  const [activeClarifyStep, setActiveClarifyStep] = useState<number | null>(null);
  const [clarifyQuestion, setClarifyQuestion] = useState('');
  const [isExporting, setIsExporting] = useState<'png' | 'pdf' | 'txt' | null>(null);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  const getFullTextSolution = () => {
    let text = `=== CADERNO DE MATEMÁTICA: ${solution.problemTitle.toUpperCase()} ===\n`;
    text += `Categoria: ${solution.problemType}\n`;
    text += `Enunciado: ${solution.originalInput}\n`;
    text += `Objetivo: ${solution.summary}\n\n`;

    if (solution.givenVariables && solution.givenVariables.length > 0) {
      text += `--- DADOS IDENTIFICADOS ---\n`;
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

    text += `--- RESOLUÇÃO PASSO A PASSO COMPLETA ---\n`;
    solution.steps.forEach((s, idx) => {
      text += `\n[Passo ${s.stepNumber || idx + 1}] ${s.title}\n`;
      text += `Explicação: ${s.explanation}\n`;
      if (s.mathExpression) {
        text += `Cálculo: ${s.mathExpression}\n`;
      }
      if (s.tipOrRule) {
        text += `Dica do Professor: ${s.tipOrRule}\n`;
      }
      if (s.subSteps && s.subSteps.length > 0) {
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
      text += `Método: ${solution.verification.method}\n`;
      text += `Cálculo: ${solution.verification.mathExpression}\n`;
      if (solution.verification.explanation) {
        text += `Nota: ${solution.verification.explanation}\n`;
      }
    }

    return text;
  };

  // Copy full solution text
  const handleCopySolution = () => {
    const text = getFullTextSolution();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
      setExportSuccess('Texto completo baixado com sucesso!');
      setTimeout(() => setExportSuccess(null), 3000);
    } catch (e) {
      setExportError('Erro ao baixar arquivo de texto.');
      setTimeout(() => setExportError(null), 4000);
    } finally {
      setIsExporting(null);
    }
  };

  // Text-To-Speech reader in Portuguese
  const handleToggleSpeech = () => {
    if (isSpeaking) {
      window.speechSynthesis?.cancel();
      setIsSpeaking(false);
      return;
    }

    if (!('speechSynthesis' in window)) {
      alert('Seu dispositivo não suporta síntese de voz.');
      return;
    }

    window.speechSynthesis.cancel();

    let fullSpeech = `${solution.problemTitle}. ${solution.summary}. `;
    solution.steps.forEach((s) => {
      fullSpeech += `Passo ${s.stepNumber}: ${s.title}. ${s.explanation}. `;
    });
    fullSpeech += `Resposta final: ${solution.finalAnswer.explanation}`;

    const utterance = new SpeechSynthesisUtterance(fullSpeech);
    utterance.lang = 'pt-BR';
    utterance.rate = 0.95;

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  // Native Print
  const handlePrint = () => {
    window.print();
  };

  // Export to complete high-resolution PNG
  const handleExportPNG = async () => {
    const element = document.getElementById('notebook-sheet');
    if (!element) return;
    setIsExporting('png');
    setExportError(null);
    try {
      const fullWidth = Math.max(element.scrollWidth, element.offsetWidth, 800);
      const fullHeight = Math.max(element.scrollHeight, element.offsetHeight);

      const dataUrl = await toPng(element, {
        pixelRatio: 2,
        width: fullWidth,
        height: fullHeight,
        canvasWidth: fullWidth * 2,
        canvasHeight: fullHeight * 2,
        backgroundColor: paperStyle === 'dark' ? '#0b1120' : '#faf8f5',
        skipFonts: true,
        fontEmbedCSS: '',
        cacheBust: true,
        style: {
          transform: 'none',
          maxHeight: 'none',
          height: `${fullHeight}px`,
          width: `${fullWidth}px`,
          overflow: 'visible',
          margin: '0',
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
      const link = document.createElement('a');
      const safeTitle = (solution.problemTitle || 'resolucao_matematica')
        .toLowerCase()
        .replace(/[^a-z0-9_-]/g, '_')
        .slice(0, 35);
      link.download = `resolucao_${safeTitle}.png`;
      link.href = dataUrl;
      link.click();
      setExportSuccess('PNG completo baixado com sucesso!');
      setTimeout(() => setExportSuccess(null), 3000);
    } catch (error) {
      console.error('Erro ao exportar PNG:', error);
      setExportError('Não foi possível exportar a imagem PNG. Tente novamente.');
      setTimeout(() => setExportError(null), 4000);
    } finally {
      setIsExporting(null);
    }
  };

  // Export to complete multi-page PDF with precise page-by-page slicing
  const handleExportPDF = async () => {
    const element = document.getElementById('notebook-sheet');
    if (!element) return;
    setIsExporting('pdf');
    setExportError(null);
    try {
      const fullWidth = Math.max(element.scrollWidth, element.offsetWidth, 800);
      const fullHeight = Math.max(element.scrollHeight, element.offsetHeight);

      const fullCanvas = await toCanvas(element, {
        pixelRatio: 2,
        width: fullWidth,
        height: fullHeight,
        canvasWidth: fullWidth * 2,
        canvasHeight: fullHeight * 2,
        backgroundColor: paperStyle === 'dark' ? '#0b1120' : '#faf8f5',
        skipFonts: true,
        fontEmbedCSS: '',
        cacheBust: true,
        style: {
          transform: 'none',
          maxHeight: 'none',
          height: `${fullHeight}px`,
          width: `${fullWidth}px`,
          overflow: 'visible',
          margin: '0',
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

      // Determine canvas slice height corresponding to printable area ratio
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
          ctx.fillStyle = paperStyle === 'dark' ? '#0b1120' : '#faf8f5';
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
      setExportError('Não foi possível gerar o arquivo PDF. Tente novamente.');
      setTimeout(() => setExportError(null), 4000);
    } finally {
      setIsExporting(null);
    }
  };

  const submitClarification = (stepIndex: number) => {
    if (!clarifyQuestion.trim()) return;
    onAskClarification(stepIndex, clarifyQuestion);
    setClarifyQuestion('');
    setActiveClarifyStep(null);
  };

  const paperBgClass =
    paperStyle === 'grid'
      ? 'notebook-paper-grid text-slate-900 border-amber-200/90 shadow-2xl pl-8 sm:pl-12'
      : paperStyle === 'lined'
      ? 'notebook-paper-lined text-slate-900 border-red-200/90 shadow-2xl pl-12 sm:pl-18'
      : paperStyle === 'dots'
      ? 'notebook-paper-dots text-slate-900 border-amber-200/90 shadow-2xl pl-8 sm:pl-12'
      : 'notebook-paper-dark text-slate-100 border-slate-800 shadow-2xl pl-8 sm:pl-12';

  const inkClass =
    inkColor === 'blue'
      ? 'ink-blue'
      : inkColor === 'black'
      ? 'ink-black'
      : inkColor === 'pencil'
      ? 'ink-pencil'
      : 'ink-purple';

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4 animate-fade-in pb-28 sm:pb-36 overflow-y-auto">
      {/* Toast Notification when exported */}
      {exportSuccess && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 text-xs sm:text-sm font-bold animate-fade-in border border-emerald-400">
          <CheckCircle2 className="w-4 h-4" />
          <span>{exportSuccess}</span>
        </div>
      )}

      {exportError && (
        <div className="fixed bottom-6 right-6 z-50 bg-rose-600 text-white px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 text-xs sm:text-sm font-bold animate-fade-in border border-rose-400">
          <AlertCircle className="w-4 h-4" />
          <span>{exportError}</span>
        </div>
      )}

      {/* Top Sticky Navigation & Paper Controls Bar */}
      <div className="sticky top-14 sm:top-16 z-30 flex items-center justify-between gap-2 flex-wrap bg-slate-900/95 border border-slate-800 p-2.5 sm:p-3 rounded-2xl shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-2">
          <button
            type="button"
            id="btn-back-to-calc"
            onClick={onBackToCalculator}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all border border-slate-700 cursor-pointer select-none shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar</span>
          </button>

          {onSwitchToPhotomath && (
            <button
              type="button"
              onClick={onSwitchToPhotomath}
              className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all shadow-md shadow-rose-600/30 cursor-pointer select-none shrink-0"
            >
              <Sparkles className="w-4 h-4" />
              <span>Passo a Passo</span>
            </button>
          )}
        </div>

        {/* Paper & Ink Customization Controls */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Paper Type Selector */}
          <div className="flex items-center bg-slate-950 p-0.5 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setPaperStyle('grid')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                paperStyle === 'grid' ? 'bg-amber-100 text-slate-900 shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
              title="Caderno Quadriculado Escolar"
            >
              Quadriculado
            </button>
            <button
              type="button"
              onClick={() => setPaperStyle('lined')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                paperStyle === 'lined' ? 'bg-amber-100 text-slate-900 shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
              title="Caderno Pautado com Margem Vermelha"
            >
              Pautado
            </button>
            <button
              type="button"
              onClick={() => setPaperStyle('dots')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                paperStyle === 'dots' ? 'bg-amber-100 text-slate-900 shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
              title="Folha Pontilhada / Bullet Journal"
            >
              Pontilhado
            </button>
            <button
              type="button"
              onClick={() => setPaperStyle('dark')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                paperStyle === 'dark' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
              title="Lousa Negra / Dark Mode"
            >
              Escuro
            </button>
          </div>

          {/* Ink Color Selector */}
          <div className="flex items-center bg-slate-950 p-0.5 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setInkColor('blue')}
              className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                inkColor === 'blue' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-blue-400'
              }`}
              title="Caneta Azul Escolar"
            >
              <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
              <span className="hidden md:inline">Azul</span>
            </button>
            <button
              type="button"
              onClick={() => setInkColor('black')}
              className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                inkColor === 'black' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Caneta Tinteiro Preta"
            >
              <span className="w-2 h-2 rounded-full bg-slate-300 inline-block" />
              <span className="hidden md:inline">Preta</span>
            </button>
            <button
              type="button"
              onClick={() => setInkColor('pencil')}
              className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                inkColor === 'pencil' ? 'bg-slate-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Lápis Grafite 2B"
            >
              <span className="w-2 h-2 rounded-full bg-slate-400 inline-block" />
              <span className="hidden md:inline">Grafite</span>
            </button>
            <button
              type="button"
              onClick={() => setInkColor('purple')}
              className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                inkColor === 'purple' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-400 hover:text-purple-400'
              }`}
              title="Caneta Roxa do Professor"
            >
              <span className="w-2 h-2 rounded-full bg-purple-400 inline-block" />
              <span className="hidden md:inline">Roxa</span>
            </button>
          </div>

          {/* Export PNG */}
          <button
            type="button"
            id="btn-export-png"
            onClick={handleExportPNG}
            disabled={Boolean(isExporting)}
            className="h-8 sm:h-9 px-2.5 sm:px-3 rounded-xl bg-emerald-950/70 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-500/50 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer select-none active:scale-95 disabled:opacity-50"
            title="Exportar resolução completa como imagem PNG de alta resolução"
          >
            {isExporting === 'png' ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
            )}
            <span>PNG</span>
          </button>

          {/* Export PDF */}
          <button
            type="button"
            id="btn-export-pdf"
            onClick={handleExportPDF}
            disabled={Boolean(isExporting)}
            className="h-8 sm:h-9 px-2.5 sm:px-3 rounded-xl bg-rose-950/70 hover:bg-rose-900/80 text-rose-300 border border-rose-500/50 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer select-none active:scale-95 disabled:opacity-50"
            title="Baixar resolução completa em documento PDF de múltiplas páginas"
          >
            {isExporting === 'pdf' ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <FileText className="w-3.5 h-3.5 text-rose-400" />
            )}
            <span>PDF</span>
          </button>

          {/* Export Text / Markdown */}
          <button
            type="button"
            id="btn-export-text"
            onClick={handleExportText}
            disabled={Boolean(isExporting)}
            className="h-8 sm:h-9 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer select-none"
            title="Baixar resolução completa em arquivo de texto formatado (.txt)"
          >
            <FileCode className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden md:inline">TXT</span>
          </button>

          {/* Print */}
          <button
            type="button"
            id="btn-direct-print"
            onClick={handlePrint}
            className="h-8 sm:h-9 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer select-none"
            title="Imprimir direto na impressora"
          >
            <Printer className="w-3.5 h-3.5" />
          </button>

          {/* Read Out Loud (Voz) */}
          <button
            type="button"
            onClick={handleToggleSpeech}
            className={`h-8 sm:h-9 px-2.5 rounded-xl border text-xs font-medium flex items-center gap-1 transition-all cursor-pointer ${
              isSpeaking
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700 hover:text-white'
            }`}
            title="Ouvir explicação com voz"
          >
            {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isSpeaking ? 'Pausar' : 'Voz'}</span>
          </button>

          {/* Copy */}
          <button
            type="button"
            onClick={handleCopySolution}
            className="h-8 sm:h-9 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-medium flex items-center gap-1 transition-all cursor-pointer"
            title="Copiar texto completo da resolução"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{copied ? 'Copiado' : 'Copiar'}</span>
          </button>
        </div>
      </div>

      {/* REALISTIC HANDWRITTEN NOTEBOOK PAPER SHEET */}
      <div
        id="notebook-sheet"
        className={`w-full rounded-2xl sm:rounded-3xl p-5 sm:p-8 md:p-10 border transition-all relative ${paperBgClass} ${inkClass}`}
      >
        {/* Spiral Binder Rings on Left Border */}
        <div className="absolute left-2 top-6 bottom-6 flex flex-col justify-around pointer-events-none select-none">
          {[...Array(14)].map((_, ringIdx) => (
            <div
              key={ringIdx}
              className="w-3.5 h-5 rounded-full bg-gradient-to-r from-slate-400 via-slate-200 to-slate-500 border border-slate-500 shadow-md transform -rotate-12 spiral-binder-ring"
            />
          ))}
        </div>

        {/* Notebook Top Header */}
        <div className="flex items-center justify-between border-b-2 border-slate-300/80 dark:border-slate-700/80 pb-4 mb-6">
          <div className="flex items-center gap-2">
            <Pencil className="w-5 h-5 text-indigo-600 dark:text-indigo-400 rotate-45" />
            <span className="font-handwriting text-2xl sm:text-3xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
              Caderno de Matemática — Resolução Manuscrita
            </span>
          </div>

          <div className="flex items-center gap-2 text-right">
            <span className="font-handwriting text-lg sm:text-xl text-slate-500 dark:text-slate-400">
              {solution.problemType || 'Álgebra & Cálculo'}
            </span>
          </div>
        </div>

        {/* 1. ORIGINAL PROBLEM (ENUNCIADO) */}
        <div className="mb-6 pb-4 border-b border-dashed border-slate-300 dark:border-slate-700">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-handwriting text-xl sm:text-2xl font-bold text-indigo-700 dark:text-indigo-300">
              Exercício / Equação Proposta:
            </span>
          </div>
          
          <div className="my-2 p-3 sm:p-4 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="text-center text-lg sm:text-xl font-bold text-slate-900 dark:text-indigo-100 overflow-x-auto">
              <MathRenderer math={solution.originalInput} block />
            </div>
          </div>

          <p className="font-handwriting text-xl sm:text-2xl text-slate-700 dark:text-slate-300 mt-2 leading-relaxed">
            Objetivo: <span className="font-bold">{solution.summary || solution.problemTitle}</span>
          </p>
        </div>

        {/* 2. GIVEN DATA & FORMULAS (DADOS IDENTIFICADOS & FÓRMULAS) */}
        {(solution.givenVariables?.length || solution.formulasUsed?.length) ? (
          <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {solution.givenVariables && solution.givenVariables.length > 0 && (
              <div className="p-3.5 rounded-xl bg-amber-50/80 dark:bg-slate-900/60 border border-amber-200/80 dark:border-slate-800 shadow-sm">
                <span className="font-handwriting text-xl font-bold text-amber-900 dark:text-amber-300 block mb-1">
                  📌 Dados identificados:
                </span>
                <ul className="space-y-1">
                  {solution.givenVariables.map((v, i) => (
                    <li key={i} className="font-handwriting text-lg text-slate-800 dark:text-slate-200 flex items-center justify-between">
                      <span>• {v.name}:</span>
                      <span className="font-mono bg-white dark:bg-slate-950 px-2 py-0.5 rounded text-sm border border-slate-200 dark:border-slate-800 font-bold">
                        {v.value}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {solution.formulasUsed && solution.formulasUsed.length > 0 && (
              <div className="p-3.5 rounded-xl bg-indigo-50/80 dark:bg-slate-900/60 border border-indigo-200/80 dark:border-slate-800 shadow-sm">
                <span className="font-handwriting text-xl font-bold text-indigo-900 dark:text-indigo-300 block mb-1">
                  📐 Fórmulas & Propriedades:
                </span>
                <div className="space-y-1.5">
                  {solution.formulasUsed.map((f, i) => (
                    <div key={i} className="flex items-center justify-between gap-1">
                      <span className="font-handwriting text-lg text-slate-800 dark:text-slate-200 truncate">
                        • {f.name}:
                      </span>
                      <div className="bg-white dark:bg-slate-950 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800 text-xs font-mono shrink-0">
                        <MathRenderer math={f.latex} inline />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}

        {/* 3. STEP-BY-STEP HANDWRITTEN RESOLUTION */}
        <div className="space-y-6 mb-8">
          <div className="flex items-center gap-2 border-b-2 border-indigo-500/40 pb-1">
            <span className="font-handwriting text-2xl sm:text-3xl font-black text-indigo-800 dark:text-indigo-300">
              Desenvolvimento & Resolução Passo a Passo:
            </span>
          </div>

          {solution.steps.map((step: MathStep, index: number) => {
            const isClarifying = activeClarifyStep === index;
            return (
              <div
                key={index}
                className="relative pl-3 sm:pl-4 border-l-4 border-indigo-500/60 dark:border-indigo-400/60 space-y-2.5 py-1.5 transition-all"
              >
                {/* Step Header with Circled Step Number */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="w-8 h-8 rounded-full bg-indigo-600 text-white font-handwriting text-xl font-bold flex items-center justify-center shadow-sm shrink-0">
                    {step.stepNumber || index + 1}
                  </span>
                  <span className="font-handwriting text-2xl sm:text-3xl font-extrabold text-indigo-900 dark:text-indigo-200">
                    <MixedTextRenderer text={step.title} inline />
                  </span>
                </div>

                {/* Pedagogical Explanation in Handwriting Font */}
                <div className="font-handwriting text-xl sm:text-2xl text-slate-800 dark:text-slate-200 leading-relaxed pl-1">
                  <MixedTextRenderer text={step.explanation} />
                </div>

                {/* Math Calculation Card */}
                {step.mathExpression && (
                  <div className="my-2.5 p-3.5 sm:p-4 rounded-xl bg-white/95 dark:bg-slate-950/95 border border-slate-300 dark:border-slate-800 shadow-sm">
                    <div className="text-center text-lg sm:text-xl font-bold text-slate-900 dark:text-indigo-200 overflow-x-auto">
                      <MathRenderer math={step.mathExpression} block />
                    </div>
                  </div>
                )}

                {/* Sub-steps / Intermediate Transformations (if present) */}
                {step.subSteps && step.subSteps.length > 0 && (
                  <div className="my-2 pl-3 border-l-2 border-dashed border-indigo-300 dark:border-indigo-700/60 space-y-2">
                    {step.subSteps.map((sub, subIdx) => (
                      <div
                        key={subIdx}
                        className="p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800"
                      >
                        <div className="font-handwriting text-lg font-bold text-slate-700 dark:text-slate-300 mb-1">
                          ↳ Subpasso {subIdx + 1}: <MixedTextRenderer text={sub.explanation} inline />
                        </div>
                        {(sub.beforeLatex || sub.afterLatex) && (
                          <div className="flex items-center gap-2 text-sm font-mono flex-wrap bg-white dark:bg-slate-950 p-2 rounded-lg border border-slate-200 dark:border-slate-800">
                            {sub.beforeLatex && (
                              <div className="px-2 py-0.5 bg-rose-50 dark:bg-rose-950/40 rounded border border-rose-200 dark:border-rose-800/50">
                                <MathRenderer math={sub.beforeLatex} inline />
                              </div>
                            )}
                            <span className="text-slate-400 font-bold">➔</span>
                            {sub.afterLatex && (
                              <div className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/40 rounded border border-emerald-200 dark:border-emerald-800/50">
                                <MathRenderer math={sub.afterLatex} inline />
                              </div>
                            )}
                          </div>
                        )}
                        {sub.tip && (
                          <div className="font-handwriting text-base text-amber-700 dark:text-amber-300 mt-1 flex items-start gap-1">
                            <span className="shrink-0">💡</span>
                            <div className="flex-1">
                              <MixedTextRenderer text={sub.tip} inline />
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Teacher's handwritten Post-It Sticky Note */}
                {step.tipOrRule && (
                  <div className="my-2 p-3 sm:p-3.5 rounded-xl sticky-note-yellow border border-amber-300/80 text-amber-950 flex items-start gap-2 shadow-md max-w-xl">
                    <Lightbulb className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                    <div className="font-handwriting text-lg sm:text-xl leading-snug flex-1">
                      <span className="font-bold mr-1">Dica do Professor:</span>
                      <MixedTextRenderer text={step.tipOrRule} inline />
                    </div>
                  </div>
                )}

                {/* Tutor Clarification Button & Input */}
                <div className="pt-1" data-export-ignore="true">
                  <button
                    type="button"
                    onClick={() => setActiveClarifyStep(isClarifying ? null : index)}
                    className="font-handwriting text-lg font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-200 flex items-center gap-1.5 cursor-pointer select-none"
                  >
                    <span>💬 Ficou com dúvida neste Passo {index + 1}? Clique para tirar dúvida</span>
                  </button>

                  {isClarifying && (
                    <div className="mt-2.5 p-3.5 rounded-2xl bg-white dark:bg-slate-900 border-2 border-indigo-500 shadow-xl space-y-2.5 animate-fade-in">
                      <label className="font-handwriting text-lg font-bold text-indigo-900 dark:text-indigo-300 block">
                        O que você gostaria que o professor explicasse sobre o Passo {index + 1}?
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={clarifyQuestion}
                          onChange={(e) => setClarifyQuestion(e.target.value)}
                          placeholder="Ex: De onde veio este número? Por que trocou o sinal?"
                          className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') submitClarification(index);
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => submitClarification(index)}
                          disabled={!clarifyQuestion.trim()}
                          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-indigo-600/30 cursor-pointer disabled:opacity-50 transition-all active:scale-95"
                        >
                          Explicar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* 4. FINAL ANSWER (RESPOSTA FINAL COM DESTAQUE EM MARCA-TEXTO) */}
        <div className="mt-8 p-5 sm:p-7 rounded-2xl bg-white/95 dark:bg-slate-900/95 border-2 border-emerald-500 shadow-xl relative overflow-hidden">
          <div className="flex items-center gap-2.5 mb-2">
            <CheckCircle2 className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
            <span className="font-handwriting text-2xl sm:text-3xl font-black text-emerald-700 dark:text-emerald-400 tracking-wide">
              Resposta Final / Conclusão:
            </span>
          </div>

          {/* Exact Math Expression with Highlighter effect */}
          <div className="my-3.5 py-3.5 px-4 rounded-xl bg-emerald-50/80 dark:bg-slate-950 border border-emerald-300 dark:border-emerald-700 text-center">
            <div className="text-xl sm:text-2xl md:text-3xl font-extrabold text-emerald-950 dark:text-emerald-200 overflow-x-auto">
              <MathRenderer math={solution.finalAnswer.exact} block />
            </div>
            {solution.finalAnswer.approximate && (
              <div className="font-handwriting text-xl text-emerald-800 dark:text-emerald-400 mt-1">
                Valor aproximado: <MathRenderer math={solution.finalAnswer.approximate} inline />
              </div>
            )}
          </div>

          {solution.finalAnswer.explanation && (
            <div className="font-handwriting text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 mt-2 leading-relaxed">
              <span className="marker-yellow inline-block">
                <MixedTextRenderer text={solution.finalAnswer.explanation} inline />
              </span>
            </div>
          )}
        </div>

        {/* 5. PROOF / VERIFICATION (PROVA REAL COM CARIMBO MANUSCRITO) */}
        {solution.verification && (
          <div className="mt-6 p-4 sm:p-5 rounded-2xl bg-emerald-50/50 dark:bg-slate-900/80 border-2 border-dashed border-emerald-500/80 shadow-md">
            <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                <span className="font-handwriting text-2xl font-bold text-emerald-900 dark:text-emerald-300">
                  Prova Real & Verificação Matemática:
                </span>
              </div>
              <span className="font-handwriting text-lg font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-700">
                ✓ 100% Verificado
              </span>
            </div>

            <p className="font-handwriting text-xl text-slate-700 dark:text-slate-300">
              Método de verificação: <span className="font-bold">{solution.verification.method}</span>
            </p>

            <div className="my-2.5 p-3 bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 text-center shadow-sm">
              <MathRenderer math={solution.verification.mathExpression} block />
            </div>

            {solution.verification.explanation && (
              <div className="font-handwriting text-xl text-emerald-900 dark:text-emerald-200 leading-relaxed mt-2">
                <MixedTextRenderer text={solution.verification.explanation} />
              </div>
            )}
          </div>
        )}

        {/* 6. SIMILAR PRACTICE PROBLEMS (EXERCÍCIOS DE FIXAÇÃO SE HOUVER) */}
        {solution.similarPracticeProblems && solution.similarPracticeProblems.length > 0 && (
          <div className="mt-6 p-4 sm:p-5 rounded-2xl bg-indigo-50/50 dark:bg-slate-900/70 border border-indigo-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <span className="font-handwriting text-2xl font-bold text-indigo-900 dark:text-indigo-300">
                Exercícios Recomendados para Fixação:
              </span>
            </div>
            <div className="space-y-2 mt-2">
              {solution.similarPracticeProblems.map((p, pIdx) => (
                <div
                  key={p.id || pIdx}
                  className="p-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 flex-wrap"
                >
                  <div>
                    <span className="font-handwriting text-lg font-bold text-slate-800 dark:text-slate-200">
                      {pIdx + 1}) {p.problem}
                    </span>
                    {p.latex && (
                      <div className="text-sm font-mono text-indigo-600 dark:text-indigo-400 mt-0.5">
                        <MathRenderer math={p.latex} inline />
                      </div>
                    )}
                  </div>
                  <span className="font-handwriting text-base font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800">
                    Gabarito: {p.answer}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

