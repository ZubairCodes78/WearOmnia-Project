'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Plus, Edit3, Trash2, ArrowUp, ArrowDown, FolderPlus, Layers } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminEmptyState } from '@/components/admin/AdminEmptyState';

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  displayOrder: number;
  products: { id: string }[];
}

interface CollectionItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  bannerUrl: string | null;
  displayOrder: number;
  products: { id: string }[];
}

interface CategoriesClientProps {
  initialCategories: CategoryItem[];
  initialCollections: CollectionItem[];
}

export function CategoriesClient({ initialCategories, initialCollections }: CategoriesClientProps) {
  const router = useRouter();
  const [categories, setCategories] = useState<CategoryItem[]>(initialCategories);
  const [collections, setCollections] = useState<CollectionItem[]>(initialCollections);

  // Category Modal State
  const [catModalOpen, setCatModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<CategoryItem | null>(null);
  const [catName, setCatName] = useState('');
  const [catDescription, setCatDescription] = useState('');
  const [catImageUrl, setCatImageUrl] = useState('');

  // Collection Modal State
  const [colModalOpen, setColModalOpen] = useState(false);
  const [editingCol, setEditingCol] = useState<CollectionItem | null>(null);
  const [colName, setColName] = useState('');
  const [colDescription, setColDescription] = useState('');
  const [colBannerUrl, setColBannerUrl] = useState('');

  const [loading, setLoading] = useState(false);

  // Category Actions
  const openCatModal = (cat?: CategoryItem) => {
    if (cat) {
      setEditingCat(cat);
      setCatName(cat.name);
      setCatDescription(cat.description || '');
      setCatImageUrl(cat.imageUrl || '');
    } else {
      setEditingCat(null);
      setCatName('');
      setCatDescription('');
      setCatImageUrl('');
    }
    setCatModalOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName) return;
    setLoading(true);
    try {
      const res = await fetch('/api/admin/categories', {
        method: editingCat ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingCat?.id,
          name: catName,
          description: catDescription,
          imageUrl: catImageUrl,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        if (editingCat) {
          setCategories((prev) => prev.map((c) => (c.id === data.category.id ? { ...c, ...data.category } : c)));
        } else {
          setCategories((prev) => [...prev, { ...data.category, products: [] }]);
        }
        setCatModalOpen(false);
        router.refresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    try {
      const res = await fetch(`/api/admin/categories?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setCategories((prev) => prev.filter((c) => c.id !== id));
        router.refresh();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleReorderCategory = async (cat: CategoryItem, direction: 'UP' | 'DOWN') => {
    const idx = categories.findIndex((c) => c.id === cat.id);
    if ((direction === 'UP' && idx === 0) || (direction === 'DOWN' && idx === categories.length - 1)) return;

    const targetIdx = direction === 'UP' ? idx - 1 : idx + 1;
    const targetCat = categories[targetIdx];

    const newOrder1 = targetCat.displayOrder;
    const newOrder2 = cat.displayOrder;

    try {
      await fetch('/api/admin/categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: cat.id, displayOrder: newOrder1 }),
      });
      await fetch('/api/admin/categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: targetCat.id, displayOrder: newOrder2 }),
      });

      const updated = [...categories];
      updated[idx] = { ...cat, displayOrder: newOrder1 };
      updated[targetIdx] = { ...targetCat, displayOrder: newOrder2 };
      updated.sort((a, b) => a.displayOrder - b.displayOrder);
      setCategories(updated);
      router.refresh();
    } catch (e) {
      console.error(e);
    }
  };

  // Collection Actions
  const openColModal = (col?: CollectionItem) => {
    if (col) {
      setEditingCol(col);
      setColName(col.name);
      setColDescription(col.description || '');
      setColBannerUrl(col.bannerUrl || '');
    } else {
      setEditingCol(null);
      setColName('');
      setColDescription('');
      setColBannerUrl('');
    }
    setColModalOpen(true);
  };

  const handleSaveCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!colName) return;
    setLoading(true);
    try {
      const res = await fetch('/api/admin/collections', {
        method: editingCol ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingCol?.id,
          name: colName,
          description: colDescription,
          bannerUrl: colBannerUrl,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        if (editingCol) {
          setCollections((prev) => prev.map((c) => (c.id === data.collection.id ? { ...c, ...data.collection } : c)));
        } else {
          setCollections((prev) => [...prev, { ...data.collection, products: [] }]);
        }
        setColModalOpen(false);
        router.refresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCollection = async (id: string) => {
    if (!confirm('Are you sure you want to delete this collection?')) return;
    try {
      const res = await fetch(`/api/admin/collections?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setCollections((prev) => prev.filter((c) => c.id !== id));
        router.refresh();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="admin-page space-y-10 text-[#FAF8F5]">
      {/* Categories Header */}
      <div className="space-y-6">
        <AdminPageHeader
          badge="Catalog Architecture"
          title={`Product Categories (${categories.length})`}
          description="Organize luxury garments into structured departments. Categories appear on the storefront navigation."
          actions={
            <button
              onClick={() => openCatModal()}
              className="flex items-center gap-2 bg-[#D4AF37] hover:bg-[#FAF8F5] text-black px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-colors shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Create Category
            </button>
          }
        />

        {categories.length === 0 ? (
          <div className="bg-[#0A2528] rounded-2xl border border-[#D4AF37]/20 p-8 shadow-md">
            <AdminEmptyState
              title="No Categories Configured"
              description="Create your first catalog category to organize your luxury collection."
              icon={FolderPlus}
              action={
                <button
                  onClick={() => openCatModal()}
                  className="px-4 py-2 bg-[#D4AF37] text-black rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer"
                >
                  Create Category
                </button>
              }
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {categories.map((cat, idx) => (
              <div
                key={cat.id}
                className="bg-[#0A2528] border border-white/10 hover:border-[#D4AF37]/35 transition-colors rounded-2xl p-5 space-y-4 flex flex-col justify-between shadow-lg"
              >
                <div className="space-y-3">
                  <div className="relative aspect-[16/9] rounded-xl overflow-hidden bg-[#06191B] border border-[#D4AF37]/20">
                    {cat.imageUrl ? (
                      <Image src={cat.imageUrl} alt={cat.name} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#D4AF37]/40 text-xs">
                        No Preview Image
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-[#FAF8F5] text-base">{cat.name}</h3>
                    <p className="text-xs text-[#FAF8F5]/60 line-clamp-2 mt-1 font-sans">
                      {cat.description || 'No description provided.'}
                    </p>
                    <span className="inline-block bg-[#0D3337] text-[#D4AF37] px-2.5 py-0.5 rounded-full text-[10px] font-bold mt-2.5 border border-[#D4AF37]/30">
                      {cat.products.length} Products Assigned
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-white/10 pt-3">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleReorderCategory(cat, 'UP')}
                      disabled={idx === 0}
                      className="p-1.5 bg-[#06191B] hover:bg-[#103A3E] text-[#D4AF37] rounded-lg border border-[#D4AF37]/20 disabled:opacity-30 cursor-pointer"
                      title="Move Up"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleReorderCategory(cat, 'DOWN')}
                      disabled={idx === categories.length - 1}
                      className="p-1.5 bg-[#06191B] hover:bg-[#103A3E] text-[#D4AF37] rounded-lg border border-[#D4AF37]/20 disabled:opacity-30 cursor-pointer"
                      title="Move Down"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => openCatModal(cat)}
                      className="p-1.5 text-[#FAF8F5]/80 hover:text-[#D4AF37] bg-[#06191B] hover:bg-[#103A3E] rounded-lg border border-white/10 transition-colors cursor-pointer"
                      title="Edit Category"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(cat.id)}
                      className="p-1.5 text-rose-400 hover:text-rose-300 bg-rose-950/40 hover:bg-rose-900/60 rounded-lg border border-rose-800/40 transition-colors cursor-pointer"
                      title="Delete Category"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Collections Header */}
      <div className="space-y-6 pt-8 border-t border-[#D4AF37]/20">
        <AdminPageHeader
          badge="Curated Drops"
          title={`Featured Collections (${collections.length})`}
          description="Curate seasonal drops and lookbook edits with custom hero banners."
          actions={
            <button
              onClick={() => openColModal()}
              className="flex items-center gap-2 bg-[#D4AF37] hover:bg-[#FAF8F5] text-black px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-colors shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Create Collection
            </button>
          }
        />

        {collections.length === 0 ? (
          <div className="bg-[#0A2528] rounded-2xl border border-[#D4AF37]/20 p-8 shadow-md">
            <AdminEmptyState
              title="No Collections Created"
              description="Create seasonal lookbooks and exclusive campaigns."
              icon={Layers}
              action={
                <button
                  onClick={() => openColModal()}
                  className="px-4 py-2 bg-[#D4AF37] text-black rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer"
                >
                  Create Collection
                </button>
              }
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {collections.map((col) => (
              <div
                key={col.id}
                className="bg-[#0A2528] border border-white/10 hover:border-[#D4AF37]/35 transition-colors rounded-2xl p-5 flex gap-4 items-center justify-between shadow-lg"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-[#06191B] shrink-0 border border-[#D4AF37]/20">
                    {col.bannerUrl ? (
                      <Image src={col.bannerUrl} alt={col.name} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#D4AF37]/40 text-xs">
                        No Banner
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-serif font-bold text-[#FAF8F5] text-base truncate">{col.name}</h3>
                    <p className="text-xs text-[#FAF8F5]/60 line-clamp-1 mt-0.5 font-sans">
                      {col.description || 'No description'}
                    </p>
                    <span className="inline-block bg-[#0D3337] text-[#D4AF37] px-2.5 py-0.5 rounded-full text-[10px] font-bold mt-2 border border-[#D4AF37]/30">
                      {col.products.length} Products
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => openColModal(col)}
                    className="p-2 text-[#FAF8F5]/80 hover:text-[#D4AF37] bg-[#06191B] hover:bg-[#103A3E] rounded-lg border border-white/10 transition-colors cursor-pointer"
                    title="Edit Collection"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteCollection(col.id)}
                    className="p-2 text-rose-400 hover:text-rose-300 bg-rose-950/40 hover:bg-rose-900/60 rounded-lg border border-rose-800/40 transition-colors cursor-pointer"
                    title="Delete Collection"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Category Modal */}
      {catModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-[#0A2528] border border-[#D4AF37]/30 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-serif font-bold text-[#FAF8F5]">{editingCat ? 'Edit Category' : 'Create Category'}</h3>
            <form onSubmit={handleSaveCategory} className="space-y-4">
              <div>
                <label className="block text-xs text-[#D4AF37] uppercase font-bold mb-1">Category Name *</label>
                <input
                  type="text"
                  required
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  placeholder="e.g. Velvet Formals"
                  className="w-full bg-[#06191B] border border-[#D4AF37]/25 rounded-xl px-3.5 py-2.5 text-xs text-[#FAF8F5] focus:outline-none focus:border-[#D4AF37] font-sans placeholder-[#FAF8F5]/40"
                />
              </div>
              <div>
                <label className="block text-xs text-[#D4AF37] uppercase font-bold mb-1">Description</label>
                <textarea
                  rows={2}
                  value={catDescription}
                  onChange={(e) => setCatDescription(e.target.value)}
                  placeholder="Category overview..."
                  className="w-full bg-[#06191B] border border-[#D4AF37]/25 rounded-xl px-3.5 py-2.5 text-xs text-[#FAF8F5] focus:outline-none focus:border-[#D4AF37] font-sans placeholder-[#FAF8F5]/40"
                />
              </div>
              <div>
                <label className="block text-xs text-[#D4AF37] uppercase font-bold mb-1">Image URL</label>
                <input
                  type="url"
                  value={catImageUrl}
                  onChange={(e) => setCatImageUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-[#06191B] border border-[#D4AF37]/25 rounded-xl px-3.5 py-2.5 text-xs text-[#FAF8F5] focus:outline-none focus:border-[#D4AF37] font-sans placeholder-[#FAF8F5]/40"
                />
              </div>
              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setCatModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#FAF8F5]/70 bg-[#06191B] hover:bg-[#103A3E] border border-white/10 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 text-xs text-black font-black uppercase tracking-wider bg-[#D4AF37] hover:bg-[#FAF8F5] rounded-xl transition-colors shadow-sm cursor-pointer disabled:opacity-50"
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Collection Modal */}
      {colModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-[#0A2528] border border-[#D4AF37]/30 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-serif font-bold text-[#FAF8F5]">{editingCol ? 'Edit Collection' : 'Create Collection'}</h3>
            <form onSubmit={handleSaveCollection} className="space-y-4">
              <div>
                <label className="block text-xs text-[#D4AF37] uppercase font-bold mb-1">Collection Name *</label>
                <input
                  type="text"
                  required
                  value={colName}
                  onChange={(e) => setColName(e.target.value)}
                  placeholder="e.g. Royal Autumn Drop"
                  className="w-full bg-[#06191B] border border-[#D4AF37]/25 rounded-xl px-3.5 py-2.5 text-xs text-[#FAF8F5] focus:outline-none focus:border-[#D4AF37] font-sans placeholder-[#FAF8F5]/40"
                />
              </div>
              <div>
                <label className="block text-xs text-[#D4AF37] uppercase font-bold mb-1">Description</label>
                <textarea
                  rows={2}
                  value={colDescription}
                  onChange={(e) => setColDescription(e.target.value)}
                  placeholder="Collection notes..."
                  className="w-full bg-[#06191B] border border-[#D4AF37]/25 rounded-xl px-3.5 py-2.5 text-xs text-[#FAF8F5] focus:outline-none focus:border-[#D4AF37] font-sans placeholder-[#FAF8F5]/40"
                />
              </div>
              <div>
                <label className="block text-xs text-[#D4AF37] uppercase font-bold mb-1">Banner Image URL</label>
                <input
                  type="url"
                  value={colBannerUrl}
                  onChange={(e) => setColBannerUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-[#06191B] border border-[#D4AF37]/25 rounded-xl px-3.5 py-2.5 text-xs text-[#FAF8F5] focus:outline-none focus:border-[#D4AF37] font-sans placeholder-[#FAF8F5]/40"
                />
              </div>
              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setColModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#FAF8F5]/70 bg-[#06191B] hover:bg-[#103A3E] border border-white/10 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 text-xs text-black font-black uppercase tracking-wider bg-[#D4AF37] hover:bg-[#FAF8F5] rounded-xl transition-colors shadow-sm cursor-pointer disabled:opacity-50"
                >
                  Save Collection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
