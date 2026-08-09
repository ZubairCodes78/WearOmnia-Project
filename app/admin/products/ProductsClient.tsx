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

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=800&auto=format&fit=crop';

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
      .catch(() => {});
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
    <div className="space-y-6 text-[#FAF8F5] font-sans">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#141414] p-6 border border-[#262626] rounded-xl">
        <div>
          <h1 className="text-2xl font-serif tracking-wide text-[#FAF8F5]">Product Catalog</h1>
          <p className="text-xs text-[#A3A3A3] mt-1">Manage luxury garments, prices, stock, variants, and SEO</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 bg-[#D4AF37] hover:bg-[#C5A028] text-black px-4 py-2.5 rounded-lg font-medium text-sm transition-colors shadow-lg shadow-[#D4AF37]/10"
        >
          <Plus className="w-4 h-4" /> Add New Product
        </button>
      </div>

      {/* Search & Status Filter */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-[#141414] p-4 border border-[#262626] rounded-xl">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A3A3A3]" />
          <input
            type="text"
            placeholder="Search title, SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#1A1A1A] border border-[#262626] rounded-lg pl-9 pr-4 py-2 text-sm text-[#FAF8F5] placeholder-[#525252] focus:outline-none focus:border-[#D4AF37]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {['ALL', 'PUBLISHED', 'DRAFT'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                statusFilter === st
                  ? 'bg-[#D4AF37] text-black border-[#D4AF37]'
                  : 'bg-[#1A1A1A] text-[#A3A3A3] border-[#262626] hover:border-[#404040]'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Product List Table */}
      <div className="bg-[#141414] border border-[#262626] rounded-xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-[#A3A3A3]">
            <thead className="bg-[#1A1A1A] text-xs uppercase tracking-wider text-[#737373] border-b border-[#262626]">
              <tr>
                <th className="py-4 px-6">Product</th>
                <th className="py-4 px-4">SKU</th>
                <th className="py-4 px-4">Price</th>
                <th className="py-4 px-4">Stock</th>
                <th className="py-4 px-4">Status</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#262626]">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#737373]">
                    No products found. Click "Add New Product" to create one.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const primaryImage = p.images.find((img) => img.isPrimary)?.url || p.images[0]?.url || DEFAULT_IMAGE;
                  return (
                    <tr key={p.id} className="hover:bg-[#1A1A1A]/60 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="relative w-12 h-16 rounded-md overflow-hidden bg-[#262626] flex-shrink-0 border border-[#333333]">
                            <Image src={primaryImage} alt={p.title} fill className="object-cover" />
                          </div>
                          <div>
                            <p className="font-medium text-[#FAF8F5] line-clamp-1">{p.title}</p>
                            <span className="text-xs text-[#737373]">{p.category?.name || 'Uncategorized'}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 font-mono text-xs text-[#D4AF37]">{p.sku}</td>
                      <td className="py-4 px-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-[#FAF8F5]">Rs. {p.basePrice.toLocaleString()}</span>
                          {p.discountPrice && (
                            <span className="text-xs text-red-400 line-through">Rs. {p.discountPrice.toLocaleString()}</span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                            p.stockQuantity > 5
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : p.stockQuantity > 0
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              : 'bg-red-500/10 text-red-400 border-red-500/20'
                          }`}
                        >
                          <Package className="w-3 h-3" />
                          {p.stockQuantity} in stock
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <button
                          onClick={() => handleToggleStatus(p)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold uppercase tracking-wider transition-colors border ${
                            p.status === 'PUBLISHED'
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/30'
                              : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:bg-zinc-700'
                          }`}
                        >
                          {p.status === 'PUBLISHED' ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                          {p.status || 'DRAFT'}
                        </button>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(p)}
                            title="Edit Product"
                            className="p-2 text-[#A3A3A3] hover:text-[#D4AF37] hover:bg-[#262626] rounded-lg transition-colors"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDuplicateProduct(p.id)}
                            title="Duplicate Product"
                            className="p-2 text-[#A3A3A3] hover:text-blue-400 hover:bg-[#262626] rounded-lg transition-colors"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(p.id)}
                            title="Delete Product"
                            className="p-2 text-[#A3A3A3] hover:text-red-400 hover:bg-[#262626] rounded-lg transition-colors"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-[#141414] border border-[#262626] rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="flex justify-between items-center border-b border-[#262626] pb-4">
              <h2 className="text-xl font-serif text-[#FAF8F5]">
                {editingProduct ? `Edit Product: ${editingProduct.title}` : 'Add New Luxury Product'}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="p-2 text-[#A3A3A3] hover:text-white rounded-lg hover:bg-[#262626]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMessage && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSaveProduct} className="space-y-6">
              {/* Basic Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-[#A3A3A3] uppercase mb-1">Product Title *</label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="e.g. Royal Emerald Embroidered Kaftan"
                    className="w-full bg-[#1A1A1A] border border-[#262626] rounded-lg px-3.5 py-2.5 text-sm text-[#FAF8F5] focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div>
                  <label className="block text-xs text-[#A3A3A3] uppercase mb-1">SKU (Unique Code) *</label>
                  <input
                    type="text"
                    required
                    value={formSku}
                    onChange={(e) => setFormSku(e.target.value)}
                    placeholder="e.g. OMN-9081"
                    className="w-full bg-[#1A1A1A] border border-[#262626] rounded-lg px-3.5 py-2.5 text-sm text-[#FAF8F5] focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
              </div>

              {/* Pricing & Stock */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-[#A3A3A3] uppercase mb-1">Base Price (PKR) *</label>
                  <input
                    type="number"
                    required
                    value={formBasePrice}
                    onChange={(e) => setFormBasePrice(e.target.value)}
                    placeholder="18500"
                    className="w-full bg-[#1A1A1A] border border-[#262626] rounded-lg px-3.5 py-2.5 text-sm text-[#FAF8F5] focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div>
                  <label className="block text-xs text-[#A3A3A3] uppercase mb-1">Sale / Discount Price (PKR)</label>
                  <input
                    type="number"
                    value={formDiscountPrice}
                    onChange={(e) => setFormDiscountPrice(e.target.value)}
                    placeholder="Optional (e.g. 15990)"
                    className="w-full bg-[#1A1A1A] border border-[#262626] rounded-lg px-3.5 py-2.5 text-sm text-[#FAF8F5] focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div>
                  <label className="block text-xs text-[#A3A3A3] uppercase mb-1">Stock Quantity *</label>
                  <input
                    type="number"
                    required
                    value={formStock}
                    onChange={(e) => setFormStock(e.target.value)}
                    placeholder="25"
                    className="w-full bg-[#1A1A1A] border border-[#262626] rounded-lg px-3.5 py-2.5 text-sm text-[#FAF8F5] focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
              </div>

              {/* Category, Collection & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-[#A3A3A3] uppercase mb-1">Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full bg-[#1A1A1A] border border-[#262626] rounded-lg px-3.5 py-2.5 text-sm text-[#FAF8F5] focus:outline-none focus:border-[#D4AF37]"
                  >
                    <option value="">No Category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-[#A3A3A3] uppercase mb-1">Collection</label>
                  <select
                    value={formCollection}
                    onChange={(e) => setFormCollection(e.target.value)}
                    className="w-full bg-[#1A1A1A] border border-[#262626] rounded-lg px-3.5 py-2.5 text-sm text-[#FAF8F5] focus:outline-none focus:border-[#D4AF37]"
                  >
                    <option value="">No Collection</option>
                    {collections.map((col) => (
                      <option key={col.id} value={col.id}>
                        {col.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-[#A3A3A3] uppercase mb-1">Size Guide</label>
                  <select
                    value={formSizeGuide}
                    onChange={(e) => setFormSizeGuide(e.target.value)}
                    className="w-full bg-[#1A1A1A] border border-[#262626] rounded-lg px-3.5 py-2.5 text-sm text-[#FAF8F5] focus:outline-none focus:border-[#D4AF37]"
                  >
                    <option value="">Default Size Guide</option>
                    {sizeGuideOptions.map((sg) => (
                      <option key={sg.id} value={sg.id}>
                        {sg.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-[#A3A3A3] uppercase mb-1">Visibility Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                    className="w-full bg-[#1A1A1A] border border-[#262626] rounded-lg px-3.5 py-2.5 text-sm text-[#FAF8F5] focus:outline-none focus:border-[#D4AF37]"
                  >
                    <option value="PUBLISHED">Published (Visible)</option>
                    <option value="DRAFT">Draft (Hidden)</option>
                  </select>
                </div>
              </div>

              {/* Description & Details */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-[#A3A3A3] uppercase mb-1">Description & SEO Text</label>
                  <textarea
                    rows={3}
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Enter detailed description for customer and search engines..."
                    className="w-full bg-[#1A1A1A] border border-[#262626] rounded-lg px-3.5 py-2.5 text-sm text-[#FAF8F5] focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-[#A3A3A3] uppercase mb-1">Fabric & Craftsmanship Details</label>
                    <input
                      type="text"
                      value={formFabric}
                      onChange={(e) => setFormFabric(e.target.value)}
                      placeholder="e.g. 100% Pure Raw Silk with Gold Zardozi Embroidery"
                      className="w-full bg-[#1A1A1A] border border-[#262626] rounded-lg px-3.5 py-2.5 text-sm text-[#FAF8F5] focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-[#A3A3A3] uppercase mb-1">Care Instructions</label>
                    <input
                      type="text"
                      value={formCare}
                      onChange={(e) => setFormCare(e.target.value)}
                      placeholder="e.g. Dry Clean Only"
                      className="w-full bg-[#1A1A1A] border border-[#262626] rounded-lg px-3.5 py-2.5 text-sm text-[#FAF8F5] focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>
                </div>
              </div>

              {/* Product Images Manager */}
              <div className="space-y-3 bg-[#1A1A1A] p-4 rounded-xl border border-[#262626]">
                <label className="block text-xs font-semibold text-[#D4AF37] uppercase">Product Image Gallery</label>

                <div className="flex gap-2">
                  <input
                    type="url"
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    placeholder="Paste image URL (https://...)"
                    className="flex-1 bg-[#141414] border border-[#262626] rounded-lg px-3.5 py-2 text-xs text-[#FAF8F5] focus:outline-none focus:border-[#D4AF37]"
                  />
                  <button
                    type="button"
                    onClick={handleAddImage}
                    className="bg-[#262626] hover:bg-[#333333] text-[#FAF8F5] px-4 py-2 rounded-lg text-xs font-medium border border-[#404040]"
                  >
                    Add Image URL
                  </button>
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 pt-2">
                  {formImages.map((url, idx) => (
                    <div key={idx} className="relative group rounded-lg overflow-hidden border border-[#333333] bg-black aspect-[3/4]">
                      <Image src={url} alt={`Gallery ${idx}`} fill className="object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="absolute top-1 right-1 p-1 bg-red-600/90 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                      {idx === 0 && (
                        <span className="absolute bottom-1 left-1 right-1 bg-[#D4AF37] text-black text-[9px] font-bold text-center py-0.5 rounded">
                          PRIMARY
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Product Variants Manager */}
              <div className="space-y-3 bg-[#1A1A1A] p-4 rounded-xl border border-[#262626]">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-semibold text-[#D4AF37] uppercase">Product Variants (Sizes & Colors)</label>
                  <button
                    type="button"
                    onClick={handleAddVariantRow}
                    className="text-xs text-[#D4AF37] hover:underline"
                  >
                    + Add Variant Row
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
                        className="w-24 bg-[#141414] border border-[#262626] rounded-lg px-2.5 py-1.5 text-xs text-[#FAF8F5]"
                      />
                      <input
                        type="text"
                        placeholder="Color (e.g. Black)"
                        value={varItem.color}
                        onChange={(e) => {
                          const updated = [...formVariants];
                          updated[idx].color = e.target.value;
                          setFormVariants(updated);
                        }}
                        className="w-32 bg-[#141414] border border-[#262626] rounded-lg px-2.5 py-1.5 text-xs text-[#FAF8F5]"
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
                        className="w-24 bg-[#141414] border border-[#262626] rounded-lg px-2.5 py-1.5 text-xs text-[#FAF8F5]"
                      />
                      {formVariants.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveVariantRow(idx)}
                          className="p-1 text-red-400 hover:text-red-300"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-3 border-t border-[#262626] pt-4">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 text-sm text-[#A3A3A3] hover:text-white bg-[#1A1A1A] border border-[#262626] rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 text-sm text-black font-semibold bg-[#D4AF37] hover:bg-[#C5A028] rounded-lg transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Saving Product...' : editingProduct ? 'Update Product' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
