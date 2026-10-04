import React, { useState, useRef } from 'react';
import { Camera, Upload, Sparkles, RefreshCw, AlertCircle, FileText, CheckCircle2, XCircle, AlertTriangle, Scale } from 'lucide-react';

interface AiAnalysisResult {
  detectedProductName: string;
  status: 'HALAL' | 'HARAM' | 'MUSHBOOH' | 'HALAL_CERTIFIED';
  confidence: string;
  summaryVerdict: string;
  criticalFlags: {
    ingredient: string;
    status: string;
    reason: string;
    source: string;
  }[];
  ingredientTable: {
    name: string;
    status: string;
    origin: string;
    scholarlyNote?: string;
  }[];
  jurisprudenceNotes?: {
    hanafi?: string;
    shafii_maliki_hanbali?: string;
    generalConsensus?: string;
  };
  halalAlternatives?: string[];
}

export const LabelOcrScanner: React.FC = () => {
  const [activeMode, setActiveMode] = useState<'camera' | 'upload' | 'text'>('camera');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [rawText, setRawText] = useState<string>('');
  const [productNameHint, setProductNameHint] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AiAnalysisResult | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isCameraStreaming, setIsCameraStreaming] = useState<boolean>(false);
  const streamRef = useRef<MediaStream | null>(null);

  // Start direct webcam for snapping label
  const startCamera = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsCameraStreaming(true);
    } catch (err: any) {
      console.warn('Camera error:', err);
      setError('Could not access camera for label snap. Please allow camera permissions or upload an image.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraStreaming(false);
  };

  const captureFrame = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setPreviewImage(dataUrl);
      stopCamera();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setPreviewImage(reader.result as string);
      stopCamera();
    };
    reader.readAsDataURL(file);
  };

  const runAiAnalysis = async () => {
    if (!previewImage && !rawText.trim()) {
      setError('Please take a photo, upload an image, or enter ingredients text.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);

    try {
      const body: any = {
        productName: productNameHint.trim() || undefined,
      };

      if (previewImage) {
        body.imageBase64 = previewImage;
        body.mimeType = 'image/jpeg';
      }
      if (rawText.trim()) {
        body.text = rawText.trim();
      }

      const res = await fetch('/api/analyze-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'AI analysis failed');
      }

      setAnalysisResult(data.analysis);
    } catch (err: any) {
      console.error('AI analysis error:', err);
      setError(err.message || 'Failed to inspect label with AI');
    } finally {
      setIsLoading(false);
    }
  };

  const resetAll = () => {
    stopCamera();
    setPreviewImage(null);
    setRawText('');
    setProductNameHint('');
    setAnalysisResult(null);
    setError(null);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 overflow-hidden shadow-sm">
        {/* Header */}
        <div className="p-5 border-b border-stone-100 dark:border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-400 flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5" />
              </span>
              <h2 className="text-lg font-bold text-stone-900 dark:text-white font-display">
                AI Ingredient Label Inspector
              </h2>
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
              Photograph any nutrition label or paste ingredients for full Islamic dietary jurisprudence inspection by Gemini 3.8 Flash.
            </p>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center gap-1 p-1 bg-stone-100 dark:bg-stone-800 rounded-xl self-start sm:self-center">
            <button
              onClick={() => {
                setActiveMode('camera');
                setPreviewImage(null);
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                activeMode === 'camera'
                  ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              Snap Label
            </button>
            <button
              onClick={() => {
                setActiveMode('upload');
                stopCamera();
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                activeMode === 'upload'
                  ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              Upload Photo
            </button>
            <button
              onClick={() => {
                setActiveMode('text');
                stopCamera();
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                activeMode === 'text'
                  ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              Paste Text
            </button>
          </div>
        </div>

        {/* Mode Content */}
        <div className="p-5 sm:p-6">
          {/* Optional Product Name input */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
              Product Name (Optional)
            </label>
            <input
              type="text"
              value={productNameHint}
              onChange={(e) => setProductNameHint(e.target.value)}
              placeholder="e.g. Marshmallow Crispy Treats, Cheddar Crackers..."
              className="w-full h-10 px-3 text-xs sm:text-sm bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700 text-stone-900 dark:text-white placeholder:text-stone-400 dark:placeholder:text-stone-500"
            />
          </div>

          {/* Mode 1: Camera Snap */}
          {activeMode === 'camera' && (
            <div className="space-y-4">
              {previewImage ? (
                <div className="relative rounded-2xl overflow-hidden border border-stone-200 dark:border-stone-700 bg-stone-900 max-w-lg mx-auto">
                  <img
                    src={previewImage}
                    alt="Captured label"
                    className="w-full max-h-80 object-contain mx-auto"
                  />
                  <div className="absolute bottom-3 right-3 flex gap-2">
                    <button
                      onClick={() => setPreviewImage(null)}
                      className="px-3 py-1.5 bg-stone-900/80 text-white rounded-lg text-xs font-medium hover:bg-stone-900 backdrop-blur-xs cursor-pointer"
                    >
                      Retake
                    </button>
                  </div>
                </div>
              ) : isCameraStreaming ? (
                <div className="relative rounded-2xl overflow-hidden border border-stone-200 dark:border-stone-700 bg-stone-900 max-w-lg mx-auto">
                  <video ref={videoRef} className="w-full h-72 object-cover" playsInline muted />
                  <div className="absolute inset-0 border-2 border-dashed border-emerald-400/50 m-6 rounded-xl pointer-events-none flex items-center justify-center">
                    <span className="text-[11px] bg-black/60 text-white px-2.5 py-1 rounded-full">
                      Center ingredients text here
                    </span>
                  </div>
                  <div className="absolute bottom-4 inset-x-0 flex items-center justify-center gap-3">
                    <button
                      onClick={captureFrame}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg flex items-center gap-2 cursor-pointer active:scale-95"
                    >
                      <Camera className="w-4 h-4" />
                      Capture Label Photo
                    </button>
                    <button
                      onClick={stopCamera}
                      className="px-3 py-2 bg-stone-800 text-stone-300 rounded-xl text-xs font-medium hover:text-white cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center border-2 border-dashed border-stone-200 dark:border-stone-700 rounded-2xl bg-stone-50/60 dark:bg-stone-800/40 max-w-lg mx-auto">
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 flex items-center justify-center mx-auto mb-3">
                    <Camera className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-semibold text-stone-900 dark:text-white mb-1">
                    Snap an Ingredient Label
                  </h4>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mb-4 max-w-xs mx-auto">
                    Point camera at back-of-pack ingredients text, E-codes, or fine print.
                  </p>
                  <button
                    onClick={startCamera}
                    className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-xs"
                  >
                    Open Camera to Snap
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Mode 2: Upload Photo */}
          {activeMode === 'upload' && (
            <div className="space-y-4">
              {previewImage ? (
                <div className="relative rounded-2xl overflow-hidden border border-stone-200 dark:border-stone-700 bg-stone-900 max-w-lg mx-auto">
                  <img
                    src={previewImage}
                    alt="Uploaded label"
                    className="w-full max-h-80 object-contain mx-auto"
                  />
                  <div className="absolute bottom-3 right-3 flex gap-2">
                    <button
                      onClick={() => setPreviewImage(null)}
                      className="px-3 py-1.5 bg-stone-900/80 text-white rounded-lg text-xs font-medium hover:bg-stone-900 backdrop-blur-xs cursor-pointer"
                    >
                      Choose Different Photo
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="p-8 text-center border-2 border-dashed border-stone-200 dark:border-stone-700 hover:border-emerald-600 dark:hover:border-emerald-500 rounded-2xl bg-stone-50/60 dark:bg-stone-800/40 cursor-pointer transition-colors max-w-lg mx-auto"
                >
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 flex items-center justify-center mx-auto mb-3">
                    <Upload className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-semibold text-stone-900 dark:text-white mb-1">
                    Upload Food Label Image
                  </h4>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mb-3">
                    Click to select a photo from your gallery or files
                  </p>
                  <span className="text-[11px] font-medium text-emerald-800 dark:text-emerald-400 underline">
                    Browse files
                  </span>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
              />
            </div>
          )}

          {/* Mode 3: Text Paste */}
          {activeMode === 'text' && (
            <div>
              <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                Ingredients List / Additives Text
              </label>
              <textarea
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                rows={4}
                placeholder="Paste ingredients here (e.g. Sugar, pork gelatin, E120 carmine, glucose syrup, citric acid, mono- and diglycerides...)"
                className="w-full p-3 text-xs sm:text-sm bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700 font-mono text-stone-900 dark:text-white placeholder:text-stone-400 dark:placeholder:text-stone-500"
              />
              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={() =>
                    setRawText(
                      'Glucose syrup, sugar, pork gelatin, dextrose, citric acid, fruit concentrates, carmine (E120), beeswax.'
                    )
                  }
                  className="text-[11px] text-stone-500 dark:text-stone-400 hover:text-emerald-700 dark:hover:text-emerald-300 underline"
                >
                  Sample Haram candy text
                </button>
                <span className="text-stone-300 dark:text-stone-700">·</span>
                <button
                  type="button"
                  onClick={() =>
                    setRawText(
                      'Wheat flour, sugar, palm oil, cocoa powder, glucose syrup, salt, soy lecithin (E322), baking soda, vanillin.'
                    )
                  }
                  className="text-[11px] text-stone-500 dark:text-stone-400 hover:text-emerald-700 dark:hover:text-emerald-300 underline"
                >
                  Sample Halal biscuit text
                </button>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/80 rounded-xl text-rose-900 dark:text-rose-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Run Button */}
          <div className="mt-5 flex items-center justify-between pt-4 border-t border-stone-100 dark:border-stone-800">
            <button
              onClick={resetAll}
              className="text-xs font-medium text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 cursor-pointer"
            >
              Reset Form
            </button>

            <button
              onClick={runAiAnalysis}
              disabled={isLoading || (!previewImage && !rawText.trim())}
              className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer shadow-sm active:scale-95"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Gemini AI Analyzing Fiqh...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Run Islamic Dietary AI Audit</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Analysis Result Card */}
      {analysisResult && (
        <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 overflow-hidden shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
          {/* Header Banner */}
          <div
            className={`p-5 border-b ${
              analysisResult.status === 'HALAL' || analysisResult.status === 'HALAL_CERTIFIED'
                ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-950 dark:text-emerald-100 border-emerald-200 dark:border-emerald-800'
                : analysisResult.status === 'HARAM'
                ? 'bg-rose-50 dark:bg-rose-950/80 text-rose-950 dark:text-rose-100 border-rose-200 dark:border-rose-900'
                : 'bg-amber-50 dark:bg-amber-950/80 text-amber-950 dark:text-amber-100 border-amber-200 dark:border-amber-900'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-600 dark:text-stone-300">
                Gemini 3.8 Flash Islamic Fiqh Verdict
              </span>
              <span className="text-stone-300 dark:text-stone-600">·</span>
              <span className="text-[11px] text-stone-500 dark:text-stone-400">
                Confidence: {analysisResult.confidence}
              </span>
            </div>
            <div className="flex items-center gap-3">
              {analysisResult.status === 'HALAL' || analysisResult.status === 'HALAL_CERTIFIED' ? (
                <CheckCircle2 className="w-7 h-7 text-emerald-700 dark:text-emerald-400 shrink-0" />
              ) : analysisResult.status === 'HARAM' ? (
                <XCircle className="w-7 h-7 text-rose-700 dark:text-rose-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-7 h-7 text-amber-700 dark:text-amber-400 shrink-0" />
              )}
              <div>
                <h3 className="text-xl font-bold font-display text-stone-900 dark:text-white">
                  {analysisResult.status === 'HALAL' && 'Halal - Permissible'}
                  {analysisResult.status === 'HALAL_CERTIFIED' && 'Halal Certified Product'}
                  {analysisResult.status === 'HARAM' && 'Haram - Prohibited Ingredients'}
                  {analysisResult.status === 'MUSHBOOH' && 'Mushbooh - Doubtful / Verification Required'}
                </h3>
                <p className="text-xs sm:text-sm text-stone-700 dark:text-stone-300 mt-0.5">
                  {analysisResult.detectedProductName}
                </p>
              </div>
            </div>
            <p className="mt-3 text-xs sm:text-sm text-stone-800 dark:text-stone-200 leading-relaxed font-normal bg-white/70 dark:bg-stone-850/80 p-3 rounded-xl border border-stone-200/50 dark:border-stone-700">
              {analysisResult.summaryVerdict}
            </p>
          </div>

          {/* Critical Flags */}
          {analysisResult.criticalFlags && analysisResult.criticalFlags.length > 0 && (
            <div className="p-5 border-b border-stone-100 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/60">
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-900 dark:text-white mb-2">
                Problematic Additives & Compounds
              </h4>
              <div className="space-y-2">
                {analysisResult.criticalFlags.map((flag, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-stone-900 dark:text-white">{flag.ingredient}</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-stone-100 dark:bg-stone-700 text-stone-800 dark:text-stone-200">
                          {flag.status}
                        </span>
                        <span className="text-stone-400">·</span>
                        <span className="text-stone-500 dark:text-stone-400 font-medium">Origin: {flag.source}</span>
                      </div>
                      <p className="text-stone-600 dark:text-stone-300 text-xs mt-0.5">{flag.reason}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Madhhab Jurisprudence Notes */}
          {analysisResult.jurisprudenceNotes && (
            <div className="p-5 border-b border-stone-100 dark:border-stone-800">
              <div className="flex items-center gap-2 mb-2">
                <Scale className="w-4 h-4 text-stone-600 dark:text-stone-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-900 dark:text-white">
                  Madhhab Jurisprudence Details
                </h4>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 text-xs">
                {analysisResult.jurisprudenceNotes.hanafi && (
                  <div className="p-3 bg-stone-50 dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700">
                    <span className="font-bold text-stone-900 dark:text-white block mb-0.5">Hanafi View:</span>
                    <p className="text-stone-600 dark:text-stone-300">{analysisResult.jurisprudenceNotes.hanafi}</p>
                  </div>
                )}
                {analysisResult.jurisprudenceNotes.shafii_maliki_hanbali && (
                  <div className="p-3 bg-stone-50 dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700">
                    <span className="font-bold text-stone-900 dark:text-white block mb-0.5">
                      Shafi’i / Maliki / Hanbali:
                    </span>
                    <p className="text-stone-600 dark:text-stone-300">
                      {analysisResult.jurisprudenceNotes.shafii_maliki_hanbali}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Itemized Table */}
          {analysisResult.ingredientTable && analysisResult.ingredientTable.length > 0 && (
            <div className="p-5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-900 dark:text-white mb-2">
                Ingredient Breakdown
              </h4>
              <div className="border border-stone-200 dark:border-stone-800 rounded-xl overflow-hidden text-xs">
                <div className="bg-stone-50 dark:bg-stone-800 px-3.5 py-2 font-semibold text-stone-700 dark:text-stone-300 flex justify-between">
                  <span>Ingredient</span>
                  <span>Origin & Status</span>
                </div>
                <div className="divide-y divide-stone-100 dark:divide-stone-800 max-h-60 overflow-y-auto">
                  {analysisResult.ingredientTable.map((item, idx) => (
                    <div key={idx} className="px-3.5 py-2 flex items-center justify-between hover:bg-stone-50 dark:hover:bg-stone-800/60">
                      <div>
                        <span className="text-stone-900 dark:text-stone-100 font-medium">{item.name}</span>
                        {item.scholarlyNote && (
                          <p className="text-[11px] text-stone-500 dark:text-stone-400">{item.scholarlyNote}</p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[10px] text-stone-500 dark:text-stone-400 mr-2">{item.origin}</span>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
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
                    </div>
                  ))}
                </div>
              </div>

              {/* Halal Alternatives Suggestion */}
              {analysisResult.halalAlternatives && analysisResult.halalAlternatives.length > 0 && (
                <div className="mt-4 p-3 bg-emerald-50 dark:bg-emerald-950/60 rounded-xl border border-emerald-200 dark:border-emerald-800 text-xs">
                  <span className="font-bold text-emerald-950 dark:text-emerald-200 block mb-1">
                    Recommended Halal Alternatives:
                  </span>
                  <ul className="list-disc list-inside space-y-0.5 text-emerald-900 dark:text-emerald-300">
                    {analysisResult.halalAlternatives.map((alt, i) => (
                      <li key={i}>{alt}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
