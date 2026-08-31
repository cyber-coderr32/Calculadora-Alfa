import React, { useState } from 'react';
import { FORMULA_CATEGORIES } from '../data/formulaCategories';
import { FormulaItem } from '../types';
import { MathRenderer } from './MathRenderer';
import {
  Calculator,
  Variable,
  Sigma,
  Compass,
  Shapes,
  Grid3X3,
  Binary,
  TrendingUp,
  Delete,
  CornerDownLeft,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Layers,
  Type,
  Space,
  Percent,
} from 'lucide-react';

interface MathKeyboardProps {
  input: string;
  onInputChange: (newVal: string) => void;
  onSolve: () => void;
  isLoading: boolean;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  useNativeKeyboard?: boolean;
}

// Greek & Special Symbols Menu
const GREEK_SYMBOLS: FormulaItem[] = [
  { label: 'π Pi', insertText: '\\pi', displayLatex: '\\pi', description: 'Número Pi', category: 'greek' },
  { label: 'θ Theta', insertText: '\\theta', displayLatex: '\\theta', description: 'Ângulo Theta', category: 'greek' },
  { label: 'α Alfa', insertText: '\\alpha', displayLatex: '\\alpha', description: 'Alfa', category: 'greek' },
  { label: 'β Beta', insertText: '\\beta', displayLatex: '\\beta', description: 'Beta', category: 'greek' },
  { label: 'γ Gama', insertText: '\\gamma', displayLatex: '\\gamma', description: 'Gama', category: 'greek' },
  { label: 'δ Delta', insertText: '\\delta', displayLatex: '\\delta', description: 'Delta minúsculo', category: 'greek' },
  { label: 'Δ Delta', insertText: '\\Delta', displayLatex: '\\Delta', description: 'Delta / Discriminante', category: 'greek' },
  { label: 'λ Lambda', insertText: '\\lambda', displayLatex: '\\lambda', description: 'Autovalor / Lambda', category: 'greek' },
  { label: 'μ Mu', insertText: '\\mu', displayLatex: '\\mu', description: 'Média / Micro', category: 'greek' },
  { label: 'σ Sigma', insertText: '\\sigma', displayLatex: '\\sigma', description: 'Desvio padrão', category: 'greek' },
  { label: 'Σ Sigma', insertText: '\\Sigma', displayLatex: '\\Sigma', description: 'Somatório maiúsculo', category: 'greek' },
  { label: 'ω Ômega', insertText: '\\omega', displayLatex: '\\omega', description: 'Frequência angular', category: 'greek' },
  { label: 'Ω Ômega', insertText: '\\Omega', displayLatex: '\\Omega', description: 'Resistência / Ômega', category: 'greek' },
  { label: 'φ Phi', insertText: '\\phi', displayLatex: '\\phi', description: 'Proporção áurea', category: 'greek' },
  { label: 'ε Épsilon', insertText: '\\epsilon', displayLatex: '\\epsilon', description: 'Épsilon', category: 'greek' },
  { label: 'ρ Rô', insertText: '\\rho', displayLatex: '\\rho', description: 'Densidade / Rô', category: 'greek' },
  { label: 'τ Tau', insertText: '\\tau', displayLatex: '\\tau', description: 'Constante Tau', category: 'greek' },
  { label: 'e Euler', insertText: 'e', displayLatex: 'e', description: 'Base natural (2.718...)', category: 'greek' },
  { label: 'i Imag.', insertText: 'i', displayLatex: 'i', description: 'Unidade imaginária', category: 'greek' },
  { label: '∞ Infinito', insertText: '\\infty', displayLatex: '\\infty', description: 'Infinito', category: 'greek' },
];

