'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Plus, Search, Trash2, Edit3, Copy, Eye, EyeOff, Package, X, Check, Image as ImageIcon, Layers, Ruler, UploadCloud, Loader2 } from 'lucide-react';
import { ProductImageUploader } from '@/components/admin/ProductImageUploader';
import { useDebounce } from '@/hooks/useDebounce';
import { AdminPagination } from '@/components/admin/AdminPagination';
import { AdminEmptyState } from '@/components/admin/AdminEmptyState';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { calculateStockValuation, getEffectiveSellingPrice, formatPKR } from '@/lib/pricing';

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
  isPreOrder?: boolean;
  preOrderAdvancePercent?: number | null;
  preOrderNote?: string | null;
  preOrderEstimatedAvailability?: string | null;
  categoryId?: string | null;
  collectionId?: string | null;
  sizeGuideImage?: string | null;
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
  const debouncedSearch = useDebounce(search, 300);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

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
  const [formSizeGuideImage, setFormSizeGuideImage] = useState<string | null>(null);
  const [guideUploading, setGuideUploading] = useState(false);
  const guideFileInputRef = React.useRef<HTMLInputElement>(null);

  // Pre-Order Form State
  const [formIsPreOrder, setFormIsPreOrder] = useState(false);
  const [formPreOrderAdvancePercent, setFormPreOrderAdvancePercent] = useState('');
  const [formPreOrderNote, setFormPreOrderNote] = useState('');
  const [formPreOrderEstimatedAvailability, setFormPreOrderEstimatedAvailability] = useState('');
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

  const handleGuideFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setGuideUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/admin/products/upload-image', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.url) {
        setFormSizeGuideImage(data.url);
      } else {
        alert(data.error || 'Failed to upload size guide image');
      }
    } catch (err: any) {
      alert(err?.message || 'Error uploading size guide image');
    } finally {
      setGuideUploading(false);
      if (guideFileInputRef.current) guideFileInputRef.current.value = '';
    }
  };

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
    setFormSizeGuideImage(null);
    setFormIsPreOrder(false);
    setFormPreOrderAdvancePercent('');
    setFormPreOrderNote('');
    setFormPreOrderEstimatedAvailability('');
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
    setFormSizeGuideImage(product.sizeGuideImage || null);
    setFormIsPreOrder(Boolean(product.isPreOrder));
    setFormPreOrderAdvancePercent(product.preOrderAdvancePercent ? product.preOrderAdvancePercent.toString() : '');
    setFormPreOrderNote(product.preOrderNote || '');
    setFormPreOrderEstimatedAvailability(product.preOrderEstimatedAvailability || '');
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
      sizeGuideImage: formSizeGuideImage,
      isPreOrder: formIsPreOrder,
      preOrderAdvancePercent: formPreOrderAdvancePercent ? parseInt(formPreOrderAdvancePercent) : null,
      preOrderNote: formPreOrderNote || null,
      preOrderEstimatedAvailability: formPreOrderEstimatedAvailability || null,
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

  // Reset page on filter changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, statusFilter]);

  const filteredProducts = products.filter((p) => {
    const query = debouncedSearch.trim().toLowerCase();
    const matchesSearch =
      !query ||
      p.title.toLowerCase().includes(query) ||
      p.sku.toLowerCase().includes(query) ||
      (p.category?.name?.toLowerCase() || '').includes(query);
    let matchesStatus = true;
    if (statusFilter === 'PRE_ORDER') {
      matchesStatus = Boolean(p.isPreOrder);
    } else if (statusFilter !== 'ALL') {
      matchesStatus = p.status === statusFilter;
    }
    return matchesSearch && matchesStatus;
  });

  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="admin-page text-[#FAF8F5] font-sans space-y-6">
      {/* Standardized Header */}
      <AdminPageHeader
        badge="Luxury Catalog"
        title={`Product Inventory (${filteredProducts.length})`}
        description="Manage luxury garments, pricing, stock quantities, size variants, and pre-orders."
        actions={
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 bg-[#D4AF37] hover:bg-[#FAF8F5] text-black px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-colors shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add New Product
          </button>
        }
      />

      {/* Search & Status Filter Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3.5 justify-between items-center bg-[#0A2528] p-4 border border-[#D4AF37]/20 rounded-2xl shadow-md">
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

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'ALL', label: 'All Products' },
            { id: 'PUBLISHED', label: 'Published' },
            { id: 'DRAFT', label: 'Draft' },
            { id: 'PRE_ORDER', label: 'Pre-Orders' },
          ].map((st) => (
            <button
              key={st.id}
              onClick={() => setStatusFilter(st.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border transition-colors cursor-pointer whitespace-nowrap ${
                statusFilter === st.id
                  ? 'bg-[#D4AF37] text-black border-[#D4AF37] shadow-sm'
                  : 'bg-[#06191B] text-[#FAF8F5]/70 border-[#D4AF37]/20 hover:border-[#D4AF37]/50'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* Product List Table */}
      <div className="bg-[#0A2528] rounded-2xl border border-[#D4AF37]/20 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-[#06191B]/80 text-[#D4AF37] font-mono text-[10px] uppercase tracking-wider border-b border-[#D4AF37]/20">
              <tr>
                <th className="py-3.5 px-6">Product Garment</th>
                <th className="py-3.5 px-4">SKU Code</th>
                <th className="py-3.5 px-4">Price</th>
                <th className="py-3.5 px-4">Available Stock</th>
                <th className="py-3.5 px-4">Store Visibility</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D4AF37]/10">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 px-4 text-center">
                    <AdminEmptyState
                      title="No Products Found"
                      description="No products matched your search or status filter criteria."
                      icon={Package}
                      action={
                        search || statusFilter !== 'ALL' ? (
                          <button
                            onClick={() => {
                              setSearch('');
                              setStatusFilter('ALL');
                            }}
                            className="px-4 py-2 bg-[#0D3337] hover:bg-[#103A3E] text-[#D4AF37] border border-[#D4AF37]/30 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                          >
                            Reset Filters
                          </button>
                        ) : undefined
                      }
                    />
                  </td>
                </tr>
              ) : (
                paginatedProducts.map((p) => {
                  const primaryImage = p.images.find((img) => img.isPrimary)?.url || p.images[0]?.url || DEFAULT_IMAGE;
                  return (
                    <tr key={p.id} className="hover:bg-[#103A3E]/30 transition-colors">
                      <td className="py-3.5 px-6">
                        <div className="flex items-center gap-3.5">
                          <div className="relative w-12 h-16 rounded-xl overflow-hidden bg-[#06191B] flex-shrink-0 border border-[#D4AF37]/30 shadow-md">
                            <Image src={primaryImage} alt={p.title} fill className="object-cover" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-[#FAF8F5] line-clamp-1">{p.title}</p>
                              {p.isPreOrder && (
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold tracking-wider uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40 shrink-0">
                                  Pre-Order
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-[#D4AF37]/80">{p.category?.name || 'Uncategorized'}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-[#D4AF37] font-bold">{p.sku}</td>
                      <td className="py-3.5 px-4">
                        {(() => {
                          const val = calculateStockValuation({
                            basePrice: p.basePrice,
                            discountPrice: p.discountPrice,
                            stockQuantity: p.stockQuantity,
                          });
                          return (
                            <div className="flex flex-col">
                              {val.hasDiscount ? (
                                <>
                                  <span className="font-bold font-mono text-emerald-400">
                                    Rs. {val.effectiveSellingPrice.toLocaleString()}
                                  </span>
                                  <div className="flex items-center gap-1.5 text-[11px]">
                                    <span className="line-through font-mono text-[#FAF8F5]/40">
                                      Rs. {val.originalPrice.toLocaleString()}
                                    </span>
                                    <span className="text-[10px] text-emerald-400 font-semibold">
                                      -Rs. {val.discountAmount.toLocaleString()}
                                    </span>
                                  </div>
                                </>
                              ) : (
                                <span className="font-bold font-mono text-[#FAF8F5]">
                                  Rs. {val.effectiveSellingPrice.toLocaleString()}
                                </span>
                              )}
                            </div>
                          );
                        })()}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
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
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => handleToggleStatus(p)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-colors border cursor-pointer ${
                            p.status === 'PUBLISHED'
                              ? 'bg-emerald-950/70 text-emerald-300 border-emerald-500/40 hover:bg-emerald-900/80'
                              : 'bg-zinc-900/80 text-zinc-400 border-zinc-700 hover:bg-zinc-800'
                          }`}
                        >
                          {p.status === 'PUBLISHED' ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                          {p.status === 'PUBLISHED' ? 'Published' : 'Draft'}
                        </button>
                      </td>
                      <td className="py-3.5 px-6 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditModal(p)}
                            title="Edit Product"
                            className="p-1.5 rounded-lg border border-[#D4AF37]/30 text-[#FAF8F5]/80 hover:text-[#D4AF37] hover:bg-[#103A3E] transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDuplicateProduct(p.id)}
                            title="Duplicate Product"
                            className="p-1.5 rounded-lg border border-cyan-500/30 text-[#FAF8F5]/80 hover:text-cyan-400 hover:bg-[#103A3E] transition-colors cursor-pointer"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(p.id)}
                            title="Delete Product"
                            className="p-1.5 rounded-lg border border-rose-500/30 text-[#FAF8F5]/80 hover:text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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

        {filteredProducts.length > 0 && (
          <AdminPagination
            currentPage={currentPage}
            totalItems={filteredProducts.length}
            itemsPerPage={pageSize}
            onPageChange={(page: number) => setCurrentPage(page)}
            onItemsPerPageChange={(newSize: number) => {
              setPageSize(newSize);
              setCurrentPage(1);
            }}
          />
        )}
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

              {/* Live Inventory Valuation Preview */}
              {(() => {
                const liveVal = calculateStockValuation({
                  basePrice: parseFloat(formBasePrice) || 0,
                  discountPrice: formDiscountPrice ? parseFloat(formDiscountPrice) : null,
                  stockQuantity: parseInt(formStock, 10) || 0,
                });
                return (
                  <div className="bg-[#0A2528] border border-[#D4AF37]/20 rounded-xl p-3.5 text-xs">
                    <span className="text-[10px] uppercase font-bold text-[#D4AF37] block tracking-wider mb-2">
                      Live Stock Valuation Breakdown
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                      <div className="bg-[#06191B] p-2 rounded-lg border border-white/5">
                        <span className="text-[#FAF8F5]/60 block text-[10px]">Original Price</span>
                        <span className="font-mono font-bold text-[#FAF8F5]">Rs. {liveVal.originalPrice.toLocaleString()}</span>
                      </div>
                      <div className="bg-[#06191B] p-2 rounded-lg border border-white/5">
                        <span className="text-[#FAF8F5]/60 block text-[10px]">Effective Selling Price</span>
                        <span className="font-mono font-bold text-emerald-400">Rs. {liveVal.effectiveSellingPrice.toLocaleString()}</span>
                      </div>
                      <div className="bg-[#06191B] p-2 rounded-lg border border-white/5">
                        <span className="text-[#FAF8F5]/60 block text-[10px]">Discount</span>
                        <span className="font-mono font-bold text-[#D4AF37]">
                          {liveVal.hasDiscount ? `Rs. ${liveVal.discountAmount.toLocaleString()}` : 'None'}
                        </span>
                      </div>
                      <div className="bg-[#06191B] p-2 rounded-lg border border-emerald-500/20">
                        <span className="text-emerald-300/80 block text-[10px]">Stock Selling Value</span>
                        <span className="font-mono font-bold text-emerald-400">
                          Rs. {liveVal.stockSellingValue.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}

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

              {/* Pre-Order Configuration */}
              <div className="bg-[#06191B] p-5 rounded-2xl border border-[#D4AF37]/30 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider flex items-center gap-2">
                      <span>Pre-Order Product</span>
                      {formIsPreOrder && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          Active Pre-Order
                        </span>
                      )}
                    </label>
                    <p className="text-[11px] text-[#FAF8F5]/60 mt-0.5">
                      Customers must pay an advance payment via bank transfer/wallet with proof upload.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formIsPreOrder}
                      onChange={(e) => setFormIsPreOrder(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-[#0A2528] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#D4AF37]"></div>
                  </label>
                </div>

                {formIsPreOrder && (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-[#D4AF37]/15">
                      <div>
                        <label className="block text-[11px] text-[#D4AF37] font-semibold uppercase mb-1">
                          Advance % (Leave blank for default)
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="100"
                          placeholder="Default (50%)"
                          value={formPreOrderAdvancePercent}
                          onChange={(e) => setFormPreOrderAdvancePercent(e.target.value)}
                          className="w-full bg-[#0A2528] border border-[#D4AF37]/25 rounded-xl px-3 py-2 text-xs text-[#FAF8F5] focus:outline-none focus:border-[#D4AF37]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-[#D4AF37] font-semibold uppercase mb-1">
                          Estimated Availability
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. 2-3 Weeks / 15 Oct"
                          value={formPreOrderEstimatedAvailability}
                          onChange={(e) => setFormPreOrderEstimatedAvailability(e.target.value)}
                          className="w-full bg-[#0A2528] border border-[#D4AF37]/25 rounded-xl px-3 py-2 text-xs text-[#FAF8F5] focus:outline-none focus:border-[#D4AF37]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-[#D4AF37] font-semibold uppercase mb-1">
                          Pre-Order Note / Tagline
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Made-to-order handcrafted piece"
                          value={formPreOrderNote}
                          onChange={(e) => setFormPreOrderNote(e.target.value)}
                          className="w-full bg-[#0A2528] border border-[#D4AF37]/25 rounded-xl px-3 py-2 text-xs text-[#FAF8F5] focus:outline-none focus:border-[#D4AF37]"
                        />
                      </div>
                    </div>

                    {/* Live Pre-Order Pricing & Advance Breakdown Preview */}
                    {(() => {
                      const base = parseFloat(formBasePrice) || 0;
                      const sale = formDiscountPrice ? parseFloat(formDiscountPrice) : null;
                      const selling = sale !== null && !isNaN(sale) && sale > 0 ? sale : base;
                      const discount = Math.max(0, base - selling);
                      const advPercent = parseInt(formPreOrderAdvancePercent) || 50;
                      const advance = Math.round((selling * advPercent) / 100);
                      const remaining = Math.max(0, selling - advance);

                      return (
                        <div className="bg-[#0A2528] border border-[#D4AF37]/25 rounded-xl p-3.5 space-y-2 text-xs">
                          <span className="text-[10px] uppercase font-bold text-[#D4AF37] block tracking-wider">
                            Live Pre-Order Pricing Breakdown
                          </span>
                          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[11px] font-sans">
                            <div className="bg-[#06191B] p-2 rounded-lg border border-white/5">
                              <span className="text-[#FAF8F5]/60 block text-[10px]">Original Price</span>
                              <span className="font-mono font-bold text-[#FAF8F5]">Rs. {base.toLocaleString()}</span>
                            </div>
                            <div className="bg-[#06191B] p-2 rounded-lg border border-white/5">
                              <span className="text-[#FAF8F5]/60 block text-[10px]">Selling Price</span>
                              <span className="font-mono font-bold text-[#D4AF37]">Rs. {selling.toLocaleString()}</span>
                            </div>
                            <div className="bg-[#06191B] p-2 rounded-lg border border-white/5">
                              <span className="text-[#FAF8F5]/60 block text-[10px]">Discount</span>
                              <span className="font-mono font-bold text-emerald-400">
                                {discount > 0 ? `Rs. ${discount.toLocaleString()}` : 'None'}
                              </span>
                            </div>
                            <div className="bg-[#06191B] p-2 rounded-lg border border-amber-500/20">
                              <span className="text-amber-300/80 block text-[10px]">Advance ({advPercent}%)</span>
                              <span className="font-mono font-bold text-amber-400">Rs. {advance.toLocaleString()}</span>
                            </div>
                            <div className="bg-[#06191B] p-2 rounded-lg border border-teal-500/20">
                              <span className="text-teal-300/80 block text-[10px]">Remaining (COD)</span>
                              <span className="font-mono font-bold text-teal-300">Rs. {remaining.toLocaleString()}</span>
                            </div>
                          </div>
                          <p className="text-[10px] text-[#FAF8F5]/50 italic">
                            * Advance is calculated from final selling price (Rs. {selling.toLocaleString()}). Customer pays Rs. {advance.toLocaleString()} now, and Rs. {remaining.toLocaleString()} on delivery.
                          </p>
                        </div>
                      );
                    })()}
                  </>
                )}
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
                <ProductImageUploader
                  images={formImages}
                  onChange={(imgs) => setFormImages(imgs)}
                />
              </div>

              {/* Product Size Guide Image Manager (Requirements 15 & 16) */}
              <div className="space-y-3 bg-[#06191B] p-5 rounded-2xl border border-[#D4AF37]/20">
                <div className="flex justify-between items-center">
                  <div>
                    <label className="flex items-center gap-2 text-xs font-bold text-[#D4AF37] uppercase tracking-wider">
                      <Ruler className="w-4 h-4 text-[#D4AF37]" />
                      <span>Product Size Guide Image</span>
                    </label>
                    <p className="text-[10.5px] text-[#FAF8F5]/60 mt-0.5">
                      Upload this specific garment&apos;s measurement guide image. Stored securely on Cloudflare R2.
                    </p>
                  </div>
                </div>

                <input
                  ref={guideFileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/jpg"
                  onChange={handleGuideFileUpload}
                  className="hidden"
                />

                {formSizeGuideImage ? (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-[#0A2528] p-4 rounded-xl border border-[#D4AF37]/30">
                    <div className="relative w-28 h-36 rounded-lg overflow-hidden border border-[#D4AF37]/40 bg-black/40 shrink-0">
                      <Image
                        src={formSizeGuideImage}
                        alt="Size Guide"
                        fill
                        className="object-contain"
                      />
                    </div>
                    <div className="space-y-2 flex-1 min-w-0">
                      <div className="flex items-center gap-2 text-xs text-[#FAF8F5]">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                        <span className="font-semibold truncate">Size Guide Active for this Product</span>
                      </div>
                      <p className="text-[11px] text-[#FAF8F5]/60 break-all line-clamp-2">
                        {formSizeGuideImage}
                      </p>
                      <div className="flex gap-2 pt-1">
                        <button
                          type="button"
                          disabled={guideUploading}
                          onClick={() => guideFileInputRef.current?.click()}
                          className="px-3.5 py-1.5 rounded-lg bg-[#103A3E] text-[#D4AF37] border border-[#D4AF37]/40 text-xs font-bold uppercase hover:bg-[#D4AF37] hover:text-black transition-all cursor-pointer flex items-center gap-1.5"
                        >
                          {guideUploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <UploadCloud className="w-3 h-3" />}
                          Replace Image
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormSizeGuideImage(null)}
                          className="px-3.5 py-1.5 rounded-lg bg-rose-950/70 text-rose-300 border border-rose-800/40 text-xs font-bold uppercase hover:bg-rose-900 transition-all cursor-pointer flex items-center gap-1.5"
                        >
                          <Trash2 className="w-3 h-3" />
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => guideFileInputRef.current?.click()}
                    className="border border-dashed border-[#D4AF37]/30 rounded-xl p-5 text-center cursor-pointer hover:border-[#D4AF37] hover:bg-[#0A2528]/50 transition-all group"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-10 h-10 rounded-xl bg-[#0A2528] flex items-center justify-center text-[#D4AF37] group-hover:scale-105 transition-transform">
                        {guideUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <UploadCloud className="w-5 h-5" />}
                      </div>
                      <p className="text-xs font-semibold text-[#FAF8F5]">
                        {guideUploading ? 'Uploading to Cloudflare R2...' : 'Click to Upload Product Size Guide Image'}
                      </p>
                      <p className="text-[10px] text-[#FAF8F5]/50">
                        JPEG, PNG or WebP up to 10MB
                      </p>
                    </div>
                  </div>
                )}
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
