import React from 'react';
import { prisma } from '@/lib/prisma';
import { Ruler, Info } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Size Guide',
  description: 'Find your perfect size with our comprehensive measurement guide for pret, unstitched, kaftans, and more.',
};

export const dynamic = 'force-dynamic';

export default async function SizeGuidePage() {
  const sizeGuides = await prisma.sizeGuide.findMany({
    include: { entries: { orderBy: { displayOrder: 'asc' } } },
    orderBy: { displayOrder: 'asc' },
  });

  return (
    <div className="editorial-page">
      <div className="editorial-container max-w-4xl">
        {/* Header */}
        <div className="editorial-header">
          <div className="w-14 h-14 bg-teal text-champagne rounded-lg flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Ruler className="w-7 h-7" />
          </div>
          <span className="editorial-kicker">
            Measurement Reference
          </span>
          <h1 className="editorial-title">Size Guide</h1>
          <p className="editorial-lede">
            Find the perfect fit with our comprehensive sizing charts. All measurements are approximate and may vary
            slightly between styles. When in between sizes, we recommend sizing up.
          </p>
        </div>

        {sizeGuides.length === 0 ? (
          <div className="editorial-surface text-center py-20">
            <Ruler className="w-10 h-10 text-champagne-700 mx-auto mb-3" />
            <h3 className="font-serif text-xl font-bold text-teal uppercase tracking-tight">Coming Soon.</h3>
            <p className="text-xs text-charcoal-muted mt-2 max-w-sm mx-auto leading-relaxed font-sans">
              We&apos;re making something worth getting dressed for. Need fit advice right now? Reach out on WhatsApp for quick, friendly sizing assistance!
            </p>
          </div>
        ) : (
          <div className="space-y-10">
            {sizeGuides.map((guide) => {
              const columns = JSON.parse(guide.columns) as string[];
              const isUnstitched = guide.productType === 'UNSTITCHED';

              return (
                <section
                  key={guide.id}
                  id={guide.slug}
                  className="editorial-surface overflow-hidden"
                >
                  {/* Section Header */}
                  <div className="p-6 sm:p-8 border-b border-sand bg-sand/30">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-teal text-champagne rounded-xl flex items-center justify-center shrink-0">
                        <Ruler className="w-5 h-5" />
                      </div>
                      <div>
                        <h2 className="font-serif text-xl sm:text-2xl font-bold text-teal">{guide.name}</h2>
                        <p className="text-[10px] uppercase tracking-widest text-champagne-700 font-semibold">
                          Measurements in {guide.measurementUnit}
                        </p>
                      </div>
                    </div>
                    {guide.description && (
                      <p className="text-xs text-charcoal-muted mt-3 leading-relaxed">{guide.description}</p>
                    )}
                  </div>

                  <div className="p-6 sm:p-8 space-y-5">
                    {/* Unstitched notice */}
                    {isUnstitched && (
                      <div className="bg-champagne/20 border border-champagne/50 rounded-xl p-4 flex items-start gap-3">
                        <Info className="w-4 h-4 text-champagne-700 shrink-0 mt-0.5" />
                        <p className="text-xs text-charcoal leading-relaxed">
                          This is an <strong>unstitched product</strong> size guide. Measurements refer to fabric
                          dimensions rather than body measurements.
                        </p>
                      </div>
                    )}

                    {/* Size Table */}
                    {guide.entries.length > 0 && columns.length > 0 ? (
                      <div className="overflow-x-auto">
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
                                  {col}{' '}
                                  <span className="text-[9px] text-charcoal-muted font-normal">
                                    ({guide.measurementUnit})
                                  </span>
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-sand">
                            {guide.entries.map((entry) => {
                              const m = JSON.parse(entry.measurements);
                              return (
                                <tr key={entry.id} className="hover:bg-sand/30 transition-colors">
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
                    ) : (
                      <div className="text-center py-8 bg-sand/40 rounded-2xl">
                        <p className="text-xs text-charcoal-muted">
                          Measurements are being finalized. Contact us for sizing help.
                        </p>
                      </div>
                    )}
                  </div>
                </section>
              );
            })}

            {/* How to Measure Section */}
            <section className="editorial-surface p-6 sm:p-8 space-y-4">
              <h2 className="font-serif text-xl font-bold text-teal">How To Measure</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-charcoal-muted leading-relaxed">
                <div className="space-y-2">
                  <h3 className="font-bold text-teal uppercase text-[11px] tracking-wider">Bust</h3>
                  <p>
                    Measure around the fullest part of your bust, keeping the tape level across your back and under your
                    arms.
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="font-bold text-teal uppercase text-[11px] tracking-wider">Waist</h3>
                  <p>
                    Measure around your natural waistline, which is the narrowest part of your torso, typically just
                    above your navel.
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="font-bold text-teal uppercase text-[11px] tracking-wider">Hip</h3>
                  <p>
                    Measure around the fullest part of your hips, approximately 8 inches below your natural waistline.
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="font-bold text-teal uppercase text-[11px] tracking-wider">Length</h3>
                  <p>
                    Measure from the highest point of the shoulder, down the front, to the desired hem length.
                  </p>
                </div>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
