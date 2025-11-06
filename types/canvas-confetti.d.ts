declare module 'canvas-confetti' {
  interface ConfettiOptions {
    particleCount?: number;
    spread?: number;
    origin?: { x?: number; y?: number };
    colors?: string[];
    shapes?: ('square' | 'circle')[];
    ticks?: number;
    gravity?: number;
    drift?: number;
    startVelocity?: number;
    scalar?: number;
    zIndex?: number;
  }

  function confetti(options?: ConfettiOptions): Promise<null>;
  export = confetti;
}
