import React, { useState } from 'react';
import { Globe, MapPin, ShieldCheck, ChevronDown, ChevronUp, Check } from 'lucide-react';
import {
  REGIONAL_STANDARDS,
  RegionalStandardId,
  DetectedRegionState,
} from '../data/regionalStandards.ts';

interface RegionalStandardBarProps {
  regionState: DetectedRegionState;
  onSelectRegion: (standardId: RegionalStandardId) => void;
  onAutoDetectCountry: () => void;
}

export const RegionalStandardBar: React.FC<RegionalStandardBarProps> = ({
  regionState,
  onSelectRegion,
  onAutoDetectCountry,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const currentProfile =
    REGIONAL_STANDARDS[regionState.standardId] || REGIONAL_STANDARDS.NA_HMA;

  return (
    <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 overflow-hidden shadow-xs">
      <div className="p-3.5 sm:p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800/80 flex items-center justify-center text-lg shrink-0">
            <span>{currentProfile.flag}</span>
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                Regional Halal Standard:
              </span>
              <span className="text-xs sm:text-sm font-bold text-stone-900 dark:text-white font-display">
                {currentProfile.authorityFull}
              </span>
              <span className="text-[11px] font-mono-numbers text-stone-500 dark:text-stone-400">
                ({currentProfile.standardCode})
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400 mt-0.5 flex-wrap">
              <span className="inline-flex items-center gap-1">
                <MapPin className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                <span>
                  {regionState.isAutoDetected
                    ? `Auto-detected region: ${regionState.detectedCountryName}`
                    : `Selected region: ${currentProfile.countryName}`}
                </span>
              </span>
              <span>·</span>
              <span>Madhhab focus: {currentProfile.primaryMadhhab}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Region Selector Dropdown */}
          <div className="relative">
            <select
              aria-label="Select regional Halal certification standard"
              value={regionState.standardId}
              onChange={(e) => onSelectRegion(e.target.value as RegionalStandardId)}
              className="h-9 pl-3 pr-8 text-xs font-semibold bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-600 cursor-pointer"
            >
              {Object.values(REGIONAL_STANDARDS).map((std) => (
                <option key={std.id} value={std.id}>
                  {std.flag} {std.regionLabel} — {std.standardCode}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={onAutoDetectCountry}
            className="h-9 px-3 text-xs font-medium text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800 rounded-xl transition-colors inline-flex items-center gap-1.5 cursor-pointer"
            title="Auto-detect my country and certification authority from browser timezone and locale"
          >
            <Globe className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Auto-Detect</span>
          </button>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-9 px-2.5 text-xs font-medium text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl transition-colors inline-flex items-center gap-1 cursor-pointer"
          >
            <span>Criteria</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Expandable Regional Certification Criteria Comparison Panel */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-3 bg-stone-50/70 dark:bg-stone-900/60 border-t border-stone-100 dark:border-stone-800 space-y-3 text-xs">
          <p className="text-stone-600 dark:text-stone-300 leading-relaxed">
            {currentProfile.description}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div className="p-2.5 rounded-xl bg-white dark:bg-stone-800 border border-stone-200/80 dark:border-stone-700">
              <div className="text-[11px] text-stone-500 dark:text-stone-400">
                Carmine (E120) Ruling
              </div>
              <div
                className={`text-xs font-bold mt-0.5 ${
                  currentProfile.carmineE120Ruling === 'HALAL'
                    ? 'text-emerald-700 dark:text-emerald-400'
                    : currentProfile.carmineE120Ruling === 'HARAM'
                    ? 'text-rose-700 dark:text-rose-400'
                    : 'text-amber-700 dark:text-amber-400'
                }`}
              >
                {currentProfile.carmineE120Ruling} under {currentProfile.authorityShort}
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-white dark:bg-stone-800 border border-stone-200/80 dark:border-stone-700">
              <div className="text-[11px] text-stone-500 dark:text-stone-400">
                Max Trace Flavor Ethanol
              </div>
              <div className="text-xs font-bold font-mono-numbers text-stone-900 dark:text-white mt-0.5">
                ≤ {currentProfile.ethanolLimitPercent}% ({currentProfile.standardCode})
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-white dark:bg-stone-800 border border-stone-200/80 dark:border-stone-700">
              <div className="text-[11px] text-stone-500 dark:text-stone-400">
                Slaughter & Dairy Rule
              </div>
              <div className="text-xs font-bold text-stone-900 dark:text-white mt-0.5">
                {currentProfile.requiresHandSlaughterNonStunned
                  ? 'Hand-Slaughtered Non-Stunned Required'
                  : currentProfile.requiresExplicitCertForDairyWhey
                  ? 'Cert Required for Whey / Rennet / E471'
                  : 'Accredited Halal Certifier Accepted'}
              </div>
            </div>
          </div>

          <div className="space-y-1.5 pt-1">
            <div className="font-semibold text-stone-800 dark:text-stone-200 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Active {currentProfile.authorityShort} Verification Rules:</span>
            </div>
            <ul className="space-y-1 text-stone-600 dark:text-stone-300">
              {currentProfile.keyCriteria.map((rule, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span>{rule}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
