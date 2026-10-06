import React, { useState, useEffect, useRef } from 'react';
import { Search, RefreshCw, Sparkles, Filter, ExternalLink, Mic, MicOff, X, AlertCircle, Volume2, Globe } from 'lucide-react';
import { SAMPLE_PRODUCTS } from '../data/halalRules.ts';

const VOICE_LANGUAGES = [
  { code: 'en-US', label: 'English (US/CA)' },
  { code: 'en-GB', label: 'English (UK)' },
  { code: 'ms-MY', label: 'Bahasa Melayu' },
  { code: 'id-ID', label: 'Bahasa Indonesia' },
  { code: 'ar-SA', label: 'العربية (Arabic)' },
];

/**
 * Strips conversational voice prefixes/suffixes (e.g. "Is Nutella halal?", "Search for Haribo")
 * so natural spoken queries match product names accurately.
 */
function parseSpokenProductQuery(rawTranscript: string): {
  cleanedQuery: string;
  filterCommand?: 'all' | 'halal' | 'mushbooh' | 'haram';
  clearCommand?: boolean;
} {
  const lower = rawTranscript.toLowerCase().replace(/[?.!,]/g, '').trim();

  if (lower === 'clear' || lower === 'clear search' || lower === 'reset' || lower === 'show all') {
    return { cleanedQuery: '', filterCommand: 'all', clearCommand: true };
  }
  if (lower === 'filter halal' || lower === 'show halal' || lower === 'halal only') {
    return { cleanedQuery: '', filterCommand: 'halal' };
  }
  if (lower === 'filter haram' || lower === 'show haram') {
    return { cleanedQuery: '', filterCommand: 'haram' };
  }
  if (lower === 'filter mushbooh' || lower === 'show mushbooh' || lower === 'show doubtful') {
    return { cleanedQuery: '', filterCommand: 'mushbooh' };
  }

  let cleaned = rawTranscript
    .replace(/^[.,?!]+|[.,?!]+$/g, '')
    .replace(/^(hey halalcheck|halalcheck|search for|look up|find|check if|check|is|are)\s+/i, '')
    .replace(/\s+(is halal|halal or haram|halal|haram|permissible|certified)$/i, '')
    .trim();

  return { cleanedQuery: cleaned || rawTranscript.trim() };
}

interface ProductItem {
  barcode: string;
  name: string;
  brand: string;
  category: string;
  status: 'HALAL' | 'HARAM' | 'MUSHBOOH' | 'HALAL_CERTIFIED';
  isHalalCertified?: boolean;
  summary?: string;
  ingredients?: string;
  imageUrl?: string;
}

interface ProductCatalogProps {
  onSelectProduct: (barcode: string) => void;
}