export const MathKeyboard: React.FC<MathKeyboardProps> = ({
  input,
  onInputChange,
  onSolve,
  isLoading,
  textareaRef,
}) => {
  const [activeMenu, setActiveMenu] = useState<string>('numpad');

  const triggerHaptic = () => {
    try {
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(10);
      }
    } catch {
      // ignore
    }
  };

  const insertTextAtCursor = (textToInsert: string) => {
    triggerHaptic();
    const textarea = textareaRef.current;
    if (!textarea) {
      onInputChange(input + textToInsert);
      return;
    }

    const startPos = textarea.selectionStart ?? input.length;
    const endPos = textarea.selectionEnd ?? input.length;
    const currentVal = input;

    const newVal = currentVal.substring(0, startPos) + textToInsert + currentVal.substring(endPos);
    onInputChange(newVal);

    const newCursorPos = startPos + textToInsert.length;
    try {
      textarea.focus({ preventScroll: true });
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    } catch {
      // ignore
    }
  };

  const handleBackspace = () => {
    triggerHaptic();
    const textarea = textareaRef.current;
    if (!textarea) {
      onInputChange(input.slice(0, -1));
      return;
    }

    const startPos = textarea.selectionStart ?? input.length;
    const endPos = textarea.selectionEnd ?? input.length;

    if (startPos !== endPos) {
      const newVal = input.substring(0, startPos) + input.substring(endPos);
      onInputChange(newVal);
      try {
        textarea.focus({ preventScroll: true });
        textarea.setSelectionRange(startPos, startPos);
      } catch {}
    } else if (startPos > 0) {
      const newVal = input.substring(0, startPos - 1) + input.substring(startPos);
      onInputChange(newVal);
      try {
        textarea.focus({ preventScroll: true });
        textarea.setSelectionRange(startPos - 1, startPos - 1);
      } catch {}
    }
  };

  const handleClear = () => {
    triggerHaptic();
    onInputChange('');
    if (textareaRef.current) {
      try {
        textareaRef.current.focus({ preventScroll: true });
      } catch {}
    }
  };

  const moveCursor = (direction: 'left' | 'right') => {
    triggerHaptic();
    const textarea = textareaRef.current;
    if (!textarea) return;
    const currentPos = textarea.selectionStart ?? input.length;
    const newPos = direction === 'left' ? Math.max(0, currentPos - 1) : Math.min(input.length, currentPos + 1);
    try {
      textarea.focus({ preventScroll: true });
      textarea.setSelectionRange(newPos, newPos);
    } catch {}
  };

  const keyboardMenus = [
    { id: 'numpad', title: 'Numérico & Básico', icon: Calculator, shortLabel: '123 / Básico' },
    { id: 'algebra', title: 'Álgebra & Fórmulas', icon: Variable, shortLabel: 'Álgebra' },
    { id: 'calculus', title: 'Cálculo & Derivadas', icon: Sigma, shortLabel: 'Cálculo' },
    { id: 'trigonometry', title: 'Trigonometria', icon: Compass, shortLabel: 'Trigonometria' },
    { id: 'geometry', title: 'Geometria & Espaço', icon: Shapes, shortLabel: 'Geometria' },
    { id: 'matrices', title: 'Matrizes & Vetores', icon: Grid3X3, shortLabel: 'Matrizes' },
    { id: 'stats_finance', title: 'Estatística & Finanças', icon: TrendingUp, shortLabel: 'Estatística' },
    { id: 'sets_logic', title: 'Conjuntos & Lógica', icon: Binary, shortLabel: 'Lógica' },
    { id: 'greek', title: 'Letras Gregas & Constantes', icon: Type, shortLabel: 'Gregas' },
  ];

  const fullNumpadKeys = [
    { label: 'x', insert: 'x', type: 'var' },
    { label: 'y', insert: 'y', type: 'var' },
    { label: 'z', insert: 'z', type: 'var' },
    { label: 'π', insert: '\\pi', type: 'const' },
    { label: 'e', insert: 'e', type: 'const' },

    { label: '7', insert: '7', type: 'num' },
    { label: '8', insert: '8', type: 'num' },
    { label: '9', insert: '9', type: 'num' },
    { label: '÷', insert: ' / ', type: 'op' },
    { label: '^', insert: '^{2}', type: 'op' },

    { label: '4', insert: '4', type: 'num' },
    { label: '5', insert: '5', type: 'num' },
    { label: '6', insert: '6', type: 'num' },
    { label: '×', insert: ' \\cdot ', type: 'op' },
    { label: '√x', insert: '\\sqrt{x}', type: 'op' },

    { label: '1', insert: '1', type: 'num' },
    { label: '2', insert: '2', type: 'num' },
    { label: '3', insert: '3', type: 'num' },
    { label: '-', insert: ' - ', type: 'op' },
    { label: 'a/b', insert: '\\frac{a}{b}', type: 'op' },

    { label: '0', insert: '0', type: 'num' },
    { label: '.', insert: '.', type: 'num' },
    { label: '=', insert: ' = ', type: 'action' },
    { label: '+', insert: ' + ', type: 'op' },
    { label: '( )', insert: '()', type: 'op' },
  ];

  const getActiveItems = (): FormulaItem[] => {
    if (activeMenu === 'greek') return GREEK_SYMBOLS;
    const cat = FORMULA_CATEGORIES.find((c) => c.id === activeMenu);
    return cat ? cat.items : [];
  };

  const activeCategoryData = keyboardMenus.find((m) => m.id === activeMenu) || keyboardMenus[0];

  return (
    <div className="w-full max-w-full bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl p-2.5 sm:p-4 md:p-5 shadow-2xl space-y-2.5 sm:space-y-3 box-border overflow-hidden">
      {/* 1. TOP MENU TABS BAR */}
      <div className="space-y-1.5 sm:space-y-2 w-full max-w-full">
        <div className="flex items-center justify-between gap-1 w-full">
          <span className="text-[10px] sm:text-[11px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1 shrink-0">
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden xs:inline">Menus do Teclado:</span>
            <span className="xs:hidden">Menus:</span>
          </span>

          {/* Quick Cursor & Editing Actions */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              id="btn-keyboard-cursor-left"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => moveCursor('left')}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-indigo-600 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer select-none"
              title="Mover cursor para esquerda"
              aria-label="Cursor esquerda"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              id="btn-keyboard-cursor-right"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => moveCursor('right')}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-indigo-600 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer select-none"
              title="Mover cursor para direita"
              aria-label="Cursor direita"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              id="btn-keyboard-backspace"
              onMouseDown={(e) => e.preventDefault()}
              onClick={handleBackspace}
              className="h-7 sm:h-8 px-2 rounded-lg sm:rounded-xl bg-red-950/60 hover:bg-red-900 active:bg-red-700 text-red-300 border border-red-800/40 flex items-center gap-1 text-[10px] sm:text-xs font-bold transition-all cursor-pointer select-none"
              title="Apagar caractere"
              aria-label="Apagar"
            >
              <Delete className="w-3 h-3" />
              <span>Apagar</span>
            </button>
            <button
              type="button"
              id="btn-keyboard-clear"
              onMouseDown={(e) => e.preventDefault()}
              onClick={handleClear}
              className="h-7 sm:h-8 px-2 rounded-lg sm:rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-300 hover:text-white text-[10px] sm:text-xs font-bold transition-all cursor-pointer select-none"
              title="Limpar tudo"
            >
              Limpar
            </button>
          </div>
        </div>

        {/* Scrollable Sub-Menu Badges */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 max-w-full scrollbar-none">
          {keyboardMenus.map((menu) => {
            const Icon = menu.icon;
            const isActive = activeMenu === menu.id;
            return (
              <button
                key={menu.id}
                id={`keyboard-menu-${menu.id}`}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  triggerHaptic();
                  setActiveMenu(menu.id);
                }}
                className={`min-h-[36px] sm:min-h-[38px] px-2.5 sm:px-3 py-1 rounded-xl text-[11px] sm:text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-all duration-150 cursor-pointer active:scale-95 shrink-0 select-none ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 ring-1 ring-indigo-400/40'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-indigo-400'}`} />
                <span>{menu.shortLabel}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. KEYBOARD BODY CONTAINER */}
      <div className="pt-2 border-t border-slate-800/80 w-full max-w-full">
        {activeMenu === 'numpad' ? (
          <div className="space-y-2 w-full max-w-full">
            {/* Quick Math Shortcuts Row (4 cols on mobile, 8 cols on tablet/desktop) */}
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-1 w-full">
              {[
                { label: 'x²', insert: '^2', desc: 'Quadrado' },
                { label: 'xʸ', insert: '^{n}', desc: 'Potência' },
                { label: '√x', insert: '\\sqrt{x}', desc: 'Raiz' },
                { label: 'a/b', insert: '\\frac{a}{b}', desc: 'Fração' },
                { label: '|x|', insert: '|x|', desc: 'Módulo' },
                { label: '±', insert: ' \\pm ', desc: 'Mais ou menos' },
                { label: '≤', insert: ' \\le ', desc: 'Menor ou igual' },
                { label: '≥', insert: ' \\ge ', desc: 'Maior ou igual' },
              ].map((op, idx) => (
                <button
                  key={idx}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => insertTextAtCursor(op.insert)}
                  className="min-h-[38px] sm:min-h-[40px] rounded-xl bg-slate-800/90 hover:bg-indigo-600 border border-slate-700/60 hover:border-indigo-400 text-indigo-200 hover:text-white font-bold text-xs sm:text-sm flex items-center justify-center transition-all active:scale-95 cursor-pointer shadow-sm select-none"
                  title={op.desc}
                >
                  {op.label}
                </button>
              ))}
            </div>

            {/* Main 5-Column Numpad */}
            <div className="grid grid-cols-5 gap-1 sm:gap-1.5 w-full">
              {fullNumpadKeys.map((k, i) => {
                const isNumber = k.type === 'num';
                const isVar = k.type === 'var';
                const isOp = k.type === 'op';
                const isAction = k.type === 'action';
                const isConst = k.type === 'const';

                return (
                  <button
                    key={i}
                    type="button"
                    id={`numpad-key-${i}`}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => insertTextAtCursor(k.insert)}
                    className={`min-h-[44px] sm:min-h-[46px] rounded-xl flex items-center justify-center font-bold text-sm sm:text-base md:text-lg transition-all duration-100 active:scale-95 cursor-pointer shadow-sm select-none ${
                      isNumber
                        ? 'bg-slate-800/90 hover:bg-slate-700 active:bg-slate-600 text-white font-mono border border-slate-700/50'
                        : isVar
                        ? 'bg-indigo-950/60 hover:bg-indigo-900 border border-indigo-500/30 text-indigo-300 italic font-serif'
                        : isConst
                        ? 'bg-amber-950/40 hover:bg-amber-900 border border-amber-500/30 text-amber-300'
                        : isOp
                        ? 'bg-slate-950 hover:bg-indigo-600 text-slate-200 hover:text-white border border-slate-800'
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30'
                    }`}
                  >
                    {k.label}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          /* Specialized Sub-Menu Palette Grid */
          <div className="space-y-2.5 w-full max-w-full">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                <span>{activeCategoryData.title}</span>
              </span>
              <span className="text-[10px] text-slate-400 hidden sm:inline">
                Toque para inserir a fórmula
              </span>
            </div>

            {/* Grid of formula buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-1.5 max-h-[250px] overflow-y-auto pr-0.5 scrollbar-thin scrollbar-thumb-slate-700 w-full">
              {getActiveItems().map((item: FormulaItem, idx: number) => (
                <button
                  key={idx}
                  id={`formula-menu-item-${activeMenu}-${idx}`}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => insertTextAtCursor(item.insertText)}
                  className="min-h-[50px] p-2 rounded-xl bg-slate-950 hover:bg-indigo-600 border border-slate-800 hover:border-indigo-400 text-slate-200 hover:text-white transition-all duration-150 shadow-sm flex flex-col items-center justify-center text-center active:scale-95 cursor-pointer group w-full min-w-0 select-none"
                  title={item.description || item.label}
                >
                  <div className="text-xs font-semibold max-w-full overflow-hidden text-ellipsis whitespace-nowrap">
                    {item.displayLatex ? (
                      <MathRenderer math={item.displayLatex} className="pointer-events-none text-xs" />
                    ) : (
                      <span>{item.label}</span>
                    )}
                  </div>
                  {item.description && (
                    <span className="text-[9px] text-slate-400 group-hover:text-indigo-100 max-w-full overflow-hidden text-ellipsis whitespace-nowrap leading-tight mt-0.5">
                      {item.label !== item.description ? item.label : item.description}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Bottom Quick Row for Numbers & Math Operators in Sub-Menu */}
            <div className="pt-2 border-t border-slate-800 flex items-center gap-1 overflow-x-auto pb-1 max-w-full scrollbar-none">
              <span className="text-[9px] font-bold text-slate-500 uppercase shrink-0">
                Atalhos:
              </span>
              {['x', 'y', '0', '1', '2', '3', '4', '+', '-', '×', '÷', '=', '^', '√', '(', ')'].map((char, i) => (
                <button
                  key={i}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    const insertMap: Record<string, string> = {
                      '×': ' \\cdot ',
                      '÷': ' / ',
                      '+': ' + ',
                      '-': ' - ',
                      '=': ' = ',
                      '^': '^{2}',
                      '√': '\\sqrt{x}',
                    };
                    insertTextAtCursor(insertMap[char] || char);
                  }}
                  className="min-h-[34px] min-w-[34px] px-1.5 rounded-lg bg-slate-800 hover:bg-indigo-600 text-slate-200 hover:text-white text-xs font-bold flex items-center justify-center transition-all cursor-pointer active:scale-90 shrink-0 select-none"
                >
                  {char}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 3. PRIMARY BOTTOM ACTION BAR - Single horizontal row integrated with keyboard */}
      <div className="pt-2 border-t border-slate-800/80 flex items-center gap-1.5 sm:gap-2 w-full">
        {/* Space Button */}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => insertTextAtCursor(' ')}
          className="h-10 sm:h-11 px-2.5 sm:px-3 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-300 text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer select-none shrink-0"
          title="Inserir espaço"
        >
          <Space className="w-3.5 h-3.5 text-slate-400" />
          <span className="hidden xs:inline">Espaço</span>
        </button>

        {/* Quick Parentheses Insert */}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => insertTextAtCursor('()')}
          className="h-10 sm:h-11 px-2.5 sm:px-3 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-300 text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer font-mono select-none shrink-0"
          title="Inserir Parênteses ()"
        >
          ( )
        </button>

        {/* Return to numpad shortcut if in another tab */}
        {activeMenu !== 'numpad' && (
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setActiveMenu('numpad')}
            className="h-10 sm:h-11 px-2.5 sm:px-3 rounded-xl bg-indigo-950 hover:bg-indigo-900 border border-indigo-500/40 text-indigo-300 text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer select-none shrink-0"
            title="Voltar ao Teclado Básico"
          >
            <Calculator className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">123</span>
          </button>
        )}

        {/* Integrated Solve Button */}
        <button
          type="button"
          id="btn-solve-keyboard-action"
          onMouseDown={(e) => e.preventDefault()}
          onClick={onSolve}
          disabled={isLoading || !input.trim()}
          className="flex-1 h-10 sm:h-11 px-3 sm:px-5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 active:scale-95 disabled:opacity-50 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-1.5 sm:gap-2 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer uppercase tracking-wider select-none min-w-0"
          title="Resolver cálculo passo a passo"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0" />
              <span className="truncate">Calculando...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-300 animate-pulse shrink-0" />
              <span className="truncate">RESOLVER</span>
              <CornerDownLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 opacity-80 shrink-0 hidden xs:inline" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
