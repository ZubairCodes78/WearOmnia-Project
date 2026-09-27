'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import {
  UploadCloud,
  X,
  Star,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Link as LinkIcon,
  Plus,
} from 'lucide-react';

interface ProductImageUploaderProps {
  images: string[];
  onChange: (images: string[]) => void;
}

interface UploadingItem {
  id: string;
  previewUrl: string;
  fileName: string;
  progress: number;
  error?: string;
}

export function ProductImageUploader({ images, onChange }: ProductImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingList, setUploadingList] = useState<UploadingItem[]>([]);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [manualUrl, setManualUrl] = useState('');
  const [generalError, setGeneralError] = useState('');

  const processFile = async (file: File) => {
    // 1. Validate file type
    const validMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validMimes.includes(file.type.toLowerCase())) {
      setGeneralError(`"${file.name}" is not a supported format. Please select JPEG, PNG, or WebP.`);
      return;
    }

    // 2. Validate size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setGeneralError(`"${file.name}" exceeds the 10MB maximum file size limit.`);
      return;
    }

    const tempId = Math.random().toString(36).substring(7);
    const localPreview = URL.createObjectURL(file);

    setUploadingList((prev) => [
      ...prev,
      {
        id: tempId,
        previewUrl: localPreview,
        fileName: file.name,
        progress: 30,
      },
    ]);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/admin/products/upload-image', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data.success || !data.url) {
        throw new Error(data.error || 'Failed to upload image.');
      }

      // Add permanent URL to list
      onChange([...images, data.url]);

      // Remove from uploading list
      setUploadingList((prev) => prev.filter((item) => item.id !== tempId));
      URL.revokeObjectURL(localPreview);
      setGeneralError('');
    } catch (err: any) {
      setUploadingList((prev) =>
        prev.map((item) =>
          item.id === tempId ? { ...item, error: err.message || 'Upload failed' } : item
        )
      );
    }
  };

  const handleFilesSelected = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setGeneralError('');
    Array.from(files).forEach((file) => processFile(file));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesSelected(e.dataTransfer.files);
    }
  };

  const removeImage = (indexToRemove: number) => {
    const updated = images.filter((_, idx) => idx !== indexToRemove);
    onChange(updated);
  };

  const setPrimary = (indexToPrimary: number) => {
    if (indexToPrimary === 0) return;
    const selected = images[indexToPrimary];
    const remaining = images.filter((_, idx) => idx !== indexToPrimary);
    onChange([selected, ...remaining]);
  };

  const moveImage = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= images.length) return;
    const next = [...images];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    onChange(next);
  };

  const handleAddManualUrl = () => {
    const trimmed = manualUrl.trim();
    if (!trimmed) return;
    onChange([...images, trimmed]);
    setManualUrl('');
    setShowUrlInput(false);
  };

  return (
    <div className="space-y-4">
      {/* ─────────────────────────────────────────────────────────────────────────────
          1. PRIMARY DEVICE UPLOADER DROPZONE (Requirements 53, 54)
      ───────────────────────────────────────────────────────────────────────────── */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-all duration-200 group ${
          isDragging
            ? 'border-[#D4AF37] bg-[#103A3E]/60 shadow-lg'
            : 'border-[#D4AF37]/30 hover:border-[#D4AF37] bg-[#0A2528]/80 hover:bg-[#103A3E]/40'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/jpg"
          multiple
          onChange={(e) => handleFilesSelected(e.target.files)}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-[#06191B] border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] group-hover:scale-105 transition-transform shadow-md">
            <UploadCloud className="w-7 h-7" />
          </div>

          <div className="space-y-1">
            <p className="text-sm font-bold text-[#FAF8F5] tracking-wide">
              Click to choose image or drag &amp; drop from device
            </p>
            <p className="text-xs text-[#FAF8F5]/60">
              High-resolution product garment photography (JPEG, PNG, WebP up to 10MB)
            </p>
          </div>

          <button
            type="button"
            className="mt-1 px-4 py-2 rounded-xl bg-[#D4AF37] text-black text-xs font-black uppercase tracking-wider hover:bg-white transition-all shadow-md pointer-events-none"
          >
            Choose from Device
          </button>
        </div>
      </div>

      {/* General validation error banner */}
      {generalError && (
        <div className="p-3 bg-rose-950/70 border border-rose-700/50 rounded-xl text-xs text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{generalError}</span>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────────
          2. IN-FLIGHT UPLOADING ITEMS (Live progress preview)
      ───────────────────────────────────────────────────────────────────────────── */}
      {uploadingList.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          {uploadingList.map((item) => (
            <div
              key={item.id}
              className="relative aspect-[3/4] rounded-xl overflow-hidden border border-[#D4AF37]/30 bg-[#06191B] flex flex-col justify-end p-2.5 shadow-md"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.previewUrl}
                alt={item.fileName}
                className="absolute inset-0 w-full h-full object-cover opacity-50"
              />
              <div className="relative z-10 space-y-1">
                {item.error ? (
                  <div className="bg-rose-900/90 text-rose-200 text-[10px] p-1.5 rounded-lg flex items-center gap-1 font-bold">
                    <AlertCircle className="w-3 h-3 text-rose-300 shrink-0" />
                    <span className="truncate">{item.error}</span>
                  </div>
                ) : (
                  <div className="bg-black/80 backdrop-blur-xs p-2 rounded-lg space-y-1 border border-white/10">
                    <div className="flex items-center justify-between text-[10px] font-bold text-[#D4AF37]">
                      <span className="flex items-center gap-1">
                        <Loader2 className="w-3 h-3 animate-spin" /> Uploading
                      </span>
                      <span>{item.progress}%</span>
                    </div>
                    <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden">
                      <div
                        className="bg-[#D4AF37] h-full transition-all duration-300"
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────────
          3. GALLERY OF UPLOADED PRODUCT IMAGES (With reordering & primary selection)
      ───────────────────────────────────────────────────────────────────────────── */}
      {images.length > 0 ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-[#D4AF37] font-bold uppercase tracking-wider">
            <span>Uploaded Product Gallery ({images.length})</span>
            <span className="text-[10.5px] text-[#FAF8F5]/50 lowercase">first image is primary cover</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
            {images.map((url, idx) => {
              const isPrimary = idx === 0;

              return (
                <div
                  key={`${url}-${idx}`}
                  className={`group relative aspect-[3/4] rounded-2xl overflow-hidden bg-[#06191B] border transition-all shadow-md ${
                    isPrimary ? 'border-[#D4AF37] ring-2 ring-[#D4AF37]/50' : 'border-[#D4AF37]/25 hover:border-[#D4AF37]/60'
                  }`}
                >
                  <Image
                    src={url}
                    alt={`Product garment view ${idx + 1}`}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
                    className="object-cover object-center group-hover:scale-105 transition-transform duration-300"
                  />

                  {/* Primary Badge */}
                  {isPrimary && (
                    <span className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-full bg-[#D4AF37] text-black text-[9px] font-black uppercase tracking-wider shadow">
                      Cover Image
                    </span>
                  )}

                  {/* Hover Controls Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2 z-20">
                    <div className="flex items-center justify-between">
                      {!isPrimary ? (
                        <button
                          type="button"
                          onClick={() => setPrimary(idx)}
                          className="p-1.5 rounded-lg bg-black/70 hover:bg-[#D4AF37] text-[#D4AF37] hover:text-black transition-colors"
                          title="Set as Primary Cover Image"
                        >
                          <Star className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <div />
                      )}

                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="p-1.5 rounded-lg bg-rose-950/80 hover:bg-rose-900 text-rose-300 transition-colors"
                        title="Remove Image"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Reorder Buttons */}
                    <div className="flex items-center justify-center gap-1.5 bg-black/60 backdrop-blur-xs py-1 px-2 rounded-xl">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => moveImage(idx, idx - 1)}
                        className="p-1 rounded-md text-white hover:text-[#D4AF37] disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Move Left"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-[10px] font-mono text-[#FAF8F5]/70 font-bold">
                        {idx + 1}
                      </span>
                      <button
                        type="button"
                        disabled={idx === images.length - 1}
                        onClick={() => moveImage(idx, idx + 1)}
                        className="p-1 rounded-md text-white hover:text-[#D4AF37] disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Move Right"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <p className="text-xs text-[#FAF8F5]/50 italic text-center py-2">
          No product images added yet. Click above to upload the first cover image.
        </p>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────────
          4. SECONDARY MANUAL URL OPTION (Requirement 55)
      ───────────────────────────────────────────────────────────────────────────── */}
      <div className="pt-2 border-t border-[#D4AF37]/15">
        {!showUrlInput ? (
          <button
            type="button"
            onClick={() => setShowUrlInput(true)}
            className="text-[11px] text-[#D4AF37]/75 hover:text-[#D4AF37] flex items-center gap-1 cursor-pointer underline font-sans"
          >
            <LinkIcon className="w-3 h-3" /> Advanced: Add image via external URL
          </button>
        ) : (
          <div className="flex gap-2 items-center">
            <input
              type="url"
              value={manualUrl}
              onChange={(e) => setManualUrl(e.target.value)}
              placeholder="https://... (external image URL)"
              className="flex-1 bg-[#06191B] border border-[#D4AF37]/25 rounded-xl px-3 py-2 text-xs text-[#FAF8F5] focus:outline-none focus:border-[#D4AF37] font-sans"
            />
            <button
              type="button"
              onClick={handleAddManualUrl}
              disabled={!manualUrl.trim()}
              className="px-3.5 py-2 rounded-xl bg-[#103A3E] text-[#D4AF37] border border-[#D4AF37]/30 text-xs font-bold uppercase hover:bg-[#D4AF37] hover:text-black transition-all disabled:opacity-50 cursor-pointer"
            >
              Add URL
            </button>
            <button
              type="button"
              onClick={() => {
                setShowUrlInput(false);
                setManualUrl('');
              }}
              className="p-2 text-[#FAF8F5]/50 hover:text-[#FAF8F5] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
