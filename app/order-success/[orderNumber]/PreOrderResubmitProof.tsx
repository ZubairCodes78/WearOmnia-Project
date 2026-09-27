'use client';

import React, { useState } from 'react';
import { Upload, AlertCircle, CheckCircle2, Loader2, Image as ImageIcon } from 'lucide-react';

interface PreOrderResubmitProofProps {
  orderNumber: string;
  customerPhone: string;
  rejectionReason?: string | null;
}

export function PreOrderResubmitProof({
  orderNumber,
  customerPhone,
  rejectionReason,
}: PreOrderResubmitProofProps) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [phone, setPhone] = useState(customerPhone || '');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.type.startsWith('image/')) {
      setError('Please select an image file (PNG, JPG, or WEBP).');
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('Image file must be under 10MB.');
      return;
    }

    setError(null);
    setFile(selectedFile);
    setPreviewUrl(URL.createObjectURL(selectedFile));
  };

  const handleResubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a payment proof screenshot.');
      return;
    }
    if (!phone.trim()) {
      setError('Please confirm your phone number to verify ownership.');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      // 1. Upload screenshot
      const formData = new FormData();
      formData.append('file', file);

      const uploadRes = await fetch('/api/preorder/upload-screenshot', {
        method: 'POST',
        body: formData,
      });

      const uploadData = await uploadRes.json();
      if (!uploadRes.ok || !uploadData.screenshotKey) {
        throw new Error(uploadData.error || 'Failed to upload screenshot');
      }

      // 2. Submit resubmission to order
      const resubmitRes = await fetch('/api/preorder/resubmit-screenshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderNumber,
          phone: phone.trim(),
          screenshotKey: uploadData.screenshotKey,
        }),
      });

      const resubmitData = await resubmitRes.json();
      if (!resubmitRes.ok) {
        throw new Error(resubmitData.error || 'Failed to update order');
      }

      setSuccess('Payment proof resubmitted successfully! Our team is reviewing it.');
      // Refresh page after a delay to show updated status
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (err: any) {
      setError(err?.message || 'Something went wrong. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl p-6 text-center space-y-2 mt-4">
        <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
        <h4 className="font-serif font-bold text-base">Proof Resubmitted!</h4>
        <p className="text-xs text-emerald-700">{success}</p>
      </div>
    );
  }

  return (
    <div className="bg-amber-50/90 border border-amber-300 rounded-2xl p-6 mt-4 text-xs text-amber-950 space-y-4 shadow-sm">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <h4 className="font-serif font-bold text-sm text-amber-900">Payment Verification Issue</h4>
          {rejectionReason ? (
            <p className="mt-1 text-amber-800 font-sans">
              <strong>Admin Note:</strong> &ldquo;{rejectionReason}&rdquo;
            </p>
          ) : (
            <p className="mt-1 text-amber-800">
              Your previous payment proof could not be verified. Please upload a clear transaction receipt or screenshot.
            </p>
          )}
        </div>
      </div>

      <form onSubmit={handleResubmit} className="space-y-3 pt-2 border-t border-amber-200">
        <div>
          <label className="block text-[11px] font-semibold text-amber-900 mb-1">
            Confirm Order Phone Number
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="03XXXXXXXXX"
            required
            className="w-full px-3 py-2 text-xs bg-white border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-charcoal font-mono"
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-amber-900 mb-1">
            New Payment Proof Screenshot
          </label>
          <div className="border-2 border-dashed border-amber-300 hover:border-amber-500 bg-white rounded-xl p-4 text-center cursor-pointer transition-colors relative">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            {previewUrl ? (
              <div className="flex items-center justify-center gap-3">
                <ImageIcon className="w-6 h-6 text-amber-600" />
                <span className="text-xs font-semibold text-charcoal truncate max-w-xs">{file?.name}</span>
                <span className="text-[10px] text-amber-700 bg-amber-100 px-2 py-0.5 rounded">Change</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1.5 text-amber-800">
                <Upload className="w-6 h-6 text-amber-600" />
                <span className="text-xs font-semibold">Click or drag screenshot here</span>
                <span className="text-[10px] text-amber-600">JPG, PNG, or WEBP up to 10MB</span>
              </div>
            )}
          </div>
        </div>

        {error && (
          <p className="text-xs text-red-600 font-medium bg-red-50 p-2.5 rounded-lg border border-red-200">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={isUploading || !file}
          className="w-full bg-teal text-champagne py-3 rounded-xl text-xs uppercase font-bold tracking-wider hover:bg-teal-900 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all shadow"
        >
          {isUploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Submitting Proof...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" /> Resubmit Payment Proof
            </>
          )}
        </button>
      </form>
    </div>
  );
}
