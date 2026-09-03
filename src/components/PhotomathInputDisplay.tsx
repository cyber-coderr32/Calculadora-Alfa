import React, { useMemo, useState, useEffect } from 'react';
import { MathRenderer } from './MathRenderer';
import { MathSolution } from '../types';
import { solveOffline } from '../engine/offlineSolver';
import { X, ArrowRight, Sparkles, CheckCircle2, ChevronRight, CornerDownRight, Trash2 } from 'lucide-react';

interface PhotomathInputDisplayProps {
  input: string;
  onClear: () => void;
  onShowSolution: () => void;
  isLoading: boolean;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  onInputChange: (val: string) => void;
}

interface FractionSlot {
  fractionIndex: number;
  numRange: { start: number; end: number; content: string };
  denRange: { start: number; end: number; content: string };
  fullRange: { start: number; end: number };
}

interface SqrtSlot {
  sqrtIndex: number;
  radRange: { start: number; end: number; content: string };
  fullRange: { start: number; end: number };
}

interface ExponentSlot {
  exponentIndex: number;
  baseRange: { start: number; end: number; content: string };
  expRange: { start: number; end: number; content: string };
  fullRange: { start: number; end: number };
}

interface TokenSegment {
  type: 'fraction' | 'sqrt' | 'exponent' | 'text';
  raw: string;
  start: number;
  end: number;
  fraction?: FractionSlot;
  sqrt?: SqrtSlot;
  exponent?: ExponentSlot;
}

