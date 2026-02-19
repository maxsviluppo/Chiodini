
import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AudioService {
  private audioCtx: AudioContext | null = null;
  muted = signal(false);

  constructor() {
    try {
      this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (e) {
      console.warn('Web Audio API not supported');
    }
  }

  toggleMute() {
    this.muted.update(v => !v);
  }

  private playTone(freq: number, type: OscillatorType, duration: number, startTime: number = 0) {
    if (this.muted() || !this.audioCtx) return;
    
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }

    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime + startTime);
    
    gain.gain.setValueAtTime(0.1, this.audioCtx.currentTime + startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + startTime + duration);

    osc.connect(gain);
    gain.connect(this.audioCtx.destination);

    osc.start(this.audioCtx.currentTime + startTime);
    osc.stop(this.audioCtx.currentTime + startTime + duration);
  }

  playPop() {
    // A nice "pop" sound for peg placement
    // Short sine wave with rapid pitch drop
    if (this.muted() || !this.audioCtx) return;
    if (this.audioCtx.state === 'suspended') this.audioCtx.resume();

    const t = this.audioCtx.currentTime;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.frequency.setValueAtTime(600, t);
    osc.frequency.exponentialRampToValueAtTime(100, t + 0.1);
    
    gain.gain.setValueAtTime(0.1, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);

    osc.connect(gain);
    gain.connect(this.audioCtx.destination);

    osc.start(t);
    osc.stop(t + 0.1);
  }

  playRemove() {
    // A "suction" sound for removal
    if (this.muted() || !this.audioCtx) return;
    if (this.audioCtx.state === 'suspended') this.audioCtx.resume();

    const t = this.audioCtx.currentTime;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.frequency.setValueAtTime(100, t);
    osc.frequency.exponentialRampToValueAtTime(400, t + 0.1);
    
    gain.gain.setValueAtTime(0.1, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);

    osc.connect(gain);
    gain.connect(this.audioCtx.destination);

    osc.start(t);
    osc.stop(t + 0.1);
  }

  playWin() {
    // A victory arpeggio
    const now = 0;
    this.playTone(523.25, 'sine', 0.2, now);       // C5
    this.playTone(659.25, 'sine', 0.2, now + 0.1); // E5
    this.playTone(783.99, 'sine', 0.2, now + 0.2); // G5
    this.playTone(1046.50, 'sine', 0.6, now + 0.3); // C6
  }

  playLose() {
    // A sad descending tritone
    const now = 0;
    this.playTone(440, 'sawtooth', 0.4, now);       // A4
    this.playTone(311.13, 'sawtooth', 0.6, now + 0.4); // Eb4
  }

  playClick() {
    // Subtle UI click
    this.playTone(800, 'triangle', 0.05);
  }
}
