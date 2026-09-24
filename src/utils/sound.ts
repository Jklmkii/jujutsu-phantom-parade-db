/**
 * Procedural Tactical SFX Engine — Jujutsu Kaisen DB
 * Ported from Quantora's audio architecture.
 * Synthesizes audio procedurally using Web Audio API (zero external files required, 100% offline).
 */

import { useJjkStore } from '../store/useJjkStore';
import { getAudioUrl } from './assets';

let audioCtx: AudioContext | null = null;

const audioBufferCache = new Map<string, AudioBuffer>();

/** Plays an offline audio clip from public/assets/audio/ routed through the master gain node */
export async function playAudioClip(fileName: string, volume = 1.0): Promise<void> {
  if (!isAudioAllowed()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const url = getAudioUrl(fileName);
    let buffer = audioBufferCache.get(url);
    if (!buffer) {
      const res = await fetch(url);
      if (!res.ok) return;
      const arrayBuffer = await res.arrayBuffer();
      buffer = await ctx.decodeAudioData(arrayBuffer);
      audioBufferCache.set(url, buffer);
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(Math.max(0, Math.min(1.5, volume)), ctx.currentTime);
    source.connect(gain);
    gain.connect(getMasterDestination(ctx));
    source.start(0);
  } catch (err) {
    console.warn('Audio clip playback failed:', err);
  }
}

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

let masterGainNode: GainNode | null = null;

function getMasterDestination(ctx: AudioContext): AudioNode {
  let volume = 0.8;
  try {
    const v = useJjkStore.getState().soundVolume;
    if (typeof v === 'number') volume = Math.max(0, Math.min(1, v));
  } catch {
    // fallback
  }

  if (!masterGainNode || masterGainNode.context !== ctx) {
    masterGainNode = ctx.createGain();
    masterGainNode.gain.setValueAtTime(volume, ctx.currentTime);
    masterGainNode.connect(ctx.destination);
  } else {
    masterGainNode.gain.setValueAtTime(volume, ctx.currentTime);
  }
  return masterGainNode;
}

function isAudioAllowed(): boolean {
  try {
    return useJjkStore.getState().soundEnabled;
  } catch {
    return true;
  }
}

/** Tactical subtle click */
export function playClick(): void {
  if (!isAudioAllowed()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const now = ctx.currentTime;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(150, now + 0.04);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(getMasterDestination(ctx));

    osc.start(now);
    osc.stop(now + 0.04);
  } catch {
    // Silent fail
  }
}

/** Tactical confirmation / selection chime */
export function playSelect(): void {
  if (!isAudioAllowed()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const now = ctx.currentTime;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.exponentialRampToValueAtTime(780, now + 0.05);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    osc.connect(gain);
    gain.connect(getMasterDestination(ctx));

    osc.start(now);
    osc.stop(now + 0.06);
  } catch {
    // Silent fail
  }
}

/** Tab switch whoosh chime */
export function playTabSwitch(): void {
  if (!isAudioAllowed()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const now = ctx.currentTime;

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(480, now + 0.06);

    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    osc.connect(gain);
    gain.connect(getMasterDestination(ctx));

    osc.start(now);
    osc.stop(now + 0.06);
  } catch {
    // Silent fail
  }
}

/** Star / Favorite sparkle */
export function playStarToggle(starred: boolean): void {
  if (!isAudioAllowed()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const freqs = starred ? [523.25, 659.25, 783.99] : [783.99, 523.25];
    const stepDuration = 0.05;

    freqs.forEach((f, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const startTime = ctx.currentTime + idx * stepDuration;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, startTime);

      gain.gain.setValueAtTime(0.09, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + stepDuration);

      osc.connect(gain);
      gain.connect(getMasterDestination(ctx));

      osc.start(startTime);
      osc.stop(startTime + stepDuration);
    });
  } catch {
    // Silent fail
  }
}

