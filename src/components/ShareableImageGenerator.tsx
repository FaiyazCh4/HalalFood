import React, { useState, useEffect, useRef } from 'react';
import {
  Download,
  Share2,
  Copy,
  Check,
  X,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  XCircle,
  Award,
  Layers,
  Palette,
  Eye,
  Camera,
  RefreshCw,
  Sliders,
  Type
} from 'lucide-react';
import QRCode from 'qrcode';

export interface ShareableImageGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  product: {
    code: string;
    product_name: string;
    brands?: string;
    categories?: string;
    ingredients_text?: string;
    image_url?: string;
  };
  evaluation: {
    status: 'HALAL' | 'HALAL_CERTIFIED' | 'MUSHBOOH' | 'HARAM' | string;
    confidenceScore?: number;
    summary: string;
    isHalalCertified?: boolean;
    certificationAuthority?: string;
    criticalIngredients?: Array<{
      name: string;
      status: 'HALAL' | 'HARAM' | 'MUSHBOOH';
      reason: string;
      source?: string;
    }>;
  };
  deepLink?: string;
}

export type AspectRatioType = 'square' | 'story' | 'landscape';
export type ThemeStyle = 'modern' | 'minimal' | 'bold' | 'dark';

export const ShareableImageGenerator: React.FC<ShareableImageGeneratorProps> = ({
  isOpen,
  onClose,
  product,
  evaluation,
  deepLink,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [aspectRatio, setAspectRatio] = useState<AspectRatioType>('square'); // 1:1 Instagram Post (1080x1080)
  const [themeStyle, setThemeStyle] = useState<ThemeStyle>('modern');
  const [showCriticalIngredients, setShowCriticalIngredients] = useState<boolean>(true);
  const [showQrCode, setShowQrCode] = useState<boolean>(true);
  const [showProductThumb, setShowProductThumb] = useState<boolean>(true);
  const [customCommunityWarning, setCustomCommunityWarning] = useState<string>('');
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [copiedImage, setCopiedImage] = useState<boolean>(false);
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);

  // Status configuration
  const isCertified = evaluation.status === 'HALAL_CERTIFIED' || evaluation.isHalalCertified;
  const isHaram = evaluation.status === 'HARAM';
  const isMushbooh = evaluation.status === 'MUSHBOOH';
  const isHalal = evaluation.status === 'HALAL' || isCertified;

  const statusTitle = isHaram
    ? 'HARAM (PROHIBITED)'
    : isMushbooh
    ? 'MUSHBOOH (DOUBTFUL)'
    : isCertified
    ? 'HALAL CERTIFIED'
    : 'HALAL (PERMISSIBLE)';

  const statusSubtext = isHaram
    ? 'COMMUNITY ADVISORY: Contains prohibited ingredients under Islamic Law'
    : isMushbooh
    ? 'COMMUNITY NOTICE: Unverified source / ambiguous critical ingredients'
    : isCertified
    ? 'VERIFIED: Officially audited & certified Halal'
    : 'PERMISSIBLE: Pure ingredients with no illicit additives detected';

  const confidence = evaluation.confidenceScore ?? 85;

  // Dimensions based on aspect ratio
  const getDimensions = (): { width: number; height: number } => {
    switch (aspectRatio) {
      case 'story':
        return { width: 1080, height: 1920 }; // 9:16 Instagram Story / TikTok / WhatsApp Status
      case 'landscape':
        return { width: 1200, height: 630 }; // Twitter / Facebook / LinkedIn Card
      case 'square':
      default:
        return { width: 1080, height: 1080 }; // 1:1 Instagram / WhatsApp Post
    }
  };

  // Render to canvas
  const renderCardToCanvas = async () => {
    if (!isOpen) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsGenerating(true);
    const { width, height } = getDimensions();
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setIsGenerating(false);
      return;
    }

    // Colors based on Status & Theme
    const statusColor = isHaram ? '#e11d48' : isMushbooh ? '#d97706' : '#059669';
    const statusDarkColor = isHaram ? '#9f1239' : isMushbooh ? '#92400e' : '#065f46';
    const statusLightColor = isHaram ? '#ffe4e6' : isMushbooh ? '#fef3c7' : '#d1fae5';

    let bgColor = '#ffffff';
    let cardBg = '#f8fafc';
    let textColor = '#0f172a';
    let textMuted = '#64748b';
    let borderLineColor = '#e2e8f0';

    if (themeStyle === 'dark') {
      bgColor = '#09090b';
      cardBg = '#18181b';
      textColor = '#fafafa';
      textMuted = '#a1a1aa';
      borderLineColor = '#27272a';
    } else if (themeStyle === 'bold') {
      bgColor = isHaram ? '#fff1f2' : isMushbooh ? '#fffbeb' : '#ecfdf5';
      cardBg = '#ffffff';
      borderLineColor = isHaram ? '#fecdd3' : isMushbooh ? '#fde68a' : '#a7f3d0';
    } else if (themeStyle === 'minimal') {
      bgColor = '#fafafa';
      cardBg = '#ffffff';
      borderLineColor = '#f4f4f5';
    }

    // 1. Background fill
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);

    // Decorative top gradient accent bar or frame
    const topBarHeight = aspectRatio === 'story' ? 24 : 16;
    ctx.fillStyle = statusColor;
    ctx.fillRect(0, 0, width, topBarHeight);

    // If bold/modern, subtle background radial glow behind the verdict
    if (themeStyle === 'modern' || themeStyle === 'bold') {
      const radialGlow = ctx.createRadialGradient(
        width / 2,
        height * 0.28,
        50,
        width / 2,
        height * 0.28,
        width * 0.7
      );
      radialGlow.addColorStop(0, isHaram ? 'rgba(225,29,72,0.08)' : isMushbooh ? 'rgba(217,119,6,0.08)' : 'rgba(5,150,105,0.08)');
      radialGlow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = radialGlow;
      ctx.fillRect(0, 0, width, height);
    }

    // Outer margin
    const margin = aspectRatio === 'story' ? 70 : aspectRatio === 'landscape' ? 55 : 60;
    const contentW = width - margin * 2;

    // 2. Top Header Brand Pill: "HALALCHECK COMMUNITY ADVISORY"
    let cursorY = aspectRatio === 'story' ? 110 : 70;

    // Header container with Logo / App identifier
    ctx.fillStyle = textMuted;
    ctx.font = 'bold 20px "Inter", "Helvetica Neue", Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('HALALCHECK · ISLAMIC DIETARY VERIFICATION', margin, cursorY);

    // Date & Timestamp in top right
    ctx.textAlign = 'right';
    const todayStr = new Date().toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    ctx.fillText(todayStr, width - margin, cursorY);

    cursorY += 40;

    // 3. Huge Status Banner Box (High impact warning / confirmation)
    const bannerHeight = aspectRatio === 'landscape' ? 140 : 170;
    
    // Draw Status Banner Background with rounded rectangle
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(margin, cursorY, contentW, bannerHeight, 28);
    ctx.fillStyle = statusColor;
    ctx.fill();

    // Subtle gloss overlay
    const bannerGradient = ctx.createLinearGradient(margin, cursorY, margin + contentW, cursorY + bannerHeight);
    bannerGradient.addColorStop(0, statusDarkColor);
    bannerGradient.addColorStop(1, statusColor);
    ctx.fillStyle = bannerGradient;
    ctx.fill();

    // Banner Text
    ctx.textAlign = 'center';
    
    // Status Badge Sub-label
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.font = 'bold 18px "Inter", sans-serif';
    ctx.letterSpacing = '2px';
    ctx.fillText(
      isHaram ? '⚠️  COMMUNITY DIETARY ALERT' : isMushbooh ? '❓  HALAL CAUTION ADVISORY' : '✅  HALAL VERIFIED',
      width / 2,
      cursorY + 44
    );

    // Primary Big Status Text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 54px "Outfit", "Inter", "Helvetica Neue", sans-serif';
    ctx.letterSpacing = '1px';
    ctx.fillText(statusTitle, width / 2, cursorY + 104);

    // Confidence and subtext under the title
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.font = '600 20px "JetBrains Mono", monospace';
    ctx.fillText(
      `Halal Confidence: ${confidence}%  ·  ${isCertified ? 'Official Certification Audit' : 'Algorithmic Ingredient Scan'}`,
      width / 2,
      cursorY + 142
    );
    ctx.restore();

    cursorY += bannerHeight + (aspectRatio === 'story' ? 50 : 35);

    // 4. Product Details Card
    const productBoxH = aspectRatio === 'landscape' ? 140 : aspectRatio === 'story' ? 240 : 180;
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(margin, cursorY, contentW, productBoxH, 24);
    ctx.fillStyle = cardBg;
    ctx.fill();
    ctx.strokeStyle = borderLineColor;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Check if we should load and draw product thumbnail
    let thumbDrawn = false;
    let thumbWidth = 0;
    if (showProductThumb && product.image_url) {
      try {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        await new Promise<void>((resolve) => {
          img.onload = () => {
            const size = productBoxH - 32;
            const x = margin + 16;
            const y = cursorY + 16;
            ctx.save();
            ctx.beginPath();
            ctx.roundRect(x, y, size, size, 16);
            ctx.clip();
            ctx.drawImage(img, x, y, size, size);
            ctx.restore();
            thumbDrawn = true;
            thumbWidth = size + 20;
            resolve();
          };
          img.onerror = () => resolve();
          img.src = product.image_url!;
        });
      } catch {
        // Fallback gracefully without thumbnail
      }
    }

    const textStartX = margin + 24 + thumbWidth;
    const textMaxW = contentW - 48 - thumbWidth;

    // Product Title
    ctx.fillStyle = textColor;
    ctx.font = 'bold 36px "Outfit", "Inter", sans-serif';
    ctx.textAlign = 'left';
    
    // Truncate long product names
    let displayName = product.product_name;
    if (ctx.measureText(displayName).width > textMaxW) {
      while (displayName.length > 5 && ctx.measureText(displayName + '…').width > textMaxW) {
        displayName = displayName.slice(0, -1);
      }
      displayName += '…';
    }
    ctx.fillText(displayName, textStartX, cursorY + 52);

    // Brand & Barcode
    ctx.fillStyle = textMuted;
    ctx.font = '500 22px "Inter", sans-serif';
    const brandStr = product.brands ? `Brand: ${product.brands}` : 'Brand: Unspecified';
    const barcodeStr = `UPC: ${product.code}`;
    ctx.fillText(`${brandStr}   ·   ${barcodeStr}`, textStartX, cursorY + 92);

    // Summary line
    ctx.fillStyle = textColor;
    ctx.font = '400 20px "Inter", sans-serif';
    let summaryText = evaluation.summary;
    if (summaryText.length > 85) {
      summaryText = summaryText.slice(0, 85) + '…';
    }
    ctx.fillText(summaryText, textStartX, cursorY + 134);

    if (aspectRatio === 'story' && evaluation.certificationAuthority) {
      ctx.fillStyle = statusDarkColor;
      ctx.font = '600 18px "Inter", sans-serif';
      ctx.fillText(`Audited By: ${evaluation.certificationAuthority}`, textStartX, cursorY + 180);
    }

    ctx.restore();
    cursorY += productBoxH + (aspectRatio === 'story' ? 40 : 25);

    // 5. Critical Ingredients Breakdown or Notice
    const criticals = evaluation.criticalIngredients || [];
    if (showCriticalIngredients && criticals.length > 0) {
      const sectionHeight = aspectRatio === 'story' ? 360 : aspectRatio === 'landscape' ? 120 : 200;
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(margin, cursorY, contentW, sectionHeight, 20);
      ctx.fillStyle = isHaram ? 'rgba(225,29,72,0.05)' : isMushbooh ? 'rgba(217,119,6,0.05)' : 'rgba(5,150,105,0.05)';
      ctx.fill();
      ctx.strokeStyle = borderLineColor;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Title
      ctx.fillStyle = statusDarkColor;
      ctx.font = 'bold 22px "Inter", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(
        isHaram
          ? '🚨 Critical Prohibited (Haram) Ingredients Flagged:'
          : isMushbooh
          ? '⚠️ Critical Doubtful (Mushbooh) Ingredients Flagged:'
          : '🌿 Key Halal Ingredients Audited:',
        margin + 24,
        cursorY + 38
      );

      // List the critical items
      const itemsToDisplay = aspectRatio === 'landscape' ? criticals.slice(0, 2) : criticals.slice(0, 3);
      let ingY = cursorY + 76;
      itemsToDisplay.forEach((item) => {
        // Dot indicator
        ctx.fillStyle = item.status === 'HARAM' ? '#e11d48' : item.status === 'MUSHBOOH' ? '#d97706' : '#059669';
        ctx.beginPath();
        ctx.arc(margin + 34, ingY - 6, 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = textColor;
        ctx.font = 'bold 20px "Inter", sans-serif';
        ctx.fillText(item.name, margin + 50, ingY);

        ctx.fillStyle = textMuted;
        ctx.font = '400 18px "Inter", sans-serif';
        const reasonStr = item.reason.length > 55 ? item.reason.slice(0, 55) + '…' : item.reason;
        ctx.fillText(`—  ${reasonStr}`, margin + 54 + ctx.measureText(item.name).width + 12, ingY);

        ingY += 38;
      });

      if (criticals.length > itemsToDisplay.length) {
        ctx.fillStyle = textMuted;
        ctx.font = 'italic 16px "Inter", sans-serif';
        ctx.fillText(`+ ${criticals.length - itemsToDisplay.length} more ingredients assessed in full report`, margin + 34, ingY);
      }

      ctx.restore();
      cursorY += sectionHeight + (aspectRatio === 'story' ? 40 : 25);
    } else if (showCriticalIngredients && isHalal) {
      // Halal assurance banner when no critical ingredients
      const sectionHeight = aspectRatio === 'landscape' ? 80 : 100;
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(margin, cursorY, contentW, sectionHeight, 20);
      ctx.fillStyle = 'rgba(5,150,105,0.06)';
      ctx.fill();
      ctx.strokeStyle = '#a7f3d0';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = '#065f46';
      ctx.font = 'bold 22px "Inter", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('✨ No Prohibited Pork, Alcohol, or Doubtful Animal Fats Detected', margin + 24, cursorY + 40);

      ctx.font = '400 18px "Inter", sans-serif';
      ctx.fillStyle = '#047857';
      ctx.fillText('Ingredients evaluated against global Halal jurisprudence benchmarks (JAKIM, MUI, GSO).', margin + 24, cursorY + 70);

      ctx.restore();
      cursorY += sectionHeight + (aspectRatio === 'story' ? 40 : 25);
    }

    // 6. Custom Community Warning / Message (if specified by user)
    if (customCommunityWarning.trim()) {
      const customBoxH = 80;
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(margin, cursorY, contentW, customBoxH, 16);
      ctx.fillStyle = '#fef2f2';
      ctx.fill();
      ctx.strokeStyle = '#fca5a5';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = '#991b1b';
      ctx.font = 'bold 18px "Inter", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('💬 Note to Community:', margin + 20, cursorY + 30);

      ctx.font = '500 18px "Inter", sans-serif';
      ctx.fillStyle = '#7f1d1d';
      const userMsg = customCommunityWarning.length > 70 ? customCommunityWarning.slice(0, 70) + '…' : customCommunityWarning;
      ctx.fillText(`"${userMsg}"`, margin + 20, cursorY + 58);
      ctx.restore();

      cursorY += customBoxH + (aspectRatio === 'story' ? 40 : 20);
    }

    // 7. Footer Section with QR Code & Verification Call-To-Action
    // Position footer at bottom
    const footerH = aspectRatio === 'story' ? 260 : aspectRatio === 'landscape' ? 90 : 160;
    const footerY = height - margin - footerH;

    ctx.save();
    ctx.beginPath();
    ctx.roundRect(margin, footerY, contentW, footerH, 24);
    ctx.fillStyle = cardBg;
    ctx.fill();
    ctx.strokeStyle = borderLineColor;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Generate or draw QR code if enabled
    let qrRendered = false;
    if (showQrCode) {
      try {
        const qrSize = footerH - 30;
        const qrContent = deepLink || `https://halalcheck.org/scan?upc=${product.code}`;
        const qrDataUrl = await QRCode.toDataURL(qrContent, {
          width: qrSize * 2,
          margin: 1,
          color: {
            dark: statusDarkColor,
            light: '#ffffff',
          },
        });

        const qrImg = new Image();
        await new Promise<void>((resolve) => {
          qrImg.onload = () => {
            const qrX = margin + 18;
            const qrY = footerY + 15;
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.roundRect(qrX, qrY, qrSize, qrSize, 12);
            ctx.fill();
            ctx.drawImage(qrImg, qrX + 4, qrY + 4, qrSize - 8, qrSize - 8);
            qrRendered = true;
            resolve();
          };
          qrImg.onerror = () => resolve();
          qrImg.src = qrDataUrl;
        });
      } catch {
        // Continue without QR
      }
    }

    const footerTextX = showQrCode && qrRendered ? margin + footerH + 16 : margin + 28;
    ctx.textAlign = 'left';

    ctx.fillStyle = textColor;
    ctx.font = 'bold 24px "Outfit", "Inter", sans-serif';
    ctx.fillText('Scan to verify or inspect full ingredients report', footerTextX, footerY + (footerH * 0.38));

    ctx.fillStyle = textMuted;
    ctx.font = '400 18px "Inter", sans-serif';
    ctx.fillText('Powered by HalalCheck · Verified with Islamic Dietary Standards', footerTextX, footerY + (footerH * 0.65));

    // Community alert icon / tag
    ctx.textAlign = 'right';
    ctx.fillStyle = statusDarkColor;
    ctx.font = 'bold 18px "JetBrains Mono", monospace';
    ctx.fillText(
      isHaram ? '⛔ DO NOT CONSUME' : isMushbooh ? '⚠️ EXERCISE CAUTION' : '✨ VERIFIED HALAL',
      margin + contentW - 24,
      footerY + (footerH * 0.52)
    );

    ctx.restore();

    // Export canvas as high-res PNG
    const finalUrl = canvas.toDataURL('image/png', 1.0);
    setGeneratedImageUrl(finalUrl);
    setIsGenerating(false);
  };

  // Re-generate image whenever configuration or inputs change
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        renderCardToCanvas();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [
    isOpen,
    aspectRatio,
    themeStyle,
    showCriticalIngredients,
    showQrCode,
    showProductThumb,
    customCommunityWarning,
    product.code,
    product.product_name,
    evaluation.status,
  ]);

  if (!isOpen) return null;

  // Handlers for Download, Copy, Share
  const handleDownloadImage = () => {
    if (!generatedImageUrl) return;
    const link = document.createElement('a');
    const sanitizedTitle = (product.product_name || 'product')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .slice(0, 30);
    link.download = `halalcheck-${sanitizedTitle}-${evaluation.status.toLowerCase()}-${aspectRatio}.png`;
    link.href = generatedImageUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 2500);
  };

  const handleCopyImageToClipboard = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard && (window as any).ClipboardItem) {
        canvas.toBlob(async (blob) => {
          if (!blob) return;
          const item = new (window as any).ClipboardItem({ 'image/png': blob });
          await navigator.clipboard.write([item]);
          setCopiedImage(true);
          setTimeout(() => setCopiedImage(false), 2500);
        });
      }
    } catch {
      // Fallback
    }
  };

  const handleShareNative = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (typeof navigator !== 'undefined' && navigator.share && navigator.canShare) {
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], `halalcheck-${product.code}.png`, { type: 'image/png' });
        const shareData = {
          title: `HalalCheck: ${product.product_name} is ${evaluation.status}`,
          text: `Community advisory: ${product.product_name} is marked as ${evaluation.status}. Verify before consuming!`,
          files: [file],
        };

        if (navigator.canShare(shareData)) {
          try {
            await navigator.share(shareData);
          } catch (e: any) {
            if (e?.name !== 'AbortError') {
              handleDownloadImage();
            }
          }
        } else {
          handleDownloadImage();
        }
      });
    } else {
      handleDownloadImage();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-stone-950/75 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-stone-900 rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl border border-stone-200 dark:border-stone-800 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between bg-stone-50/70 dark:bg-stone-900/90">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-sm ${
                isHaram ? 'bg-rose-600' : isMushbooh ? 'bg-amber-600' : 'bg-emerald-600'
              }`}
            >
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-stone-900 dark:text-white font-display">
                  Shareable Halal Social Image Generator
                </h3>
                <span
                  className={`px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                    isHaram
                      ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                      : isMushbooh
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                  }`}
                >
                  {evaluation.status}
                </span>
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Generate clean, high-resolution social cards to inform family, friends, or WhatsApp groups
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Main Content: Split View (Controls + Live Preview) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Controls Column */}
          <div className="lg:col-span-5 space-y-5">
            {/* Aspect Ratio Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Card Aspect Ratio</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setAspectRatio('square')}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                    aspectRatio === 'square'
                      ? 'bg-emerald-50 dark:bg-emerald-950/80 border-emerald-500 text-emerald-900 dark:text-emerald-200 font-bold shadow-xs'
                      : 'bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-50'
                  }`}
                >
                  <div className="w-6 h-6 border-2 border-current rounded mx-auto mb-1 opacity-80" />
                  <div className="text-xs">Square (1:1)</div>
                  <div className="text-[10px] text-stone-400">Instagram / Feed</div>
                </button>

                <button
                  type="button"
                  onClick={() => setAspectRatio('story')}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                    aspectRatio === 'story'
                      ? 'bg-emerald-50 dark:bg-emerald-950/80 border-emerald-500 text-emerald-900 dark:text-emerald-200 font-bold shadow-xs'
                      : 'bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-50'
                  }`}
                >
                  <div className="w-4 h-7 border-2 border-current rounded mx-auto mb-1 opacity-80" />
                  <div className="text-xs">Story (9:16)</div>
                  <div className="text-[10px] text-stone-400">Status / Stories</div>
                </button>

                <button
                  type="button"
                  onClick={() => setAspectRatio('landscape')}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                    aspectRatio === 'landscape'
                      ? 'bg-emerald-50 dark:bg-emerald-950/80 border-emerald-500 text-emerald-900 dark:text-emerald-200 font-bold shadow-xs'
                      : 'bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-50'
                  }`}
                >
                  <div className="w-7 h-4.5 border-2 border-current rounded mx-auto mb-1 opacity-80 mt-1" />
                  <div className="text-xs">Card (1.9:1)</div>
                  <div className="text-[10px] text-stone-400">Twitter / Web</div>
                </button>
              </div>
            </div>

            {/* Theme / Visual Style */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400 flex items-center gap-1.5">
                <Palette className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Visual Styling Theme</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'modern', label: 'Clean Modern' },
                  { id: 'bold', label: 'High Alert Bold' },
                  { id: 'dark', label: 'Midnight Dark' },
                  { id: 'minimal', label: 'Subtle Minimal' },
                ].map((th) => (
                  <button
                    key={th.id}
                    type="button"
                    onClick={() => setThemeStyle(th.id as ThemeStyle)}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold text-left transition-all cursor-pointer ${
                      themeStyle === th.id
                        ? 'bg-emerald-50 dark:bg-emerald-950/80 border-emerald-500 text-emerald-900 dark:text-emerald-200 shadow-xs'
                        : 'bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-50'
                    }`}
                  >
                    {th.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Content Toggles */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400 flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Included Elements</span>
              </label>
              <div className="space-y-2 bg-stone-50 dark:bg-stone-800/60 p-3 rounded-2xl border border-stone-200 dark:border-stone-700">
                <label className="flex items-center justify-between text-xs text-stone-700 dark:text-stone-300 cursor-pointer">
                  <span>Flagged / Critical Ingredients Box</span>
                  <input
                    type="checkbox"
                    checked={showCriticalIngredients}
                    onChange={(e) => setShowCriticalIngredients(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 accent-emerald-600 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between text-xs text-stone-700 dark:text-stone-300 cursor-pointer">
                  <span>Product Photo Thumbnail</span>
                  <input
                    type="checkbox"
                    checked={showProductThumb}
                    onChange={(e) => setShowProductThumb(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 accent-emerald-600 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between text-xs text-stone-700 dark:text-stone-300 cursor-pointer">
                  <span>Verification Deep-Link QR Code</span>
                  <input
                    type="checkbox"
                    checked={showQrCode}
                    onChange={(e) => setShowQrCode(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 accent-emerald-600 cursor-pointer"
                  />
                </label>
              </div>
            </div>

            {/* Custom Community Warning Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Type className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Custom Warning Note (Optional)</span>
                </span>
                <span className="text-[10px] text-stone-400 font-normal">Max 80 chars</span>
              </label>
              <input
                type="text"
                maxLength={80}
                value={customCommunityWarning}
                onChange={(e) => setCustomCommunityWarning(e.target.value)}
                placeholder={
                  isHaram
                    ? 'e.g. Please check your pantry! Contains pork gelatin'
                    : isMushbooh
                    ? 'e.g. Waiting on official halal certificate reply'
                    : 'e.g. Verified safe for Ramadan iftar prep!'
                }
                className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Live Preview & Action Column */}
          <div className="lg:col-span-7 flex flex-col items-center">
            <div className="w-full flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" />
                Live Card Preview
              </span>
              <button
                type="button"
                onClick={renderCardToCanvas}
                className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${isGenerating ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>

            {/* Preview Viewport Frame */}
            <div className="w-full bg-stone-100 dark:bg-stone-950 p-3 sm:p-4 rounded-3xl border border-stone-200 dark:border-stone-800 flex items-center justify-center min-h-[380px] max-h-[500px] overflow-hidden shadow-inner">
              {generatedImageUrl ? (
                <img
                  src={generatedImageUrl}
                  alt={`Social card preview for ${product.product_name}`}
                  className={`max-w-full max-h-[460px] object-contain rounded-xl shadow-lg transition-transform ${
                    aspectRatio === 'story' ? 'max-h-[460px] w-auto' : 'w-auto'
                  }`}
                />
              ) : (
                <div className="flex flex-col items-center justify-center p-8 text-stone-400 gap-2">
                  <RefreshCw className="w-6 h-6 animate-spin text-emerald-600" />
                  <span className="text-xs">Generating social graphic...</span>
                </div>
              )}
            </div>

            {/* Hidden master canvas for high-dpi rendering */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Action Buttons: Download, Copy Image, Share */}
            <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-4">
              <button
                type="button"
                onClick={handleDownloadImage}
                disabled={!generatedImageUrl || isGenerating}
                className="py-2.5 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer active:scale-95"
              >
                {downloadSuccess ? <Check className="w-4 h-4 text-emerald-200" /> : <Download className="w-4 h-4" />}
                <span>{downloadSuccess ? 'Downloaded!' : 'Save PNG Image'}</span>
              </button>

              <button
                type="button"
                onClick={handleCopyImageToClipboard}
                disabled={!generatedImageUrl || isGenerating}
                className={`py-2.5 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 ${
                  copiedImage
                    ? 'bg-emerald-50 dark:bg-emerald-950 border-emerald-300 text-emerald-800 dark:text-emerald-200 font-bold'
                    : 'bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-700'
                }`}
              >
                {copiedImage ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-stone-500" />}
                <span>{copiedImage ? 'Image Copied!' : 'Copy to Clipboard'}</span>
              </button>

              <button
                type="button"
                onClick={handleShareNative}
                disabled={!generatedImageUrl || isGenerating}
                className="py-2.5 px-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
              >
                <Share2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Share via Apps</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
