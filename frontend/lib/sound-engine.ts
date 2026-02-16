'use client';

const SFX_FILES = [
  'bell-start', 'bell-ko',
  'crowd-ambient', 'crowd-roar', 'crowd-gasp', 'crowd-cheer-light',
  'hit-light-1', 'hit-light-2', 'hit-medium-1', 'hit-medium-2',
  'hit-heavy-1', 'hit-heavy-2', 'hit-crit', 'whoosh',
  'celebration',
  'animal-bear', 'animal-wolf', 'animal-eagle', 'animal-crocodile',
  'animal-lion', 'animal-snake', 'animal-gorilla', 'animal-shark',
] as const;

type SFXName = typeof SFX_FILES[number];

class SoundEngine {
  private static instance: SoundEngine | null = null;
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private ambienceNode: { source: AudioBufferSourceNode; gain: GainNode } | null = null;
  private celebrationNode: AudioBufferSourceNode | null = null;
  private muted = false;
  private volume = 0.7;
  private initialized = false;
  private cache = new Map<string, AudioBuffer>();
  private preloaded = false;
  private pendingTimers = new Set<ReturnType<typeof setTimeout>>();

  static getInstance(): SoundEngine {
    if (!SoundEngine.instance) {
      SoundEngine.instance = new SoundEngine();
    }
    return SoundEngine.instance;
  }

