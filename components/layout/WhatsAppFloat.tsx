'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';

export const WhatsAppFloat = () => {
  const pathname = usePathname();
  const [phoneNumber, setPhoneNumber] = useState('923180633323');
  const [defaultMessage, setDefaultMessage] = useState('Hi WearOMNIA, I need help with my order.');

  // Hide WhatsApp float on admin panel routes
  if (pathname?.startsWith('/admin')) {
    return null;
  }

  useEffect(() => {
    fetch('/api/site-settings')
      .then(res => res.json())
      .then(data => {
        if (data.settings?.whatsappNumber) {
          const international = data.settings.whatsappNumber.replace(/^0/, '92').replace(/\s/g, '');
          setPhoneNumber(international);
        }
      })
      .catch(() => {});
  }, []);

  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(defaultMessage)}`;

  return (
    <motion.a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className="fixed bottom-6 right-6 sm:bottom-6 sm:right-6 z-30 flex items-center gap-2.5 bg-[#25D366] text-white p-3 sm:px-4 sm:py-3 rounded-full shadow-2xl hover:shadow-[#25D366]/40 group border-2 border-white/20 font-sans"
      title="Chat on WhatsApp"
      aria-label="Chat with WearOMNIA on WhatsApp"
    >
      {/* Subtle pulse ring - optimized */}
      <motion.span
        className="absolute -inset-1 rounded-full bg-[#25D366] opacity-30"
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.3, 0.15, 0.3],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        style={{ zIndex: -1 }}
      />

      {/* WhatsApp SVG Icon */}
      <svg
        className="w-6 h-6 fill-current text-white shrink-0"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372.025-.521-.075-.148-.075-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
      </svg>

      <span className="hidden sm:inline text-xs uppercase font-bold tracking-wider">
        Chat With Us
      </span>
    </motion.a>
  );
};