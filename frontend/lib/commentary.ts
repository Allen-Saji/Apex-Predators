'use client';

// --- Text Generation ---

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function getIntroCommentary(f1: string, f2: string): string {
  return pick([
    `Ladies and gentlemen! In the red corner... ${f1}! And in the blue corner... ${f2}! Let's get ready to rumble!`,
    `Welcome to the jungle! Tonight, ${f1} faces off against ${f2}! This is going to be a war!`,
    `The crowd is going wild! ${f1} versus ${f2}! Two apex predators, only one walks away!`,
  ]);
}

export function getAttackCommentary(attacker: string, move: string, damage: number, isCrit: boolean): string {
  if (isCrit) {
    return pick([
      `OH! CRITICAL HIT! What a ${move} by ${attacker}! ${damage} damage!`,
      `UNBELIEVABLE! ${attacker} connects with a devastating ${move}! Critical hit for ${damage}!`,
      `OH MY GOD! ${attacker} with a bone-crushing ${move}! ${damage} damage! That's gonna leave a mark!`,
      `THE CROWD GOES WILD! Critical ${move} from ${attacker}! ${damage} damage! What a shot!`,
      `WHAT A HIT! ${attacker} lands a brutal ${move}! ${damage} damage on the critical!`,
      `BAM! ${attacker} absolutely DESTROYS with that ${move}! ${damage} critical damage!`,
    ]);
  }
  if (damage >= 15) {
    return pick([
      `${attacker} lands a devastating ${move}! ${damage} damage!`,
      `BOOM! ${attacker} connects with a massive ${move}! ${damage} damage!`,
      `What a shot! ${attacker} hammers home that ${move} for ${damage}!`,
      `${attacker} unleashes a powerful ${move}! ${damage} damage! That had to hurt!`,
      `Huge ${move} from ${attacker}! ${damage} damage! The crowd feels that one!`,
      `${attacker} with a thunderous ${move}! ${damage} damage!`,
    ]);
  }
  if (damage <= 5) {
    return pick([
      `${attacker} throws a ${move}, but only grazes for ${damage}.`,
      `A glancing ${move} from ${attacker}. Just ${damage} damage.`,
      `${attacker} with a ${move}, barely connects. ${damage} damage.`,
      `Not much behind that ${move} from ${attacker}. ${damage} damage.`,
      `${attacker} tries a ${move}, but it's partially blocked. ${damage}.`,
      `A light ${move} from ${attacker}. ${damage} damage, nothing to worry about.`,
    ]);
  }
  return pick([
    `${attacker} lands a ${move}! ${damage} damage!`,
    `Nice ${move} from ${attacker}! ${damage} damage!`,
    `${attacker} connects with a solid ${move}! ${damage}!`,
    `Good ${move} by ${attacker}! That's ${damage} damage!`,
    `${attacker} strikes with a ${move}! ${damage} damage!`,
    `A clean ${move} from ${attacker}! ${damage} damage on the board!`,
  ]);
}

export function getKoCommentary(winner: string, loser: string): string {
  return pick([
    `IT'S OVER! ${winner} knocks out ${loser}! What a fight!`,
    `AND IT'S DONE! ${winner} is victorious! ${loser} is down for the count!`,
    `KNOCKOUT! ${winner} puts ${loser} away! What a performance!`,
    `${loser} hits the canvas! ${winner} wins by knockout! Incredible!`,
    `THE FIGHT IS OVER! ${winner} destroys ${loser}! Absolute domination!`,
    `DOWN GOES ${loser}! ${winner} takes the victory! What a battle!`,
  ]);
}

// --- Speech Engine ---

class CommentaryEngine {
  private static instance: CommentaryEngine | null = null;
  private enabled = true;
  private queue: Array<{ text: string; priority: 'normal' | 'high' }> = [];
  private speaking = false;
  private selectedVoice: SpeechSynthesisVoice | null = null;
  private voiceLoaded = false;
  private warmedUp = false;

  static getInstance(): CommentaryEngine {
    if (!CommentaryEngine.instance) {
      CommentaryEngine.instance = new CommentaryEngine();
    }
    return CommentaryEngine.instance;
  }

  private loadVoice(): void {
    if (this.voiceLoaded || typeof window === 'undefined' || !window.speechSynthesis) return;
    const tryLoad = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length === 0) return false;
      this.voiceLoaded = true;
      const english = voices.filter(v => v.lang.startsWith('en'));
      const preferred = english.find(v =>
        /male|daniel|james|george|david|aaron|fred/i.test(v.name)
      );
      this.selectedVoice = preferred || english[0] || voices[0];
      return true;
    };
    if (tryLoad()) return;
    // Listen for voiceschanged
    window.speechSynthesis.addEventListener('voiceschanged', tryLoad, { once: true });
    // Fallback retry after 1 second
    setTimeout(() => {
      if (!this.voiceLoaded) tryLoad();
    }, 1000);
  }

  warmup(): void {
    if (this.warmedUp) return;
    this.warmedUp = true;
    this.loadVoice();
    // Additional retry to ensure voices are ready
    if (!this.voiceLoaded) {
      setTimeout(() => this.loadVoice(), 500);
      setTimeout(() => this.loadVoice(), 1500);
    }
  }

  speak(text: string, priority: 'normal' | 'high' = 'normal'): void {
    if (!this.enabled || typeof window === 'undefined' || !window.speechSynthesis) return;
    this.loadVoice();

    if (priority === 'high') {
      window.speechSynthesis.cancel();
      this.queue = [];
      this.speaking = false;
    }

    if (this.speaking && this.queue.length >= 2) {
      this.queue.shift();
    }

    if (this.speaking) {
      this.queue.push({ text, priority });
      return;
    }

    this.speakNow(text, priority === 'high');
  }

  private speakNow(text: string, isCrit = false): void {
    // Try loading voice if not yet loaded
    if (!this.voiceLoaded) {
      this.loadVoice();
    }

    this.speaking = true;
    const utterance = new SpeechSynthesisUtterance(text);
    if (this.selectedVoice) utterance.voice = this.selectedVoice;
    utterance.rate = isCrit ? 1.15 : 1.0;
    utterance.pitch = 0.8;
    utterance.volume = isCrit ? 1.0 : 0.9;

    utterance.onend = () => {
      this.speaking = false;
      const next = this.queue.shift();
      if (next) this.speakNow(next.text, next.priority === 'high');
    };
    utterance.onerror = () => {
      this.speaking = false;
      const next = this.queue.shift();
      if (next) this.speakNow(next.text, next.priority === 'high');
    };

    window.speechSynthesis.speak(utterance);
  }

  stop(): void {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    this.queue = [];
    this.speaking = false;
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
