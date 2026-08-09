import React from 'react';

export default function TermsPage() {
  return (
    <div className="bg-offwhite min-h-screen py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-10">
        <div className="text-center space-y-2">
          <span className="text-xs uppercase tracking-[0.3em] font-semibold text-champagne-700">Legal</span>
          <h1 className="font-serif text-3xl sm:text-5xl font-bold text-teal">Terms of Service</h1>
        </div>
        <div className="bg-sand/60 p-8 rounded-3xl border border-sand space-y-4 text-xs text-charcoal leading-relaxed font-sans">
          <p>
            Welcome to WearOMNIA. By browsing or placing an order on our platform, you agree to these terms of service.
          </p>
          <p>
            All garments, embroidery motifs, images, and brand assets are the exclusive intellectual property of WearOMNIA. Prices are quoted in Pakistani Rupees (PKR) and include applicable local taxes.
          </p>
        </div>
      </div>
    </div>
  );
}
