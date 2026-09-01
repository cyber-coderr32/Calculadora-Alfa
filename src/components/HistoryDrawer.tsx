import React, { useState } from 'react';
import { MathSolution } from '../types';
import { MathRenderer } from './MathRenderer';
import {
  History,
  X,
  Search,
  Trash2,
  Bookmark,
  BookmarkCheck,
  ChevronRight,
  Clock,
  Camera,
} from 'lucide-react';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  history: MathSolution[];
  onSelectSolution: (solution: MathSolution) => void;
  onClearHistory: () => void;
  onDeleteItem: (id: string) => void;
  favorites: string[];
  onToggleFavorite: (id: string) => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  history,
  onSelectSolution,
  onClearHistory,
  onDeleteItem,
  favorites,
  onToggleFavorite,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterFav, setFilterFav] = useState(false);

  if (!isOpen) return null;

  const filteredHistory = history.filter((item) => {
    const matchesSearch =
      (item.problemTitle || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.problemType || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.originalInput || '').toLowerCase().includes(searchTerm.toLowerCase());

    if (filterFav) {
      return matchesSearch && favorites.includes(item.id);
    }
    return matchesSearch;
  });

  const formatDate = (timestamp: number) => {
    try {
      const d = new Date(timestamp);
      return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) + ' - ' + d.toLocaleDateString('pt-BR');
    } catch {
      return '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end modal-backdrop-blur animate-fade-in">
      <div className="w-full max-w-md bg-slate-900/95 border-l border-indigo-500/20 h-full flex flex-col shadow-2xl backdrop-blur-xl">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 shadow-inner">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Histórico de Resoluções</h3>
              <p className="text-xs text-slate-400">Suas equações e fotos resolvidas</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search and Filters */}
        <div className="p-3 border-b border-slate-800 space-y-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar por assunto, fórmula..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={() => setFilterFav(!filterFav)}
              className={`px-2.5 py-1 rounded-lg border font-medium flex items-center gap-1.5 transition-colors ${
                filterFav
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>Favoritos ({favorites.length})</span>
            </button>

            {history.length > 0 && (
              <button
                type="button"
                onClick={onClearHistory}
                className="text-red-400 hover:text-red-300 text-xs flex items-center gap-1 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Limpar Histórico</span>
              </button>
            )}
          </div>
        </div>

        {/* List of Previous Solutions */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
          {filteredHistory.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
              <Clock className="w-10 h-10 mb-2 opacity-40" />
              <p className="text-sm font-semibold text-slate-400">Nenhum cálculo salvo ainda</p>
              <p className="text-xs text-slate-500 mt-1">
                Resolva um exercício pelo teclado ou escaneie com a câmera para salvar automaticamente.
              </p>
            </div>
          ) : (
            filteredHistory.map((item) => {
              const isFav = favorites.includes(item.id);
              return (
                <div
                  key={item.id}
                  className="bg-slate-950/80 border border-slate-800/90 hover:border-indigo-500/50 rounded-2xl p-3.5 transition-all group relative"
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                        {item.problemType || 'Matemática'}
                      </span>
                      {item.detectedFromImage && (
                        <span className="text-[10px] text-purple-300 bg-purple-950/60 px-1.5 py-0.5 rounded flex items-center gap-1">
                          <Camera className="w-3 h-3" /> Foto
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleFavorite(item.id);
                        }}
                        className="text-slate-400 hover:text-amber-400 transition-colors p-1"
                        title={isFav ? 'Remover favorito' : 'Favoritar'}
                      >
                        {isFav ? (
                          <BookmarkCheck className="w-4 h-4 text-amber-400" />
                        ) : (
                          <Bookmark className="w-4 h-4" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteItem(item.id);
                        }}
                        className="text-slate-500 hover:text-rose-400 transition-colors p-1"
                        title="Excluir este cálculo do histórico"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <h4 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors line-clamp-1">
                    {item.problemTitle}
                  </h4>

                  {item.finalAnswer?.exact && (
                    <div className="my-1.5 p-1.5 bg-slate-900 rounded-lg text-xs font-mono text-emerald-400 line-clamp-1">
                      <MathRenderer math={item.finalAnswer.exact} inline />
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/80 text-[11px] text-slate-500">
                    <span>{formatDate(item.timestamp)}</span>
                    <button
                      type="button"
                      onClick={() => {
                        onSelectSolution(item);
                        onClose();
                      }}
                      className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
                    >
                      <span>Abrir</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
