import React from 'react';
import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import {
  Instagram,
  ArrowRight,
  Sparkles,
  Heart,
  CheckCircle2,
  Compass,
  ShoppingBag,
} from 'lucide-react';
import { PageTransition } from '@/components/layout/PageTransition';

import { PRODUCTION_DOMAIN, getCanonicalUrl, generateFounderSchema, generateBreadcrumbSchema } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Virago Baji — Founder & Creative Vision | WearOMNIA',
  description:
    'Meet Virago Baji, founder of WearOMNIA. Discover the story and philosophy behind modern modest fashion, purposeful silhouettes, and enduring craftsmanship.',
  alternates: {
    canonical: getCanonicalUrl('/founder'),
  },
  openGraph: {
    title: 'Virago Baji — Founder & Creative Vision | WearOMNIA',
    description:
      'WearOMNIA began with a simple vision — to make modest fashion feel modern, refined, and effortless.',
    url: getCanonicalUrl('/founder'),
    type: 'profile',
    siteName: 'WearOMNIA',
    locale: 'en_PK',
    images: [
      {
        url: `${PRODUCTION_DOMAIN}/images/founder.png`,
        width: 1181,
        height: 1332,
        alt: 'Virago Baji, Founder of WearOMNIA',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Virago Baji — Founder & Creative Vision | WearOMNIA',
    description:
      'Meet Virago Baji, founder of WearOMNIA. Discover the story and philosophy behind modern modest fashion.',
    images: [`${PRODUCTION_DOMAIN}/images/founder.png`],
  },
};

export default function FounderPage() {
  const instagramUrl = 'https://www.instagram.com/life_on_camerae/';
  const founderSchema = generateFounderSchema();
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'The Founder', url: '/founder' },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(founderSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <PageTransition>
        <div className="bg-offwhite min-h-screen text-charcoal">
          {/* Breadcrumb Navigation */}
          <div className="bg-[#0A2528] border-b border-champagne/20 py-3">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex items-center gap-2 text-xs uppercase tracking-widest text-champagne/80 font-sans" aria-label="Breadcrumb">
              <Link href="/" className="hover:text-offwhite transition-colors">
                Home
              </Link>
              <span>/</span>
              <span className="text-champagne font-bold">The Founder</span>
            </nav>
          </div>
        </div>

        {/* Section 1: Editorial Hero Section */}
        <section className="relative bg-[#0A2528] text-offwhite py-16 sm:py-24 lg:py-28 overflow-hidden border-b border-champagne/25">
          {/* Subtle Ambient Lighting */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-champagne/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-teal-800/30 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
              {/* Left / Top on mobile: Large Founder Portrait */}
              <div className="lg:col-span-5 flex flex-col items-center order-1 lg:order-1">
                <div className="w-full max-w-sm sm:max-w-md">
                  <div className="relative aspect-[1181/1332] rounded-3xl overflow-hidden shadow-2xl border-2 border-champagne/40 bg-[#06191B] group">
                    <Image
                      src="/images/founder.png"
                      alt="Virago Baji, Founder of WearOMNIA"
                      fill
                      priority
                      sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 480px"
                      quality={90}
                      className="object-cover object-center group-hover:scale-102 transition-transform duration-700 ease-out"
                    />
                  </div>

                  {/* Editorial Caption Card (unobstructed, below photo) */}
                  <div className="mt-3.5 bg-[#06191B]/90 border border-champagne/25 rounded-2xl px-4 py-3 flex items-center justify-between shadow-lg">
                    <div>
                      <span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-[0.25em] text-champagne block">
                        Founder &amp; Creative Lead
                      </span>
                      <h3 className="font-serif text-lg sm:text-xl font-bold text-offwhite mt-0.5">
                        Virago Baji
                      </h3>
                    </div>
                    <span className="text-[10px] sm:text-xs text-champagne font-mono border border-champagne/30 px-2.5 py-1 rounded-full bg-champagne/10">
                      WearOMNIA
                    </span>
                  </div>
                </div>
              </div>

              {/* Right / Bottom on mobile: Editorial Hero Story */}
              <div className="lg:col-span-7 space-y-6 sm:space-y-8 order-2 lg:order-2 text-center lg:text-left">
                <div className="space-y-2">
                  <span className="font-calligraphy text-xs sm:text-sm text-champagne block tracking-[0.25em]">
                    THE VISION BEHIND WEAROMNIA
                  </span>
                  <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-black text-offwhite leading-tight tracking-tight">
                    Meet Virago Baji
                  </h1>
                  <p className="text-xs sm:text-sm uppercase tracking-widest font-semibold text-champagne-400 font-sans">
                    Founder, WearOMNIA
                  </p>
                </div>

                <div className="space-y-4 text-xs sm:text-base text-offwhite/85 leading-relaxed font-sans max-w-2xl mx-auto lg:mx-0">
                  <p className="text-sm sm:text-lg font-serif italic text-champagne-200">
                    &ldquo;WearOMNIA began with a simple vision — to make modest fashion feel modern, refined, and effortless.&rdquo;
                  </p>
                  <p>
                    For years, finding pieces that balanced authentic modesty with tailored elegance was an ongoing dilemma. Modest wear was frequently treated as an afterthought — either overly heavy, stiff formalwear or basic shapeless garments that lacked contemporary character.
                  </p>
                  <p>
                    Virago Baji founded WearOMNIA to create wardrobe staples that celebrate dignity and modern life together. Clothing designed for 8AM university lectures, office meetings, intimate family chai, and everything in between.
                  </p>
                </div>

                {/* Hero CTAs */}
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                  <a
                    href={instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl bg-champagne text-teal-950 font-sans font-bold text-xs uppercase tracking-widest hover:bg-white transition-all shadow-xl hover:shadow-champagne/25"
                    aria-label="Follow Virago Baji on Instagram (opens in new tab)"
                  >
                    <Instagram className="w-4 h-4 text-teal-950" />
                    <span>Follow Virago Baji</span>
                  </a>

                  <Link
                    href="/shop"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-teal-950/80 text-champagne border border-champagne/40 font-sans font-semibold text-xs tracking-wider hover:bg-champagne/10 hover:border-champagne transition-all"
                  >
                    <span>Explore WearOMNIA</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Founder Story Section */}
        <section className="py-20 sm:py-28 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-12">
            <div className="text-center space-y-2">
              <span className="font-calligraphy text-xs sm:text-sm text-champagne-700 block tracking-[0.2em]">
                Personal Journey
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-teal tracking-tight">
                THE STORY BEHIND THE BRAND
              </h2>
              <div className="w-16 h-0.5 bg-champagne mx-auto mt-4" />
            </div>

            <div className="space-y-6 text-xs sm:text-base text-charcoal-muted leading-relaxed font-sans">
              <p>
                Growing up in Pakistan, clothing has always carried deep emotional resonance. It is how we express our culture, our values, and our personal aesthetic. Yet as daily life became faster and more dynamic, modest clothing choices remained unexpectedly rigid.
              </p>
              <p>
                The compromise was familiar to almost every woman: buy standard fast-fashion and struggle to layer it modestly with camisoles and scarves in thirty-five-degree heat, or buy expensive, heavily embellished formal wear that felt completely out of place on a regular Tuesday afternoon.
              </p>
              <p>
                WearOMNIA was built to eliminate that friction once and for all. We believe the clothing you wear should allow you to step into any room feeling confident, comfortable, elegant, modern, refined, and entirely yourself.
              </p>
            </div>

            {/* Brand Conviction Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 pt-4">
              <div className="bg-sand/40 p-6 rounded-2xl border border-sand/80 space-y-2">
                <span className="font-serif font-bold text-teal text-base block flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-champagne-700" />
                  &ldquo;We choose modesty.&rdquo;
                </span>
                <p className="text-xs sm:text-sm text-charcoal-muted leading-relaxed">
                  Modesty is an intentional and empowering expression of personal dignity, composure, and grace.
                </p>
              </div>

              <div className="bg-sand/40 p-6 rounded-2xl border border-sand/80 space-y-2">
                <span className="font-serif font-bold text-teal text-base block flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-champagne-700" />
                  &ldquo;We choose intentional dressing.&rdquo;
                </span>
                <p className="text-xs sm:text-sm text-charcoal-muted leading-relaxed">
                  Every silhouette is created with generous ease, breathable fabrics, and functional tailoring that honors your time.
                </p>
              </div>

              <div className="bg-sand/40 p-6 rounded-2xl border border-sand/80 space-y-2">
                <span className="font-serif font-bold text-teal text-base block flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-champagne-700" />
                  &ldquo;We believe modest fashion can be modern.&rdquo;
                </span>
                <p className="text-xs sm:text-sm text-charcoal-muted leading-relaxed">
                  Clean lines, architectural cuts, and nuanced color palettes ensure your outfits feel fresh, contemporary, and worldly.
                </p>
              </div>

              <div className="bg-sand/40 p-6 rounded-2xl border border-sand/80 space-y-2">
                <span className="font-serif font-bold text-teal text-base block flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-champagne-700" />
                  &ldquo;We believe confidence and modesty can exist together.&rdquo;
                </span>
                <p className="text-xs sm:text-sm text-charcoal-muted leading-relaxed">
                  You should never have to surrender your sense of personal fashion to uphold your standards of coverage.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Modest Fashion Philosophy */}
        <section className="py-20 sm:py-24 bg-sand/35 border-y border-sand/80">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
            <span className="font-calligraphy text-xs sm:text-sm text-champagne-700 block tracking-[0.25em]">
              The Guiding Principle
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-black text-teal tracking-tight">
              MODESTY, WITH INTENTION.
            </h2>
            <p className="font-serif text-lg sm:text-xl text-teal-800 italic max-w-2xl mx-auto">
              &ldquo;WearOMNIA is created for those who want their clothing to feel modest without feeling ordinary.&rdquo;
            </p>
            <div className="space-y-4 text-xs sm:text-sm text-charcoal-muted leading-relaxed font-sans max-w-2xl mx-auto pt-2">
              <p>
                When modesty is intentional, it ceases to be a limitation and becomes a quiet signature of refinement. It shows in the generous sweep of a sleeve, the thoughtful depth of a neckline, and the fluid drape of natural textiles that move with poise.
              </p>
              <p>
                We spend months perfecting our proportions so that when you put on a WearOMNIA piece, you feel put-together instantly — ready for wherever your day takes you.
              </p>
            </div>
          </div>
        </section>

        {/* Section 4: Founder Quote / Manifesto */}
        <section className="py-20 sm:py-28 bg-[#041517] text-offwhite border-b border-champagne/20 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-champagne/10 via-transparent to-transparent pointer-events-none" />

          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-6">
            <span className="font-calligraphy text-xs sm:text-sm text-champagne block tracking-[0.25em]">
              WEAROMNIA MANIFESTO
            </span>
            <blockquote className="font-serif text-2xl sm:text-4xl lg:text-5xl font-normal text-offwhite leading-snug tracking-tight max-w-3xl mx-auto">
              &ldquo;Style should never ask you to compromise your sense of modesty.&rdquo;
            </blockquote>
            <p className="text-xs uppercase tracking-[0.25em] text-champagne font-bold font-sans pt-2">
              A WearOMNIA Brand Philosophy
            </p>
          </div>
        </section>

        {/* Section 5: Instagram Follow Section */}
        <section className="py-20 sm:py-24 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          <div className="w-16 h-16 rounded-2xl bg-sand flex items-center justify-center mx-auto text-teal shadow-sm">
            <Instagram className="w-8 h-8 text-teal" />
          </div>

          <div className="space-y-2">
            <span className="font-calligraphy text-xs sm:text-sm text-champagne-700 block tracking-[0.2em]">
              Stay Connected
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-teal tracking-tight">
              FOLLOW THE FOUNDER
            </h2>
            <p className="text-xs sm:text-sm text-charcoal-muted font-sans max-w-md mx-auto leading-relaxed pt-1">
              Get a closer look at the person and vision behind WearOMNIA, creative behind-the-scenes moments, and outfit styling reflections.
            </p>
          </div>

          <div className="pt-2">
            <a
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 px-8 py-4 rounded-xl bg-teal text-champagne font-sans font-bold text-xs uppercase tracking-widest hover:bg-teal-900 transition-all duration-300 shadow-xl hover:shadow-teal/20 group"
              aria-label="Follow Virago Baji on Instagram (opens in new tab)"
            >
              <Instagram className="w-4 h-4 text-champagne group-hover:scale-110 transition-transform" />
              <span>Follow Virago Baji on Instagram</span>
            </a>
            <p className="text-[11px] text-charcoal-muted/70 font-sans mt-3">
              @life_on_camerae • Official Profile
            </p>
          </div>
        </section>

        {/* Section 6: Return to Storefront CTA */}
        <section className="py-14 bg-sand/30 border-t border-sand/70 text-center">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left">
              <h4 className="font-serif text-lg font-bold text-teal">
                Experience WearOMNIA Ready-to-Wear
              </h4>
              <p className="text-xs text-charcoal-muted font-sans">
                Discover limited batch modest coordinates, sets, and separates.
              </p>
            </div>
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-champagne text-teal-950 font-bold text-xs uppercase tracking-wider hover:bg-teal hover:text-champagne transition-all shadow-sm"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Shop All Pieces</span>
            </Link>
          </div>
        </section>
      </div>
    </PageTransition>
    </>
  );
}
