import {
  RADIO_AMBIENT_LINES,
  type RadioAmbientLine,
  type RadioLineCategory,
} from '../config';
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

function chunkWords(words: string[]): string[] {
  const clean = words.filter(Boolean);
  if (clean.length <= 2) {
    return clean.length === 0 ? [] : [clean.join(' ')];
  }
  const chunks: string[] = [];
  let i = 0;
  while (i < clean.length) {
    const remaining = clean.length - i;
    const take = remaining === 4 ? 2 : remaining >= 3 ? 3 : remaining;
    chunks.push(clean.slice(i, i + take).join(' '));
    i += take;
  }
  return chunks;
}

class FieldRadioEngine {
  private ctx: AudioContext | null = null;
  private listeners = new Set<Listener>();
  private timers: number[] = [];
  private typingTimer: number | null = null;
  private subtitleTimer: number | null = null;
  private ambientTimer: number | null = null;
  private lastAmbientSpokenAt = 0;
  private lastAmbientRoText = '';
  private lastFocusedModuleId: ModuleId | null = null;
  private lastFocusedAt = 0;
  private focusedModuleId: ModuleId | null = null;
  private lastActionAt = Date.now();
  private lastModuleInputAt = 0;
  private strikesCount = 0;
  private solvedCount = 0;
  private isSpeaking = false;
  private speakGen = 0;
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
    const myGen = ++this.speakGen;

