'use client';

import React from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ShoppingBag,
  TrendingUp,
  Tag,
  BarChart3,
  Package,
  Info,
  Eye,
  Ticket,
} from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import type { CampaignAnalyticsReport } from '@/lib/campaign-analytics';

interface CampaignAnalyticsClientProps {
  campaign: {
    id: string;
    name: string;
    slug: string;
    publicTitle: string;
    status: string;
    effectiveStatus: string;
    statusLabel: string;
    discountType: string;
    discountValue: number;
    formattedStartDate: string;
    formattedEndDate: string;
    timezone: string;
    previewToken: string | null;
  };
  analytics: CampaignAnalyticsReport;
}

export const CampaignAnalyticsClient: React.FC<CampaignAnalyticsClientProps> = ({
  campaign,
  analytics,
}) => {
  const kpiCards = [
    {
      label: 'Campaign Orders',
      value: analytics.campaignOrdersCount.toLocaleString(),
      sub: `${analytics.unitsSold} units sold • ${analytics.cancelledOrReturnedCount} cancelled/returned excluded`,
      icon: ShoppingBag,
      accent: 'text-sky-300',
    },
    {
      label: 'Gross Merchandise Value (GMV)',
      value: `Rs. ${analytics.grossMerchandiseValue.toLocaleString()}`,
      sub: 'Pre-discount retail value of campaign items sold',
      icon: BarChart3,
      accent: 'text-gray-200',
    },
    {
      label: 'Total Discounts Granted',
      value: `Rs. ${analytics.totalDiscountsGranted.toLocaleString()}`,
      sub: `Campaign: Rs. ${analytics.campaignDiscountsGranted.toLocaleString()} • Coupons: Rs. ${analytics.couponDiscountsGranted.toLocaleString()}`,
      icon: Tag,
      accent: 'text-amber-300',
    },
    {
      label: 'Net Merchandise Revenue',
      value: `Rs. ${analytics.netMerchandiseRevenue.toLocaleString()}`,
      sub: `Actual charged order total (incl. shipping): Rs. ${analytics.totalChargedRevenue.toLocaleString()}`,
      icon: TrendingUp,
      accent: 'text-emerald-300',
    },
    {
      label: 'Average Order Value (AOV)',
      value: `Rs. ${analytics.averageOrderValue.toLocaleString()}`,
      sub: 'Actual charged revenue ÷ valid campaign orders',
      icon: Package,
      accent: 'text-[#D4AF37]',
    },
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={`Campaign Analytics: ${campaign.name}`}
        description={`${campaign.publicTitle} (/sale/${campaign.slug}) • ${campaign.formattedStartDate} → ${campaign.formattedEndDate} (${campaign.timezone})`}
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/admin/campaigns"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0A2528] border border-white/15 text-xs font-bold text-gray-200 hover:text-white"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Campaigns
            </Link>
            <a
              href={`/sale/${campaign.slug}${campaign.previewToken ? `?preview=${campaign.previewToken}` : ''}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#D4AF37] text-[#06191B] text-xs font-extrabold uppercase tracking-wider"
            >
              <Eye className="w-3.5 h-3.5" />
              Open Landing Page
            </a>
          </div>
        }
      />

      {/* Accounting Clarity Disclosure */}
      <div className="bg-[#0A2528] border border-[#D4AF37]/30 rounded-2xl p-4 flex items-start gap-3 text-xs text-gray-200">
        <Info className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
        <div>
          <strong className="text-[#D4AF37] block">Revenue vs. Profit Accounting Policy</strong>
          <p className="text-gray-300 mt-0.5">{analytics.revenueNote}</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="bg-[#0A2528] border border-[#D4AF37]/20 rounded-2xl p-4 space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  {card.label}
                </span>
                <Icon className={`w-4 h-4 ${card.accent}`} />
              </div>
              <div className={`text-xl font-black ${card.accent}`}>{card.value}</div>
              <p className="text-[11px] text-gray-400 leading-snug">{card.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Sales By Product */}
      <div className="bg-[#0A2528] border border-[#D4AF37]/20 rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-white/10">
          <h2 className="font-serif text-lg font-bold text-[#FAF8F5]">Sales By Product</h2>
          <p className="text-xs text-gray-400">
            Breakdown of campaign-attributed product sales using historical charged prices.
          </p>
        </div>

        {analytics.salesByProduct.length === 0 ? (
          <div className="p-8 text-center text-xs text-gray-400">
            No valid campaign orders recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#06191B] text-[10px] uppercase tracking-wider text-gray-400">
                <tr>
                  <th className="py-3 px-4">Product</th>
                  <th className="py-3 px-4 text-right">Orders</th>
                  <th className="py-3 px-4 text-right">Units Sold</th>
                  <th className="py-3 px-4 text-right">Gross Value (GMV)</th>
                  <th className="py-3 px-4 text-right">Campaign Discounts</th>
                  <th className="py-3 px-4 text-right">Net Product Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {analytics.salesByProduct.map((row, idx) => (
                  <tr key={row.productId || idx} className="hover:bg-white/5">
                    <td className="py-3 px-4 font-semibold text-[#FAF8F5]">
                      {row.productTitle}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-gray-300">
                      {row.ordersCount}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-gray-300">
                      {row.unitsSold}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-gray-300">
                      Rs. {row.grossValue.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-amber-300">
                      - Rs. {row.discountGranted.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-300">
                      Rs. {row.netRevenue.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Coupon Usage During Campaign */}
      <div className="bg-[#0A2528] border border-[#D4AF37]/20 rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-white/10 flex items-center gap-2">
          <Ticket className="w-4 h-4 text-[#D4AF37]" />
          <div>
            <h2 className="font-serif text-lg font-bold text-[#FAF8F5]">
              Coupon Usage on Campaign Orders
            </h2>
            <p className="text-xs text-gray-400">
              Promo codes applied on orders overlapping with this campaign.
            </p>
          </div>
        </div>

        {analytics.couponUsage.length === 0 ? (
          <div className="p-6 text-xs text-gray-400">
            No stacked coupons applied to orders under this campaign.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#06191B] text-[10px] uppercase tracking-wider text-gray-400">
                <tr>
                  <th className="py-3 px-4">Coupon Code</th>
                  <th className="py-3 px-4 text-right">Campaign Orders Used</th>
                  <th className="py-3 px-4 text-right">Coupon Discount Granted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {analytics.couponUsage.map((c) => (
                  <tr key={c.couponCode} className="hover:bg-white/5">
                    <td className="py-3 px-4 font-mono font-bold text-[#D4AF37]">
                      {c.couponCode}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-gray-300">
                      {c.ordersCount}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-amber-300">
                      Rs. {c.totalCouponDiscount.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
