import React, { useState, useMemo } from 'react';
import { FunctionGrapher } from '../FunctionGrapher';
import { MathRenderer } from '../MathRenderer';
import {
  TrendingUp,
  Sliders,
  Table,
  Check,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Info,
} from 'lucide-react';

interface GrapherStudioViewProps {
  onSolveInCalculator: (expression: string) => void;
}

const PRESET_FUNCTIONS = [
  { name: 'Parábola Quadrática', expr: 'x^2 - 4', latex: 'f(x) = x^2 - 4' },
  { name: 'Polinômio Cúbico', expr: 'x^3 - 3*x', latex: 'f(x) = x^3 - 3x' },
  { name: 'Onda Senoidal', expr: 'sin(x)', latex: 'f(x) = \\sin(x)' },
  { name: 'Onda Cossenoidal', expr: 'cos(2*x)', latex: 'f(x) = \\cos(2x)' },
  { name: 'Função Exponencial', expr: 'exp(x/2)', latex: 'f(x) = e^{x/2}' },
  { name: 'Hipérbole Racional', expr: '1/x', latex: 'f(x) = \\frac{1}{x}' },
  { name: 'Raiz Quadrada', expr: 'sqrt(x + 4)', latex: 'f(x) = \\sqrt{x + 4}' },
  { name: 'Gaussiana (Sino)', expr: 'exp(-x^2)', latex: 'f(x) = e^{-x^2}' },
];

