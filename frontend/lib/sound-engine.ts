'use client';

class SoundEngine {
  private static instance: SoundEngine | null = null;
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private ambienceNode: { source: AudioBufferSourceNode; gain: GainNode } | null = null;
  private muted = false;
  private volume = 0.7;
  private initialized = false;

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

  // Random variation helpers
  private randFreq(base: number): number {
    return base * (0.9 + Math.random() * 0.2);
  }

  private randDur(base: number): number {
    return base * (0.85 + Math.random() * 0.3);
  }

  private noiseBuffer(duration: number): AudioBuffer {
    const ctx = this.ensureContext();
    const length = Math.ceil(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  private clippedNoiseBuffer(duration: number): AudioBuffer {
    const ctx = this.ensureContext();
    const length = Math.ceil(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      let v = Math.random() * 2 - 1;
      v *= 1.8;
      data[i] = Math.max(-1, Math.min(1, v));
    }
    return buffer;
  }

  private brownNoiseBuffer(duration: number): AudioBuffer {
    const ctx = this.ensureContext();
    const length = Math.ceil(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.02 * white) / 1.02;
      data[i] = last * 3.5;
    }
    return buffer;
  }

  // --- Sound generators ---

  playFightStart(): void {
    const ctx = this.ensureContext();
    const now = ctx.currentTime;
    const master = this.getMaster();

    // Deep gong: sine at 150Hz + harmonics
    const gongFreqs = [150, 300, 450, 600];
    const gongAmps = [0.5, 0.25, 0.12, 0.05];
    const decay = this.randDur(2.5);
    const playGong = (offset: number, volScale: number) => {
      for (let i = 0; i < gongFreqs.length; i++) {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = this.randFreq(gongFreqs[i]);
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(gongAmps[i] * volScale, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.001, now + offset + decay);
        osc.connect(gain).connect(master);
        osc.start(now + offset);
        osc.stop(now + offset + decay + 0.1);
      }
    };
    playGong(0, 1);
    // Subtle reverb echo
    playGong(0.05, 0.3);

    // Crowd roar swell after gong
    setTimeout(() => this.playCrowdRoar(), 400);
  }

  playHit(damage: number, isCrit: boolean): void {
    if (isCrit) {
      this.playCritical();
    } else if (damage <= 3) {
      this.playWhoosh();
    } else if (damage <= 8) {
      this.playLightHit();
    } else if (damage <= 15) {
      this.playMediumHit();
    } else {
      this.playHeavyHit();
    }
  }

  private playLightHit(): void {
    const ctx = this.ensureContext();
    const now = ctx.currentTime;
    const dur = this.randDur(0.03);

    const source = ctx.createBufferSource();
    source.buffer = this.noiseBuffer(dur + 0.02);
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = this.randFreq(2500);
    filter.Q.value = 1.5;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.45, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
    source.connect(filter).connect(gain).connect(this.getMaster());
    source.start(now);
    source.stop(now + dur + 0.02);
  }

  private playMediumHit(): void {
    const ctx = this.ensureContext();
    const now = ctx.currentTime;
    const master = this.getMaster();
    const dur = this.randDur(0.06);

    // Noise burst
    const source = ctx.createBufferSource();
    source.buffer = this.noiseBuffer(dur + 0.02);
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = this.randFreq(1500);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.55, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
    source.connect(filter).connect(gain).connect(master);
    source.start(now);
    source.stop(now + dur + 0.02);

    // Body thud
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = this.randFreq(80);
    const oGain = ctx.createGain();
    const thudDur = this.randDur(0.05);
    oGain.gain.setValueAtTime(0.4, now);
    oGain.gain.exponentialRampToValueAtTime(0.001, now + thudDur);
    osc.connect(oGain).connect(master);
    osc.start(now);
    osc.stop(now + thudDur + 0.02);
  }

  private playHeavyHit(): void {
    const ctx = this.ensureContext();
    const now = ctx.currentTime;
    const master = this.getMaster();
    const dur = this.randDur(0.1);

    // Clipped noise burst
    const source = ctx.createBufferSource();
    source.buffer = this.clippedNoiseBuffer(dur + 0.02);
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = this.randFreq(1000);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.65, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
    source.connect(filter).connect(gain).connect(master);
    source.start(now);
    source.stop(now + dur + 0.02);

    // Sub-bass thump
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = this.randFreq(50);
    const oGain = ctx.createGain();
    const thumpDur = this.randDur(0.15);
    oGain.gain.setValueAtTime(0.7, now);
    oGain.gain.exponentialRampToValueAtTime(0.001, now + thumpDur);
    osc.connect(oGain).connect(master);
    osc.start(now);
    osc.stop(now + thumpDur + 0.02);
  }

  private playCritical(): void {
    const ctx = this.ensureContext();
    const now = ctx.currentTime;
    const master = this.getMaster();

    // Heavy hit base (louder)
    const dur = this.randDur(0.1);
    const source = ctx.createBufferSource();
    source.buffer = this.clippedNoiseBuffer(dur + 0.02);
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = this.randFreq(1000);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.85, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
    source.connect(filter).connect(gain).connect(master);
    source.start(now);
    source.stop(now + dur + 0.02);

    // Sharp crack
    const crack = ctx.createBufferSource();
    const crackDur = this.randDur(0.02);
    crack.buffer = this.noiseBuffer(crackDur + 0.01);
    const hFilter = ctx.createBiquadFilter();
    hFilter.type = 'highpass';
    hFilter.frequency.value = this.randFreq(6000);
    const cGain = ctx.createGain();
    cGain.gain.setValueAtTime(0.7, now);
    cGain.gain.exponentialRampToValueAtTime(0.001, now + crackDur);
    crack.connect(hFilter).connect(cGain).connect(master);
    crack.start(now);
    crack.stop(now + crackDur + 0.01);

    // Screen-shake bass
    const sub = ctx.createOscillator();
    sub.type = 'sine';
    sub.frequency.value = this.randFreq(30);
    const sGain = ctx.createGain();
    const subDur = this.randDur(0.2);
    sGain.gain.setValueAtTime(0.8, now);
    sGain.gain.exponentialRampToValueAtTime(0.001, now + subDur);
    sub.connect(sGain).connect(master);
    sub.start(now);
    sub.stop(now + subDur + 0.02);

    // Ear ring
    const ring = ctx.createOscillator();
    ring.type = 'sine';
    ring.frequency.value = this.randFreq(2000);
    const rGain = ctx.createGain();
    const ringDur = this.randDur(0.1);
    rGain.gain.setValueAtTime(0.15, now);
    rGain.gain.exponentialRampToValueAtTime(0.001, now + ringDur);
    ring.connect(rGain).connect(master);
    ring.start(now);
    ring.stop(now + ringDur + 0.02);
  }

  private playWhoosh(): void {
    const ctx = this.ensureContext();
    const now = ctx.currentTime;
    const dur = this.randDur(0.1);

    const source = ctx.createBufferSource();
    source.buffer = this.noiseBuffer(dur + 0.02);
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(this.randFreq(500), now);
    filter.frequency.exponentialRampToValueAtTime(this.randFreq(3000), now + dur);
    filter.Q.value = 2;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
    source.connect(filter).connect(gain).connect(this.getMaster());
    source.start(now);
    source.stop(now + dur + 0.02);
  }

  playKoBell(): void {
    const ctx = this.ensureContext();
    const master = this.getMaster();

    for (let ring = 0; ring < 3; ring++) {
      const startTime = ctx.currentTime + ring * 0.4;
      const freqs = [1200, 2400, 3600];
      const amps = [0.45, 0.15, 0.07];
      const decay = this.randDur(2);
      for (let i = 0; i < freqs.length; i++) {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = this.randFreq(freqs[i]);
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(amps[i], startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + decay);
        osc.connect(gain).connect(master);
        osc.start(startTime);
        osc.stop(startTime + decay + 0.1);
      }
    }
  }

  playCrowdRoar(): void {
    const ctx = this.ensureContext();
    const now = ctx.currentTime;

    const source = ctx.createBufferSource();
    source.buffer = this.brownNoiseBuffer(2.5);
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 750;
    filter.Q.value = 0.3;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.4, now + 0.2);
    gain.gain.setValueAtTime(0.4, now + 1.2);
    gain.gain.linearRampToValueAtTime(0.001, now + 2.2);
    source.connect(filter).connect(gain).connect(this.getMaster());
    source.start(now);
    source.stop(now + 2.4);
  }

