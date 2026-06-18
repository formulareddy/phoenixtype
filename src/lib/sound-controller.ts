import { configStore } from "./config-store";
import type { PlaySoundOnClick, PlaySoundOnError } from "../types";

let audioCtx: AudioContext | null = null;

function getAudioCtx(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext();
  if (audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}

const wavCache = new Map<string, AudioBuffer | null>();

async function loadWav(path: string): Promise<AudioBuffer | null> {
  if (wavCache.has(path)) return wavCache.get(path) ?? null;
  try {
    const ctx = getAudioCtx();
    const resp = await fetch(path);
    const arrayBuf = await resp.arrayBuffer();
    const audioBuf = await ctx.decodeAudioData(arrayBuf);
    wavCache.set(path, audioBuf);
    return audioBuf;
  } catch {
    wavCache.set(path, null);
    return null;
  }
}

function playWavBuffer(buf: AudioBuffer, volume: number) {
  try {
    const ctx = getAudioCtx();
    const source = ctx.createBufferSource();
    const gain = ctx.createGain();
    source.buffer = buf;
    gain.gain.value = volume;
    source.connect(gain);
    gain.connect(ctx.destination);
    source.start(ctx.currentTime);
  } catch { /* audio not available */ }
}

const clickCounts: Record<number, number> = {
  1: 3, 2: 3, 3: 3, 4: 6, 5: 6, 6: 3, 7: 3,
  14: 8, 15: 5, 16: 8, 17: 10, 18: 10, 19: 10,
  20: 10, 21: 10, 22: 10, 23: 10, 24: 10, 25: 10, 26: 10,
};

const clickSoundConfig: Partial<Record<Exclude<PlaySoundOnClick, "off">, string[]>> = {};
for (const [id, count] of Object.entries(clickCounts)) {
  const paths: string[] = [];
  for (let i = 1; i <= count; i++) paths.push(`/sounds/click${id}/${i}.wav`);
  clickSoundConfig[id as unknown as Exclude<PlaySoundOnClick, "off">] = paths;
}

const errorSoundConfig: Record<Exclude<PlaySoundOnError, "off">, string[]> = {
  1: ["/sounds/error1/1.wav"],
  2: ["/sounds/error2/1.wav"],
  3: ["/sounds/error3/1.wav"],
  4: ["/sounds/error4/1.wav", "/sounds/error4/2.wav"],
};

const loadedClickBundles = new Set<Exclude<PlaySoundOnClick, "off">>();
let errorBuffers: Map<Exclude<PlaySoundOnError, "off">, AudioBuffer[]> | null = null;
let timeWarningBuffer: AudioBuffer | null = null;

async function ensureClickLoaded(id: Exclude<PlaySoundOnClick, "off">) {
  if (loadedClickBundles.has(id)) return;
  loadedClickBundles.add(id);
  const paths = clickSoundConfig[id];
  if (!paths) return;
  await Promise.all(paths.map((p) => loadWav(p)));
}

async function ensureErrorLoaded() {
  if (errorBuffers) return;
  errorBuffers = new Map();
  for (const [id, paths] of Object.entries(errorSoundConfig)) {
    const bufs: AudioBuffer[] = [];
    for (const p of paths) {
      const buf = await loadWav(p);
      if (buf) bufs.push(buf);
    }
    errorBuffers.set(id as Exclude<PlaySoundOnError, "off">, bufs);
  }
}

async function ensureTimeWarningLoaded() {
  if (timeWarningBuffer) return;
  timeWarningBuffer = await loadWav("/sounds/timeWarning.wav");
}

type ValidNotes = "C" | "Db" | "D" | "Eb" | "E" | "F" | "Gb" | "G" | "Ab" | "A" | "Bb" | "B";

const noteFreqs: Record<ValidNotes, number[]> = {
  C: [16.35, 32.7, 65.41, 130.81, 261.63, 523.25, 1046.5, 2093.0, 4186.01],
  Db: [17.32, 34.65, 69.3, 138.59, 277.18, 554.37, 1108.73, 2217.46, 4434.92],
  D: [18.35, 36.71, 73.42, 146.83, 293.66, 587.33, 1174.66, 2349.32, 4698.64],
  Eb: [19.45, 38.89, 77.78, 155.56, 311.13, 622.25, 1244.51, 2489.02, 4978.03],
  E: [20.6, 41.2, 82.41, 164.81, 329.63, 659.26, 1318.51, 2637.02],
  F: [21.83, 43.65, 87.31, 174.61, 349.23, 698.46, 1396.91, 2793.83],
  Gb: [23.12, 46.25, 92.5, 185.0, 369.99, 739.99, 1479.98, 2959.96],
  G: [24.5, 49.0, 98.0, 196.0, 392.0, 783.99, 1567.98, 3135.96],
  Ab: [25.96, 51.91, 103.83, 207.65, 415.3, 830.61, 1661.22, 3322.44],
  A: [27.5, 55.0, 110.0, 220.0, 440.0, 880.0, 1760.0, 3520.0],
  Bb: [29.14, 58.27, 116.54, 233.08, 466.16, 932.33, 1864.66, 3729.31],
  B: [30.87, 61.74, 123.47, 246.94, 493.88, 987.77, 1975.53, 3951.07],
};

function playNote(oscillatorType: OscillatorType) {
  try {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = oscillatorType;
    osc.frequency.value = noteFreqs.C[4];
    gain.gain.setValueAtTime(configStore.soundVolume / 10, ctx.currentTime);
    gain.gain.setTargetAtTime(0, ctx.currentTime, 0.15);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.5);
  } catch { /* audio not available */ }
}

