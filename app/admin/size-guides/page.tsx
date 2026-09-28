'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Ruler,
  Plus,
  Pencil,
  Trash2,
  Save,
  X,
  GripVertical,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Check,
} from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminEmptyState } from '@/components/admin/AdminEmptyState';

interface SizeEntry {
  sizeName: string;
  measurements: Record<string, string>;
  notes: string;
}

interface SizeGuide {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  productType: string;
  measurementUnit: string;
  columns: string;
  isDefault: boolean;
  displayOrder: number;
  entries: {
    id: string;
    sizeName: string;
    measurements: string;
    notes: string | null;
    displayOrder: number;
  }[];
  _count?: { products: number };
}

const PRODUCT_TYPES = ['STITCHED'];
const MEASUREMENT_UNITS = ['inches', 'cm'];

const DEFAULT_STITCHED_COLUMNS = ['Bust', 'Waist', 'Hip', 'Length'];
const DEFAULT_SIZES = ['XS', 'S', 'M', 'L', 'XL'];

export default function AdminSizeGuidesPage() {
  const [guides, setGuides] = useState<SizeGuide[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingGuide, setEditingGuide] = useState<SizeGuide | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state
  const [formName, setFormName] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formProductType, setFormProductType] = useState('STITCHED');
  const [formUnit, setFormUnit] = useState('inches');
  const [formColumns, setFormColumns] = useState<string[]>(['Bust', 'Waist', 'Hip', 'Length']);
  const [formIsDefault, setFormIsDefault] = useState(false);
  const [formEntries, setFormEntries] = useState<SizeEntry[]>([]);
  const [newColumnName, setNewColumnName] = useState('');
  const [expandedGuide, setExpandedGuide] = useState<string | null>(null);

  const fetchGuides = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/size-guides');
      if (res.ok) {
        const data = await res.json();
        setGuides(data);
      }
    } catch {
      setError('Failed to load size guides');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGuides();
  }, [fetchGuides]);

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  };

  const resetForm = () => {
    setFormName('');
    setFormSlug('');
    setFormDescription('');
    setFormProductType('STITCHED');
    setFormUnit('inches');
    setFormColumns(['Bust', 'Waist', 'Hip', 'Length']);
    setFormIsDefault(false);
    setFormEntries([]);
    setNewColumnName('');
    setEditingGuide(null);
    setIsCreating(false);
    setError('');
    setSuccess('');
  };

  const startCreate = () => {
    resetForm();
    setIsCreating(true);
  };

  const startEdit = (guide: SizeGuide) => {
    const cols = JSON.parse(guide.columns) as string[];
    setFormName(guide.name);
    setFormSlug(guide.slug);
    setFormDescription(guide.description || '');
    setFormProductType(guide.productType);
    setFormUnit(guide.measurementUnit);
    setFormColumns(cols);
    setFormIsDefault(guide.isDefault);
    setFormEntries(
      guide.entries.map((e) => ({
        sizeName: e.sizeName,
        measurements: JSON.parse(e.measurements),
        notes: e.notes || '',
      }))
    );
    setEditingGuide(guide);
    setIsCreating(true);
  };

  const handleProductTypeChange = (type: string) => {
    setFormProductType(type);
    setFormColumns(DEFAULT_STITCHED_COLUMNS);
    
    // Reset entry measurements to match new columns
    setFormEntries((prev) =>
      prev.map((e) => ({
        ...e,
        measurements: DEFAULT_STITCHED_COLUMNS.reduce(
          (acc, col) => ({ ...acc, [col]: '' }),
          {} as Record<string, string>
        ),
      }))
    );
  };

  const addColumn = () => {
    if (newColumnName.trim() && !formColumns.includes(newColumnName.trim())) {
      setFormColumns([...formColumns, newColumnName.trim()]);
      setFormEntries((prev) =>
        prev.map((e) => ({
          ...e,
          measurements: { ...e.measurements, [newColumnName.trim()]: '' },
        }))
      );
      setNewColumnName('');
    }
  };

  const removeColumn = (col: string) => {
    setFormColumns((prev) => prev.filter((c) => c !== col));
    setFormEntries((prev) =>
      prev.map((e) => {
        const newM = { ...e.measurements };
        delete newM[col];
        return { ...e, measurements: newM };
      })
    );
  };

  const addSizeEntry = () => {
    const emptyMeasurements = formColumns.reduce(
      (acc, col) => ({ ...acc, [col]: '' }),
      {} as Record<string, string>
    );
    setFormEntries([...formEntries, { sizeName: '', measurements: emptyMeasurements, notes: '' }]);
  };

  const addDefaultSizes = () => {
    const emptyMeasurements = formColumns.reduce(
      (acc, col) => ({ ...acc, [col]: '' }),
      {} as Record<string, string>
    );
    const newEntries = DEFAULT_SIZES.map((sz) => ({
      sizeName: sz,
      measurements: { ...emptyMeasurements },
      notes: '',
    }));
    setFormEntries(newEntries);
  };

  const removeSizeEntry = (idx: number) => {
    setFormEntries((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateEntry = (idx: number, field: string, value: string) => {
    setFormEntries((prev) =>
      prev.map((e, i) => (i === idx ? { ...e, [field]: value } : e))
    );
  };

  const updateMeasurement = (entryIdx: number, col: string, value: string) => {
    setFormEntries((prev) =>
      prev.map((e, i) =>
        i === entryIdx ? { ...e, measurements: { ...e.measurements, [col]: value } } : e
      )
    );
  };

  const moveSizeEntry = (idx: number, direction: 'up' | 'down') => {
    const newEntries = [...formEntries];
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= newEntries.length) return;
    [newEntries[idx], newEntries[swapIdx]] = [newEntries[swapIdx], newEntries[idx]];
    setFormEntries(newEntries);
  };

  const handleSave = async () => {
    if (!formName || !formSlug || formColumns.length === 0) {
      setError('Name, slug, and at least one measurement column are required.');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        id: editingGuide?.id,
        name: formName,
        slug: formSlug,
        description: formDescription || null,
        productType: formProductType,
        measurementUnit: formUnit,
        columns: formColumns,
        isDefault: formIsDefault,
        displayOrder: editingGuide?.displayOrder || guides.length,
        entries: formEntries.map((e) => ({
          sizeName: e.sizeName,
          measurements: e.measurements,
          notes: e.notes || null,
        })),
      };

      const method = editingGuide ? 'PUT' : 'POST';
      const res = await fetch('/api/admin/size-guides', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to save');
        return;
      }

      setSuccess(editingGuide ? 'Size guide updated!' : 'Size guide created!');
      await fetchGuides();
      setTimeout(() => {
        resetForm();
      }, 1500);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this size guide? Products using it will be unlinked.')) return;

    try {
      const res = await fetch(`/api/admin/size-guides?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setSuccess('Size guide deleted.');
        await fetchGuides();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch {
      setError('Failed to delete');
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center">
        <div className="w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-[#FAF8F5]/60 mt-3 font-sans">Loading size guides...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <AdminPageHeader
        title="Size Guides"
        description="Manage sizing charts, measurements, and fit specifications for your products."
        badge={
          <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] font-semibold text-[#D4AF37] bg-[#D4AF37]/10 px-2.5 py-1 rounded-md border border-[#D4AF37]/20">
            <Ruler className="w-3.5 h-3.5 text-[#D4AF37]" /> Sizing Architecture
          </span>
        }
        actions={
          !isCreating ? (
            <button
              onClick={startCreate}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#D4AF37] text-black font-semibold text-xs uppercase tracking-wider hover:bg-[#c49f2f] transition-colors"
            >
              <Plus className="w-4 h-4" /> New Size Guide
            </button>
          ) : undefined
        }
      />

      {/* Status Messages */}
      {error && (
        <div className="bg-rose-500/10 text-rose-300 border border-rose-500/20 p-3 rounded-lg text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}
      {success && (
        <div className="bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 p-3 rounded-lg text-xs flex items-center gap-2">
          <Check className="w-4 h-4 shrink-0" /> {success}
        </div>
      )}

      {/* Create/Edit Form */}
      {isCreating && (
        <div className="bg-[#0A2528] border border-white/5 rounded-xl shadow-sm p-6 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-white/5">
            <h2 className="font-semibold text-base text-[#FAF8F5]">
              {editingGuide ? 'Edit Size Guide' : 'Create New Size Guide'}
            </h2>
            <button
              onClick={resetForm}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[#FAF8F5]/70 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Basic Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] uppercase font-semibold text-[#FAF8F5]/60 block mb-1">Name *</label>
              <input
                type="text"
                value={formName}
                onChange={(e) => {
                  setFormName(e.target.value);
                  if (!editingGuide) setFormSlug(generateSlug(e.target.value));
                }}
                placeholder="e.g. Pret Collection"
                className="w-full px-3 py-2 bg-[#06191B] border border-white/10 rounded-lg text-xs text-[#FAF8F5] focus:outline-none focus:border-[#D4AF37]/50"
              />
            </div>
            <div>
              <label className="text-[11px] uppercase font-semibold text-[#FAF8F5]/60 block mb-1">Slug *</label>
              <input
                type="text"
                value={formSlug}
                onChange={(e) => setFormSlug(e.target.value)}
                placeholder="e.g. pret-collection"
                className="w-full px-3 py-2 bg-[#06191B] border border-white/10 rounded-lg text-xs text-[#FAF8F5] focus:outline-none focus:border-[#D4AF37]/50 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] uppercase font-semibold text-[#FAF8F5]/60 block mb-1">Description</label>
            <textarea
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              rows={2}
              placeholder="Optional intro text shown to customers..."
              className="w-full px-3 py-2 bg-[#06191B] border border-white/10 rounded-lg text-xs text-[#FAF8F5] focus:outline-none focus:border-[#D4AF37]/50 resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-[11px] uppercase font-semibold text-[#FAF8F5]/60 block mb-1">Product Type</label>
              <select
                value={formProductType}
                onChange={(e) => handleProductTypeChange(e.target.value)}
                className="w-full px-3 py-2 bg-[#06191B] border border-white/10 rounded-lg text-xs text-[#FAF8F5] focus:outline-none focus:border-[#D4AF37]/50"
              >
                {PRODUCT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[11px] uppercase font-semibold text-[#FAF8F5]/60 block mb-1">Unit</label>
              <select
                value={formUnit}
                onChange={(e) => setFormUnit(e.target.value)}
                className="w-full px-3 py-2 bg-[#06191B] border border-white/10 rounded-lg text-xs text-[#FAF8F5] focus:outline-none focus:border-[#D4AF37]/50"
              >
                {MEASUREMENT_UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer pb-2">
                <input
                  type="checkbox"
                  checked={formIsDefault}
                  onChange={(e) => setFormIsDefault(e.target.checked)}
                  className="accent-[#D4AF37] rounded"
                />
                <span className="text-xs font-semibold text-[#FAF8F5]/80">Set as Default</span>
              </label>
            </div>
          </div>

          {/* Column Management */}
          <div>
            <label className="text-[11px] uppercase font-semibold text-[#FAF8F5]/60 block mb-2">
              Measurement Columns
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {formColumns.map((col) => (
                <span
                  key={col}
                  className="bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20 px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1.5"
                >
                  {col}
                  <button
                    onClick={() => removeColumn(col)}
                    className="text-rose-400 hover:text-rose-300"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newColumnName}
                onChange={(e) => setNewColumnName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addColumn()}
                placeholder="Add column name..."
                className="flex-1 px-3 py-1.5 bg-[#06191B] border border-white/10 rounded-lg text-xs text-[#FAF8F5] focus:outline-none focus:border-[#D4AF37]/50"
              />
              <button
                onClick={addColumn}
                className="bg-white/5 hover:bg-white/10 text-[#FAF8F5] border border-white/10 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Size Entries */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-[11px] uppercase font-semibold text-[#FAF8F5]/60">Size Entries</label>
              <div className="flex gap-3">
                {formEntries.length === 0 && (
                  <button
                    onClick={addDefaultSizes}
                    className="text-xs text-[#D4AF37] font-semibold hover:underline"
                  >
                    + Add Default Sizes (XS–XL)
                  </button>
                )}
                <button
                  onClick={addSizeEntry}
                  className="text-xs text-[#D4AF37] font-semibold hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Add Size
                </button>
              </div>
            </div>

            {formEntries.length > 0 && (
              <div className="space-y-2">
                {/* Table header */}
                <div className="hidden sm:grid gap-2 text-[10px] uppercase font-semibold text-[#FAF8F5]/50 tracking-wider px-2" style={{ gridTemplateColumns: `40px 80px ${formColumns.map(() => '1fr').join(' ')} 120px 40px` }}>
                  <span></span>
                  <span>Size</span>
                  {formColumns.map((col) => (
                    <span key={col}>{col}</span>
                  ))}
                  <span>Notes</span>
                  <span></span>
                </div>

                {formEntries.map((entry, idx) => (
                  <div
                    key={idx}
                    className="grid gap-2 items-center bg-[#06191B] p-2 rounded-lg border border-white/5"
                    style={{ gridTemplateColumns: `40px 80px ${formColumns.map(() => '1fr').join(' ')} 120px 40px` }}
                  >
                    {/* Reorder */}
                    <div className="flex flex-col gap-0.5">
                      <button
                        onClick={() => moveSizeEntry(idx, 'up')}
                        disabled={idx === 0}
                        className="text-[#FAF8F5]/40 hover:text-[#D4AF37] disabled:opacity-20"
                      >
                        <ChevronUp className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => moveSizeEntry(idx, 'down')}
                        disabled={idx === formEntries.length - 1}
                        className="text-[#FAF8F5]/40 hover:text-[#D4AF37] disabled:opacity-20"
                      >
                        <ChevronDown className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Size name */}
                    <input
                      type="text"
                      value={entry.sizeName}
                      onChange={(e) => updateEntry(idx, 'sizeName', e.target.value)}
                      placeholder="e.g. M"
                      className="px-2 py-1 bg-black/40 border border-white/10 rounded text-xs font-semibold text-[#FAF8F5] focus:outline-none focus:border-[#D4AF37]/50"
                    />

                    {/* Measurements */}
                    {formColumns.map((col) => (
                      <input
                        key={col}
                        type="text"
                        value={entry.measurements[col] || ''}
                        onChange={(e) => updateMeasurement(idx, col, e.target.value)}
                        placeholder={col}
                        className="px-2 py-1 bg-black/40 border border-white/10 rounded text-xs font-mono text-[#FAF8F5] focus:outline-none focus:border-[#D4AF37]/50"
                      />
                    ))}

                    {/* Notes */}
                    <input
                      type="text"
                      value={entry.notes}
                      onChange={(e) => updateEntry(idx, 'notes', e.target.value)}
                      placeholder="Note"
                      className="px-2 py-1 bg-black/40 border border-white/10 rounded text-xs text-[#FAF8F5] focus:outline-none focus:border-[#D4AF37]/50"
                    />

                    {/* Delete */}
                    <button
                      onClick={() => removeSizeEntry(idx)}
                      className="text-rose-400 hover:text-rose-300 mx-auto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Save */}
          <div className="flex gap-2 pt-4 border-t border-white/5">
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-[#D4AF37] hover:bg-[#c49f2f] text-black px-4 py-2 rounded-lg text-xs uppercase font-semibold tracking-wider transition-colors shadow flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" /> {saving ? 'Saving...' : editingGuide ? 'Update Guide' : 'Create Guide'}
            </button>
            <button
              onClick={resetForm}
              className="bg-white/5 hover:bg-white/10 text-[#FAF8F5]/80 px-4 py-2 rounded-lg text-xs uppercase font-semibold tracking-wider transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Existing Guides List */}
      {!isCreating && guides.length === 0 && (
        <AdminEmptyState
          icon={Ruler}
          title="No Size Guides Yet"
          description="Create your first size guide to help customers find their perfect fit."
          action={{
            label: 'New Size Guide',
            onClick: startCreate,
          }}
        />
      )}

      {!isCreating && guides.length > 0 && (
        <div className="space-y-3">
          {guides.map((guide) => {
            const cols = JSON.parse(guide.columns) as string[];
            const isExpanded = expandedGuide === guide.id;

            return (
              <div key={guide.id} className="bg-[#0A2528] border border-white/5 rounded-xl shadow-sm overflow-hidden">
                {/* Guide Header */}
                <div
                  className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/[0.02] transition-colors"
                  onClick={() => setExpandedGuide(isExpanded ? null : guide.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#D4AF37]/10 text-[#D4AF37] rounded-lg flex items-center justify-center shrink-0">
                      <Ruler className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-medium text-[#FAF8F5] text-sm">{guide.name}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] uppercase tracking-wider bg-white/5 px-2 py-0.5 rounded font-semibold text-[#FAF8F5]/70">
                          {guide.productType}
                        </span>
                        <span className="text-[11px] text-[#FAF8F5]/50">{guide.measurementUnit}</span>
                        <span className="text-[11px] text-[#FAF8F5]/50">• {guide.entries.length} sizes</span>
                        {guide._count && (
                          <span className="text-[11px] text-[#FAF8F5]/50">• {guide._count.products} products</span>
                        )}
                        {guide.isDefault && (
                          <span className="text-[10px] uppercase bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30 px-2 py-0.5 rounded font-semibold">
                            Default
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        startEdit(guide);
                      }}
                      className="p-1.5 text-[#FAF8F5]/60 hover:text-[#D4AF37] rounded-lg hover:bg-white/5 transition-colors"
                      title="Edit"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(guide.id);
                      }}
                      className="p-1.5 text-[#FAF8F5]/60 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <ChevronDown
                      className={`w-4 h-4 text-[#FAF8F5]/40 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    />
                  </div>
                </div>

                {/* Expanded Table Preview */}
                {isExpanded && guide.entries.length > 0 && (
                  <div className="border-t border-white/5 p-4 overflow-x-auto bg-[#06191B]/50">
                    <table className="w-full text-xs min-w-[400px]">
                      <thead>
                        <tr className="border-b border-white/5 text-[#FAF8F5]/60">
                          <th className="text-left py-2 px-3 font-semibold uppercase text-[10px]">Size</th>
                          {cols.map((col) => (
                            <th key={col} className="text-center py-2 px-3 font-semibold uppercase text-[10px]">
                              {col}
                            </th>
                          ))}
                          <th className="text-left py-2 px-3 font-semibold uppercase text-[10px]">Notes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-[#FAF8F5]">
                        {guide.entries.map((entry) => {
                          const m = JSON.parse(entry.measurements);
                          return (
                            <tr key={entry.id} className="hover:bg-white/[0.02]">
                              <td className="py-2.5 px-3 font-semibold text-[#D4AF37]">{entry.sizeName}</td>
                              {cols.map((col) => (
                                <td key={col} className="text-center py-2.5 px-3 font-mono text-[#FAF8F5]/80">
                                  {m[col] || '—'}
                                </td>
                              ))}
                              <td className="py-2.5 px-3 text-[#FAF8F5]/50">{entry.notes || '—'}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