/** Cursed energy transformation surge [Base] ↔ [Mudado] */
export function playTransformSurge(): void {
  if (!isAudioAllowed()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const now = ctx.currentTime;

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.exponentialRampToValueAtTime(360, now + 0.12);

    gain.gain.setValueAtTime(0.07, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    osc.connect(gain);
    gain.connect(getMasterDestination(ctx));

    osc.start(now);
    osc.stop(now + 0.14);
  } catch {
    // Silent fail
  }
}

/** Level 10 multiplier power-up sound */
export function playLevelUp(): void {
  if (!isAudioAllowed()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const now = ctx.currentTime;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    osc.connect(gain);
    gain.connect(getMasterDestination(ctx));

    osc.start(now);
    osc.stop(now + 0.09);
  } catch {
    // Silent fail
  }
}

/** Collection Inventory toggle sound (Item Acquired vs Removed) */
export function playCollectionToggle(owned: boolean): void {
  if (!isAudioAllowed()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    if (owned) {
      // Harmonic crystal chime sequence: C5 -> E5 -> G5 -> C6
      const notes = [523.25, 659.25, 783.99, 1046.5];
      const step = 0.04;
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const noteStart = now + i * step;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, noteStart);

        gain.gain.setValueAtTime(0.08, noteStart);
        gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.12);

        osc.connect(gain);
        gain.connect(getMasterDestination(ctx));

        osc.start(noteStart);
        osc.stop(noteStart + 0.12);
      });
    } else {
      // Subtle descent removal tone
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(392, now);
      osc.frequency.exponentialRampToValueAtTime(220, now + 0.08);

      gain.gain.setValueAtTime(0.07, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(gain);
      gain.connect(getMasterDestination(ctx));

      osc.start(now);
      osc.stop(now + 0.08);
    }
  } catch {
    // Silent fail
  }
}

/** Cursed Energy Charge / Element Resonance pulse */
export function playCursedEnergyCharge(): void {
  if (!isAudioAllowed()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(180, now);
    osc1.frequency.exponentialRampToValueAtTime(540, now + 0.14);

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(360, now);
    osc2.frequency.exponentialRampToValueAtTime(1080, now + 0.14);

    gain.gain.setValueAtTime(0.07, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(getMasterDestination(ctx));

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.16);
    osc2.stop(now + 0.16);
  } catch {
    // Silent fail
  }
}

/** Domain Expansion ethereal chord or anime voice */
export function playDomainExpansion(type?: 'gojo' | 'sukuna' | 'mahito' | 'synth'): void {
  if (!isAudioAllowed()) return;

  if (type === 'gojo') {
    playDomainInfiniteVoid();
    return;
  }
  if (type === 'sukuna') {
    playDomainMalevolentShrine();
    return;
  }
  if (type === 'mahito') {
    playDomainSelfEmbodiment();
    return;
  }

  // Trigger anime domain audio + synthesized ethereal chord layer
  playDomainInfiniteVoid();

  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const duration = 0.75;

    // 1. Deep Sub-Bass Drone
    const subOsc = ctx.createOscillator();
    const subGain = ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(75, now);
    subOsc.frequency.exponentialRampToValueAtTime(35, now + duration);

    subGain.gain.setValueAtTime(0.12, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    subOsc.connect(subGain);
    subGain.connect(getMasterDestination(ctx));

    subOsc.start(now);
    subOsc.stop(now + duration);

    // 2. Harmonic Ethereal Chord (432Hz & 648Hz)
    [432, 648, 864].forEach((freq) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.04, now);
      gain.gain.linearRampToValueAtTime(0.07, now + 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc.connect(gain);
      gain.connect(getMasterDestination(ctx));

      osc.start(now);
      osc.stop(now + duration);
    });
  } catch {
    // Silent fail
  }
}

/** Official Anime Black Flash / Kokusen Impact sound */
export function playAnimeKokusen(): void {
  playAudioClip('kokusen_impact.mp3', 1.0);
}

/** Official Yuji Itadori "KOKUSEN!!" voice call */
export function playKokusenVoice(): void {
  playAudioClip('kokusen_yuji_voice.mp3', 1.1);
}

/** Official Black Flash Electric Sparks */
export function playKokusenSparks(): void {
  playAudioClip('kokusen_sparks.mp3', 0.9);
}

/** Official Black Flash Explosive Blast */
export function playKokusenBlast(): void {
  playAudioClip('kokusen_blast.mp3', 1.0);
}

