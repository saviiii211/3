import { soundEngine } from './sound';

class RoomAmbienceAudio {
  private ctx: AudioContext | null = null;
  private humOsc: OscillatorNode | null = null;
  private humGain: GainNode | null = null;
  private running = false;

  private ensureContext(): AudioContext | null {
    if (soundEngine.isMuted() || typeof window === 'undefined') return null;
    if (typeof document !== 'undefined' && document.hidden) return null;
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return null;
    if (!this.ctx) {
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private makeNoiseBuffer(ctx: AudioContext, durationSec: number): AudioBuffer {
    const len = Math.max(1, Math.floor(ctx.sampleRate * durationSec));
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const ch = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      ch[i] = Math.random() * 2 - 1;
    }
    return buf;
  }

  /** Gate unlock: CRT degauss thunk + warm bass hum */
  playTerminalPowerOn() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(115, now);
    osc.frequency.exponentialRampToValueAtTime(52, now + 0.34);
    g.gain.setValueAtTime(0.14, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(280, now);

    osc.connect(lp);
    lp.connect(g);
    g.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.4);
  }

  /** Typewriter/terminal character tick: 1800Hz +/- 8%, 10ms, vol 0.02-0.035 */
  playTypeTick() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = this.makeNoiseBuffer(ctx, 0.014);

    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(1800 * (0.92 + Math.random() * 0.16), now);
    bp.Q.setValueAtTime(3.2, now);

    const g = ctx.createGain();
    g.gain.setValueAtTime(0.02 + Math.random() * 0.015, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.012);

