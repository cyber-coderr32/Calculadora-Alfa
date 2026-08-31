import React, { useState, useMemo } from 'react';
import { FORMULA_CATEGORIES } from '../../data/formulaCategories';
import { FormulaItem } from '../../types';
import { MathRenderer } from '../MathRenderer';
import {
  BookOpen,
  Search,
  ArrowRight,
  Sparkles,
  Copy,
  Check,
  Filter,
} from 'lucide-react';

interface FormulaLibraryViewProps {
  onSelectFormula: (formulaLatex: string, title?: string) => void;
}

export const FormulaLibraryView: React.FC<FormulaLibraryViewProps> = ({ onSelectFormula }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedLabel, setCopiedLabel] = useState<string | null>(null);

  // Filter formulas by category and search
  const filteredCategories = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    return FORMULA_CATEGORIES.map((cat) => {
      // If category filter is active and doesn't match, return empty items
      if (selectedCategory !== 'all' && cat.id !== selectedCategory) {
        return { ...cat, items: [] };
      }

      // Filter items within the category
      const items = cat.items.filter((f) => {
        if (!query) return true;
        return (
          f.label.toLowerCase().includes(query) ||
          (f.description && f.description.toLowerCase().includes(query)) ||
          f.insertText.toLowerCase().includes(query) ||
          (f.displayLatex && f.displayLatex.toLowerCase().includes(query))
        );
      });

      return { ...cat, items };
    }).filter((cat) => cat.items.length > 0);
  }, [selectedCategory, searchQuery]);

  const handleCopy = (formula: FormulaItem) => {
    const textToCopy = formula.displayLatex || formula.insertText;
    navigator.clipboard.writeText(textToCopy);
    setCopiedLabel(formula.label);
    setTimeout(() => setCopiedLabel(null), 2000);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Banner */}
      <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 shadow-xl w-full max-w-full box-border">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 w-full">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 shrink-0">
                <BookOpen className="w-5 h-5" />
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white tracking-tight truncate">
                Biblioteca de Fórmulas
              </h2>
            </div>
            <p className="text-xs md:text-sm text-slate-400">
              Centenas de fórmulas de Álgebra, Geometria, Trigonometria, Cálculo, Estatística e Finanças.
            </p>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72 shrink-0">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar fórmula ou conceito..."
              className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl sm:rounded-2xl pl-10 pr-4 py-2 text-xs md:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-sans"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
              >
                Limpar
              </button>
            )}
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 mt-5 overflow-x-auto pb-1 scrollbar-thin">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800/80 border border-slate-800'
            }`}
          >
            Todas as Áreas
          </button>
          {FORMULA_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800/80 border border-slate-800'
              }`}
            >
              {cat.title}
            </button>
          ))}
        </div>
      </div>

      {/* Formulas List by Category */}
      {filteredCategories.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/60 border border-slate-800 rounded-3xl space-y-3">
          <Filter className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white">Nenhuma fórmula encontrada</h3>
          <p className="text-xs text-slate-400">
            Tente buscar com outros termos como "Bhaskara", "Derivada", "Seno", "Triângulo" ou limpe os filtros.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {filteredCategories.map((cat) => (
            <div key={cat.id} className="space-y-3">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-white uppercase tracking-wider">
                  {cat.title}
                </h3>
                <span className="text-[10px] font-extrabold bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full border border-slate-700">
                  {cat.items.length} {cat.items.length === 1 ? 'item' : 'itens'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {cat.items.map((formula, idx) => (
                  <div
                    key={`${cat.id}-${idx}`}
                    className="p-4 rounded-2xl bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-indigo-500/50 transition-all flex flex-col justify-between group shadow-sm hover:shadow-md"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h4 className="text-xs md:text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">
                          {formula.label}
                        </h4>
                        <button
                          type="button"
                          onClick={() => handleCopy(formula)}
                          className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                          title="Copiar código LaTeX / expressão"
                        >
                          {copiedLabel === formula.label ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>

                      {formula.description && (
                        <p className="text-[11px] text-slate-400 mb-3 line-clamp-2 leading-relaxed">
                          {formula.description}
                        </p>
                      )}

                      {/* LaTeX Preview Box */}
                      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-center my-2 overflow-x-auto text-indigo-200">
                        <MathRenderer math={formula.displayLatex || formula.insertText} block />
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                      <span className="text-[10px] font-semibold text-slate-500 uppercase">
                        {cat.title.split('&')[0].trim()}
                      </span>

                      <button
                        type="button"
                        onClick={() => onSelectFormula(formula.insertText, formula.label)}
                        className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1 transition-all shadow-sm group-hover:shadow-indigo-500/20 cursor-pointer"
                      >
                        <span>Usar & Resolver</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
