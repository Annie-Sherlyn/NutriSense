import * as THREE from 'three';

export function buildLeafMarkGroup(): THREE.Group {
  const group = new THREE.Group();

  // Draw a leaf shape
  const shape = new THREE.Shape();
  shape.moveTo(0, 0.4); // top tip
  shape.quadraticCurveTo(0.3, 0.1, 0, -0.4); // right curve to base
  shape.quadraticCurveTo(-0.3, 0.1, 0, 0.4); // left curve to tip

  const extrudeSettings = {
    steps: 1,
    depth: 0.05,
    bevelEnabled: true,
    bevelThickness: 0.02,
    bevelSize: 0.02,
    bevelSegments: 3,
  };

  const leafGeo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  // Leaf gradient material approximation
  const leafMat = new THREE.MeshStandardMaterial({ 
    color: 0x2E9E5B, 
    roughness: 0.4,
    metalness: 0.1
  });
  
  const leafMesh = new THREE.Mesh(leafGeo, leafMat);
  leafMesh.position.y = 1.1; // float above plate
  leafMesh.castShadow = true;
  group.add(leafMesh);

  // Orbit ring
  const orbitGeo = new THREE.TorusGeometry(0.5, 0.005, 8, 64);
  const orbitMat = new THREE.MeshBasicMaterial({ color: 0x2F9E8F, transparent: true, opacity: 0.5 });
  const orbitMesh = new THREE.Mesh(orbitGeo, orbitMat);
  orbitMesh.position.y = 1.1;
  orbitMesh.rotation.x = Math.PI / 2;
  group.add(orbitMesh);

  // Traveling mote
  const moteGeo = new THREE.SphereGeometry(0.02, 8, 8);
  const moteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const moteMesh = new THREE.Mesh(moteGeo, moteMat);
  moteMesh.position.set(0.5, 1.1, 0);
  moteMesh.name = 'mote';
  group.add(moteMesh);

  return group;
}
