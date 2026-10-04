import React, { useState } from 'react';
import { Search, BookOpen, AlertCircle, Info, Scale } from 'lucide-react';
import { COMMON_ADDITIVES, AdditiveInfo } from '../data/halalRules.ts';

export const AdditivesGuide: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'HALAL' | 'HARAM' | 'MUSHBOOH'>('ALL');

  const additivesList: AdditiveInfo[] = Object.values(COMMON_ADDITIVES);

  const filteredAdditives = additivesList.filter((item) => {
    const matchesFilter = statusFilter === 'ALL' || item.status === statusFilter;
    const matchesSearch =
      item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.source.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 overflow-hidden shadow-sm">
      {/* Header */}
      <div className="p-5 border-b border-stone-100 dark:border-stone-800">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
          <h2 className="text-lg font-bold text-stone-900 dark:text-white font-display">
            Food Additives & E-Numbers Encyclopedia
          </h2>
        </div>
        <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
          Lookup common food additives, emulsifiers, colorants, and preservatives with their Islamic dietary rulings and origins.
        </p>

        {/* Search & Filters */}
        <div className="mt-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search code or name (e.g. E120, E471, Gelatin, Lecithin, Shellac...)"
              className="w-full h-10 pl-10 pr-3 text-xs sm:text-sm bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700 text-stone-900 dark:text-white placeholder:text-stone-400 dark:placeholder:text-stone-500"
            />
          </div>

          <div className="flex items-center gap-1 p-1 bg-stone-100 dark:bg-stone-800 rounded-xl self-start sm:self-auto shrink-0">
            {(['ALL', 'HALAL', 'MUSHBOOH', 'HARAM'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setStatusFilter(filter)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  statusFilter === filter
                    ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
                }`}
              >
                {filter === 'ALL' ? 'All' : filter}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid of Additives */}
      <div className="p-5 grid gap-3 sm:grid-cols-2">
        {filteredAdditives.length === 0 ? (
          <div className="col-span-2 py-10 text-center">
            <p className="text-stone-500 dark:text-stone-400 text-sm">No matching additives found.</p>
            <p className="text-stone-400 dark:text-stone-500 text-xs mt-1">Try another search term like "E471" or "Coloring".</p>
          </div>
        ) : (
          filteredAdditives.map((item) => (
            <div
              key={item.code}
              className={`p-4 rounded-xl border text-xs leading-relaxed flex flex-col justify-between ${
                item.status === 'HALAL'
                  ? 'border-emerald-200/80 dark:border-emerald-800/80 bg-emerald-50/20 dark:bg-emerald-950/30'
                  : item.status === 'HARAM'
                  ? 'border-rose-200/80 dark:border-rose-900/80 bg-rose-50/20 dark:bg-rose-950/30'
                  : 'border-amber-200/80 dark:border-amber-900/80 bg-amber-50/20 dark:bg-amber-950/30'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-stone-900 dark:text-white">
                      {item.code}
                    </span>
                    <span className="text-[11px] text-stone-500 dark:text-stone-400">· {item.category}</span>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      item.status === 'HALAL'
                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                        : item.status === 'HARAM'
                        ? 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300'
                        : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                    }`}
                  >
                    {item.status}
                  </span>
                </div>

                <h4 className="font-bold text-stone-900 dark:text-white text-xs mb-1">{item.name}</h4>
                <p className="text-[11px] text-stone-600 dark:text-stone-300 font-medium mb-2">
                  <strong className="text-stone-700 dark:text-stone-200">Source:</strong> {item.source}
                </p>
                <p className="text-stone-600 dark:text-stone-300 text-xs leading-relaxed mb-2.5">
                  {item.description}
                </p>
              </div>

              {item.jurisprudenceNote && (
                <div className="pt-2 border-t border-stone-200/60 dark:border-stone-800 mt-auto flex items-start gap-1.5 text-[11px] text-stone-700 dark:text-stone-300">
                  <Scale className="w-3.5 h-3.5 text-stone-500 dark:text-stone-400 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-stone-900 dark:text-white">Fiqh Rule:</strong> {item.jurisprudenceNote}
                  </span>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