/** Official Black Flash Multi-Hit Chain */
export function playKokusenChain(): void {
  playAudioClip('kokusen_chain.mp3', 1.0);
}

/** In-Game Kokusen (Phantom Parade): Yuji Itadori (Voz + Soco) */
export function playKokusenGameYuji(): void {
  playAudioClip('kokusen_game_yuji.mp3', 1.1);
}

/** In-Game Kokusen (Phantom Parade): Nobara Kugisaki (Prego + Martelo) */
export function playKokusenGameNobara(): void {
  playAudioClip('kokusen_game_nobara.mp3', 1.1);
}

/** In-Game Kokusen (Phantom Parade): Aoi Todo (Boogie Woogie + Soco) */
export function playKokusenGameTodo(): void {
  playAudioClip('kokusen_game_todo.mp3', 1.1);
}

/** In-Game Kokusen (Phantom Parade): Kento Nanami (Proporção 7:3 + Lâmina) */
export function playKokusenGameNanami(): void {
  playAudioClip('kokusen_game_nanami.mp3', 1.1);
}

/** In-Game Kokusen (Phantom Parade): Yuta Okkotsu (Rika + Corte Katana) */
export function playKokusenGameYuta(): void {
  playAudioClip('kokusen_game_yuta.mp3', 1.1);
}

/** In-Game Kokusen (Phantom Parade): Satoru Gojo (Infinito + Chute Kokusen) */
export function playKokusenGameGojo(): void {
  playAudioClip('kokusen_game_gojo.mp3', 1.1);
}

/** Satoru Gojo: Domain Expansion — Infinite Void (Muryōkūsho) */
export function playDomainInfiniteVoid(): void {
  playAudioClip('domain_infinite_void.mp3', 1.1);
}

/** Ryomen Sukuna: Domain Expansion — Malevolent Shrine (Fukuma Mizushi) */
export function playDomainMalevolentShrine(): void {
  playAudioClip('domain_malevolent_shrine.mp3', 1.1);
}

/** Mahito: Domain Expansion — Self-Embodiment of Perfection (Jihei Endon-ka) */
export function playDomainSelfEmbodiment(): void {
  playAudioClip('domain_self_embodiment.mp3', 1.1);
}

/** Ryomen Sukuna: World Cutting Slash */
export function playWorldCuttingSlash(): void {
  playAudioClip('world_cutting_slash.mp3', 1.0);
}

/** Character Quotes */
export function playCharacterQuote(character: 'yuji' | 'gojo' | 'sukuna' | 'toji'): void {
  const map: Record<string, string> = {
    yuji: 'quote_yuji.mp3',
    gojo: 'quote_gojo.mp3',
    sukuna: 'quote_sukuna.mp3',
    toji: 'quote_toji.mp3',
  };
  const file = map[character];
  if (file) {
    playAudioClip(file, 1.0);
  }
}

/** Black Flash / Kokusen distortion impact with anime audio */
export function playBlackFlash(mode: 'hybrid' | 'anime' | 'voice' | 'synth' = 'hybrid'): void {
  if (!isAudioAllowed()) return;

  if (mode === 'voice') {
    playKokusenVoice();
    return;
  }

  if (mode === 'anime') {
    playAnimeKokusen();
    return;
  }

  // Hybrid: plays real anime Kokusen impact + subtle synth distortion layer
  playAnimeKokusen();

  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;

    // Heavy bass thud
    const bassOsc = ctx.createOscillator();
    const bassGain = ctx.createGain();
    bassOsc.type = 'sawtooth';
    bassOsc.frequency.setValueAtTime(240, now);
    bassOsc.frequency.exponentialRampToValueAtTime(40, now + 0.18);

    bassGain.gain.setValueAtTime(0.08, now);
    bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    bassOsc.connect(bassGain);
    bassGain.connect(getMasterDestination(ctx));
    bassOsc.start(now);
    bassOsc.stop(now + 0.2);

    // Sharp distortion spark
    const sparkOsc = ctx.createOscillator();
    const sparkGain = ctx.createGain();
    sparkOsc.type = 'sine';
    sparkOsc.frequency.setValueAtTime(1400, now);
    sparkOsc.frequency.exponentialRampToValueAtTime(320, now + 0.08);

    sparkGain.gain.setValueAtTime(0.06, now);
    sparkGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    sparkOsc.connect(sparkGain);
    sparkGain.connect(getMasterDestination(ctx));
    sparkOsc.start(now);
    sparkOsc.stop(now + 0.08);
  } catch {
    // Silent fail
  }
}

