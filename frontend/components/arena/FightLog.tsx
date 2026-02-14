'use client';

import { useEffect, useRef } from 'react';

export default function FightLog({ log }: { log: string[] }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ref.current?.scrollTo({ top: ref.current.scrollHeight, behavior: 'smooth' });
  }, [log]);

  if (log.length === 0) return null;

  return (
    <div
      ref={ref}
      className="mt-6 max-h-48 overflow-y-auto bg-black/60 border border-gray-800 rounded-xl p-4 space-y-1.5"
    >
      {log.map((entry, i) => (
        <div key={i} className="text-sm text-gray-300">
          <span className="text-gray-600 font-mono mr-2">[{i + 1}]</span>
          {entry}
        </div>
      ))}
    </div>
  );
}
