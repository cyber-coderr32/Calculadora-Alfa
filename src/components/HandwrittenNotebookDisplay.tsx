import React, { useState } from 'react';
import html2canvas from 'html2canvas';
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
  Share2,
  HelpCircle,
  Pencil,
  FileText,
  Image as ImageIcon,
  Download,
  Loader2,
} from 'lucide-react';

interface HandwrittenNotebookDisplayProps {
  solution: MathSolution;
  onBackToCalculator: () => void;
  onAskClarification: (stepIndex: number, question: string) => void;
  onAlternativeMethod: () => void;
  isLoadingAlternative?: boolean;
}

export const HandwrittenNotebookDisplay: React.FC<HandwrittenNotebookDisplayProps> = ({
  solution,
  onBackToCalculator,
  onAskClarification,
  onAlternativeMethod,
  isLoadingAlternative = false,
}) => {
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [paperStyle, setPaperStyle] = useState<'grid' | 'lined' | 'dark'>('grid');
  const [activeClarifyStep, setActiveClarifyStep] = useState<number | null>(null);
  const [clarifyQuestion, setClarifyQuestion] = useState('');
  const [isExporting, setIsExporting] = useState<'png' | 'pdf' | null>(null);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);

  // Copy full solution text
  const handleCopySolution = () => {
    let text = `=== ${solution.problemTitle} ===\n\n`;
    text += `Categoria: ${solution.problemType}\n`;
    text += `Resumo: ${solution.summary}\n\n`;

    text += `--- RESOLUÇÃO PASSO A PASSO ---\n`;
    solution.steps.forEach((s) => {
      text += `\nPasso ${s.stepNumber}: ${s.title}\n`;
      text += `Explicação: ${s.explanation}\n`;
      text += `Expressão: ${s.mathExpression}\n`;
      if (s.tipOrRule) text += `Dica: ${s.tipOrRule}\n`;
    });

    text += `\n--- RESPOSTA FINAL ---\n`;
    text += `Valor Exato: ${solution.finalAnswer.exact}\n`;
    if (solution.finalAnswer.approximate) text += `Aproximação: ${solution.finalAnswer.approximate}\n`;
    text += `Conclusão: ${solution.finalAnswer.explanation}\n`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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

  // Export to high-resolution PNG
  const handleExportPNG = async () => {
    const element = document.getElementById('notebook-sheet');
    if (!element) return;
    setIsExporting('png');
    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: paperStyle === 'dark' ? '#0b1120' : '#faf8f5',
      });
      const imgData = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      const safeTitle = (solution.problemTitle || 'resolucao_matematica')
        .toLowerCase()
        .replace(/[^a-z0-9_-]/g, '_')
        .slice(0, 35);
      link.download = `resolucao_${safeTitle}.png`;
      link.href = imgData;
      link.click();
      setExportSuccess('PNG baixado com sucesso!');
      setTimeout(() => setExportSuccess(null), 3000);
    } catch (error) {
      console.error('Erro ao exportar PNG:', error);
      alert('Não foi possível gerar a imagem PNG. Tente novamente.');
    } finally {
      setIsExporting(null);
    }
  };

  // Export to multi-page PDF
  const handleExportPDF = async () => {
    const element = document.getElementById('notebook-sheet');
    if (!element) return;
    setIsExporting('pdf');
    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: paperStyle === 'dark' ? '#0b1120' : '#faf8f5',
      });
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
        heightLeft -= pdfHeight;
      }

      const safeTitle = (solution.problemTitle || 'resolucao_matematica')
        .toLowerCase()
        .replace(/[^a-z0-9_-]/g, '_')
        .slice(0, 35);
      pdf.save(`resolucao_${safeTitle}.pdf`);
      setExportSuccess('PDF gerado e baixado!');
      setTimeout(() => setExportSuccess(null), 3000);
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      alert('Não foi possível gerar o arquivo PDF. Tente novamente.');
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
      ? 'notebook-paper-grid text-slate-900 border-amber-200/80 shadow-2xl'
      : paperStyle === 'lined'
      ? 'notebook-paper-lined text-slate-900 border-red-200/80 shadow-2xl pl-10 sm:pl-16'
      : 'notebook-paper-dark text-slate-100 border-slate-800 shadow-2xl';

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4 animate-fade-in pb-28 sm:pb-36 overflow-y-auto">
      {/* Toast Notification when exported */}
      {exportSuccess && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 text-xs sm:text-sm font-bold animate-fade-in border border-emerald-400">
          <CheckCircle2 className="w-4 h-4" />
          <span>{exportSuccess}</span>
        </div>
      )}

      {/* Top Sticky Navigation & Paper Controls Bar */}
      <div className="sticky top-14 sm:top-16 z-30 flex items-center justify-between gap-2 flex-wrap bg-slate-900/95 border border-slate-800 p-2.5 sm:p-3 rounded-2xl shadow-xl backdrop-blur-md">
        <button
          type="button"
          id="btn-back-to-calc"
          onClick={onBackToCalculator}
          className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all shadow-md shadow-indigo-600/30 cursor-pointer select-none shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar à Calculadora</span>
        </button>

        {/* Paper Style Selector & Action Tools */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Paper Type */}
          <div className="flex items-center bg-slate-950 p-0.5 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setPaperStyle('grid')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                paperStyle === 'grid' ? 'bg-amber-100 text-slate-900 shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
              title="Caderno Quadriculado"
            >
              Quadriculado
            </button>
            <button
              type="button"
              onClick={() => setPaperStyle('lined')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                paperStyle === 'lined' ? 'bg-amber-100 text-slate-900 shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
              title="Caderno Pautado com Margem"
            >
              Pautado
            </button>
            <button
              type="button"
              onClick={() => setPaperStyle('dark')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                paperStyle === 'dark' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
              title="Caderno Escuro"
            >
              Escuro
            </button>
          </div>

          {/* Export PNG */}
          <button
            type="button"
            id="btn-export-png"
            onClick={handleExportPNG}
            disabled={Boolean(isExporting)}
            className="h-8 sm:h-9 px-2.5 sm:px-3 rounded-xl bg-emerald-950/70 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-500/50 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer select-none active:scale-95 disabled:opacity-50"
            title="Exportar resolução como imagem PNG de alta resolução"
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
            title="Baixar resolução em documento PDF formatado"
          >
            {isExporting === 'pdf' ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <FileText className="w-3.5 h-3.5 text-rose-400" />
            )}
            <span>PDF</span>
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
            title="Copiar texto da resolução"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{copied ? 'Copiado' : 'Copiar'}</span>
          </button>
        </div>
      </div>


      {/* REALISTIC HANDWRITTEN NOTEBOOK PAPER SHEET */}
      <div
        id="notebook-sheet"
        className={`w-full rounded-2xl sm:rounded-3xl p-5 sm:p-8 md:p-10 border transition-all relative overflow-hidden ${paperBgClass}`}
      >
        {/* Notebook Spiral / Ring Binder visual header decoration */}
        <div className="flex items-center justify-between border-b-2 border-slate-300/80 dark:border-slate-700/80 pb-4 mb-6">
          <div className="flex items-center gap-2">
            <Pencil className="w-5 h-5 text-indigo-600 dark:text-indigo-400 rotate-45" />
            <span className="font-handwriting text-2xl sm:text-3xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
              Caderno de Matemática — Resolução Completa
            </span>
          </div>

          <div className="flex items-center gap-2 text-right">
            <span className="font-handwriting text-lg sm:text-xl text-slate-500 dark:text-slate-400">
              {solution.problemType || 'Álgebra / Cálculo'}
            </span>
          </div>
        </div>

        {/* 1. ORIGINAL PROBLEM (ENUNCIADO) */}
        <div className="mb-6 pb-4 border-b border-dashed border-slate-300 dark:border-slate-700">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-handwriting text-xl sm:text-2xl font-bold text-indigo-700 dark:text-indigo-300">
              Exercício / Equação:
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
              <div className="p-3.5 rounded-xl bg-amber-50/70 dark:bg-slate-900/60 border border-amber-200/80 dark:border-slate-800">
                <span className="font-handwriting text-xl font-bold text-amber-900 dark:text-amber-300 block mb-1">
                  Dados identificados:
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
              <div className="p-3.5 rounded-xl bg-indigo-50/70 dark:bg-slate-900/60 border border-indigo-200/80 dark:border-slate-800">
                <span className="font-handwriting text-xl font-bold text-indigo-900 dark:text-indigo-300 block mb-1">
                  Fórmulas utilizadas:
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
                className="relative pl-3 sm:pl-4 border-l-4 border-indigo-500/60 dark:border-indigo-400/60 space-y-2 py-1"
              >
                {/* Step Header */}
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="font-handwriting text-2xl sm:text-3xl font-extrabold text-indigo-900 dark:text-indigo-300">
                    Passo {step.stepNumber || index + 1}:
                  </span>
                  <span className="font-handwriting text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-100">
                    {step.title}
                  </span>
                </div>

                {/* Pedagogical Explanation in Handwriting Font */}
                <div className="font-handwriting text-xl sm:text-2xl text-slate-800 dark:text-slate-200 leading-relaxed">
                  <MixedTextRenderer text={step.explanation} />
                </div>

                {/* Math Calculation Card */}
                {step.mathExpression && (
                  <div className="my-2.5 p-3 sm:p-4 rounded-xl bg-white/90 dark:bg-slate-950/90 border border-slate-300 dark:border-slate-800 shadow-sm">
                    <div className="text-center text-base sm:text-lg font-bold text-slate-900 dark:text-indigo-200 overflow-x-auto">
                      <MathRenderer math={step.mathExpression} block />
                    </div>
                  </div>
                )}

                {/* Teacher's handwritten tip note */}
                {step.tipOrRule && (
                  <div className="my-2 p-2.5 sm:p-3 rounded-xl bg-amber-100/80 dark:bg-amber-950/30 border border-amber-300/80 dark:border-amber-700/40 text-amber-900 dark:text-amber-200 flex items-start gap-2">
                    <Lightbulb className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div className="font-handwriting text-lg sm:text-xl leading-snug">
                      <span className="font-bold mr-1">Observação do Professor:</span>
                      <span>{step.tipOrRule}</span>
                    </div>
                  </div>
                )}

                {/* Tutor Question Button */}
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => setActiveClarifyStep(isClarifying ? null : index)}
                    className="font-handwriting text-lg font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-200 flex items-center gap-1 cursor-pointer"
                  >
                    <span>💬 Ficou com dúvida neste Passo {index + 1}? Clique para tirar dúvida</span>
                  </button>

                  {isClarifying && (
                    <div className="mt-2 p-3 rounded-xl bg-white dark:bg-slate-900 border border-indigo-400 space-y-2">
                      <label className="font-handwriting text-lg font-bold text-indigo-900 dark:text-indigo-300 block">
                        Qual é a sua dúvida no Passo {index + 1}?
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={clarifyQuestion}
                          onChange={(e) => setClarifyQuestion(e.target.value)}
                          placeholder="Ex: De onde veio este número? Por que trocou o sinal?"
                          className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-white"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') submitClarification(index);
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => submitClarification(index)}
                          disabled={!clarifyQuestion.trim()}
                          className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white font-bold text-xs shadow cursor-pointer disabled:opacity-50"
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
        <div className="mt-8 p-5 sm:p-6 rounded-2xl bg-white/90 dark:bg-slate-900/90 border-2 border-emerald-500 shadow-lg relative overflow-hidden">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            <span className="font-handwriting text-2xl sm:text-3xl font-black text-emerald-700 dark:text-emerald-400 tracking-wide">
              Resposta Final / Conclusão:
            </span>
          </div>

          {/* Exact Math Expression with Highlighter effect */}
          <div className="my-3 py-3 px-4 rounded-xl bg-emerald-50/70 dark:bg-slate-950 border border-emerald-300 dark:border-emerald-700 text-center">
            <div className="text-xl sm:text-2xl md:text-3xl font-extrabold text-emerald-950 dark:text-emerald-200 overflow-x-auto">
              <MathRenderer math={solution.finalAnswer.exact} block />
            </div>
            {solution.finalAnswer.approximate && (
              <div className="font-handwriting text-xl text-emerald-800 dark:text-emerald-400 mt-1">
                Valor aproximado: <MathRenderer math={solution.finalAnswer.approximate} inline />
              </div>
            )}
          </div>

          <div className="font-handwriting text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 mt-2 leading-relaxed">
            <span className="marker-yellow">{solution.finalAnswer.explanation}</span>
          </div>
        </div>

        {/* 5. PROOF / VERIFICATION (PROVA REAL) */}
        {solution.verification && (
          <div className="mt-6 p-4 rounded-xl bg-slate-100/80 dark:bg-slate-900/80 border border-slate-300 dark:border-slate-800">
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span className="font-handwriting text-xl font-bold text-slate-800 dark:text-slate-200">
                Prova Real & Verificação:
              </span>
            </div>
            <p className="font-handwriting text-lg text-slate-600 dark:text-slate-400">
              Método: {solution.verification.method}
            </p>
            <div className="my-2 p-2 bg-white dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 text-center">
              <MathRenderer math={solution.verification.mathExpression} block />
            </div>
            {solution.verification.explanation && (
              <p className="font-handwriting text-lg text-slate-700 dark:text-slate-300">
                {solution.verification.explanation}
              </p>
            )}
          </div>
        )}

        {/* 6. BOTTOM ACTION BUTTON TO RETURN & EXPORT */}
        <div
          data-html2canvas-ignore="true"
          className="mt-8 pt-4 border-t border-slate-300 dark:border-slate-700 flex flex-col gap-4"
        >
          {/* Quick Export Cards */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-white/70 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400">
                <Download className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 block">
                  Exportar & Guardar Resolução
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Salve como imagem de alta resolução (PNG) ou documento pronto para impressão (PDF)
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleExportPNG}
                disabled={Boolean(isExporting)}
                className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md shadow-emerald-600/30 cursor-pointer disabled:opacity-50"
              >
                {isExporting === 'png' ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <ImageIcon className="w-3.5 h-3.5" />
                )}
                <span>Salvar PNG</span>
              </button>

              <button
                type="button"
                onClick={handleExportPDF}
                disabled={Boolean(isExporting)}
                className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md shadow-rose-600/30 cursor-pointer disabled:opacity-50"
              >
                {isExporting === 'pdf' ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <FileText className="w-3.5 h-3.5" />
                )}
                <span>Baixar PDF</span>
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer"
                title="Imprimir"
              >
                <Printer className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Imprimir</span>
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              type="button"
              onClick={onBackToCalculator}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Fazer Outro Cálculo na Calculadora</span>
            </button>

            <button
              type="button"
              onClick={onAlternativeMethod}
              disabled={isLoadingAlternative}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-purple-100 dark:bg-purple-950/60 hover:bg-purple-200 dark:hover:bg-purple-900/60 text-purple-900 dark:text-purple-300 border border-purple-300 dark:border-purple-700 text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            >
              <RotateCw className={`w-4 h-4 ${isLoadingAlternative ? 'animate-spin' : ''}`} />
              <span>Ver Outro Método de Resolução</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
