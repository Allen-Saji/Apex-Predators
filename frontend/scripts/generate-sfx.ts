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

const OUT_DIR = path.resolve(__dirname, '../public/audio');

interface SFXEntry {
  filename: string;
  prompt: string;
  duration: number;
}

const SFX_LIST: SFXEntry[] = [
  { filename: 'bell-start.mp3', prompt: 'Boxing ring bell, three dings, start of round', duration: 2 },
  { filename: 'bell-ko.mp3', prompt: 'Boxing ring bell, rapid ringing, end of fight knockout', duration: 3 },
  { filename: 'crowd-ambient.mp3', prompt: 'Indoor arena crowd ambient murmur loop', duration: 5 },
  { filename: 'crowd-roar.mp3', prompt: 'Arena crowd erupting in cheers and roaring', duration: 3 },
  { filename: 'crowd-gasp.mp3', prompt: 'Arena crowd gasp and ooh reaction', duration: 2 },
  { filename: 'crowd-cheer-light.mp3', prompt: 'Small crowd cheer reaction', duration: 1.5 },
  { filename: 'hit-light-1.mp3', prompt: 'Light punch impact, slap sound', duration: 0.5 },
  { filename: 'hit-light-2.mp3', prompt: 'Quick jab punch impact', duration: 0.5 },
  { filename: 'hit-medium-1.mp3', prompt: 'Medium punch body impact, thud', duration: 0.5 },
  { filename: 'hit-medium-2.mp3', prompt: 'Heavy body blow impact', duration: 0.5 },
  { filename: 'hit-heavy-1.mp3', prompt: 'Devastating knockout punch impact, bone crunch', duration: 0.5 },
  { filename: 'hit-heavy-2.mp3', prompt: 'Crushing heavy blow impact', duration: 0.5 },
  { filename: 'hit-crit.mp3', prompt: 'Massive critical strike impact, explosion-like punch', duration: 1 },
  { filename: 'whoosh.mp3', prompt: 'Fast punch whoosh, miss swing', duration: 0.5 },
  { filename: 'celebration.mp3', prompt: 'Epic victory celebration music, triumphant orchestral fanfare with drums and brass, champion wins the fight, cinematic and uplifting, sports arena victory anthem', duration: 22 },
  // Animal intro roars
  { filename: 'animal-bear.mp3', prompt: 'Angry grizzly bear roar, fierce growl', duration: 2 },
  { filename: 'animal-wolf.mp3', prompt: 'Wolf howl, fierce and intimidating', duration: 2 },
  { filename: 'animal-eagle.mp3', prompt: 'Bald eagle screech, sharp piercing cry', duration: 1.5 },
  { filename: 'animal-crocodile.mp3', prompt: 'Crocodile hiss and jaw snap, reptile growl', duration: 1.5 },
  { filename: 'animal-lion.mp3', prompt: 'Male lion roar, powerful and deep', duration: 2 },
  { filename: 'animal-snake.mp3', prompt: 'Snake hiss, rattlesnake rattle, menacing', duration: 1.5 },
  { filename: 'animal-gorilla.mp3', prompt: 'Gorilla chest beating and roar, primate scream', duration: 2 },
  { filename: 'animal-shark.mp3', prompt: 'Deep ocean predator sound, ominous low rumble, underwater whoosh', duration: 2 },
];

async function generateSFX(entry: SFXEntry): Promise<void> {
  const outPath = path.join(OUT_DIR, entry.filename);
  if (fs.existsSync(outPath)) {
    console.log(`  SKIP ${entry.filename} (already exists)`);
    return;
  }

  console.log(`  GEN  ${entry.filename} — "${entry.prompt}"`);

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
  fs.mkdirSync(OUT_DIR, { recursive: true });
  console.log(`Generating ${SFX_LIST.length} sound effects to ${OUT_DIR}\n`);

  for (const entry of SFX_LIST) {
    await generateSFX(entry);
    // Small delay to avoid rate limiting
    await new Promise((r) => setTimeout(r, 500));
  }

  console.log('\nDone!');
}

main().catch(console.error);
