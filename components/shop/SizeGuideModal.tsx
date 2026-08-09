'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Ruler, Info, ArrowRight } from 'lucide-react';

interface SizeGuideData {
  id: string;
  name: string;
  description?: string | null;
  productType: string;
  measurementUnit: string;
  columns: string;
  entries: {
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
}

export const SizeGuideModal: React.FC<SizeGuideModalProps> = ({ isOpen, onClose, productId }) => {
  const [guide, setGuide] = useState<SizeGuideData | null>(null);
  const [allGuides, setAllGuides] = useState<SizeGuideData[]>([]);
  const [selectedGuide, setSelectedGuide] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Find My Size state
  const [showFinder, setShowFinder] = useState(false);
  const [bust, setBust] = useState('');
  const [waist, setWaist] = useState('');
  const [hip, setHip] = useState('');
  const [recommendation, setRecommendation] = useState('');

  const fetchGuide = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      let url = '/api/size-guides';
      if (productId) {
        url += `?productId=${productId}`;
      }
      const res = await fetch(url);

      if (productId) {
        if (res.ok) {
          const data = await res.json();
          setGuide(data);
        } else {
          // Load all guides as fallback
          const allRes = await fetch('/api/size-guides');
          if (allRes.ok) {
            const all = await allRes.json();
            setAllGuides(all);
            if (all.length > 0) {
              setGuide(all[0]);
              setSelectedGuide(all[0].id);
            }
          }
        }
      } else {
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            setAllGuides(data);
            if (data.length > 0) {
              setGuide(data[0]);
              setSelectedGuide(data[0].id);
            }
          } else {
            setGuide(data);
          }
        }
      }
    } catch {
      setError('Unable to load size guide');
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    if (isOpen) {
      fetchGuide();
    }
  }, [isOpen, fetchGuide]);

  const handleGuideSwitch = (guideId: string) => {
    const found = allGuides.find((g) => g.id === guideId);
    if (found) {
      setGuide(found);
      setSelectedGuide(guideId);
    }
  };

  // Find My Size calculator
  const calculateRecommendation = () => {
    if (!guide || !bust && !waist && !hip) {
      setRecommendation('');
      return;
    }

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
  };

  const columns = guide ? (JSON.parse(guide.columns) as string[]) : [];
  const isUnstitched = guide?.productType === 'UNSTITCHED';

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-charcoal/60"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.98 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-x-4 top-[5vh] bottom-[5vh] sm:inset-x-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-2xl sm:max-h-[85vh] z-50 bg-offwhite rounded-3xl shadow-2xl border border-sand overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 sm:p-6 border-b border-sand shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-teal text-champagne rounded-xl flex items-center justify-center">
                  <Ruler className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-serif text-xl sm:text-2xl font-bold text-teal">Size Guide</h2>
                  {guide && (
                    <p className="text-[10px] uppercase tracking-widest text-champagne-700 font-semibold">
                      {guide.name} — {guide.measurementUnit}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-full bg-sand hover:bg-champagne flex items-center justify-center text-charcoal transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
              {loading && (
                <div className="text-center py-12">
                  <div className="w-8 h-8 border-2 border-teal border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-xs text-charcoal-muted mt-3">Loading size guide...</p>
                </div>
              )}

              {error && (
                <div className="text-center py-12 text-xs text-charcoal-muted">
                  <p>{error}</p>
                </div>
              )}

              {!loading && guide && (
                <>
                  {/* Guide switcher (when multiple guides available) */}
                  {allGuides.length > 1 && (
                    <div className="flex flex-wrap gap-2">
                      {allGuides.map((g) => (
                        <button
                          key={g.id}
                          onClick={() => handleGuideSwitch(g.id)}
                          className={`px-3.5 py-1.5 rounded-xl text-xs uppercase font-semibold transition-all ${
                            selectedGuide === g.id
                              ? 'bg-teal text-champagne shadow-md'
                              : 'bg-sand text-charcoal hover:bg-champagne/60'
                          }`}
                        >
                          {g.name}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Description */}
                  {guide.description && (
                    <p className="text-xs text-charcoal-muted leading-relaxed">{guide.description}</p>
                  )}

                  {/* Unstitched info banner */}
                  {isUnstitched && (
                    <div className="bg-champagne/30 border border-champagne/60 rounded-xl p-4 flex items-start gap-3">
                      <Info className="w-4 h-4 text-champagne-700 shrink-0 mt-0.5" />
                      <p className="text-xs text-charcoal leading-relaxed">
                        This is an <strong>unstitched product</strong>. Measurements refer to fabric dimensions rather
                        than body measurements.
                      </p>
                    </div>
                  )}

                  {/* Measurement Table */}
                  {guide.entries.length > 0 && columns.length > 0 && (
                    <div className="overflow-x-auto -mx-1">
                      <table className="w-full text-xs min-w-[400px]">
                        <thead>
                          <tr className="border-b-2 border-teal">
                            <th className="text-left py-3 px-3 uppercase tracking-wider font-bold text-teal whitespace-nowrap">
                              Size
                            </th>
                            {columns.map((col) => (
                              <th
                                key={col}
                                className="text-center py-3 px-3 uppercase tracking-wider font-bold text-teal whitespace-nowrap"
                              >
                                {col} <span className="text-[9px] text-charcoal-muted font-normal">({guide.measurementUnit})</span>
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-sand">
                          {guide.entries.map((entry) => {
                            const m = JSON.parse(entry.measurements);
                            return (
                              <tr key={entry.id} className="hover:bg-sand/40 transition-colors">
                                <td className="py-3 px-3 font-bold text-teal whitespace-nowrap">
                                  {entry.sizeName}
                                  {entry.notes && (
                                    <span className="block text-[9px] text-charcoal-muted font-normal mt-0.5">
                                      {entry.notes}
                                    </span>
                                  )}
                                </td>
                                {columns.map((col) => (
                                  <td key={col} className="text-center py-3 px-3 font-mono text-charcoal">
                                    {m[col] || '—'}
                                  </td>
                                ))}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {guide.entries.length === 0 && (
                    <div className="text-center py-8 bg-sand/40 rounded-2xl">
                      <p className="text-xs text-charcoal-muted">
                        Size measurements are being updated. Please contact us for sizing assistance.
                      </p>
                    </div>
                  )}

                  {/* Find My Size (only for stitched products) */}
                  {!isUnstitched && guide.entries.length > 0 && (
                    <div className="border-t border-sand pt-5">
                      <button
                        onClick={() => setShowFinder(!showFinder)}
                        className="flex items-center gap-2 text-xs font-bold text-teal uppercase tracking-wider hover:text-champagne-700 transition-colors"
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
                            transition={{ duration: 0.25 }}
                            className="overflow-hidden"
                          >
                            <div className="pt-4 space-y-3">
                              <p className="text-[11px] text-charcoal-muted leading-relaxed">
                                Enter your measurements in <strong>{guide.measurementUnit}</strong> and we&apos;ll
                                suggest your closest size. This is an estimate — we recommend checking the chart above.
                              </p>
                              <div className="grid grid-cols-3 gap-3">
                                <div>
                                  <label className="text-[10px] uppercase font-semibold text-charcoal block mb-1">
                                    Bust
                                  </label>
                                  <input
                                    type="number"
                                    value={bust}
                                    onChange={(e) => setBust(e.target.value)}
                                    placeholder="e.g. 34"
                                    className="w-full px-3 py-2.5 rounded-lg bg-offwhite border border-sand text-xs text-charcoal focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal/40"
                                  />
                                </div>
                                <div>
                                  <label className="text-[10px] uppercase font-semibold text-charcoal block mb-1">
                                    Waist
                                  </label>
                                  <input
                                    type="number"
                                    value={waist}
                                    onChange={(e) => setWaist(e.target.value)}
                                    placeholder="e.g. 28"
                                    className="w-full px-3 py-2.5 rounded-lg bg-offwhite border border-sand text-xs text-charcoal focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal/40"
                                  />
                                </div>
                                <div>
                                  <label className="text-[10px] uppercase font-semibold text-charcoal block mb-1">
                                    Hip
                                  </label>
                                  <input
                                    type="number"
                                    value={hip}
                                    onChange={(e) => setHip(e.target.value)}
                                    placeholder="e.g. 36"
                                    className="w-full px-3 py-2.5 rounded-lg bg-offwhite border border-sand text-xs text-charcoal focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal/40"
                                  />
                                </div>
                              </div>
                              <button
                                onClick={calculateRecommendation}
                                className="bg-teal text-champagne px-5 py-2.5 rounded-xl text-xs uppercase font-bold tracking-wider hover:bg-teal-900 transition-all shadow"
                              >
                                Find My Size
                              </button>

                              {recommendation && (
                                <motion.div
                                  initial={{ opacity: 0, y: 8 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className="bg-teal/10 border border-teal/30 rounded-xl p-4 text-center"
                                >
                                  <p className="text-[10px] uppercase tracking-widest text-champagne-700 font-semibold">
                                    Recommended Size
                                  </p>
                                  <p className="font-serif text-3xl font-bold text-teal mt-1">{recommendation}</p>
                                  <p className="text-[10px] text-charcoal-muted mt-1">
                                    This is an estimate. We recommend verifying with the chart above.
                                  </p>
                                </motion.div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </>
              )}

              {!loading && !guide && !error && (
                <div className="text-center py-12">
                  <p className="text-xs text-charcoal-muted">No size guide available for this product.</p>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
