import React, { useState } from 'react';
import { MathRenderer } from './MathRenderer';
import { X, Sparkles, Plus, Check } from 'lucide-react';

interface MathStructureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertLatex: (latex: string) => void;
}

export const MathStructureModal: React.FC<MathStructureModalProps> = ({
  isOpen,
  onClose,
  onInsertLatex,
}) => {
  const [activeTab, setActiveTab] = useState<'fraction' | 'root' | 'exponent'>('fraction');

  // Fraction state
  const [fracNum, setFracNum] = useState('1');
  const [fracDen, setFracDen] = useState('2');
  const [fracWhole, setFracWhole] = useState('');
  const [isMixedFrac, setIsMixedFrac] = useState(false);

  // Root state
  const [rootIndex, setRootIndex] = useState('2');
  const [rootRadicand, setRootRadicand] = useState('x');

  // Exponent state
  const [expBase, setExpBase] = useState('x');
  const [expPower, setExpPower] = useState('2');

  if (!isOpen) return null;

  // Build LaTeX output for preview and insertion
  const getFractionLatex = () => {
    const num = fracNum.trim() || 'a';
    const den = fracDen.trim() || 'b';
    if (isMixedFrac && fracWhole.trim()) {
      return `${fracWhole.trim()}\\frac{${num}}{${den}}`;
    }
    return `\\frac{${num}}{${den}}`;
  };

  const getRootLatex = () => {
    const rad = rootRadicand.trim() || 'x';
    const idx = rootIndex.trim();
    if (!idx || idx === '2') {
      return `\\sqrt{${rad}}`;
    }
    return `\\sqrt[${idx}]{${rad}}`;
  };

  const getExponentLatex = () => {
    const base = expBase.trim() || 'x';
    const pow = expPower.trim() || '2';
    // If base contains operators and no parens, wrap in parens
    const needsParens = (base.includes('+') || base.includes('-') || base.includes(' ')) && !base.startsWith('(');
    const safeBase = needsParens ? `(${base})` : base;
    return `${safeBase}^{${pow}}`;
  };

  const handleInsert = () => {
    let result = '';
    if (activeTab === 'fraction') result = getFractionLatex();
    else if (activeTab === 'root') result = getRootLatex();
    else if (activeTab === 'exponent') result = getExponentLatex();

    onInsertLatex(result);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 modal-backdrop-blur animate-fade-in">
      <div className="modal-dialog-card rounded-2xl sm:rounded-3xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-4 py-3 sm:px-5 sm:py-4 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/30 text-indigo-400 border border-indigo-500/40 flex items-center justify-center shadow-inner">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                Construtor Visual de Equações
              </h3>
              <p className="text-[11px] text-slate-400">
                Crie frações, raízes e potências facilmente com preview em tempo real
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="p-3 bg-slate-950/40 border-b border-slate-800/80 flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab('fraction')}
            className={`flex-1 py-2 px-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'fraction'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 ring-1 ring-indigo-400/50'
                : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Fração (a/b)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('root')}
            className={`flex-1 py-2 px-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'root'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 ring-1 ring-indigo-400/50'
                : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Raiz (ⁿ√x)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('exponent')}
            className={`flex-1 py-2 px-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'exponent'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 ring-1 ring-indigo-400/50'
                : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Expoente (xʸ)</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto">
          {/* 1. FRACTION BUILDER */}
          {activeTab === 'fraction' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300">Estrutura da Fração:</span>
                <button
                  type="button"
                  onClick={() => setIsMixedFrac(!isMixedFrac)}
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-lg border transition-all cursor-pointer ${
                    isMixedFrac
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  {isMixedFrac ? '✓ Fração Mista Ativa' : '+ Fração Mista (com inteiro)'}
                </button>
              </div>

              {/* Visual Interactive Fraction Box */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center gap-3">
                {isMixedFrac && (
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] text-amber-400 font-bold mb-1">Parte Inteira</span>
                    <input
                      type="text"
                      value={fracWhole}
                      onChange={(e) => setFracWhole(e.target.value)}
                      placeholder="2"
                      className="w-14 h-12 bg-slate-900 border border-amber-500/50 focus:border-amber-400 rounded-xl text-center text-base font-bold text-amber-200 focus:outline-none"
                    />
                  </div>
                )}

                <div className="flex flex-col items-center gap-2">
                  <div className="w-full">
                    <span className="text-[10px] text-indigo-400 font-bold block text-center mb-0.5">
                      Numerador (Parte de Cima)
                    </span>
                    <input
                      type="text"
                      value={fracNum}
                      onChange={(e) => setFracNum(e.target.value)}
                      placeholder="Ex: 3x + 1"
                      className="w-48 sm:w-56 h-10 bg-slate-900 border border-indigo-500/50 focus:border-indigo-400 rounded-xl px-3 text-center text-sm font-bold text-white focus:outline-none"
                    />
                  </div>

                  {/* Fraction Bar */}
                  <div className="w-full h-0.5 bg-indigo-500/80 rounded-full" />

                  <div className="w-full">
                    <input
                      type="text"
                      value={fracDen}
                      onChange={(e) => setFracDen(e.target.value)}
                      placeholder="Ex: 4"
                      className="w-48 sm:w-56 h-10 bg-slate-900 border border-indigo-500/50 focus:border-indigo-400 rounded-xl px-3 text-center text-sm font-bold text-white focus:outline-none"
                    />
                    <span className="text-[10px] text-indigo-400 font-bold block text-center mt-0.5">
                      Denominador (Parte de Baixo)
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Fraction Presets */}
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Frações Rápidas Populares:
                </span>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5">
                  {[
                    { num: '1', den: '2' },
                    { num: '1', den: '3' },
                    { num: '2', den: '3' },
                    { num: '1', den: '4' },
                    { num: '3', den: '4' },
                    { num: '1', den: '5' },
                    { num: 'x', den: '2' },
                    { num: '1', den: 'x' },
                    { num: 'a', den: 'b' },
                    { num: 'dx', den: 'dy' },
                    { num: '-b', den: '2a' },
                    { num: '1', den: '10' },
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setFracNum(preset.num);
                        setFracDen(preset.den);
                        setIsMixedFrac(false);
                      }}
                      className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-indigo-600/30 hover:border-indigo-500/50 border border-slate-700/60 text-indigo-200 text-xs font-bold transition-all cursor-pointer"
                    >
                      {preset.num}/{preset.den}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 2. ROOT BUILDER */}
          {activeTab === 'root' && (
            <div className="space-y-4">
              <span className="text-xs font-bold text-slate-300 block">Estrutura da Raiz:</span>

              {/* Visual Interactive Root Box */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center gap-2">
                <div className="flex flex-col items-center">
                  <span className="text-[10px] text-amber-400 font-bold mb-0.5">Índice</span>
                  <input
                    type="text"
                    value={rootIndex}
                    onChange={(e) => setRootIndex(e.target.value)}
                    placeholder="2"
                    className="w-12 h-10 bg-slate-900 border border-amber-500/50 focus:border-amber-400 rounded-xl text-center text-sm font-bold text-amber-200 focus:outline-none"
                    title="2 para raiz quadrada, 3 para cúbica..."
                  />
                </div>

                <div className="text-3xl text-indigo-400 font-serif font-thin select-none">
                  √
                </div>

                <div className="flex flex-col items-center flex-1 max-w-xs">
                  <span className="text-[10px] text-indigo-400 font-bold mb-0.5">
                    Radicando (Termo dentro da raiz)
                  </span>
                  <input
                    type="text"
                    value={rootRadicand}
                    onChange={(e) => setRootRadicand(e.target.value)}
                    placeholder="Ex: 64 ou x^2 - 4"
                    className="w-full h-10 bg-slate-900 border border-indigo-500/50 focus:border-indigo-400 rounded-xl px-3 text-center text-sm font-bold text-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Quick Root Presets */}
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Raízes Populares:
                </span>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
                  {[
                    { idx: '2', rad: 'x', label: '√x (Quadrada)' },
                    { idx: '2', rad: '2', label: '√2' },
                    { idx: '2', rad: '3', label: '√3' },
                    { idx: '3', rad: 'x', label: '³√x (Cúbica)' },
                    { idx: '3', rad: '8', label: '³√8' },
                    { idx: '4', rad: '16', label: '⁴√16' },
                    { idx: 'n', rad: 'x', label: 'ⁿ√x (N-ésima)' },
                    { idx: '2', rad: 'b^2 - 4ac', label: '√(b² - 4ac)' },
                  ].map((preset, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setRootIndex(preset.idx);
                        setRootRadicand(preset.rad);
                      }}
                      className="p-2 rounded-xl bg-slate-800/80 hover:bg-indigo-600/30 hover:border-indigo-500/50 border border-slate-700/60 text-indigo-200 text-xs font-bold transition-all cursor-pointer truncate"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 3. EXPONENT BUILDER */}
          {activeTab === 'exponent' && (
            <div className="space-y-4">
              <span className="text-xs font-bold text-slate-300 block">Estrutura da Potência:</span>

              {/* Visual Interactive Exponent Box */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center gap-3">
                <div className="flex flex-col items-center">
                  <span className="text-[10px] text-indigo-400 font-bold mb-0.5">Base</span>
                  <input
                    type="text"
                    value={expBase}
                    onChange={(e) => setExpBase(e.target.value)}
                    placeholder="Ex: x ou 2"
                    className="w-32 sm:w-40 h-11 bg-slate-900 border border-indigo-500/50 focus:border-indigo-400 rounded-xl px-3 text-center text-sm font-bold text-white focus:outline-none"
                  />
                </div>

                <div className="flex flex-col items-center -mt-4">
                  <span className="text-[10px] text-amber-400 font-bold mb-0.5">Expoente</span>
                  <input
                    type="text"
                    value={expPower}
                    onChange={(e) => setExpPower(e.target.value)}
                    placeholder="2"
                    className="w-16 h-9 bg-slate-900 border border-amber-500/50 focus:border-amber-400 rounded-xl text-center text-xs font-bold text-amber-200 focus:outline-none"
                  />
                </div>
              </div>

              {/* Quick Exponent Presets */}
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Expoentes Populares:
                </span>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
                  {[
                    { base: 'x', pow: '2', label: 'x² (Quadrado)' },
                    { base: 'x', pow: '3', label: 'x³ (Cubo)' },
                    { base: 'x', pow: 'n', label: 'xⁿ (Genérico)' },
                    { base: 'x', pow: '-1', label: 'x⁻¹ (Inverso)' },
                    { base: '10', pow: 'x', label: '10ˣ (Base 10)' },
                    { base: 'e', pow: 'x', label: 'eˣ (Euler)' },
                    { base: '2', pow: 'x', label: '2ˣ (Binário)' },
                    { base: '(a + b)', pow: '2', label: '(a+b)²' },
                  ].map((preset, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setExpBase(preset.base);
                        setExpPower(preset.pow);
                      }}
                      className="p-2 rounded-xl bg-slate-800/80 hover:bg-indigo-600/30 hover:border-indigo-500/50 border border-slate-700/60 text-indigo-200 text-xs font-bold transition-all cursor-pointer truncate"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Real-time Result Preview */}
          <div className="p-3 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 flex items-center justify-between gap-3">
            <div>
              <span className="text-[10px] uppercase font-bold text-indigo-300 block">
                Visualização do Resultado:
              </span>
              <div className="text-base sm:text-lg text-white font-bold py-1 overflow-x-auto">
                <MathRenderer
                  math={
                    activeTab === 'fraction'
                      ? getFractionLatex()
                      : activeTab === 'root'
                      ? getRootLatex()
                      : getExponentLatex()
                  }
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleInsert}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-xs sm:text-sm font-extrabold flex items-center gap-1.5 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer select-none shrink-0"
            >
              <Check className="w-4 h-4" />
              <span>Inserir na Equação</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
