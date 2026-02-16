'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const STAGES = [
  { key: 'closing_pool', label: 'Closing Pool' },
  { key: 'creating_fight', label: 'Creating Fight' },
  { key: 'committing_seed', label: 'Committing Seed' },
  { key: 'waiting_reveal_delay', label: 'Waiting Reveal' },
  { key: 'simulating', label: 'Running Fight' },
  { key: 'streaming', label: 'Live' },
] as const;

function getStageIndex(stage: string | null): number {
  if (!stage) return -1;
  return STAGES.findIndex((s) => s.key === stage);
}

function formatCountdown(seconds: number): string {
  if (seconds <= 0) return '0s';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function useCountdown(eta: number | null): number | null {
  const [remaining, setRemaining] = useState<number | null>(() => {
    if (!eta) return null;
    return Math.max(0, eta - Math.floor(Date.now() / 1000));
  });

  useEffect(() => {
    if (!eta) { setRemaining(null); return; }
    const tick = () => setRemaining(Math.max(0, eta - Math.floor(Date.now() / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [eta]);

  return remaining;
}

function CompactStepper({ activeIndex, eta }: { activeIndex: number; eta: number | null }) {
  const remaining = useCountdown(activeIndex === 3 ? eta : null); // index 3 = waiting_reveal_delay

  return (
    <div className="flex flex-col items-center gap-1.5">
      {/* Dots with connecting lines */}
      <div className="flex items-center gap-0">
        {STAGES.map((stage, i) => {
          const isComplete = i < activeIndex;
          const isActive = i === activeIndex;
          const isLast = i === STAGES.length - 1;
          return (
            <div key={stage.key} className="flex items-center">
              {isActive ? (
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
                </span>
              ) : (
                <span
                  className={`inline-block w-2 h-2 rounded-full ${
                    isComplete ? 'bg-green-400' : 'bg-gray-600/60'
                  }`}
                />
              )}
              {!isLast && (
                <span
                  className={`inline-block w-3 h-px ${
                    isComplete ? 'bg-green-400/50' : 'bg-gray-700'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
      {/* Active stage label + optional countdown */}
      {activeIndex >= 0 && activeIndex < STAGES.length && (
        <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">
          {STAGES[activeIndex].label}
          {remaining !== null && remaining > 0 && (
            <span className="text-amber-400 ml-1 font-mono">{formatCountdown(remaining)}</span>
          )}
        </span>
      )}
    </div>
  );
}

function FullStepper({ activeIndex, eta }: { activeIndex: number; eta: number | null }) {
  const remaining = useCountdown(activeIndex === 3 ? eta : null);

  return (
    <div className="flex flex-col gap-0 w-full max-w-[180px]">
      {STAGES.map((stage, i) => {
        const isComplete = i < activeIndex;
        const isActive = i === activeIndex;
        const isLast = i === STAGES.length - 1;
        const showCountdown = isActive && i === 3 && remaining !== null && remaining > 0;

        return (
          <div key={stage.key} className="flex items-start gap-3">
            {/* Dot + connecting line */}
            <div className="flex flex-col items-center">
              {isActive ? (
                <motion.span
                  className="relative flex h-3 w-3 shrink-0"
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                >
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
                </motion.span>
              ) : (
                <motion.span
                  className={`inline-block w-3 h-3 rounded-full shrink-0 ${
                    isComplete ? 'bg-green-400' : 'bg-gray-600'
                  }`}
                  initial={isComplete ? { scale: 0.8 } : {}}
                  animate={isComplete ? { scale: 1 } : {}}
                />
              )}
              {!isLast && (
                <div
                  className={`w-px h-5 ${
                    isComplete ? 'bg-green-400/40' : 'bg-gray-700'
                  }`}
                />
              )}
            </div>

            {/* Label + countdown */}
            <div className="flex flex-col">
              <motion.span
                className={`text-xs font-bold uppercase tracking-wider leading-3 pt-0.5 ${
                  isActive
                    ? 'text-red-400'
                    : isComplete
                      ? 'text-green-400'
                      : 'text-gray-600'
                }`}
                initial={isActive ? { opacity: 0, x: -4 } : {}}
                animate={isActive ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.3 }}
              >
                {stage.label}
              </motion.span>
              {showCountdown && (
                <span className="text-[10px] font-mono text-amber-400 mt-0.5">
                  {formatCountdown(remaining!)}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function FightStageStepper({
  currentStage,
  eta = null,
  variant = 'compact',
}: {
  currentStage: string | null;
  eta?: number | null;
  variant?: 'compact' | 'full';
}) {
  const activeIndex = getStageIndex(currentStage);

  if (activeIndex < 0) return null;

  return variant === 'compact' ? (
    <CompactStepper activeIndex={activeIndex} eta={eta} />
  ) : (
    <FullStepper activeIndex={activeIndex} eta={eta} />
  );
}