    if (
      soundEngine.isMuted() ||
      typeof window === 'undefined' ||
      !('speechSynthesis' in window)
    ) {
      this.isSpeaking = false;
      if (onDone) {
        const t = window.setTimeout(() => {
          if (this.speakGen === myGen) onDone();
        }, 500);
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
    const queue = chunkWords(baseWords);

    // 15% base probability of repeating a fragment for weak signal realism; rises with strikes
    const repeatChance = Math.min(0.45, 0.15 + this.strikesCount * 0.08);
    if (queue.length > 0 && Math.random() < repeatChance) {
      const idx = Math.floor(Math.random() * queue.length);
      const repeatWord = queue[idx].split(/\s+/)[0] || queue[idx];
      queue.splice(idx, 0, repeatWord);
    }

    this.isSpeaking = true;
    let step = 0;
    const speakNext = () => {
      if (this.speakGen !== myGen || soundEngine.isMuted()) {
        this.isSpeaking = false;
        return;
      }
      if (step >= queue.length) {
        this.isSpeaking = false;
        onDone?.();
        return;
      }
      const chunk = queue[step];
      step += 1;
      const utt = new SpeechSynthesisUtterance(chunk);
      if (voice) utt.voice = voice;
      utt.lang = isRomanian ? 'ro-RO' : 'en-US';
      utt.pitch = 0.5;
      utt.rate = Number((1.1 + (Math.random() - 0.5) * 0.1).toFixed(2));
      utt.volume = 0.92;

      let settled = false;
      const advance = () => {
        if (settled) return;
        settled = true;
        if (this.speakGen !== myGen) return;
        // Static pop between 2-3 word chunks + 40-130ms pause (higher static at strikes, never slower)
        const staticGain = Math.min(0.15, 0.045 + this.strikesCount * 0.025);
        this.playStaticBurst(0.065 + Math.min(0.05, this.strikesCount * 0.012), staticGain);
        const pause = 40 + Math.random() * 90;
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
    this.speakGen += 1;
    this.isSpeaking = false;
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

  setSolvedCount(count: number) {
    this.solvedCount = count;
  }

  setFocusedModule(id: ModuleId | null) {
    this.focusedModuleId = id;
  }

  recordPlayerAction(isModuleInput = false) {
    const now = Date.now();
    this.lastActionAt = now;
    if (isModuleInput) {
      this.lastModuleInputAt = now;
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

  announceModuleSkipped(id: ModuleId) {
    this.clearQueuedTimers();
    const numRo = RO_NUM_WORDS[id - 1] ?? String(id);
    const subtitle = `„…bypass de urgență… mod zero ${numRo} confirmat…”`;

    this.lastReplayPayload = {
      roWords: ['bypass', 'de', 'urgență', 'confirmat'],
      enWords: ['emergency', 'bypass', 'confirmed'],
      subtitle,
    };

    this.triggerJolt();
    this.typeLcdText(`MOD-0${id} · BYP`, false);
    this.showSubtitle(subtitle);
    this.emit({ errorFlash: false, signalBars: this.strikesCount >= 3 ? 0 : 2 });

    this.playBeep(740, 70, 0.08, 0);
    this.playBeep(990, 90, 0.09, 0.1);

    const t = window.setTimeout(() => {
      this.speakFragmented(
        ['bypass', 'de', 'urgență', 'confirmat'],
        ['emergency', 'bypass', 'confirmed'],
        () => this.emit({ transmitting: false })
      );
    }, 220);
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

  private pickContextualAmbientLine(now: number): RadioAmbientLine {
    const idleElapsed = now - this.lastActionAt;
    let pool: RadioAmbientLine[];

    if (idleElapsed >= 60000) {
      pool = RADIO_AMBIENT_LINES.filter((l) => l.category === 'idle');
    } else {
      const allowedCategories: RadioLineCategory[] = [
        'atmosphere',
        'timePressure',
        'encouragement',
      ];
      if (this.solvedCount > 0) {
        allowedCategories.push('progress');
      }
      if (this.strikesCount > 0) {
        allowedCategories.push('strikes');
        if (this.strikesCount >= 2) {
          allowedCategories.push('strikes');
        }
      }
      const cat =
        allowedCategories[Math.floor(Math.random() * allowedCategories.length)];
      pool = RADIO_AMBIENT_LINES.filter((l) => l.category === cat);
    }

    if (pool.length === 0) pool = RADIO_AMBIENT_LINES;
    const filtered =
      pool.length > 1 ? pool.filter((l) => l.ro !== this.lastAmbientRoText) : pool;
    const picked = filtered[Math.floor(Math.random() * filtered.length)] ?? pool[0];
    this.lastAmbientRoText = picked.ro;
    return picked;
  }

  /** Periodic 14-35s static + 65% spoken colleague line (~40s cooldown, idle/activity aware) */
  startAmbientLoop() {
    this.stopAmbientLoop();
    const schedule = () => {
      const delay = 14000 + Math.random() * 21000;
      this.ambientTimer = window.setTimeout(() => {
        if (
          !soundEngine.isMuted() &&
          (typeof document === 'undefined' || !document.hidden)
        ) {
          const staticGain = Math.min(0.085, 0.03 + this.strikesCount * 0.015);
          this.playStaticBurst(0.75, staticGain);
          this.emit({ signalBars: this.defaultSignalBars() });

          const now = Date.now();
          const actedRecently = now - this.lastActionAt < 4000;
          const activeInOpenModule =
            this.focusedModuleId !== null && now - this.lastModuleInputAt < 10000;
          const cooldownReady = now - this.lastAmbientSpokenAt >= 40000;

          if (
            !this.isSpeaking &&
            !this.snap.transmitting &&
            !actedRecently &&
            !activeInOpenModule &&
            cooldownReady &&
            Math.random() < 0.65
          ) {
            this.lastAmbientSpokenAt = now;
            const line = this.pickContextualAmbientLine(now);
            this.showSubtitle(line.ro);
            this.emit({ transmitting: true, weakBlink: true });
            const cleanRo = line.ro.replace(/[….,!?]/g, ' ').trim().split(/\s+/).filter(Boolean);
            const cleanEn = line.en.replace(/[….,!?]/g, ' ').trim().split(/\s+/).filter(Boolean);
            this.speakFragmented(cleanRo, cleanEn, () => {
              this.emit({ transmitting: false, weakBlink: false });
            });
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
