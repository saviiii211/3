import { RADIO_AMBIENT_LINES } from '../config';
import type { ModuleId } from '../game/types';
import { soundEngine } from './sound';

export interface RadioUiSnapshot {
  channel: string;
  lcdLine: string;
  subtitle: string | null;
  transmitting: boolean;
  errorFlash: boolean;
  weakBlink: boolean;
  signalBars: number;
  jolting: boolean;
}

type Listener = (snap: RadioUiSnapshot) => void;

const RO_NUM_WORDS = ['unu', 'doi', 'trei', 'patru', 'cinci', 'șase', 'șapte'];
const EN_NUM_WORDS = ['one', 'two', 'three', 'four', 'five', 'six', 'seven'];

class FieldRadioEngine {
  private ctx: AudioContext | null = null;
  private listeners = new Set<Listener>();
  private timers: number[] = [];
  private typingTimer: number | null = null;
  private subtitleTimer: number | null = null;
  private ambientTimer: number | null = null;
  private lastAmbientSpokenAt = 0;
  private lastFocusedModuleId: ModuleId | null = null;
  private lastFocusedAt = 0;
  private strikesCount = 0;
  private cachedVoices: SpeechSynthesisVoice[] = [];
  private voicesBound = false;

  private lastReplayPayload: { roWords: string[]; enWords: string[]; subtitle: string } | null =
    null;

  private snap: RadioUiSnapshot = {
    channel: 'CH 03',
    lcdLine: 'STANDBY',
    subtitle: null,
    transmitting: false,
    errorFlash: false,
    weakBlink: false,
    signalBars: 2,
    jolting: false,
  };

  subscribe(fn: Listener): () => void {
    this.ensureVoicesBound();
    this.listeners.add(fn);
    fn(this.snap);
    return () => {
      this.listeners.delete(fn);
    };
  }

  private ensureVoicesBound() {
    if (this.voicesBound || typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }
    this.voicesBound = true;
    const refresh = () => {
      try {
        this.cachedVoices = window.speechSynthesis.getVoices();
      } catch {
        this.cachedVoices = [];
      }
    };
    refresh();
    try {
      window.speechSynthesis.addEventListener?.('voiceschanged', refresh);
    } catch {
      // ignore
    }
  }

  private emit(patch: Partial<RadioUiSnapshot>) {
    this.snap = { ...this.snap, ...patch };
    this.listeners.forEach((fn) => fn(this.snap));
  }

