'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Ruler, Info, ArrowRight } from 'lucide-react';

interface SizeGuideData {
  id?: string;
  name?: string;
  description?: string | null;
  productType?: string;
  measurementUnit?: string;
  columns?: string;
  sizeGuideImage?: string | null;
  entries?: {
    id: string;
    sizeName: string;
    measurements: string;
    notes?: string | null;
    displayOrder: number;
  }[];
}

interface SizeGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId?: string;
  sizeGuideImage?: string | null;
  productTitle?: string;
}

export const SizeGuideModal: React.FC<SizeGuideModalProps> = ({
  isOpen,
  onClose,
  productId,
  sizeGuideImage: propGuideImage,
  productTitle,
}) => {
  const [guide, setGuide] = useState<SizeGuideData | null>(null);
  const [activeImage, setActiveImage] = useState<string | null>(propGuideImage || null);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);

  // Find My Size state
  const [showFinder, setShowFinder] = useState(false);
  const [bust, setBust] = useState('');
  const [waist, setWaist] = useState('');
  const [hip, setHip] = useState('');
  const [recommendation, setRecommendation] = useState('');

  const fetchGuide = useCallback(async () => {
    if (propGuideImage) {
      setActiveImage(propGuideImage);
      setNotFound(false);
      return;
    }

    if (!productId) {
      setNotFound(true);
      return;
    }

    setLoading(true);
    setNotFound(false);
    try {
      const res = await fetch(`/api/size-guides?productId=${encodeURIComponent(productId)}`);
      if (res.ok) {
        const data = await res.json();
        setGuide(data);
        setActiveImage(data.sizeGuideImage || null);
        if (!data.sizeGuideImage && (!data.entries || data.entries.length === 0)) {
          setNotFound(true);
        }
      } else {
        setNotFound(true);
      }
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [productId, propGuideImage]);

  useEffect(() => {
    if (propGuideImage) {
      setActiveImage(propGuideImage);
      setNotFound(false);
    }
  }, [propGuideImage]);

  useEffect(() => {
    if (isOpen) {
      fetchGuide();
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, fetchGuide]);

  // Keyboard Escape support
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Find My Size calculator for tabular guides
  const calculateRecommendation = () => {
    if (!guide || !guide.columns || !guide.entries || (!bust && !waist && !hip)) {
      setRecommendation('');
      return;
    }

    try {
      const columns = JSON.parse(guide.columns) as string[];
      const bustCol = columns.findIndex((c) => c.toLowerCase().includes('bust') || c.toLowerCase().includes('chest'));
      const waistCol = columns.findIndex((c) => c.toLowerCase().includes('waist'));
      const hipCol = columns.findIndex((c) => c.toLowerCase().includes('hip'));

      let bestMatch = '';
      let bestScore = Infinity;

      for (const entry of guide.entries) {
        const m = JSON.parse(entry.measurements);
        let score = 0;
        let count = 0;

        if (bust && bustCol >= 0) {
          const entryVal = parseFloat(m[columns[bustCol]] || '0');
          if (entryVal > 0) {
            score += Math.abs(parseFloat(bust) - entryVal);
            count++;
          }
        }
        if (waist && waistCol >= 0) {
          const entryVal = parseFloat(m[columns[waistCol]] || '0');
          if (entryVal > 0) {
            score += Math.abs(parseFloat(waist) - entryVal);
            count++;
          }
        }
        if (hip && hipCol >= 0) {
          const entryVal = parseFloat(m[columns[hipCol]] || '0');
          if (entryVal > 0) {
            score += Math.abs(parseFloat(hip) - entryVal);
            count++;
          }
        }

        if (count > 0 && score / count < bestScore) {
          bestScore = score / count;
          bestMatch = entry.sizeName;
        }
      }

      if (bestMatch) {
        setRecommendation(bestMatch);
      } else {
        setRecommendation('');
      }
    } catch {
      setRecommendation('');
    }
  };

  const columns = guide?.columns ? (JSON.parse(guide.columns) as string[]) : [];
  const entries = guide?.entries || [];
  const hasEntries = entries.length > 0 && columns.length > 0;
  const isUnstitched = guide?.productType === 'UNSTITCHED';

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-3 sm:p-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-charcoal/70 backdrop-blur-xs cursor-pointer"
          />

          {/* Modal Container - Centered via Flexbox, strictly contained in viewport */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 15 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 w-full sm:max-w-3xl max-h-[92vh] sm:max-h-[88vh] bg-offwhite rounded-2xl sm:rounded-3xl shadow-2xl border border-sand overflow-hidden flex flex-col my-auto"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-3.5 sm:p-5 border-b border-sand shrink-0 bg-sand/20">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-teal text-champagne rounded-xl flex items-center justify-center shrink-0">
                  <Ruler className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div>
                  <h2 className="font-serif text-base sm:text-xl font-bold text-teal leading-tight">Size Guide</h2>
                  <p className="text-[10px] sm:text-[11px] uppercase tracking-wider text-champagne-700 font-semibold truncate max-w-[200px] sm:max-w-md">
                    {productTitle ? `${productTitle}` : 'Garment Measurements'}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-sand hover:bg-champagne flex items-center justify-center text-charcoal transition-colors cursor-pointer shrink-0"
                aria-label="Close size guide"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-4">
              {loading && (
                <div className="text-center py-14">
                  <div className="w-8 h-8 border-2 border-teal border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-xs text-charcoal-muted mt-3">Loading size guide...</p>
                </div>
              )}

              {!loading && (
                <>
                  {/* 1. Product's Dedicated Size Guide Image (Natural Aspect Ratio Preserved) */}
                  {activeImage && (
                    <div className="space-y-2.5">
                      <div className="w-full rounded-xl overflow-hidden border border-sand bg-white shadow-sm flex flex-col items-center">
                        <div className="w-full flex justify-center items-center p-2.5 sm:p-5 bg-white overflow-x-auto">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={activeImage}
                            alt={productTitle ? `${productTitle} Size Guide` : 'Product Size Guide'}
                            className="w-auto h-auto max-w-full max-h-[62vh] sm:max-h-[72vh] object-contain rounded-lg shadow-2xs select-none"
                            loading="lazy"
                          />
                        </div>
                        <div className="w-full p-2.5 sm:p-3 bg-sand/30 border-t border-sand flex items-center justify-between text-[11px] text-charcoal-muted font-sans">
                          <span className="font-medium">Specific measurements for this product</span>
                          <a
                            href={activeImage}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-teal font-bold hover:underline inline-flex items-center gap-1"
                          >
                            Open Full Size ↗
                          </a>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 2. Optional Tabular Measurements (if product also has entry data) */}
                  {hasEntries && (
                    <div className="space-y-4 pt-2">
                      {guide?.description && (
                        <p className="text-xs text-charcoal-muted leading-relaxed font-sans">{guide.description}</p>
                      )}

                      {isUnstitched && (
                        <div className="bg-champagne/30 border border-champagne/60 rounded-xl p-3 flex items-start gap-2.5">
                          <Info className="w-4 h-4 text-champagne-700 shrink-0 mt-0.5" />
                          <p className="text-xs text-charcoal leading-relaxed font-sans">
                            This is an <strong>unstitched product</strong>. Measurements refer to fabric dimensions.
                          </p>
                        </div>
                      )}

                      <div className="overflow-x-auto -mx-1">
                        <table className="w-full text-xs min-w-[360px]">
                          <thead>
                            <tr className="border-b-2 border-teal">
                              <th className="text-left py-2.5 px-3 uppercase tracking-wider font-bold text-teal whitespace-nowrap">
                                Size
                              </th>
                              {columns.map((col) => (
                                <th
                                  key={col}
                                  className="text-center py-2.5 px-3 uppercase tracking-wider font-bold text-teal whitespace-nowrap"
                                >
                                  {col} <span className="text-[9px] text-charcoal-muted font-normal">({guide?.measurementUnit || 'in'})</span>
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-sand font-sans">
                            {entries.map((entry) => {
                              const m = JSON.parse(entry.measurements || '{}');
                              return (
                                <tr key={entry.id} className="hover:bg-sand/30 transition-colors">
                                  <td className="py-2.5 px-3 font-bold text-teal whitespace-nowrap">
                                    {entry.sizeName}
                                  </td>
                                  {columns.map((col) => (
                                    <td key={col} className="text-center py-2.5 px-3 font-mono text-charcoal">
                                      {m[col] || '—'}
                                    </td>
                                  ))}
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      {/* Find My Size */}
                      {!isUnstitched && (
                        <div className="border-t border-sand pt-4">
                          <button
                            onClick={() => setShowFinder(!showFinder)}
                            className="flex items-center gap-2 text-xs font-bold text-teal uppercase tracking-wider hover:text-champagne-700 transition-colors cursor-pointer"
                          >
                            <ArrowRight className={`w-3.5 h-3.5 transition-transform ${showFinder ? 'rotate-90' : ''}`} />
                            Find My Size
                          </button>

                          <AnimatePresence>
                            {showFinder && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden pt-3 space-y-3"
                              >
                                <div className="grid grid-cols-3 gap-2.5">
                                  <div>
                                    <label className="text-[10px] uppercase font-semibold text-charcoal block mb-1">Bust</label>
                                    <input
                                      type="number"
                                      value={bust}
                                      onChange={(e) => setBust(e.target.value)}
                                      placeholder="e.g. 34"
                                      className="w-full px-2.5 py-2 rounded-lg bg-offwhite border border-sand text-xs text-charcoal"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[10px] uppercase font-semibold text-charcoal block mb-1">Waist</label>
                                    <input
                                      type="number"
                                      value={waist}
                                      onChange={(e) => setWaist(e.target.value)}
                                      placeholder="e.g. 28"
                                      className="w-full px-2.5 py-2 rounded-lg bg-offwhite border border-sand text-xs text-charcoal"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[10px] uppercase font-semibold text-charcoal block mb-1">Hip</label>
                                    <input
                                      type="number"
                                      value={hip}
                                      onChange={(e) => setHip(e.target.value)}
                                      placeholder="e.g. 36"
                                      className="w-full px-2.5 py-2 rounded-lg bg-offwhite border border-sand text-xs text-charcoal"
                                    />
                                  </div>
                                </div>
                                <button
                                  onClick={calculateRecommendation}
                                  className="bg-teal text-champagne px-4 py-2 rounded-xl text-xs uppercase font-bold tracking-wider hover:bg-teal-900 transition-all cursor-pointer"
                                >
                                  Recommend Size
                                </button>
                                {recommendation && (
                                  <div className="bg-teal/10 border border-teal/30 rounded-xl p-3 text-center">
                                    <span className="text-[10px] uppercase tracking-wider text-champagne-700 font-semibold block">Recommended Size</span>
                                    <span className="font-serif text-2xl font-bold text-teal">{recommendation}</span>
                                  </div>
                                )}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 3. Clean Fallback when no size guide image exists (Requirement 15) */}
                  {!activeImage && !hasEntries && (
                    <div className="text-center py-12 px-4 bg-sand/30 rounded-2xl border border-sand/60 space-y-3">
                      <div className="w-12 h-12 rounded-full bg-sand flex items-center justify-center mx-auto text-teal">
                        <Ruler className="w-6 h-6" />
                      </div>
                      <h3 className="font-serif text-base sm:text-lg font-bold text-teal">
                        Size guide not available
                      </h3>
                      <p className="text-xs text-charcoal-muted max-w-sm mx-auto leading-relaxed font-sans">
                        Measurements for this specific product are currently being prepared. If you need sizing guidance before ordering, please chat with our customer team on WhatsApp for fast help.
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