/** Tactical card drop / Tier placement snap */
export function playTierDrop(): void {
  if (!isAudioAllowed()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(680, now);
    osc.frequency.exponentialRampToValueAtTime(240, now + 0.05);

    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(gain);
    gain.connect(getMasterDestination(ctx));

    osc.start(now);
    osc.stop(now + 0.05);
  } catch {
    // Silent fail
  }
}

/** Subtle filter purge / reset swoosh */
export function playClearFilters(): void {
  if (!isAudioAllowed()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(160, now + 0.12);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(getMasterDestination(ctx));

    osc.start(now);
    osc.stop(now + 0.12);
  } catch {
    // Silent fail
  }
}

/** Ultimate / Supreme Skill invocation (Sub-bass buildup + harmonic chime) */
export function playUltimateSkill(): void {
  if (!isAudioAllowed()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const duration = 0.55;

    // 1. Ascending energy sweep
    const sweepOsc = ctx.createOscillator();
    const sweepGain = ctx.createGain();
    sweepOsc.type = 'sawtooth';
    sweepOsc.frequency.setValueAtTime(140, now);
    sweepOsc.frequency.exponentialRampToValueAtTime(880, now + 0.35);

    sweepGain.gain.setValueAtTime(0.02, now);
    sweepGain.gain.linearRampToValueAtTime(0.1, now + 0.25);
    sweepGain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

    // Lowpass filter for smooth energy feeling
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(400, now);
    filter.frequency.exponentialRampToValueAtTime(2800, now + 0.35);

    sweepOsc.connect(filter);
    filter.connect(sweepGain);
    sweepGain.connect(getMasterDestination(ctx));

    sweepOsc.start(now);
    sweepOsc.stop(now + 0.38);

    // 2. Heavy impact boom on culmination
    const boomOsc = ctx.createOscillator();
    const boomGain = ctx.createGain();
    boomOsc.type = 'sine';
    boomOsc.frequency.setValueAtTime(180, now + 0.28);
    boomOsc.frequency.exponentialRampToValueAtTime(32, now + duration);

    boomGain.gain.setValueAtTime(0.14, now + 0.28);
    boomGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    boomOsc.connect(boomGain);
    boomGain.connect(getMasterDestination(ctx));

    boomOsc.start(now + 0.28);
    boomOsc.stop(now + duration);

    // 3. High celestial shimmer
    [1046.5, 1318.5, 1567.98].forEach((f, idx) => {
      const chimeOsc = ctx.createOscillator();
      const chimeGain = ctx.createGain();
      const start = now + 0.3 + idx * 0.03;

      chimeOsc.type = 'sine';
      chimeOsc.frequency.setValueAtTime(f, start);

      chimeGain.gain.setValueAtTime(0.06, start);
      chimeGain.gain.exponentialRampToValueAtTime(0.001, start + 0.22);

      chimeOsc.connect(chimeGain);
      chimeGain.connect(getMasterDestination(ctx));

      chimeOsc.start(start);
      chimeOsc.stop(start + 0.22);
    });
  } catch {
    // Silent fail
  }
}

/** Break effect / Cursed barrier shatter */
export function playBreakShatter(): void {
  if (!isAudioAllowed()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;

    // Metallic dissonant crack (ring modulation effect)
    [320, 580, 890, 1420].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = idx % 2 === 0 ? 'triangle' : 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.3, now + 0.12);

      gain.gain.setValueAtTime(0.08 / (idx + 1), now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

      osc.connect(gain);
      gain.connect(getMasterDestination(ctx));

      osc.start(now);
      osc.stop(now + 0.14);
    });

    // Sub click
    const subOsc = ctx.createOscillator();
    const subGain = ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(160, now);
    subOsc.frequency.exponentialRampToValueAtTime(30, now + 0.08);

    subGain.gain.setValueAtTime(0.12, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    subOsc.connect(subGain);
    subGain.connect(getMasterDestination(ctx));

    subOsc.start(now);
    subOsc.stop(now + 0.08);
  } catch {
    // Silent fail
  }
}

