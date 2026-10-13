import React, { useState, useEffect, useId } from 'react';
import {
  Award,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';

export interface HalalScoreCircularIndicatorProps {
  score: number; // 0 to 100
  status: 'HALAL' | 'HARAM' | 'MUSHBOOH' | 'HALAL_CERTIFIED' | string;
  size?: 'sm' | 'md' | 'lg' | 'hero';
  showLabel?: boolean;
  showDecisionPill?: boolean;
  showDecisionDescription?: boolean;
  showIcon?: boolean;
  animated?: boolean;
  className?: string;
  onClick?: () => void;
}

export function HalalScoreCircularIndicator({
  score,
  status,
  size = 'md',
  showLabel = true,
  showDecisionPill = false,
  showDecisionDescription = false,
  showIcon = true,
  animated = true,
  className = '',
  onClick,
}: HalalScoreCircularIndicatorProps) {
  const gradientId = useId().replace(/:/g, '_');
  const safeScore = Math.min(100, Math.max(0, Math.round(score)));

  // Smooth numeric counter animation
  const [displayNumber, setDisplayNumber] = useState<number>(animated ? 0 : safeScore);
  const [fillPercent, setFillPercent] = useState<number>(animated ? 0 : safeScore);

  useEffect(() => {
    if (!animated) {
      setDisplayNumber(safeScore);
      setFillPercent(safeScore);
      return;
    }

    // Reset and animate
    setFillPercent(0);
    const startTimer = setTimeout(() => {
      setFillPercent(safeScore);

      const duration = 850;
      const startTime = performance.now();
      const startVal = 0;

      const step = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(1, elapsed / duration);
        // easeOutCubic
        const ease = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(startVal + (safeScore - startVal) * ease);
        setDisplayNumber(current);

        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          setDisplayNumber(safeScore);
        }
      };

      requestAnimationFrame(step);
    }, 60);

    return () => clearTimeout(startTimer);
  }, [safeScore, animated]);

  // Determine theme according to status & score
  const isHaram = status === 'HARAM' || safeScore < 25;
  const isMushbooh = status === 'MUSHBOOH' || (safeScore >= 25 && safeScore < 65);
  const isCertified = status === 'HALAL_CERTIFIED' || safeScore >= 90;
  const isHalal = !isHaram && !isMushbooh;

  let theme = {
    gradientStart: '#10b981', // emerald-500
    gradientEnd: '#059669', // emerald-600
    trackColor: 'rgba(16, 185, 129, 0.12)',
    trackBorder: 'border-emerald-200 dark:border-emerald-800/60',
    glowColor: 'shadow-emerald-500/15',
    textColor: 'text-emerald-700 dark:text-emerald-400',
    numberColor: 'text-emerald-800 dark:text-emerald-200',
    subtextColor: 'text-emerald-600/80 dark:text-emerald-400/80',
    pillBg: 'bg-emerald-100/90 text-emerald-800 border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-800',
    badgeText: isCertified ? 'HALAL CERTIFIED' : 'SAFE TO CONSUME',
    quickDecision: isCertified
      ? 'Officially certified Halal & audited by recognized authority'
      : 'Permissible pure ingredients with zero forbidden additives',
    icon: isCertified ? Award : CheckCircle2,
  };

  if (isHaram) {
    theme = {
      gradientStart: '#f43f5e', // rose-500
      gradientEnd: '#be123c', // rose-700
      trackColor: 'rgba(244, 63, 94, 0.14)',
      trackBorder: 'border-rose-200 dark:border-rose-900/60',
      glowColor: 'shadow-rose-500/20',
      textColor: 'text-rose-700 dark:text-rose-400',
      numberColor: 'text-rose-800 dark:text-rose-200',
      subtextColor: 'text-rose-600/80 dark:text-rose-400/80',
      pillBg: 'bg-rose-100/90 text-rose-800 border-rose-300 dark:bg-rose-950/80 dark:text-rose-300 dark:border-rose-800',
      badgeText: 'STRICTLY AVOID (HARAM)',
      quickDecision: 'Contains verified non-halal ingredients (pork, non-zabiha meat, or alcohol)',
      icon: XCircle,
    };
  } else if (isMushbooh) {
    theme = {
      gradientStart: '#f59e0b', // amber-500
      gradientEnd: '#d97706', // amber-600
      trackColor: 'rgba(245, 158, 11, 0.14)',
      trackBorder: 'border-amber-200 dark:border-amber-900/60',
      glowColor: 'shadow-amber-500/15',
      textColor: 'text-amber-700 dark:text-amber-400',
      numberColor: 'text-amber-800 dark:text-amber-200',
      subtextColor: 'text-amber-600/80 dark:text-amber-400/80',
      pillBg: 'bg-amber-100/90 text-amber-800 border-amber-300 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-800',
      badgeText: 'DOUBTFUL (MUSHBOOH)',
      quickDecision: 'Questionable additive origin (e.g. emulsifiers, enzymes) requires verification',
      icon: AlertTriangle,
    };
  } else if (!isCertified && safeScore < 85) {
    theme = {
      gradientStart: '#14b8a6', // teal-500
      gradientEnd: '#0f766e', // teal-700
      trackColor: 'rgba(20, 184, 166, 0.12)',
      trackBorder: 'border-teal-200 dark:border-teal-800/60',
      glowColor: 'shadow-teal-500/15',
      textColor: 'text-teal-700 dark:text-teal-400',
      numberColor: 'text-teal-800 dark:text-teal-200',
      subtextColor: 'text-teal-600/80 dark:text-teal-400/80',
      pillBg: 'bg-teal-100/90 text-teal-800 border-teal-300 dark:bg-teal-950/80 dark:text-teal-300 dark:border-teal-800',
      badgeText: 'PERMISSIBLE INGREDIENTS',
      quickDecision: 'Naturally Halal composition without animal-derived risks',
      icon: CheckCircle2,
    };
  }

  const IconComponent = theme.icon;

  // Size geometry definitions
  const sizeMap = {
    sm: {
      dimension: 54,
      strokeWidth: 4.5,
      radius: 22,
      center: 27,
      fontSize: 'text-base font-bold',
      subtextSize: 'text-[8px]',
      iconSize: 'w-2.5 h-2.5',
      padding: 'p-1',
    },
    md: {
      dimension: 76,
      strokeWidth: 6,
      radius: 31,
      center: 38,
      fontSize: 'text-2xl font-black',
      subtextSize: 'text-[9px] font-bold tracking-wider',
      iconSize: 'w-3.5 h-3.5',
      padding: 'p-1.5',
    },
    lg: {
      dimension: 98,
      strokeWidth: 7.5,
      radius: 40,
      center: 49,
      fontSize: 'text-3xl font-black',
      subtextSize: 'text-[10px] font-bold tracking-wider',
      iconSize: 'w-4 h-4',
      padding: 'p-2',
    },
    hero: {
      dimension: 120,
      strokeWidth: 9,
      radius: 49,
      center: 60,
      fontSize: 'text-4xl font-black',
      subtextSize: 'text-xs font-bold tracking-wider',
      iconSize: 'w-5 h-5',
      padding: 'p-2.5',
    },
  };

  const currentSize = sizeMap[size];
  const circumference = 2 * Math.PI * currentSize.radius;
  const strokeDashoffset = circumference - (fillPercent / 100) * circumference;

  return (
    <div
      className={`inline-flex flex-col items-center select-none ${className}`}
      onClick={onClick}
      role="progressbar"
      aria-valuenow={safeScore}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Halal Score: ${safeScore} out of 100 (${theme.badgeText})`}
    >
      {/* Circular Progress Gauge Container */}
      <div
        className={`relative flex items-center justify-center rounded-full bg-white/80 dark:bg-stone-900/80 backdrop-blur-xs shadow-xs ${theme.glowColor} transition-transform active:scale-95`}
        style={{
          width: currentSize.dimension,
          height: currentSize.dimension,
        }}
      >
        <svg
          width={currentSize.dimension}
          height={currentSize.dimension}
          className="transform -rotate-90 block"
          viewBox={`0 0 ${currentSize.dimension} ${currentSize.dimension}`}
        >
          <defs>
            <linearGradient id={`grad_${gradientId}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={theme.gradientStart} />
              <stop offset="100%" stopColor={theme.gradientEnd} />
            </linearGradient>
            <filter id={`shadow_${gradientId}`} x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor={theme.gradientStart} floodOpacity="0.3" />
            </filter>
          </defs>

          {/* Background Track Circle */}
          <circle
            cx={currentSize.center}
            cy={currentSize.center}
            r={currentSize.radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={currentSize.strokeWidth}
            className="text-stone-200/80 dark:text-stone-800"
          />

          {/* Active Progress Circle */}
          <circle
            cx={currentSize.center}
            cy={currentSize.center}
            r={currentSize.radius}
            fill="none"
            stroke={`url(#grad_${gradientId})`}
            strokeWidth={currentSize.strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
            filter={`url(#shadow_${gradientId})`}
          />
        </svg>

        {/* Center Content: Score Number, Micro Icon & Label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
          {showIcon && size !== 'sm' && (
            <div className={`mb-0.5 ${theme.textColor}`}>
              <IconComponent className={currentSize.iconSize} />
            </div>
          )}

          <div className="flex items-baseline justify-center leading-none">
            <span
              className={`${currentSize.fontSize} font-mono-numbers font-extrabold tracking-tight ${theme.numberColor}`}
            >
              {displayNumber}
            </span>
            {size !== 'sm' && (
              <span className="text-[10px] font-bold text-stone-400 dark:text-stone-500 ml-0.5 font-mono">
                /100
              </span>
            )}
          </div>

          {showLabel && size !== 'sm' && (
            <span
              className={`uppercase ${currentSize.subtextSize} ${theme.subtextColor} font-semibold mt-0.5 leading-none`}
            >
              Halal Score
            </span>
          )}
        </div>
      </div>

      {/* Optional Decision Pill */}
      {showDecisionPill && (
        <div className="mt-2 text-center">
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider border shadow-xs ${theme.pillBg}`}
          >
            <IconComponent className="w-3 h-3 shrink-0" />
            <span>{theme.badgeText}</span>
          </span>
          {showDecisionDescription && (
            <p className="text-xs text-stone-600 dark:text-stone-300 mt-1 max-w-xs leading-snug">
              {theme.quickDecision}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
