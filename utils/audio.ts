let audioContext: AudioContext | null = null;

const getAudioContext = () => {
  if (typeof window !== 'undefined' && (window.AudioContext || (window as any).webkitAudioContext)) {
    if (!audioContext) {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        audioContext = new AudioCtx();
      } catch (e) {
        console.error("Web Audio API is not supported in this browser.", e);
        return null;
      }
    }
  }
  return audioContext;
};

export const playSound = (type: OscillatorType, frequency: number, duration: number, volume = 0.1) => {
  const context = getAudioContext();
  if (!context) return;
  
  if (context.state === 'suspended') {
    context.resume();
  }

  const oscillator = context.createOscillator();
  const gainNode = context.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, context.currentTime);
  
  gainNode.gain.setValueAtTime(volume, context.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + duration);

  oscillator.connect(gainNode);
  gainNode.connect(context.destination);

  oscillator.start(context.currentTime);
  oscillator.stop(context.currentTime + duration);
};

export const playFlipSound = () => {
  playSound('triangle', 440, 0.1, 0.05);
};

export const playMatchSound = () => {
  const context = getAudioContext();
  if (!context) return;
  playSound('sine', 660, 0.1);
  setTimeout(() => playSound('sine', 880, 0.15), 100);
};

export const playNoMatchSound = () => {
  playSound('square', 220, 0.2);
};

export const playWinSound = () => {
    const context = getAudioContext();
    if (!context) return;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((note, index) => {
        setTimeout(() => playSound('sine', note, 0.15), index * 120);
    });
};