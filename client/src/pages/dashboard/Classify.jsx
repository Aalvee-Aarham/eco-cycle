import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { useClassify } from '@/hooks/useSubmissions';
import { CategoryBadge } from '@/components/CategoryBadge';
import { StateBadge } from '@/components/StateBadge';
import { ConfidenceMeter } from '@/components/ConfidenceMeter';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { Label } from '@/components/ui/Label';
import { assetUrl } from '@/lib/utils';
import { ChevronDown, ChevronUp, Upload, Zap, Clock, AlertTriangle } from 'lucide-react';

const TIER_META = {
  high: {
    icon: <Zap className="h-4 w-4" />,
    label: 'High Confidence',
    className: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
    message: '✅ Classified! Points have been awarded.',
    messageClass: 'text-emerald-700 bg-emerald-50 border border-emerald-200',
  },
  medium: {
    icon: <Clock className="h-4 w-4" />,
    label: 'Medium Confidence',
    className: 'bg-amber-100 text-amber-800 border border-amber-200',
    message: '⚠️ Medium confidence — sent to the moderator queue for review.',
    messageClass: 'text-amber-700 bg-amber-50 border border-amber-200',
  },
  low: {
    icon: <AlertTriangle className="h-4 w-4" />,
    label: 'Low Confidence',
    className: 'bg-red-100 text-red-800 border border-red-200',
    message: '🔄 Low confidence — a secondary model is verifying this. Check back later.',
    messageClass: 'text-red-700 bg-red-50 border border-red-200',
  },
};

