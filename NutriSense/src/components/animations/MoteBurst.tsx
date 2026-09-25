import confetti from 'canvas-confetti';

export const triggerMoteBurst = (origin = { x: 0.5, y: 0.6 }) => {
  // Nutrient-themed colors
  const colors = ['#2E9E5B', '#E2582E', '#2BB3CE', '#7B5CD6', '#F2B33D', '#2F9E8F'];

  confetti({
    particleCount: 45,
    spread: 70,
    origin,
    colors,
    ticks: 160,
    gravity: 0.85,
    scalar: 1.1,
    shapes: ['circle'],
    disableForReducedMotion: true,
  });
};
