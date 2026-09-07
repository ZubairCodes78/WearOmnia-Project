'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Plus, Edit3, Trash2, ArrowUp, ArrowDown, FolderPlus, Layers } from 'lucide-react';

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
    <div className="admin-workspace space-y-12 text-[#FAF8F5]">
      {/* Categories Header */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#141414] p-6 border border-[#262626] rounded-xl">
          <div>
            <h1 className="text-2xl font-serif text-[#FAF8F5]">Product Categories ({categories.length})</h1>
            <p className="text-xs text-[#A3A3A3] mt-1">Organize products into categories. The storefront displays categories automatically once available.</p>
          </div>
          <button
            onClick={() => openCatModal()}
            className="flex items-center gap-2 bg-[#D4AF37] hover:bg-[#C5A028] text-black px-4 py-2.5 rounded-lg font-medium text-sm transition-colors"
          >
            <Plus className="w-4 h-4" /> Create Category
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((cat, idx) => (
            <div key={cat.id} className="bg-[#141414] border border-[#262626] rounded-xl p-5 space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="relative aspect-[16/9] rounded-lg overflow-hidden bg-[#262626]">
                  {cat.imageUrl ? (
                    <Image src={cat.imageUrl} alt={cat.name} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#525252] text-xs">No Image</div>
                  )}
                </div>
                <div>
                  <h3 className="font-serif font-semibold text-[#FAF8F5] text-lg">{cat.name}</h3>
                  <p className="text-xs text-[#A3A3A3] line-clamp-2 mt-1">{cat.description || 'No description provided.'}</p>
                  <span className="inline-block bg-[#262626] text-[#D4AF37] px-2.5 py-1 rounded-full text-[10px] font-bold mt-2 border border-[#333333]">
                    {cat.products.length} Products Assigned
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-[#262626] pt-3">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleReorderCategory(cat, 'UP')}
                    disabled={idx === 0}
                    className="p-1.5 bg-[#1A1A1A] hover:bg-[#262626] text-[#A3A3A3] rounded disabled:opacity-30"
                    title="Move Up"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleReorderCategory(cat, 'DOWN')}
                    disabled={idx === categories.length - 1}
                    className="p-1.5 bg-[#1A1A1A] hover:bg-[#262626] text-[#A3A3A3] rounded disabled:opacity-30"
                    title="Move Down"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openCatModal(cat)}
                    className="p-2 text-[#A3A3A3] hover:text-[#D4AF37] bg-[#1A1A1A] rounded-lg"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(cat.id)}
                    className="p-2 text-[#A3A3A3] hover:text-red-400 bg-[#1A1A1A] rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Collections Header */}
      <div className="space-y-6 pt-8 border-t border-[#262626]">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#141414] p-6 border border-[#262626] rounded-xl">
          <div>
            <h2 className="text-2xl font-serif text-[#FAF8F5]">Collections ({collections.length})</h2>
            <p className="text-xs text-[#A3A3A3] mt-1">Manage collections and banners.</p>
          </div>
          <button
            onClick={() => openColModal()}
            className="flex items-center gap-2 bg-[#D4AF37] hover:bg-[#C5A028] text-black px-4 py-2.5 rounded-lg font-medium text-sm transition-colors"
          >
            <Plus className="w-4 h-4" /> Create Collection
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {collections.map((col) => (
            <div key={col.id} className="bg-[#141414] border border-[#262626] rounded-xl p-5 flex gap-4 items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-[#262626] shrink-0 border border-[#333333]">
                  {col.bannerUrl ? (
                    <Image src={col.bannerUrl} alt={col.name} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#525252] text-xs">No Banner</div>
                  )}
                </div>
                <div>
                  <h3 className="font-serif font-semibold text-[#FAF8F5] text-lg">{col.name}</h3>
                  <p className="text-xs text-[#A3A3A3] line-clamp-2 mt-1">{col.description || 'No description'}</p>
                  <span className="inline-block bg-[#262626] text-[#D4AF37] px-2.5 py-0.5 rounded-full text-[10px] font-bold mt-2 border border-[#333333]">
                    {col.products.length} Products
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => openColModal(col)}
                  className="p-2 text-[#A3A3A3] hover:text-[#D4AF37] bg-[#1A1A1A] rounded-lg"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteCollection(col.id)}
                  className="p-2 text-[#A3A3A3] hover:text-red-400 bg-[#1A1A1A] rounded-lg"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Category Modal */}
      {catModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#141414] border border-[#262626] rounded-2xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-lg font-serif text-[#FAF8F5]">{editingCat ? 'Edit Category' : 'Create Category'}</h3>
            <form onSubmit={handleSaveCategory} className="space-y-4">
              <div>
                <label className="block text-xs text-[#A3A3A3] uppercase mb-1">Category Name *</label>
                <input
                  type="text"
                  required
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  placeholder="e.g. Velvet Formals"
                  className="w-full bg-[#1A1A1A] border border-[#262626] rounded-lg px-3.5 py-2.5 text-sm text-[#FAF8F5] focus:outline-none focus:border-[#D4AF37]"
                />
              </div>
              <div>
                <label className="block text-xs text-[#A3A3A3] uppercase mb-1">Description</label>
                <textarea
                  rows={2}
                  value={catDescription}
                  onChange={(e) => setCatDescription(e.target.value)}
                  placeholder="Category overview..."
                  className="w-full bg-[#1A1A1A] border border-[#262626] rounded-lg px-3.5 py-2.5 text-sm text-[#FAF8F5] focus:outline-none focus:border-[#D4AF37]"
                />
              </div>
              <div>
                <label className="block text-xs text-[#A3A3A3] uppercase mb-1">Image URL</label>
                <input
                  type="url"
                  value={catImageUrl}
                  onChange={(e) => setCatImageUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-[#1A1A1A] border border-[#262626] rounded-lg px-3.5 py-2.5 text-sm text-[#FAF8F5] focus:outline-none focus:border-[#D4AF37]"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCatModalOpen(false)}
                  className="px-4 py-2 text-sm text-[#A3A3A3] bg-[#1A1A1A] border border-[#262626] rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 text-sm text-black font-semibold bg-[#D4AF37] rounded-lg"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#141414] border border-[#262626] rounded-2xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-lg font-serif text-[#FAF8F5]">{editingCol ? 'Edit Collection' : 'Create Collection'}</h3>
            <form onSubmit={handleSaveCollection} className="space-y-4">
              <div>
                <label className="block text-xs text-[#A3A3A3] uppercase mb-1">Collection Name *</label>
                <input
                  type="text"
                  required
                  value={colName}
                  onChange={(e) => setColName(e.target.value)}
                  placeholder="e.g. Royal Autumn Drop"
                  className="w-full bg-[#1A1A1A] border border-[#262626] rounded-lg px-3.5 py-2.5 text-sm text-[#FAF8F5] focus:outline-none focus:border-[#D4AF37]"
                />
              </div>
              <div>
                <label className="block text-xs text-[#A3A3A3] uppercase mb-1">Description</label>
                <textarea
                  rows={2}
                  value={colDescription}
                  onChange={(e) => setColDescription(e.target.value)}
                  placeholder="Collection notes..."
                  className="w-full bg-[#1A1A1A] border border-[#262626] rounded-lg px-3.5 py-2.5 text-sm text-[#FAF8F5] focus:outline-none focus:border-[#D4AF37]"
                />
              </div>
              <div>
                <label className="block text-xs text-[#A3A3A3] uppercase mb-1">Banner Image URL</label>
                <input
                  type="url"
                  value={colBannerUrl}
                  onChange={(e) => setColBannerUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-[#1A1A1A] border border-[#262626] rounded-lg px-3.5 py-2.5 text-sm text-[#FAF8F5] focus:outline-none focus:border-[#D4AF37]"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setColModalOpen(false)}
                  className="px-4 py-2 text-sm text-[#A3A3A3] bg-[#1A1A1A] border border-[#262626] rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 text-sm text-black font-semibold bg-[#D4AF37] rounded-lg"
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
