'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Plus,
  Edit3,
  Copy,
  Pause,
  Play,
  Trash2,
  Eye,
  BarChart3,
  Clock,
  Globe,
  Calendar,
  UploadCloud,
  Loader2,
  X,
  Check,
  Search,
  ShieldAlert,
  Tag,
  Image as ImageIcon,
} from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { DeleteConfirmModal } from '@/components/admin/DeleteConfirmModal';
import {
  getKarachiInputValues,
  parseKarachiDateTime,
  calculateDurationDisplay,
} from '@/lib/coupons';
import { sanitizeCampaignSlug } from '@/lib/campaign-validation';

export interface AdminCampaignItem {
  id: string;
  name: string;
  slug: string;
  internalDescription: string | null;
  publicTitle: string;
  badgeText: string | null;
  status: string;
  effectiveStatus: string;
  isLive: boolean;
  statusLabel: string;
  startDate: string | null;
  endDate: string | null;
  timezone: string;
  priority: number;
  scopeType: string;
  includedProductIds: string[];
  excludedProductIds: string[];
  includedCollectionIds: string[];
  includedCategoryIds: string[];
  allowPreOrderProducts: boolean;
  couponStackingMode: string;
  discountType: string;
  discountValue: number;
  maxDiscountAmount: number | null;
  bannerTitle: string | null;
  bannerSubtitle: string | null;
  desktopBannerUrl: string | null;
  mobileBannerUrl: string | null;
  showBanner: boolean;
  replaceHeroSlider: boolean;
  announcementEnabled: boolean;
  announcementText: string | null;
  ctaText: string | null;
  ctaLink: string | null;
  showCountdown: boolean;
  landingPageEnabled: boolean;
  landingPageDescription: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  previewToken: string | null;
  durationDisplay?: string;
  formattedStartDate?: string;
  formattedEndDate?: string;
  analyticsSummary?: {
    ordersCount: number;
    netRevenue: number;
    discountGranted: number;
  };
}

interface ProductOption {
  id: string;
  title: string;
  sku: string;
  basePrice: number;
  discountPrice: number | null;
  isPreOrder: boolean;
  status: string;
  categoryId: string | null;
  collectionId: string | null;
}

interface TaxonOption {
  id: string;
  name: string;
  slug: string;
}

interface CampaignsClientProps {
  initialCampaigns: AdminCampaignItem[];
  products: ProductOption[];
  categories: TaxonOption[];
  collections: TaxonOption[];
}

const STATUS_BADGE_STYLES: Record<string, string> = {
  ACTIVE: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  SCHEDULED: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
  PAUSED: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  DRAFT: 'bg-white/10 text-gray-300 border-white/20',
  COMPLETED: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
  CANCELLED: 'bg-red-500/15 text-red-300 border-red-500/30',
};

const SCOPE_LABELS: Record<string, string> = {
  STOREWIDE: 'Storewide',
  COLLECTIONS: 'Selected Collections',
  CATEGORIES: 'Selected Categories',
  SELECTED_PRODUCTS: 'Selected Products',
};

const STACKING_LABELS: Record<string, string> = {
  BLOCK_COUPONS: 'Block Coupons (Recommended)',
  BEST_DISCOUNT_ONLY: 'Best Discount Wins (Compare Coupon vs Sale)',
  ALLOW_COUPONS: 'Allow Coupon Stacking on Sale Price',
};

const EMPTY_FORM = {
  name: '',
  slug: '',
  internalDescription: '',
  publicTitle: '',
  badgeText: 'SALE',
  status: 'DRAFT',
  startDate: '',
  startTime: '00:00',
  endDate: '',
  endTime: '23:59',
  timezone: 'Asia/Karachi',
  priority: '10',
  scopeType: 'SELECTED_PRODUCTS',
  includedProductIds: [] as string[],
  excludedProductIds: [] as string[],
  includedCollectionIds: [] as string[],
  includedCategoryIds: [] as string[],
  allowPreOrderProducts: false,
  couponStackingMode: 'BLOCK_COUPONS',
  discountType: 'PERCENTAGE',
  discountValue: '15',
  maxDiscountAmount: '',
  bannerTitle: '',
  bannerSubtitle: '',
  desktopBannerUrl: '',
  mobileBannerUrl: '',
  showBanner: true,
  replaceHeroSlider: false,
  announcementEnabled: false,
  announcementText: '',
  ctaText: 'Shop Sale',
  ctaLink: '',
  showCountdown: true,
  landingPageEnabled: true,
  landingPageDescription: '',
  seoTitle: '',
  seoDescription: '',
};