  private ensureAudio(): AudioContext | null {
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

  private playStaticBurst(durationSec: number, gainPeak = 0.08) {
    const ctx = this.ensureAudio();
    if (!ctx) return;
    const now = ctx.currentTime;
    const len = Math.max(1, Math.floor(ctx.sampleRate * durationSec));
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const src = ctx.createBufferSource();
    src.buffer = buf;

    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(1400, now);
    bp.Q.setValueAtTime(0.85, now);

    const g = ctx.createGain();
    g.gain.setValueAtTime(Math.min(0.16, gainPeak), now);
    g.gain.exponentialRampToValueAtTime(0.001, now + durationSec);

    src.connect(bp);
    bp.connect(g);
    g.connect(ctx.destination);
    src.start(now);
  }

  private playBeep(freq = 880, durationMs = 80, vol = 0.09, delaySec = 0) {
    const ctx = this.ensureAudio();
    if (!ctx) return;
    const start = ctx.currentTime + delaySec;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, start);
    g.gain.setValueAtTime(Math.min(0.14, vol), start);
    g.gain.exponentialRampToValueAtTime(0.001, start + durationMs / 1000);
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + durationMs / 1000 + 0.01);
  }

  private pickVoice(): { voice: SpeechSynthesisVoice | null; isRomanian: boolean } {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return { voice: null, isRomanian: false };
    }
    this.ensureVoicesBound();
    const voices =
      this.cachedVoices.length > 0 ? this.cachedVoices : window.speechSynthesis.getVoices();
    const ro = voices.find((v) => v.lang.toLowerCase().startsWith('ro'));
    if (ro) return { voice: ro, isRomanian: true };
    const en =
      voices.find((v) => v.lang.toLowerCase().startsWith('en-us')) ||
      voices.find((v) => v.lang.toLowerCase().startsWith('en')) ||
      null;
    return { voice: en, isRomanian: false };
  }

  private speakFragmented(
    roWords: string[],
    enWords: string[],
    onDone?: () => void
  ) {
    if (
      soundEngine.isMuted() ||
      typeof window === 'undefined' ||
      !('speechSynthesis' in window)
    ) {
      if (onDone) {
        const t = window.setTimeout(onDone, 500);
        this.timers.push(t);
      }
      return;
    }

    try {
      window.speechSynthesis.cancel();
    } catch {
      // ignore
    }

    const { voice, isRomanian } = this.pickVoice();
    const baseWords = isRomanian ? roWords : enWords;
    // 15% probability of repeating a word for weak signal realism
    const queue = [...baseWords];
    if (queue.length > 1 && Math.random() < 0.15) {
      const idx = Math.floor(Math.random() * queue.length);
      queue.splice(idx, 0, queue[idx]);
    }

    let step = 0;
    const speakNext = () => {
      if (soundEngine.isMuted()) return;
      if (step >= queue.length) {
        onDone?.();
        return;
      }
      const word = queue[step];
      step += 1;
      const utt = new SpeechSynthesisUtterance(word);
      if (voice) utt.voice = voice;
      utt.lang = isRomanian ? 'ro-RO' : 'en-US';
      utt.pitch = 0.24;
      utt.rate = 0.8;
      utt.volume = 0.9;

      const advance = () => {
        // Static pop between fragments + 120-350ms pause
        this.playStaticBurst(0.08, 0.055 + this.strikesCount * 0.02);
        const pause = 120 + Math.random() * 230;
        const tid = window.setTimeout(speakNext, pause);
        this.timers.push(tid);
      };

      utt.onend = advance;
      utt.onerror = advance;
      try {
        window.speechSynthesis.speak(utt);
      } catch {
        advance();
      }
    };

    speakNext();
  }

  private clearQueuedTimers() {
    while (this.timers.length) {
      const t = this.timers.pop();
      if (t !== undefined) window.clearTimeout(t);
    }
    if (this.typingTimer !== null) {
      window.clearInterval(this.typingTimer);
      this.typingTimer = null;
    }
  }

  private typeLcdText(target: string, weakBlink: boolean) {
    if (this.typingTimer !== null) {
      window.clearInterval(this.typingTimer);
      this.typingTimer = null;
    }
    let idx = 0;
    this.emit({ lcdLine: '', weakBlink });
    this.typingTimer = window.setInterval(() => {
      idx += 1;
      this.emit({ lcdLine: target.slice(0, idx) });
      if (idx >= target.length && this.typingTimer !== null) {
        window.clearInterval(this.typingTimer);
        this.typingTimer = null;
      }
    }, 55);
  }

  private showSubtitle(text: string) {
    if (this.subtitleTimer !== null) {
      window.clearTimeout(this.subtitleTimer);
    }
    this.emit({ subtitle: text });
    this.subtitleTimer = window.setTimeout(() => {
      this.emit({ subtitle: null });
    }, 3000);
  }

  private triggerJolt() {
    this.emit({ jolting: true, transmitting: true });
    const t = window.setTimeout(() => this.emit({ jolting: false }), 300);
    this.timers.push(t);
  }

  private defaultSignalBars(): number {
    if (this.strikesCount >= 3) return 0;
    return Math.random() < 0.7 ? 1 : 2;
  }

  setStrikes(strikes: number) {
    this.strikesCount = strikes;
    if (strikes >= 3) {
      this.emit({ signalBars: 0, lcdLine: 'FĂRĂ SEMNAL' });
    } else if (strikes === 2) {
      this.emit({ signalBars: 1, lcdLine: 'SEMNAL INSTABIL' });
    }
  }

  /** Called directly inside onFocusModule click handler for mobile user-gesture unlock */
  announceModule(id: ModuleId) {
    this.clearQueuedTimers();
    const code = `MOD-0${id}`;
    const numRo = RO_NUM_WORDS[id - 1] ?? String(id);
    const numEn = EN_NUM_WORDS[id - 1] ?? String(id);
    const subtitle = `„Mod zero ${numRo}…”`;
    const nowMs = Date.now();

    this.triggerJolt();
    this.typeLcdText(code, true);
    this.showSubtitle(subtitle);
    this.emit({
      signalBars: this.defaultSignalBars(),
      errorFlash: false,
    });

    // Cooldown < 8s for same module: short chirp only, no voice
    if (this.lastFocusedModuleId === id && nowMs - this.lastFocusedAt < 8000) {
      this.playBeep(880, 75, 0.08);
      const t = window.setTimeout(() => this.emit({ transmitting: false }), 450);
      this.timers.push(t);
      return;
    }

    this.lastFocusedModuleId = id;
    this.lastFocusedAt = nowMs;
    this.lastReplayPayload = {
      roWords: ['mod', 'zero', numRo],
      enWords: ['module', 'zero', numEn],
      subtitle,
    };

    // 0.25s squelch -> fragmented voice -> 880Hz 80ms confirmation beep
    this.playStaticBurst(0.25, 0.09 + this.strikesCount * 0.025);
    const tStart = window.setTimeout(() => {
      this.speakFragmented(
        ['mod', 'zero', numRo],
        ['module', 'zero', numEn],
        () => {
          this.playBeep(880, 80, 0.09);
          const tEnd = window.setTimeout(
            () => this.emit({ transmitting: false, weakBlink: false }),
            400
          );
          this.timers.push(tEnd);
        }
      );
    }, 240);
    this.timers.push(tStart);
  }

  announceModuleSolved(id: ModuleId) {
    this.clearQueuedTimers();
    const numRo = RO_NUM_WORDS[id - 1] ?? String(id);
    const numEn = EN_NUM_WORDS[id - 1] ?? String(id);
    const subtitle = `„Mod zero ${numRo}… dezamorsat”`;

    this.lastReplayPayload = {
      roWords: ['mod', 'zero', numRo, 'dezamorsat'],
      enWords: ['module', 'zero', numEn, 'defused'],
      subtitle,
    };

    this.triggerJolt();
    this.typeLcdText(`MOD-0${id} · OK`, false);
    this.showSubtitle(subtitle);
    this.emit({ errorFlash: false, signalBars: this.strikesCount >= 3 ? 0 : 2 });

    // 3 ascending beeps
    this.playBeep(660, 70, 0.08, 0);
    this.playBeep(880, 70, 0.08, 0.09);
    this.playBeep(1100, 90, 0.09, 0.18);

    const t = window.setTimeout(() => {
      this.speakFragmented(
        ['mod', 'zero', numRo, 'dezamorsat'],
        ['module', 'zero', numEn, 'defused'],
        () => this.emit({ transmitting: false })
      );
    }, 290);
    this.timers.push(t);
  }

  announceStrike(totalStrikes: number) {
    this.strikesCount = totalStrikes;
    this.clearQueuedTimers();
    const subtitle = '„Eroare… semnal instabil!”';
    this.lastReplayPayload = {
      roWords: ['eroare'],
      enWords: ['strike'],
      subtitle,
    };

    this.emit({
      errorFlash: true,
      transmitting: true,
      jolting: true,
      lcdLine: 'ERR!',
      signalBars: totalStrikes >= 3 ? 0 : 1,
    });
    this.showSubtitle(subtitle);

    this.playStaticBurst(0.32, Math.min(0.16, 0.1 + totalStrikes * 0.025));
    const tJolt = window.setTimeout(() => this.emit({ jolting: false }), 300);
    const tSpeak = window.setTimeout(() => {
      this.speakFragmented(['eroare'], ['error'], () => {
        this.emit({ transmitting: false });
      });
    }, 180);
    const tClearErr = window.setTimeout(() => {
      this.emit({
        errorFlash: false,
        lcdLine:
          totalStrikes >= 3
            ? 'FĂRĂ SEMNAL'
            : totalStrikes >= 2
              ? 'SEMNAL INSTABIL'
              : 'STANDBY',
      });
    }, 1050);
    this.timers.push(tJolt, tSpeak, tClearErr);
  }

  announceVictory() {
    this.clearQueuedTimers();
    const subtitle = '„Dispozitiv neutralizat.”';
    this.lastReplayPayload = {
      roWords: ['dispozitiv', 'neutralizat'],
      enWords: ['device', 'neutralized'],
      subtitle,
    };
    this.emit({
      transmitting: true,
      errorFlash: false,
      weakBlink: false,
      lcdLine: 'NEUTRALIZAT',
      signalBars: 3,
    });
    this.showSubtitle(subtitle);
    this.playBeep(784, 90, 0.09, 0);
    this.playBeep(1046, 120, 0.09, 0.11);
    const t = window.setTimeout(() => {
      this.speakFragmented(
        ['dispozitiv', 'neutralizat'],
        ['device', 'neutralized'],
        () => this.emit({ transmitting: false })
      );
    }, 240);
    this.timers.push(t);
  }

  replayLast() {
    if (!this.lastReplayPayload) {
      this.playBeep(880, 65, 0.07);
      this.showSubtitle('„Canal 03 recepție activă…”');
      return;
    }
    const { roWords, enWords, subtitle } = this.lastReplayPayload;
    this.clearQueuedTimers();
    this.triggerJolt();
    this.showSubtitle(subtitle);
    this.playStaticBurst(0.2, 0.075);
    const t = window.setTimeout(() => {
      this.speakFragmented(roWords, enWords, () =>
        this.emit({ transmitting: false })
      );
    }, 200);
    this.timers.push(t);
  }

  cancel() {
    this.clearQueuedTimers();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }
    }
    this.emit({
      transmitting: false,
      weakBlink: false,
      jolting: false,
      lcdLine:
        this.strikesCount >= 3
          ? 'FĂRĂ SEMNAL'
          : this.strikesCount >= 2
            ? 'SEMNAL INSTABIL'
            : 'STANDBY',
    });
  }

  /** Periodic 40-90s faint static + rare (<1 per 3 min) spoken ambient line */
  startAmbientLoop() {
    this.stopAmbientLoop();
    const schedule = () => {
      const delay = 40000 + Math.random() * 50000;
      this.ambientTimer = window.setTimeout(() => {
        if (
          !soundEngine.isMuted() &&
          (typeof document === 'undefined' || !document.hidden)
        ) {
          this.playStaticBurst(1.1, 0.032);
          this.emit({ signalBars: this.defaultSignalBars() });

          const now = Date.now();
          if (now - this.lastAmbientSpokenAt > 180000 && Math.random() < 0.35) {
            this.lastAmbientSpokenAt = now;
            const line =
              RADIO_AMBIENT_LINES[
                Math.floor(Math.random() * RADIO_AMBIENT_LINES.length)
              ];
            this.showSubtitle(line);
            const cleanWords = line.replace(/[….]/g, ' ').trim().split(/\s+/).filter(Boolean);
            this.speakFragmented(cleanWords, ['detective', 'stay', 'focused']);
          }
        }
        schedule();
      }, delay);
    };
    schedule();
  }

  stopAmbientLoop() {
    if (this.ambientTimer !== null) {
      window.clearTimeout(this.ambientTimer);
      this.ambientTimer = null;
    }
  }

  dispose() {
    this.stopAmbientLoop();
    this.cancel();
    if (this.subtitleTimer !== null) {
      window.clearTimeout(this.subtitleTimer);
      this.subtitleTimer = null;
    }
    if (this.ctx) {
      void this.ctx.close().catch(() => {});
      this.ctx = null;
    }
  }
}

export const radioEngine = new FieldRadioEngine();
