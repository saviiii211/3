import { soundEngine } from './sound';

class RoomAmbienceAudio {
  private ctx: AudioContext | null = null;
  private humOsc: OscillatorNode | null = null;
  private humGain: GainNode | null = null;
  private running = false;
  private sfxTimer: number | null = null;
  private sfxSubTimers: number[] = [];
  private sfxActive = false;
  private sfxStrikes = 0;
  private sfxBusyUntil = 0;
  private lastSfxIndex = -1;

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

  /** Crisp short mechanical metallic latch/hinge sound for the rear I/O casing lid */
  playLidLatch(opening: boolean) {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // 1. Short metallic clack transient
    const noise = ctx.createBufferSource();
    noise.buffer = this.makeNoiseBuffer(ctx, 0.09);
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(opening ? 2100 : 1450, now);
    bp.Q.setValueAtTime(3.0, now);
    const nGain = ctx.createGain();
    nGain.gain.setValueAtTime(0.085, now);
    nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.085);
    noise.connect(bp);
    bp.connect(nGain);
    nGain.connect(ctx.destination);
    noise.start(now);

    // 2. Resonant stamped-steel ring
    const ring = ctx.createOscillator();
    const rGain = ctx.createGain();
    ring.type = 'triangle';
    ring.frequency.setValueAtTime(opening ? 520 : 390, now);
    ring.frequency.exponentialRampToValueAtTime(opening ? 760 : 210, now + 0.14);
    rGain.gain.setValueAtTime(0.065, now);
    rGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    ring.connect(rGain);
    rGain.connect(ctx.destination);
    ring.start(now);
    ring.stop(now + 0.16);

