'use client';

import { use } from 'react';
import { notFound } from 'next/navigation';
import { getFighter } from '@/lib/fighters';
import FighterProfile from '@/components/fighters/FighterProfile';

export default function FighterPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const fighter = getFighter(id);
  if (!fighter) return notFound();

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <FighterProfile fighter={fighter} />
    </div>
  );
}
