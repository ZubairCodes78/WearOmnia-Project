import React from 'react';
import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import {
  Heart,
  ShieldCheck,
  Scissors,
  Layers,
  ArrowRight,
  Package,
  Clock,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';
import { PageTransition } from '@/components/layout/PageTransition';

export const metadata: Metadata = {
  title: 'Our Story & Craftsmanship Heritage | WearOMNIA Modest Couture',
  description:
    'Discover the journey of WearOMNIA. Handcrafted in Pakistan with pure raw silks, delicate organzas, and artisanal embroidery designed for timeless modest elegance.',
};

export default function OurStoryPage() {
  return (
    <PageTransition>
      <div className="bg-offwhite min-h-screen">
        {/* Editorial Hero Header */}
        <section className="relative bg-[#0A2528] text-offwhite py-20 sm:py-28 overflow-hidden border-b border-champagne/25">
          <div className="absolute top-0 right-0 w-96 h-96 bg-champagne/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-teal-800/20 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-4">
            {/* Breadcrumb */}
            <div className="flex items-center justify-center gap-2 text-xs uppercase tracking-widest text-champagne/80 font-sans mb-2">
              <Link href="/" className="hover:text-offwhite transition-colors">Home</Link>
              <span>/</span>
              <span className="text-champagne font-bold">Our Story</span>
            </div>

            <p className="font-calligraphy text-xs sm:text-sm text-champagne block tracking-[0.2em]">
              The Heritage of Modest Couture
            </p>

            <h1 className="font-serif text-3xl sm:text-6xl font-black text-offwhite max-w-4xl mx-auto leading-tight tracking-tight">
              Crafting Dignity, Grace &amp; Timeless Modest Wear
            </h1>

            <p className="text-xs sm:text-base text-offwhite/80 max-w-2xl mx-auto font-sans leading-relaxed pt-2">
              WearOMNIA was founded on a singular conviction: modest attire should never compromise on fabric luxury, flattering silhouette, or enduring durability.
            </p>
          </div>
        </section>

        {/* Chapter 1: The Beginning */}
        <section className="py-20 sm:py-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            {/* Overlapping 3D Imagery */}
            <div className="lg:col-span-6 relative">
              <div className="relative aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl border-2 border-sand card-3d">
                <Image
                  src="/images/kaftan-1.jpg"
                  alt="WearOMNIA Artisan Workshop"
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover object-center"
                />
              </div>
              <div className="absolute -bottom-8 -right-6 w-1/2 aspect-square rounded-2xl overflow-hidden shadow-2xl border-4 border-offwhite hidden sm:block card-3d">
                <Image
                  src="/images/kaftan-2.jpg"
                  alt="Delicate Embroidery Detail"
                  fill
                  sizes="25vw"
                  className="object-cover object-center"
                />
              </div>
            </div>

            {/* Narrative Story */}
            <div className="lg:col-span-6 space-y-6">
              <div className="space-y-1">
                <span className="font-calligraphy text-xs sm:text-sm text-champagne-700 block tracking-[0.2em]">
                  How It All Started
                </span>
                <h2 className="font-serif text-3xl sm:text-4xl font-bold text-teal leading-tight">
                  Born From A Personal Quest for Elegance
                </h2>
              </div>

              <div className="space-y-4 text-xs sm:text-sm text-charcoal-muted leading-relaxed font-sans">
                <p>
                  We started WearOMNIA because &ldquo;I have nothing to wear&rdquo; somehow became a daily morning meeting before 8AM university lectures, coffee runs, and impromptu plans.
                </p>
                <p>
                  For years, young Pakistani women faced an annoying compromise: stiff, synthetic fabrics that wrinkle within twenty minutes, or complicated formal wear that felt impossible to style casually.
                </p>
                <p>
                  We wanted ready-to-wear modest pieces that look like you planned the outfit for hours — even when you got ready in five minutes. Breathable fabrics, graceful drapes, and timeless cuts that you can wear on repeat with total confidence.
                </p>
              </div>

              {/* Humorous Relatable Origin Box */}
              <div className="bg-sand/70 border-l-4 border-teal p-4 rounded-r-2xl text-xs text-charcoal space-y-1 shadow-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal shrink-0" />
                  <strong className="text-teal font-bold uppercase tracking-wider text-[11px]">The Outfit Philosophy</strong>
                </div>
                <p className="text-[11px] sm:text-xs text-charcoal-muted leading-relaxed font-sans">
                  The goal was simple: modest enough for university, chic enough for a dinner plan, and pretty enough that someone across the room will definitely ask where you bought it.
                </p>
              </div>

              <div className="pt-2 border-t border-sand">
                <div className="grid grid-cols-3 gap-4 text-center py-3">
                  <div className="p-3 bg-sand/60 rounded-2xl card-3d-subtle">
                    <p className="font-serif text-2xl font-black text-teal">10,000+</p>
                    <p className="text-[10px] sm:text-xs text-charcoal-muted mt-0.5">Parcels Delivered</p>
                  </div>
                  <div className="p-3 bg-sand/60 rounded-2xl card-3d-subtle">
                    <p className="font-serif text-2xl font-black text-teal">100%</p>
                    <p className="text-[10px] sm:text-xs text-charcoal-muted mt-0.5">Handcrafted</p>
                  </div>
                  <div className="p-3 bg-sand/60 rounded-2xl card-3d-subtle">
                    <p className="font-serif text-2xl font-black text-teal">4.9 ★</p>
                    <p className="text-[10px] sm:text-xs text-charcoal-muted mt-0.5">Client Rating</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Chapter 2: The 4 Pillars of WearOMNIA */}
        <section className="py-20 bg-sand/40 border-t border-b border-sand">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <span className="font-calligraphy text-xs sm:text-sm text-champagne-700 block tracking-[0.2em]">
                Our Core Principles
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-teal">
                What Sets WearOMNIA Apart
              </h2>
              <p className="text-xs sm:text-sm text-charcoal-muted font-sans">
                Every seam, cut, and fold is guided by our four uncompromising commitments to our community.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Pillar 1 */}
              <div className="bg-offwhite p-6 rounded-3xl border border-sand shadow-lg space-y-3 card-3d">
                <div className="w-12 h-12 rounded-2xl bg-teal-950 text-champagne flex items-center justify-center shadow-md">
                  <Scissors className="w-6 h-6 text-champagne" />
                </div>
                <h3 className="font-serif text-lg font-bold text-teal">Micro-Batch Tailoring</h3>
                <p className="text-xs text-charcoal-muted leading-relaxed font-sans">
                  We reject assembly lines. Each piece is hand-cut and individually assembled by master tailors with decades of experience.
                </p>
              </div>

              {/* Pillar 2 */}
              <div className="bg-offwhite p-6 rounded-3xl border border-sand shadow-lg space-y-3 card-3d">
                <div className="w-12 h-12 rounded-2xl bg-teal-950 text-champagne flex items-center justify-center shadow-md">
                  <Layers className="w-6 h-6 text-champagne" />
                </div>
                <h3 className="font-serif text-lg font-bold text-teal">Pure Authentic Fabrics</h3>
                <p className="text-xs text-charcoal-muted leading-relaxed font-sans">
                  From pure raw silks and weightless organza to fine breathable linens, our fabrics feel soothing on skin and fall with majestic grace.
                </p>
              </div>

              {/* Pillar 3 */}
              <div className="bg-offwhite p-6 rounded-3xl border border-sand shadow-lg space-y-3 card-3d">
                <div className="w-12 h-12 rounded-2xl bg-teal-950 text-champagne flex items-center justify-center shadow-md">
                  <Heart className="w-6 h-6 text-champagne" />
                </div>
                <h3 className="font-serif text-lg font-bold text-teal">Graceful Modesty</h3>
                <p className="text-xs text-charcoal-muted leading-relaxed font-sans">
                  Modesty is not an afterthought for us—it is our philosophy. Generous cuts and non-sheer textiles ensure complete peace of mind.
                </p>
              </div>

              {/* Pillar 4 */}
              <div className="bg-offwhite p-6 rounded-3xl border border-sand shadow-lg space-y-3 card-3d">
                <div className="w-12 h-12 rounded-2xl bg-teal-950 text-champagne flex items-center justify-center shadow-md">
                  <ShieldCheck className="w-6 h-6 text-champagne" />
                </div>
                <h3 className="font-serif text-lg font-bold text-teal">Nationwide Trust</h3>
                <p className="text-xs text-charcoal-muted leading-relaxed font-sans">
                  We deliver across all cities in Pakistan with Cash On Delivery, doorstep inspection, and friendly 7-day exchange assistance.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Chapter 3: The Artisanal Crafting Process */}
        <section className="py-20 sm:py-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="font-calligraphy text-xs sm:text-sm text-champagne-700 block tracking-[0.2em]">
              From Needle To Garment
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-teal">
              Our Thoughtful Crafting Journey
            </h2>
            <p className="text-xs sm:text-sm text-charcoal-muted font-sans">
              How a WearOMNIA garment comes to life, from initial drape study to your doorstep.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 bg-offwhite rounded-3xl border border-sand space-y-3 card-3d-subtle relative">
              <span className="font-mono text-3xl font-black text-champagne-600 block">01</span>
              <h4 className="font-serif text-base font-bold text-teal">Silhouette &amp; Drape Study</h4>
              <p className="text-xs text-charcoal-muted leading-relaxed font-sans">
                Each design begins with custom sketches focusing on flow, shoulder line, and elegant modesty.
              </p>
            </div>

            <div className="p-6 bg-offwhite rounded-3xl border border-sand space-y-3 card-3d-subtle relative">
              <span className="font-mono text-3xl font-black text-champagne-600 block">02</span>
              <h4 className="font-serif text-base font-bold text-teal">Textile Curation</h4>
              <p className="text-xs text-charcoal-muted leading-relaxed font-sans">
                We select premium raw silks, organza trims, and pure threads dyed in exclusive jewel and pastel shades.
              </p>
            </div>

            <div className="p-6 bg-offwhite rounded-3xl border border-sand space-y-3 card-3d-subtle relative">
              <span className="font-mono text-3xl font-black text-champagne-600 block">03</span>
              <h4 className="font-serif text-base font-bold text-teal">Hand Embellishment</h4>
              <p className="text-xs text-charcoal-muted leading-relaxed font-sans">
                Skilled artisans apply delicate needlework, zardozi motifs, and hand-finished hems with utmost care.
              </p>
            </div>

            <div className="p-6 bg-offwhite rounded-3xl border border-sand space-y-3 card-3d-subtle relative">
              <span className="font-mono text-3xl font-black text-champagne-600 block">04</span>
              <h4 className="font-serif text-base font-bold text-teal">Quality Inspection</h4>
              <p className="text-xs text-charcoal-muted leading-relaxed font-sans">
                Before packaging in our signature box, every garment undergoes a rigorous 4-point quality inspection.
              </p>
            </div>
          </div>
        </section>

        {/* Chapter 4: Founder's Note Banner */}
        <section className="py-20 bg-teal text-offwhite relative overflow-hidden">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6 relative z-10">
            <span className="font-calligraphy text-xs sm:text-sm text-champagne block tracking-[0.2em]">
              A Personal Promise
            </span>

            <blockquote className="font-serif text-xl sm:text-2xl font-medium leading-relaxed text-offwhite/95">
              &ldquo;When you wear a WearOMNIA piece, we want you to feel an immediate sense of effortless dignity, confidence, and comfort. We do not design for passing fads; we craft keepsakes that remain cherished season after season.&rdquo;
            </blockquote>

            <div className="pt-2">
              <p className="font-serif font-bold text-champagne tracking-wider uppercase text-sm">
                The Creative Direction
              </p>
              <p className="text-xs text-offwhite/60 mt-0.5 font-sans">
                WearOMNIA Couture • Lahore, Pakistan
              </p>
            </div>
          </div>
        </section>

        {/* CTA: Explore Collections */}
        <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="space-y-2">
            <span className="font-calligraphy text-xs sm:text-sm text-champagne-700 block tracking-[0.2em]">
              Ready to Experience WearOMNIA?
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-teal">
              Discover Our Ready-To-Wear Collection
            </h2>
            <p className="text-xs sm:text-sm text-charcoal-muted max-w-md mx-auto font-sans">
              Enjoy cash on delivery, free shipping on qualifying orders, and personal sizing assistance.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link
              href="/shop"
              className="bg-teal text-champagne px-8 py-4 rounded-xl text-xs uppercase font-extrabold tracking-widest hover:bg-teal-900 transition-all duration-300 shadow-xl border border-champagne/30 btn-3d inline-flex items-center gap-2"
            >
              Shop All Garments <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="https://wa.me/923001234567?text=Hi%20WearOMNIA,%20I%20would%20like%20to%20inquire%20about%20your%20collection."
              target="_blank"
              rel="noopener noreferrer"
              className="bg-sand hover:bg-sand/80 text-teal px-8 py-4 rounded-xl text-xs uppercase font-bold tracking-widest transition-all duration-300 border border-sand shadow-sm"
            >
              WhatsApp Us
            </a>
          </div>
        </section>
      </div>
    </PageTransition>
  );
}
