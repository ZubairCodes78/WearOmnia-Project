import React from 'react';
import { RotateCcw, ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function ReturnsPolicyPage() {
  return (
    <div className="bg-offwhite min-h-screen py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-10">
        <div className="text-center space-y-2">
          <span className="text-xs uppercase tracking-[0.3em] font-semibold text-champagne-700">
            Hassle-Free Policy
          </span>
          <h1 className="font-serif text-3xl sm:text-5xl font-bold text-teal">Returns & Exchange Policy</h1>
          <p className="text-xs text-charcoal-muted font-sans">7-Day Nationwide Exchange Window Across Pakistan</p>
        </div>

        <div className="bg-sand/60 p-8 rounded-3xl border border-sand shadow-sm space-y-6 text-xs text-charcoal leading-relaxed font-sans">
          <div className="space-y-3">
            <h3 className="font-serif text-xl font-bold text-teal flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-champagne-700" /> 1. 7-Day Exchange Window
            </h3>
            <p>
              WearOMNIA offers a 7-day hassle-free exchange window for size alterations or garment exchanges from the date of package delivery.
            </p>
          </div>

          <div className="space-y-3 pt-4 border-t border-sand">
            <h3 className="font-serif text-xl font-bold text-teal flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-champagne-700" /> 2. Eligibility Criteria
            </h3>
            <ul className="list-disc pl-5 space-y-1 text-charcoal-muted">
              <li>The suit/garment must be unworn, unwashed, and unstitched (if purchased as unstitched lawn).</li>
              <li>All original brand tags, neck cards, and packaging must remain intact.</li>
              <li>Stitched garments with custom modifications requested by customer are non-exchangeable unless defective upon arrival.</li>
            </ul>
          </div>

          <div className="space-y-3 pt-4 border-t border-sand">
            <h3 className="font-serif text-xl font-bold text-teal flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-champagne-700" /> 3. Exchange Procedure
            </h3>
            <p>
              To initiate an exchange, message our WhatsApp Concierge at <strong>03180633323</strong> with your Order Number (#OMNIA-XXXXX) and clear photos of the item. Our team will arrange reverse pickup or provide courier return details.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
