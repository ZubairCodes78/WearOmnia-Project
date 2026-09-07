import React from 'react';
import { Banknote, ShieldCheck } from 'lucide-react';

export default function RefundPolicyPage() {
  return (
    <div className="editorial-page">
      <div className="editorial-container max-w-4xl">
        <div className="editorial-header">
          <span className="editorial-kicker">
            Terms & Assurance
          </span>
          <h1 className="editorial-title">Refund & Financial Guidelines</h1>
          <p className="text-xs text-charcoal-muted font-sans">Clear, Transparent Cash On Delivery Terms</p>
        </div>

        <div className="editorial-dossier font-sans">
          <div className="space-y-3">
            <h3 className="font-serif text-xl font-bold text-teal flex items-center gap-2">
              <Banknote className="w-5 h-5 text-champagne-700" /> 1. Cash On Delivery Refunds
            </h3>
            <p>
              As all purchases are completed via Cash On Delivery, eligible refunds for defective items or canceled orders prior to dispatch are processed via online bank transfer, EasyPaisa, or JazzCash to the customer's verified phone number/bank within 3 to 5 business days.
            </p>
          </div>

          <div className="space-y-3 pt-4 border-t border-sand">
            <h3 className="font-serif text-xl font-bold text-teal flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-champagne-700" /> 2. Store Credit & Replacements
            </h3>
            <p>
              Alternatively, customers may opt for store credit coupons of equal value for immediate use on future WearOMNIA luxury releases.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
