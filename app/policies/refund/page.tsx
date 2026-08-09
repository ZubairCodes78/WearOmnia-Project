import React from 'react';
import { Banknote, ShieldCheck } from 'lucide-react';

export default function RefundPolicyPage() {
  return (
    <div className="bg-offwhite min-h-screen py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-10">
        <div className="text-center space-y-2">
          <span className="text-xs uppercase tracking-[0.3em] font-semibold text-champagne-700">
            Terms & Assurance
          </span>
          <h1 className="font-serif text-3xl sm:text-5xl font-bold text-teal">Refund & Financial Guidelines</h1>
          <p className="text-xs text-charcoal-muted font-sans">Clear, Transparent Cash On Delivery Terms</p>
        </div>

        <div className="bg-sand/60 p-8 rounded-3xl border border-sand shadow-sm space-y-6 text-xs text-charcoal leading-relaxed font-sans">
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