    // 3. Secondary mechanical latch click when closing
    if (!opening) {
      const latch = ctx.createOscillator();
      const lGain = ctx.createGain();
      latch.type = 'square';
      latch.frequency.setValueAtTime(880, now + 0.095);
      lGain.gain.setValueAtTime(0.045, now + 0.095);
      lGain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);
      latch.connect(lGain);
      lGain.connect(ctx.destination);
      latch.start(now + 0.095);
      latch.stop(now + 0.14);
    }
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

  private randVol(min = 0.02, max = 0.06): number {
    return min + Math.random() * (max - min);
  }

  /** Random WebAudio ambient noir room & radio SFX (11 distinct sounds, vol 0.02-0.06, never overlapping) */
  private triggerRandomAmbientSfx(): number {
    const ctx = this.ensureContext();
    if (!ctx) return 0;
    const now = ctx.currentTime;
    const nowMs = Date.now();
    if (nowMs < this.sfxBusyUntil) return 0;

    let idx = Math.floor(Math.random() * 11);
    if (idx === this.lastSfxIndex) {
      idx = (idx + 1 + Math.floor(Math.random() * 10)) % 11;
    }
    this.lastSfxIndex = idx;

    let durationMs = 600;
    switch (idx) {
      case 0: {
        // Scârțâit de podea
        const osc = ctx.createOscillator();
        const bp = ctx.createBiquadFilter();
        const g = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(112, now);
        osc.frequency.linearRampToValueAtTime(164, now + 0.24);
        osc.frequency.linearRampToValueAtTime(94, now + 0.52);
        bp.type = 'bandpass';
        bp.frequency.setValueAtTime(460, now);
        bp.Q.setValueAtTime(3.6, now);
        const v = this.randVol(0.024, 0.044);
        g.gain.setValueAtTime(0.001, now);
        g.gain.linearRampToValueAtTime(v, now + 0.08);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.52);
        osc.connect(bp);
        bp.connect(g);
        g.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.54);
        durationMs = 600;
        break;
      }
      case 1: {
        // Picătură de apă
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(620, now);
        osc.frequency.exponentialRampToValueAtTime(1240, now + 0.07);
        const v = this.randVol(0.025, 0.048);
        g.gain.setValueAtTime(v, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
        osc.connect(g);
        g.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.1);
        durationMs = 200;
        break;
      }
      case 2: {
        // Tunet îndepărtat
        const src = ctx.createBufferSource();
        src.buffer = this.makeNoiseBuffer(ctx, 1.55);
        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.setValueAtTime(95, now);
        const g = ctx.createGain();
        const v = this.randVol(0.036, 0.06);
        g.gain.setValueAtTime(0.001, now);
        g.gain.linearRampToValueAtTime(v, now + 0.25);
        g.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
        src.connect(lp);
        lp.connect(g);
        g.connect(ctx.destination);
        src.start(now);
        durationMs = 1600;
        break;
      }
      case 3: {
        // Sirenă foarte departe
        const osc = ctx.createOscillator();
        const lp = ctx.createBiquadFilter();
        const g = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(470, now);
        osc.frequency.linearRampToValueAtTime(610, now + 0.65);
        osc.frequency.linearRampToValueAtTime(460, now + 1.35);
        lp.type = 'lowpass';
        lp.frequency.setValueAtTime(720, now);
        const v = this.randVol(0.02, 0.032);
        g.gain.setValueAtTime(0.001, now);
        g.gain.linearRampToValueAtTime(v, now + 0.3);
        g.gain.exponentialRampToValueAtTime(0.001, now + 1.38);
        osc.connect(lp);
        lp.connect(g);
        g.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 1.4);
        durationMs = 1450;
        break;
      }
      case 4: {
        // Click de releu
        [0, 0.085].forEach((offset) => {
          const src = ctx.createBufferSource();
          src.buffer = this.makeNoiseBuffer(ctx, 0.02);
          const bp = ctx.createBiquadFilter();
          bp.type = 'bandpass';
          bp.frequency.setValueAtTime(1650, now + offset);
          bp.Q.setValueAtTime(2.5, now + offset);
          const g = ctx.createGain();
          g.gain.setValueAtTime(this.randVol(0.028, 0.052), now + offset);
          g.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.018);
          src.connect(bp);
          bp.connect(g);
          g.connect(ctx.destination);
          src.start(now + offset);
        });
        durationMs = 200;
        break;
      }
      case 5: {
        // Vânt prin geam
        const src = ctx.createBufferSource();
        src.buffer = this.makeNoiseBuffer(ctx, 1.3);
        const bp = ctx.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.setValueAtTime(360, now);
        bp.frequency.linearRampToValueAtTime(640, now + 0.55);
        bp.frequency.linearRampToValueAtTime(300, now + 1.25);
        bp.Q.setValueAtTime(3.2, now);
        const g = ctx.createGain();
        const v = this.randVol(0.024, 0.042);
        g.gain.setValueAtTime(0.001, now);
        g.gain.linearRampToValueAtTime(v, now + 0.32);
        g.gain.exponentialRampToValueAtTime(0.001, now + 1.28);
        src.connect(bp);
        bp.connect(g);
        g.connect(ctx.destination);
        src.start(now);
        durationMs = 1350;
        break;
      }
      case 6: {
        // Pași pe hol (3 pași îndepărtați)
        [0, 420, 840].forEach((ms) => {
          const tid = window.setTimeout(() => {
            if (!this.sfxActive || soundEngine.isMuted() || document.hidden) return;
            const c = this.ensureContext();
            if (!c) return;
            const t = c.currentTime;
            const osc = c.createOscillator();
            const g = c.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(68, t);
            osc.frequency.exponentialRampToValueAtTime(36, t + 0.065);
            g.gain.setValueAtTime(this.randVol(0.025, 0.045), t);
            g.gain.exponentialRampToValueAtTime(0.001, t + 0.075);
            osc.connect(g);
            g.connect(c.destination);
            osc.start(t);
            osc.stop(t + 0.085);
          }, ms);
          this.sfxSubTimers.push(tid);
        });
        durationMs = 1050;
        break;
      }
      case 7: {
        // Ușă trântită departe
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(76, now);
        osc.frequency.exponentialRampToValueAtTime(32, now + 0.22);
        g.gain.setValueAtTime(this.randVol(0.038, 0.058), now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
        osc.connect(g);
        g.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.26);
        durationMs = 350;
        break;
      }
      case 8: {
        // Ping de purtătoare radio
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1320, now);
        g.gain.setValueAtTime(this.randVol(0.02, 0.036), now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc.connect(g);
        g.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.22);
        durationMs = 300;
        break;
      }
      case 9: {
        // Morse scurt (· − ·)
        const pips = [
          { start: 0, len: 0.055 },
          { start: 0.11, len: 0.14 },
          { start: 0.31, len: 0.055 },
        ];
        const v = this.randVol(0.022, 0.038);
        pips.forEach((p) => {
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(980, now + p.start);
          g.gain.setValueAtTime(v, now + p.start);
          g.gain.exponentialRampToValueAtTime(0.001, now + p.start + p.len);
          osc.connect(g);
          g.connect(ctx.destination);
          osc.start(now + p.start);
          osc.stop(now + p.start + p.len + 0.01);
        });
        durationMs = 450;
        break;
      }
      default: {
        // Scrâșnet scurt de static
        const src = ctx.createBufferSource();
        src.buffer = this.makeNoiseBuffer(ctx, 0.18);
        const bp = ctx.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.setValueAtTime(1850, now);
        bp.Q.setValueAtTime(1.4, now);
        const g = ctx.createGain();
        g.gain.setValueAtTime(this.randVol(0.028, 0.052), now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.17);
        src.connect(bp);
        bp.connect(g);
        g.connect(ctx.destination);
        src.start(now);
        durationMs = 260;
        break;
      }
    }

    this.sfxBusyUntil = nowMs + durationMs;
    return durationMs;
  }

  /** Start/stop random 8-25s (5-14s at strikes >= 2) ambient SFX loop */
  setAmbientSfxActive(active: boolean, strikes = 0) {
    this.sfxStrikes = strikes;
    if (!active || soundEngine.isMuted() || (typeof document !== 'undefined' && document.hidden)) {
      this.stopAmbientSfx();
      return;
    }
    if (this.sfxActive) return;
    this.sfxActive = true;

    const scheduleNext = () => {
      if (!this.sfxActive) return;
      const minMs = this.sfxStrikes >= 2 ? 5000 : 8000;
      const maxMs = this.sfxStrikes >= 2 ? 14000 : 25000;
      const wait = minMs + Math.random() * (maxMs - minMs);
      this.sfxTimer = window.setTimeout(() => {
        if (!this.sfxActive) return;
        const ranMs = this.triggerRandomAmbientSfx();
        const extraDelay = ranMs > 0 ? ranMs : 0;
        if (extraDelay > 0) {
          this.sfxTimer = window.setTimeout(scheduleNext, extraDelay);
        } else {
          scheduleNext();
        }
      }, wait);
    };
    scheduleNext();
  }

  stopAmbientSfx() {
    this.sfxActive = false;
    if (this.sfxTimer !== null) {
      window.clearTimeout(this.sfxTimer);
      this.sfxTimer = null;
    }
    while (this.sfxSubTimers.length) {
      const id = this.sfxSubTimers.pop();
      if (id !== undefined) window.clearTimeout(id);
    }
  }

  dispose() {
    this.stopTensionHum();
    this.stopAmbientSfx();
    if (this.ctx) {
      void this.ctx.close().catch(() => {});
      this.ctx = null;
    }
  }
}

export const ambienceAudio = new RoomAmbienceAudio();