/** Memory equip / Sacred scroll lock */
export function playMemoryEquip(): void {
  if (!isAudioAllowed()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    // Two-tone harmonic bell (A4 -> E5) with soft sine vibration
    const notes = [440, 659.25, 880];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const start = now + i * 0.035;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.07, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.18);

      osc.connect(gain);
      gain.connect(getMasterDestination(ctx));

      osc.start(start);
      osc.stop(start + 0.18);
    });
  } catch {
    // Silent fail
  }
}

/** Cube Summon / Gacha pull sparkle chime */
export function playCubeSummonChime(): void {
  if (!isAudioAllowed()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    // Ascending 5-note pentatonic arpeggio (C5, D5, E5, G5, A5, C6)
    const arpeggio = [523.25, 587.33, 659.25, 783.99, 880, 1046.5];
    arpeggio.forEach((f, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const noteStart = now + idx * 0.03;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, noteStart);

      gain.gain.setValueAtTime(0.06, noteStart);
      gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.16);

      osc.connect(gain);
      gain.connect(getMasterDestination(ctx));

      osc.start(noteStart);
      osc.stop(noteStart + 0.16);
    });
  } catch {
    // Silent fail
  }
}

/** Team Synergy Resonance pulse (Full formation chord) */
export function playTeamSynergyPulse(): void {
  if (!isAudioAllowed()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const chord = [261.63, 329.63, 392.00, 523.25]; // C major chord
    chord.forEach((freq) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      osc.connect(gain);
      gain.connect(getMasterDestination(ctx));

      osc.start(now);
      osc.stop(now + 0.3);
    });
  } catch {
    // Silent fail
  }
}

/** Triumph / Goal achievement fanfare */
export function playSuccessFanfare(): void {
  if (!isAudioAllowed()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const notes = [
      { f: 523.25, d: 0.07, delay: 0 },
      { f: 659.25, d: 0.07, delay: 0.07 },
      { f: 783.99, d: 0.07, delay: 0.14 },
      { f: 1046.5, d: 0.22, delay: 0.21 }
    ];

    notes.forEach((item) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const start = now + item.delay;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(item.f, start);

      gain.gain.setValueAtTime(0.09, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + item.d);

      osc.connect(gain);
      gain.connect(getMasterDestination(ctx));

      osc.start(start);
      osc.stop(start + item.d);
    });
  } catch {
    // Silent fail
  }
}

/** Trash delete / Reset percussive hollow knock */
export function playTrashDelete(): void {
  if (!isAudioAllowed()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.08);

    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(getMasterDestination(ctx));

    osc.start(now);
    osc.stop(now + 0.08);
  } catch {
    // Silent fail
  }
}

/** Elemental acoustic tone (Unique signature for each element) */
export function playElementalTone(element: string): void {
  if (!isAudioAllowed()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    const elem = element.toLowerCase();
    if (elem.includes('blue') || elem.includes('azul') || elem.includes('fantasma') || elem.includes('幻')) {
      // Blue: Deep fluid resonance (Water / Phantom)
      osc.type = 'sine';
      osc.frequency.setValueAtTime(330, now);
      osc.frequency.exponentialRampToValueAtTime(440, now + 0.1);
    } else if (elem.includes('red') || elem.includes('vermelho') || elem.includes('chamas') || elem.includes('夜')) {
      // Red: Aggressive sawtooth strike (Fire / Night)
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(550, now + 0.09);
    } else if (elem.includes('green') || elem.includes('verde') || elem.includes('sombra') || elem.includes('影')) {
      // Green: Harmonic triangle chord (Shadow / Taijutsu)
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(330, now + 0.1);
    } else {
      // Yellow: Bright metallic spark (Decay / Flow)
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(587.33, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);
    }

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    osc.connect(gain);
    gain.connect(getMasterDestination(ctx));

    osc.start(now);
    osc.stop(now + 0.1);
  } catch {
    // Silent fail
  }
}

