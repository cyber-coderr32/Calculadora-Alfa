import React, { useState } from 'react';
import {
  X,
  Calculator,
  Compass,
  Grid3X3,
  TrendingUp,
  Shapes,
  Percent,
  Sliders,
  Check,
  ChevronRight,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { MathRenderer } from './MathRenderer';
import { getGCD, simplifyFraction } from '../engine/offlineSolver';

interface OfflineToolsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertToInput: (text: string) => void;
}

type ToolTab = 'quadratic' | 'pythagoras' | 'matrices' | 'stats' | 'finance' | 'fractions';

export const OfflineToolsModal: React.FC<OfflineToolsModalProps> = ({
  isOpen,
  onClose,
  onInsertToInput,
}) => {
  const [activeTab, setActiveTab] = useState<ToolTab>('quadratic');

  // Quadratic state
  const [qa, setQa] = useState<number>(1);
  const [qb, setQb] = useState<number>(-5);
  const [qc, setQc] = useState<number>(6);

  // Pythagoras state
  const [pythA, setPythA] = useState<string>('3');
  const [pythB, setPythB] = useState<string>('4');
  const [pythC, setPythC] = useState<string>(''); // unknown

  // Matrix 2x2 state
  const [m11, setM11] = useState<number>(2);
  const [m12, setM12] = useState<number>(3);
  const [m21, setM21] = useState<number>(1);
  const [m22, setM22] = useState<number>(4);

  // Statistics state
  const [statInput, setStatInput] = useState<string>('12, 15, 12, 18, 20, 22, 15, 25');

  // Finance state
  const [capital, setCapital] = useState<number>(1000);
  const [taxRate, setTaxRate] = useState<number>(2); // %
  const [period, setPeriod] = useState<number>(12); // months

  // Fraction state
  const [fracN, setFracN] = useState<number>(48);
  const [fracD, setFracD] = useState<number>(64);

  if (!isOpen) return null;

  // 1. Quadratic calculations
  const qDelta = qb * qb - 4 * qa * qc;
  const qXv = -qb / (2 * qa);
  const qYv = -qDelta / (4 * qa);
  const qSqrtDelta = qDelta >= 0 ? Math.sqrt(qDelta) : null;
  const qX1 = qSqrtDelta !== null ? (-qb + qSqrtDelta) / (2 * qa) : null;
  const qX2 = qSqrtDelta !== null ? (-qb - qSqrtDelta) / (2 * qa) : null;

  // 2. Pythagoras calculation
  const calcPythagoras = () => {
    const a = parseFloat(pythA);
    const b = parseFloat(pythB);
    const c = parseFloat(pythC);

    if (!isNaN(a) && !isNaN(b) && isNaN(c)) {
      const hyp = Math.sqrt(a * a + b * b);
      return { label: 'Hipotenusa (c)', value: hyp.toFixed(3), formula: `c = \\sqrt{${a}^2 + ${b}^2} = \\sqrt{${a * a + b * b}} = ${hyp.toFixed(3)}` };
    }
    if (!isNaN(a) && isNaN(b) && !isNaN(c)) {
      if (c <= a) return { label: 'Erro', value: 'Hipotenusa deve ser maior que o cateto', formula: 'c > a' };
      const leg = Math.sqrt(c * c - a * a);
      return { label: 'Cateto b', value: leg.toFixed(3), formula: `b = \\sqrt{${c}^2 - ${a}^2} = \\sqrt{${c * c - a * a}} = ${leg.toFixed(3)}` };
    }
    if (isNaN(a) && !isNaN(b) && !isNaN(c)) {
      if (c <= b) return { label: 'Erro', value: 'Hipotenusa deve ser maior que o cateto', formula: 'c > b' };
      const leg = Math.sqrt(c * c - b * b);
      return { label: 'Cateto a', value: leg.toFixed(3), formula: `a = \\sqrt{${c}^2 - ${b}^2} = \\sqrt{${c * c - b * b}} = ${leg.toFixed(3)}` };
    }
    return { label: 'Preencha 2 valores', value: 'Deixe 1 campo em branco para calcular', formula: 'a^2 + b^2 = c^2' };
  };

  // 3. Matrix calculations
  const matDet = m11 * m22 - m12 * m21;
  const matTrace = m11 + m22;

  // 4. Statistics calculation
  const calcStats = () => {
    const nums = statInput
      .split(/[\s,;]+/)
      .map((n) => parseFloat(n.trim()))
      .filter((n) => !isNaN(n))
      .sort((a, b) => a - b);

    if (nums.length === 0) return null;

    const count = nums.length;
    const sum = nums.reduce((acc, curr) => acc + curr, 0);
    const mean = sum / count;
    const median =
      count % 2 !== 0
        ? nums[Math.floor(count / 2)]
        : (nums[count / 2 - 1] + nums[count / 2]) / 2;

    // Mode
    const freq: Record<number, number> = {};
    let maxFreq = 0;
    nums.forEach((n) => {
      freq[n] = (freq[n] || 0) + 1;
      if (freq[n] > maxFreq) maxFreq = freq[n];
    });
    const modes = Object.keys(freq)
      .filter((k) => freq[parseFloat(k)] === maxFreq && maxFreq > 1)
      .map((k) => parseFloat(k));

    // Variance & Std Dev
    const variance =
      nums.reduce((acc, curr) => acc + Math.pow(curr - mean, 2), 0) / count;
    const stdDev = Math.sqrt(variance);
    const min = nums[0];
    const max = nums[nums.length - 1];

    return {
      count,
      sum,
      mean: mean.toFixed(3),
      median: median.toFixed(3),
      modes: modes.length > 0 ? modes.join(', ') : 'Amodal (sem repetição)',
      min,
      max,
      range: (max - min).toFixed(3),
      variance: variance.toFixed(3),
      stdDev: stdDev.toFixed(3),
      sorted: nums.join(', '),
    };
  };

  // 5. Finance calculation
  const simpleInterest = capital * (taxRate / 100) * period;
  const simpleTotal = capital + simpleInterest;
  const compoundTotal = capital * Math.pow(1 + taxRate / 100, period);
  const compoundInterest = compoundTotal - capital;

  // 6. Fractions calculation
  const gcdVal = getGCD(fracN, fracD);
  const simpFrac = simplifyFraction(fracN, fracD);

  const pythRes = calcPythagoras();
  const statRes = calcStats();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-fade-in">
      <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-white">
                  Super Ferramentas Matemáticas Offline
                </h3>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold border border-emerald-500/30 uppercase">
                  100% Sem Internet
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Calculadoras interativas instantâneas com fórmulas e passos detalhados
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 p-2 bg-slate-950/90 border-b border-slate-800 overflow-x-auto scrollbar-thin">
          <button
            type="button"
            onClick={() => setActiveTab('quadratic')}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-all ${
              activeTab === 'quadratic'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Bhaskara & Parábolas</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('pythagoras')}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-all ${
              activeTab === 'pythagoras'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Teorema de Pitágoras</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('matrices')}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-all ${
              activeTab === 'matrices'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Grid3X3 className="w-3.5 h-3.5" />
            <span>Matrizes & Determinantes</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('stats')}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-all ${
              activeTab === 'stats'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Estatística Descritiva</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('finance')}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-all ${
              activeTab === 'finance'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Percent className="w-3.5 h-3.5" />
            <span>Juros & Finanças</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('fractions')}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-all ${
              activeTab === 'fractions'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Shapes className="w-3.5 h-3.5" />
            <span>Frações, MMC & MDC</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* TAB 1: QUADRATIC EXPLORER */}
          {activeTab === 'quadratic' && (
            <div className="space-y-5 animate-fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-base font-bold text-white">
                    Explorador Quadrático Interativo: f(x) = ax² + bx + c
                  </h4>
                  <p className="text-xs text-slate-400">
                    Ajuste os coeficientes e visualize instantaneamente raízes, discriminante e vértice.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onInsertToInput(`${qa}x^2 ${qb >= 0 ? '+' + qb : qb}x ${qc >= 0 ? '+' + qc : qc} = 0`);
                    onClose();
                  }}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1 shadow-md"
                >
                  <span>Resolver Passo a Passo</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Slider Inputs */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <div className="flex justify-between text-xs font-bold text-slate-300 mb-1">
                    <span>Coeficiente a:</span>
                    <span className="text-indigo-400 font-mono text-sm">{qa}</span>
                  </div>
                  <input
                    type="range"
                    min="-10"
                    max="10"
                    step="1"
                    value={qa}
                    onChange={(e) => {
                      const v = parseInt(e.target.value);
                      setQa(v === 0 ? (qa < 0 ? 1 : -1) : v);
                    }}
                    className="w-full accent-indigo-500 cursor-pointer"
                  />
                </div>

                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <div className="flex justify-between text-xs font-bold text-slate-300 mb-1">
                    <span>Coeficiente b:</span>
                    <span className="text-indigo-400 font-mono text-sm">{qb}</span>
                  </div>
                  <input
                    type="range"
                    min="-20"
                    max="20"
                    step="1"
                    value={qb}
                    onChange={(e) => setQb(parseInt(e.target.value))}
                    className="w-full accent-indigo-500 cursor-pointer"
                  />
                </div>

                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <div className="flex justify-between text-xs font-bold text-slate-300 mb-1">
                    <span>Coeficiente c:</span>
                    <span className="text-indigo-400 font-mono text-sm">{qc}</span>
                  </div>
                  <input
                    type="range"
                    min="-20"
                    max="20"
                    step="1"
                    value={qc}
                    onChange={(e) => setQc(parseInt(e.target.value))}
                    className="w-full accent-indigo-500 cursor-pointer"
                  />
                </div>
              </div>

              {/* Real-time Math Results Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-slate-950/80 border border-slate-800 p-3.5 rounded-2xl text-center">
                  <span className="text-[11px] font-bold text-slate-400 block mb-1">
                    Discriminante (Δ = b² - 4ac)
                  </span>
                  <span
                    className={`text-lg font-bold font-mono ${
                      qDelta > 0
                        ? 'text-emerald-400'
                        : qDelta === 0
                        ? 'text-amber-400'
                        : 'text-rose-400'
                    }`}
                  >
                    Δ = {qDelta}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-1">
                    {qDelta > 0
                      ? '2 raízes reais distintas'
                      : qDelta === 0
                      ? '1 raiz real dupla'
                      : 'Raízes complexas'}
                  </span>
                </div>

                <div className="bg-slate-950/80 border border-slate-800 p-3.5 rounded-2xl text-center">
                  <span className="text-[11px] font-bold text-slate-400 block mb-1">
                    Raízes da Equação
                  </span>
                  <div className="text-sm font-bold font-mono text-indigo-300">
                    {qX1 !== null && qX2 !== null ? (
                      qX1 === qX2 ? (
                        <span>x = {qX1.toFixed(2)}</span>
                      ) : (
                        <span>
                          x₁ = {qX1.toFixed(2)}, x₂ = {qX2.toFixed(2)}
                        </span>
                      )
                    ) : (
                      <span className="text-slate-400">Sem raízes reais</span>
                    )}
                  </div>
                </div>

                <div className="bg-slate-950/80 border border-slate-800 p-3.5 rounded-2xl text-center">
                  <span className="text-[11px] font-bold text-slate-400 block mb-1">
                    Vértice da Parábola V(xv, yv)
                  </span>
                  <span className="text-sm font-bold font-mono text-amber-300">
                    V({qXv.toFixed(2)}, {qYv.toFixed(2)})
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-1">
                    {qa > 0 ? 'Ponto de Mínimo' : 'Ponto de Máximo'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PYTHAGORAS SOLVER */}
          {activeTab === 'pythagoras' && (
            <div className="space-y-5 animate-fade-in">
              <div>
                <h4 className="text-base font-bold text-white">
                  Teorema de Pitágoras: a² + b² = c²
                </h4>
                <p className="text-xs text-slate-400">
                  Preencha dois lados do triângulo retângulo e deixe o terceiro em branco para calcular.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <label className="text-xs font-bold text-slate-300 block mb-1">Cateto a:</label>
                  <input
                    type="number"
                    value={pythA}
                    onChange={(e) => setPythA(e.target.value)}
                    placeholder="Ex: 3"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono"
                  />
                </div>
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <label className="text-xs font-bold text-slate-300 block mb-1">Cateto b:</label>
                  <input
                    type="number"
                    value={pythB}
                    onChange={(e) => setPythB(e.target.value)}
                    placeholder="Ex: 4"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono"
                  />
                </div>
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Hipotenusa c:
                  </label>
                  <input
                    type="number"
                    value={pythC}
                    onChange={(e) => setPythC(e.target.value)}
                    placeholder="Em branco para calcular"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono"
                  />
                </div>
              </div>

              {/* Result Box */}
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-emerald-500/40 text-center space-y-2">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  {pythRes.label}:
                </span>
                <div className="text-xl font-extrabold text-white font-mono">
                  {pythRes.value}
                </div>
                <div className="text-xs text-indigo-300 font-mono">
                  <MathRenderer math={pythRes.formula} block />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: MATRICES 2x2 */}
          {activeTab === 'matrices' && (
            <div className="space-y-5 animate-fade-in">
              <div>
                <h4 className="text-base font-bold text-white">
                  Matriz 2x2: Determinante & Traço
                </h4>
                <p className="text-xs text-slate-400">
                  Edite os 4 elementos da matriz para calcular determinante det(A) e traço tr(A).
                </p>
              </div>

              <div className="max-w-xs mx-auto bg-slate-950 p-4 rounded-2xl border border-slate-800">
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="number"
                    value={m11}
                    onChange={(e) => setM11(parseFloat(e.target.value) || 0)}
                    className="bg-slate-900 border border-slate-700 rounded-xl p-3 text-center text-white font-mono text-lg"
                  />
                  <input
                    type="number"
                    value={m12}
                    onChange={(e) => setM12(parseFloat(e.target.value) || 0)}
                    className="bg-slate-900 border border-slate-700 rounded-xl p-3 text-center text-white font-mono text-lg"
                  />
                  <input
                    type="number"
                    value={m21}
                    onChange={(e) => setM21(parseFloat(e.target.value) || 0)}
                    className="bg-slate-900 border border-slate-700 rounded-xl p-3 text-center text-white font-mono text-lg"
                  />
                  <input
                    type="number"
                    value={m22}
                    onChange={(e) => setM22(parseFloat(e.target.value) || 0)}
                    className="bg-slate-900 border border-slate-700 rounded-xl p-3 text-center text-white font-mono text-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl text-center">
                  <span className="text-xs font-bold text-slate-400 block mb-1">
                    Determinante det(A) = ad - bc
                  </span>
                  <div className="text-xl font-bold font-mono text-emerald-400">
                    det(A) = ({m11})({m22}) - ({m12})({m21}) = {matDet}
                  </div>
                </div>

                <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl text-center">
                  <span className="text-xs font-bold text-slate-400 block mb-1">
                    Traço tr(A) = a + d
                  </span>
                  <div className="text-xl font-bold font-mono text-indigo-300">
                    tr(A) = {m11} + {m22} = {matTrace}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: STATISTICS */}
          {activeTab === 'stats' && (
            <div className="space-y-5 animate-fade-in">
              <div>
                <h4 className="text-base font-bold text-white">
                  Estatística Descritiva Completa
                </h4>
                <p className="text-xs text-slate-400">
                  Insira uma lista de números separados por vírgula ou espaço para obter média, mediana, desvio padrão e variância.
                </p>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Conjunto de Dados Numéricos:
                </label>
                <input
                  type="text"
                  value={statInput}
                  onChange={(e) => setStatInput(e.target.value)}
                  placeholder="Ex: 5, 8, 12, 14, 18, 20"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono"
                />
              </div>

              {statRes && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-2xl text-center">
                    <span className="text-[11px] font-bold text-slate-400 block">Média Aritmética</span>
                    <span className="text-base font-bold text-indigo-300 font-mono">{statRes.mean}</span>
                  </div>
                  <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-2xl text-center">
                    <span className="text-[11px] font-bold text-slate-400 block">Mediana</span>
                    <span className="text-base font-bold text-emerald-300 font-mono">{statRes.median}</span>
                  </div>
                  <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-2xl text-center">
                    <span className="text-[11px] font-bold text-slate-400 block">Desvio Padrão (σ)</span>
                    <span className="text-base font-bold text-amber-300 font-mono">{statRes.stdDev}</span>
                  </div>
                  <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-2xl text-center">
                    <span className="text-[11px] font-bold text-slate-400 block">Variância (σ²)</span>
                    <span className="text-base font-bold text-purple-300 font-mono">{statRes.variance}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: FINANCIAL MATH */}
          {activeTab === 'finance' && (
            <div className="space-y-5 animate-fade-in">
              <div>
                <h4 className="text-base font-bold text-white">
                  Matemática Financeira: Juros Simples vs. Compostos
                </h4>
                <p className="text-xs text-slate-400">
                  Compare o rendimento de um capital aplicado com taxa fixa.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <label className="text-xs font-bold text-slate-300 block mb-1">Capital Inicial (C):</label>
                  <input
                    type="number"
                    value={capital}
                    onChange={(e) => setCapital(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono"
                  />
                </div>
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <label className="text-xs font-bold text-slate-300 block mb-1">Taxa de Juros (% ao período):</label>
                  <input
                    type="number"
                    value={taxRate}
                    onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono"
                  />
                </div>
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <label className="text-xs font-bold text-slate-300 block mb-1">Períodos (t):</label>
                  <input
                    type="number"
                    value={period}
                    onChange={(e) => setPeriod(parseInt(e.target.value) || 1)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl text-center space-y-1">
                  <span className="text-xs font-bold text-slate-400 block uppercase">Juros Simples (J = C·i·t)</span>
                  <div className="text-lg font-bold text-white font-mono">
                    Montante: R$ {simpleTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                  <span className="text-xs text-emerald-400 font-mono block">
                    Juros acumulados: + R$ {simpleInterest.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="bg-slate-950/80 border border-indigo-500/40 p-4 rounded-2xl text-center space-y-1">
                  <span className="text-xs font-bold text-indigo-300 block uppercase">Juros Compostos [M = C(1+i)ᵗ]</span>
                  <div className="text-lg font-bold text-indigo-200 font-mono">
                    Montante: R$ {compoundTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <span className="text-xs text-amber-300 font-mono block">
                    Juros acumulados: + R$ {compoundInterest.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: FRACTIONS, MMC & MDC */}
          {activeTab === 'fractions' && (
            <div className="space-y-5 animate-fade-in">
              <div>
                <h4 className="text-base font-bold text-white">
                  Simplificador de Frações, MMC & MDC
                </h4>
                <p className="text-xs text-slate-400">
                  Encontre a fração irredutível e o Máximo Divisor Comum instantaneamente.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <label className="text-xs font-bold text-slate-300 block mb-1">Numerador:</label>
                  <input
                    type="number"
                    value={fracN}
                    onChange={(e) => setFracN(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono"
                  />
                </div>
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <label className="text-xs font-bold text-slate-300 block mb-1">Denominador:</label>
                  <input
                    type="number"
                    value={fracD}
                    onChange={(e) => setFracD(parseInt(e.target.value) || 1)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono"
                  />
                </div>
              </div>

              <div className="bg-slate-950/80 border border-slate-800 p-5 rounded-2xl text-center space-y-2">
                <span className="text-xs font-bold text-slate-400 uppercase">Fração Irredutível:</span>
                <div className="text-2xl font-bold font-mono text-emerald-400">
                  <MathRenderer math={`\\frac{${fracN}}{${fracD}} = ${simpFrac.latex}`} block />
                </div>
                <div className="text-xs text-slate-400">
                  MDC({fracN}, {fracD}) = <span className="text-amber-400 font-bold">{gcdVal}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
