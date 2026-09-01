import React, { useState } from 'react';
import { FORMULA_CATEGORIES } from '../data/formulaCategories';
import { FormulaItem } from '../types';
import { MathRenderer } from './MathRenderer';
import { MathStructureModal } from './MathStructureModal';
import {
  RotateCcw,
  ArrowLeft,
  ArrowRight,
  ArrowLeftRight,
  Delete,
  ChevronLeft,
  ChevronRight,
  Wand2,
  Layers,
  History,
  Type,
  Sparkles,
} from 'lucide-react';

interface MathKeyboardProps {
  input: string;
  onInputChange: (newVal: string) => void;
  onSolve: () => void;
  isLoading: boolean;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  useNativeKeyboard?: boolean;
  onToggleNativeKeyboard?: () => void;
  onOpenHistory?: () => void;
}

export const MathKeyboard: React.FC<MathKeyboardProps> = ({
  input,
  onInputChange,
  onSolve,
  isLoading,
  textareaRef,
  useNativeKeyboard,
  onToggleNativeKeyboard,
  onOpenHistory,
}) => {
  // 'basic' (Photomath + - * /), 'functions', 'trigonometry', 'calculus', 'alpha', 'more'
  const [activeCategory, setActiveCategory] = useState<string>('basic');
  const [isStructureModalOpen, setIsStructureModalOpen] = useState(false);

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
    setTimeout(() => {
      try {
        textarea.focus({ preventScroll: true });
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      } catch {}
    }, 10);
  };

  // Smart Fraction Insertion (number directly above number)
  const insertSmartFraction = () => {
    triggerHaptic();
    const textarea = textareaRef.current;
    if (!textarea) {
      onInputChange(input + '\\frac{}{}');
      return;
    }
    const startPos = textarea.selectionStart ?? input.length;
    const endPos = textarea.selectionEnd ?? input.length;
    const selectedText = input.substring(startPos, endPos);

    // If text is selected (e.g. "7"), make it \frac{7}{} and place cursor inside denominator
    if (selectedText) {
      const insertion = `\\frac{${selectedText}}{}`;
      const newVal = input.substring(0, startPos) + insertion + input.substring(endPos);
      onInputChange(newVal);
      const newCursorPos = startPos + `\\frac{${selectedText}}{`.length;
      setTimeout(() => {
        try {
          textarea.focus({ preventScroll: true });
          textarea.setSelectionRange(newCursorPos, newCursorPos);
        } catch {}
      }, 10);
      return;
    }

    // If no text is selected, check if there is a number or term immediately before cursor (e.g. "7|")
    if (startPos > 0) {
      const textBefore = input.substring(0, startPos);
      const match = textBefore.match(/([0-9a-zA-Z\.]+|\([^()]+\))$/);
      if (match) {
        const matchedTerm = match[0];
        const matchStart = startPos - matchedTerm.length;
        const insertion = `\\frac{${matchedTerm}}{}`;
        const newVal = input.substring(0, matchStart) + insertion + input.substring(endPos);
        onInputChange(newVal);
        const newCursorPos = matchStart + `\\frac{${matchedTerm}}{`.length; // Inside denominator {}
        setTimeout(() => {
          try {
            textarea.focus({ preventScroll: true });
            textarea.setSelectionRange(newCursorPos, newCursorPos);
          } catch {}
        }, 10);
        return;
      }
    }

    // Otherwise insert empty fraction \frac{}{} and place cursor inside numerator
    const insertion = `\\frac{}{}`;
    const newVal = input.substring(0, startPos) + insertion + input.substring(endPos);
    onInputChange(newVal);
    const newCursorPos = startPos + 6; // Inside numerator {}
    setTimeout(() => {
      try {
        textarea.focus({ preventScroll: true });
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      } catch {}
    }, 10);
  };

  // Smart Square Root
  const insertSmartSquareRoot = () => {
    triggerHaptic();
    const textarea = textareaRef.current;
    if (!textarea) {
      onInputChange(input + '\\sqrt{}');
      return;
    }
    const startPos = textarea.selectionStart ?? input.length;
    const endPos = textarea.selectionEnd ?? input.length;
    const selectedText = input.substring(startPos, endPos);

    if (selectedText) {
      const insertion = `\\sqrt{${selectedText}}`;
      const newVal = input.substring(0, startPos) + insertion + input.substring(endPos);
      onInputChange(newVal);
      const newCursorPos = startPos + insertion.length;
      setTimeout(() => {
        try {
          textarea.focus({ preventScroll: true });
          textarea.setSelectionRange(newCursorPos, newCursorPos);
        } catch {}
      }, 10);
    } else {
      const insertion = `\\sqrt{}`;
      const newVal = input.substring(0, startPos) + insertion + input.substring(endPos);
      onInputChange(newVal);
      const newCursorPos = startPos + 6; // Inside {}
      setTimeout(() => {
        try {
          textarea.focus({ preventScroll: true });
          textarea.setSelectionRange(newCursorPos, newCursorPos);
        } catch {}
      }, 10);
    }
  };

  // Smart Exponent
  const insertSmartExponent = (fixedPower?: string) => {
    triggerHaptic();
    const textarea = textareaRef.current;
    if (!textarea) {
      onInputChange(input + (fixedPower ? `^${fixedPower}` : '^{}'));
      return;
    }
    const startPos = textarea.selectionStart ?? input.length;
    const endPos = textarea.selectionEnd ?? input.length;
    const selectedText = input.substring(startPos, endPos);

    // Check if there is already a base immediately preceding the cursor
    const textBefore = input.substring(0, startPos);
    const hasPrecedingBase = textBefore.length > 0 && /[0-9a-zA-Z\)\]\}]$/.test(textBefore);

    if (fixedPower) {
      let insertion = `^${fixedPower}`;
      let targetCursor = startPos + insertion.length;
      if (selectedText) {
        insertion = `(${selectedText})^${fixedPower}`;
        targetCursor = startPos + insertion.length;
      } else if (!hasPrecedingBase) {
        // When there is no base yet, place cursor at base position so user can type the base number or symbol!
        targetCursor = startPos;
      }
      const newVal = input.substring(0, startPos) + insertion + input.substring(endPos);
      onInputChange(newVal);
      setTimeout(() => {
        try {
          textarea.focus({ preventScroll: true });
          textarea.setSelectionRange(targetCursor, targetCursor);
        } catch {}
      }, 10);
    } else {
      let insertion = `^{}`;
      let targetCursor = hasPrecedingBase ? startPos + 2 : startPos;
      if (selectedText) {
        insertion = `(${selectedText})^{}`;
        targetCursor = startPos + insertion.length - 1; // inside {}
      }
      const newVal = input.substring(0, startPos) + insertion + input.substring(endPos);
      onInputChange(newVal);
      setTimeout(() => {
        try {
          textarea.focus({ preventScroll: true });
          textarea.setSelectionRange(targetCursor, targetCursor);
        } catch {}
      }, 10);
    }
  };

  const handleParentheses = () => {
    triggerHaptic();
    const textarea = textareaRef.current;
    if (!textarea) {
      onInputChange(input + '()');
      return;
    }
    const startPos = textarea.selectionStart ?? input.length;
    const endPos = textarea.selectionEnd ?? input.length;
    const selectedText = input.substring(startPos, endPos);

    if (selectedText) {
      const insertion = `(${selectedText})`;
      const newVal = input.substring(0, startPos) + insertion + input.substring(endPos);
      onInputChange(newVal);
      setTimeout(() => {
        try {
          textarea.focus({ preventScroll: true });
          textarea.setSelectionRange(startPos + insertion.length, startPos + insertion.length);
        } catch {}
      }, 10);
    } else {
      const insertion = '()';
      const newVal = input.substring(0, startPos) + insertion + input.substring(endPos);
      onInputChange(newVal);
      setTimeout(() => {
        try {
          textarea.focus({ preventScroll: true });
          textarea.setSelectionRange(startPos + 1, startPos + 1);
        } catch {}
      }, 10);
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
      setTimeout(() => {
        try {
          textarea.focus({ preventScroll: true });
          textarea.setSelectionRange(startPos, startPos);
        } catch {}
      }, 10);
    } else if (startPos > 0) {
      // Check if we are deleting a command like \frac{}{} or \sqrt{}
      const before = input.substring(0, startPos);
      let deleteCount = 1;

      if (before.endsWith('\\frac{}{}')) deleteCount = 9;
      else if (before.endsWith('\\frac{')) deleteCount = 6;
      else if (before.endsWith('\\sqrt{}')) deleteCount = 7;
      else if (before.endsWith('\\sqrt{')) deleteCount = 6;
      else if (before.endsWith('\\cdot')) deleteCount = 5;
      else if (before.endsWith('\\times')) deleteCount = 6;
      else if (before.endsWith('\\div')) deleteCount = 4;
      else if (before.endsWith('\\pi')) deleteCount = 3;
      else if (before.endsWith('^{}')) deleteCount = 3;

      const newVal = input.substring(0, startPos - deleteCount) + input.substring(startPos);
      onInputChange(newVal);
      setTimeout(() => {
        try {
          textarea.focus({ preventScroll: true });
          textarea.setSelectionRange(startPos - deleteCount, startPos - deleteCount);
        } catch {}
      }, 10);
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

  return (
    <div className="w-full flex-1 flex flex-col justify-between bg-slate-900 border border-slate-800 rounded-3xl p-3 sm:p-5 shadow-2xl space-y-3.5 box-border overflow-hidden">
      {/* Structure Builder Modal */}
      <MathStructureModal
        isOpen={isStructureModalOpen}
        onClose={() => setIsStructureModalOpen(false)}
        onInsertLatex={(latex) => insertTextAtCursor(latex)}
      />

      {/* 1. PHOTOMATH TOP UTILITY ROW: [abc] [⟲] [←] [→] [⇄] [⌫] */}
      <div className="flex items-center justify-between gap-2 px-1">
        {/* abc - Switch to variable letters / native keyboard */}
        <button
          type="button"
          onClick={() => {
            triggerHaptic();
            setActiveCategory(activeCategory === 'alpha' ? 'basic' : 'alpha');
          }}
          className={`h-10 sm:h-11 px-3 sm:px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center transition-all cursor-pointer select-none ${
            activeCategory === 'alpha'
              ? 'bg-rose-600 text-white shadow-md'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white'
          }`}
          title="Teclado Alfabético (a, b, c, x, y, z...)"
        >
          abc
        </button>

        {/* ⟲ - Open History Drawer */}
        <button
          type="button"
          onClick={() => {
            triggerHaptic();
            if (onOpenHistory) onOpenHistory();
          }}
          className="w-10 sm:w-11 h-10 sm:h-11 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer select-none"
          title="Histórico de Cálculos"
        >
          <History className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        {/* ← - Move Cursor Left */}
        <button
          type="button"
          onClick={() => moveCursor('left')}
          className="w-10 sm:w-11 h-10 sm:h-11 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer select-none"
          title="Mover cursor para esquerda"
        >
          <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        {/* → - Move Cursor Right */}
        <button
          type="button"
          onClick={() => moveCursor('right')}
          className="w-10 sm:w-11 h-10 sm:h-11 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer select-none"
          title="Mover cursor para direita"
        >
          <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        {/* ⇄ - Visual Builder / Structure */}
        <button
          type="button"
          onClick={() => {
            triggerHaptic();
            setIsStructureModalOpen(true);
          }}
          className="w-10 sm:w-11 h-10 sm:h-11 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 hover:text-white flex items-center justify-center transition-all cursor-pointer select-none"
          title="Construtor Visual Interativo"
        >
          <ArrowLeftRight className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        {/* ⌫ - Backspace */}
        <button
          type="button"
          onClick={handleBackspace}
          className="h-10 sm:h-11 px-3 sm:px-4 rounded-xl bg-slate-800 hover:bg-rose-950/60 active:bg-rose-900 text-slate-300 hover:text-rose-300 flex items-center justify-center transition-all cursor-pointer select-none"
          title="Apagar caractere"
        >
          <Delete className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </div>

      {/* 2. PHOTOMATH CATEGORY PILLS: [+-×÷] [> < ≥ ≤ ≠] [f(x) e / log ln] [sin cos / tan cot] [lim dx / ∫ ∑ ∞] */}
      <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 scrollbar-none px-1">
        {[
          { id: 'basic', label: '+ − × ÷' },
          { id: 'inequalities', label: '> < ≥ ≤ ≠' },
          { id: 'functions', label: 'f(x) e / log ln' },
          { id: 'trigonometry', label: 'sin cos / tan cot' },
          { id: 'calculus', label: 'lim dx / ∫ ∑ ∞' },
        ].map((cat) => {
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                triggerHaptic();
                setActiveCategory(cat.id);
              }}
              className={`flex-1 min-h-[38px] sm:min-h-[42px] px-2.5 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-150 cursor-pointer active:scale-95 text-center select-none ${
                isActive
                  ? 'bg-slate-950 text-white ring-2 ring-rose-500 shadow-md'
                  : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* 3. PHOTOMATH EXTENDED KEYPAD GRID */}
      <div className="pt-1 flex-1 flex flex-col justify-center">
        {/* A. BASIC ARITHMETIC GRID */}
        {activeCategory === 'basic' && (
          <div className="space-y-2">
            {/* Quick Relational & Inequality Bar */}
            <div className="grid grid-cols-6 gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={() => insertTextAtCursor(' < ')}
                className="h-10 sm:h-11 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800/90 hover:border-slate-700 text-slate-200 hover:text-white font-bold text-base sm:text-lg flex items-center justify-center active:scale-95 transition-all cursor-pointer select-none"
                title="Menor que (<)"
              >
                &lt;
              </button>
              <button
                type="button"
                onClick={() => insertTextAtCursor(' > ')}
                className="h-10 sm:h-11 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800/90 hover:border-slate-700 text-slate-200 hover:text-white font-bold text-base sm:text-lg flex items-center justify-center active:scale-95 transition-all cursor-pointer select-none"
                title="Maior que (>)"
              >
                &gt;
              </button>
              <button
                type="button"
                onClick={() => insertTextAtCursor(' \\le ')}
                className="h-10 sm:h-11 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800/90 hover:border-slate-700 text-rose-300 hover:text-rose-200 font-bold text-base sm:text-lg flex items-center justify-center active:scale-95 transition-all cursor-pointer select-none"
                title="Menor ou igual (≤)"
              >
                ≤
              </button>
              <button
                type="button"
                onClick={() => insertTextAtCursor(' \\ge ')}
                className="h-10 sm:h-11 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800/90 hover:border-slate-700 text-rose-300 hover:text-rose-200 font-bold text-base sm:text-lg flex items-center justify-center active:scale-95 transition-all cursor-pointer select-none"
                title="Maior ou igual (≥)"
              >
                ≥
              </button>
              <button
                type="button"
                onClick={() => insertTextAtCursor(' \\ne ')}
                className="h-10 sm:h-11 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800/90 hover:border-slate-700 text-amber-300 hover:text-amber-200 font-bold text-base sm:text-lg flex items-center justify-center active:scale-95 transition-all cursor-pointer select-none"
                title="Diferente de (≠)"
              >
                ≠
              </button>
              <button
                type="button"
                onClick={() => insertTextAtCursor(' = ')}
                className="h-10 sm:h-11 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800/90 hover:border-slate-700 text-emerald-400 hover:text-emerald-300 font-bold text-base sm:text-lg flex items-center justify-center active:scale-95 transition-all cursor-pointer select-none"
                title="Igualdade (=)"
              >
                =
              </button>
            </div>

            {/* Main Numeric & Operator Matrix */}
            <div className="grid grid-cols-6 gap-2 sm:gap-2.5">
              {/* ROW 1: (□) | |□| | 7 | 8 | 9 | ÷ */}
              <button
                type="button"
                onClick={handleParentheses}
                className="h-13 sm:h-15 md:h-17 rounded-2xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 hover:text-white font-medium text-base sm:text-xl flex items-center justify-center active:scale-95 transition-all cursor-pointer select-none"
                title="Parênteses"
              >
                <span className="flex items-center text-rose-400 font-bold">
                  (<span className="w-2.5 h-2.5 sm:w-3 sm:h-3 border border-dashed border-rose-400 rounded-xs mx-0.5 inline-block" />)
                </span>
              </button>

              <button
                type="button"
                onClick={() => insertTextAtCursor('|x|')}
                className="h-13 sm:h-15 md:h-17 rounded-2xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 hover:text-white font-bold text-base sm:text-xl flex items-center justify-center active:scale-95 transition-all cursor-pointer select-none"
                title="Valor Absoluto / Módulo (|x|)"
              >
                |x|
              </button>

              <button
                type="button"
                onClick={() => insertTextAtCursor('7')}
                className="h-13 sm:h-15 md:h-17 rounded-2xl bg-slate-800/90 hover:bg-slate-700 text-white font-bold text-xl sm:text-2xl flex items-center justify-center active:scale-95 transition-all cursor-pointer select-none shadow-sm"
              >
                7
              </button>
              <button
                type="button"
                onClick={() => insertTextAtCursor('8')}
                className="h-13 sm:h-15 md:h-17 rounded-2xl bg-slate-800/90 hover:bg-slate-700 text-white font-bold text-xl sm:text-2xl flex items-center justify-center active:scale-95 transition-all cursor-pointer select-none shadow-sm"
              >
                8
              </button>
              <button
                type="button"
                onClick={() => insertTextAtCursor('9')}
                className="h-13 sm:h-15 md:h-17 rounded-2xl bg-slate-800/90 hover:bg-slate-700 text-white font-bold text-xl sm:text-2xl flex items-center justify-center active:scale-95 transition-all cursor-pointer select-none shadow-sm"
              >
                9
              </button>

              <button
                type="button"
                onClick={() => insertTextAtCursor(' / ')}
                className="h-13 sm:h-15 md:h-17 rounded-2xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 hover:text-white font-bold text-xl sm:text-2xl flex items-center justify-center active:scale-95 transition-all cursor-pointer select-none"
                title="Divisão"
              >
                ÷
              </button>

              {/* ROW 2: □/□ (Fraction) | √□ (Root) | 4 | 5 | 6 | × */}
              <button
                type="button"
                onClick={insertSmartFraction}
                className="h-13 sm:h-15 md:h-17 rounded-2xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 hover:text-white font-medium flex flex-col items-center justify-center active:scale-95 transition-all cursor-pointer select-none p-1"
                title="Fração Vertical (número sobre o outro)"
              >
                <div className="flex flex-col items-center justify-center leading-none">
                  <span className="w-4 h-3 sm:w-4.5 sm:h-3.5 border border-dashed border-rose-400 rounded-xs mb-0.5" />
                  <span className="w-6 h-[2px] bg-slate-300" />
                  <span className="w-4 h-3 sm:w-4.5 sm:h-3.5 border border-dashed border-rose-400 rounded-xs mt-0.5" />
                </div>
              </button>

              <button
                type="button"
                onClick={insertSmartSquareRoot}
                className="h-13 sm:h-15 md:h-17 rounded-2xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 hover:text-white font-medium flex items-center justify-center active:scale-95 transition-all cursor-pointer select-none"
                title="Raiz Quadrada"
              >
                <div className="flex items-center text-slate-200">
                  <span className="text-xl sm:text-2xl font-serif">√</span>
                  <span className="w-4 h-3.5 sm:w-4.5 sm:h-4 border border-dashed border-rose-400 rounded-xs ml-0.5 -mt-1" />
                </div>
              </button>

              <button
                type="button"
                onClick={() => insertTextAtCursor('4')}
                className="h-13 sm:h-15 md:h-17 rounded-2xl bg-slate-800/90 hover:bg-slate-700 text-white font-bold text-xl sm:text-2xl flex items-center justify-center active:scale-95 transition-all cursor-pointer select-none shadow-sm"
              >
                4
              </button>
              <button
                type="button"
                onClick={() => insertTextAtCursor('5')}
                className="h-13 sm:h-15 md:h-17 rounded-2xl bg-slate-800/90 hover:bg-slate-700 text-white font-bold text-xl sm:text-2xl flex items-center justify-center active:scale-95 transition-all cursor-pointer select-none shadow-sm"
              >
                5
              </button>
              <button
                type="button"
                onClick={() => insertTextAtCursor('6')}
                className="h-13 sm:h-15 md:h-17 rounded-2xl bg-slate-800/90 hover:bg-slate-700 text-white font-bold text-xl sm:text-2xl flex items-center justify-center active:scale-95 transition-all cursor-pointer select-none shadow-sm"
              >
                6
              </button>

              <button
                type="button"
                onClick={() => insertTextAtCursor(' \\cdot ')}
                className="h-13 sm:h-15 md:h-17 rounded-2xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 hover:text-white font-bold text-xl sm:text-2xl flex items-center justify-center active:scale-95 transition-all cursor-pointer select-none"
                title="Multiplicação"
              >
                ×
              </button>

              {/* ROW 3: □² (Square Power) | x | 1 | 2 | 3 | − */}
              <button
                type="button"
                onClick={() => insertSmartExponent('2')}
                className="h-13 sm:h-15 md:h-17 rounded-2xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 hover:text-white font-medium flex items-center justify-center active:scale-95 transition-all cursor-pointer select-none"
                title="Ao Quadrado (x²)"
              >
                <div className="flex items-start">
                  <span className="w-4 h-4 sm:w-4.5 sm:h-4.5 border border-dashed border-rose-400 rounded-xs mt-1" />
                  <span className="text-sm font-bold text-slate-200 ml-0.5">2</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => insertTextAtCursor('x')}
                className="h-13 sm:h-15 md:h-17 rounded-2xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 hover:text-white font-bold italic font-serif text-xl sm:text-2xl flex items-center justify-center active:scale-95 transition-all cursor-pointer select-none"
                title="Variável x"
              >
                x
              </button>

              <button
                type="button"
                onClick={() => insertTextAtCursor('1')}
                className="h-13 sm:h-15 md:h-17 rounded-2xl bg-slate-800/90 hover:bg-slate-700 text-white font-bold text-xl sm:text-2xl flex items-center justify-center active:scale-95 transition-all cursor-pointer select-none shadow-sm"
              >
                1
              </button>
              <button
                type="button"
                onClick={() => insertTextAtCursor('2')}
                className="h-13 sm:h-15 md:h-17 rounded-2xl bg-slate-800/90 hover:bg-slate-700 text-white font-bold text-xl sm:text-2xl flex items-center justify-center active:scale-95 transition-all cursor-pointer select-none shadow-sm"
              >
                2
              </button>
              <button
                type="button"
                onClick={() => insertTextAtCursor('3')}
                className="h-13 sm:h-15 md:h-17 rounded-2xl bg-slate-800/90 hover:bg-slate-700 text-white font-bold text-xl sm:text-2xl flex items-center justify-center active:scale-95 transition-all cursor-pointer select-none shadow-sm"
              >
                3
              </button>

              <button
                type="button"
                onClick={() => insertTextAtCursor(' - ')}
                className="h-13 sm:h-15 md:h-17 rounded-2xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 hover:text-white font-bold text-xl sm:text-2xl flex items-center justify-center active:scale-95 transition-all cursor-pointer select-none"
                title="Subtração"
              >
                −
              </button>

              {/* ROW 4: π | % | 0 | , | xʸ | + */}
              <button
                type="button"
                onClick={() => insertTextAtCursor('\\pi')}
                className="h-13 sm:h-15 md:h-17 rounded-2xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 hover:text-white font-serif text-xl sm:text-2xl flex items-center justify-center active:scale-95 transition-all cursor-pointer select-none"
                title="Constante Pi (π)"
              >
                π
              </button>

              <button
                type="button"
                onClick={() => insertTextAtCursor('%')}
                className="h-13 sm:h-15 md:h-17 rounded-2xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 hover:text-white font-bold text-lg sm:text-xl flex items-center justify-center active:scale-95 transition-all cursor-pointer select-none"
                title="Porcentagem"
              >
                %
              </button>

              <button
                type="button"
                onClick={() => insertTextAtCursor('0')}
                className="h-13 sm:h-15 md:h-17 rounded-2xl bg-slate-800/90 hover:bg-slate-700 text-white font-bold text-xl sm:text-2xl flex items-center justify-center active:scale-95 transition-all cursor-pointer select-none shadow-sm"
              >
                0
              </button>

              <button
                type="button"
                onClick={() => insertTextAtCursor(',')}
                className="h-13 sm:h-15 md:h-17 rounded-2xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 hover:text-white font-bold text-xl sm:text-2xl flex items-center justify-center active:scale-95 transition-all cursor-pointer select-none"
                title="Vírgula decimal"
              >
                ,
              </button>

              <button
                type="button"
                onClick={() => insertSmartExponent()}
                className="h-13 sm:h-15 md:h-17 rounded-2xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 hover:text-white font-bold text-base sm:text-lg flex items-center justify-center active:scale-95 transition-all cursor-pointer select-none"
                title="Potência genérica (xʸ)"
              >
                xʸ
              </button>

              <button
                type="button"
                onClick={() => insertTextAtCursor(' + ')}
                className="h-13 sm:h-15 md:h-17 rounded-2xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 hover:text-white font-bold text-xl sm:text-2xl flex items-center justify-center active:scale-95 transition-all cursor-pointer select-none"
                title="Adição"
              >
                +
              </button>
            </div>
          </div>
        )}

        {/* B. INEQUALITIES & RELATIONS TAB */}
        {activeCategory === 'inequalities' && (
          <div className="space-y-3">
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              {[
                { label: '<', insert: ' < ', tip: 'Menor que' },
                { label: '>', insert: ' > ', tip: 'Maior que' },
                { label: '≤', insert: ' \\le ', tip: 'Menor ou igual' },
                { label: '≥', insert: ' \\ge ', tip: 'Maior ou igual' },
                { label: '≠', insert: ' \\ne ', tip: 'Diferente' },
                { label: '=', insert: ' = ', tip: 'Igual' },
                { label: '|x|', insert: '|x|', tip: 'Módulo' },
                { label: '|x-a| < b', insert: '|x - 2| < 5', tip: 'Inequação modular interna' },
                { label: '|x-a| ≥ b', insert: '|x - 1| \\ge 3', tip: 'Inequação modular externa' },
                { label: '[a, b]', insert: '[a, b]', tip: 'Intervalo fechado' },
                { label: ']a, b[', insert: ']a, b[', tip: 'Intervalo aberto' },
                { label: '[a, b[', insert: '[a, b[', tip: 'Intervalo semi-aberto à direita' },
                { label: '∈', insert: ' \\in ', tip: 'Pertence a' },
                { label: '∉', insert: ' \\notin ', tip: 'Não pertence a' },
                { label: '∪', insert: ' \\cup ', tip: 'União de intervalos' },
                { label: '∩', insert: ' \\cap ', tip: 'Interseção' },
                { label: 'ℝ', insert: '\\mathbb{R}', tip: 'Conjunto dos Reais' },
                { label: '∅', insert: '\\emptyset', tip: 'Conjunto Vazio' },
                { label: '∞', insert: '\\infty', tip: 'Infinito' },
                { label: '-∞', insert: '-\\infty', tip: 'Menos infinito' },
                { label: 'x > 0', insert: 'x > 0', tip: 'Restrição de positividade' },
                { label: 'x ≥ 0', insert: 'x \\ge 0', tip: 'Não negativo' },
                { label: 'x < 0', insert: 'x < 0', tip: 'Negativo' },
                { label: 'x ≤ 0', insert: 'x \\le 0', tip: 'Não positivo' },
              ].map((btn, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => insertTextAtCursor(btn.insert)}
                  className="h-12 sm:h-14 rounded-2xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 hover:text-white font-bold text-sm sm:text-base flex items-center justify-center active:scale-95 transition-all cursor-pointer select-none"
                  title={btn.tip}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* B. FUNCTIONS TAB: f(x) e / log ln */}
        {activeCategory === 'functions' && (
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
            {[
              { label: 'f(x)', insert: 'f(x)' },
              { label: 'g(x)', insert: 'g(x)' },
              { label: 'ln', insert: '\\ln(' },
              { label: 'log', insert: '\\log(' },
              { label: 'log₁₀', insert: '\\log_{10}(' },
              { label: 'eˣ', insert: 'e^{' },
              { label: '|x|', insert: '|x|' },
              { label: 'ⁿ√x', action: () => insertTextAtCursor('\\sqrt[n]{x}') },
              { label: 'xʸ', action: () => insertSmartExponent() },
              { label: 'x⁻¹', insert: '^{-1}' },
              { label: '10ˣ', insert: '10^{' },
              { label: 'e', insert: 'e' },
              { label: '[ ]', insert: '[]' },
              { label: '{ }', insert: '\\{\\}' },
              { label: 'y', insert: 'y' },
              { label: 'z', insert: 'z' },
              { label: '≤', insert: ' \\le ' },
              { label: '≥', insert: ' \\ge ' },
              { label: '≠', insert: ' \\ne ' },
              { label: '<', insert: ' < ' },
              { label: '>', insert: ' > ' },
              { label: 'i', insert: 'i' },
              { label: '∞', insert: '\\infty' },
              { label: 'n!', insert: '!' },
            ].map((btn, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => (btn.action ? btn.action() : insertTextAtCursor(btn.insert || ''))}
                className="h-12 sm:h-14 md:h-16 rounded-2xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 hover:text-white font-bold text-sm sm:text-lg flex items-center justify-center active:scale-95 transition-all cursor-pointer select-none"
              >
                {btn.label}
              </button>
            ))}
          </div>
        )}

        {/* C. TRIGONOMETRY TAB: sin cos / tan cot */}
        {activeCategory === 'trigonometry' && (
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
            {[
              { label: 'sin', insert: '\\sin(' },
              { label: 'cos', insert: '\\cos(' },
              { label: 'tan', insert: '\\tan(' },
              { label: 'cot', insert: '\\cot(' },
              { label: 'sec', insert: '\\sec(' },
              { label: 'csc', insert: '\\csc(' },
              { label: 'arcsin', insert: '\\arcsin(' },
              { label: 'arccos', insert: '\\arccos(' },
              { label: 'arctan', insert: '\\arctan(' },
              { label: 'sinh', insert: '\\sinh(' },
              { label: 'cosh', insert: '\\cosh(' },
              { label: 'tanh', insert: '\\tanh(' },
              { label: 'π', insert: '\\pi' },
              { label: 'θ', insert: '\\theta' },
              { label: 'α', insert: '\\alpha' },
              { label: 'β', insert: '\\beta' },
              { label: '°', insert: '^\\circ' },
              { label: 'rad', insert: ' \\text{rad}' },
            ].map((btn, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => insertTextAtCursor(btn.insert)}
                className="h-12 sm:h-14 md:h-16 rounded-2xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 hover:text-white font-bold text-sm sm:text-lg flex items-center justify-center active:scale-95 transition-all cursor-pointer select-none"
              >
                {btn.label}
              </button>
            ))}
          </div>
        )}

        {/* D. CALCULUS TAB: lim dx / ∫ ∑ ∞ */}
        {activeCategory === 'calculus' && (
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
            {[
              { label: 'lim', insert: '\\lim_{x \\to 0} ' },
              { label: 'd/dx', insert: '\\frac{d}{dx} ' },
              { label: '∫', insert: '\\int ' },
              { label: '∫ₐᵇ', insert: '\\int_{a}^{b} ' },
              { label: '∑', insert: '\\sum_{i=1}^{n} ' },
              { label: '∏', insert: '\\prod_{i=1}^{n} ' },
              { label: 'dx', insert: ' dx' },
              { label: 'dt', insert: ' dt' },
              { label: 'dy/dx', insert: '\\frac{dy}{dx}' },
              { label: 'f\'(x)', insert: "f'(x)" },
              { label: 'f\'\'(x)', insert: "f''(x)" },
              { label: '∂/∂x', insert: '\\frac{\\partial}{\\partial x}' },
              { label: 'Δ', insert: '\\Delta' },
              { label: '→', insert: ' \\to ' },
              { label: '∞', insert: '\\infty' },
              { label: 'x₀', insert: 'x_0' },
            ].map((btn, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => insertTextAtCursor(btn.insert)}
                className="h-12 sm:h-14 md:h-16 rounded-2xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 hover:text-white font-bold text-sm sm:text-lg flex items-center justify-center active:scale-95 transition-all cursor-pointer select-none"
              >
                {btn.label}
              </button>
            ))}
          </div>
        )}

        {/* E. ALPHABETIC (abc) TAB */}
        {activeCategory === 'alpha' && (
          <div className="space-y-2">
            <div className="grid grid-cols-7 sm:grid-cols-10 gap-2">
              {'abcdefghijklmnopqrstuvwxyz'.split('').map((char) => (
                <button
                  key={char}
                  type="button"
                  onClick={() => insertTextAtCursor(char)}
                  className="h-11 sm:h-13 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 hover:text-white font-mono text-base sm:text-lg flex items-center justify-center active:scale-95 transition-all cursor-pointer select-none"
                >
                  {char}
                </button>
              ))}
            </div>
            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => setActiveCategory('basic')}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs sm:text-sm font-bold text-slate-300"
              >
                Voltar aos Números
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