    src.connect(bp);
    bp.connect(g);
    g.connect(ctx.destination);
    src.start(now);
  }

  /** Terminal Enter confirmation & CRT collapse tone */
  playTerminalShutdown() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(640, now);
    osc.frequency.exponentialRampToValueAtTime(95, now + 0.38);
    g.gain.setValueAtTime(0.12, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.42);
  }

  /** Creaking wooden door opening */
  playDoorCreak() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    const lp = ctx.createBiquadFilter();
    const g = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(90, now);
    osc.frequency.linearRampToValueAtTime(140, now + 0.48);
    osc.frequency.linearRampToValueAtTime(70, now + 1.1);

    lfo.frequency.setValueAtTime(16, now);
    lfoGain.gain.setValueAtTime(14, now);
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);

    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(600, now);

    g.gain.setValueAtTime(0.001, now);
    g.gain.linearRampToValueAtTime(0.09, now + 0.14);
    g.gain.exponentialRampToValueAtTime(0.001, now + 1.1);

    osc.connect(lp);
    lp.connect(g);
    g.connect(ctx.destination);
    lfo.start(now);
    osc.start(now);
    lfo.stop(now + 1.12);
    osc.stop(now + 1.12);
  }

  /** Muffled footsteps on wooden planks */
  playFootstep() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const noise = ctx.createBufferSource();
    noise.buffer = this.makeNoiseBuffer(ctx, 0.065);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(420, now);
    const nGain = ctx.createGain();
    nGain.gain.setValueAtTime(0.09, now);
    nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    noise.connect(lp);
    lp.connect(nGain);
    nGain.connect(ctx.destination);
    noise.start(now);

    const thud = ctx.createOscillator();
    const tGain = ctx.createGain();
    thud.type = 'sine';
    thud.frequency.setValueAtTime(72, now);
    thud.frequency.exponentialRampToValueAtTime(38, now + 0.07);
    tGain.gain.setValueAtTime(0.11, now);
    tGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    thud.connect(tGain);
    tGain.connect(ctx.destination);
    thud.start(now);
    thud.stop(now + 0.09);
  }

  /** Heavy wooden door thud closing */
  playDoorCloseThud() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(95, now);
    osc.frequency.exponentialRampToValueAtTime(36, now + 0.2);
    g.gain.setValueAtTime(0.15, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.24);
  }

  /** Hanging lamp click + slow 100Hz hum */
  playBulbPowerOn() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const click = ctx.createOscillator();
    const cg = ctx.createGain();
    click.type = 'square';
    click.frequency.setValueAtTime(920, now);
    cg.gain.setValueAtTime(0.08, now);
    cg.gain.exponentialRampToValueAtTime(0.001, now + 0.025);
    click.connect(cg);
    cg.connect(ctx.destination);
    click.start(now);
    click.stop(now + 0.03);

    const hum = ctx.createOscillator();
    const hg = ctx.createGain();
    hum.type = 'sine';
    hum.frequency.setValueAtTime(100, now + 0.04);
    hg.gain.setValueAtTime(0.001, now + 0.04);
    hg.gain.linearRampToValueAtTime(0.03, now + 0.55);
    hg.gain.exponentialRampToValueAtTime(0.005, now + 1.4);
    hum.connect(hg);
    hg.connect(ctx.destination);
    hum.start(now + 0.04);
    hum.stop(now + 1.45);
  }

  /** Wooden chair scraping on floor */
  playChairScrape() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = this.makeNoiseBuffer(ctx, 0.52);
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(420, now);
    bp.frequency.linearRampToValueAtTime(880, now + 0.26);
    bp.frequency.linearRampToValueAtTime(480, now + 0.5);
    bp.Q.setValueAtTime(4.2, now);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.001, now);
    g.gain.linearRampToValueAtTime(0.075, now + 0.08);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    src.connect(bp);
    bp.connect(g);
    g.connect(ctx.destination);
    src.start(now);
  }

  /** Short weak radio static crackle for cutscene radio wake-up */
  playRadioCrackle() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = this.makeNoiseBuffer(ctx, 0.28);
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(1400, now);
    bp.Q.setValueAtTime(1.1, now);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.06, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.27);
    src.connect(bp);
    bp.connect(g);
    g.connect(ctx.destination);
    src.start(now);
  }

  /** Relieved sigh exhale in Finale: lowpass 1200Hz, 0.9s, vol 0.05 */
  playExhale() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = this.makeNoiseBuffer(ctx, 0.95);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(1200, now);
    lp.frequency.exponentialRampToValueAtTime(450, now + 0.88);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.001, now);
    g.gain.linearRampToValueAtTime(0.05, now + 0.18);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.92);
    src.connect(lp);
    lp.connect(g);
    g.connect(ctx.destination);
    src.start(now);
  }

  /** Faint continuous low 100Hz room/lamp electrical hum during gameplay */
  setTensionHum(tensionLevel: number, active: boolean) {
    if (!active || soundEngine.isMuted() || (typeof document !== 'undefined' && document.hidden)) {
      this.stopTensionHum();
      return;
    }
    const ctx = this.ensureContext();
    if (!ctx) return;
    if (!this.running) {
      try {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(100, ctx.currentTime);
        g.gain.setValueAtTime(0.002, ctx.currentTime);
        osc.connect(g);
        g.connect(ctx.destination);
        osc.start();
        this.humOsc = osc;
        this.humGain = g;
        this.running = true;
      } catch {
        this.running = false;
      }
    }
    if (this.humGain && this.ctx) {
      const targetVol = tensionLevel >= 2 ? 0.022 : tensionLevel === 1 ? 0.01 : 0.004;
      this.humGain.gain.setTargetAtTime(targetVol, this.ctx.currentTime, 0.25);
    }
  }

  stopTensionHum() {
    if (this.humOsc) {
      try {
        this.humOsc.stop();
        this.humOsc.disconnect();
      } catch {
        // ignore
      }
      this.humOsc = null;
    }
    if (this.humGain) {
      try {
        this.humGain.disconnect();
      } catch {
        // ignore
      }
      this.humGain = null;
    }
    this.running = false;
  }

  dispose() {
    this.stopTensionHum();
    if (this.ctx) {
      void this.ctx.close().catch(() => {});
      this.ctx = null;
    }
  }
}

export const ambienceAudio = new RoomAmbienceAudio();
