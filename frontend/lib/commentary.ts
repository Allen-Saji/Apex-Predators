'use client';

import SoundEngine from './sound-engine';

// --- Clip Registry ---

export type CommentaryCategory = 'intro' | 'crit' | 'heavy' | 'medium' | 'light' | 'ko' | 'exit';

const CLIP_REGISTRY: Record<CommentaryCategory, string[]> = {
  intro: [
    'commentary/commentary-intro-1',
    'commentary/commentary-intro-2',
    'commentary/commentary-intro-3',
  ],
  crit: [
    'commentary/commentary-crit-1',
    'commentary/commentary-crit-2',
    'commentary/commentary-crit-3',
    'commentary/commentary-crit-4',
    'commentary/commentary-crit-5',
    'commentary/commentary-crit-6',
  ],
  heavy: [
    'commentary/commentary-heavy-1',
    'commentary/commentary-heavy-2',
    'commentary/commentary-heavy-3',
    'commentary/commentary-heavy-4',
    'commentary/commentary-heavy-5',
    'commentary/commentary-heavy-6',
  ],
  medium: [
    'commentary/commentary-medium-1',
    'commentary/commentary-medium-2',
    'commentary/commentary-medium-3',
    'commentary/commentary-medium-4',
    'commentary/commentary-medium-5',
    'commentary/commentary-medium-6',
  ],
  light: [
    'commentary/commentary-light-1',
    'commentary/commentary-light-2',
    'commentary/commentary-light-3',
    'commentary/commentary-light-4',
    'commentary/commentary-light-5',
    'commentary/commentary-light-6',
  ],
  ko: [
    'commentary/commentary-ko-1',
    'commentary/commentary-ko-2',
    'commentary/commentary-ko-3',
    'commentary/commentary-ko-4',
    'commentary/commentary-ko-5',
    'commentary/commentary-ko-6',
  ],
  exit: [
    'commentary/commentary-exit-1',
    'commentary/commentary-exit-2',
    'commentary/commentary-exit-3',
    'commentary/commentary-exit-4',
    'commentary/commentary-exit-5',
    'commentary/commentary-exit-6',
  ],
};