export default function Classify() {
  const classify = useClassify();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [classifierOverride, setClassifierOverride] = useState('');
  const [result, setResult] = useState(null);
  const [reasonOpen, setReasonOpen] = useState(false);

  const onDrop = useCallback((accepted) => {
    const f = accepted[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setResult(null);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    maxFiles: 1,
    maxSize: 8 * 1024 * 1024,
  });

  const runClassify = () => {
    if (!file) return;
    classify.mutate(
      { file, classifierOverride: classifierOverride || undefined },
      {
        onSuccess: (data) => {
          setResult(data);
        },
      }
    );
  };

  const reset = () => {
    setFile(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setResult(null);
    classify.reset();
  };

  const submission = result?.submission ?? result;
  const flagged = result?.flagged;

  // Display YOLO bounding-box image if available, else Cloudinary URL, else local preview
  let imgSrc = preview;
  if (result?.raw?.detected_image) {
    imgSrc = `data:image/jpeg;base64,${result.raw.detected_image}`;
  } else if (submission?.detectedImageUrl) {
    imgSrc = assetUrl(submission.detectedImageUrl);
  } else if (submission?.imageUrl) {
    imgSrc = assetUrl(submission.imageUrl);
  }

  const tier = submission?.confidenceTier;
  const tierMeta = TIER_META[tier];
  const isYolo = submission?.classifier === 'yolo';
  const hasDetections = Array.isArray(result?.raw?.detections) && result.raw.detections.length > 0;
  // Gemini reasoning is stored on submission
  const hasReasoning = !!submission?.reasoning;

  return (
    <PageWrapper>
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Classify waste</h1>
      <p className="text-slate-500 mb-6">Upload a photo of your waste item. We&apos;ll classify it and award points.</p>

      <div className="max-w-2xl space-y-6">
        {!result && (
          <>
            {!classify.isPending && (
              <>
                <div className="space-y-2">
                  <Label>Classifier (optional override)</Label>
                  <select
                    className="flex h-10 w-full max-w-xs rounded-md border border-input bg-background px-3 text-sm"
                    value={classifierOverride}
                    onChange={(e) => setClassifierOverride(e.target.value)}
                  >
                    <option value="">Default (server setting)</option>
                    <option value="yolo">YOLO (object detection)</option>
                    <option value="gemini">Gemini (AI vision)</option>
                  </select>
                </div>

                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
                    isDragActive ? 'border-eco-500 bg-eco-50' : 'border-slate-300 hover:border-eco-400 hover:bg-slate-50'
                  }`}
                >
                  <input {...getInputProps()} />
                  <Upload className="h-10 w-10 mx-auto text-slate-400 mb-3" />
                  <p className="text-slate-600 font-medium">Drag an image here, or click to select</p>
                  <p className="text-xs text-slate-400 mt-2">PNG, JPG up to 8MB</p>
                </div>

                {preview && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                    <img src={preview} alt="Preview" className="max-h-64 rounded-lg border mx-auto" />
                    <div className="flex gap-2">
                      <Button onClick={runClassify} disabled={classify.isPending}>
                        Classify
                      </Button>
                      <Button type="button" variant="outline" onClick={reset}>
                        Clear
                      </Button>
                    </div>
                  </motion.div>
                )}
              </>
            )}

            <AnimatePresence>
              {classify.isPending && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="rounded-xl border bg-white p-8 space-y-4"
                >
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-24 w-24 rounded-lg shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-full max-w-md" />
                      <Skeleton className="h-4 w-full max-w-sm" />
                    </div>
                  </div>
                  <p className="text-center text-slate-500 animate-pulse">Analysing…</p>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}

        {result && submission && (
          <Card className="overflow-hidden">
            <CardContent className="p-6 space-y-4">
              {flagged ? (
                /* ── Duplicate rejected ── */
                <>
                  {imgSrc && (
                    <img src={imgSrc} alt="" className="w-full sm:w-40 h-40 object-cover rounded-lg border mx-auto" />
                  )}
                  <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-4 py-3">
                    <p className="font-semibold mb-1">Duplicate detected — submission rejected</p>
                    <p className="text-red-600">
                      This image has already been submitted and rewarded. Resubmitting the same image does not earn additional points.
                      {submission.flagReason ? ` (${submission.flagReason})` : ''}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-2">
                    <Button variant="outline" onClick={reset}>
                      Classify another
                    </Button>
                  </div>
                </>
              ) : (
                /* ── Normal result ── */
                <>
                  <div className="flex flex-col sm:flex-row gap-6 items-start">
                    {imgSrc && (
                      <div className="relative group flex-shrink-0">
                        <img
                          src={imgSrc}
                          alt="Classified"
                          className="w-full sm:w-64 h-auto aspect-video sm:aspect-square object-cover rounded-lg border shadow-sm"
                        />
                        {/* Classifier badge */}
                        {submission.classifier && (
                          <div className={`absolute top-2 left-2 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm uppercase tracking-wider ${
                            submission.classifier === 'yolo' ? 'bg-emerald-500' : 'bg-indigo-500'
                          }`}>
                            {submission.classifier === 'yolo' ? '🎯 YOLO' : '🤖 Gemini'}
                          </div>
                        )}
                      </div>
                    )}
                    <ConfidenceMeter value={submission.confidence} />
                  </div>

                  {/* Confidence tier badge */}
                  {tierMeta && (
                    <div className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${tierMeta.className}`}>
                      {tierMeta.icon}
                      {tierMeta.label}
                    </div>
                  )}

                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm text-slate-500">Category:</span>
                      {submission.category ? <CategoryBadge category={submission.category} /> : '—'}
                    </div>
                    {submission.subcategory && (
                      <p className="text-sm">
                        <span className="text-slate-500">Subcategory:</span> {submission.subcategory}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm text-slate-500">State:</span>
                      <StateBadge state={submission.state} />
                    </div>
                  </div>

                  {/* Tier status message */}
                  {tierMeta && (
                    <p className={`text-sm rounded-md px-3 py-2 ${tierMeta.messageClass}`}>
                      {tierMeta.message}
                    </p>
                  )}

                  {/* AI insights: YOLO detections OR Gemini reasoning */}
                  {(hasDetections || hasReasoning) && (
                    <div className="border rounded-lg overflow-hidden">
                      <button
                        type="button"
                        className="flex w-full items-center justify-between p-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                        onClick={() => setReasonOpen(!reasonOpen)}
                      >
                        {isYolo ? '🎯 Object detection data' : '🤖 AI reasoning'}
                        {reasonOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </button>
                      {reasonOpen && (
                        <div className="px-3 pb-3 text-sm text-slate-600 border-t bg-slate-50/80">
                          {isYolo && hasDetections ? (
                            <div className="space-y-1 pt-2">
                              {result.raw.detections.map((d, i) => (
                                <div key={i} className="flex justify-between items-center text-xs py-0.5">
                                  <span className="font-mono font-medium">{d.class_name}</span>
                                  <div className="flex items-center gap-2">
                                    <span className="text-slate-400">{d.ecocycle_stream}</span>
                                    <span className="font-semibold tabular-nums">{(d.confidence * 100).toFixed(1)}%</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : hasReasoning ? (
                            <p className="pt-2 leading-relaxed">{submission.reasoning}</p>
                          ) : null}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 pt-2">
                    {(submission.state === 'AWAITING_REWARD' || submission.state === 'REWARDED') && (
                      <Button asChild>
                        <Link to={`/submissions/${submission._id}`}>Redeem / view</Link>
                      </Button>
                    )}
                    <Button variant="outline" onClick={reset}>
                      Classify another
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </PageWrapper>
  );
}