function playScale(notes: ValidNotes[]) {
  try {
    const ctx = getAudioCtx();
    const n = notes[Math.floor(Math.random() * notes.length)];
    const oct = 4 + Math.floor(Math.random() * 3);
    const freq = noteFreqs[n][oct] ?? noteFreqs[n][noteFreqs[n].length - 1];
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    gain.gain.setValueAtTime(configStore.soundVolume / 10, ctx.currentTime);
    gain.gain.setTargetAtTime(0, ctx.currentTime, 0.3);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = freq;
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 2);
  } catch { /* audio not available */ }
}

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export async function playClick() {
  const val = configStore.playSoundOnClick;
  if (val === "off") return;
  const id = parseInt(val);
  if (id >= 8 && id <= 11) {
    playNote(["sine", "sawtooth", "square", "triangle"][id - 8] as OscillatorType);
    return;
  }
  if (id === 12) { playScale(["C", "D", "E", "G", "A"]); return; }
  if (id === 13) { playScale(["C", "D", "E", "Gb", "Ab", "Bb"]); return; }
  const key = val as Exclude<PlaySoundOnClick, "off">;
  await ensureClickLoaded(key);
  const paths = clickSoundConfig[key];
  if (!paths || paths.length === 0) return;
  const buf = wavCache.get(randomElement(paths));
  if (buf) playWavBuffer(buf, configStore.soundVolume);
}

export async function playError() {
  const val = configStore.playSoundOnError;
  if (val === "off") return;
  await ensureErrorLoaded();
  const bufs = errorBuffers?.get(val);
  if (!bufs || bufs.length === 0) return;
  playWavBuffer(randomElement(bufs), configStore.soundVolume);
}

export async function playTimeWarning() {
  await ensureTimeWarningLoaded();
  if (timeWarningBuffer) playWavBuffer(timeWarningBuffer, configStore.soundVolume);
}

export async function previewClick(val: PlaySoundOnClick) {
  if (val === "off") return;
  const id = parseInt(val);
  if (id >= 8 && id <= 11) {
    playNote(["sine", "sawtooth", "square", "triangle"][id - 8] as OscillatorType);
    return;
  }
  if (id === 12) { playScale(["C", "D", "E", "G", "A"]); return; }
  if (id === 13) { playScale(["C", "D", "E", "Gb", "Ab", "Bb"]); return; }
  const key = val as Exclude<PlaySoundOnClick, "off">;
  const paths = clickSoundConfig[key];
  if (!paths || paths.length === 0) return;
  const buf = wavCache.get(paths[0]) ?? await loadWav(paths[0]);
  if (buf) playWavBuffer(buf, configStore.soundVolume);
}

export async function previewError(val: PlaySoundOnError) {
  if (val === "off") return;
  const key = val as Exclude<PlaySoundOnError, "off">;
  const paths = errorSoundConfig[key];
  if (!paths || paths.length === 0) return;
  const buf = wavCache.get(paths[0]) ?? await loadWav(paths[0]);
  if (buf) playWavBuffer(buf, configStore.soundVolume);
}

export function clearAllSounds() {
  // no-op with raw AudioContext; sources auto-disconnect when done
}
