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
  onOpenHistory?: () => void;
}

export const MathKeyboard: React.FC<MathKeyboardProps> = ({
  input,
  onInputChange,
  onSolve,
  isLoading,
  textareaRef,
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

  const updateTextareaSelection = (startPos: number, endPos = startPos) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    try {
      textarea.setSelectionRange(startPos, endPos);
    } catch {}
  };

  const insertTextAtCursor = (textToInsert: string) => {
    triggerHaptic();
    const textarea = textareaRef.current;
    if (!textarea) {
      onInputChange(input + textToInsert);
      return;
    }

    let startPos = textarea.selectionStart ?? input.length;
    let endPos = textarea.selectionEnd ?? input.length;

    // Guard: If startPos is right between '}' and '{' in \frac{num}|{}, shift it into denominator
    if (startPos > 0 && input[startPos - 1] === '}' && input[startPos] === '{') {
      startPos += 1;
      endPos = startPos;
    }

    // Smart division: If user is inside numerator of \frac{num}{den} and types '/' or '÷':
    // Jump straight to denominator instead of inserting '/' into numerator!
    if ((textToInsert.trim() === '/' || textToInsert.trim() === '÷')) {
      if (input.substring(startPos).startsWith('\\frac{')) {
        updateTextareaSelection(startPos + 6);
        return;
      }
      if (input.substring(startPos).startsWith('}{')) {
        updateTextareaSelection(startPos + 2);
        return;
      }
      if (input.substring(startPos).startsWith('}')) {
        updateTextareaSelection(startPos + 1);
        return;
      }
    }

    const currentVal = input;
    const newVal = currentVal.substring(0, startPos) + textToInsert + currentVal.substring(endPos);
    onInputChange(newVal);

    const newCursorPos = startPos + textToInsert.length;
    setTimeout(() => {
      updateTextareaSelection(newCursorPos);
    }, 10);
  };

  // Smart Simple Fraction \frac{}{}
  const insertSmartFraction = () => {
    triggerHaptic();
    const textarea = textareaRef.current;

    let currentVal = input;
    if (currentVal.trim() === '2x^2 - 8x + 6 = 0') {
      currentVal = '';
      onInputChange('');
    }

    if (!textarea) {
      onInputChange('\\frac{}{}');
      return;
    }
    const startPos = currentVal === '' ? 0 : (textarea.selectionStart ?? currentVal.length);
    const endPos = currentVal === '' ? 0 : (textarea.selectionEnd ?? currentVal.length);
    const selectedText = currentVal.substring(startPos, endPos);

    // If text was explicitly selected (e.g. "x + 1"), wrap it into numerator and jump to denominator:
    if (selectedText) {
      const insertion = `\\frac{${selectedText}}{}`;
      const newVal = currentVal.substring(0, startPos) + insertion + currentVal.substring(endPos);
      onInputChange(newVal);
      const newCursorPos = startPos + `\\frac{${selectedText}}{`.length;
      setTimeout(() => {
        updateTextareaSelection(newCursorPos);
      }, 10);
      return;
    }

    // If NO text is selected:
    // Insert empty fraction \frac{}{} and place cursor inside numerator {}
    // Do NOT steal previous numbers!
    const insertion = `\\frac{}{}`;
    const newVal = currentVal.substring(0, startPos) + insertion + currentVal.substring(endPos);
    onInputChange(newVal);
    const newCursorPos = startPos + 6; // Inside numerator {}
    setTimeout(() => {
      updateTextareaSelection(newCursorPos);
    }, 10);
  };

  // Smart Mixed Number (Número Misto) e.g. 4\frac{7}{4} or 2\frac{1}{3}
  const insertMixedNumber = () => {
    triggerHaptic();
    const textarea = textareaRef.current;

    let currentVal = input;
    if (currentVal.trim() === '2x^2 - 8x + 6 = 0') {
      currentVal = '';
      onInputChange('');
    }

    if (!textarea) {
      onInputChange('1\\frac{}{}');
      return;
    }
    const startPos = currentVal === '' ? 0 : (textarea.selectionStart ?? currentVal.length);
    const endPos = currentVal === '' ? 0 : (textarea.selectionEnd ?? currentVal.length);
    const selectedText = currentVal.substring(startPos, endPos);

    // 1. If text is selected and is a number, use that as the whole number:
    if (selectedText && /^\d+$/.test(selectedText.trim())) {
      const whole = selectedText.trim();
      const insertion = `${whole}\\frac{}{}`;
      const newVal = currentVal.substring(0, startPos) + insertion + currentVal.substring(endPos);
      onInputChange(newVal);
      const newCursorPos = startPos + whole.length + 6; // inside numerator
      setTimeout(() => {
        updateTextareaSelection(newCursorPos);
      }, 10);
      return;
    }

    // 2. If there is already an integer immediately before cursor (e.g. "4|"):
    if (startPos > 0) {
      const textBefore = currentVal.substring(0, startPos);
      const matchNum = textBefore.match(/(\d+)$/);
      if (matchNum) {
        // Keep the number as the whole part, append \frac{}{} with cursor in numerator:
        const insertion = `\\frac{}{}`;
        const newVal = currentVal.substring(0, startPos) + insertion + currentVal.substring(endPos);
        onInputChange(newVal);
        const newCursorPos = startPos + 6; // inside numerator {}
        setTimeout(() => {
          updateTextareaSelection(newCursorPos);
        }, 10);
        return;
      }
    }

    // 3. If cursor is right before a simple fraction \frac{...}{...}, convert it by prefixing '1':
    const textAfter = currentVal.substring(startPos);
    if (textAfter.startsWith('\\frac{')) {
      const newVal = currentVal.substring(0, startPos) + '1' + textAfter;
      onInputChange(newVal);
      setTimeout(() => {
        updateTextareaSelection(startPos, startPos + 1); // select '1'
      }, 10);
      return;
    }

    // 4. Default: insert standard mixed template "1\frac{}{}" with "1" selected
    const insertion = `1\\frac{}{}`;
    const newVal = currentVal.substring(0, startPos) + insertion + currentVal.substring(endPos);
    onInputChange(newVal);
    setTimeout(() => {
      updateTextareaSelection(startPos, startPos + 1); // select '1' so user can replace or type
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
        updateTextareaSelection(newCursorPos);
      }, 10);
    } else {
      const insertion = `\\sqrt{}`;
      const newVal = input.substring(0, startPos) + insertion + input.substring(endPos);
      onInputChange(newVal);
      const newCursorPos = startPos + 6; // Inside {}
      setTimeout(() => {
        updateTextareaSelection(newCursorPos);
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
      let insertion = `^{${fixedPower}}`;
      let targetCursor = startPos + insertion.length;
      if (selectedText) {
        insertion = `(${selectedText})^{${fixedPower}}`;
        targetCursor = startPos + insertion.length;
      } else if (!hasPrecedingBase) {
        // When there is no base yet, place cursor at base position so user can type the base number or symbol!
        targetCursor = startPos;
      }
      const newVal = input.substring(0, startPos) + insertion + input.substring(endPos);
      onInputChange(newVal);
      setTimeout(() => {
        updateTextareaSelection(targetCursor);
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
        updateTextareaSelection(targetCursor);
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
        updateTextareaSelection(startPos + insertion.length);
      }, 10);
    } else {
      const insertion = '()';
      const newVal = input.substring(0, startPos) + insertion + input.substring(endPos);
      onInputChange(newVal);
      setTimeout(() => {
        updateTextareaSelection(startPos + 1);
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
        updateTextareaSelection(startPos);
      }, 10);
    } else if (startPos > 0) {
      const before = input.substring(0, startPos);
      const after = input.substring(startPos);

      // 1. If cursor is at start of denominator: \frac{num}{|} where before ends with '}{'
      // DO NOT delete '{' which corrupts LaTeX fraction! Instead, jump back to numerator:
      if (before.endsWith('}{')) {
        updateTextareaSelection(startPos - 2);
        return;
      }

      // 2. If fraction is empty \frac{}{} and cursor is in numerator: \frac{|}
      if (before.endsWith('\\frac{') && after.startsWith('}{}')) {
        const newVal = input.substring(0, startPos - 6) + input.substring(startPos + 3);
        onInputChange(newVal);
        setTimeout(() => {
          updateTextareaSelection(startPos - 6);
        }, 10);
        return;
      }

      // 3. If cursor is right between '}{'
      if (before.endsWith('}') && after.startsWith('{')) {
        updateTextareaSelection(startPos - 1);
        return;
      }

      // Check if we are deleting a command
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
        updateTextareaSelection(startPos - deleteCount);
      }, 10);
    }
  };

  const moveCursor = (direction: 'left' | 'right') => {
    triggerHaptic();
    const textarea = textareaRef.current;
    if (!textarea) return;
    const currentPos = textarea.selectionStart ?? input.length;
    let targetPos = currentPos;

    if (direction === 'right') {
      // If cursor is right before \frac{, jump directly over \frac{ into the numerator!
      if (input.substring(currentPos).startsWith('\\frac{')) {
        targetPos = currentPos + 6;
      } else if (input.startsWith('}{', currentPos)) {
        // If at end of numerator right before '}{', jump cleanly into denominator!
        targetPos = currentPos + 2;
      } else if (input.startsWith('}', currentPos)) {
        // At closing brace of denominator or exponent, jump cleanly outside '}'
        targetPos = currentPos + 1;
      } else {
        targetPos = Math.min(input.length, currentPos + 1);
      }
    } else {
      // Moving left:
      // If at start of denominator right after '{' in '}{', jump cleanly to end of numerator!
      if (currentPos >= 2 && input.substring(currentPos - 2, currentPos) === '}{') {
        targetPos = currentPos - 2;
      } else if (currentPos >= 6 && input.substring(currentPos - 6, currentPos) === '\\frac{') {
        targetPos = currentPos - 6;
      } else if (currentPos >= 1 && input[currentPos - 1] === '}') {
        targetPos = currentPos - 1;
      } else {
        targetPos = Math.max(0, currentPos - 1);
      }
    }

    updateTextareaSelection(targetPos);
  };

  return (
    <div
      onMouseDown={(e) => {
        const target = e.target as HTMLElement;
        if (target.tagName === 'BUTTON' || target.closest('button')) {
          e.preventDefault();
        }
      }}
      className="w-full flex flex-col bg-slate-900 border border-slate-800 rounded-3xl p-2.5 sm:p-4 shadow-2xl box-border overflow-hidden gap-2 sm:gap-2.5 shrink-0"
    >
      {/* Structure Builder Modal */}
      <MathStructureModal
        isOpen={isStructureModalOpen}
        onClose={() => setIsStructureModalOpen(false)}
        onInsertLatex={(latex) => insertTextAtCursor(latex)}
      />

      {/* 1. PHOTOMATH TOP UTILITY ROW: [abc] [⟲] [←] [→] [⇄] [⌫] */}
      <div className="flex items-center justify-between gap-1.5 sm:gap-2 px-0.5 shrink-0">
        {/* abc - Switch to variable letters / native keyboard */}
        <button
          type="button"
          onClick={() => {
            triggerHaptic();
            setActiveCategory(activeCategory === 'alpha' ? 'basic' : 'alpha');
          }}
          className={`h-10 sm:h-11 px-3 sm:px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center transition-all cursor-pointer select-none active:scale-95 ${
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
          className="w-10 sm:w-11 h-10 sm:h-11 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer select-none active:scale-95"
          title="Histórico de Cálculos"
        >
          <History className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        {/* ← - Move Cursor Left */}
        <button
          type="button"
          onClick={() => moveCursor('left')}
          className="w-10 sm:w-11 h-10 sm:h-11 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer select-none active:scale-95"
          title="Mover cursor para esquerda"
        >
          <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        {/* → - Move Cursor Right */}
        <button
          type="button"
          onClick={() => moveCursor('right')}
          className="w-10 sm:w-11 h-10 sm:h-11 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer select-none active:scale-95"
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
          className="w-10 sm:w-11 h-10 sm:h-11 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 hover:text-white flex items-center justify-center transition-all cursor-pointer select-none active:scale-95"
          title="Construtor Visual Interativo"
        >
          <ArrowLeftRight className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        {/* ⌫ - Backspace */}
        <button
          type="button"
          onClick={handleBackspace}
          className="h-10 sm:h-11 px-3.5 sm:px-4 rounded-xl bg-slate-800 hover:bg-rose-950/60 active:bg-rose-900 text-slate-300 hover:text-rose-300 flex items-center justify-center transition-all cursor-pointer select-none active:scale-95"
          title="Apagar caractere"
        >
          <Delete className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </div>

      {/* 2. PHOTOMATH CATEGORY PILLS: [+-×÷] [> < ≥ ≤ ≠] [f(x) e / log ln] [sin cos / tan cot] [lim dx / ∫ ∑ ∞] */}
      <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 scrollbar-none px-0.5 shrink-0">
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
              className={`flex-1 min-h-[34px] sm:min-h-[38px] px-2.5 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-150 cursor-pointer active:scale-95 text-center select-none ${
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
      <div className="flex-1 flex flex-col min-h-0 justify-between gap-1.5 sm:gap-2">
        {/* A. BASIC ARITHMETIC GRID */}
        {activeCategory === 'basic' && (
          <div className="flex-1 flex flex-col justify-between gap-1.5 sm:gap-2 min-h-0">
            {/* Quick Relational & Modulo Bar */}
            <div className="grid grid-cols-6 gap-1.5 sm:gap-2 shrink-0">
              <button
                type="button"
                onClick={() => insertTextAtCursor(' < ')}
                className="h-8 sm:h-9 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800/90 hover:border-slate-700 text-slate-200 hover:text-white font-bold text-sm sm:text-base flex items-center justify-center active:scale-95 transition-all cursor-pointer select-none"
                title="Menor que (<)"
              >
                &lt;
              </button>
              <button
                type="button"
                onClick={() => insertTextAtCursor(' > ')}
                className="h-8 sm:h-9 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800/90 hover:border-slate-700 text-slate-200 hover:text-white font-bold text-sm sm:text-base flex items-center justify-center active:scale-95 transition-all cursor-pointer select-none"
                title="Maior que (>)"
              >
                &gt;
              </button>
              <button
                type="button"
                onClick={() => insertTextAtCursor(' \\le ')}
                className="h-8 sm:h-9 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800/90 hover:border-slate-700 text-rose-300 hover:text-rose-200 font-bold text-sm sm:text-base flex items-center justify-center active:scale-95 transition-all cursor-pointer select-none"
                title="Menor ou igual (≤)"
              >
                ≤
              </button>
              <button
                type="button"
                onClick={() => insertTextAtCursor(' \\ge ')}
                className="h-8 sm:h-9 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800/90 hover:border-slate-700 text-rose-300 hover:text-rose-200 font-bold text-sm sm:text-base flex items-center justify-center active:scale-95 transition-all cursor-pointer select-none"
                title="Maior ou igual (≥)"
              >
                ≥
              </button>
              <button
                type="button"
                onClick={() => insertTextAtCursor(' \\ne ')}
                className="h-8 sm:h-9 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800/90 hover:border-slate-700 text-amber-300 hover:text-amber-200 font-bold text-sm sm:text-base flex items-center justify-center active:scale-95 transition-all cursor-pointer select-none"
                title="Diferente de (≠)"
              >
                ≠
              </button>
              <button
                type="button"
                onClick={() => insertTextAtCursor('|x|')}
                className="h-8 sm:h-9 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800/90 hover:border-slate-700 text-slate-200 hover:text-white font-bold text-sm sm:text-base flex items-center justify-center active:scale-95 transition-all cursor-pointer select-none"
                title="Módulo / Valor Absoluto (|x|)"
              >
                |x|
              </button>
            </div>

            {/* Main Numeric & Operator Matrix */}
            <div className="grid grid-cols-6 gap-1.5 sm:gap-2 md:gap-2.5">
              {/* ROW 1: (□) | √□ | 7 | 8 | 9 | ÷ */}
              <button
                type="button"
                onClick={handleParentheses}
                className="h-11 sm:h-12 md:h-13 w-full rounded-2xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 hover:text-white font-medium text-sm sm:text-base flex items-center justify-center active:scale-95 transition-all cursor-pointer select-none"
                title="Parênteses"
              >
                <span className="flex items-center text-rose-400 font-bold">
                  (<span className="w-2.5 h-2.5 sm:w-3 sm:h-3 border border-dashed border-rose-400 rounded-xs mx-0.5 inline-block" />)
                </span>
              </button>

              <button
                type="button"
                onClick={insertSmartSquareRoot}
                className="h-11 sm:h-12 md:h-13 w-full rounded-2xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 hover:text-white font-medium flex items-center justify-center active:scale-95 transition-all cursor-pointer select-none"
                title="Raiz Quadrada (√x)"
              >
                <div className="flex items-center text-slate-200">
                  <span className="text-lg sm:text-2xl font-serif">√</span>
                  <span className="w-3.5 h-3 sm:w-4 sm:h-3.5 border border-dashed border-rose-400 rounded-xs ml-0.5 -mt-0.5" />
                </div>
              </button>

              <button
                type="button"
                onClick={() => insertTextAtCursor('7')}
                className="h-11 sm:h-12 md:h-13 w-full rounded-2xl bg-slate-800/90 hover:bg-slate-700 text-white font-bold text-xl sm:text-2xl flex items-center justify-center active:scale-95 transition-all cursor-pointer select-none shadow-sm"
              >
                7
              </button>
              <button
                type="button"
                onClick={() => insertTextAtCursor('8')}
                className="h-11 sm:h-12 md:h-13 w-full rounded-2xl bg-slate-800/90 hover:bg-slate-700 text-white font-bold text-xl sm:text-2xl flex items-center justify-center active:scale-95 transition-all cursor-pointer select-none shadow-sm"
              >
                8
              </button>
              <button
                type="button"
                onClick={() => insertTextAtCursor('9')}
                className="h-11 sm:h-12 md:h-13 w-full rounded-2xl bg-slate-800/90 hover:bg-slate-700 text-white font-bold text-xl sm:text-2xl flex items-center justify-center active:scale-95 transition-all cursor-pointer select-none shadow-sm"
              >
                9
              </button>

              <button
                type="button"
                onClick={() => insertTextAtCursor(' / ')}
                className="h-11 sm:h-12 md:h-13 w-full rounded-2xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 hover:text-white font-bold text-xl sm:text-2xl flex items-center justify-center active:scale-95 transition-all cursor-pointer select-none"
                title="Divisão"
              >
                ÷
              </button>

              {/* ROW 2: □/□ (Fraction) | ■ ▢/▢ (Mixed Number) | 4 | 5 | 6 | × */}
              <button
                type="button"
                onClick={insertSmartFraction}
                className="h-11 sm:h-12 md:h-13 w-full rounded-2xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 hover:text-white font-medium flex flex-col items-center justify-center active:scale-95 transition-all cursor-pointer select-none p-1"
                title="Fração Simples (Ex: ½)"
              >
                <div className="flex flex-col items-center justify-center leading-none">
                  <span className="w-3.5 h-2.5 sm:w-4.5 sm:h-3 border border-dashed border-rose-400 rounded-xs mb-0.5" />
                  <span className="w-5 sm:w-6 h-[2px] bg-slate-300" />
                  <span className="w-3.5 h-2.5 sm:w-4.5 sm:h-3 border border-dashed border-rose-400 rounded-xs mt-0.5" />
                </div>
              </button>

              <button
                type="button"
                onClick={insertMixedNumber}
                className="h-11 sm:h-12 md:h-13 w-full rounded-2xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 hover:text-white font-medium flex items-center justify-center active:scale-95 transition-all cursor-pointer select-none p-1"
                title="Número Misto (Ex: 2 ½)"
              >
                <div className="flex items-center justify-center leading-none gap-1">
                  <span className="text-sm sm:text-base font-bold text-amber-400">2</span>
                  <div className="flex flex-col items-center justify-center leading-none">
                    <span className="text-[10px] sm:text-xs font-bold text-slate-200">1</span>
                    <span className="w-3.5 sm:w-4 h-[1.5px] bg-slate-400 my-0.5" />
                    <span className="text-[10px] sm:text-xs font-bold text-slate-200">3</span>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => insertTextAtCursor('4')}
                className="h-11 sm:h-12 md:h-13 w-full rounded-2xl bg-slate-800/90 hover:bg-slate-700 text-white font-bold text-xl sm:text-2xl flex items-center justify-center active:scale-95 transition-all cursor-pointer select-none shadow-sm"
              >
                4
              </button>
              <button
                type="button"
                onClick={() => insertTextAtCursor('5')}
                className="h-11 sm:h-12 md:h-13 w-full rounded-2xl bg-slate-800/90 hover:bg-slate-700 text-white font-bold text-xl sm:text-2xl flex items-center justify-center active:scale-95 transition-all cursor-pointer select-none shadow-sm"
              >
                5
              </button>
              <button
                type="button"
                onClick={() => insertTextAtCursor('6')}
                className="h-11 sm:h-12 md:h-13 w-full rounded-2xl bg-slate-800/90 hover:bg-slate-700 text-white font-bold text-xl sm:text-2xl flex items-center justify-center active:scale-95 transition-all cursor-pointer select-none shadow-sm"
              >
                6
              </button>

              <button
                type="button"
                onClick={() => insertTextAtCursor(' \\cdot ')}
                className="h-11 sm:h-12 md:h-13 w-full rounded-2xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 hover:text-white font-bold text-xl sm:text-2xl flex items-center justify-center active:scale-95 transition-all cursor-pointer select-none"
                title="Multiplicação"
              >
                ×
              </button>

              {/* ROW 3: □² (Square Power) | xʸ (General Power) | 1 | 2 | 3 | − */}
              <button
                type="button"
                onClick={() => insertSmartExponent('2')}
                className="h-11 sm:h-12 md:h-13 w-full rounded-2xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 hover:text-white font-medium flex items-center justify-center active:scale-95 transition-all cursor-pointer select-none"
                title="Ao Quadrado (x²)"
              >
                <div className="flex items-start">
                  <span className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 border border-dashed border-rose-400 rounded-xs mt-0.5" />
                  <span className="text-xs sm:text-sm font-bold text-slate-200 ml-0.5">2</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => insertSmartExponent()}
                className="h-11 sm:h-12 md:h-13 w-full rounded-2xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 hover:text-white font-bold text-base sm:text-lg flex items-center justify-center active:scale-95 transition-all cursor-pointer select-none"
                title="Potência genérica (xʸ)"
              >
                xʸ
              </button>

              <button
                type="button"
                onClick={() => insertTextAtCursor('1')}
                className="h-11 sm:h-12 md:h-13 w-full rounded-2xl bg-slate-800/90 hover:bg-slate-700 text-white font-bold text-xl sm:text-2xl flex items-center justify-center active:scale-95 transition-all cursor-pointer select-none shadow-sm"
              >
                1
              </button>
              <button
                type="button"
                onClick={() => insertTextAtCursor('2')}
                className="h-11 sm:h-12 md:h-13 w-full rounded-2xl bg-slate-800/90 hover:bg-slate-700 text-white font-bold text-xl sm:text-2xl flex items-center justify-center active:scale-95 transition-all cursor-pointer select-none shadow-sm"
              >
                2
              </button>
              <button
                type="button"
                onClick={() => insertTextAtCursor('3')}
                className="h-11 sm:h-12 md:h-13 w-full rounded-2xl bg-slate-800/90 hover:bg-slate-700 text-white font-bold text-xl sm:text-2xl flex items-center justify-center active:scale-95 transition-all cursor-pointer select-none shadow-sm"
              >
                3
              </button>

              <button
                type="button"
                onClick={() => insertTextAtCursor(' - ')}
                className="h-11 sm:h-12 md:h-13 w-full rounded-2xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 hover:text-white font-bold text-xl sm:text-2xl flex items-center justify-center active:scale-95 transition-all cursor-pointer select-none"
                title="Subtração"
              >
                −
              </button>

              {/* ROW 4: x | π | 0 | , | + | = (Calcular / Resolver) */}
              <button
                type="button"
                onClick={() => insertTextAtCursor('x')}
                className="h-11 sm:h-12 md:h-13 w-full rounded-2xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 hover:text-white font-bold italic font-serif text-lg sm:text-2xl flex items-center justify-center active:scale-95 transition-all cursor-pointer select-none"
                title="Variável x"
              >
                x
              </button>

              <button
                type="button"
                onClick={() => insertTextAtCursor('\\pi')}
                className="h-11 sm:h-12 md:h-13 w-full rounded-2xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 hover:text-white font-serif text-lg sm:text-2xl flex items-center justify-center active:scale-95 transition-all cursor-pointer select-none"
                title="Constante Pi (π)"
              >
                π
              </button>

              <button
                type="button"
                onClick={() => insertTextAtCursor('0')}
                className="h-11 sm:h-12 md:h-13 w-full rounded-2xl bg-slate-800/90 hover:bg-slate-700 text-white font-bold text-xl sm:text-2xl flex items-center justify-center active:scale-95 transition-all cursor-pointer select-none shadow-sm"
              >
                0
              </button>

              <button
                type="button"
                onClick={() => insertTextAtCursor(',')}
                className="h-11 sm:h-12 md:h-13 w-full rounded-2xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 hover:text-white font-bold text-xl sm:text-2xl flex items-center justify-center active:scale-95 transition-all cursor-pointer select-none"
                title="Vírgula decimal"
              >
                ,
              </button>

              <button
                type="button"
                onClick={() => insertTextAtCursor(' + ')}
                className="h-11 sm:h-12 md:h-13 w-full rounded-2xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 hover:text-white font-bold text-xl sm:text-2xl flex items-center justify-center active:scale-95 transition-all cursor-pointer select-none"
                title="Adição"
              >
                +
              </button>

              <button
                type="button"
                id="btn-numpad-solve"
                onClick={() => {
                  triggerHaptic();
                  onSolve();
                }}
                disabled={isLoading}
                className="h-11 sm:h-12 md:h-13 w-full rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold text-2xl sm:text-3xl flex items-center justify-center active:scale-95 transition-all cursor-pointer select-none shadow-lg shadow-rose-600/30 ring-1 ring-rose-400"
                title="Calcular / Resolver"
              >
                {isLoading ? (
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span>=</span>
                )}
              </button>
            </div>
          </div>
        )}

        {/* B. INEQUALITIES & RELATIONS TAB */}
        {activeCategory === 'inequalities' && (
          <div className="flex flex-col">
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5 sm:gap-2">
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
                  className="h-10 sm:h-11 md:h-12 w-full rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 hover:text-white font-bold text-sm sm:text-base flex items-center justify-center active:scale-95 transition-all cursor-pointer select-none"
                  title={btn.tip}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* C. FUNCTIONS TAB: f(x) e / log ln */}
        {activeCategory === 'functions' && (
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5 sm:gap-2">
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
                className="h-10 sm:h-11 md:h-12 w-full rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 hover:text-white font-bold text-sm sm:text-base flex items-center justify-center active:scale-95 transition-all cursor-pointer select-none"
              >
                {btn.label}
              </button>
            ))}
          </div>
        )}

        {/* D. TRIGONOMETRY TAB: sin cos / tan cot */}
        {activeCategory === 'trigonometry' && (
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5 sm:gap-2">
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
                className="h-10 sm:h-11 md:h-12 w-full rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 hover:text-white font-bold text-sm sm:text-base flex items-center justify-center active:scale-95 transition-all cursor-pointer select-none"
              >
                {btn.label}
              </button>
            ))}
          </div>
        )}

        {/* E. CALCULUS TAB: lim dx / ∫ ∑ ∞ */}
        {activeCategory === 'calculus' && (
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5 sm:gap-2">
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
                className="h-10 sm:h-11 md:h-12 w-full rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 hover:text-white font-bold text-sm sm:text-base flex items-center justify-center active:scale-95 transition-all cursor-pointer select-none"
              >
                {btn.label}
              </button>
            ))}
          </div>
        )}

        {/* F. ALPHABETIC (abc) TAB */}
        {activeCategory === 'alpha' && (
          <div className="flex flex-col gap-2">
            <div className="grid grid-cols-7 sm:grid-cols-10 gap-1.5 sm:gap-2">
              {'abcdefghijklmnopqrstuvwxyz'.split('').map((char) => (
                <button
                  key={char}
                  type="button"
                  onClick={() => insertTextAtCursor(char)}
                  className="h-9 sm:h-10 md:h-11 w-full rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 hover:text-white font-mono text-base sm:text-lg flex items-center justify-center active:scale-95 transition-all cursor-pointer select-none"
                >
                  {char}
                </button>
              ))}
            </div>
            <div className="flex justify-end pt-1 shrink-0">
              <button
                type="button"
                onClick={() => setActiveCategory('basic')}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs sm:text-sm font-bold text-slate-300 active:scale-95 transition-all cursor-pointer"
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
