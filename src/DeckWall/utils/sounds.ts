let audioCtx: AudioContext | null = null;

function getCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  return audioCtx;
}

export function resumeAudio() {
  const ctx = getCtx();
  if (ctx.state === 'suspended') ctx.resume();
}

function tone(freq: number, duration: number, opts: {
  type?: OscillatorType;
  gain?: number;
  freqEnd?: number;
  gainEnd?: number;
  delay?: number;
} = {}) {
  try {
    const ctx = getCtx();
    const now = ctx.currentTime + (opts.delay || 0);
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = opts.type || 'sine';
    osc.frequency.setValueAtTime(freq, now);
    if (opts.freqEnd) osc.frequency.exponentialRampToValueAtTime(opts.freqEnd, now + duration);
    g.gain.setValueAtTime(opts.gain ?? 0.05, now);
    g.gain.exponentialRampToValueAtTime(opts.gainEnd ?? 0.001, now + duration);
    osc.connect(g).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration);
  } catch {
    /* sound must never break gameplay */
  }
}

export function playClick() {
  tone(620, 0.05, { type: 'triangle', freqEnd: 420, gain: 0.055 });
}

export function playGenerate() {
  tone(180, 0.18, { type: 'sawtooth', gain: 0.035 });
  tone(360, 0.18, { type: 'sawtooth', gain: 0.03, delay: 0.04 });
  tone(720, 0.16, { type: 'sawtooth', gain: 0.026, delay: 0.08 });
}

export function playSuccess() {
  [440, 554, 659, 880].forEach((freq, index) => {
    tone(freq, 0.16, { type: 'sine', gain: 0.055, delay: index * 0.045 });
  });
}

export function playFail() {
  tone(150, 0.16, { type: 'square', freqEnd: 90, gain: 0.045 });
}

export function playOpen() {
  tone(300, 0.08, { type: 'sine', freqEnd: 520, gain: 0.04 });
}
