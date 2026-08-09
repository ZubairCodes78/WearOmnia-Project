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
      <div className="p-8 text-center">
        <div className="w-8 h-8 border-2 border-teal border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-gray-500 mt-3">Loading size guides...</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-teal text-champagne rounded-xl flex items-center justify-center">
            <Ruler className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-serif text-2xl font-bold text-teal">Size Guides</h1>
            <p className="text-xs text-gray-500">Manage sizing charts for your products</p>
          </div>
        </div>
        {!isCreating && (
          <button
            onClick={startCreate}
            className="bg-teal text-champagne px-5 py-2.5 rounded-xl text-xs uppercase font-bold tracking-wider hover:bg-teal-900 transition-all shadow flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> New Size Guide
          </button>
        )}
      </div>

      {/* Status Messages */}
      {error && (
        <div className="bg-red-50 text-red-700 border border-red-200 p-3 rounded-xl mb-6 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 text-green-700 border border-green-200 p-3 rounded-xl mb-6 text-xs flex items-center gap-2">
          <Check className="w-4 h-4 shrink-0" /> {success}
        </div>
      )}

      {/* Create/Edit Form */}
      {isCreating && (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-lg p-6 mb-8 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-lg font-bold text-teal">
              {editingGuide ? 'Edit Size Guide' : 'Create New Size Guide'}
            </h2>
            <button
              onClick={resetForm}
              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Basic Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] uppercase font-semibold text-gray-600 block mb-1">Name *</label>
              <input
                type="text"
                value={formName}
                onChange={(e) => {
                  setFormName(e.target.value);
                  if (!editingGuide) setFormSlug(generateSlug(e.target.value));
                }}
                placeholder="e.g. Pret Collection"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-teal/20"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase font-semibold text-gray-600 block mb-1">Slug *</label>
              <input
                type="text"
                value={formSlug}
                onChange={(e) => setFormSlug(e.target.value)}
                placeholder="e.g. pret-collection"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-teal/20 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] uppercase font-semibold text-gray-600 block mb-1">Description</label>
            <textarea
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              rows={2}
              placeholder="Optional intro text shown to customers..."
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-teal/20 resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-[10px] uppercase font-semibold text-gray-600 block mb-1">Product Type</label>
              <select
                value={formProductType}
                onChange={(e) => handleProductTypeChange(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-teal/20"
              >
                {PRODUCT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] uppercase font-semibold text-gray-600 block mb-1">Unit</label>
              <select
                value={formUnit}
                onChange={(e) => setFormUnit(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-teal/20"
              >
                {MEASUREMENT_UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formIsDefault}
                  onChange={(e) => setFormIsDefault(e.target.checked)}
                  className="accent-teal rounded"
                />
                <span className="text-xs font-semibold text-gray-700">Set as Default</span>
              </label>
            </div>
          </div>

          {/* Column Management */}
          <div>
            <label className="text-[10px] uppercase font-semibold text-gray-600 block mb-2">
              Measurement Columns
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {formColumns.map((col) => (
                <span
                  key={col}
                  className="bg-teal/10 text-teal px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5"
                >
                  {col}
                  <button
                    onClick={() => removeColumn(col)}
                    className="text-red-500 hover:text-red-700"
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
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-teal/20"
              />
              <button
                onClick={addColumn}
                className="bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg text-xs font-semibold transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Size Entries */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-[10px] uppercase font-semibold text-gray-600">Size Entries</label>
              <div className="flex gap-2">
                {formEntries.length === 0 && (
                  <button
                    onClick={addDefaultSizes}
                    className="text-xs text-teal font-semibold hover:underline"
                  >
                    + Add Default Sizes (XS–XL)
                  </button>
                )}
                <button
                  onClick={addSizeEntry}
                  className="text-xs text-teal font-semibold hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Add Size
                </button>
              </div>
            </div>

            {formEntries.length > 0 && (
              <div className="space-y-3">
                {/* Table header */}
                <div className="hidden sm:grid gap-2 text-[10px] uppercase font-bold text-gray-500 tracking-wider" style={{ gridTemplateColumns: `40px 80px ${formColumns.map(() => '1fr').join(' ')} 120px 60px` }}>
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
                    className="grid gap-2 items-center bg-gray-50 p-2 rounded-xl border border-gray-100"
                    style={{ gridTemplateColumns: `40px 80px ${formColumns.map(() => '1fr').join(' ')} 120px 60px` }}
                  >
                    {/* Reorder */}
                    <div className="flex flex-col gap-0.5">
                      <button
                        onClick={() => moveSizeEntry(idx, 'up')}
                        disabled={idx === 0}
                        className="text-gray-400 hover:text-teal disabled:opacity-30"
                      >
                        <ChevronUp className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => moveSizeEntry(idx, 'down')}
                        disabled={idx === formEntries.length - 1}
                        className="text-gray-400 hover:text-teal disabled:opacity-30"
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
                      className="px-2 py-1.5 border border-gray-200 rounded text-xs font-bold focus:outline-none focus:ring-1 focus:ring-teal/20"
                    />

                    {/* Measurements */}
                    {formColumns.map((col) => (
                      <input
                        key={col}
                        type="text"
                        value={entry.measurements[col] || ''}
                        onChange={(e) => updateMeasurement(idx, col, e.target.value)}
                        placeholder={col}
                        className="px-2 py-1.5 border border-gray-200 rounded text-xs font-mono focus:outline-none focus:ring-1 focus:ring-teal/20"
                      />
                    ))}

                    {/* Notes */}
                    <input
                      type="text"
                      value={entry.notes}
                      onChange={(e) => updateEntry(idx, 'notes', e.target.value)}
                      placeholder="Note"
                      className="px-2 py-1.5 border border-gray-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-teal/20"
                    />

                    {/* Delete */}
                    <button
                      onClick={() => removeSizeEntry(idx)}
                      className="text-red-400 hover:text-red-600 mx-auto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Save */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-teal text-champagne px-6 py-3 rounded-xl text-xs uppercase font-bold tracking-wider hover:bg-teal-900 transition-all shadow flex items-center gap-2 disabled:opacity-60"
            >
              <Save className="w-4 h-4" /> {saving ? 'Saving...' : editingGuide ? 'Update Guide' : 'Create Guide'}
            </button>
            <button
              onClick={resetForm}
              className="bg-gray-100 text-gray-700 px-6 py-3 rounded-xl text-xs uppercase font-bold tracking-wider hover:bg-gray-200 transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Existing Guides List */}
      {!isCreating && guides.length === 0 && (
        <div className="text-center py-16 bg-gray-50 rounded-2xl border border-gray-200">
          <Ruler className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <h3 className="font-serif text-lg text-gray-600">No Size Guides Yet</h3>
          <p className="text-xs text-gray-400 mt-1">Create your first size guide to help customers find their perfect fit.</p>
        </div>
      )}

      {!isCreating && guides.length > 0 && (
        <div className="space-y-4">
          {guides.map((guide) => {
            const cols = JSON.parse(guide.columns) as string[];
            const isExpanded = expandedGuide === guide.id;

            return (
              <div key={guide.id} className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                {/* Guide Header */}
                <div
                  className="p-4 sm:p-5 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => setExpandedGuide(isExpanded ? null : guide.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-teal/10 text-teal rounded-lg flex items-center justify-center shrink-0">
                      <Ruler className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-serif font-bold text-teal text-sm">{guide.name}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[9px] uppercase tracking-wider bg-gray-100 px-2 py-0.5 rounded font-semibold text-gray-600">
                          {guide.productType}
                        </span>
                        <span className="text-[9px] text-gray-400">{guide.measurementUnit}</span>
                        <span className="text-[9px] text-gray-400">• {guide.entries.length} sizes</span>
                        {guide._count && (
                          <span className="text-[9px] text-gray-400">• {guide._count.products} products</span>
                        )}
                        {guide.isDefault && (
                          <span className="text-[9px] uppercase bg-teal text-champagne px-2 py-0.5 rounded font-bold">
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
                      className="p-2 text-gray-400 hover:text-teal rounded-lg hover:bg-gray-100 transition-colors"
                      title="Edit"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(guide.id);
                      }}
                      className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <ChevronDown
                      className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    />
                  </div>
                </div>

                {/* Expanded Table Preview */}
                {isExpanded && guide.entries.length > 0 && (
                  <div className="border-t border-gray-100 p-4 overflow-x-auto">
                    <table className="w-full text-xs min-w-[400px]">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-2 px-2 font-bold text-gray-600 uppercase text-[10px]">Size</th>
                          {cols.map((col) => (
                            <th key={col} className="text-center py-2 px-2 font-bold text-gray-600 uppercase text-[10px]">
                              {col}
                            </th>
                          ))}
                          <th className="text-left py-2 px-2 font-bold text-gray-600 uppercase text-[10px]">Notes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {guide.entries.map((entry) => {
                          const m = JSON.parse(entry.measurements);
                          return (
                            <tr key={entry.id}>
                              <td className="py-2 px-2 font-bold text-teal">{entry.sizeName}</td>
                              {cols.map((col) => (
                                <td key={col} className="text-center py-2 px-2 font-mono text-gray-700">
                                  {m[col] || '—'}
                                </td>
                              ))}
                              <td className="py-2 px-2 text-gray-500">{entry.notes || '—'}</td>
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
