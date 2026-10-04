import React from 'react';
import { X, BookOpen, Scale, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface DietaryGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DietaryGuideModal: React.FC<DietaryGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 dark:bg-black/80 backdrop-blur-xs">
      <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
            <h3 className="text-lg font-bold text-stone-900 dark:text-white font-display">
              Islamic Dietary Laws & Halal Guidelines
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs sm:text-sm text-stone-700 dark:text-stone-300 leading-relaxed">
          {/* Section 1: The Quranic Foundations */}
          <div className="p-4 bg-emerald-50/70 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/80 rounded-xl">
            <h4 className="font-bold text-emerald-950 dark:text-emerald-200 text-sm mb-1 flex items-center gap-1.5">
              <span>Quranic Principle (Surah Al-Baqarah 2:173)</span>
            </h4>
            <p className="italic text-emerald-900 dark:text-emerald-300 mb-2">
              "He has only forbidden you carrion, blood, the flesh of swine, and that which has been dedicated to other than Allah."
            </p>
            <p className="text-emerald-950 dark:text-emerald-200 text-xs">
              Everything in food is permissible by default (Al-Asl fi al-ashya' al-ibahah) unless explicit textual evidence or authentic Islamic jurisprudence confirms harm, intoxication, or forbidden animal sources.
            </p>
          </div>

          {/* Section 2: Key Verification Categories */}
          <div>
            <h4 className="font-bold text-stone-900 dark:text-white text-sm mb-2">Critical Food Additives to Watch</h4>
            <div className="grid gap-2.5 sm:grid-cols-2">
              <div className="p-3 bg-stone-50 dark:bg-stone-800/80 rounded-xl border border-stone-200 dark:border-stone-700">
                <span className="font-bold text-stone-900 dark:text-white block mb-0.5">1. Gelatin (E441)</span>
                <p className="text-xs text-stone-600 dark:text-stone-300">
                  Almost all standard gelatin in Western candies, yogurts, and marshmallows is derived from pig skin or non-zabiha cattle. Permissible only if certified bovine halal or fish gelatin.
                </p>
              </div>

              <div className="p-3 bg-stone-50 dark:bg-stone-800/80 rounded-xl border border-stone-200 dark:border-stone-700">
                <span className="font-bold text-stone-900 dark:text-white block mb-0.5">2. Mono- & Diglycerides (E471)</span>
                <p className="text-xs text-stone-600 dark:text-stone-300">
                  Emulsifier produced from plant oils or pork/beef fat. Marked Mushbooh unless packaging says "100% Vegetable" or carries a Halal seal.
                </p>
              </div>

              <div className="p-3 bg-stone-50 dark:bg-stone-800/80 rounded-xl border border-stone-200 dark:border-stone-700">
                <span className="font-bold text-stone-900 dark:text-white block mb-0.5">3. Carmine / Cochineal (E120)</span>
                <p className="text-xs text-stone-600 dark:text-stone-300">
                  Red dye extracted by crushing insects. Strictly Haram in Hanafi fiqh and rejected by the vast majority of global Halal certifiers.
                </p>
              </div>

              <div className="p-3 bg-stone-50 dark:bg-stone-800/80 rounded-xl border border-stone-200 dark:border-stone-700">
                <span className="font-bold text-stone-900 dark:text-white block mb-0.5">4. Rennet in Cheeses</span>
                <p className="text-xs text-stone-600 dark:text-stone-300">
                  Cheese enzyme extracted from calf stomachs. If labeled "microbial rennet", "vegetable enzymes", or "vegetarian", it is Halal.
                </p>
              </div>
            </div>
          </div>

          {/* Section 3: Intoxicants vs Vinegar */}
          <div>
            <h4 className="font-bold text-stone-900 dark:text-white text-sm mb-1">Alcohol vs. Spirit Vinegar</h4>
            <p className="text-stone-600 dark:text-stone-300 text-xs leading-relaxed">
              Added alcoholic drinks (wine, beer, rum, liqueurs, mirin) are forbidden. However, spirit vinegar, white distilled vinegar, and apple cider vinegar undergo full biochemical transformation (Istihalah) turning ethanol into acetic acid, which the Prophet Muhammad ﷺ explicitly praised: <em>"What an excellent condiment vinegar is." (Sahih Muslim)</em>
            </p>
          </div>

          {/* Section 4: Halal & Tayyib */}
          <div className="p-4 bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 rounded-xl">
            <h4 className="font-bold text-stone-900 dark:text-white text-sm mb-1">
              Halal and Tayyib (Wholesome)
            </h4>
            <p className="text-stone-600 dark:text-stone-300 text-xs leading-relaxed">
              Islam encourages not only that food be technically permissible (Halal), but also <em>Tayyib</em> — clean, nutritious, ethically sourced, and free from harmful toxins or exploitation.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-stone-100 dark:border-stone-800 bg-stone-50 dark:bg-stone-850 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs sm:text-sm font-semibold text-white bg-stone-900 hover:bg-stone-800 dark:bg-emerald-700 dark:hover:bg-emerald-600 rounded-xl transition-colors cursor-pointer"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