export const CampaignsClient: React.FC<CampaignsClientProps> = ({
  initialCampaigns,
  products,
  categories,
  collections,
}) => {
  const [campaigns, setCampaigns] = useState<AdminCampaignItem[]>(initialCampaigns);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<AdminCampaignItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminCampaignItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [actionBusyId, setActionBusyId] = useState<string | null>(null);
  const [uploadingVariant, setUploadingVariant] = useState<'desktop' | 'mobile' | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [warningMessages, setWarningMessages] = useState<string[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [productSearch, setProductSearch] = useState('');
  const [excludeSearch, setExcludeSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'basics' | 'scope' | 'assets'>('basics');

  const [formData, setFormData] = useState({ ...EMPTY_FORM });
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  const formDurationPreview = useMemo(() => {
    if (!formData.startDate || !formData.endDate) return 'Ongoing unless end date is specified';
    const start = parseKarachiDateTime(formData.startDate, formData.startTime);
    const end = parseKarachiDateTime(formData.endDate, formData.endTime);
    if (!start || !end) return 'Invalid date range';
    if (end.getTime() <= start.getTime()) return 'End time must be after start time';
    return calculateDurationDisplay(start, end);
  }, [formData.startDate, formData.startTime, formData.endDate, formData.endTime]);

  const filteredCampaigns = useMemo(() => {
    if (filterStatus === 'ALL') return campaigns;
    return campaigns.filter((c) => (c.effectiveStatus || c.status) === filterStatus);
  }, [campaigns, filterStatus]);

  const filteredIncludeProducts = useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) => p.title.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)
    );
  }, [products, productSearch]);

  const filteredExcludeProducts = useMemo(() => {
    const q = excludeSearch.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) => p.title.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)
    );
  }, [products, excludeSearch]);

  const openCreateModal = () => {
    setEditingCampaign(null);
    setSlugManuallyEdited(false);
    setErrorMessage('');
    setWarningMessages([]);
    setActiveTab('basics');
    setFormData({ ...EMPTY_FORM });
    setModalOpen(true);
  };

  const openEditModal = (c: AdminCampaignItem) => {
    setEditingCampaign(c);
    setSlugManuallyEdited(true);
    setErrorMessage('');
    setWarningMessages([]);
    setActiveTab('basics');

    const startK = getKarachiInputValues(c.startDate);
    const endK = getKarachiInputValues(c.endDate);

    setFormData({
      name: c.name,
      slug: c.slug,
      internalDescription: c.internalDescription || '',
      publicTitle: c.publicTitle,
      badgeText: c.badgeText || 'SALE',
      status: c.status,
      startDate: startK.date,
      startTime: startK.time,
      endDate: endK.date,
      endTime: endK.time,
      timezone: c.timezone || 'Asia/Karachi',
      priority: String(c.priority ?? 10),
      scopeType: c.scopeType || 'SELECTED_PRODUCTS',
      includedProductIds: Array.isArray(c.includedProductIds) ? c.includedProductIds : [],
      excludedProductIds: Array.isArray(c.excludedProductIds) ? c.excludedProductIds : [],
      includedCollectionIds: Array.isArray(c.includedCollectionIds) ? c.includedCollectionIds : [],
      includedCategoryIds: Array.isArray(c.includedCategoryIds) ? c.includedCategoryIds : [],
      allowPreOrderProducts: Boolean(c.allowPreOrderProducts),
      couponStackingMode: c.couponStackingMode || 'BLOCK_COUPONS',
      discountType: c.discountType || 'PERCENTAGE',
      discountValue: String(c.discountValue ?? 0),
      maxDiscountAmount: c.maxDiscountAmount !== null && c.maxDiscountAmount !== undefined ? String(c.maxDiscountAmount) : '',
      bannerTitle: c.bannerTitle || '',
      bannerSubtitle: c.bannerSubtitle || '',
      desktopBannerUrl: c.desktopBannerUrl || '',
      mobileBannerUrl: c.mobileBannerUrl || '',
      showBanner: c.showBanner !== false,
      replaceHeroSlider: Boolean(c.replaceHeroSlider),
      announcementEnabled: Boolean(c.announcementEnabled),
      announcementText: c.announcementText || '',
      ctaText: c.ctaText || 'Shop Sale',
      ctaLink: c.ctaLink || '',
      showCountdown: c.showCountdown !== false,
      landingPageEnabled: c.landingPageEnabled !== false,
      landingPageDescription: c.landingPageDescription || '',
      seoTitle: c.seoTitle || '',
      seoDescription: c.seoDescription || '',
    });
    setModalOpen(true);
  };

  const toggleIdInArray = (field: 'includedProductIds' | 'excludedProductIds' | 'includedCollectionIds' | 'includedCategoryIds', id: string) => {
    setFormData((prev) => {
      const exists = prev[field].includes(id);
      const next = exists ? prev[field].filter((x) => x !== id) : [...prev[field], id];
      return { ...prev, [field]: next };
    });
  };

  const handleAssetUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    variant: 'desktop' | 'mobile'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingVariant(variant);
    setErrorMessage('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('variant', variant);

      const res = await fetch('/api/admin/campaigns/upload-asset', {
        method: 'POST',
        body: fd,
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        setErrorMessage(data.error || `Failed to upload ${variant} banner asset.`);
      } else {
        setFormData((prev) => ({
          ...prev,
          [variant === 'desktop' ? 'desktopBannerUrl' : 'mobileBannerUrl']: data.url,
        }));
      }
    } catch {
      setErrorMessage(`Network error uploading ${variant} banner image.`);
    } finally {
      setUploadingVariant(null);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMessage('');
    setWarningMessages([]);

    const startObj = formData.startDate
      ? parseKarachiDateTime(formData.startDate, formData.startTime)
      : null;
    const endObj = formData.endDate
      ? parseKarachiDateTime(formData.endDate, formData.endTime)
      : null;

    if (formData.startDate && !startObj) {
      setErrorMessage('Invalid start date/time format.');
      setSaving(false);
      return;
    }
    if (formData.endDate && !endObj) {
      setErrorMessage('Invalid end date/time format.');
      setSaving(false);
      return;
    }

    const payload = {
      name: formData.name,
      slug: formData.slug,
      internalDescription: formData.internalDescription || null,
      publicTitle: formData.publicTitle || formData.name,
      badgeText: formData.badgeText || 'SALE',
      status: formData.status,
      startDate: startObj ? startObj.toISOString() : null,
      endDate: endObj ? endObj.toISOString() : null,
      timezone: 'Asia/Karachi',
      priority: parseInt(formData.priority, 10) || 10,
      scopeType: formData.scopeType,
      includedProductIds: formData.includedProductIds,
      excludedProductIds: formData.excludedProductIds,
      includedCollectionIds: formData.includedCollectionIds,
      includedCategoryIds: formData.includedCategoryIds,
      allowPreOrderProducts: formData.allowPreOrderProducts,
      couponStackingMode: formData.couponStackingMode,
      discountType: formData.discountType,
      discountValue: parseFloat(formData.discountValue) || 0,
      maxDiscountAmount: formData.maxDiscountAmount ? parseFloat(formData.maxDiscountAmount) : null,
      bannerTitle: formData.bannerTitle || null,
      bannerSubtitle: formData.bannerSubtitle || null,
      desktopBannerUrl: formData.desktopBannerUrl || null,
      mobileBannerUrl: formData.mobileBannerUrl || null,
      showBanner: formData.showBanner,
      replaceHeroSlider: formData.replaceHeroSlider,
      announcementEnabled: formData.announcementEnabled,
      announcementText: formData.announcementText || null,
      ctaText: formData.ctaText || 'Shop Sale',
      ctaLink: formData.ctaLink || `/sale/${sanitizeCampaignSlug(formData.slug)}`,
      showCountdown: formData.showCountdown,
      landingPageEnabled: formData.landingPageEnabled,
      landingPageDescription: formData.landingPageDescription || null,
      seoTitle: formData.seoTitle || null,
      seoDescription: formData.seoDescription || null,
    };

    try {
      const endpoint = editingCampaign
        ? `/api/admin/campaigns/${editingCampaign.id}`
        : '/api/admin/campaigns';
      const method = editingCampaign ? 'PATCH' : 'POST';

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || 'Failed to save campaign.');
      } else {
        if (Array.isArray(data.warnings) && data.warnings.length > 0) {
          setWarningMessages(data.warnings);
        }
        if (editingCampaign) {
          setCampaigns((prev) =>
            prev.map((c) =>
              c.id === editingCampaign.id
                ? { ...c, ...data.campaign, analyticsSummary: c.analyticsSummary }
                : c
            )
          );
        } else {
          setCampaigns((prev) => [
            {
              ...data.campaign,
              analyticsSummary: { ordersCount: 0, netRevenue: 0, discountGranted: 0 },
            },
            ...prev,
          ]);
        }
        setModalOpen(false);
      }
    } catch {
      setErrorMessage('Network error saving campaign.');
    } finally {
      setSaving(false);
    }
  };

  const handleLifecycleAction = async (
    campaign: AdminCampaignItem,
    action: 'PAUSE' | 'RESUME' | 'COMPLETE' | 'CANCEL'
  ) => {
    setActionBusyId(campaign.id);
    try {
      const res = await fetch(`/api/admin/campaigns/${campaign.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (res.ok && data.campaign) {
        setCampaigns((prev) =>
          prev.map((c) =>
            c.id === campaign.id
              ? { ...c, ...data.campaign, analyticsSummary: c.analyticsSummary }
              : c
          )
        );
      }
    } finally {
      setActionBusyId(null);
    }
  };

  const handleDuplicate = async (campaign: AdminCampaignItem) => {
    setActionBusyId(campaign.id);
    try {
      const res = await fetch('/api/admin/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'DUPLICATE', id: campaign.id }),
      });
      const data = await res.json();
      if (res.ok && data.campaign) {
        setCampaigns((prev) => [
          {
            ...data.campaign,
            analyticsSummary: { ordersCount: 0, netRevenue: 0, discountGranted: 0 },
          },
          ...prev,
        ]);
      }
    } finally {
      setActionBusyId(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setActionBusyId(deleteTarget.id);
    try {
      const res = await fetch(`/api/admin/campaigns/${deleteTarget.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setCampaigns((prev) => prev.filter((c) => c.id !== deleteTarget.id));
        setDeleteTarget(null);
      }
    } finally {
      setActionBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Seasonal Sale & Campaigns"
        description="Schedule and launch seasonal sales (11.11, 12.12, Eid, Ramadan, Clearance) in Asia/Karachi timezone with server-authoritative pricing."
        actions={
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#D4AF37] text-[#06191B] font-extrabold text-xs uppercase tracking-widest hover:bg-[#c9a32f] transition-all shadow-lg cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            New Campaign
          </button>
        }
      />

      {warningMessages.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 space-y-1 text-xs text-amber-200">
          {warningMessages.map((w, i) => (
            <p key={i} className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
              {w}
            </p>
          ))}
        </div>
      )}

      {/* Filter Pills */}
      <div className="flex flex-wrap items-center gap-2">
        {['ALL', 'ACTIVE', 'SCHEDULED', 'DRAFT', 'PAUSED', 'COMPLETED', 'CANCELLED'].map((st) => (
          <button
            key={st}
            onClick={() => setFilterStatus(st)}
            className={`px-3.5 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider border transition-all cursor-pointer ${
              filterStatus === st
                ? 'bg-[#D4AF37] text-[#06191B] border-[#D4AF37]'
                : 'bg-[#0A2528] text-gray-300 border-[#D4AF37]/20 hover:border-[#D4AF37]/50'
            }`}
          >
            {st}
          </button>
        ))}
      </div>

      {/* Campaigns List */}
      {filteredCampaigns.length === 0 ? (
        <div className="bg-[#0A2528] border border-[#D4AF37]/20 rounded-2xl p-12 text-center space-y-3">
          <Sparkles className="w-10 h-10 text-[#D4AF37]/60 mx-auto" />
          <h3 className="font-serif text-xl text-[#FAF8F5]">No Campaigns Found</h3>
          <p className="text-xs text-gray-400 max-w-md mx-auto">
            Create a draft or scheduled seasonal campaign to configure discounts, R2 banners, countdown timers, and dedicated `/sale/[slug]` landing pages.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredCampaigns.map((c) => {
            const badgeStyle =
              STATUS_BADGE_STYLES[c.effectiveStatus] || STATUS_BADGE_STYLES.DRAFT;
            const isBusy = actionBusyId === c.id;
            const previewUrl = `/sale/${c.slug}${c.previewToken ? `?preview=${c.previewToken}` : ''}`;

            return (
              <div
                key={c.id}
                className="bg-[#0A2528] border border-[#D4AF37]/20 rounded-2xl p-5 hover:border-[#D4AF37]/40 transition-all space-y-4"
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span
                        className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full border ${badgeStyle}`}
                      >
                        {c.statusLabel}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-[#D4AF37] border border-[#D4AF37]/20">
                        Priority #{c.priority}
                      </span>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-[#06191B] text-gray-300 border border-white/10">
                        {SCOPE_LABELS[c.scopeType] || c.scopeType}
                      </span>
                      {c.allowPreOrderProducts && (
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                          Includes Pre-Orders
                        </span>
                      )}
                    </div>

                    <h3 className="font-serif text-xl font-bold text-[#FAF8F5]">
                      {c.name}
                    </h3>
                    <p className="text-xs text-gray-300">
                      Public Title: <strong className="text-[#D4AF37]">{c.publicTitle}</strong> • URL:{' '}
                      <code className="text-[11px] text-emerald-300 bg-black/30 px-1.5 py-0.5 rounded">
                        /sale/{c.slug}
                      </code>
                    </p>

                    <div className="flex flex-wrap items-center gap-4 pt-1 text-[11px] text-gray-400">
                      <span className="flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 text-[#D4AF37]" />
                        {c.discountType === 'PERCENTAGE'
                          ? `${c.discountValue}% OFF`
                          : `Rs. ${c.discountValue.toLocaleString()} OFF`}
                        {c.maxDiscountAmount ? ` (Cap: Rs. ${c.maxDiscountAmount.toLocaleString()})` : ''}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-[#D4AF37]" />
                        {c.formattedStartDate || 'Immediate'} → {c.formattedEndDate || 'No End'} ({c.timezone})
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#D4AF37]" />
                        {c.durationDisplay || 'Ongoing'}
                      </span>
                    </div>
                  </div>

                  {/* Mini KPI Snapshot */}
                  <div className="grid grid-cols-3 gap-2 sm:gap-3 bg-[#06191B] border border-[#D4AF37]/15 rounded-xl p-3 shrink-0">
                    <div className="text-center px-2">
                      <span className="text-[9px] uppercase tracking-wider text-gray-400 block">
                        Orders
                      </span>
                      <span className="text-sm font-black text-[#FAF8F5]">
                        {c.analyticsSummary?.ordersCount ?? 0}
                      </span>
                    </div>
                    <div className="text-center px-2 border-x border-white/10">
                      <span className="text-[9px] uppercase tracking-wider text-gray-400 block">
                        Discounts
                      </span>
                      <span className="text-sm font-black text-amber-300">
                        Rs. {(c.analyticsSummary?.discountGranted ?? 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-center px-2">
                      <span className="text-[9px] uppercase tracking-wider text-gray-400 block">
                        Revenue
                      </span>
                      <span className="text-sm font-black text-emerald-300">
                        Rs. {(c.analyticsSummary?.netRevenue ?? 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Bar */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-white/10">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => openEditModal(c)}
                      disabled={isBusy}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#06191B] hover:bg-white/10 text-xs font-bold text-[#FAF8F5] border border-white/15 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-[#D4AF37]" />
                      Edit
                    </button>

                    <a
                      href={previewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#06191B] hover:bg-white/10 text-xs font-bold text-sky-300 border border-sky-500/25"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Preview
                    </a>

                    <Link
                      href={`/admin/campaigns/${c.id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#06191B] hover:bg-white/10 text-xs font-bold text-emerald-300 border border-emerald-500/25"
                    >
                      <BarChart3 className="w-3.5 h-3.5" />
                      Analytics
                    </Link>

                    <button
                      onClick={() => handleDuplicate(c)}
                      disabled={isBusy}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#06191B] hover:bg-white/10 text-xs font-bold text-gray-200 border border-white/15 cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      Duplicate
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {(c.status === 'ACTIVE' || c.status === 'SCHEDULED') && (
                      <button
                        onClick={() => handleLifecycleAction(c, 'PAUSE')}
                        disabled={isBusy}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-xs font-bold text-amber-300 border border-amber-500/30 cursor-pointer"
                      >
                        <Pause className="w-3.5 h-3.5" />
                        Pause
                      </button>
                    )}

                    {c.status === 'PAUSED' && (
                      <button
                        onClick={() => handleLifecycleAction(c, 'RESUME')}
                        disabled={isBusy}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-xs font-bold text-emerald-300 border border-emerald-500/30 cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5" />
                        Resume
                      </button>
                    )}

                    <button
                      onClick={() => setDeleteTarget(c)}
                      disabled={isBusy}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/25 text-xs font-bold text-red-300 border border-red-500/25 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-[#0A2528] border border-[#D4AF37]/30 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto">
            <div className="p-5 border-b border-white/10 flex items-center justify-between bg-[#06191B]">
              <div>
                <h2 className="font-serif text-xl font-bold text-[#FAF8F5]">
                  {editingCampaign ? `Edit Campaign: ${editingCampaign.name}` : 'Create Seasonal Campaign'}
                </h2>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  All scheduling evaluates strictly on server clock in Asia/Karachi timezone.
                </p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Section Tabs */}
            <div className="flex border-b border-white/10 bg-[#06191B]/60 px-5 gap-4 overflow-x-auto">
              {[
                { id: 'basics', label: '1. Schedule & Discount Rules' },
                { id: 'scope', label: '2. Eligible Products & Exclusions' },
                { id: 'assets', label: '3. Banners, Ticker & Landing SEO' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveTab(t.id as any)}
                  className={`py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
                    activeTab === t.id
                      ? 'border-[#D4AF37] text-[#D4AF37]'
                      : 'border-transparent text-gray-400 hover:text-white'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-5 space-y-5">
              {errorMessage && (
                <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-xs text-red-200 font-semibold">
                  {errorMessage}
                </div>
              )}

              {activeTab === 'basics' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                        Internal Campaign Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 11.11 Singles Day Sale 2026"
                        value={formData.name}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormData((prev) => ({
                            ...prev,
                            name: val,
                            slug: slugManuallyEdited ? prev.slug : sanitizeCampaignSlug(val),
                            publicTitle: prev.publicTitle || val,
                          }));
                        }}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#06191B] border border-white/15 text-sm text-white focus:border-[#D4AF37] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                        Public Campaign Title *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. The 11.11 Signature Sale"
                        value={formData.publicTitle}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, publicTitle: e.target.value }))
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#06191B] border border-white/15 text-sm text-white focus:border-[#D4AF37] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                        Landing URL Slug *
                      </label>
                      <div className="flex items-center bg-[#06191B] border border-white/15 rounded-xl overflow-hidden">
                        <span className="px-2.5 text-xs text-gray-400 font-mono">/sale/</span>
                        <input
                          type="text"
                          required
                          placeholder="11-11"
                          value={formData.slug}
                          onChange={(e) => {
                            setSlugManuallyEdited(true);
                            setFormData((prev) => ({
                              ...prev,
                              slug: sanitizeCampaignSlug(e.target.value),
                            }));
                          }}
                          className="w-full py-2.5 pr-3 bg-transparent text-sm text-emerald-300 font-mono focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                        Product Card Badge
                      </label>
                      <input
                        type="text"
                        maxLength={24}
                        placeholder="SALE"
                        value={formData.badgeText}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, badgeText: e.target.value }))
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#06191B] border border-white/15 text-sm text-white focus:border-[#D4AF37] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                        Campaign Status
                      </label>
                      <select
                        value={formData.status}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, status: e.target.value }))
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#06191B] border border-white/15 text-sm text-white focus:border-[#D4AF37] focus:outline-none"
                      >
                        <option value="DRAFT">DRAFT (Hidden / Safe)</option>
                        <option value="SCHEDULED">SCHEDULED (Auto-activate at Start)</option>
                        <option value="ACTIVE">ACTIVE (Live Immediately within Window)</option>
                        <option value="PAUSED">PAUSED</option>
                        <option value="COMPLETED">COMPLETED</option>
                        <option value="CANCELLED">CANCELLED</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                      Internal Admin Description
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Internal notes for operations team..."
                      value={formData.internalDescription}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, internalDescription: e.target.value }))
                      }
                      className="w-full px-3.5 py-2 rounded-xl bg-[#06191B] border border-white/15 text-sm text-white focus:border-[#D4AF37] focus:outline-none"
                    />
                  </div>

                  {/* Scheduling (Asia/Karachi) */}
                  <div className="bg-[#06191B] border border-[#D4AF37]/20 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#D4AF37] flex items-center gap-1.5">
                        <Globe className="w-4 h-4" /> Schedule Window (Asia/Karachi PKT)
                      </span>
                      <span className="text-[11px] text-gray-300">{formDurationPreview}</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-[10px] uppercase text-gray-400 mb-1">
                          Start Date
                        </label>
                        <input
                          type="date"
                          value={formData.startDate}
                          onChange={(e) =>
                            setFormData((prev) => ({ ...prev, startDate: e.target.value }))
                          }
                          className="w-full px-3 py-2 rounded-lg bg-[#0A2528] border border-white/15 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase text-gray-400 mb-1">
                          Start Time
                        </label>
                        <input
                          type="time"
                          value={formData.startTime}
                          onChange={(e) =>
                            setFormData((prev) => ({ ...prev, startTime: e.target.value }))
                          }
                          className="w-full px-3 py-2 rounded-lg bg-[#0A2528] border border-white/15 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase text-gray-400 mb-1">
                          End Date
                        </label>
                        <input
                          type="date"
                          value={formData.endDate}
                          onChange={(e) =>
                            setFormData((prev) => ({ ...prev, endDate: e.target.value }))
                          }
                          className="w-full px-3 py-2 rounded-lg bg-[#0A2528] border border-white/15 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase text-gray-400 mb-1">
                          End Time
                        </label>
                        <input
                          type="time"
                          value={formData.endTime}
                          onChange={(e) =>
                            setFormData((prev) => ({ ...prev, endTime: e.target.value }))
                          }
                          className="w-full px-3 py-2 rounded-lg bg-[#0A2528] border border-white/15 text-xs text-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Discount & Stacking Config */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                        Discount Type
                      </label>
                      <select
                        value={formData.discountType}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, discountType: e.target.value }))
                        }
                        className="w-full px-3 py-2.5 rounded-xl bg-[#06191B] border border-white/15 text-sm text-white"
                      >
                        <option value="PERCENTAGE">Percentage (%)</option>
                        <option value="FIXED">Fixed Amount (Rs.)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                        Discount Value *
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={formData.discountType === 'PERCENTAGE' ? 95 : 1000000}
                        step="any"
                        required
                        value={formData.discountValue}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, discountValue: e.target.value }))
                        }
                        className="w-full px-3 py-2.5 rounded-xl bg-[#06191B] border border-white/15 text-sm text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                        Max Cap / Item (Rs.)
                      </label>
                      <input
                        type="number"
                        min={0}
                        placeholder="Optional cap"
                        value={formData.maxDiscountAmount}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, maxDiscountAmount: e.target.value }))
                        }
                        className="w-full px-3 py-2.5 rounded-xl bg-[#06191B] border border-white/15 text-sm text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                        Overlap Priority
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={10000}
                        value={formData.priority}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, priority: e.target.value }))
                        }
                        className="w-full px-3 py-2.5 rounded-xl bg-[#06191B] border border-white/15 text-sm text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                        Coupon Stacking Policy
                      </label>
                      <select
                        value={formData.couponStackingMode}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, couponStackingMode: e.target.value }))
                        }
                        className="w-full px-3 py-2.5 rounded-xl bg-[#06191B] border border-white/15 text-xs text-white"
                      >
                        {Object.entries(STACKING_LABELS).map(([k, label]) => (
                          <option key={k} value={k}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center pt-5">
                      <label className="flex items-start gap-2.5 cursor-pointer text-xs text-gray-200">
                        <input
                          type="checkbox"
                          checked={formData.allowPreOrderProducts}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              allowPreOrderProducts: e.target.checked,
                            }))
                          }
                          className="mt-0.5 rounded border-white/30 bg-[#06191B]"
                        />
                        <span>
                          <strong className="text-[#FAF8F5] block">
                            Apply to Pre-Order Products
                          </strong>
                          <span className="text-[11px] text-gray-400">
                            Off by default to protect pre-order & PREORDER500 rules.
                          </span>
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'scope' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                      Campaign Scope
                    </label>
                    <select
                      value={formData.scopeType}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, scopeType: e.target.value }))
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#06191B] border border-white/15 text-sm text-white"
                    >
                      <option value="STOREWIDE">Storewide (All Eligible Products)</option>
                      <option value="COLLECTIONS">Specific Collections</option>
                      <option value="CATEGORIES">Specific Categories</option>
                      <option value="SELECTED_PRODUCTS">Specific Selected Products</option>
                    </select>
                  </div>

                  {formData.scopeType === 'COLLECTIONS' && (
                    <div className="bg-[#06191B] border border-white/10 rounded-xl p-4 space-y-2">
                      <span className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider block">
                        Select Eligible Collections ({formData.includedCollectionIds.length} selected)
                      </span>
                      {collections.length === 0 ? (
                        <p className="text-xs text-gray-400">No collections created yet.</p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                          {collections.map((col) => {
                            const checked = formData.includedCollectionIds.includes(col.id);
                            return (
                              <label
                                key={col.id}
                                className="flex items-center gap-2 p-2 rounded-lg bg-[#0A2528] border border-white/10 text-xs cursor-pointer"
                              >
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => toggleIdInArray('includedCollectionIds', col.id)}
                                />
                                <span>{col.name}</span>
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {formData.scopeType === 'CATEGORIES' && (
                    <div className="bg-[#06191B] border border-white/10 rounded-xl p-4 space-y-2">
                      <span className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider block">
                        Select Eligible Categories ({formData.includedCategoryIds.length} selected)
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                        {categories.map((cat) => {
                          const checked = formData.includedCategoryIds.includes(cat.id);
                          return (
                            <label
                              key={cat.id}
                              className="flex items-center gap-2 p-2 rounded-lg bg-[#0A2528] border border-white/10 text-xs cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggleIdInArray('includedCategoryIds', cat.id)}
                              />
                              <span>{cat.name}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {formData.scopeType === 'SELECTED_PRODUCTS' && (
                    <div className="bg-[#06191B] border border-white/10 rounded-xl p-4 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <span className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider">
                          Include Products ({formData.includedProductIds.length} selected)
                        </span>
                        <div className="relative">
                          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
                          <input
                            type="text"
                            placeholder="Filter products..."
                            value={productSearch}
                            onChange={(e) => setProductSearch(e.target.value)}
                            className="pl-8 pr-3 py-1.5 rounded-lg bg-[#0A2528] border border-white/15 text-xs text-white"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                        {filteredIncludeProducts.map((p) => {
                          const checked = formData.includedProductIds.includes(p.id);
                          return (
                            <label
                              key={p.id}
                              className="flex items-center justify-between gap-2 p-2 rounded-lg bg-[#0A2528] border border-white/10 text-xs cursor-pointer"
                            >
                              <span className="flex items-center gap-2 truncate">
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => toggleIdInArray('includedProductIds', p.id)}
                                />
                                <span className="truncate">{p.title}</span>
                              </span>
                              <span className="text-[10px] text-gray-400 font-mono shrink-0">
                                Rs.{p.basePrice}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Exclusions (applies to ANY scope) */}
                  <div className="bg-[#06191B] border border-red-500/20 rounded-xl p-4 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <span className="text-xs font-bold text-red-300 uppercase tracking-wider">
                        Exclude Specific Products ({formData.excludedProductIds.length} excluded)
                      </span>
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
                        <input
                          type="text"
                          placeholder="Filter exclusions..."
                          value={excludeSearch}
                          onChange={(e) => setExcludeSearch(e.target.value)}
                          className="pl-8 pr-3 py-1.5 rounded-lg bg-[#0A2528] border border-white/15 text-xs text-white"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                      {filteredExcludeProducts.map((p) => {
                        const checked = formData.excludedProductIds.includes(p.id);
                        return (
                          <label
                            key={p.id}
                            className="flex items-center justify-between gap-2 p-2 rounded-lg bg-[#0A2528] border border-white/10 text-xs cursor-pointer"
                          >
                            <span className="flex items-center gap-2 truncate">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggleIdInArray('excludedProductIds', p.id)}
                              />
                              <span className="truncate">{p.title}</span>
                            </span>
                            <span className="text-[10px] text-gray-400 font-mono shrink-0">
                              {p.sku}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'assets' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                        Banner Headline
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 11.11 Signature Sale — Flat 20% Off"
                        value={formData.bannerTitle}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, bannerTitle: e.target.value }))
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#06191B] border border-white/15 text-sm text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                        Banner Subtitle
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Limited time seasonal showcase on modest essentials"
                        value={formData.bannerSubtitle}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, bannerSubtitle: e.target.value }))
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#06191B] border border-white/15 text-sm text-white"
                      />
                    </div>
                  </div>

                  {/* R2 Banner Uploads */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-[#06191B] border border-white/15 rounded-xl p-4 space-y-2.5">
                      <span className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider flex items-center gap-1.5">
                        <ImageIcon className="w-3.5 h-3.5" /> Desktop Banner (R2 Upload)
                      </span>
                      {formData.desktopBannerUrl && (
                        <div className="relative aspect-[16/7] rounded-lg overflow-hidden border border-white/10">
                          <img
                            src={formData.desktopBannerUrl}
                            alt="Desktop campaign preview"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <label className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-[#0A2528] border border-[#D4AF37]/30 text-xs font-bold text-[#D4AF37] cursor-pointer hover:bg-white/5">
                          {uploadingVariant === 'desktop' ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <UploadCloud className="w-3.5 h-3.5" />
                          )}
                          Upload Desktop Asset
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            className="hidden"
                            onChange={(e) => handleAssetUpload(e, 'desktop')}
                          />
                        </label>
                        {formData.desktopBannerUrl && (
                          <button
                            type="button"
                            onClick={() =>
                              setFormData((prev) => ({ ...prev, desktopBannerUrl: '' }))
                            }
                            className="p-2 rounded-lg bg-red-500/15 text-red-300 text-xs cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="bg-[#06191B] border border-white/15 rounded-xl p-4 space-y-2.5">
                      <span className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider flex items-center gap-1.5">
                        <ImageIcon className="w-3.5 h-3.5" /> Mobile Banner (R2 Upload)
                      </span>
                      {formData.mobileBannerUrl && (
                        <div className="relative aspect-[4/3] rounded-lg overflow-hidden border border-white/10">
                          <img
                            src={formData.mobileBannerUrl}
                            alt="Mobile campaign preview"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <label className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-[#0A2528] border border-[#D4AF37]/30 text-xs font-bold text-[#D4AF37] cursor-pointer hover:bg-white/5">
                          {uploadingVariant === 'mobile' ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <UploadCloud className="w-3.5 h-3.5" />
                          )}
                          Upload Mobile Asset
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            className="hidden"
                            onChange={(e) => handleAssetUpload(e, 'mobile')}
                          />
                        </label>
                        {formData.mobileBannerUrl && (
                          <button
                            type="button"
                            onClick={() =>
                              setFormData((prev) => ({ ...prev, mobileBannerUrl: '' }))
                            }
                            className="p-2 rounded-lg bg-red-500/15 text-red-300 text-xs cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                        CTA Button Label
                      </label>
                      <input
                        type="text"
                        value={formData.ctaText}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, ctaText: e.target.value }))
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#06191B] border border-white/15 text-sm text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                        CTA Destination (defaults to /sale/{formData.slug || 'slug'})
                      </label>
                      <input
                        type="text"
                        placeholder={`/sale/${formData.slug || '11-11'}`}
                        value={formData.ctaLink}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, ctaLink: e.target.value }))
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#06191B] border border-white/15 text-sm text-white"
                      />
                    </div>
                  </div>

                  {/* Toggles */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#06191B] border border-white/10 rounded-xl p-4">
                    <label className="flex items-center gap-2 text-xs text-gray-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.showBanner}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, showBanner: e.target.checked }))
                        }
                      />
                      Show Storefront Campaign Banner
                    </label>
                    <label className="flex items-center gap-2 text-xs text-gray-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.showCountdown}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, showCountdown: e.target.checked }))
                        }
                      />
                      Enable Live Countdown Timer
                    </label>
                    <label className="flex items-center gap-2 text-xs text-gray-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.announcementEnabled}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            announcementEnabled: e.target.checked,
                          }))
                        }
                      />
                      Add to Top Announcement Bar
                    </label>
                    <label className="flex items-center gap-2 text-xs text-amber-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.replaceHeroSlider}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            replaceHeroSlider: e.target.checked,
                          }))
                        }
                      />
                      Replace Homepage Hero Slider (Optional)
                    </label>
                    <label className="flex items-center gap-2 text-xs text-gray-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.landingPageEnabled}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            landingPageEnabled: e.target.checked,
                          }))
                        }
                      />
                      Enable Public `/sale/{formData.slug || 'slug'}` Page
                    </label>
                  </div>

                  {formData.announcementEnabled && (
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                        Announcement Ticker Copy
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 11.11 SALE LIVE NOW — UP TO 20% OFF"
                        value={formData.announcementText}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, announcementText: e.target.value }))
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#06191B] border border-white/15 text-sm text-white"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                      Landing Page Editorial Description
                    </label>
                    <textarea
                      rows={2}
                      value={formData.landingPageDescription}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          landingPageDescription: e.target.value,
                        }))
                      }
                      className="w-full px-3.5 py-2 rounded-xl bg-[#06191B] border border-white/15 text-sm text-white"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                        SEO Meta Title
                      </label>
                      <input
                        type="text"
                        value={formData.seoTitle}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, seoTitle: e.target.value }))
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#06191B] border border-white/15 text-sm text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                        SEO Meta Description
                      </label>
                      <input
                        type="text"
                        value={formData.seoDescription}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, seoDescription: e.target.value }))
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#06191B] border border-white/15 text-sm text-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-[#06191B] border border-white/15 text-xs font-bold uppercase tracking-wider text-gray-300 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#D4AF37] text-[#06191B] text-xs font-black uppercase tracking-widest hover:bg-[#c9a32f] disabled:opacity-50 cursor-pointer"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  {editingCampaign ? 'Save Changes' : 'Create Campaign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && (
        <DeleteConfirmModal
          isOpen={true}
          title="Delete Campaign"
          itemType="Campaign"
          itemName={`Campaign "${deleteTarget.name}" (/sale/${deleteTarget.slug}). Historical order records remain preserved.`}
          onClose={() => setDeleteTarget(null)}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  );
};
