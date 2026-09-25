import * as THREE from 'three';

const KOLAM_SIZE = 1024;
const KOLAM_CANVAS = document.createElement('canvas');
KOLAM_CANVAS.width = KOLAM_SIZE;
KOLAM_CANVAS.height = KOLAM_SIZE;
const KOLAM_CTX = KOLAM_CANVAS.getContext('2d')!;
const KOLAM_TEXTURE = new THREE.CanvasTexture(KOLAM_CANVAS);
KOLAM_TEXTURE.anisotropy = 16;

export const drawKolam = (progress: number = 1): void => {
  const size = KOLAM_SIZE;
  const ctx = KOLAM_CTX;
  const cx = size / 2;
  const cy = size / 2;
  
  // Clear transparent
  ctx.clearRect(0, 0, size, size);
  
  const maxRadius = size * 0.45;
  const folds = 12;
  
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  
  // Main Petals (Rose curve)
  ctx.beginPath();
  ctx.strokeStyle = `rgba(255, 255, 255, 0.85)`;
  ctx.lineWidth = 4;
  
  const steps = 360;
  const drawnSteps = Math.floor(steps * progress);
  
  for (let i = 0; i <= drawnSteps; i++) {
    const theta = (i * Math.PI * 2) / steps;
    const k = 6;
    const r = maxRadius * 0.8 * Math.cos(k * theta);
    
    const x = cx + r * Math.cos(theta);
    const y = cy + r * Math.sin(theta);
    
    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
  ctx.stroke();
  
  // Inner continuous circles
  ctx.beginPath();
  ctx.lineWidth = 3;
  ctx.arc(cx, cy, maxRadius * 0.3, 0, Math.PI * 2 * progress);
  ctx.stroke();

  ctx.beginPath();
  ctx.lineWidth = 2;
  ctx.arc(cx, cy, maxRadius * 0.35, 0, Math.PI * 2 * progress);
  ctx.stroke();
  
  // Ring of pulli (dots)
  const dotCount = folds * 2;
  const dotProgressLimit = Math.floor(dotCount * progress);
  
  for (let i = 0; i < dotProgressLimit; i++) {
    const angle = (i * Math.PI * 2) / dotCount;
    const isAccent = i % 4 === 0;
    ctx.fillStyle = isAccent ? '#F2B33D' : 'rgba(255, 255, 255, 0.85)';
    
    const x = cx + maxRadius * 0.9 * Math.cos(angle);
    const y = cy + maxRadius * 0.9 * Math.sin(angle);
    
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.fill();
  }
  
  KOLAM_TEXTURE.needsUpdate = true;
};

export const buildKolamMesh = (): THREE.Mesh => {
  const geo = new THREE.PlaneGeometry(7, 7);
  
  // Draw initial state (e.g. 0 progress, or 1 if reduced motion)
  drawKolam(0); 

  const mat = new THREE.MeshBasicMaterial({
    map: KOLAM_TEXTURE,
    transparent: true,
    opacity: 0.9,
    depthWrite: false,
  });
  
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = 0.005; // Slightly above floor
  
  return mesh;
};