  private ensureContext(): AudioContext {
    if (!this.ctx || this.ctx.state === 'closed') {
      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.muted ? 0 : this.volume;
      this.masterGain.connect(this.ctx.destination);
      this.initialized = true;
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  private getMaster(): GainNode {
    this.ensureContext();
    return this.masterGain!;
  }

  private async loadAudio(name: string): Promise<AudioBuffer | null> {
    if (this.cache.has(name)) return this.cache.get(name)!;

    try {
      const ctx = this.ensureContext();
      const res = await fetch(`/audio/${name}.mp3`);
      if (!res.ok) return null;
      const arrayBuffer = await res.arrayBuffer();
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
      this.cache.set(name, audioBuffer);
      return audioBuffer;
    } catch {
      console.warn(`[SoundEngine] Failed to load ${name}.mp3`);
      return null;
    }
  }

  async preload(): Promise<void> {
    if (this.preloaded) return;
    this.ensureContext();
    await Promise.all(SFX_FILES.map((name) => this.loadAudio(name)));
    this.preloaded = true;
  }

  private playBuffer(name: string, opts?: { loop?: boolean; gain?: number }): AudioBufferSourceNode | null {
    const buffer = this.cache.get(name);
    if (!buffer) return null;

    const ctx = this.ensureContext();
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = opts?.loop ?? false;

    if (opts?.gain !== undefined) {
      const gainNode = ctx.createGain();
      gainNode.gain.value = opts.gain;
      source.connect(gainNode).connect(this.getMaster());
    } else {
      source.connect(this.getMaster());
    }

    source.start();
    return source;
  }

  private pickRandom(...names: SFXName[]): SFXName {
    return names[Math.floor(Math.random() * names.length)];
  }

  // --- Sound methods ---

  private schedule(fn: () => void, ms: number): void {
    const id = setTimeout(() => {
      this.pendingTimers.delete(id);
      fn();
    }, ms);
    this.pendingTimers.add(id);
  }

  playFightStart(): void {
    this.playBuffer('bell-start');
    this.schedule(() => this.playCrowdRoar(), 400);
  }

  playHit(damage: number, isCrit: boolean): void {
    if (isCrit) {
      this.playBuffer('hit-crit');
    } else if (damage <= 3) {
      this.playBuffer('whoosh');
    } else if (damage <= 8) {
      this.playBuffer(this.pickRandom('hit-light-1', 'hit-light-2'));
    } else if (damage <= 15) {
      this.playBuffer(this.pickRandom('hit-medium-1', 'hit-medium-2'));
    } else {
      this.playBuffer(this.pickRandom('hit-heavy-1', 'hit-heavy-2'));
    }
  }

  playKoBell(): void {
    this.playBuffer('bell-ko');
  }

  playCrowdRoar(): void {
    this.playBuffer('crowd-roar', { gain: 0.6 });
  }

  playKoCrowdRoar(): void {
    this.playBuffer('crowd-roar', { gain: 0.9 });
  }

  playCelebration(): void {
    this.stopCelebration();
    const source = this.playBuffer('celebration', { gain: 0.7, loop: true });
    if (source) this.celebrationNode = source;
  }

  stopCelebration(): void {
    if (!this.celebrationNode) return;
    try { this.celebrationNode.stop(); } catch { /* ok */ }
    this.celebrationNode = null;
  }

  playAnimalIntro(animal: string): void {
    const key = `animal-${animal.toLowerCase()}`;
    this.playBuffer(key, { gain: 0.8 });
  }

  playCrowdReact(intensity: 'light' | 'medium' | 'heavy'): void {
    if (intensity === 'light') {
      this.playBuffer('crowd-cheer-light', { gain: 0.3 });
    } else if (intensity === 'medium') {
      this.playBuffer('crowd-cheer-light', { gain: 0.5 });
    } else {
      this.playBuffer('crowd-gasp', { gain: 0.6 });
    }
  }

  startAmbience(): void {
    this.stopAmbience();
    const buffer = this.cache.get('crowd-ambient');
    if (!buffer) return;

    const ctx = this.ensureContext();
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const gain = ctx.createGain();
    const now = ctx.currentTime;
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.15, now + 1);

    source.connect(gain).connect(this.getMaster());
    source.start();

    this.ambienceNode = { source, gain };
  }

  spikeAmbience(): void {
    if (!this.ambienceNode || !this.ctx) return;
    const now = this.ctx.currentTime;
    this.ambienceNode.gain.gain.cancelScheduledValues(now);
    this.ambienceNode.gain.gain.setValueAtTime(0.4, now);
    this.ambienceNode.gain.gain.linearRampToValueAtTime(0.15, now + 2);
  }

  fadeOutAmbience(): void {
    if (!this.ambienceNode || !this.ctx) return;
    const now = this.ctx.currentTime;
    this.ambienceNode.gain.gain.cancelScheduledValues(now);
    this.ambienceNode.gain.gain.linearRampToValueAtTime(0.001, now + 2);
    const source = this.ambienceNode.source;
    this.schedule(() => {
      try { source.stop(); } catch { /* already stopped */ }
    }, 2500);
    this.ambienceNode = null;
  }

  stopAmbience(): void {
    if (!this.ambienceNode) return;
    try { this.ambienceNode.source.stop(); } catch { /* ok */ }
    this.ambienceNode = null;
  }

  /** Stop everything: ambience, celebration, and all pending scheduled sounds */
  stopAll(): void {
    for (const id of this.pendingTimers) clearTimeout(id);
    this.pendingTimers.clear();
    this.stopAmbience();
    this.stopCelebration();
  }

  // --- Public accessors for external audio (e.g. TTS) ---

  getContext(): AudioContext {
    return this.ensureContext();
  }

  getMasterGain(): GainNode {
    return this.getMaster();
  }

  // --- Controls ---

  toggleMute(): boolean {
    this.muted = !this.muted;
    if (this.masterGain) {
      this.masterGain.gain.value = this.muted ? 0 : this.volume;
    }
    return this.muted;
  }

  isMuted(): boolean {
    return this.muted;
  }

  setVolume(v: number): void {
    this.volume = Math.max(0, Math.min(1, v));
    if (this.masterGain && !this.muted) {
      this.masterGain.gain.value = this.volume;
    }
  }

  isInitialized(): boolean {
    return this.initialized;
  }
}

export default SoundEngine;
