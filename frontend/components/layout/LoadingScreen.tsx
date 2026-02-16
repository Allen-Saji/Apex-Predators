'use client';

import { motion } from 'framer-motion';

export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-[9999] bg-[#0a0a0a] flex items-center justify-center overflow-hidden">
      {/* Subtle red ambient glow */}
      <div className="absolute inset-0">
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(220,38,38,0.08) 0%, transparent 70%)' }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1.5, opacity: 1 }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
        />
      </div>

      {/* Red horizontal slash line that wipes across */}
      <motion.div
        className="absolute top-1/2 -translate-y-1/2 h-[2px] bg-gradient-to-r from-transparent via-red-600 to-transparent"
        initial={{ left: '-100%', width: '60%' }}
        animate={{ left: '140%' }}
        transition={{ delay: 0.3, duration: 0.8, ease: 'easeInOut' }}
      />

      {/* Center content */}
      <div className="relative z-10 flex flex-col items-center gap-4">
        {/* APEX — big and bold */}
        <motion.h1
          className="text-6xl md:text-8xl lg:text-9xl font-black uppercase tracking-tight leading-none"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5, ease: 'easeOut' }}
        >
          <span className="text-red-600">APEX</span>
        </motion.h1>

        {/* PREDATORS — spaced out below */}
        <motion.h2
          className="text-xl md:text-3xl lg:text-4xl font-black uppercase tracking-[0.5em] text-white/80 leading-none"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.4, ease: 'easeOut' }}
        >
          PREDATORS
        </motion.h2>

        {/* Thin red divider */}
        <motion.div
          className="w-24 h-[1px] bg-red-600 mt-2"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.7, duration: 0.4, ease: 'easeOut' }}
        />

        {/* Loading bar */}
        <motion.div
          className="w-48 h-[2px] bg-white/5 rounded-full overflow-hidden mt-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
        >
          <motion.div
            className="h-full bg-red-600 rounded-full"
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ delay: 1, duration: 1.5, ease: 'easeInOut' }}
          />
        </motion.div>

        <motion.p
          className="text-[10px] uppercase tracking-[0.4em] text-gray-600 mt-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1 }}
        >
          Enter the arena
        </motion.p>
      </div>

      {/* Corner accents */}
      <motion.div
        className="absolute top-8 left-8 w-8 h-[1px] bg-red-800"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: 0.6, duration: 0.3 }}
        style={{ transformOrigin: 'left' }}
      />
      <motion.div
        className="absolute top-8 left-8 w-[1px] h-8 bg-red-800"
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ delay: 0.6, duration: 0.3 }}
        style={{ transformOrigin: 'top' }}
      />
      <motion.div
        className="absolute bottom-8 right-8 w-8 h-[1px] bg-red-800"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: 0.6, duration: 0.3 }}
        style={{ transformOrigin: 'right' }}
      />
      <motion.div
        className="absolute bottom-8 right-8 w-[1px] h-8 bg-red-800"
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ delay: 0.6, duration: 0.3 }}
        style={{ transformOrigin: 'bottom' }}
      />
    </div>
  );
}
