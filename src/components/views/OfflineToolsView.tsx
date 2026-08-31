import React, { useState } from 'react';
import {
  Calculator,
  Compass,
  Grid3X3,
  TrendingUp,
  Shapes,
  Percent,
  Sliders,
  ChevronRight,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Info,
} from 'lucide-react';
import { MathRenderer } from '../MathRenderer';
import { getGCD, simplifyFraction } from '../../engine/offlineSolver';

interface OfflineToolsViewProps {
  onInsertToInput: (text: string) => void;
}

type ToolTab = 'quadratic' | 'pythagoras' | 'matrices' | 'stats' | 'finance' | 'fractions';

export const OfflineToolsView: React.FC<OfflineToolsViewProps> = ({ onInsertToInput }) => {
  const [activeTab, setActiveTab] = useState<ToolTab>('quadratic');

  // Quadratic state
  const [qa, setQa] = useState<number>(1);
  const [qb, setQb] = useState<number>(-5);
  const [qc, setQc] = useState<number>(6);

  // Pythagoras state
  const [pythA, setPythA] = useState<string>('3');
  const [pythB, setPythB] = useState<string>('4');
  const [pythC, setPythC] = useState<string>('');

  // Matrix 2x2 state
  const [m11, setM11] = useState<number>(2);
  const [m12, setM12] = useState<number>(3);
  const [m21, setM21] = useState<number>(1);
  const [m22, setM22] = useState<number>(4);

  // Statistics state
  const [statInput, setStatInput] = useState<string>('12, 15, 12, 18, 20, 22, 15, 25');

  // Finance state
  const [capital, setCapital] = useState<number>(1000);
  const [taxRate, setTaxRate] = useState<number>(2);
  const [period, setPeriod] = useState<number>(12);

  // Fraction state
  const [fracN, setFracN] = useState<number>(48);
  const [fracD, setFracD] = useState<number>(64);

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
      return {
        label: 'Hipotenusa (c)',
        value: hyp.toFixed(3),
        formula: `c = \\sqrt{${a}^2 + ${b}^2} = \\sqrt{${a * a + b * b}} = ${hyp.toFixed(3)}`,
      };
    }
    if (!isNaN(a) && isNaN(b) && !isNaN(c)) {
      if (c <= a)
        return { label: 'Erro', value: 'Hipotenusa deve ser maior que o cateto', formula: 'c > a' };
      const leg = Math.sqrt(c * c - a * a);
      return {
        label: 'Cateto b',
        value: leg.toFixed(3),
        formula: `b = \\sqrt{${c}^2 - ${a}^2} = \\sqrt{${c * c - a * a}} = ${leg.toFixed(3)}`,
      };
    }
    if (isNaN(a) && !isNaN(b) && !isNaN(c)) {
      if (c <= b)
        return { label: 'Erro', value: 'Hipotenusa deve ser maior que o cateto', formula: 'c > b' };
      const leg = Math.sqrt(c * c - b * b);
      return {
        label: 'Cateto a',
        value: leg.toFixed(3),
        formula: `a = \\sqrt{${c}^2 - ${b}^2} = \\sqrt{${c * c - b * b}} = ${leg.toFixed(3)}`,
      };
    }
    return {
      label: 'Preencha 2 valores',
      value: 'Deixe 1 campo em branco para calcular',
      formula: 'a^2 + b^2 = c^2',
    };
  };

  // 3. Matrix calculations
  const matDet = m11 * m22 - m12 * m21;
  const matTrace = m11 + m22;

  // 4. Statistics calculation
  const calcStats = () => {
    const nums = statInput
      .split(/[,;\s]+/)
      .map((s) => parseFloat(s.trim()))
      .filter((n) => !isNaN(n));

    if (nums.length === 0) return null;

    const n = nums.length;
    const sum = nums.reduce((acc, curr) => acc + curr, 0);
    const mean = sum / n;

    const sorted = [...nums].sort((a, b) => a - b);
    const median =
      n % 2 === 0 ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2 : sorted[Math.floor(n / 2)];

    // Variance
    const variance = nums.reduce((acc, curr) => acc + Math.pow(curr - mean, 2), 0) / (n > 1 ? n - 1 : 1);
    const stdDev = Math.sqrt(variance);

    // Mode
    const freq: Record<number, number> = {};
    nums.forEach((num) => (freq[num] = (freq[num] || 0) + 1));
    let maxFreq = 0;
    let modeVal = nums[0];
    Object.entries(freq).forEach(([k, count]) => {
      if (count > maxFreq) {
        maxFreq = count;
        modeVal = parseFloat(k);
      }
    });

    return {
      count: n,
      sum,
      mean: mean.toFixed(3),
      median: median.toFixed(3),
      variance: variance.toFixed(3),
      stdDev: stdDev.toFixed(3),
      min: sorted[0],
      max: sorted[n - 1],
      mode: maxFreq > 1 ? modeVal : 'Amodal',
    };
  };

  // 5. Finance calculation
  const calcFinance = () => {
    const i = taxRate / 100;
    const t = period;
    const c = capital;

    // Simple interest
    const simpleInterest = c * i * t;
    const simpleTotal = c + simpleInterest;

    // Compound interest
    const compoundTotal = c * Math.pow(1 + i, t);
    const compoundInterest = compoundTotal - c;

    return {
      simpleInterest: simpleInterest.toFixed(2),
      simpleTotal: simpleTotal.toFixed(2),
      compoundInterest: compoundInterest.toFixed(2),
      compoundTotal: compoundTotal.toFixed(2),
    };
  };

  // 6. Fraction simplification
  const gcd = getGCD(fracN, fracD);
  const simp = simplifyFraction(fracN, fracD);

  const toolsList = [
    { id: 'quadratic', name: 'Bhaskara & Parábola', icon: Calculator },
    { id: 'pythagoras', name: 'Pitágoras & Triângulos', icon: Compass },
    { id: 'matrices', name: 'Matrizes & Determinante', icon: Grid3X3 },
    { id: 'stats', name: 'Estatística Descritiva', icon: TrendingUp },
    { id: 'finance', name: 'Juros Simples / Compostos', icon: Percent },
    { id: 'fractions', name: 'Frações & MDC/MMC', icon: Shapes },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Studio Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
                <Sliders className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-black text-white tracking-tight">
                Super Ferramentas Matemáticas Offline
              </h2>
            </div>
            <p className="text-xs md:text-sm text-slate-400">
              Calculadoras analíticas dedicadas funcionando 100% no navegador, sem delay e sem internet.
            </p>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-1.5 self-start md:self-auto">
            <Sparkles className="w-3.5 h-3.5" />
            <span>0ms Latência • 100% Local</span>
          </div>
        </div>

        {/* Tools Tabs */}
        <div className="flex items-center gap-2 mt-5 overflow-x-auto pb-1 scrollbar-thin">
          {toolsList.map((t) => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id as ToolTab)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{t.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tool Content Panels */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl">
        {/* 1. QUADRATIC */}
        {activeTab === 'quadratic' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Calculator className="w-5 h-5 text-indigo-400" />
                Calculadora de Bhaskara & Vértice de Parábola
              </h3>
              <button
                type="button"
                onClick={() =>
                  onInsertToInput(
                    `${qa !== 1 ? qa : ''}x^2 ${qb >= 0 ? '+' : ''}${qb}x ${qc >= 0 ? '+' : ''}${qc} = 0`
                  )
                }
                className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
              >
                <span>Resolver no Solver Passo a Passo</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Inputs a, b, c */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                <label className="text-xs font-bold text-slate-400 block mb-1">
                  Coeficiente a (x²):
                </label>
                <input
                  type="number"
                  value={qa}
                  onChange={(e) => setQa(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 font-mono text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                <label className="text-xs font-bold text-slate-400 block mb-1">
                  Coeficiente b (x):
                </label>
                <input
                  type="number"
                  value={qb}
                  onChange={(e) => setQb(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 font-mono text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                <label className="text-xs font-bold text-slate-400 block mb-1">
                  Termo independente c:
                </label>
                <input
                  type="number"
                  value={qc}
                  onChange={(e) => setQc(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 font-mono text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Equation Preview */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-center text-indigo-200">
              <MathRenderer
                math={`f(x) = ${qa}x^2 ${qb >= 0 ? '+' : ''}${qb}x ${qc >= 0 ? '+' : ''}${qc}`}
                block
              />
            </div>

            {/* Instant Results Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Discriminante (Δ)
                </span>
                <span className="text-xl font-mono font-black text-white mt-1 block">
                  Δ = {qDelta}
                </span>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  {qDelta > 0
                    ? '2 Raízes Reais e Distintas'
                    : qDelta === 0
                    ? '1 Raiz Real Dupla'
                    : 'Raízes Complexas'}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Raiz x₁
                </span>
                <span className="text-xl font-mono font-black text-emerald-400 mt-1 block">
                  {qX1 !== null ? qX1.toFixed(3) : 'Complexa'}
                </span>
                <span className="text-[10px] text-slate-500 mt-1 block">(-b + √Δ) / 2a</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Raiz x₂
                </span>
                <span className="text-xl font-mono font-black text-emerald-400 mt-1 block">
                  {qX2 !== null ? qX2.toFixed(3) : 'Complexa'}
                </span>
                <span className="text-[10px] text-slate-500 mt-1 block">(-b - √Δ) / 2a</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Vértice V(x_v, y_v)
                </span>
                <span className="text-base font-mono font-black text-indigo-300 mt-1 block">
                  ({qXv.toFixed(2)}, {qYv.toFixed(2)})
                </span>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  {qa > 0 ? 'Ponto de Mínimo' : 'Ponto de Máximo'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 2. PYTHAGORAS */}
        {activeTab === 'pythagoras' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Compass className="w-5 h-5 text-indigo-400" />
                Teorema de Pitágoras (Triângulo Retângulo)
              </h3>
              <button
                type="button"
                onClick={() =>
                  onInsertToInput(
                    `a^2 + b^2 = c^2 com a=${pythA || '?'}, b=${pythB || '?'}, c=${pythC || '?'}`
                  )
                }
                className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
              >
                <span>Resolver no Solver</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                <label className="text-xs font-bold text-slate-400 block mb-1">Cateto a:</label>
                <input
                  type="text"
                  value={pythA}
                  onChange={(e) => setPythA(e.target.value)}
                  placeholder="Deixe vazio se for incógnita"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 font-mono text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                <label className="text-xs font-bold text-slate-400 block mb-1">Cateto b:</label>
                <input
                  type="text"
                  value={pythB}
                  onChange={(e) => setPythB(e.target.value)}
                  placeholder="Deixe vazio se for incógnita"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 font-mono text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                <label className="text-xs font-bold text-slate-400 block mb-1">Hipotenusa c:</label>
                <input
                  type="text"
                  value={pythC}
                  onChange={(e) => setPythC(e.target.value)}
                  placeholder="Deixe vazio se for incógnita"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 font-mono text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Pythagoras Result Box */}
            {(() => {
              const res = calcPythagoras();
              return (
                <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-3">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                    {res.label}
                  </span>
                  <div className="text-2xl font-black font-mono text-emerald-400">{res.value}</div>
                  <div className="text-sm font-medium text-indigo-300">
                    <MathRenderer math={res.formula} block />
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* 3. MATRICES */}
        {activeTab === 'matrices' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Grid3X3 className="w-5 h-5 text-indigo-400" />
                Determinante e Traço de Matriz 2×2
              </h3>
              <button
                type="button"
                onClick={() =>
                  onInsertToInput(
                    `\\det \\begin{pmatrix} ${m11} & ${m12} \\\\ ${m21} & ${m22} \\end{pmatrix}`
                  )
                }
                className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
              >
                <span>Resolver no Solver</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex flex-col md:flex-row items-center justify-center gap-8 py-4">
              {/* 2x2 Matrix Grid Inputs */}
              <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800 relative">
                <div className="absolute -left-2 top-0 bottom-0 w-3 border-l-2 border-t-2 border-b-2 border-indigo-400 rounded-l-md" />
                <div className="absolute -right-2 top-0 bottom-0 w-3 border-r-2 border-t-2 border-b-2 border-indigo-400 rounded-r-md" />

                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="number"
                    value={m11}
                    onChange={(e) => setM11(parseFloat(e.target.value) || 0)}
                    className="w-16 h-12 bg-slate-900 border border-slate-700 text-center font-mono font-bold text-white rounded-xl text-lg focus:border-indigo-500"
                  />
                  <input
                    type="number"
                    value={m12}
                    onChange={(e) => setM12(parseFloat(e.target.value) || 0)}
                    className="w-16 h-12 bg-slate-900 border border-slate-700 text-center font-mono font-bold text-white rounded-xl text-lg focus:border-indigo-500"
                  />
                  <input
                    type="number"
                    value={m21}
                    onChange={(e) => setM21(parseFloat(e.target.value) || 0)}
                    className="w-16 h-12 bg-slate-900 border border-slate-700 text-center font-mono font-bold text-white rounded-xl text-lg focus:border-indigo-500"
                  />
                  <input
                    type="number"
                    value={m22}
                    onChange={(e) => setM22(parseFloat(e.target.value) || 0)}
                    className="w-16 h-12 bg-slate-900 border border-slate-700 text-center font-mono font-bold text-white rounded-xl text-lg focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Calculated Matrix Outputs */}
              <div className="space-y-4 min-w-[240px]">
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Determinante det(A)
                  </span>
                  <span className="text-2xl font-mono font-black text-emerald-400 mt-1 block">
                    {matDet}
                  </span>
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    ({m11} × {m22}) - ({m12} × {m21}) = {matDet}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Traço da Matriz Tr(A)
                  </span>
                  <span className="text-2xl font-mono font-black text-indigo-300 mt-1 block">
                    {matTrace}
                  </span>
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    {m11} + {m22} = {matTrace}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4. STATS */}
        {activeTab === 'stats' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-indigo-400" />
                Estatística Descritiva (Média, Mediana, Desvio Padrão)
              </h3>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <label className="text-xs font-bold text-slate-400 block">
                Insira o conjunto de números (separados por vírgula ou espaço):
              </label>
              <textarea
                value={statInput}
                onChange={(e) => setStatInput(e.target.value)}
                rows={2}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 font-mono text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            {(() => {
              const s = calcStats();
              if (!s) return null;
              return (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                    <span className="text-[11px] font-bold text-slate-400 uppercase">Média</span>
                    <span className="text-xl font-mono font-bold text-emerald-400 block mt-1">
                      {s.mean}
                    </span>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                    <span className="text-[11px] font-bold text-slate-400 uppercase">Mediana</span>
                    <span className="text-xl font-mono font-bold text-indigo-300 block mt-1">
                      {s.median}
                    </span>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                    <span className="text-[11px] font-bold text-slate-400 uppercase">
                      Desvio Padrão (s)
                    </span>
                    <span className="text-xl font-mono font-bold text-amber-400 block mt-1">
                      {s.stdDev}
                    </span>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                    <span className="text-[11px] font-bold text-slate-400 uppercase">
                      Variância (s²)
                    </span>
                    <span className="text-xl font-mono font-bold text-purple-400 block mt-1">
                      {s.variance}
                    </span>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* 5. FINANCE */}
        {activeTab === 'finance' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Percent className="w-5 h-5 text-indigo-400" />
                Comparador: Juros Simples vs. Compostos
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                <label className="text-xs font-bold text-slate-400 block mb-1">
                  Capital Inicial (R$):
                </label>
                <input
                  type="number"
                  value={capital}
                  onChange={(e) => setCapital(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 font-mono text-white text-sm"
                />
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                <label className="text-xs font-bold text-slate-400 block mb-1">Taxa (% a.m.):</label>
                <input
                  type="number"
                  value={taxRate}
                  onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 font-mono text-white text-sm"
                />
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                <label className="text-xs font-bold text-slate-400 block mb-1">
                  Tempo (Meses):
                </label>
                <input
                  type="number"
                  value={period}
                  onChange={(e) => setPeriod(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 font-mono text-white text-sm"
                />
              </div>
            </div>

            {(() => {
              const f = calcFinance();
              return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                    <span className="text-xs font-bold text-indigo-400 uppercase block">
                      Juros Simples (J = C·i·t)
                    </span>
                    <div className="text-2xl font-mono font-bold text-white">
                      R$ {f.simpleTotal}
                    </div>
                    <span className="text-xs text-slate-400 block">
                      Rendimento: +R$ {f.simpleInterest}
                    </span>
                  </div>

                  <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                    <span className="text-xs font-bold text-emerald-400 uppercase block">
                      Juros Compostos [M = C(1+i)ᵗ]
                    </span>
                    <div className="text-2xl font-mono font-bold text-white">
                      R$ {f.compoundTotal}
                    </div>
                    <span className="text-xs text-slate-400 block">
                      Rendimento: +R$ {f.compoundInterest}
                    </span>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* 6. FRACTIONS */}
        {activeTab === 'fractions' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Shapes className="w-5 h-5 text-indigo-400" />
                Simplificador de Frações e MDC/MMC
              </h3>
              <button
                type="button"
                onClick={() => onInsertToInput(`\\frac{${fracN}}{${fracD}}`)}
                className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
              >
                <span>Resolver no Solver</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                <label className="text-xs font-bold text-slate-400 block mb-1">Numerador:</label>
                <input
                  type="number"
                  value={fracN}
                  onChange={(e) => setFracN(parseInt(e.target.value) || 1)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 font-mono text-white text-sm"
                />
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                <label className="text-xs font-bold text-slate-400 block mb-1">Denominador:</label>
                <input
                  type="number"
                  value={fracD}
                  onChange={(e) => setFracD(parseInt(e.target.value) || 1)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 font-mono text-white text-sm"
                />
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-4">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Fração Irredutível & MDC
              </div>
              <div className="text-xl text-indigo-200">
                <MathRenderer
                  math={`\\frac{${fracN}}{${fracD}} = ${simp.latex} \\quad (MDC = ${gcd})`}
                  block
                />
              </div>
              <div className="text-xs text-slate-400">
                Valor Decimal:{' '}
                <strong className="text-emerald-400">{(fracN / fracD).toFixed(4)}</strong>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
