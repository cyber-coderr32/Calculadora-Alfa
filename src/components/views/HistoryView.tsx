import React, { useState, useMemo } from 'react';
import { MathSolution } from '../../types';
import { MathRenderer } from '../MathRenderer';
import {
  History,
  Star,
  Trash2,
  Search,
  Calendar,
  Sparkles,
  ArrowRight,
  Printer,
  Copy,
  Check,
  CheckCircle2,
} from 'lucide-react';

interface HistoryViewProps {
  history: MathSolution[];
  onSelectSolution: (solution: MathSolution) => void;
  onClearHistory: () => void;
  onDeleteItem: (id: string) => void;
  favorites: string[];
  onToggleFavorite: (id: string) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  history,
  onSelectSolution,
  onClearHistory,
  onDeleteItem,
  favorites,
  onToggleFavorite,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [onlyFavorites, setOnlyFavorites] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredHistory = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    return history.filter((item) => {
      if (onlyFavorites && !favorites.includes(item.id)) return false;
      if (!query) return true;
      return (
        item.problemTitle.toLowerCase().includes(query) ||
        item.problemType.toLowerCase().includes(query) ||
        item.originalInput.toLowerCase().includes(query) ||
        item.finalAnswer.exact.toLowerCase().includes(query)
      );
    });
  }, [history, searchQuery, onlyFavorites, favorites]);

  const handleCopyLatex = (item: MathSolution) => {
    navigator.clipboard.writeText(item.finalAnswer.exact);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
                <History className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-black text-white tracking-tight">
                Histórico & Caderno de Exercícios
              </h2>
            </div>
            <p className="text-xs md:text-sm text-slate-400">
              Revise todos os cálculos e passos detalhados salvos na sua sessão. Você pode filtrar por favoritos, pesquisar e imprimir.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir Caderno</span>
            </button>

            {history.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Tem certeza que deseja limpar todo o histórico de cálculos?')) {
                    onClearHistory();
                  }
                }}
                className="px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Limpar Histórico</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mt-5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar no histórico por título, equação ou resposta..."
              className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-2xl pl-10 pr-4 py-2.5 text-xs md:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-sans"
            />
          </div>

          <button
            type="button"
            onClick={() => setOnlyFavorites(!onlyFavorites)}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              onlyFavorites
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Star className={`w-4 h-4 ${onlyFavorites ? 'fill-amber-400 text-amber-400' : ''}`} />
            <span>Apenas Favoritos ({favorites.length})</span>
          </button>
        </div>
      </div>

      {/* History Items Grid */}
      {filteredHistory.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/60 border border-slate-800 rounded-3xl space-y-3">
          <History className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white">
            {onlyFavorites ? 'Nenhum favorito encontrado' : 'Nenhum cálculo no histórico'}
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {onlyFavorites
              ? 'Marque itens com a estrela para salvar seus exercícios favoritos aqui.'
              : 'Resolva exercícios na Calculadora ou pelo Scanner de Câmera para criar seu histórico automático.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredHistory.map((item) => {
            const isFav = favorites.includes(item.id);
            const dateStr = new Date(item.timestamp).toLocaleString('pt-BR', {
              day: '2-digit',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={item.id}
                className="p-5 rounded-3xl bg-slate-900 border border-slate-800 hover:border-indigo-500/50 transition-all flex flex-col justify-between group shadow-sm hover:shadow-md"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block">
                        {item.problemType}
                      </span>
                      <h4 className="text-sm font-extrabold text-white group-hover:text-indigo-300 transition-colors">
                        {item.problemTitle}
                      </h4>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => onToggleFavorite(item.id)}
                        className={`p-2 rounded-xl border transition-all cursor-pointer ${
                          isFav
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : 'bg-slate-950 text-slate-500 border-slate-800 hover:text-white'
                        }`}
                        title={isFav ? 'Remover dos favoritos' : 'Favoritar exercício'}
                      >
                        <Star className={`w-4 h-4 ${isFav ? 'fill-amber-400' : ''}`} />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm('Excluir este cálculo do histórico?')) {
                            onDeleteItem(item.id);
                          }
                        }}
                        className="p-2 rounded-xl border border-slate-800 bg-slate-950 text-slate-500 hover:text-rose-400 hover:border-rose-500/40 transition-all cursor-pointer"
                        title="Excluir este cálculo do histórico"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Formula Preview Box */}
                  <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800/80 text-center font-medium text-sm text-indigo-200 overflow-x-auto">
                    <MathRenderer math={item.originalInput} block />
                  </div>

                  {/* Final Answer Banner */}
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-emerald-500/30 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-emerald-400">Resposta:</span>
                    <span className="text-xs font-bold font-mono text-emerald-300">
                      <MathRenderer math={item.finalAnswer.exact} />
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-1.5 text-[11px]">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{dateStr}</span>
                    <span className="text-slate-600">•</span>
                    <span>{item.steps.length} passos</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => onSelectSolution(item)}
                    className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center gap-1 shadow-sm transition-all cursor-pointer"
                  >
                    <span>Abrir Resolução</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
