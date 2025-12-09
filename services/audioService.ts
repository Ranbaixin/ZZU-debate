import { SoundType } from '../types';

class AudioService {
  private context: AudioContext | null = null;

  private getContext(): AudioContext {
    if (!this.context) {
      this.context = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return this.context;
  }

  public playSound(type: SoundType) {
    const ctx = this.getContext();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;

    switch (type) {
      case SoundType.WARN_30:
        // A distinct "ding" - slightly prolonged as requested
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now); // A5
        gain.gain.setValueAtTime(0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.8);
        osc.start(now);
        osc.stop(now + 0.8);
        break;

      case SoundType.WARN_5:
        // Continuous short beeps "Di Di Di Di" for 5 seconds
        // Schedule 5 beeps, one per second (countdown style)
        for (let i = 0; i < 5; i++) {
            const beepTime = now + i;
            const beepOsc = ctx.createOscillator();
            const beepGain = ctx.createGain();
            
            beepOsc.connect(beepGain);
            beepGain.connect(ctx.destination);

            beepOsc.type = 'sine';
            beepOsc.frequency.setValueAtTime(1000, beepTime); // High pitch check
            
            // Sharp envelope for "Di"
            beepGain.gain.setValueAtTime(0, beepTime);
            beepGain.gain.linearRampToValueAtTime(0.3, beepTime + 0.05);
            beepGain.gain.exponentialRampToValueAtTime(0.01, beepTime + 0.2);
            
            beepOsc.start(beepTime);
            beepOsc.stop(beepTime + 0.25);
        }
        break;

      case SoundType.END:
        // "Ding-Dong" Chime
        // 1. Ding (Higher Pitch)
        const dingOsc = ctx.createOscillator();
        const dingGain = ctx.createGain();
        dingOsc.connect(dingGain);
        dingGain.connect(ctx.destination);
        
        dingOsc.type = 'sine';
        dingOsc.frequency.setValueAtTime(784, now); // G5
        dingGain.gain.setValueAtTime(0, now);
        dingGain.gain.linearRampToValueAtTime(0.6, now + 0.05);
        dingGain.gain.exponentialRampToValueAtTime(0.01, now + 1.2);
        
        dingOsc.start(now);
        dingOsc.stop(now + 1.5);

        // 2. Dong (Lower Pitch) - starts after 0.6s
        const dongOsc = ctx.createOscillator();
        const dongGain = ctx.createGain();
        dongOsc.connect(dongGain);
        dongGain.connect(ctx.destination);
        
        dongOsc.type = 'sine';
        dongOsc.frequency.setValueAtTime(587, now + 0.6); // D5
        dongGain.gain.setValueAtTime(0, now + 0.6);
        dongGain.gain.linearRampToValueAtTime(0.5, now + 0.65);
        dongGain.gain.exponentialRampToValueAtTime(0.01, now + 2.5);
        
        dongOsc.start(now + 0.6);
        dongOsc.stop(now + 3.0);
        break;
    }
  }
}

export const audioService = new AudioService();