export const ProductCatalog: React.FC<ProductCatalogProps> = ({ onSelectProduct }) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [products, setProducts] = useState<ProductItem[]>(SAMPLE_PRODUCTS);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [voiceLang, setVoiceLang] = useState<string>('en-US');
  const [interimTranscript, setInterimTranscript] = useState<string>('');
  const [lastVoiceConfidence, setLastVoiceConfidence] = useState<number | null>(null);
  const [handsFreeContinuous, setHandsFreeContinuous] = useState<boolean>(false);

  const isSpeechSupported =
    typeof window !== 'undefined' &&
    Boolean((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

  const recognitionRef = useRef<any>(null);

  // Debounced search
  useEffect(() => {
    const handler = setTimeout(async () => {
      if (!searchTerm.trim()) {
        setProducts(SAMPLE_PRODUCTS);
        return;
      }

      setIsLoading(true);
      try {
        const res = await fetch(`/api/search-products?q=${encodeURIComponent(searchTerm.trim())}`);
        if (res.ok) {
          const data = await res.json();
          if (data.results && Array.isArray(data.results)) {
            setProducts(data.results);
          }
        }
      } catch (e) {
        console.warn('Search query error:', e);
      } finally {
        setIsLoading(false);
      }
    }, 350);

    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Voice Search Handler using Web Speech API
  const startVoiceSearch = () => {
    setSpeechError(null);
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechError('Voice search is not supported in this browser. Please try Google Chrome or Safari.');
      return;
    }

    try {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }

      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.continuous = handsFreeContinuous;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      recognition.lang = voiceLang || navigator.language || 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setInterimTranscript('');
      };

      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        let currentInterim = '';
        let bestConfidence: number | null = null;

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const res = event.results[i];
          if (res.isFinal) {
            finalTranscript += res[0].transcript;
            if (typeof res[0].confidence === 'number' && res[0].confidence > 0) {
              bestConfidence = Math.round(res[0].confidence * 100);
            }
          } else {
            currentInterim += res[0].transcript;
          }
        }

        if (currentInterim) {
          setInterimTranscript(currentInterim);
        }

        const rawText = (finalTranscript || currentInterim).trim();
        if (rawText) {
          const parsed = parseSpokenProductQuery(rawText);
          if (parsed.clearCommand) {
            setSearchTerm('');
            setFilterStatus('all');
          } else if (parsed.filterCommand) {
            setFilterStatus(parsed.filterCommand);
          } else if (parsed.cleanedQuery) {
            setSearchTerm(parsed.cleanedQuery);
          }
          if (bestConfidence !== null) {
            setLastVoiceConfidence(bestConfidence);
          }
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setSpeechError('Microphone permission was denied. Please allow microphone access in your browser.');
        } else if (event.error !== 'no-speech' && event.error !== 'aborted') {
          setSpeechError(`Voice input error: ${event.error}`);
        }
        setIsListening(false);
        setInterimTranscript('');
      };

      recognition.onend = () => {
        setIsListening(false);
        setInterimTranscript('');
      };

      recognition.start();
    } catch (err: any) {
      console.warn('Speech recognition start failed:', err);
      setIsListening(false);
      setSpeechError('Could not start voice recognition. Please verify microphone access.');
    }
  };

  const stopVoiceSearch = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }
    setIsListening(false);
  };

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  const filteredProducts = products.filter((p) => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'halal') return p.status === 'HALAL' || p.status === 'HALAL_CERTIFIED';
    if (filterStatus === 'haram') return p.status === 'HARAM';
    if (filterStatus === 'mushbooh') return p.status === 'MUSHBOOH';
    return true;
  });

  return (
    <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 overflow-hidden shadow-sm">
      {/* Search Header */}
      <div className="p-5 border-b border-stone-100 dark:border-stone-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-stone-900 dark:text-white font-display">
              Search Food Products & Hands-Free Voice Lookup
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              Speak or type any food name, brand, or natural question (e.g., &ldquo;Is Nutella Halal?&rdquo;) while shopping.
            </p>
          </div>

          {/* Voice Language & Hands-Free Controls */}
          <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
            <div className="flex items-center gap-1.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl px-2.5 py-1.5">
              <Globe className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <select
                aria-label="Voice search recognition language"
                value={voiceLang}
                onChange={(e) => setVoiceLang(e.target.value)}
                className="text-xs font-semibold bg-transparent text-stone-700 dark:text-stone-200 focus:outline-none cursor-pointer"
              >
                {VOICE_LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code} className="bg-white dark:bg-stone-900">
                    {l.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={() => setHandsFreeContinuous((prev) => !prev)}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                handsFreeContinuous
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                  : 'bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400'
              }`}
              title="Keep microphone active for continuous back-to-back product searches while in the grocery aisle"
            >
              {handsFreeContinuous ? 'Hands-Free: ON' : 'Hands-Free: Single'}
            </button>
          </div>
        </div>

        {/* Search Input with Voice Button */}
        <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={
                isListening
                  ? interimTranscript
                    ? `Hearing: "${interimTranscript}"...`
                    : 'Listening... Speak product name or say "Is Oreo Halal?"'
                  : 'Search by product name or tap Voice Search (e.g. Haribo, Doritos, Oreo, Nutella...)'
              }
              className={`w-full h-11 pl-10 pr-12 text-xs sm:text-sm bg-stone-50 dark:bg-stone-800 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700 text-stone-900 dark:text-white placeholder:text-stone-400 dark:placeholder:text-stone-500 transition-all ${
                isListening
                  ? 'border-rose-400 dark:border-rose-600 ring-2 ring-rose-200 dark:ring-rose-900/60 bg-rose-50/20 dark:bg-rose-950/20'
                  : 'border-stone-200 dark:border-stone-700'
              }`}
            />

            {/* Clear & Loading triggers inside input */}
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {isLoading && (
                <RefreshCw className="w-4 h-4 text-emerald-700 dark:text-emerald-400 animate-spin mr-1" />
              )}

              {searchTerm && !isLoading && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('');
                    setLastVoiceConfidence(null);
                  }}
                  className="p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-lg hover:bg-stone-200/50 dark:hover:bg-stone-700 transition-colors cursor-pointer"
                  title="Clear search text"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Prominent Hands-Free Voice-to-Text Search Button */}
          <button
            type="button"
            onClick={isListening ? stopVoiceSearch : startVoiceSearch}
            className={`h-11 px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 shrink-0 ${
              isListening
                ? 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse shadow-md shadow-rose-600/20'
                : 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs'
            }`}
            title={
              isListening
                ? 'Stop voice recognition'
                : isSpeechSupported
                ? 'Start hands-free voice-to-text product search'
                : 'SpeechRecognition API requires Chrome, Edge, or Safari'
            }
          >
            {isListening ? (
              <>
                <MicOff className="w-4 h-4" />
                <span>Stop Listening</span>
              </>
            ) : (
              <>
                <Mic className="w-4 h-4" />
                <span>Voice Search</span>
              </>
            )}
          </button>
        </div>

        {/* Quick Voice Command Chips */}
        <div className="mt-2.5 flex items-center gap-1.5 flex-wrap text-[11px]">
          <span className="text-stone-400 dark:text-stone-500 font-medium flex items-center gap-1">
            <Volume2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
            <span>Try saying:</span>
          </span>
          {['"Is Nutella Halal?"', '"Check Haribo"', '"Find Doritos"', '"Show Halal"'].map(
            (phrase) => (
              <button
                key={phrase}
                type="button"
                onClick={() => {
                  const raw = phrase.replace(/"/g, '');
                  const parsed = parseSpokenProductQuery(raw);
                  if (parsed.filterCommand) {
                    setFilterStatus(parsed.filterCommand);
                  } else {
                    setSearchTerm(parsed.cleanedQuery);
                  }
                }}
                className="px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 text-stone-600 dark:text-stone-300 hover:text-emerald-700 dark:hover:text-emerald-300 border border-stone-200/80 dark:border-stone-700 transition-colors cursor-pointer"
              >
                {phrase}
              </button>
            )
          )}
          {lastVoiceConfidence !== null && searchTerm && (
            <span className="ml-auto text-[11px] font-mono-numbers text-emerald-700 dark:text-emerald-400 font-semibold">
              Voice Match: &ldquo;{searchTerm}&rdquo; ({lastVoiceConfidence}% confidence)
            </span>
          )}
        </div>

        {/* Live Voice Indicator Bar */}
        {isListening && (
          <div className="mt-2 px-3 py-1.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-lg flex items-center justify-between text-xs text-rose-900 dark:text-rose-200 animate-in fade-in duration-150">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
              <span className="font-medium">Listening to your voice... Speak product name clearly</span>
            </div>
            <button
              type="button"
              onClick={stopVoiceSearch}
              className="text-[11px] font-bold text-rose-700 dark:text-rose-300 hover:text-rose-950 dark:hover:text-rose-100 underline cursor-pointer"
            >
              Done / Stop
            </button>
          </div>
        )}

        {/* Speech Error Banner */}
        {speechError && (
          <div className="mt-2 p-2.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-lg text-xs text-amber-900 dark:text-amber-200 flex items-center justify-between gap-2 animate-in fade-in duration-150">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400 shrink-0" />
              <span>{speechError}</span>
            </div>
            <button
              type="button"
              onClick={() => setSpeechError(null)}
              className="text-[11px] text-amber-800 dark:text-amber-300 hover:text-amber-950 dark:hover:text-amber-100 font-semibold cursor-pointer shrink-0"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Segmented Filter Controls */}
        <div className="flex items-center gap-1 mt-3 p-1 bg-stone-100 dark:bg-stone-800 rounded-xl max-w-sm">
          <button
            onClick={() => setFilterStatus('all')}
            className={`flex-1 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              filterStatus === 'all'
                ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            All Foods
          </button>
          <button
            onClick={() => setFilterStatus('halal')}
            className={`flex-1 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              filterStatus === 'halal'
                ? 'bg-white dark:bg-stone-700 text-emerald-800 dark:text-emerald-400 shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            Halal
          </button>
          <button
            onClick={() => setFilterStatus('mushbooh')}
            className={`flex-1 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              filterStatus === 'mushbooh'
                ? 'bg-white dark:bg-stone-700 text-amber-800 dark:text-amber-400 shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            Mushbooh
          </button>
          <button
            onClick={() => setFilterStatus('haram')}
            className={`flex-1 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              filterStatus === 'haram'
                ? 'bg-white dark:bg-stone-700 text-rose-800 dark:text-rose-400 shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            Haram
          </button>
        </div>
      </div>

      {/* Product List Grid */}
      <div className="p-5 divide-y divide-stone-100 dark:divide-stone-800">
        {filteredProducts.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-stone-500 dark:text-stone-400 text-sm">No food products match this filter.</p>
            <p className="text-stone-400 dark:text-stone-500 text-xs mt-1">Try speaking or typing another keyword, or scan the barcode directly.</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {filteredProducts.map((item) => (
              <div
                key={item.barcode}
                onClick={() => onSelectProduct(item.barcode)}
                className="p-3.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-850 hover:border-emerald-600 dark:hover:border-emerald-500 hover:bg-emerald-50/20 dark:hover:bg-stone-800 transition-all cursor-pointer flex gap-3.5 items-start group shadow-xs"
              >
                {/* Image */}
                <div className="w-16 h-16 rounded-lg bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 shrink-0 overflow-hidden flex items-center justify-center p-1">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <span className="text-[10px] text-stone-400">Photo</span>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-xs font-bold text-stone-900 dark:text-white truncate group-hover:text-emerald-900 dark:group-hover:text-emerald-300">
                      {item.name}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                        item.status === 'HALAL' || item.status === 'HALAL_CERTIFIED'
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                          : item.status === 'HARAM'
                          ? 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300'
                          : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                      }`}
                    >
                      {item.status === 'HALAL_CERTIFIED' ? 'HALAL CERT' : item.status}
                    </span>
                  </div>

                  <p className="text-[11px] text-stone-500 dark:text-stone-400 truncate">
                    {item.brand} · {item.category}
                  </p>

                  <div className="flex items-center justify-between mt-2 pt-1 text-[11px] text-stone-400 dark:text-stone-500 font-mono-numbers">
                    <span>UPC: {item.barcode}</span>
                    <span className="text-emerald-700 dark:text-emerald-400 font-medium group-hover:underline">
                      Inspect Details →
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

