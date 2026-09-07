'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Heart, Search, Menu, X, Truck, MapPin, Phone } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';

export const Header: React.FC = () => {
  const pathname = usePathname();
  const { cart, setIsCartOpen } = useCart();
  const { wishlist } = useWishlist();

  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState<{ id: string; name: string; slug: string }[]>([]);
  const [cartBouncing, setCartBouncing] = useState(false);

  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);

  useEffect(() => {
    const handleCartBounce = () => {
      setCartBouncing(true);
      const timer = setTimeout(() => setCartBouncing(false), 450);
      return () => clearTimeout(timer);
    };

    window.addEventListener('wearomnia-cart-bounce', handleCartBounce);
    return () => window.removeEventListener('wearomnia-cart-bounce', handleCartBounce);
  }, []);

  // Auto-hide header on Admin dashboard routes
  const isAdmin = pathname?.startsWith('/admin');

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    fetch('/api/admin/categories')
      .then((res) => res.json())
      .then((data) => {
        if (data.categories && data.categories.length > 0) {
          setCategories(data.categories);
        }
      })
      .catch(() => { });
  }, []);

  if (isAdmin) {
    return null;
  }

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'Shop All', href: '/shop' },
    ...categories.map((c) => ({ name: c.name, href: `/shop?category=${c.id}` })),
    { name: 'Our Story', href: '/our-story' },
    { name: 'Contact Us', href: '/contact' },
  ];

  return (
    <>
      {/* Top Announcement Bar */}
      <div className="bg-teal text-champagne text-[10px] sm:text-xs py-2 px-3 sm:px-4 text-center tracking-wider sm:tracking-widest uppercase font-sans font-semibold border-b border-champagne/20 shadow-sm relative overflow-hidden">
        <span className="inline-flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5"><Truck className="w-3.5 h-3.5 text-champagne" /> Nationwide Express Delivery Across Pakistan</span>
          <span className="hidden md:inline">•</span>
          <span className="hidden md:inline">Free Shipping On Orders Above Rs. 10,000</span>
          <span className="hidden sm:inline">•</span>
          <span className="hidden sm:inline font-bold text-offwhite">Cash On Delivery Available</span>
        </span>
      </div>

      {/* Main Sticky Header with Premium Glass Effect */}
      <header
        className={`sticky top-0 z-40 w-full transition-all duration-500 ease-premium ${isScrolled
          ? 'glass-header py-2 sm:py-3 shadow-md border-b border-champagne/25'
          : 'bg-offwhite/95 backdrop-blur-md py-3.5 sm:py-4 border-b border-sand/60'
          }`}
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Mobile Menu Button */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden text-teal hover:text-champagne-700 transition-colors p-2 rounded-xl hover:bg-sand/60"
            aria-label="Toggle menu"
          >
            <Menu className="w-6 h-6" />
          </motion.button>

          {/* Brand Logo with Clean Modern Signature Tag */}
          <Link href="/" className="flex flex-col items-center group select-none">
            <span className="font-serif text-2xl sm:text-3xl font-black tracking-tight uppercase text-teal group-hover:text-champagne-700 transition-colors duration-300">
              Wear<span className="text-champagne-600">OMNIA</span>
            </span>
            <span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-[0.25em] text-champagne-700 mt-0.5">
              Modest Couture
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-7">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className={`text-xs uppercase font-bold tracking-widest transition-all duration-300 relative py-1 hover:text-champagne-700 ${pathname === link.href ? 'text-teal font-black' : 'text-teal/80'
                  }`}
              >
                {link.name}
                {pathname === link.href && (
                  <motion.div
                    layoutId="nav-underline"
                    className="absolute -bottom-0.5 left-0 right-0 h-[2px] bg-champagne-600 rounded-full"
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  />
                )}
              </Link>
            ))}
          </nav>

          {/* Header Action Icons */}
          <div className="flex items-center gap-1 sm:gap-3 md:gap-5">
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={() => setSearchOpen(!searchOpen)}
              className="p-1.5 sm:p-2 text-teal hover:text-champagne-700 transition-colors duration-300"
              title="Search"
            >
              <Search className="w-5 h-5" />
            </motion.button>

            <Link
              href="/shop?wishlist=true"
              className="relative p-1.5 sm:p-2 text-teal hover:text-champagne-700 transition-colors duration-300"
              title="Wishlist"
            >
              <Heart className="w-5 h-5" />
              {wishlist.length > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  key={wishlist.length}
                  transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                  className="absolute -top-0.5 -right-0.5 sm:top-0 sm:right-0 bg-champagne-700 text-teal-950 text-[9px] font-extrabold min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center shadow-sm leading-none"
                >
                  {wishlist.length}
                </motion.span>
              )}
            </Link>

            {/* Shopping Bag Icon with Luxury Bounce on Arrival */}
            <motion.button
              id="header-cart-button"
              data-cart-target="true"
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.93 }}
              animate={
                cartBouncing
                  ? { scale: [1, 1.2, 0.92, 1.08, 1], rotate: [0, -3, 3, -1, 0] }
                  : { scale: 1, rotate: 0 }
              }
              transition={{ duration: 0.48, ease: [0.16, 1, 0.3, 1] }}
              onClick={() => setIsCartOpen(true)}
              className="relative p-1.5 sm:p-2 text-teal hover:text-champagne-700 transition-colors duration-300 flex items-center justify-center"
              title="Shopping Bag"
              aria-label={`Shopping bag with ${cartCount} items`}
            >
              {/* Luxury Expanding Gold Ripple on Item Arrival */}
              <AnimatePresence>
                {cartBouncing && (
                  <motion.span
                    key="cart-ripple"
                    initial={{ scale: 0.7, opacity: 1 }}
                    animate={{ scale: 1.85, opacity: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.55, ease: 'easeOut' }}
                    className="absolute inset-0 rounded-full border-2 border-champagne pointer-events-none shadow-[0_0_14px_rgba(223,195,160,0.55)]"
                  />
                )}
              </AnimatePresence>

              <ShoppingBag
                className={`w-6 h-6 sm:w-7 sm:h-7 transition-colors duration-300 ${
                  cartBouncing ? 'text-champagne-600' : 'text-teal'
                }`}
              />
              {cartCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  key={cartCount}
                  transition={{ type: 'spring', stiffness: 500, damping: 14 }}
                  className="absolute -top-1 -right-1 bg-teal text-champagne text-[10px] font-bold min-w-[20px] h-[20px] px-1 rounded-full flex items-center justify-center shadow-lg border-2 border-offwhite leading-none shrink-0"
                >
                  {cartCount}
                </motion.span>
              )}
            </motion.button>
          </div>
        </div>
      </header>

      {/* Search Overlay */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-x-0 top-[90px] sm:top-[110px] z-50 glass-light p-4 sm:p-6"
          >
            <div className="max-w-3xl mx-auto flex items-center gap-3">
              <Search className="w-5 h-5 text-teal shrink-0" />
              <input
                type="text"
                autoFocus
                placeholder="Search for uni fits, kaftans, or your next outfit..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && searchQuery.trim()) {
                    window.location.href = `/shop?search=${encodeURIComponent(searchQuery.trim())}`;
                  }
                }}
                className="w-full bg-transparent text-sm sm:text-base text-teal placeholder-charcoal-muted focus:outline-none font-serif"
              />
              <button onClick={() => setSearchOpen(false)} className="p-1 text-teal shrink-0 hover:text-champagne-700 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Slide-Over Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-teal-950/60 backdrop-blur-sm"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="fixed inset-y-0 left-0 z-50 w-[85%] max-w-sm bg-offwhite flex flex-col justify-between p-6 shadow-2xl overflow-y-auto"
            >
              <div>
                <div className="flex items-center justify-between border-b border-sand pb-4 mb-6">
                  <span className="font-serif text-2xl font-bold uppercase text-teal">
                    Wear<span className="text-champagne-700">OMNIA</span>
                  </span>
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-1 text-teal"
                  >
                    <X className="w-6 h-6" />
                  </motion.button>
                </div>

                <nav className="flex flex-col gap-5">
                  {navLinks.map((link, index) => (
                    <motion.div
                      key={link.name}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
                    >
                      <Link
                        href={link.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className="font-serif text-lg sm:text-xl font-bold text-teal hover:text-champagne-700 uppercase transition-colors duration-300"
                      >
                        {link.name}
                      </Link>
                    </motion.div>
                  ))}
                  <Link
                    href="/shop?wishlist=true"
                    onClick={() => setMobileMenuOpen(false)}
                    className="font-serif text-lg sm:text-xl font-bold text-teal hover:text-champagne-700 uppercase flex items-center justify-between pt-2 border-t border-sand/40 transition-colors duration-300"
                  >
                    <span className="flex items-center gap-2">
                      <Heart className="w-5 h-5 text-champagne-700 fill-current" /> My Wishlist
                    </span>
                    <span className="bg-teal text-champagne text-xs px-2.5 py-0.5 rounded-full font-sans font-semibold">
                      {wishlist.length}
                    </span>
                  </Link>
                </nav>
              </div>

              <div className="border-t border-sand pt-6 mt-6 text-center text-xs text-charcoal-muted font-sans space-y-2">
                <p className="inline-flex items-center justify-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-teal" /> Lahore, Pakistan</p>
                <a href="tel:+923180633323" className="flex items-center justify-center gap-1.5 hover:text-champagne-700 transition-colors"><Phone className="w-3.5 h-3.5 text-teal" /> Helpline: 03180633323</a>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
