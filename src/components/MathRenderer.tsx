import React, { useMemo } from 'react';
import katex from 'katex';

interface MathRendererProps {
  math: string;
  block?: boolean;
  className?: string;
  inline?: boolean;
}

function escapeHtml(str: string) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function sanitizeLatexString(raw: string): string {
  if (!raw) return '';
  let s = raw.trim();

  // Strip leading/trailing delimiters
  if (s.startsWith('$$') && s.endsWith('$$') && s.length > 4) {
    s = s.slice(2, -2).trim();
  } else if (s.startsWith('$') && s.endsWith('$') && s.length > 2) {
    s = s.slice(1, -1).trim();
  } else if (s.startsWith('\\(') && s.endsWith('\\)') && s.length > 4) {
    s = s.slice(2, -2).trim();
  } else if (s.startsWith('\\[') && s.endsWith('\\]') && s.length > 4) {
    s = s.slice(2, -2).trim();
  }

  // Fix missing backslashes on color, mathbf and textcolor (e.g. \mathbf{color{#e11d48}{...}} -> \mathbf{\color{#e11d48}{...}})
  s = s.replace(/(?<!\\)color\{/g, '\\color{');
  s = s.replace(/(?<!\\)mathbf\{/g, '\\mathbf{');
  s = s.replace(/(?<!\\)textcolor\{/g, '\\textcolor{');

  // Balance unclosed curly braces if any
  const openCount = (s.match(/\{/g) || []).length;
  const closeCount = (s.match(/\}/g) || []).length;
  if (openCount > closeCount) {
    s += '}'.repeat(openCount - closeCount);
  }

  return s;
}

function renderLatexSafely(raw: string, isDisplayMode: boolean): string {
  const sanitized = sanitizeLatexString(raw);
  if (!sanitized) return '';

  try {
    const rendered = katex.renderToString(sanitized, {
      displayMode: isDisplayMode,
      throwOnError: false,
      output: 'htmlAndMathml',
      trust: true,
    });

    // If KaTeX outputted an internal katex-error tag, recover gracefully
    if (rendered.includes('katex-error')) {
      // Try stripping problematic color and bold commands to recover the pure math formula
      const cleanedFormula = sanitized
        .replace(/\\?mathbf\{/gi, '')
        .replace(/\\?color\{[^}]*\}\{?/gi, '')
        .replace(/\\?textcolor\{[^}]*\}\{?/gi, '')
        .replace(/[{}]/g, '')
        .trim();

      if (cleanedFormula) {
        const fallbackRendered = katex.renderToString(cleanedFormula, {
          displayMode: isDisplayMode,
          throwOnError: false,
          output: 'htmlAndMathml',
          trust: true,
        });
        if (!fallbackRendered.includes('katex-error')) {
          return fallbackRendered;
        }
      }

      // If still invalid, display clean readable math text without raw LaTeX command names
      const plainText = sanitized.replace(/\\[a-zA-Z]+/g, '').replace(/[{}]/g, '').trim();
      return `<span class="font-mono text-sm">${escapeHtml(plainText || sanitized)}</span>`;
    }

    return rendered;
  } catch (err) {
    console.warn('KaTeX rendering error:', err);
    const plainText = sanitized.replace(/\\[a-zA-Z]+/g, '').replace(/[{}]/g, '').trim();
    return `<span class="font-mono text-sm">${escapeHtml(plainText || sanitized)}</span>`;
  }
}

export const MathRenderer: React.FC<MathRendererProps> = ({
  math,
  block = false,
  className = '',
  inline = false,
}) => {
  const isDisplayMode = block && !inline;

  const html = useMemo(() => {
    if (!math || typeof math !== 'string') return '';
    return renderLatexSafely(math, isDisplayMode);
  }, [math, isDisplayMode]);

  if (isDisplayMode) {
    const hasBg = className.includes('bg-');
    const defaultBg = hasBg ? '' : 'bg-transparent';
    return (
      <div
        className={`overflow-x-auto py-1 px-1 my-0.5 flex items-center justify-center max-w-full text-center ${defaultBg} ${className}`}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }

  return (
    <span
      className={`inline-block align-middle max-w-full overflow-x-auto ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};

/**
 * Automatically detects unwrapped LaTeX formulas and math commands in regular text
 * and wraps them in inline math delimiters ($...$) so that KaTeX renders them
 * cleanly, preventing raw computer code / LaTeX syntax from showing to the user.
 */
export function cleanAndWrapLatexInText(rawText: string): string {
  if (!rawText) return '';

  // 1. Protect existing math blocks ($$...$$, $...$, \(...\), \[...\])
  const protectedBlocks: string[] = [];
  let s = rawText.replace(/(\$\$[\s\S]*?\$\$|\$[^\$\n]+?\$|\\\[[\s\S]*?\\\]|\\\([^\n]+?\\\))/g, (m) => {
    const placeholder = `___MATH_BLOCK_${protectedBlocks.length}___`;
    protectedBlocks.push(m);
    return placeholder;
  });

  // 2. Identify unwrapped LaTeX formulas, fractions, roots and math symbols
  // Matches:
  // - Fractions with attached whole numbers or variables: 4\frac{7}{4}, A\frac{B}{C}, -\frac{1}{2}
  // - Expressions starting with an assignment or relation: x = \frac{...}{...}
  // - Standard LaTeX commands followed by balanced arguments or operators
  const latexPattern = /(?:(?<=\s|^|\()([A-Za-z0-9]+)\s*=\s*)?(?:(?<=\s|^|\()([0-9]+|[A-Za-z]))?\\([a-zA-Z]+)(?:\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}|\[[^\]]*\])*(?:\s*(?:[\+\-\*\/=\<\>\^]|\\cdot|\\pm|\\le|\\ge|\\ne)\s*(?:[0-9A-Za-z\^\_\{\}]+|\\[a-zA-Z]+(?:\{[^{}]*\}|\[[^\]]*\])*))*/g;

  s = s.replace(latexPattern, (match) => {
    const trimmed = match.trim();
    if (!trimmed) return match;
    if (trimmed.startsWith('$') && trimmed.endsWith('$')) return match;
    return `$${trimmed}$`;
  });

  // 3. Restore protected blocks
  s = s.replace(/___MATH_BLOCK_(\d+)___/g, (_, idx) => protectedBlocks[Number(idx)] || '');

  return s;
}

/**
 * Clean plain text fallback to guarantee no raw backslash syntax or tech code leaks to the user
 */
function cleanPlainTextFallback(str: string): string {
  if (!str) return '';
  return str
    .replace(/\\cdot/g, '·')
    .replace(/\\times/g, '×')
    .replace(/\\pm/g, '±')
    .replace(/\\mp/g, '∓')
    .replace(/\\le/g, '≤')
    .replace(/\\ge/g, '≥')
    .replace(/\\ne/g, '≠')
    .replace(/\\approx/g, '≈')
    .replace(/\\pi/g, 'π')
    .replace(/\\Delta/g, 'Δ')
    .replace(/\\infty/g, '∞')
    .replace(/\\rightarrow|\\to/g, '→')
    .replace(/\\leftarrow/g, '←')
    .replace(/\\implies/g, '⇒')
    .replace(/\\iff/g, '⇔')
    .replace(/\\[a-zA-Z]+/g, '')
    .replace(/[{}]/g, '');
}

// Component to render text with mixed inline $...$ or $$...$$ LaTeX formulas
export const MixedTextRenderer: React.FC<{
  text: string;
  className?: string;
  inline?: boolean;
}> = ({ text, className = '', inline = false }) => {
  if (!text) return null;

  // Split text by $$...$$, $...$, \(...\), and \[...\] after preprocessing
  const parts = useMemo(() => {
    const processedText = cleanAndWrapLatexInText(text);
    const result: { type: 'text' | 'inline-math' | 'block-math'; content: string }[] = [];
    const regex = /(\$\$[\s\S]*?\$\$|\$[^\$\n]+?\$|\\\[[\s\S]*?\\\]|\\\([^\n]+?\\\))/g;

    let lastIndex = 0;
    let match;

    while ((match = regex.exec(processedText)) !== null) {
      if (match.index > lastIndex) {
        // Clean any accidental stray dollar signs in plain text and replace symbols
        const plainStr = cleanPlainTextFallback(
          processedText.substring(lastIndex, match.index).replace(/\$/g, '')
        );
        if (plainStr) {
          result.push({
            type: 'text',
            content: plainStr,
          });
        }
      }

      const matchStr = match[0];
      if (matchStr.startsWith('$$') && matchStr.endsWith('$$')) {
        result.push({
          type: 'block-math',
          content: matchStr.slice(2, -2).trim(),
        });
      } else if (matchStr.startsWith('\\[') && matchStr.endsWith('\\]')) {
        result.push({
          type: 'block-math',
          content: matchStr.slice(2, -2).trim(),
        });
      } else if (matchStr.startsWith('\\(') && matchStr.endsWith('\\)')) {
        result.push({
          type: 'inline-math',
          content: matchStr.slice(2, -2).trim(),
        });
      } else if (matchStr.startsWith('$') && matchStr.endsWith('$')) {
        result.push({
          type: 'inline-math',
          content: matchStr.slice(1, -1).trim(),
        });
      }

      lastIndex = regex.lastIndex;
    }

    if (lastIndex < processedText.length) {
      const remainingStr = cleanPlainTextFallback(
        processedText.substring(lastIndex).replace(/\$/g, '')
      );
      if (remainingStr) {
        result.push({
          type: 'text',
          content: remainingStr,
        });
      }
    }

    return result;
  }, [text]);

  const renderedContent = parts.map((part, idx) => {
    if (part.type === 'block-math') {
      return <MathRenderer key={idx} math={part.content} block />;
    }
    if (part.type === 'inline-math') {
      return <MathRenderer key={idx} math={part.content} inline />;
    }
    return <span key={idx}>{part.content}</span>;
  });

  if (inline) {
    return <span className={`inline-block ${className}`}>{renderedContent}</span>;
  }

  return (
    <div className={`leading-relaxed ${className}`}>
      {renderedContent}
    </div>
  );
};
