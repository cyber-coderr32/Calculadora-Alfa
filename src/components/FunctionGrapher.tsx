import React, { useEffect, useRef, useState } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Crosshair } from 'lucide-react';
import { MathRenderer } from './MathRenderer';

interface FunctionGrapherProps {
  expression?: string; // e.g. "x^2 - 4*x + 3" or "sin(x)"
  latexExpression?: string;
  roots?: number[];
  criticalPoints?: { x: number; y: number; label: string }[];
  title?: string;
}

export const FunctionGrapher: React.FC<FunctionGrapherProps> = ({
  expression = 'x^2 - 4',
  latexExpression,
  roots = [],
  criticalPoints = [],
  title,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Viewport bounds in math coordinates
  const [view, setView] = useState<{ minX: number; maxX: number; minY: number; maxY: number }>({
    minX: -6,
    maxX: 6,
    minY: -6,
    maxY: 6,
  });

  const [hoverCoord, setHoverCoord] = useState<{ x: number; y: number; px: number; py: number } | null>(null);

  // Safe expression evaluator for f(x)
  const evaluateFunction = (expr: string, xVal: number): number | null => {
    try {
      // Normalize mathematical string to JS Math syntax
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

      // Handle implicit multiplication like 4x -> 4*x or (x)(x) -> (x)*(x)
      clean = clean.replace(/(\d+)\s*([a-zA-Z\(])/g, '$1*$2');
      clean = clean.replace(/\)\s*(\()/g, ')*$1');
      clean = clean.replace(/\)\s*([a-zA-Z0-9])/g, ')*$1');

      // Replace x with numeric value
      // Safe sandbox function creation
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

  const drawGraph = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear background
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, width, height);

    // Coordinate conversion utilities
    const mathToPixelX = (x: number) => ((x - view.minX) / (view.maxX - view.minX)) * width;
    const mathToPixelY = (y: number) => height - ((y - view.minY) / (view.maxY - view.minY)) * height;

    const pixelToMathX = (px: number) => view.minX + (px / width) * (view.maxX - view.minX);
    const pixelToMathY = (py: number) => view.minY + ((height - py) / height) * (view.maxY - view.minY);

    // Draw Grid Lines & Numbers
    const rangeX = view.maxX - view.minX;
    let step = 1;
    if (rangeX > 30) step = 5;
    else if (rangeX > 15) step = 2;
    else if (rangeX < 4) step = 0.5;

    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    ctx.font = '10px "Fira Code", monospace';
    ctx.fillStyle = '#64748b';

    // Vertical grid
    const firstX = Math.ceil(view.minX / step) * step;
    for (let x = firstX; x <= view.maxX; x += step) {
      const px = mathToPixelX(x);
      ctx.beginPath();
      ctx.moveTo(px, 0);
      ctx.lineTo(px, height);
      ctx.stroke();

      if (Math.abs(x) > 0.0001) {
        ctx.fillText(x.toFixed(step < 1 ? 1 : 0), px + 3, mathToPixelY(0) + 12);
      }
    }

    // Horizontal grid
    const firstY = Math.ceil(view.minY / step) * step;
    for (let y = firstY; y <= view.maxY; y += step) {
      const py = mathToPixelY(y);
      ctx.beginPath();
      ctx.moveTo(0, py);
      ctx.lineTo(width, py);
      ctx.stroke();

      if (Math.abs(y) > 0.0001) {
        ctx.fillText(y.toFixed(step < 1 ? 1 : 0), mathToPixelX(0) + 4, py - 3);
      }
    }

    // Draw Main Axes X & Y
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1.5;

    // X-Axis
    const originY = mathToPixelY(0);
    ctx.beginPath();
    ctx.moveTo(0, originY);
    ctx.lineTo(width, originY);
    ctx.stroke();

    // Y-Axis
    const originX = mathToPixelX(0);
    ctx.beginPath();
    ctx.moveTo(originX, 0);
    ctx.lineTo(originX, height);
    ctx.stroke();

    // Origin label "0"
    ctx.fillText('0', originX - 10, originY + 12);

    // Plot Curve f(x)
    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 2.5;
    ctx.beginPath();

    let isDrawing = false;
    const samples = width * 1.5;
    const dx = (view.maxX - view.minX) / samples;

    for (let i = 0; i <= samples; i++) {
      const x = view.minX + i * dx;
      const y = evaluateFunction(expression, x);

      if (y !== null && !isNaN(y) && isFinite(y)) {
        const px = mathToPixelX(x);
        const py = mathToPixelY(y);

        // Clip large asymptotic jumps
        if (py >= -100 && py <= height + 100) {
          if (!isDrawing) {
            ctx.moveTo(px, py);
            isDrawing = true;
          } else {
            ctx.lineTo(px, py);
          }
        } else {
          isDrawing = false;
        }
      } else {
        isDrawing = false;
      }
    }
    ctx.stroke();

    // Highlight Critical Points / Vertices
    criticalPoints.forEach((pt) => {
      const px = mathToPixelX(pt.x);
      const py = mathToPixelY(pt.y);
      if (px >= 0 && px <= width && py >= 0 && py <= height) {
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(px, py, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle = '#fbbf24';
        ctx.font = 'bold 11px sans-serif';
        ctx.fillText(pt.label || `(${pt.x}, ${pt.y})`, px + 8, py - 6);
      }
    });

    // Highlight Roots (y = 0)
    roots.forEach((root) => {
      const px = mathToPixelX(root);
      const py = mathToPixelY(0);
      if (px >= 0 && px <= width) {
        ctx.fillStyle = '#10b981';
        ctx.beginPath();
        ctx.arc(px, py, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle = '#34d399';
        ctx.font = 'bold 10px monospace';
        ctx.fillText(`x = ${root}`, px - 15, py - 10);
      }
    });

    // Draw Crosshair on Hover
    if (hoverCoord) {
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.4)';
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1;

      // Vertical line
      ctx.beginPath();
      ctx.moveTo(hoverCoord.px, 0);
      ctx.lineTo(hoverCoord.px, height);
      ctx.stroke();

      // Horizontal line
      ctx.beginPath();
      ctx.moveTo(0, hoverCoord.py);
      ctx.lineTo(width, hoverCoord.py);
      ctx.stroke();
      ctx.setLineDash([]);

      // Point on curve
      const curveY = evaluateFunction(expression, hoverCoord.x);
      if (curveY !== null) {
        const cpy = mathToPixelY(curveY);
        ctx.fillStyle = '#818cf8';
        ctx.beginPath();
        ctx.arc(hoverCoord.px, cpy, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  };

  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      const rect = container.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = Math.max(280, Math.min(360, rect.width * 0.55));
      drawGraph();
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [view, expression, hoverCoord]);

  const handleZoom = (factor: number) => {
    setView((prev) => {
      const centerX = (prev.minX + prev.maxX) / 2;
      const centerY = (prev.minY + prev.maxY) / 2;
      const spanX = (prev.maxX - prev.minX) * factor;
      const spanY = (prev.maxY - prev.minY) * factor;
      return {
        minX: centerX - spanX / 2,
        maxX: centerX + spanX / 2,
        minY: centerY - spanY / 2,
        maxY: centerY + spanY / 2,
      };
    });
  };

  const handleReset = () => {
    setView({ minX: -6, maxX: 6, minY: -6, maxY: 6 });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;

    const x = view.minX + (px / canvas.width) * (view.maxX - view.minX);
    const y = view.minY + ((canvas.height - py) / canvas.height) * (view.maxY - view.minY);

    setHoverCoord({ x: parseFloat(x.toFixed(2)), y: parseFloat(y.toFixed(2)), px, py });
  };

  const handleMouseLeave = () => {
    setHoverCoord(null);
  };

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
      {/* Header with formula and zoom controls */}
      <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-600/20 text-indigo-400">
            <Crosshair className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-200">
              {title || 'Visualização Gráfica 2D da Função'}
            </h4>
            {latexExpression ? (
              <div className="text-xs text-indigo-300 font-mono">
                <MathRenderer math={`f(x) = ${latexExpression}`} inline />
              </div>
            ) : (
              <span className="text-xs font-mono text-indigo-300">f(x) = {expression}</span>
            )}
          </div>
        </div>

        {/* View Controls */}
        <div className="flex items-center gap-1.5">
          {hoverCoord && (
            <div className="text-[11px] font-mono bg-slate-950 px-2 py-1 rounded border border-slate-800 text-slate-300 mr-2">
              x: <span className="text-indigo-400">{hoverCoord.x}</span>, y:{' '}
              <span className="text-indigo-400">{hoverCoord.y}</span>
            </div>
          )}
          <button
            type="button"
            id="btn-zoom-in"
            onClick={() => handleZoom(0.75)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            title="Aproximar zoom"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            type="button"
            id="btn-zoom-out"
            onClick={() => handleZoom(1.33)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            title="Afastar zoom"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            type="button"
            id="btn-zoom-reset"
            onClick={handleReset}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            title="Redefinir visualização"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Canvas container */}
      <div ref={containerRef} className="w-full relative rounded-xl overflow-hidden border border-slate-800">
        <canvas
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="w-full cursor-crosshair block"
        />
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 px-1">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-1 bg-indigo-500 rounded"></span> Curva f(x)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Raízes (y=0)
          </span>
          {criticalPoints.length > 0 && (
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span> Vértices / Pontos Críticos
            </span>
          )}
        </div>
        <span>Passe o mouse para inspecionar coordenadas</span>
      </div>
    </div>
  );
};