  playCrowdReact(intensity: 'light' | 'medium' | 'heavy'): void {
    const ctx = this.ensureContext();
    const now = ctx.currentTime;
    const master = this.getMaster();

    const configs = {
      light:  { dur: 0.3, vol: 0.08, freq: 600, q: 0.5 },
      medium: { dur: 0.6, vol: 0.15, freq: 500, q: 0.8 },
      heavy:  { dur: 1.0, vol: 0.25, freq: 650, q: 0.3 },
    };
    const c = configs[intensity];

    const source = ctx.createBufferSource();
    source.buffer = this.brownNoiseBuffer(c.dur + 0.1);
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = c.freq;
    filter.Q.value = c.q;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(c.vol, now + c.dur * 0.15);
    gain.gain.setValueAtTime(c.vol, now + c.dur * 0.6);
    gain.gain.linearRampToValueAtTime(0.001, now + c.dur);
    source.connect(filter).connect(gain).connect(master);
    source.start(now);
    source.stop(now + c.dur + 0.05);
  }

  playKoCrowdRoar(): void {
    const ctx = this.ensureContext();
    const now = ctx.currentTime;

    const source = ctx.createBufferSource();
    source.buffer = this.brownNoiseBuffer(3.5);
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 750;
    filter.Q.value = 0.3;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.6, now + 0.15);
    gain.gain.setValueAtTime(0.6, now + 1.5);
    gain.gain.linearRampToValueAtTime(0.001, now + 3.0);
    source.connect(filter).connect(gain).connect(this.getMaster());
    source.start(now);
    source.stop(now + 3.2);
  }

  startAmbience(): void {
    this.stopAmbience();
    const ctx = this.ensureContext();
    const now = ctx.currentTime;

    const source = ctx.createBufferSource();
    source.buffer = this.brownNoiseBuffer(9);
    source.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 400;
    filter.Q.value = 0.3;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.06, now + 1);

    // Subtle volume modulation via LFO
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.3 + Math.random() * 0.4;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.015;
    lfo.connect(lfoGain).connect(gain.gain);
    lfo.start(now);

    source.connect(filter).connect(gain).connect(this.getMaster());
    source.start(now);

    this.ambienceNode = { source, gain };
  }

  spikeAmbience(): void {
    if (!this.ambienceNode || !this.ctx) return;
    const now = this.ctx.currentTime;
    this.ambienceNode.gain.gain.cancelScheduledValues(now);
    this.ambienceNode.gain.gain.setValueAtTime(0.3, now);
    this.ambienceNode.gain.gain.linearRampToValueAtTime(0.08, now + 2);
  }

  fadeOutAmbience(): void {
    if (!this.ambienceNode || !this.ctx) return;
    const now = this.ctx.currentTime;
    this.ambienceNode.gain.gain.cancelScheduledValues(now);
    this.ambienceNode.gain.gain.linearRampToValueAtTime(0.001, now + 2);
    const source = this.ambienceNode.source;
    setTimeout(() => {
      try { source.stop(); } catch { /* already stopped */ }
    }, 2500);
    this.ambienceNode = null;
  }

  stopAmbience(): void {
    if (!this.ambienceNode) return;
    try { this.ambienceNode.source.stop(); } catch { /* ok */ }
    this.ambienceNode = null;
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