/** Builds the clip key for a fighter-move call, e.g. "commentary/commentary-move-kodiak-heavy-swipe" */
export function moveClipKey(fighterName: string, moveName: string): string {
  const slug = `${fighterName}-${moveName}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '');
  return `commentary/commentary-move-${slug}`;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// --- Commentary Engine (pre-recorded clips) ---

type QueueEntry =
  | { type: 'category'; category: CommentaryCategory; priority: 'normal' | 'high' }
  | { type: 'clip'; clipKey: string; priority: 'normal' | 'high' };

class CommentaryEngine {
  private static instance: CommentaryEngine | null = null;
  private enabled = true;
  private queue: QueueEntry[] = [];
  private playing = false;
  private currentSource: AudioBufferSourceNode | null = null;
  private cache = new Map<string, AudioBuffer>();
  private preloaded = false;

  static getInstance(): CommentaryEngine {
    if (!CommentaryEngine.instance) {
      CommentaryEngine.instance = new CommentaryEngine();
    }
    return CommentaryEngine.instance;
  }

  async warmup(): Promise<void> {
    if (this.preloaded) return;

    const engine = SoundEngine.getInstance();
    const ctx = engine.getContext();

    // Collect all clip keys: category clips + all move clips
    const allClips = Object.values(CLIP_REGISTRY).flat();

    // Discover move clips by fetching known fighters × moves
    // We eagerly load all commentary-move-* files that exist
    const moveClips = [
      // Kodiak
      'commentary/commentary-move-kodiak-heavy-swipe',
      'commentary/commentary-move-kodiak-bear-hug',
      'commentary/commentary-move-kodiak-skull-crush',
      'commentary/commentary-move-kodiak-ground-slam',
      'commentary/commentary-move-kodiak-maul',
      // Fang
      'commentary/commentary-move-fang-fang-strike',
      'commentary/commentary-move-fang-lunge-bite',
      'commentary/commentary-move-fang-pack-fury',
      'commentary/commentary-move-fang-throat-rip',
      'commentary/commentary-move-fang-shadow-dash',
      // Talon
      'commentary/commentary-move-talon-talon-slash',
      'commentary/commentary-move-talon-dive-bomb',
      'commentary/commentary-move-talon-wing-buffet',
      'commentary/commentary-move-talon-sky-strike',
      'commentary/commentary-move-talon-raptor-fury',
      // Jaws
      'commentary/commentary-move-jaws-death-roll',
      'commentary/commentary-move-jaws-tail-whip',
      'commentary/commentary-move-jaws-jaw-clamp',
      'commentary/commentary-move-jaws-ambush-strike',
      'commentary/commentary-move-jaws-swamp-slam',
      // Mane
      'commentary/commentary-move-mane-royal-strike',
      'commentary/commentary-move-mane-lions-roar',
      'commentary/commentary-move-mane-pride-fury',
      'commentary/commentary-move-mane-mane-whip',
      'commentary/commentary-move-mane-kings-judgment',
      // Venom
      'commentary/commentary-move-venom-venom-strike',
      'commentary/commentary-move-venom-coil-crush',
      'commentary/commentary-move-venom-toxic-fang',
      'commentary/commentary-move-venom-serpent-lash',
      'commentary/commentary-move-venom-poison-spit',
      // Kong
      'commentary/commentary-move-kong-ground-pound',
      'commentary/commentary-move-kong-chest-beat',
      'commentary/commentary-move-kong-gorilla-press',
      'commentary/commentary-move-kong-primal-smash',
      'commentary/commentary-move-kong-kong-crush',
      // Razor
      'commentary/commentary-move-razor-razor-bite',
      'commentary/commentary-move-razor-fin-slash',
      'commentary/commentary-move-razor-blood-frenzy',
      'commentary/commentary-move-razor-deep-strike',
      'commentary/commentary-move-razor-jaws-of-death',
    ];

    const allKeys = [...allClips, ...moveClips];

    await Promise.all(
      allKeys.map(async (name) => {
        if (this.cache.has(name)) return;
        try {
          const res = await fetch(`/audio/${name}.mp3`);
          if (!res.ok) return;
          const arrayBuffer = await res.arrayBuffer();
          const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
          this.cache.set(name, audioBuffer);
        } catch {
          // Move clip may not exist yet — that's fine, we fall back gracefully
        }
      }),
    );

    this.preloaded = true;
  }

  playClip(category: CommentaryCategory, priority: 'normal' | 'high' = 'normal'): void {
    if (!this.enabled || typeof window === 'undefined') return;
    this.enqueue({ type: 'category', category, priority });
  }

  /** Play a specific move-call clip by fighter name + move name, then queue a reaction clip */
  playMove(fighterName: string, moveName: string, reactionCategory: CommentaryCategory, priority: 'normal' | 'high' = 'normal'): void {
    if (!this.enabled || typeof window === 'undefined') return;
    const clipKey = moveClipKey(fighterName, moveName);
    if (this.cache.has(clipKey)) {
      // Move call first, then reaction queued after
      this.enqueue({ type: 'clip', clipKey, priority });
      this.enqueue({ type: 'category', category: reactionCategory, priority: 'normal' });
    } else {
      // Move clip not available — fall back to generic reaction only
      this.enqueue({ type: 'category', category: reactionCategory, priority });
    }
  }

  private enqueue(entry: QueueEntry): void {
    if (entry.priority === 'high') {
      this.stopCurrent();
      this.queue = [];
      this.playing = false;
    }

    if (this.playing && this.queue.length >= 3) {
      this.queue.shift();
    }

    if (this.playing) {
      this.queue.push(entry);
      return;
    }

    this.playEntry(entry);
  }

  private playEntry(entry: QueueEntry): void {
    let buffer: AudioBuffer | undefined;

    if (entry.type === 'clip') {
      buffer = this.cache.get(entry.clipKey);
    } else {
      const clips = CLIP_REGISTRY[entry.category];
      const name = pick(clips);
      buffer = this.cache.get(name);
    }

    if (!buffer) {
      const next = this.queue.shift();
      if (next) this.playEntry(next);
      return;
    }

    this.playing = true;

    const engine = SoundEngine.getInstance();
    const ctx = engine.getContext();
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(engine.getMasterGain());
    this.currentSource = source;

    source.onended = () => {
      this.currentSource = null;
      this.playing = false;
      const next = this.queue.shift();
      if (next) this.playEntry(next);
    };

    source.start();
  }

  private stopCurrent(): void {
    if (this.currentSource) {
      try { this.currentSource.stop(); } catch { /* already stopped */ }
      this.currentSource = null;
    }
  }

  stop(): void {
    this.stopCurrent();
    this.queue = [];
    this.playing = false;
  }

  setEnabled(on: boolean): void {
    this.enabled = on;
    if (!on) this.stop();
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  toggleEnabled(): boolean {
    this.setEnabled(!this.enabled);
    return this.enabled;
  }
}

export default CommentaryEngine;
