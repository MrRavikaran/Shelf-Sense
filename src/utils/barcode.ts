/**
 * Barcode utilities: Web Audio feedback, haptics, and HTML5 Canvas barcode rendering
 */

// Web Audio synthesizer for scanner sounds
let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function playScanBeep() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1600, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1800, ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.09);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  } catch {
    // Audio not allowed or failed
  }
}

export function playSuccessChime() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Two-tone chord
    [587.33, 880].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + (i * 0.06));

      gain.gain.setValueAtTime(0.18, now + (i * 0.06));
      gain.gain.exponentialRampToValueAtTime(0.001, now + (i * 0.06) + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + (i * 0.06));
      osc.stop(now + (i * 0.06) + 0.26);
    });
  } catch {
    // Ignore audio errors
  }
}

export function playErrorBuzz() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(150, ctx.currentTime + 0.18);

    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.18);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.2);
  } catch {
    // Ignore
  }
}

export function triggerHaptic(type: 'light' | 'medium' | 'error' = 'light') {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      if (type === 'light') {
        navigator.vibrate(35);
      } else if (type === 'medium') {
        navigator.vibrate([45, 30, 45]);
      } else if (type === 'error') {
        navigator.vibrate([70, 40, 70, 40, 70]);
      }
    } catch {
      // Haptics unavailable
    }
  }
}

/**
 * Generate a standard barcode representation onto a 2D Canvas.
 * Encodes text into alternating bar patterns.
 */
export function drawBarcodeToCanvas(
  canvas: HTMLCanvasElement,
  code: string,
  options: {
    productName?: string;
    priceINR?: number;
    width?: number;
    height?: number;
  } = {}
) {
  const width = options.width || 320;
  const height = options.height || 140;

  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  // Border
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;
  ctx.strokeRect(0, 0, width, height);

  // Top Title (Product Name)
  if (options.productName) {
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 13px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    const truncated = options.productName.length > 28 ? options.productName.slice(0, 26) + '...' : options.productName;
    ctx.fillText(truncated, width / 2, 20);
  }

  // Pseudo-Code 128 bit pattern generator from character ASCII codes
  // Generates crisp, realistic barcode bars and guard patterns
  const barTop = options.productName ? 28 : 16;
  const barHeight = height - barTop - 42;
  const paddingX = 24;
  const availableWidth = width - (paddingX * 2);

  // Generate bit string from code
  const bits: number[] = [1, 0, 1, 0, 1, 1, 0]; // Start guard
  for (let i = 0; i < code.length; i++) {
    const charCode = code.charCodeAt(i);
    // Simple 7-bit alternating hash mapping to bar pattern
    const seed = (charCode * 17 + i * 31) % 256;
    for (let b = 0; b < 6; b++) {
      bits.push((seed >> b) & 1);
    }
    bits.push((i % 2 === 0) ? 1 : 0);
  }
  bits.push(1, 1, 0, 1, 0, 1, 1); // Stop guard

  const unitWidth = availableWidth / bits.length;

  ctx.fillStyle = '#000000';
  for (let i = 0; i < bits.length; i++) {
    if (bits[i] === 1) {
      ctx.fillRect(
        Math.floor(paddingX + (i * unitWidth)),
        barTop,
        Math.ceil(unitWidth),
        barHeight
      );
    }
  }

  // SKU / Barcode text below bars
  ctx.fillStyle = '#334155';
  ctx.font = '600 12px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(code, width / 2, barTop + barHeight + 15);

  // Price in INR at the bottom
  if (options.priceINR !== undefined) {
    ctx.fillStyle = '#047857';
    ctx.font = 'bold 14px "Noto Sans", "Inter", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`MRP: ₹ ${options.priceINR.toLocaleString('en-IN')} (incl. all taxes)`, width / 2, height - 8);
  }
}
