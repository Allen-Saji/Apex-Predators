'use client';

import { use } from 'react';
import { useSearchParams } from 'next/navigation';
import { getFighter, fighters } from '@/lib/fighters';
import FightViewer from '@/components/arena/FightViewer';

export default function ArenaPage({ params }: { params: Promise<{ fightId: string }> }) {
  const { fightId } = use(params);
  const searchParams = useSearchParams();

  const leftId = searchParams.get('left') || 'kodiak';
  const rightId = searchParams.get('right') || 'fang';

  const left = getFighter(leftId) || fighters[0];
  const right = getFighter(rightId) || fighters[1];

  return (
    <div className="min-h-screen">
      <FightViewer left={left} right={right} />
    </div>
  );
}
