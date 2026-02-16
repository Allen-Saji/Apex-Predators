import fs from 'fs';
import path from 'path';

// Parse .env.local manually to avoid dotenv dependency
const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) process.env[match[1].trim()] = match[2].trim();
  }
}

const API_KEY = process.env.ELEVENLABS_API_KEY;
if (!API_KEY) {
  console.error('Missing ELEVENLABS_API_KEY in .env.local');
  process.exit(1);
}

const VOICE_ID = process.env.ELEVENLABS_VOICE_ID || 'pNInz6obpgDQGcFmaJgB';
const COMMENTARY_DIR = path.resolve(__dirname, '../public/audio/commentary');
const SFX_DIR = path.resolve(__dirname, '../public/audio');

// ── Fighter intro announcements (TTS) ──

interface TTSEntry {
  filename: string;
  text: string;
}

const INTRO_CLIPS: TTSEntry[] = [
  // "IT'S TIME" opener
  { filename: 'commentary-itstime-1.mp3', text: "LADIES AND GENTLEMEN... THIS IS THE MAIN EVENT OF THE EVENING!" },
  { filename: 'commentary-itstime-2.mp3', text: "IIIIIIT'S TIIIIIIME!" },

  // Per-fighter introduction lines — "Introducing first / and his opponent"
  // Kodiak
  { filename: 'commentary-intro-fighter-kodiak.mp3', text: "Introducing first... THE BEAR... with a record of one win, one loss, one knockout... HEAVY HANDS... KODIAAAAK!" },
  // Fang
  { filename: 'commentary-intro-fighter-fang.mp3', text: "THE WOLF... with a record of zero wins and one loss... PACK INSTINCT... FAAAAAANG!" },
  // Talon
  { filename: 'commentary-intro-fighter-talon.mp3', text: "THE EAGLE... undefeated and untested... AERIAL DODGE... TALOOOOON!" },
  // Jaws
  { filename: 'commentary-intro-fighter-jaws.mp3', text: "THE CROCODILE... one win, one loss, one knockout... DEATH ROLL... JAAAAAAWS!" },
  // Mane
  { filename: 'commentary-intro-fighter-mane.mp3', text: "THE LION... one win, one loss, one knockout... THE KING'S ROAR... MAAAAANE!" },
  // Venom
  { filename: 'commentary-intro-fighter-venom.mp3', text: "THE SNAKE... two wins, one loss, two knockouts... POISON... VENOOOOOM!" },
  // Kong
  { filename: 'commentary-intro-fighter-kong.mp3', text: "THE GORILLA... two wins, one loss, two knockouts... BERSERKER... KOOOOOONG!" },
  // Razor
  { filename: 'commentary-intro-fighter-razor.mp3', text: "THE SHARK... zero wins and one loss... BLOOD FRENZY... RAZOOOOOOR!" },

  // "And his opponent" transition
  { filename: 'commentary-intro-opponent.mp3', text: "AND HIS OPPONENT!" },
];

// ── Better animal sounds (SFX generation) ──

interface SFXEntry {
  filename: string;
  prompt: string;
  duration: number;
}

const ANIMAL_SFX: SFXEntry[] = [
  { filename: 'animal-bear.mp3', prompt: 'Ferocious aggressive grizzly bear roar, deep guttural growl, close up, threatening, animal fight arena', duration: 3 },
  { filename: 'animal-wolf.mp3', prompt: 'Intense wolf howl then aggressive snarl and bark, wild and fierce, echoing in arena, threatening', duration: 3 },
  { filename: 'animal-eagle.mp3', prompt: 'Fierce bald eagle battle screech, sharp piercing war cry, aggressive and intimidating, close up', duration: 2 },
  { filename: 'animal-crocodile.mp3', prompt: 'Massive crocodile hiss then aggressive jaw snap, deep reptile growl, threatening, close up', duration: 2.5 },
  { filename: 'animal-lion.mp3', prompt: 'Thunderous male lion roar, extremely powerful and deep, aggressive, reverberating in arena, terrifying', duration: 3 },
  { filename: 'animal-snake.mp3', prompt: 'Loud aggressive cobra hiss with rattlesnake rattle, venomous and menacing, close up, threatening', duration: 2 },
  { filename: 'animal-gorilla.mp3', prompt: 'Silverback gorilla chest beating then aggressive roar and scream, primal rage, powerful, arena', duration: 3 },
  { filename: 'animal-shark.mp3', prompt: 'Deep ominous ocean rumble, underwater predator approaching, low frequency danger, Jaws-like tension', duration: 2.5 },
];

async function generateTTS(entry: TTSEntry, outDir: string): Promise<void> {
  const outPath = path.join(outDir, entry.filename);
  if (fs.existsSync(outPath)) {
    console.log(`  SKIP ${entry.filename} (already exists)`);
    return;
  }

  console.log(`  TTS  ${entry.filename} — "${entry.text}"`);

  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}?output_format=mp3_22050_32`,
    {
      method: 'POST',
      headers: {
        'xi-api-key': API_KEY!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: entry.text,
        model_id: 'eleven_turbo_v2_5',
        voice_settings: {
          stability: 0.2,
          similarity_boost: 0.9,
          style: 1.0,
          use_speaker_boost: true,
        },
      }),
    },
  );

  if (!res.ok) {
    const err = await res.text();
    console.error(`  FAIL ${entry.filename}: ${res.status} ${err}`);
    return;
  }

  const buffer = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(outPath, buffer);
  console.log(`  OK   ${entry.filename} (${buffer.length} bytes)`);
}

async function generateSFX(entry: SFXEntry, outDir: string): Promise<void> {
  const outPath = path.join(outDir, entry.filename);
  // Always regenerate animal sounds (overwrite existing)
  console.log(`  SFX  ${entry.filename} — "${entry.prompt}"`);

  const res = await fetch('https://api.elevenlabs.io/v1/sound-generation', {
    method: 'POST',
    headers: {
      'xi-api-key': API_KEY!,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text: entry.prompt,
      duration_seconds: entry.duration,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error(`  FAIL ${entry.filename}: ${res.status} ${err}`);
    return;
  }

  const buffer = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(outPath, buffer);
  console.log(`  OK   ${entry.filename} (${buffer.length} bytes)`);
}

async function main() {
  const mode = process.argv[2]; // 'tts', 'sfx', or undefined (both)

  if (!mode || mode === 'tts') {
    fs.mkdirSync(COMMENTARY_DIR, { recursive: true });
    console.log(`\n── Generating ${INTRO_CLIPS.length} intro TTS clips ──\n`);
    for (const entry of INTRO_CLIPS) {
      await generateTTS(entry, COMMENTARY_DIR);
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  if (!mode || mode === 'sfx') {
    fs.mkdirSync(SFX_DIR, { recursive: true });
    console.log(`\n── Regenerating ${ANIMAL_SFX.length} animal sound effects ──\n`);
    for (const entry of ANIMAL_SFX) {
      await generateSFX(entry, SFX_DIR);
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  console.log('\nDone!');
}

main().catch(console.error);
