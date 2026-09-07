'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Plus, Search, Trash2, Edit3, Copy, Eye, EyeOff, Package, X, Check, Image as ImageIcon, Layers } from 'lucide-react';

interface ProductImage {
  id?: string;
  url: string;
  isPrimary?: boolean;
}

interface ProductVariant {
  id?: string;
  size: string;
  color: string;
  colorHex?: string | null;
  stock: number;
  sku?: string;
}

interface CategoryOption {
  id: string;
  name: string;
}

interface CollectionOption {
  id: string;
  name: string;
}

interface Product {
  id: string;
  title: string;
  slug: string;
  description: string;
  fabricDetails?: string | null;
  careInstructions?: string | null;
  basePrice: number;
  discountPrice?: number | null;
  sku: string;
  barcode?: string | null;
  status: string; // DRAFT or PUBLISHED
  stockQuantity: number;
  inStock: boolean;
  isFeatured: boolean;
  isNewArrival: boolean;
  isBestSeller: boolean;
  isSignature: boolean;
  categoryId?: string | null;
  collectionId?: string | null;
  images: ProductImage[];
  variants: ProductVariant[];
  category?: { name: string } | null;
  collection?: { name: string } | null;
  createdAt: Date;
}

interface ProductsClientProps {
  initialProducts: Product[];
  categories?: CategoryOption[];
  collections?: CollectionOption[];
}

const DEFAULT_IMAGE = '/images/kaftan-1.jpg';

