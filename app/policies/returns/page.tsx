import React from 'react';
import { RotateCcw, ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function ReturnsPolicyPage() {
  return (
    <div className="editorial-page">
      <div className="editorial-container max-w-4xl">
        <div className="editorial-header">
          <span className="editorial-kicker">
            Hassle-Free Policy
          </span>
          <h1 className="editorial-title">Returns & Exchange Policy</h1>
          <p className="text-xs text-charcoal-muted font-sans">7-Day Nationwide Exchange Window Across Pakistan</p>
        </div>

        <div className="editorial-dossier font-sans">
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
              To initiate an exchange, message our WhatsApp Support at <strong>03180633323</strong> or email <a href="mailto:wearomniaa@gmail.com" className="underline font-bold">wearomniaa@gmail.com</a> with your Order Number (#OMNIA-XXXXX) and clear photos of the item. Our team will arrange reverse pickup or provide courier return details.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