export const GrapherStudioView: React.FC<GrapherStudioViewProps> = ({ onSolveInCalculator }) => {
  const [expression, setExpression] = useState<string>('x^2 - 4');
  const [tableStep, setTableStep] = useState<number>(1);
  const [tableRange, setTableRange] = useState<number>(5);

  // Evaluate single point for table
  const evaluatePoint = (expr: string, xVal: number): number | null => {
    try {
      let clean = expr
        .replace(/\^/g, '**')
        .replace(/sin/g, 'Math.sin')
        .replace(/cos/g, 'Math.cos')
        .replace(/tan/g, 'Math.tan')
        .replace(/sqrt/g, 'Math.sqrt')
        .replace(/ln/g, 'Math.log')
        .replace(/log/g, 'Math.log10')
        .replace(/exp/g, 'Math.exp')
        .replace(/pi/gi, 'Math.PI')
        .replace(/e\b/g, 'Math.E')
        .replace(/abs/g, 'Math.abs');

      clean = clean.replace(/(\d+)\s*([a-zA-Z\(])/g, '$1*$2');
      clean = clean.replace(/\)\s*(\()/g, ')*$1');
      clean = clean.replace(/\)\s*([a-zA-Z0-9])/g, ')*$1');

      const fn = new Function('x', `return (${clean});`);
      const res = fn(xVal);
      if (typeof res === 'number' && !isNaN(res) && isFinite(res)) {
        return res;
      }
      return null;
    } catch {
      return null;
    }
  };

  // Generate Table of Values
  const tableData = useMemo(() => {
    const rows = [];
    for (let x = -tableRange; x <= tableRange; x += tableStep) {
      const y = evaluatePoint(expression, x);
      rows.push({
        x: parseFloat(x.toFixed(2)),
        y: y !== null ? parseFloat(y.toFixed(3)) : 'Indefinido',
      });
    }
    return rows;
  }, [expression, tableStep, tableRange]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Studio Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-black text-white tracking-tight">
                Estúdio de Gráficos e Funções 2D
              </h2>
            </div>
            <p className="text-xs md:text-sm text-slate-400">
              Plote qualquer função matemática $f(x)$, analise continuidade, raízes, máximos/mínimos e inspecione a tabela de valores em tempo real.
            </p>
          </div>

          <button
            type="button"
            onClick={() => onSolveInCalculator(expression)}
            className="px-4 py-2 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-md self-start md:self-auto cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Resolver Passos no Solver</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Function Input Box */}
        <div className="mt-5 space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex-1 flex items-center bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 focus-within:border-indigo-500 transition-all">
              <span className="text-sm font-bold font-mono text-indigo-400 mr-2">f(x) =</span>
              <input
                type="text"
                value={expression}
                onChange={(e) => setExpression(e.target.value)}
                placeholder="Ex: x^2 - 4 ou sin(x) ou 2*x + 1"
                className="w-full bg-transparent text-sm font-mono text-white placeholder-slate-500 focus:outline-none"
              />
            </div>

            <button
              type="button"
              onClick={() => setExpression('x^2 - 4')}
              className="px-3.5 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restaurar</span>
            </button>
          </div>

          {/* Preset Buttons */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">
              Exemplos:
            </span>
            {PRESET_FUNCTIONS.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setExpression(p.expr)}
                className={`px-3 py-1 rounded-xl text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                  expression === p.expr
                    ? 'bg-indigo-600 text-white font-bold shadow-sm'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Studio Grid: Graph on Left/Top + Value Table on Right/Bottom */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Canvas Graph View (2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          <FunctionGrapher
            expression={expression}
            latexExpression={`f(x) = ${expression}`}
            title={`Gráfico Interativo: f(x) = ${expression}`}
          />

          {/* Quick Guide Card */}
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-start gap-3">
            <Info className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-400 space-y-1">
              <span className="font-bold text-slate-200 block">Dicas de Interatividade:</span>
              <p>
                • <strong>Arrastar</strong>: Clique e arraste sobre o gráfico para mover a visualização (Pan).
              </p>
              <p>
                • <strong>Zoom</strong>: Use os botões [+] e [-] ou a roda do mouse para aproximar/afastar os eixos.
              </p>
              <p>
                • <strong>Inspeção</strong>: Passe o cursor para ler coordenadas exatas $(x, y)$ em qualquer ponto da curva.
              </p>
            </div>
          </div>
        </div>

        {/* Table of Values (1 Col) */}
        <div className="space-y-4">
          <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-xl bg-indigo-600/20 text-indigo-400">
                  <Table className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-white">Tabela de Valores (x, y)</h3>
              </div>
              <span className="text-[10px] font-mono text-indigo-300 bg-slate-950 px-2 py-0.5 rounded-lg border border-slate-800">
                f(x) = {expression}
              </span>
            </div>

            {/* Table Controls */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block mb-1">Passo (Δx):</span>
                <select
                  value={tableStep}
                  onChange={(e) => setTableStep(parseFloat(e.target.value))}
                  className="w-full bg-slate-900 text-white rounded-lg p-1 font-mono text-xs border border-slate-700"
                >
                  <option value={0.5}>0.5</option>
                  <option value={1}>1.0</option>
                  <option value={2}>2.0</option>
                  <option value={5}>5.0</option>
                </select>
              </div>

              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block mb-1">Intervalo [-N, N]:</span>
                <select
                  value={tableRange}
                  onChange={(e) => setTableRange(parseInt(e.target.value))}
                  className="w-full bg-slate-900 text-white rounded-lg p-1 font-mono text-xs border border-slate-700"
                >
                  <option value={5}>± 5</option>
                  <option value={10}>± 10</option>
                  <option value={20}>± 20</option>
                </select>
              </div>
            </div>

            {/* Values Table Box */}
            <div className="border border-slate-800 rounded-2xl overflow-hidden max-h-[380px] overflow-y-auto scrollbar-thin">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-950 text-slate-400 text-[10px] uppercase font-bold sticky top-0 border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">x (Domínio)</th>
                    <th className="py-2.5 px-3">f(x) = y (Imagem)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {tableData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-2 px-3 text-slate-300 font-bold">{row.x}</td>
                      <td
                        className={`py-2 px-3 ${
                          row.y === 0
                            ? 'text-emerald-400 font-bold bg-emerald-500/10'
                            : typeof row.y === 'number'
                            ? 'text-indigo-300'
                            : 'text-rose-400'
                        }`}
                      >
                        {row.y} {row.y === 0 && <span className="text-[9px] font-sans text-emerald-400 ml-1">(Raiz)</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
