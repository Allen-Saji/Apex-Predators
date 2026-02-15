'use client';

import Link from 'next/link';
import { useState, useMemo } from 'react';
import { useAccount } from 'wagmi';
import { motion, AnimatePresence } from 'framer-motion';
import WalletConnect from '@/components/common/WalletConnect';
import { useOwner } from '@/hooks/useContracts';

const BASE_NAV_ITEMS = [
  { href: '/', label: 'Home' },
  { href: '/fighters', label: 'Fighters' },
  { href: '/arena', label: 'Arena' },
  { href: '/betting', label: 'Betting' },
];

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { address } = useAccount();
  const { data: owner } = useOwner();
  const isOwner = address && owner && address.toLowerCase() === owner.toLowerCase();
  const navItems = useMemo(
    () => isOwner ? [...BASE_NAV_ITEMS, { href: '/admin', label: 'Admin' }] : BASE_NAV_ITEMS,
    [isOwner],
  );
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a]/90 backdrop-blur-md border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-1.5">
          <span className="font-black text-xl tracking-tight">
            <span className="text-red-600">APEX</span>{' '}
            <span className="text-white/90">PREDATORS</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-semibold uppercase tracking-wider text-gray-400 hover:text-white transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <WalletConnect />

          {/* Mobile menu button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden text-white p-2"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden overflow-hidden bg-[#111] border-b border-white/5"
          >
            <div className="px-4 py-4 flex flex-col gap-3">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className="text-sm font-semibold uppercase tracking-wider text-gray-400 hover:text-white transition-colors py-2"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
