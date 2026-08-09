'use client';

import React, { useState } from 'react';
import { Mail, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { ScrollReveal } from '@/components/layout/ScrollReveal';

export const NewsletterSection = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubmitted(true);
      setEmail('');
    }
  };

  return (
    <section className="py-20 bg-sand/60 border-t border-sand">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <ScrollReveal variant="fade-up">
          <div className="w-12 h-12 bg-teal text-champagne rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-md">
            <Mail className="w-6 h-6" />
          </div>
          <span className="text-xs uppercase tracking-[0.3em] font-semibold text-champagne-700">
            Exclusive Access
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-teal mt-1">
            Subscribe To The OMNIA Journal
          </h2>
          <p className="text-xs sm:text-sm text-charcoal-muted mt-2 max-w-lg mx-auto leading-relaxed">
            Be the first to receive priority notifications for lawn collection launches, private velvet vault preview sales, and exclusive discount codes.
          </p>
        </ScrollReveal>

        <ScrollReveal variant="fade-up" delay={0.15}>
          {submitted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-8 bg-teal text-champagne p-6 rounded-2xl border border-champagne/40 max-w-md mx-auto flex items-center justify-center gap-3"
            >
              <CheckCircle2 className="w-6 h-6 text-champagne shrink-0" />
              <p className="text-xs font-semibold uppercase tracking-wider text-offwhite">
                Thank you! You have been added to our VIP Privé List.
              </p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-8 flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email address..."
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 px-4 py-3.5 rounded-xl bg-offwhite border border-sand text-charcoal text-xs focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal/40 shadow-inner transition-all duration-300"
              />
              <motion.button
                whileHover={{ translateY: -1 }}
                whileTap={{ scale: 0.97 }}
                type="submit"
                className="btn-premium btn-primary !py-3.5 shrink-0"
              >
                Join VIP List
              </motion.button>
            </form>
          )}
        </ScrollReveal>
      </div>
    </section>
  );
};
