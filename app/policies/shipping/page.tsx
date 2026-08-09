import React from 'react';
import { Truck, Clock, ShieldCheck, MapPin } from 'lucide-react';

export default function ShippingPolicyPage() {
  return (
    <div className="bg-offwhite min-h-screen py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-10">
        <div className="text-center space-y-2">
          <span className="text-xs uppercase tracking-[0.3em] font-semibold text-champagne-700">
            Customer Information
          </span>
          <h1 className="font-serif text-3xl sm:text-5xl font-bold text-teal">Shipping & Delivery Policy</h1>
          <p className="text-xs text-charcoal-muted font-sans">Effective Date: 2026 Season • Nationwide Pakistan Dispatch</p>
        </div>

        <div className="bg-sand/60 p-8 rounded-3xl border border-sand shadow-sm space-y-6 text-xs text-charcoal leading-relaxed font-sans">
          <div className="space-y-3">
            <h3 className="font-serif text-xl font-bold text-teal flex items-center gap-2">
              <Truck className="w-5 h-5 text-champagne-700" /> 1. Dispatch & Delivery Timelines
            </h3>
            <p>
              All WearOMNIA orders are processed and inspected at our main Lahore location before dispatching.
            </p>
            <ul className="list-disc pl-5 space-y-1 text-charcoal-muted">
              <li><strong>Major Cities (Lahore, Karachi, Islamabad, Rawalpindi, Faisalabad):</strong> 2 to 3 Business Days.</li>
              <li><strong>Other Cities & Remote Districts:</strong> 3 to 5 Business Days.</li>
              <li>Orders placed on Sundays or Public Holidays will be processed on the next business day.</li>
            </ul>
          </div>

          <div className="space-y-3 pt-4 border-t border-sand">
            <h3 className="font-serif text-xl font-bold text-teal flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-champagne-700" /> 2. Shipping Charges & Free Delivery
            </h3>
            <p>
              We offer <strong>FREE Cash On Delivery Shipping</strong> across Pakistan on all orders with a subtotal of <strong>Rs. 10,000 or above</strong>.
            </p>
            <p>
              For orders below Rs. 10,000, a standard nationwide delivery fee of <strong>Rs. 250</strong> applies.
            </p>
          </div>

          <div className="space-y-3 pt-4 border-t border-sand">
            <h3 className="font-serif text-xl font-bold text-teal flex items-center gap-2">
              <Clock className="w-5 h-5 text-champagne-700" /> 3. Cash On Delivery (COD) Inspection
            </h3>
            <p>
              Payment must be made in full to the courier representative (TCS or Leopard Courier) prior to opening the sealed outer box. If you suspect tampering or outer envelope damage, please contact our WhatsApp concierge (+92 300 1234567) immediately before accepting delivery.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
