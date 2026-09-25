import * as THREE from 'three';
import { FoodItem } from './thaliPresets';

export function buildRingsGroup(items: FoodItem[]): THREE.Group {
  const group = new THREE.Group();
  
  items.forEach((item, index) => {
    // Radii from 1.9 to 2.5
    const radius = 1.9 + index * 0.12;
    const ringGroup = new THREE.Group();
    
    // Faint full-circle track
    const trackGeo = new THREE.TorusGeometry(radius, 0.015, 8, 64);
    const trackMat = new THREE.MeshBasicMaterial({ 
      color: 0xcccccc, 
      transparent: true, 
      opacity: 0.2 
    });
    const trackMesh = new THREE.Mesh(trackGeo, trackMat);
    trackMesh.rotation.x = Math.PI / 2;
    ringGroup.add(trackMesh);

    // Colored fill arc (starts empty, will be animated by manipulating geometry or shaders, 
    // but for procedural simplicity, we use TorusGeometry with changing arc in animate loop).
    // Here we just build a container and userData.
    const arcMesh = new THREE.Mesh(
      new THREE.TorusGeometry(radius, 0.02, 8, 64, 0.01), // Start tiny
      new THREE.MeshBasicMaterial({ color: item.color })
    );
    arcMesh.rotation.x = Math.PI / 2;
    arcMesh.userData = { maxArc: (item.demoFill / 100) * Math.PI * 2, radius };
    arcMesh.name = `arc_${item.id}`;
    ringGroup.add(arcMesh);

    // Glowing bead (tap target)
    const beadGeo = new THREE.SphereGeometry(0.06, 16, 16);
    const beadMat = new THREE.MeshBasicMaterial({ color: item.color });
    const beadMesh = new THREE.Mesh(beadGeo, beadMat);
    // Position will be updated dynamically based on arc fill
    beadMesh.position.set(radius, 0, 0); 
    beadMesh.userData = { isRingBead: true, id: item.id, ringIndex: index };
    beadMesh.name = `bead_${item.id}`;
    
    // Invisible hit box
    const hitGeo = new THREE.SphereGeometry(0.2, 8, 8);
    const hitMat = new THREE.MeshBasicMaterial({ visible: false });
    const hitMesh = new THREE.Mesh(hitGeo, hitMat);
    beadMesh.add(hitMesh);

    ringGroup.add(beadMesh);
    group.add(ringGroup);
  });

  return group;
}
