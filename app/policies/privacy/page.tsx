import React from 'react';

export default function PrivacyPolicyPage() {
  return (
    <div className="editorial-page">
      <div className="editorial-container max-w-4xl">
        <div className="editorial-header">
          <span className="editorial-kicker">Data Protection</span>
          <h1 className="editorial-title">Privacy Policy</h1>
        </div>
        <div className="editorial-dossier font-sans">
          <p>
            At WearOMNIA, we value customer privacy. Because we operate on a <strong>Guest Checkout Only</strong> model, we only collect information required to fulfill your Cash On Delivery orders across Pakistan (Full Name, Delivery Address, Phone Number).
          </p>
          <p>
            We never store passwords, credit card credentials, or personal tracking cookies for third-party resale. Your contact info is strictly used for order dispatch, courier coordination, and WhatsApp delivery notifications.
          </p>
        </div>
      </div>
    </div>
  );
}
