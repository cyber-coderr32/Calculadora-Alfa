import React, { useMemo } from 'react';
import katex from 'katex';

interface MathRendererProps {
  math: string;
  block?: boolean;
  className?: string;
  inline?: boolean;
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

    // Clean up surrounding delimiters if already present
    let cleanMath = math.trim();
    if (cleanMath.startsWith('$$') && cleanMath.endsWith('$$') && cleanMath.length > 4) {
      cleanMath = cleanMath.slice(2, -2).trim();
    } else if (cleanMath.startsWith('$') && cleanMath.endsWith('$') && cleanMath.length > 2) {
      cleanMath = cleanMath.slice(1, -1).trim();
    } else if (cleanMath.startsWith('\\(') && cleanMath.endsWith('\\)') && cleanMath.length > 4) {
      cleanMath = cleanMath.slice(2, -2).trim();
    } else if (cleanMath.startsWith('\\[') && cleanMath.endsWith('\\]') && cleanMath.length > 4) {
      cleanMath = cleanMath.slice(2, -2).trim();
    }

    try {
      return katex.renderToString(cleanMath, {
        displayMode: isDisplayMode,
        throwOnError: false,
        output: 'htmlAndMathml',
        trust: true,
      });
    } catch (err) {
      console.warn('KaTeX rendering error:', err);
      return `<span class="text-amber-300 font-mono text-sm">${escapeHtml(cleanMath)}</span>`;
    }
  }, [math, isDisplayMode]);

  function escapeHtml(str: string) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

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

// Component to render text with mixed inline $...$ or $$...$$ LaTeX formulas
export const MixedTextRenderer: React.FC<{
  text: string;
  className?: string;
  inline?: boolean;
}> = ({ text, className = '', inline = false }) => {
  if (!text) return null;

  // Split text by $$...$$, $...$, \(...\), and \[...\]
  const parts = useMemo(() => {
    const result: { type: 'text' | 'inline-math' | 'block-math'; content: string }[] = [];
    const regex = /(\$\$[\s\S]*?\$\$|\$[^\$\n]+?\$|\\\[[\s\S]*?\\\]|\\\([^\n]+?\\\))/g;

    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        // Clean any accidental stray dollar signs in plain text
        const plainStr = text.substring(lastIndex, match.index).replace(/\$/g, '');
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

    if (lastIndex < text.length) {
      const remainingStr = text.substring(lastIndex).replace(/\$/g, '');
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
