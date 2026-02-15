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
const OUT_DIR = path.resolve(__dirname, '../public/audio/commentary');

interface ClipEntry {
  filename: string;
  text: string;
}

const CLIPS: ClipEntry[] = [
  // Intro (3)
  { filename: 'commentary-intro-1.mp3', text: "Ladies and gentlemen, welcome to the jungle! Let's get ready to RUMBLE!" },
  { filename: 'commentary-intro-2.mp3', text: "Two apex predators enter, only one walks away! Let's GO!" },
  { filename: 'commentary-intro-3.mp3', text: 'The crowd is on their feet! This is going to be a WAR!' },

  // Attack — Crit (6)
  { filename: 'commentary-crit-1.mp3', text: 'OH! CRITICAL HIT! What a shot!' },
  { filename: 'commentary-crit-2.mp3', text: "UNBELIEVABLE! That's a bone-crushing blow!" },
  { filename: 'commentary-crit-3.mp3', text: "OH MY GOD! That's gonna leave a mark!" },
  { filename: 'commentary-crit-4.mp3', text: 'THE CROWD GOES WILD! Critical hit!' },
  { filename: 'commentary-crit-5.mp3', text: 'WHAT A HIT! Absolutely BRUTAL!' },
  { filename: 'commentary-crit-6.mp3', text: 'BAM! What a devastating strike!' },

  // Attack — Heavy (6)
  { filename: 'commentary-heavy-1.mp3', text: 'A devastating blow! That had to hurt!' },
  { filename: 'commentary-heavy-2.mp3', text: 'BOOM! What a massive hit!' },
  { filename: 'commentary-heavy-3.mp3', text: 'What a shot! The crowd feels that one!' },
  { filename: 'commentary-heavy-4.mp3', text: 'A thunderous strike! Huge damage!' },
  { filename: 'commentary-heavy-5.mp3', text: 'That was POWERFUL! What a hit!' },
  { filename: 'commentary-heavy-6.mp3', text: 'Hammering home that shot!' },

  // Attack — Medium (6)
  { filename: 'commentary-medium-1.mp3', text: 'A solid hit! Nice work!' },
  { filename: 'commentary-medium-2.mp3', text: 'Good strike! That one connected!' },
  { filename: 'commentary-medium-3.mp3', text: 'Clean shot right on the mark!' },
  { filename: 'commentary-medium-4.mp3', text: 'Strikes with authority!' },
  { filename: 'commentary-medium-5.mp3', text: 'A nice clean hit!' },
  { filename: 'commentary-medium-6.mp3', text: 'That one lands flush!' },

  // Attack — Light (6)
  { filename: 'commentary-light-1.mp3', text: 'Just a glancing blow there.' },
  { filename: 'commentary-light-2.mp3', text: 'Barely connects. Not much behind that one.' },
  { filename: 'commentary-light-3.mp3', text: 'A light shot, nothing to worry about.' },
  { filename: 'commentary-light-4.mp3', text: "That one's partially blocked." },
  { filename: 'commentary-light-5.mp3', text: 'Just grazes. Minimal damage.' },
  { filename: 'commentary-light-6.mp3', text: 'Not the best shot there.' },

  // KO (6)
  { filename: 'commentary-ko-1.mp3', text: "IT'S OVER! KNOCKOUT! What a fight!" },
  { filename: 'commentary-ko-2.mp3', text: "AND IT'S DONE! Down for the count!" },
  { filename: 'commentary-ko-3.mp3', text: 'KNOCKOUT! What a performance!' },
  { filename: 'commentary-ko-4.mp3', text: "Hits the canvas! It's all over!" },
  { filename: 'commentary-ko-5.mp3', text: 'THE FIGHT IS OVER! Absolute domination!' },
  { filename: 'commentary-ko-6.mp3', text: 'DOWN GOES THE CHALLENGER! What a battle!' },

  // Exit/Wrap-up (6)
  { filename: 'commentary-exit-1.mp3', text: 'What a fight, ladies and gentlemen! What a show!' },
  { filename: 'commentary-exit-2.mp3', text: "And that's all she wrote! An apex predator stands victorious!" },
  { filename: 'commentary-exit-3.mp3', text: 'Unbelievable performance tonight!' },
  { filename: 'commentary-exit-4.mp3', text: 'The jungle has spoken! What a fight, folks!' },
  { filename: 'commentary-exit-5.mp3', text: 'Standing tall! What heart from both fighters tonight!' },
  { filename: 'commentary-exit-6.mp3', text: "That's a wrap! Another victory for the record books!" },

  // Move calls — Kodiak (Bear)
  { filename: 'commentary-move-kodiak-heavy-swipe.mp3', text: 'Kodiak with the Heavy Swipe!' },
  { filename: 'commentary-move-kodiak-bear-hug.mp3', text: 'Kodiak locks in the Bear Hug!' },
  { filename: 'commentary-move-kodiak-skull-crush.mp3', text: 'Kodiak with a Skull Crush!' },
  { filename: 'commentary-move-kodiak-ground-slam.mp3', text: 'Kodiak with the Ground Slam!' },
  { filename: 'commentary-move-kodiak-maul.mp3', text: 'Kodiak goes for the Maul!' },

  // Move calls — Fang (Wolf)
  { filename: 'commentary-move-fang-fang-strike.mp3', text: 'Fang with the Fang Strike!' },
  { filename: 'commentary-move-fang-lunge-bite.mp3', text: 'Fang lunges in with the Lunge Bite!' },
  { filename: 'commentary-move-fang-pack-fury.mp3', text: 'Fang unleashes Pack Fury!' },
  { filename: 'commentary-move-fang-throat-rip.mp3', text: 'Fang goes for the Throat Rip!' },
  { filename: 'commentary-move-fang-shadow-dash.mp3', text: 'Fang with the Shadow Dash!' },

  // Move calls — Talon (Eagle)
  { filename: 'commentary-move-talon-talon-slash.mp3', text: 'Talon with the Talon Slash!' },
  { filename: 'commentary-move-talon-dive-bomb.mp3', text: 'Talon drops in with the Dive Bomb!' },
  { filename: 'commentary-move-talon-wing-buffet.mp3', text: 'Talon hits a Wing Buffet!' },
  { filename: 'commentary-move-talon-sky-strike.mp3', text: 'Talon strikes from above with Sky Strike!' },
  { filename: 'commentary-move-talon-raptor-fury.mp3', text: 'Talon unleashes Raptor Fury!' },

  // Move calls — Jaws (Crocodile)
  { filename: 'commentary-move-jaws-death-roll.mp3', text: 'Jaws locks in the Death Roll!' },
  { filename: 'commentary-move-jaws-tail-whip.mp3', text: 'Jaws with the Tail Whip!' },
  { filename: 'commentary-move-jaws-jaw-clamp.mp3', text: 'Jaws clamps down with Jaw Clamp!' },
  { filename: 'commentary-move-jaws-ambush-strike.mp3', text: 'Jaws with the Ambush Strike!' },
  { filename: 'commentary-move-jaws-swamp-slam.mp3', text: 'Jaws hits the Swamp Slam!' },

  // Move calls — Mane (Lion)
  { filename: 'commentary-move-mane-royal-strike.mp3', text: 'Mane with the Royal Strike!' },
  { filename: 'commentary-move-mane-lions-roar.mp3', text: "Mane lets out the Lion's Roar!" },
  { filename: 'commentary-move-mane-pride-fury.mp3', text: 'Mane unleashes Pride Fury!' },
  { filename: 'commentary-move-mane-mane-whip.mp3', text: 'Mane with the Mane Whip!' },
  { filename: 'commentary-move-mane-kings-judgment.mp3', text: "Mane delivers the King's Judgment!" },

  // Move calls — Venom (Snake)
  { filename: 'commentary-move-venom-venom-strike.mp3', text: 'Venom with the Venom Strike!' },
  { filename: 'commentary-move-venom-coil-crush.mp3', text: 'Venom squeezes with Coil Crush!' },
  { filename: 'commentary-move-venom-toxic-fang.mp3', text: 'Venom sinks in the Toxic Fang!' },
  { filename: 'commentary-move-venom-serpent-lash.mp3', text: 'Venom with the Serpent Lash!' },
  { filename: 'commentary-move-venom-poison-spit.mp3', text: 'Venom fires off a Poison Spit!' },

  // Move calls — Kong (Gorilla)
  { filename: 'commentary-move-kong-ground-pound.mp3', text: 'Kong with the Ground Pound!' },
  { filename: 'commentary-move-kong-chest-beat.mp3', text: 'Kong beats his chest with Chest Beat!' },
  { filename: 'commentary-move-kong-gorilla-press.mp3', text: 'Kong lifts with the Gorilla Press!' },
  { filename: 'commentary-move-kong-primal-smash.mp3', text: 'Kong with the Primal Smash!' },
  { filename: 'commentary-move-kong-kong-crush.mp3', text: 'Kong delivers the Kong Crush!' },

  // Move calls — Razor (Shark)
  { filename: 'commentary-move-razor-razor-bite.mp3', text: 'Razor with the Razor Bite!' },
  { filename: 'commentary-move-razor-fin-slash.mp3', text: 'Razor cuts with the Fin Slash!' },
  { filename: 'commentary-move-razor-blood-frenzy.mp3', text: 'Razor enters Blood Frenzy!' },
  { filename: 'commentary-move-razor-deep-strike.mp3', text: 'Razor with the Deep Strike!' },
  { filename: 'commentary-move-razor-jaws-of-death.mp3', text: 'Razor unleashes Jaws of Death!' },
];

async function generateClip(entry: ClipEntry): Promise<void> {
  const outPath = path.join(OUT_DIR, entry.filename);
  if (fs.existsSync(outPath)) {
    console.log(`  SKIP ${entry.filename} (already exists)`);
    return;
  }

  console.log(`  GEN  ${entry.filename} — "${entry.text}"`);

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
          stability: 0.25,
          similarity_boost: 0.85,
          style: 0.9,
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

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  console.log(`Generating ${CLIPS.length} commentary clips to ${OUT_DIR}\n`);

  for (const entry of CLIPS) {
    await generateClip(entry);
    // Small delay to avoid rate limiting
    await new Promise((r) => setTimeout(r, 500));
  }

  console.log('\nDone!');
}

main().catch(console.error);
