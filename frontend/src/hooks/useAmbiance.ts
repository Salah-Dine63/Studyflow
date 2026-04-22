import { useState, useRef, useCallback } from 'react';

export type AmbianceType = 'off' | 'rain' | 'whitenoise' | 'ocean' | 'focus';

interface ActiveNodes {
  ctx: AudioContext;
  nodes: AudioNode[];
}

const MASTER_GAIN = 0.35;
const BUFFER_DURATION = 2; // seconds of white noise buffer

function createWhiteNoiseBuffer(ctx: AudioContext): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const frameCount = sampleRate * BUFFER_DURATION;
  const buffer = ctx.createBuffer(1, frameCount, sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < frameCount; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

function createNoiseSource(ctx: AudioContext): AudioBufferSourceNode {
  const source = ctx.createBufferSource();
  source.buffer = createWhiteNoiseBuffer(ctx);
  source.loop = true;
  return source;
}

function playWhiteNoise(ctx: AudioContext, master: GainNode): AudioNode[] {
  const source = createNoiseSource(ctx);
  source.connect(master);
  source.start();
  return [source];
}

function playRain(ctx: AudioContext, master: GainNode): AudioNode[] {
  const source = createNoiseSource(ctx);
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 500;
  source.connect(filter);
  filter.connect(master);
  source.start();
  return [source, filter];
}

function playOcean(ctx: AudioContext, master: GainNode): AudioNode[] {
  const source = createNoiseSource(ctx);
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 200;

  // LFO for wave effect on master gain
  const lfo = ctx.createOscillator();
  lfo.type = 'sine';
  lfo.frequency.value = 0.4;

  const lfoGain = ctx.createGain();
  lfoGain.gain.value = 0.3;

  lfo.connect(lfoGain);
  lfoGain.connect(master.gain);

  source.connect(filter);
  filter.connect(master);

  source.start();
  lfo.start();

  return [source, filter, lfo, lfoGain];
}

function playFocus(ctx: AudioContext, master: GainNode): AudioNode[] {
  // Binaural beat: 200 Hz left, 240 Hz right -> 40 Hz perceived beat
  const merger = ctx.createChannelMerger(2);

  const leftOsc = ctx.createOscillator();
  leftOsc.type = 'sine';
  leftOsc.frequency.value = 200;

  const rightOsc = ctx.createOscillator();
  rightOsc.type = 'sine';
  rightOsc.frequency.value = 240;

  const leftGain = ctx.createGain();
  leftGain.gain.value = 0.15;

  const rightGain = ctx.createGain();
  rightGain.gain.value = 0.15;

  leftOsc.connect(leftGain);
  rightOsc.connect(rightGain);

  // Left channel -> input 0, right channel -> input 1
  leftGain.connect(merger, 0, 0);
  rightGain.connect(merger, 0, 1);

  merger.connect(master);

  leftOsc.start();
  rightOsc.start();

  return [leftOsc, rightOsc, leftGain, rightGain, merger];
}

export function useAmbiance(): {
  active: AmbianceType;
  toggle: (type: AmbianceType) => void;
  stop: () => void;
} {
  const [active, setActive] = useState<AmbianceType>('off');
  const activeRef = useRef<ActiveNodes | null>(null);

  const stopAll = useCallback(() => {
    if (!activeRef.current) return;
    const { ctx, nodes } = activeRef.current;
    nodes.forEach((node) => {
      try {
        if (node instanceof AudioScheduledSourceNode) {
          node.stop();
        }
        node.disconnect();
      } catch {
        // ignore errors from already-stopped nodes
      }
    });
    ctx.close().catch(() => {});
    activeRef.current = null;
    setActive('off');
  }, []);

  const toggle = useCallback(
    (type: AmbianceType) => {
      // If already active with this type, stop it
      if (active === type) {
        stopAll();
        return;
      }

      // Stop any currently playing sound first
      if (activeRef.current) {
        const { ctx, nodes } = activeRef.current;
        nodes.forEach((node) => {
          try {
            if (node instanceof AudioScheduledSourceNode) {
              node.stop();
            }
            node.disconnect();
          } catch {
            // ignore
          }
        });
        ctx.close().catch(() => {});
        activeRef.current = null;
      }

      if (type === 'off') {
        setActive('off');
        return;
      }

      const ctx = new AudioContext();
      const master = ctx.createGain();
      master.gain.value = MASTER_GAIN;
      master.connect(ctx.destination);

      let nodes: AudioNode[] = [];

      switch (type) {
        case 'whitenoise':
          nodes = playWhiteNoise(ctx, master);
          break;
        case 'rain':
          nodes = playRain(ctx, master);
          break;
        case 'ocean':
          nodes = playOcean(ctx, master);
          break;
        case 'focus':
          nodes = playFocus(ctx, master);
          break;
      }

      // Include master in nodes list for cleanup
      nodes.push(master);

      activeRef.current = { ctx, nodes };
      setActive(type);
    },
    [active, stopAll]
  );

  return { active, toggle, stop: stopAll };
}