export function ProductsClient({ initialProducts, categories = [], collections = [] }: ProductsClientProps) {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Add / Edit Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formBasePrice, setFormBasePrice] = useState('');
  const [formDiscountPrice, setFormDiscountPrice] = useState('');
  const [formSku, setFormSku] = useState('');
  const [formBarcode, setFormBarcode] = useState('');
  const [formStock, setFormStock] = useState('25');
  const [formStatus, setFormStatus] = useState('PUBLISHED');
  const [formDescription, setFormDescription] = useState('');
  const [formFabric, setFormFabric] = useState('');
  const [formCare, setFormCare] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formCollection, setFormCollection] = useState('');
  const [formImages, setFormImages] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [formVariants, setFormVariants] = useState<{ size: string; color: string; stock: number }[]>([
    { size: 'S', color: 'Black', stock: 10 },
    { size: 'M', color: 'Black', stock: 10 },
    { size: 'L', color: 'Black', stock: 5 },
  ]);
  const [formSizeGuide, setFormSizeGuide] = useState('');
  const [sizeGuideOptions, setSizeGuideOptions] = useState<{ id: string; name: string }[]>([]);

  // Fetch size guides for the dropdown
  React.useEffect(() => {
    fetch('/api/admin/size-guides')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setSizeGuideOptions(data.map((g: any) => ({ id: g.id, name: g.name })));
        }
      })
      .catch(() => { });
  }, []);

  const openCreateModal = () => {
    setEditingProduct(null);
    setFormTitle('');
    setFormBasePrice('');
    setFormDiscountPrice('');
    setFormSku(`OMN-${Math.floor(1000 + Math.random() * 9000)}`);
    setFormBarcode('');
    setFormStock('25');
    setFormStatus('PUBLISHED');
    setFormDescription('');
    setFormFabric('100% Raw Silk & Pure Organza');
    setFormCare('Dry Clean Only. Handcrafted with delicacy.');
    setFormCategory(categories[0]?.id || '');
    setFormCollection(collections[0]?.id || '');
    setFormImages([DEFAULT_IMAGE]);
    setFormVariants([
      { size: 'S', color: 'Black', stock: 10 },
      { size: 'M', color: 'Black', stock: 10 },
      { size: 'L', color: 'Black', stock: 5 },
    ]);
    setFormSizeGuide('');
    setErrorMessage('');
    setModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormTitle(product.title);
    setFormBasePrice(product.basePrice.toString());
    setFormDiscountPrice(product.discountPrice ? product.discountPrice.toString() : '');
    setFormSku(product.sku);
    setFormBarcode(product.barcode || '');
    setFormStock(product.stockQuantity.toString());
    setFormStatus(product.status || 'PUBLISHED');
    setFormDescription(product.description || '');
    setFormFabric(product.fabricDetails || '');
    setFormCare(product.careInstructions || '');
    setFormCategory(product.categoryId || '');
    setFormCollection(product.collectionId || '');
    setFormImages(product.images.map((img) => img.url));
    setFormVariants(
      product.variants.map((v) => ({ size: v.size, color: v.color, stock: v.stock }))
    );
    setFormSizeGuide((product as any).sizeGuideId || '');
    setErrorMessage('');
    setModalOpen(true);
  };

  const handleAddImage = () => {
    if (!newImageUrl.trim()) return;
    setFormImages((prev) => [...prev, newImageUrl.trim()]);
    setNewImageUrl('');
  };

  const handleRemoveImage = (index: number) => {
    setFormImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddVariantRow = () => {
    setFormVariants((prev) => [...prev, { size: 'XL', color: 'Black', stock: 5 }]);
  };

  const handleRemoveVariantRow = (index: number) => {
    setFormVariants((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!formTitle || !formBasePrice || !formSku) {
      setErrorMessage('Please fill in product title, base price, and SKU');
      return;
    }

    setSubmitting(true);

    const payload = {
      id: editingProduct?.id,
      title: formTitle,
      basePrice: parseFloat(formBasePrice),
      discountPrice: formDiscountPrice ? parseFloat(formDiscountPrice) : null,
      sku: formSku,
      barcode: formBarcode || null,
      status: formStatus,
      stockQuantity: parseInt(formStock || '25'),
      description: formDescription || formTitle,
      fabricDetails: formFabric,
      careInstructions: formCare,
      categoryId: formCategory || null,
      collectionId: formCollection || null,
      sizeGuideId: formSizeGuide || null,
      images: formImages.length > 0 ? formImages : [DEFAULT_IMAGE],
      variants: formVariants,
    };

    try {
      const res = await fetch('/api/admin/products', {
        method: editingProduct ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || 'Failed to save product');
      } else {
        if (editingProduct) {
          setProducts((prev) => prev.map((p) => (p.id === data.product.id ? data.product : p)));
        } else {
          setProducts((prev) => [data.product, ...prev]);
        }
        setModalOpen(false);
        router.refresh();
      }
    } catch (err) {
      setErrorMessage('Network error saving product');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (product: Product) => {
    const newStatus = product.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
    try {
      const res = await fetch('/api/admin/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: product.id, status: newStatus }),
      });
      if (res.ok) {
        setProducts((prev) => prev.map((p) => (p.id === product.id ? { ...p, status: newStatus } : p)));
        router.refresh();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDuplicateProduct = async (id: string) => {
    try {
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'DUPLICATE', id }),
      });
      const data = await res.json();
      if (res.ok && data.product) {
        setProducts((prev) => [data.product, ...prev]);
        router.refresh();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      const res = await fetch('/api/admin/products', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setProducts((prev) => prev.filter((p) => p.id !== id));
        router.refresh();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="admin-page text-[#FAF8F5] font-sans">
      {/* Header Bar */}
      <div className="admin-page-header">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[#D4AF37] font-bold mb-1">Luxury Catalog</p>
          <h1 className="text-2xl font-serif font-bold tracking-wide text-[#FAF8F5]">Product Inventory</h1>
          <p className="text-xs text-[#FAF8F5]/60 mt-1 font-sans">Manage luxury garments, pricing, stock quantities, size variants, and SEO</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 bg-[#D4AF37] hover:bg-white text-black px-5 py-2.5 rounded-xl font-extrabold text-xs uppercase tracking-wider transition-all shadow-xl btn-3d shrink-0"
        >
          <Plus className="w-4 h-4" /> Add New Product
        </button>
      </div>

      {/* Search & Status Filter */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-[#0A2528] p-5 border border-[#D4AF37]/25 rounded-2xl shadow-xl admin-card-3d">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#D4AF37]" />
          <input
            type="text"
            placeholder="Search by title, SKU, category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#06191B] border border-[#D4AF37]/20 rounded-xl pl-10 pr-4 py-2.5 text-xs text-[#FAF8F5] placeholder-[#FAF8F5]/40 focus:outline-none focus:border-[#D4AF37] font-sans"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {['ALL', 'PUBLISHED', 'DRAFT'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all btn-3d ${
                statusFilter === st
                  ? 'bg-[#D4AF37] text-black border-[#D4AF37] shadow-md'
                  : 'bg-[#06191B] text-[#FAF8F5]/70 border-[#D4AF37]/20 hover:border-[#D4AF37]/50'
              }`}
            >
              {st === 'ALL' ? 'All Products' : st === 'PUBLISHED' ? 'Published' : 'Draft'}
            </button>
          ))}
        </div>
      </div>

      {/* Product List Table */}
      <div className="admin-table-wrapper">
        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th className="py-4 px-6">Product Garment</th>
                <th className="py-4 px-4">SKU Code</th>
                <th className="py-4 px-4">Price</th>
                <th className="py-4 px-4">Available Stock</th>
                <th className="py-4 px-4">Store Visibility</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D4AF37]/10">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-[#FAF8F5]/50">
                    No products found. Click &quot;Add New Product&quot; to add your first luxury piece.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const primaryImage = p.images.find((img) => img.isPrimary)?.url || p.images[0]?.url || DEFAULT_IMAGE;
                  return (
                    <tr key={p.id} className="hover:bg-[#103A3E]/40 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3.5">
                          <div className="relative w-12 h-16 rounded-xl overflow-hidden bg-[#06191B] flex-shrink-0 border border-[#D4AF37]/30 shadow-md">
                            <Image src={primaryImage} alt={p.title} fill className="object-cover" />
                          </div>
                          <div>
                            <p className="font-semibold text-[#FAF8F5] line-clamp-1">{p.title}</p>
                            <span className="text-xs text-[#D4AF37]/80">{p.category?.name || 'Uncategorized'}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 font-mono text-xs text-[#D4AF37] font-bold">{p.sku}</td>
                      <td className="py-4 px-4">
                        <div className="flex flex-col">
                          <span className="font-bold font-mono text-[#FAF8F5]">Rs. {p.basePrice.toLocaleString()}</span>
                          {p.discountPrice && (
                            <span className="text-xs text-rose-400 line-through font-mono">Rs. {p.discountPrice.toLocaleString()}</span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border badge-3d ${
                            p.stockQuantity > 5
                              ? 'bg-emerald-950/70 text-emerald-300 border-emerald-500/40'
                              : p.stockQuantity > 0
                                ? 'bg-amber-950/70 text-amber-300 border-amber-500/40'
                                : 'bg-rose-950/70 text-rose-300 border-rose-500/40'
                          }`}
                        >
                          <Package className="w-3 h-3" />
                          {p.stockQuantity} in stock
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <button
                          onClick={() => handleToggleStatus(p)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all border badge-3d ${
                            p.status === 'PUBLISHED'
                              ? 'bg-emerald-950/70 text-emerald-300 border-emerald-500/40 hover:bg-emerald-900/80'
                              : 'bg-zinc-900/80 text-zinc-400 border-zinc-700 hover:bg-zinc-800'
                          }`}
                        >
                          {p.status === 'PUBLISHED' ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                          {p.status === 'PUBLISHED' ? 'Published' : 'Draft'}
                        </button>
                      </td>
                      <td className="py-4 px-6 text-right whitespace-nowrap">
                        <div className="admin-action-group">
                          <button
                            onClick={() => openEditModal(p)}
                            title="Edit Product"
                            className="admin-btn border-[#D4AF37]/30 text-[#FAF8F5]/80 hover:text-[#D4AF37] hover:bg-[#103A3E] p-2"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDuplicateProduct(p.id)}
                            title="Duplicate Product"
                            className="admin-btn border-cyan-500/30 text-[#FAF8F5]/80 hover:text-cyan-400 hover:bg-[#103A3E] p-2"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(p.id)}
                            title="Delete Product"
                            className="admin-btn border-rose-500/30 text-[#FAF8F5]/80 hover:text-rose-400 hover:bg-rose-950/40 p-2"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
          <div className="bg-[#0A2528] border border-[#D4AF37]/35 rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 shadow-2xl admin-card-3d">
            <div className="flex justify-between items-center border-b border-[#D4AF37]/20 pb-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[#D4AF37] font-bold">Garment Configuration</p>
                <h2 className="text-xl font-serif font-bold text-[#FAF8F5]">
                  {editingProduct ? `Edit: ${editingProduct.title}` : 'Add New Garment to Catalog'}
                </h2>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-2 text-[#FAF8F5]/60 hover:text-white rounded-xl hover:bg-[#103A3E] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMessage && (
              <div className="p-3.5 bg-rose-950/80 border border-rose-500/30 rounded-xl text-rose-300 text-xs font-semibold">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSaveProduct} className="space-y-6">
              {/* Basic Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-[#D4AF37] font-bold uppercase tracking-wider mb-1.5">Product Title *</label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="e.g. Royal Emerald Embroidered Kaftan"
                    className="w-full bg-[#06191B] border border-[#D4AF37]/25 rounded-xl px-4 py-3 text-xs text-[#FAF8F5] placeholder-[#FAF8F5]/30 focus:outline-none focus:border-[#D4AF37] font-sans"
                  />
                </div>

                <div>
                  <label className="block text-xs text-[#D4AF37] font-bold uppercase tracking-wider mb-1.5">SKU (Stock Identifier) *</label>
                  <input
                    type="text"
                    required
                    value={formSku}
                    onChange={(e) => setFormSku(e.target.value)}
                    placeholder="e.g. OMN-9081"
                    className="w-full bg-[#06191B] border border-[#D4AF37]/25 rounded-xl px-4 py-3 text-xs text-[#FAF8F5] placeholder-[#FAF8F5]/30 focus:outline-none focus:border-[#D4AF37] font-mono"
                  />
                </div>
              </div>

              {/* Pricing & Stock */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-[#D4AF37] font-bold uppercase tracking-wider mb-1.5">Retail Price (PKR) *</label>
                  <input
                    type="number"
                    required
                    value={formBasePrice}
                    onChange={(e) => setFormBasePrice(e.target.value)}
                    placeholder="18500"
                    className="w-full bg-[#06191B] border border-[#D4AF37]/25 rounded-xl px-4 py-3 text-xs text-[#FAF8F5] placeholder-[#FAF8F5]/30 focus:outline-none focus:border-[#D4AF37] font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs text-[#D4AF37] font-bold uppercase tracking-wider mb-1.5">Discount Price (PKR)</label>
                  <input
                    type="number"
                    value={formDiscountPrice}
                    onChange={(e) => setFormDiscountPrice(e.target.value)}
                    placeholder="Optional (e.g. 15990)"
                    className="w-full bg-[#06191B] border border-[#D4AF37]/25 rounded-xl px-4 py-3 text-xs text-[#FAF8F5] placeholder-[#FAF8F5]/30 focus:outline-none focus:border-[#D4AF37] font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs text-[#D4AF37] font-bold uppercase tracking-wider mb-1.5">Stock Units *</label>
                  <input
                    type="number"
                    required
                    value={formStock}
                    onChange={(e) => setFormStock(e.target.value)}
                    placeholder="25"
                    className="w-full bg-[#06191B] border border-[#D4AF37]/25 rounded-xl px-4 py-3 text-xs text-[#FAF8F5] placeholder-[#FAF8F5]/30 focus:outline-none focus:border-[#D4AF37] font-mono"
                  />
                </div>
              </div>

              {/* Category, Collection & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-[#D4AF37] font-bold uppercase tracking-wider mb-1.5">Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full bg-[#06191B] border border-[#D4AF37]/25 rounded-xl px-4 py-3 text-xs text-[#FAF8F5] focus:outline-none focus:border-[#D4AF37]"
                  >
                    <option value="">Select Category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-[#D4AF37] font-bold uppercase tracking-wider mb-1.5">Collection</label>
                  <select
                    value={formCollection}
                    onChange={(e) => setFormCollection(e.target.value)}
                    className="w-full bg-[#06191B] border border-[#D4AF37]/25 rounded-xl px-4 py-3 text-xs text-[#FAF8F5] focus:outline-none focus:border-[#D4AF37]"
                  >
                    <option value="">Select Collection</option>
                    {collections.map((col) => (
                      <option key={col.id} value={col.id}>
                        {col.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-[#D4AF37] font-bold uppercase tracking-wider mb-1.5">Size Guide</label>
                  <select
                    value={formSizeGuide}
                    onChange={(e) => setFormSizeGuide(e.target.value)}
                    className="w-full bg-[#06191B] border border-[#D4AF37]/25 rounded-xl px-4 py-3 text-xs text-[#FAF8F5] focus:outline-none focus:border-[#D4AF37]"
                  >
                    <option value="">Standard Size Guide</option>
                    {sizeGuideOptions.map((sg) => (
                      <option key={sg.id} value={sg.id}>
                        {sg.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-[#D4AF37] font-bold uppercase tracking-wider mb-1.5">Store Visibility</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                    className="w-full bg-[#06191B] border border-[#D4AF37]/25 rounded-xl px-4 py-3 text-xs text-[#FAF8F5] focus:outline-none focus:border-[#D4AF37]"
                  >
                    <option value="PUBLISHED">Published (Visible to Customers)</option>
                    <option value="DRAFT">Draft (Hidden from Store)</option>
                  </select>
                </div>
              </div>

              {/* Description & Details */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-[#D4AF37] font-bold uppercase tracking-wider mb-1.5">Description & SEO Text</label>
                  <textarea
                    rows={3}
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Enter detailed description for customer and search engines..."
                    className="w-full bg-[#06191B] border border-[#D4AF37]/25 rounded-xl px-4 py-3 text-xs text-[#FAF8F5] placeholder-[#FAF8F5]/30 focus:outline-none focus:border-[#D4AF37] font-sans"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-[#D4AF37] font-bold uppercase tracking-wider mb-1.5">Fabric & Craftsmanship Details</label>
                    <input
                      type="text"
                      value={formFabric}
                      onChange={(e) => setFormFabric(e.target.value)}
                      placeholder="e.g. 100% Pure Raw Silk with Gold Zardozi Embroidery"
                      className="w-full bg-[#06191B] border border-[#D4AF37]/25 rounded-xl px-4 py-3 text-xs text-[#FAF8F5] placeholder-[#FAF8F5]/30 focus:outline-none focus:border-[#D4AF37] font-sans"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-[#D4AF37] font-bold uppercase tracking-wider mb-1.5">Care Instructions</label>
                    <input
                      type="text"
                      value={formCare}
                      onChange={(e) => setFormCare(e.target.value)}
                      placeholder="e.g. Dry Clean Only"
                      className="w-full bg-[#06191B] border border-[#D4AF37]/25 rounded-xl px-4 py-3 text-xs text-[#FAF8F5] placeholder-[#FAF8F5]/30 focus:outline-none focus:border-[#D4AF37] font-sans"
                    />
                  </div>
                </div>
              </div>

              {/* Product Images Manager */}
              <div className="space-y-3 bg-[#06191B] p-5 rounded-2xl border border-[#D4AF37]/20">
                <label className="block text-xs font-bold text-[#D4AF37] uppercase tracking-wider">Product Image Gallery</label>

                <div className="flex gap-2">
                  <input
                    type="url"
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    placeholder="Paste image URL (https://...)"
                    className="flex-1 bg-[#0A2528] border border-[#D4AF37]/25 rounded-xl px-4 py-2.5 text-xs text-[#FAF8F5] placeholder-[#FAF8F5]/30 focus:outline-none focus:border-[#D4AF37]"
                  />
                  <button
                    type="button"
                    onClick={handleAddImage}
                    className="bg-[#103A3E] hover:bg-[#D4AF37] hover:text-black text-[#D4AF37] border border-[#D4AF37]/30 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all btn-3d"
                  >
                    Add Image
                  </button>
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 pt-2">
                  {formImages.map((url, idx) => (
                    <div key={idx} className="relative group rounded-xl overflow-hidden border border-[#D4AF37]/30 bg-black aspect-[3/4] shadow-md">
                      <Image src={url} alt={`Gallery ${idx}`} fill className="object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="absolute top-1 right-1 p-1 bg-rose-600/90 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                      {idx === 0 && (
                        <span className="absolute bottom-1 left-1 right-1 bg-[#D4AF37] text-black text-[9px] font-extrabold text-center py-0.5 rounded uppercase tracking-wider">
                          Primary
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Product Variants Manager */}
              <div className="space-y-3 bg-[#06191B] p-5 rounded-2xl border border-[#D4AF37]/20">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-bold text-[#D4AF37] uppercase tracking-wider">Sizes & Color Variants</label>
                  <button
                    type="button"
                    onClick={handleAddVariantRow}
                    className="text-xs text-[#D4AF37] hover:underline font-bold"
                  >
                    + Add Variant Option
                  </button>
                </div>

                <div className="space-y-2">
                  {formVariants.map((varItem, idx) => (
                    <div key={idx} className="flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-3">
                      <input
                        type="text"
                        placeholder="Size (e.g. S, M, L)"
                        value={varItem.size}
                        onChange={(e) => {
                          const updated = [...formVariants];
                          updated[idx].size = e.target.value;
                          setFormVariants(updated);
                        }}
                        className="w-24 bg-[#0A2528] border border-[#D4AF37]/25 rounded-xl px-3 py-2 text-xs text-[#FAF8F5]"
                      />
                      <input
                        type="text"
                        placeholder="Color (e.g. Emerald)"
                        value={varItem.color}
                        onChange={(e) => {
                          const updated = [...formVariants];
                          updated[idx].color = e.target.value;
                          setFormVariants(updated);
                        }}
                        className="w-32 bg-[#0A2528] border border-[#D4AF37]/25 rounded-xl px-3 py-2 text-xs text-[#FAF8F5]"
                      />
                      <input
                        type="number"
                        placeholder="Stock"
                        value={varItem.stock}
                        onChange={(e) => {
                          const updated = [...formVariants];
                          updated[idx].stock = parseInt(e.target.value || '0');
                          setFormVariants(updated);
                        }}
                        className="w-24 bg-[#0A2528] border border-[#D4AF37]/25 rounded-xl px-3 py-2 text-xs text-[#FAF8F5]"
                      />
                      {formVariants.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveVariantRow(idx)}
                          className="p-1.5 text-rose-400 hover:text-rose-300 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-3 border-t border-[#D4AF37]/20 pt-4">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-5 py-2.5 text-xs uppercase font-bold text-[#FAF8F5]/70 hover:text-white bg-[#06191B] border border-[#D4AF37]/20 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 text-xs uppercase tracking-wider text-black font-extrabold bg-[#D4AF37] hover:bg-white rounded-xl transition-all shadow-xl disabled:opacity-50 btn-3d"
                >
                  {submitting ? 'Saving Garment...' : editingProduct ? 'Save Changes' : 'Publish to Store'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