function findMatchingBrace(str: string, openIndex: number): number {
  if (str[openIndex] !== '{') return -1;
  let depth = 0;
  for (let i = openIndex; i < str.length; i++) {
    if (str[i] === '{') depth++;
    else if (str[i] === '}') {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

function findMatchingParenBackwards(str: string, closeIndex: number): number {
  if (str[closeIndex] !== ')') return closeIndex;
  let depth = 0;
  for (let i = closeIndex; i >= 0; i--) {
    if (str[i] === ')') depth++;
    else if (str[i] === '(') {
      depth--;
      if (depth === 0) return i;
    }
  }
  return 0;
}

function parseInteractiveTokens(input: string): TokenSegment[] {
  const tokens: TokenSegment[] = [];
  let i = 0;
  let fracCount = 0;
  let sqrtCount = 0;
  let expCount = 0;

  while (i < input.length) {
    // 1. Check for \frac{num}{den}
    if (input.startsWith('\\frac{', i)) {
      const openNum = i + 5; // index of '{'
      const closeNum = findMatchingBrace(input, openNum);
      if (closeNum !== -1) {
        const nextCharIdx = closeNum + 1;
        if (input[nextCharIdx] === '{') {
          const openDen = nextCharIdx;
          const closeDen = findMatchingBrace(input, openDen);
          if (closeDen !== -1) {
            fracCount++;
            const numContent = input.substring(openNum + 1, closeNum);
            const denContent = input.substring(openDen + 1, closeDen);
            tokens.push({
              type: 'fraction',
              raw: input.substring(i, closeDen + 1),
              start: i,
              end: closeDen + 1,
              fraction: {
                fractionIndex: fracCount,
                numRange: { start: openNum + 1, end: closeNum, content: numContent },
                denRange: { start: openDen + 1, end: closeDen, content: denContent },
                fullRange: { start: i, end: closeDen + 1 },
              },
            });
            i = closeDen + 1;
            continue;
          }
        }
      }
    }

    // 2. Check for \sqrt{rad}
    if (input.startsWith('\\sqrt{', i)) {
      const openRad = i + 5;
      const closeRad = findMatchingBrace(input, openRad);
      if (closeRad !== -1) {
        sqrtCount++;
        const radContent = input.substring(openRad + 1, closeRad);
        tokens.push({
          type: 'sqrt',
          raw: input.substring(i, closeRad + 1),
          start: i,
          end: closeRad + 1,
          sqrt: {
            sqrtIndex: sqrtCount,
            radRange: { start: openRad + 1, end: closeRad, content: radContent },
            fullRange: { start: i, end: closeRad + 1 },
          },
        });
        i = closeRad + 1;
        continue;
      }
    }

    // 3. Check for Exponents: base^{exp} or ^{exp} or base^2 or ^2
    // Look ahead to see if the next token is an exponent or if current is at '^'
    if (input[i] === '^') {
      expCount++;
      const caretPos = i;
      let expStart = caretPos + 1;
      let expEnd = caretPos + 1;
      let expContent = '';
      let endToken = caretPos + 1;

      if (input[caretPos + 1] === '{') {
        const closeExp = findMatchingBrace(input, caretPos + 1);
        if (closeExp !== -1) {
          expStart = caretPos + 2;
          expEnd = closeExp;
          expContent = input.substring(expStart, expEnd);
          endToken = closeExp + 1;
        } else {
          expStart = caretPos + 2;
          expEnd = input.length;
          expContent = input.substring(expStart);
          endToken = input.length;
        }
      } else if (caretPos + 1 < input.length) {
        const afterCaret = input.substring(caretPos + 1);
        const matchExp = afterCaret.match(/^-?[0-9a-zA-Z\.]+/);
        if (matchExp) {
          expStart = caretPos + 1;
          expEnd = caretPos + 1 + matchExp[0].length;
          expContent = matchExp[0];
          endToken = expEnd;
        } else {
          expStart = caretPos + 1;
          expEnd = caretPos + 1;
          expContent = '';
          endToken = caretPos + 1;
        }
      }

      tokens.push({
        type: 'exponent',
        raw: input.substring(caretPos, endToken),
        start: caretPos,
        end: endToken,
        exponent: {
          exponentIndex: expCount,
          baseRange: { start: caretPos, end: caretPos, content: '' },
          expRange: { start: expStart, end: expEnd, content: expContent },
          fullRange: { start: caretPos, end: endToken },
        },
      });
      i = endToken;
      continue;
    }

    // Check if the current position starts a base followed immediately by '^'
    // E.g. 'x^2', '12^3', '(x+1)^2'
    let baseStart = i;
    let baseEnd = i;
    let baseContent = '';

    if (input[i] === '(') {
      const closeP = input.indexOf(')', i);
      if (closeP !== -1 && input[closeP + 1] === '^') {
        baseStart = i;
        baseEnd = closeP + 1;
        baseContent = input.substring(baseStart, baseEnd);
        const caretPos = closeP + 1;
        expCount++;
        let expStart = caretPos + 1;
        let expEnd = caretPos + 1;
        let expContent = '';
        let endToken = caretPos + 1;

        if (input[caretPos + 1] === '{') {
          const closeExp = findMatchingBrace(input, caretPos + 1);
          if (closeExp !== -1) {
            expStart = caretPos + 2;
            expEnd = closeExp;
            expContent = input.substring(expStart, expEnd);
            endToken = closeExp + 1;
          } else {
            expStart = caretPos + 2;
            expEnd = input.length;
            expContent = input.substring(expStart);
            endToken = input.length;
          }
        } else if (caretPos + 1 < input.length) {
          const afterCaret = input.substring(caretPos + 1);
          const matchExp = afterCaret.match(/^-?[0-9a-zA-Z\.]+/);
          if (matchExp) {
            expStart = caretPos + 1;
            expEnd = caretPos + 1 + matchExp[0].length;
            expContent = matchExp[0];
            endToken = expEnd;
          } else {
            expStart = caretPos + 1;
            expEnd = caretPos + 1;
            expContent = '';
            endToken = caretPos + 1;
          }
        }

        tokens.push({
          type: 'exponent',
          raw: input.substring(baseStart, endToken),
          start: baseStart,
          end: endToken,
          exponent: {
            exponentIndex: expCount,
            baseRange: { start: baseStart, end: baseEnd, content: baseContent },
            expRange: { start: expStart, end: expEnd, content: expContent },
            fullRange: { start: baseStart, end: endToken },
          },
        });
        i = endToken;
        continue;
      }
    }

    // Check alphanumeric identifier/number base immediately followed by '^' (e.g. 'x^2', '5^2', '2x^3')
    const matchBaseExp = input.substring(i).match(/^([0-9a-zA-Z\.]+)\^/);
    if (matchBaseExp) {
      const baseStr = matchBaseExp[1];
      baseStart = i;
      baseEnd = i + baseStr.length;
      baseContent = baseStr;
      const caretPos = baseEnd;
      expCount++;
      let expStart = caretPos + 1;
      let expEnd = caretPos + 1;
      let expContent = '';
      let endToken = caretPos + 1;

      if (input[caretPos + 1] === '{') {
        const closeExp = findMatchingBrace(input, caretPos + 1);
        if (closeExp !== -1) {
          expStart = caretPos + 2;
          expEnd = closeExp;
          expContent = input.substring(expStart, expEnd);
          endToken = closeExp + 1;
        } else {
          expStart = caretPos + 2;
          expEnd = input.length;
          expContent = input.substring(expStart);
          endToken = input.length;
        }
      } else if (caretPos + 1 < input.length) {
        const afterCaret = input.substring(caretPos + 1);
        const matchExp = afterCaret.match(/^-?[0-9a-zA-Z\.]+/);
        if (matchExp) {
          expStart = caretPos + 1;
          expEnd = caretPos + 1 + matchExp[0].length;
          expContent = matchExp[0];
          endToken = expEnd;
        } else {
          expStart = caretPos + 1;
          expEnd = caretPos + 1;
          expContent = '';
          endToken = caretPos + 1;
        }
      }

      tokens.push({
        type: 'exponent',
        raw: input.substring(baseStart, endToken),
        start: baseStart,
        end: endToken,
        exponent: {
          exponentIndex: expCount,
          baseRange: { start: baseStart, end: baseEnd, content: baseContent },
          expRange: { start: expStart, end: expEnd, content: expContent },
          fullRange: { start: baseStart, end: endToken },
        },
      });
      i = endToken;
      continue;
    }

    // 4. Accumulate regular characters or commands until next special token
    const startText = i;
    while (
      i < input.length &&
      !input.startsWith('\\frac{', i) &&
      !input.startsWith('\\sqrt{', i) &&
      input[i] !== '^' &&
      !input.substring(i).match(/^([0-9a-zA-Z\.]+)\^/) &&
      !(input[i] === '(' && input.indexOf(')', i) !== -1 && input[input.indexOf(')', i) + 1] === '^')
    ) {
      i++;
    }
    if (i > startText) {
      tokens.push({
        type: 'text',
        raw: input.substring(startText, i),
        start: startText,
        end: i,
      });
    }
  }

  return tokens;
}

export const PhotomathInputDisplay: React.FC<PhotomathInputDisplayProps> = ({
  input,
  onClear,
  onShowSolution,
  isLoading,
  textareaRef,
  onInputChange,
}) => {
  const [cursorPos, setCursorPos] = useState<number>(input.length);

  // Keep track of cursor in textarea
  const updateCursorFromTextarea = () => {
    if (textareaRef.current) {
      setCursorPos(textareaRef.current.selectionStart ?? input.length);
    }
  };

  useEffect(() => {
    updateCursorFromTextarea();
  }, [input]);

  const setCursorToPosition = (targetPos: number, selectAllRange?: { start: number; end: number }) => {
    if (textareaRef.current) {
      try {
        if (selectAllRange && selectAllRange.end >= selectAllRange.start) {
          textareaRef.current.setSelectionRange(selectAllRange.start, selectAllRange.end);
          setCursorPos(selectAllRange.end);
        } else {
          textareaRef.current.setSelectionRange(targetPos, targetPos);
          setCursorPos(targetPos);
        }
      } catch {}
    } else {
      setCursorPos(targetPos);
    }
  };

  // Function to directly change exponent by clicking on screen
  const handleDirectChangeExponent = (expSlot: ExponentSlot, newExponentVal: string) => {
    const beforeBaseEnd = input.substring(0, expSlot.baseRange.end);
    const afterToken = input.substring(expSlot.fullRange.end);

    const replacement = newExponentVal === '' ? '^{}' : `^{${newExponentVal}}`;
    const nextInput = beforeBaseEnd + replacement + afterToken;
    onInputChange(nextInput);

    const newCursor = beforeBaseEnd.length + (newExponentVal === '' ? 2 : replacement.length - 1);
    setTimeout(() => {
      setCursorToPosition(newCursor);
    }, 10);
  };

  // Function to remove exponent completely
  const handleRemoveExponent = (expSlot: ExponentSlot) => {
    const beforeBaseEnd = input.substring(0, expSlot.baseRange.end);
    const afterToken = input.substring(expSlot.fullRange.end);
    const nextInput = beforeBaseEnd + afterToken;
    onInputChange(nextInput);
    setTimeout(() => {
      setCursorToPosition(beforeBaseEnd.length);
    }, 10);
  };

  // Parse structured interactive tokens (fractions, roots, exponents)
  const tokens = useMemo(() => parseInteractiveTokens(input), [input]);

  // Extract fractions and exponents for quick jump bar
  const fractionList = useMemo(() => {
    return tokens.filter((t) => t.type === 'fraction' && t.fraction).map((t) => t.fraction!);
  }, [tokens]);

  const exponentList = useMemo(() => {
    return tokens.filter((t) => t.type === 'exponent' && t.exponent).map((t) => t.exponent!);
  }, [tokens]);

  const sqrtList = useMemo(() => {
    return tokens.filter((t) => t.type === 'sqrt' && t.sqrt).map((t) => t.sqrt!);
  }, [tokens]);

  // Live compute offline preview
  const liveResult = useMemo<{ solution: MathSolution | null; error: boolean }>(() => {
    if (!input.trim()) return { solution: null, error: false };
    try {
      const sol = solveOffline(input);
      if (sol && sol.finalAnswer?.exact && !sol.id.startsWith('sol_err_')) {
        return { solution: sol, error: false };
      }
      return { solution: null, error: false };
    } catch {
      return { solution: null, error: false };
    }
  }, [input]);

  return (
    <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-3.5 sm:p-5 shadow-xl shadow-slate-200/50 dark:shadow-2xl space-y-3.5 box-border transition-colors duration-200">
      {/* Hidden textarea to capture focus, cursor position and mobile typing when needed */}
      <textarea
        ref={textareaRef}
        value={input}
        onChange={(e) => {
          onInputChange(e.target.value);
          setCursorPos(e.target.selectionStart ?? e.target.value.length);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onShowSolution();
          }
        }}
        onSelect={updateCursorFromTextarea}
        onClick={updateCursorFromTextarea}
        onKeyUp={updateCursorFromTextarea}
        readOnly={true}
        inputMode="none"
        tabIndex={-1}
        className="opacity-0 absolute -z-10 w-0 h-0 pointer-events-none overflow-hidden"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
      />

      {/* TOP QUICK JUMP BAR: Instant 1-tap navigation for Fractions, Exponents, and Roots on touchscreen */}
      {(fractionList.length > 0 || exponentList.length > 0 || sqrtList.length > 0) && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none animate-fade-in">
          {/* Fractions */}
          {fractionList.map((frac, idx) => {
            const isNumActive = cursorPos >= frac.numRange.start && cursorPos <= frac.numRange.end;
            const isDenActive = cursorPos >= frac.denRange.start && cursorPos <= frac.denRange.end;

            return (
              <div key={`f-${idx}`} className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950 px-2 py-1 rounded-xl border border-slate-200 dark:border-slate-800 shrink-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                  Fração:
                </span>
                <button
                  type="button"
                  onClick={() => setCursorToPosition(frac.numRange.end, { start: frac.numRange.start, end: frac.numRange.end })}
                  className={`px-2 py-0.5 rounded-lg text-xs font-bold transition-all cursor-pointer select-none ${
                    isNumActive
                      ? 'bg-rose-600 text-white shadow-sm ring-1 ring-rose-400'
                      : 'bg-white dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-transparent'
                  }`}
                  title="Editar Numerador (superior)"
                >
                  Numerador: {frac.numRange.content || '□'}
                </button>
                <span className="text-slate-400 dark:text-slate-600 font-bold">/</span>
                <button
                  type="button"
                  onClick={() => setCursorToPosition(frac.denRange.end, { start: frac.denRange.start, end: frac.denRange.end })}
                  className={`px-2 py-0.5 rounded-lg text-xs font-bold transition-all cursor-pointer select-none ${
                    isDenActive
                      ? 'bg-rose-600 text-white shadow-sm ring-1 ring-rose-400'
                      : 'bg-white dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-rose-700 dark:text-rose-300 border border-slate-200 dark:border-transparent'
                  }`}
                  title="Editar Denominador (inferior)"
                >
                  Denominador: {frac.denRange.content || '□'}
                </button>
              </div>
            );
          })}

          {/* Exponents */}
          {exponentList.map((expSlot, idx) => {
            const isBaseActive = cursorPos >= expSlot.baseRange.start && cursorPos <= expSlot.baseRange.end;
            const isExpActive = cursorPos >= expSlot.expRange.start && cursorPos <= expSlot.expRange.end;

            return (
              <div key={`e-${idx}`} className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-950 px-2 py-1 rounded-xl border border-indigo-200 dark:border-indigo-900/50 shrink-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  Potência:
                </span>
                {/* Base jump button */}
                <button
                  type="button"
                  onClick={() => setCursorToPosition(expSlot.baseRange.end, { start: expSlot.baseRange.start, end: expSlot.baseRange.end })}
                  className={`px-2 py-0.5 rounded-lg text-xs font-bold transition-all cursor-pointer select-none ${
                    isBaseActive
                      ? 'bg-indigo-600 text-white shadow-sm ring-1 ring-indigo-400'
                      : 'bg-white dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-transparent'
                  }`}
                  title="Editar Base (número ou variável abaixo do expoente)"
                >
                  Base: {expSlot.baseRange.content || '□'}
                </button>

                <span className="text-slate-400 dark:text-slate-500 font-bold">^</span>

                {/* Exponent select button */}
                <button
                  type="button"
                  onClick={() => {
                    setCursorToPosition(expSlot.expRange.start, { start: expSlot.expRange.start, end: expSlot.expRange.end });
                  }}
                  className={`px-2 py-0.5 rounded-lg text-xs font-bold transition-all cursor-pointer select-none flex items-center gap-1 ${
                    isExpActive
                      ? 'bg-rose-600 text-white shadow-sm ring-1 ring-rose-400'
                      : 'bg-white dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-rose-700 dark:text-rose-300 border border-slate-200 dark:border-transparent'
                  }`}
                  title="Selecionar expoente para editar"
                >
                  <span>Expoente: {expSlot.expRange.content || '□'}</span>
                </button>

                {/* Direct quick exponent preset buttons right on the bar! */}
                <div className="flex items-center gap-1 border-l border-slate-300 dark:border-slate-800 pl-1.5 ml-0.5">
                  {[
                    { label: '²', val: '2', title: 'Mudar para ao quadrado (²)' },
                    { label: '³', val: '3', title: 'Mudar para ao cubo (³)' },
                    { label: '⁴', val: '4', title: 'Mudar para expoente 4 (⁴)' },
                    { label: '⁻¹', val: '-1', title: 'Mudar para expoente -1 (⁻¹)' },
                    { label: 'ⁿ', val: 'n', title: 'Mudar para expoente n' },
                  ].map((preset) => (
                    <button
                      key={preset.val}
                      type="button"
                      onClick={() => handleDirectChangeExponent(expSlot, preset.val)}
                      className="px-1.5 py-0.5 rounded-md bg-white dark:bg-slate-800 hover:bg-rose-100 dark:hover:bg-rose-950 text-slate-800 dark:text-slate-200 hover:text-rose-600 dark:hover:text-rose-400 text-xs font-bold border border-slate-200 dark:border-slate-700 active:scale-95 transition-all cursor-pointer select-none"
                      title={preset.title}
                    >
                      {preset.label}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => handleRemoveExponent(expSlot)}
                    className="p-1 rounded-md bg-white dark:bg-slate-800 hover:bg-red-100 dark:hover:bg-red-950 text-red-600 dark:text-red-400 text-xs font-bold border border-slate-200 dark:border-slate-700 active:scale-95 transition-all cursor-pointer select-none"
                    title="Remover expoente"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}

          {/* Sqrt Roots */}
          {sqrtList.map((sq, idx) => {
            const isRadActive = cursorPos >= sq.radRange.start && cursorPos <= sq.radRange.end;

            return (
              <div key={`s-${idx}`} className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950 px-2 py-1 rounded-xl border border-emerald-200 dark:border-emerald-900/50 shrink-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Raiz:
                </span>
                <button
                  type="button"
                  onClick={() => setCursorToPosition(sq.radRange.end)}
                  className={`px-2 py-0.5 rounded-lg text-xs font-bold transition-all cursor-pointer select-none ${
                    isRadActive
                      ? 'bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-400'
                      : 'bg-white dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-transparent'
                  }`}
                  title="Editar Radicando"
                >
                  √{sq.radRange.content || '□'}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* TOP: Photomath-style Interactive Visual Formula Display with Clickable Numerator / Denominator / Base / Exponent Slots */}
      <div className="relative min-h-[70px] sm:min-h-[82px] flex items-center justify-between p-2.5 sm:p-3.5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800/90 hover:border-slate-300 dark:hover:border-slate-700 transition-all select-none group">
        <div className="flex-1 overflow-x-auto py-1.5 scrollbar-thin">
          {input.trim() ? (
            <div className="flex items-center gap-1.5 flex-wrap text-base sm:text-lg md:text-xl font-medium text-slate-900 dark:text-white select-none">
              {/* Render interactive segments */}
              {tokens.map((token, idx) => {
                if (token.type === 'fraction' && token.fraction) {
                  const frac = token.fraction;
                  const isNumActive = cursorPos >= frac.numRange.start && cursorPos <= frac.numRange.end;
                  const isDenActive = cursorPos >= frac.denRange.start && cursorPos <= frac.denRange.end;

                  return (
                    <div
                      key={idx}
                      className="inline-flex flex-col items-center justify-center mx-1 my-0.5 align-middle select-none group/frac"
                    >
                      {/* Clickable NUMERATOR slot */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCursorToPosition(frac.numRange.end);
                        }}
                        className={`min-w-[28px] px-1.5 py-0.5 rounded-md font-sans text-center transition-all cursor-pointer flex items-center justify-center ${
                          isNumActive
                            ? 'bg-rose-100 dark:bg-rose-950/80 border-2 border-rose-500 text-rose-950 dark:text-white ring-2 ring-rose-500/40 shadow-sm'
                            : frac.numRange.content
                            ? 'hover:bg-slate-200/80 dark:hover:bg-slate-800/80 text-slate-900 dark:text-white'
                            : 'border border-dashed border-rose-400/80 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-300 animate-pulse min-h-[26px]'
                        }`}
                        title="Clique para editar o Numerador"
                      >
                        {frac.numRange.content ? (
                          <span className="font-sans leading-none">{frac.numRange.content}</span>
                        ) : (
                          <span className="w-3.5 h-3.5 border border-dashed border-rose-400 rounded-xs inline-block" />
                        )}
                        {isNumActive && (
                          <span className="inline-block w-[2.5px] h-5 bg-rose-500 rounded-full animate-pulse ml-0.5" />
                        )}
                      </button>

                      {/* Crisp Fraction Line */}
                      <div className="w-full min-w-[28px] h-[2.5px] bg-slate-800 dark:bg-slate-300 rounded-full my-1 shadow-sm" />

                      {/* Clickable DENOMINATOR slot */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCursorToPosition(frac.denRange.end);
                        }}
                        className={`min-w-[28px] px-1.5 py-0.5 rounded-md font-sans text-center transition-all cursor-pointer flex items-center justify-center ${
                          isDenActive
                            ? 'bg-rose-100 dark:bg-rose-950/80 border-2 border-rose-500 text-rose-950 dark:text-white ring-2 ring-rose-500/40 shadow-sm'
                            : frac.denRange.content
                            ? 'hover:bg-slate-200/80 dark:hover:bg-slate-800/80 text-slate-900 dark:text-white'
                            : 'border-2 border-dashed border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-300 animate-pulse min-h-[28px] ring-2 ring-rose-500/30'
                        }`}
                        title="Clique aqui para colocar o Denominador"
                      >
                        {frac.denRange.content ? (
                          <span className="font-sans leading-none">{frac.denRange.content}</span>
                        ) : (
                          <span className="w-4 h-4 border-2 border-dashed border-rose-400 rounded-xs inline-block" />
                        )}
                        {isDenActive && (
                          <span className="inline-block w-[2.5px] h-5 bg-rose-500 rounded-full animate-pulse ml-0.5" />
                        )}
                      </button>
                    </div>
                  );
                }

                if (token.type === 'exponent' && token.exponent) {
                  const expSlot = token.exponent;
                  const isBaseActive = cursorPos >= expSlot.baseRange.start && cursorPos <= expSlot.baseRange.end;
                  const isExpActive = cursorPos >= expSlot.expRange.start && cursorPos <= expSlot.expRange.end;

                  return (
                    <div
                      key={idx}
                      className="inline-flex items-baseline mx-0.5 my-0.5 align-middle select-none relative group/exp"
                    >
                      {/* Clickable BASE slot (Under/before the exponent) */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCursorToPosition(expSlot.baseRange.end, { start: expSlot.baseRange.start, end: expSlot.baseRange.end });
                        }}
                        className={`min-w-[26px] px-1.5 py-0.5 rounded-md font-sans text-center transition-all cursor-pointer inline-flex items-center justify-center ${
                          isBaseActive
                            ? 'bg-indigo-100 dark:bg-indigo-950/90 border-2 border-indigo-500 text-indigo-950 dark:text-white ring-2 ring-indigo-500/40 shadow-sm'
                            : expSlot.baseRange.content
                            ? 'hover:bg-slate-200/80 dark:hover:bg-slate-800/80 text-slate-900 dark:text-white font-semibold'
                            : 'border-2 border-dashed border-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 animate-pulse min-h-[30px] min-w-[30px] ring-1 ring-indigo-500/30'
                        }`}
                        title="Clique aqui para digitar o número ou incógnita na Base"
                      >
                        {expSlot.baseRange.content ? (
                          <span className="font-sans leading-none">{expSlot.baseRange.content}</span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-300">
                            <span className="w-3.5 h-3.5 border-2 border-dashed border-indigo-400 rounded-xs inline-block" />
                          </span>
                        )}
                        {isBaseActive && (
                          <span className="inline-block w-[2.5px] h-5 bg-indigo-500 rounded-full animate-pulse ml-0.5" />
                        )}
                      </button>

                      {/* Clickable EXPONENT slot (Elevated Superscript) */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCursorToPosition(expSlot.expRange.start, { start: expSlot.expRange.start, end: expSlot.expRange.end });
                        }}
                        className={`-top-3 relative -ml-0.5 min-w-[22px] px-1.5 py-0.5 rounded-md font-sans text-center transition-all cursor-pointer inline-flex items-center justify-center text-xs sm:text-sm ${
                          isExpActive
                            ? 'bg-rose-600 text-white font-black ring-2 ring-rose-400 shadow-md scale-110 z-10'
                            : expSlot.expRange.content
                            ? 'bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 font-bold'
                            : 'border-2 border-dashed border-rose-400 bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-300 animate-pulse min-h-[22px] min-w-[22px]'
                        }`}
                        title="Clique aqui para selecionar o expoente"
                      >
                        {expSlot.expRange.content ? (
                          <span className="font-sans leading-none font-bold">{expSlot.expRange.content}</span>
                        ) : (
                          <span className="w-3 h-3 border border-dashed border-rose-400 rounded-xs inline-block" />
                        )}
                        {isExpActive && (
                          <span className="inline-block w-[2px] h-3.5 bg-white rounded-full animate-pulse ml-0.5" />
                        )}
                      </button>
                    </div>
                  );
                }

                if (token.type === 'sqrt' && token.sqrt) {
                  const sq = token.sqrt;
                  const isRadActive = cursorPos >= sq.radRange.start && cursorPos <= sq.radRange.end;

                  return (
                    <div key={idx} className="inline-flex items-center mx-1 my-0.5 align-middle select-none">
                      <span className="text-2xl font-serif text-slate-800 dark:text-slate-200">√</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCursorToPosition(sq.radRange.end);
                        }}
                        className={`min-w-[24px] px-1.5 py-0.5 -ml-0.5 rounded-md border-t-2 border-slate-700 dark:border-slate-300 font-sans text-center transition-all cursor-pointer flex items-center justify-center ${
                          isRadActive
                            ? 'bg-rose-100 dark:bg-rose-950/80 border-2 border-rose-500 text-rose-950 dark:text-white ring-2 ring-rose-500/40'
                            : sq.radRange.content
                            ? 'hover:bg-slate-200/80 dark:hover:bg-slate-800/80 text-slate-900 dark:text-white'
                            : 'border border-dashed border-rose-400 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-300 animate-pulse min-h-[24px]'
                        }`}
                        title="Clique para editar o Radicando"
                      >
                        {sq.radRange.content ? (
                          <span>{sq.radRange.content}</span>
                        ) : (
                          <span className="w-3.5 h-3.5 border border-dashed border-rose-400 rounded-xs inline-block" />
                        )}
                        {isRadActive && (
                          <span className="inline-block w-[2px] h-5 bg-rose-500 rounded-full animate-pulse ml-0.5" />
                        )}
                      </button>
                    </div>
                  );
                }

                // Render standard token with KaTeX math
                return (
                  <span
                    key={idx}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCursorToPosition(token.end);
                    }}
                    className="hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors cursor-pointer inline-flex items-center"
                  >
                    <MathRenderer math={token.raw} inline className="font-sans" />
                  </span>
                );
              })}

              {/* End of line active blinking cursor if cursor is at the end */}
              {cursorPos >= input.length && (
                <span className="inline-block w-[3px] h-7 sm:h-8 bg-rose-500 rounded-full animate-pulse ml-1 shrink-0" />
              )}
            </div>
          ) : (
            <div className="flex items-center text-slate-400 dark:text-slate-500 text-sm sm:text-base">
              <span>Digite ou toque nos botões para começar...</span>
              <span className="inline-block w-[3px] h-5 bg-rose-500 rounded-full animate-pulse ml-1" />
            </div>
          )}
        </div>

        {/* Clear Button (Photomath X icon) */}
        {input.trim().length > 0 && (
          <div className="flex items-center shrink-0 ml-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClear();
              }}
              className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 active:bg-rose-100 dark:active:bg-rose-950 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-xs"
              title="Limpar campo"
              aria-label="Limpar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* BOTTOM: Photomath Result Section with Red Accent Bar and 'Mostrar Solução' */}
      {liveResult.solution && liveResult.solution.finalAnswer?.exact && (
        <div className="pt-2.5 border-t border-dashed border-slate-200 dark:border-slate-800 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            {/* Answer Display with Red Bar */}
            <div className="flex items-start gap-2.5 pl-1">
              <div className="w-1.5 self-stretch min-h-[40px] bg-rose-600 rounded-full shrink-0 shadow-sm shadow-rose-600/50" />
              <div className="space-y-0.5">
                {/* Exact Main Answer */}
                <div className="flex items-center gap-2 text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                  <span className="text-slate-400 dark:text-slate-500 font-normal text-lg">=</span>
                  <div className="text-emerald-600 dark:text-emerald-400">
                    <MathRenderer math={liveResult.solution.finalAnswer.exact} inline />
                  </div>
                </div>

                {/* Alternative Forms (Mixed Fractions, Decimal) */}
                {liveResult.solution.finalAnswer.alternativeForms &&
                  liveResult.solution.finalAnswer.alternativeForms.length > 0 && (
                    <div className="space-y-0.5">
                      <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                        Forma Alternativa:
                      </span>
                      <div className="flex items-center gap-2 flex-wrap text-sm text-slate-700 dark:text-slate-300">
                        {liveResult.solution.finalAnswer.alternativeForms.map((alt, idx) => (
                          <React.Fragment key={idx}>
                            {idx > 0 && <span className="text-slate-400 dark:text-slate-600">,</span>}
                            <span className="font-mono bg-slate-100 dark:bg-slate-950 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200">
                              <MathRenderer math={alt} inline />
                            </span>
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            </div>

            {/* Red 'Mostrar Solução' Pill Button (Photomath Style) */}
            <button
              type="button"
              id="btn-photomath-show-solution"
              onClick={onShowSolution}
              disabled={isLoading}
              className="px-6 py-3.5 rounded-full bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-rose-600/30 hover:shadow-rose-600/50 transition-all cursor-pointer active:scale-95 disabled:opacity-50 shrink-0"
            >
              <span>{isLoading ? 'Calculando...' : 'Mostrar Solução'}</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Fallback button when no live instant answer yet */}
      {(!liveResult.solution || !liveResult.solution.finalAnswer?.exact) && input.trim().length > 0 && (
        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={onShowSolution}
            disabled={isLoading}
            className="w-full sm:w-auto px-6 py-3 rounded-full bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-rose-600/30 transition-all cursor-pointer active:scale-95"
          >
            <span>{isLoading ? 'Calculando...' : 'Resolver Passo a Passo'}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
