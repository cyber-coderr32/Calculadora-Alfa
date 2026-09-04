import React, { useState } from 'react';
import { MathSolution, MathStep, PracticeProblem } from '../types';
import { MathRenderer, MixedTextRenderer } from './MathRenderer';
import { FunctionGrapher } from './FunctionGrapher';
import { solveQuadratic } from '../engine/offlineSolver';
import {
  CheckCircle,
  HelpCircle,
  Volume2,
  VolumeX,
  Copy,
  Check,
  Printer,
  Sparkles,
  ChevronDown,
  ChevronUp,
  RotateCw,
  Lightbulb,
  ShieldCheck,
  BookOpen,
  ArrowRight,
  MessageSquare,
  Eye,
  EyeOff,
  Flame,
  Cpu,
  Layers,
} from 'lucide-react';

interface SolutionDisplayProps {
  solution: MathSolution;
  onAskClarification: (stepIndex: number, question: string) => void;
  onAlternativeMethod: () => void;
  isLoadingAlternative?: boolean;
  onSelectAlternativeSolution?: (sol: MathSolution) => void;
}

export const SolutionDisplay: React.FC<SolutionDisplayProps> = ({
  solution,
  onAskClarification,
  onAlternativeMethod,
  isLoadingAlternative = false,
  onSelectAlternativeSolution,
}) => {
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [activeClarifyStep, setActiveClarifyStep] = useState<number | null>(null);
  const [clarifyQuestion, setClarifyQuestion] = useState('');
  const [expandedSteps, setExpandedSteps] = useState<Record<number, boolean>>({});
  const [revealedPracticeAnswers, setRevealedPracticeAnswers] = useState<Record<string, boolean>>({});
  const [selectedMethod, setSelectedMethod] = useState<'bhaskara' | 'factoring' | 'completing_square'>('bhaskara');

  // Toggle single step collapse or expand
  const toggleStep = (index: number) => {
    setExpandedSteps((prev) => ({
      ...prev,
      [index]: prev[index] !== undefined ? !prev[index] : false, // Default is expanded
    }));
  };

  const isStepExpanded = (index: number) => {
    return expandedSteps[index] !== false; // expanded by default
  };

  // Check if this is a quadratic equation to allow instant method switching
  const isQuadratic =
    solution.problemType.includes('2º Grau') ||
    solution.problemType.includes('Quadrática') ||
    solution.problemTitle.toLowerCase().includes('quadrática') ||
    solution.problemTitle.toLowerCase().includes('bhaskara');

  const handleSwitchMethod = (method: 'bhaskara' | 'factoring' | 'completing_square') => {
    setSelectedMethod(method);
    // Parse a, b, c from given variables if present
    const aVar = solution.givenVariables?.find((v) => v.name.toLowerCase() === 'a');
    const bVar = solution.givenVariables?.find((v) => v.name.toLowerCase() === 'b');
    const cVar = solution.givenVariables?.find((v) => v.name.toLowerCase() === 'c');

    if (aVar && bVar && cVar && onSelectAlternativeSolution) {
      const a = parseFloat(aVar.value) || 1;
      const b = parseFloat(bVar.value) || 0;
      const c = parseFloat(cVar.value) || 0;
      const newSol = solveQuadratic(a, b, c, solution.originalInput, method);
      onSelectAlternativeSolution(newSol);
    }
  };

  // Copy full solution text
  const handleCopySolution = () => {
    let text = `=== ${solution.problemTitle} ===\n\n`;
    text += `Categoria: ${solution.problemType}\n`;
    text += `Resumo: ${solution.summary}\n\n`;

    text += `--- RESOLUÇÃO 100% PASSO A PASSO ---\n`;
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
      alert('Seu navegador não suporta síntese de voz.');
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

  const handlePrint = () => {
    window.print();
  };

  const submitClarification = (stepIndex: number) => {
    if (!clarifyQuestion.trim()) return;
    onAskClarification(stepIndex, clarifyQuestion);
    setClarifyQuestion('');
    setActiveClarifyStep(null);
  };

  const toggleRevealPractice = (id: string) => {
    setRevealedPracticeAnswers((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <div id="solution-container" className="w-full space-y-6 animate-fade-in print:text-black">
      {/* Solution Header Card */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800 rounded-3xl p-6 shadow-2xl backdrop-blur-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold uppercase tracking-wider">
                {solution.problemType || 'Matemática'}
              </span>
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" />
                Resolução 100% Verificada
              </span>
              {solution.detectedFromImage && (
                <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-semibold">
                  Escaneado da Foto
                </span>
              )}
            </div>
            <h2 className="text-xl md:text-2xl font-extrabold text-white tracking-tight">
              {solution.problemTitle}
            </h2>
            <div className="text-sm text-slate-300 mt-1">
              <MixedTextRenderer text={solution.summary} />
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-2 shrink-0 flex-wrap print:hidden">
            <button
              type="button"
              id="btn-speak-solution"
              onClick={handleToggleSpeech}
              className={`p-2.5 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-all ${
                isSpeaking
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700 hover:text-white'
              }`}
              title="Ouvir resolução com voz em português"
            >
              {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              <span>{isSpeaking ? 'Pausar Voz' : 'Ouvir'}</span>
            </button>

            <button
              type="button"
              id="btn-copy-solution"
              onClick={handleCopySolution}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition-all"
              title="Copiar texto completo da resolução"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copiado!' : 'Copiar'}</span>
            </button>

            <button
              type="button"
              id="btn-alternative-method"
              onClick={onAlternativeMethod}
              disabled={isLoadingAlternative}
              className="p-2.5 rounded-xl bg-purple-950/40 hover:bg-purple-900/60 text-purple-300 border border-purple-700/50 text-xs font-semibold flex items-center gap-1.5 transition-all disabled:opacity-50"
              title="Resolver por outro caminho/método matemático"
            >
              <RotateCw className={`w-4 h-4 ${isLoadingAlternative ? 'animate-spin' : ''}`} />
              <span>Outro Método</span>
            </button>

            <button
              type="button"
              id="btn-print-solution"
              onClick={handlePrint}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition-all"
              title="Imprimir ou salvar PDF"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir</span>
            </button>
          </div>
        </div>

        {/* Method Switcher for Quadratic Equations */}
        {isQuadratic && onSelectAlternativeSolution && (
          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between flex-wrap gap-2">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-indigo-400" />
              Método de Resolução:
            </span>
            <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => handleSwitchMethod('bhaskara')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  selectedMethod === 'bhaskara'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Fórmula de Bhaskara
              </button>
              <button
                type="button"
                onClick={() => handleSwitchMethod('factoring')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  selectedMethod === 'factoring'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Fatoração / Girard
              </button>
              <button
                type="button"
                onClick={() => handleSwitchMethod('completing_square')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  selectedMethod === 'completing_square'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Completar Quadrados
              </button>
            </div>
          </div>
        )}

        {/* Given Variables & Formulas Used Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
          {/* Given Data */}
          {solution.givenVariables && solution.givenVariables.length > 0 && (
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                Dados Identificados & Condições
              </span>
              <ul className="space-y-1.5">
                {solution.givenVariables.map((v, i) => (
                  <li key={i} className="text-xs text-slate-300 flex items-center justify-between">
                    <span className="font-mono text-indigo-300 font-semibold">{v.name}</span>
                    <span className="text-slate-400">{v.description || v.value}</span>
                    <span className="font-mono bg-slate-900 px-2 py-0.5 rounded text-slate-200 border border-slate-800">
                      {v.value}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Key Formulas */}
          {solution.formulasUsed && solution.formulasUsed.length > 0 && (
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Fórmulas & Teoremas Aplicados
              </span>
              <div className="space-y-2">
                {solution.formulasUsed.map((f, i) => (
                  <div key={i} className="text-xs flex items-center justify-between gap-2">
                    <span className="text-slate-300 font-medium">{f.name}:</span>
                    <div className="bg-slate-900 px-2 py-1 rounded text-indigo-200 border border-slate-800 font-mono">
                      <MathRenderer math={f.latex} inline />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* FINAL ANSWER HIGHLIGHT CARD */}
      <div className="bg-gradient-to-r from-emerald-950/50 via-slate-900 to-indigo-950/50 border-2 border-emerald-500/50 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex items-center gap-2 mb-2">
          <span className="p-1 rounded-full bg-emerald-500/20 text-emerald-400">
            <CheckCircle className="w-5 h-5" />
          </span>
          <h3 className="text-base font-extrabold text-emerald-300 uppercase tracking-wider">
            Resultado Final
          </h3>
        </div>

        <div className="my-3 py-3 px-4 rounded-2xl bg-slate-950/80 border border-emerald-500/30 text-center">
          <div className="text-lg md:text-2xl font-bold text-white font-mono">
            <MathRenderer math={solution.finalAnswer.exact} block />
          </div>
          {solution.finalAnswer.approximate && (
            <div className="text-sm text-emerald-400/90 font-mono mt-1">
              Valor aproximado: <MathRenderer math={solution.finalAnswer.approximate} inline />
            </div>
          )}
        </div>

        {solution.finalAnswer.explanation && (
          <div className="text-sm text-slate-200 mt-2 font-medium">
            <MixedTextRenderer text={solution.finalAnswer.explanation} />
          </div>
        )}
      </div>

      {/* 100% STEP-BY-STEP RESOLUTION BREAKDOWN */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-amber-400" />
            <h3 className="text-lg font-extrabold text-white tracking-tight">
              Resolução 100% Detalhada Passo a Passo
            </h3>
          </div>
          <span className="text-xs font-semibold text-slate-400 bg-slate-800/80 px-3 py-1 rounded-full border border-slate-700">
            Total de {solution.steps.length} Passos
          </span>
        </div>

        <div className="space-y-3">
          {solution.steps.map((step: MathStep, index: number) => {
            const expanded = isStepExpanded(index);
            const isClarifyingThis = activeClarifyStep === index;

            return (
              <div
                key={index}
                id={`step-card-${index + 1}`}
                className="bg-slate-900/90 border border-slate-800 hover:border-slate-700/90 rounded-2xl p-4 md:p-5 shadow-lg transition-all duration-200"
              >
                {/* Step Top Bar */}
                <div
                  onClick={() => toggleStep(index)}
                  className="flex items-center justify-between cursor-pointer select-none gap-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold text-xs flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0">
                      {step.stepNumber || index + 1}
                    </span>
                    <h4 className="text-sm md:text-base font-bold text-white tracking-tight">
                      {step.title}
                    </h4>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-indigo-400/80 hidden sm:inline-block">
                      {expanded ? 'Ocultar' : 'Ver detalhes'}
                    </span>
                    <div className="p-1 rounded-lg bg-slate-800 text-slate-400">
                      {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>
                </div>

                {/* Step Expanded Content */}
                {expanded && (
                  <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-3">
                    {/* Pedagogical Explanation */}
                    <div className="text-sm text-slate-300 leading-relaxed font-normal">
                      <MixedTextRenderer text={step.explanation} />
                    </div>

                    {/* Mathematical Formula / Calculation Box */}
                    {step.mathExpression && (
                      <div className="my-2 bg-slate-950/90 border border-slate-800 rounded-xl p-3 shadow-inner">
                        <MathRenderer math={step.mathExpression} block />
                      </div>
                    )}

                    {/* Pro Tip / Mathematical Property Callout */}
                    {step.tipOrRule && (
                      <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-950/20 border border-amber-800/30 text-amber-200/90 text-xs">
                        <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <span className="font-bold text-amber-300 mr-1">Regra / Dica:</span>
                          <MixedTextRenderer text={step.tipOrRule} inline />
                        </div>
                      </div>
                    )}

                    {/* Step Action: Ask AI to clarify this step */}
                    <div className="flex items-center justify-between pt-2">
                      <button
                        type="button"
                        id={`btn-clarify-step-${index + 1}`}
                        onClick={() => setActiveClarifyStep(isClarifyingThis ? null : index)}
                        className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 py-1 px-2.5 rounded-lg bg-indigo-950/30 hover:bg-indigo-950/60 border border-indigo-800/30 transition-all cursor-pointer"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Ficou com dúvida no Passo {index + 1}? Pergunte ao Tutor</span>
                      </button>
                    </div>

                    {/* Inline Question Input Box for this step */}
                    {isClarifyingThis && (
                      <div className="mt-3 p-3 rounded-xl bg-slate-950 border border-indigo-500/40 space-y-2 animate-fade-in">
                        <label className="text-xs font-bold text-indigo-300 block">
                          Qual é a sua dúvida sobre o Passo {index + 1}?
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={clarifyQuestion}
                            onChange={(e) => setClarifyQuestion(e.target.value)}
                            placeholder="Ex: Por que esse termo trocou de sinal? Como fatorou?"
                            className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') submitClarification(index);
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => submitClarification(index)}
                            disabled={!clarifyQuestion.trim()}
                            className="py-2 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-all disabled:opacity-50 cursor-pointer"
                          >
                            Explicar
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* PROOF & VERIFICATION SECTION */}
      {solution.verification && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl">
          <div className="flex items-center gap-2 mb-3">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-white">
              Verificação & Prova Real da Resposta
            </h3>
          </div>
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
            <p className="text-xs text-slate-300 font-medium">
              <span className="text-emerald-400 font-bold">Método de Checagem:</span>{' '}
              {solution.verification.method}
            </p>
            <div className="py-2 px-3 bg-slate-900 rounded-xl border border-slate-800">
              <MathRenderer math={solution.verification.mathExpression} block />
            </div>
            {solution.verification.notes && (
              <div className="text-xs text-slate-400 italic">
                <MixedTextRenderer text={`Nota: ${solution.verification.notes}`} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* INTERACTIVE 2D FUNCTION GRAPH */}
      {solution.graphData && solution.graphData.hasGraph && (
        <FunctionGrapher
          expression={solution.graphData.functionExpression || 'x^2 - 4'}
          latexExpression={solution.graphData.latexExpression}
          roots={solution.graphData.roots}
          criticalPoints={solution.graphData.criticalPoints}
          title={`Gráfico da Função — ${solution.problemTitle}`}
        />
      )}

      {/* SIMILAR PRACTICE EXERCISES */}
      {solution.similarPracticeProblems && solution.similarPracticeProblems.length > 0 && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="text-base font-bold text-white">
                Exercícios Similares para Fixação
              </h3>
              <p className="text-xs text-slate-400">
                Pratique com problemas parecidos para dominar este assunto
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {solution.similarPracticeProblems.map((p: PracticeProblem, idx: number) => {
              const isRevealed = revealedPracticeAnswers[p.id];
              return (
                <div
                  key={p.id || idx}
                  className="bg-slate-950/70 border border-slate-800/90 rounded-2xl p-4 flex flex-col justify-between space-y-3"
                >
                  <div>
                    <span className="text-[11px] font-bold text-indigo-400 mb-1 block">
                      Questão de Treino #{idx + 1}
                    </span>
                    <div className="text-xs font-semibold text-slate-200 mb-2">
                      <MixedTextRenderer text={p.problem} />
                    </div>
                    {p.latex && (
                      <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800 text-xs mb-2">
                        <MathRenderer math={p.latex} block />
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-800/80">
                    <button
                      type="button"
                      onClick={() => toggleRevealPractice(p.id)}
                      className="text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors"
                    >
                      {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      <span>{isRevealed ? 'Ocultar Resposta e Dica' : 'Ver Resposta e Dica'}</span>
                    </button>

                    {isRevealed && (
                      <div className="mt-2.5 p-3 rounded-xl bg-indigo-950/30 border border-indigo-800/40 text-xs space-y-1.5 animate-fade-in">
                        <div className="font-bold text-emerald-400">
                          Resposta: <MathRenderer math={p.answer} inline />
                        </div>
                        {p.hint && (
                          <div className="text-slate-300 text-[11px]">
                            <span className="font-semibold text-amber-300">Dica:</span>{' '}
                            <MixedTextRenderer text={p.hint} inline />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
