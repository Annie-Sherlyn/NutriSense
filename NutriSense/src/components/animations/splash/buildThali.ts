import * as THREE from 'three';
import { FoodItem } from './thaliPresets';

const STEEL_MATERIAL = new THREE.MeshStandardMaterial({
  color: 0xD9DEE3,
  metalness: 0.9,
  roughness: 0.28,
});

export function buildThaliGroup(items: FoodItem[]): THREE.Group {
  const group = new THREE.Group();

  // 1. Thali Plate (Radius 1.6)
  const platePoints = [];
  for (let i = 0; i <= 20; i++) {
    const t = i / 20;
    const r = t * 1.6;
    let y = 0;
    if (t > 0.9) {
      y = (t - 0.9) * 2; // Rim rises
    } else {
      y = t * 0.05; // Gentle slope in center
    }
    platePoints.push(new THREE.Vector2(r, y));
  }
  const plateGeo = new THREE.LatheGeometry(platePoints, 64);
  const plateMesh = new THREE.Mesh(plateGeo, STEEL_MATERIAL);
  plateMesh.castShadow = true;
  plateMesh.receiveShadow = true;
  group.add(plateMesh);

  // 2. Food Items
  items.forEach((item) => {
    const angle = item.angleDeg * (Math.PI / 180);
    const x = item.radius * Math.cos(angle);
    const z = item.radius * Math.sin(angle);
    
    const foodGroup = new THREE.Group();
    foodGroup.position.set(x, 0.1, z);
    foodGroup.userData = { isFood: true, id: item.id }; // For raycasting

    // Build Katoris for liquids
    if (['sambar', 'curd', 'palak'].includes(item.geometryType)) {
      const katoriPoints = [];
      for (let i = 0; i <= 10; i++) {
        const t = i / 10;
        const r = t * 0.35;
        const y = t === 0 ? 0 : Math.pow(t, 2) * 0.25;
        katoriPoints.push(new THREE.Vector2(r, y));
      }
      const katoriGeo = new THREE.LatheGeometry(katoriPoints, 32);
      const katoriMesh = new THREE.Mesh(katoriGeo, STEEL_MATERIAL);
      katoriMesh.castShadow = true;
      foodGroup.add(katoriMesh);
    }

    // Build specific food geometry
    switch (item.geometryType) {
      case 'idli': {
        // Idli x2: 215-235°
        const idliMat = new THREE.MeshStandardMaterial({ color: 0xFFF7EA, roughness: 0.9 });
        const idliGeo = new THREE.SphereGeometry(0.25, 32, 16);
        // Dimple
        const pos = idliGeo.attributes.position;
        for (let i = 0; i < pos.count; i++) {
          if (pos.getY(i) > 0.2 && Math.abs(pos.getX(i)) < 0.1 && Math.abs(pos.getZ(i)) < 0.1) {
             pos.setY(i, pos.getY(i) - 0.03);
          }
        }
        idliGeo.computeVertexNormals();

        const idli1 = new THREE.Mesh(idliGeo, idliMat);
        idli1.scale.y = 0.55;
        idli1.position.set(-0.15, 0.12, 0.1);
        idli1.castShadow = true;

        const idli2 = new THREE.Mesh(idliGeo, idliMat);
        idli2.scale.y = 0.55;
        idli2.position.set(0.15, 0.12, -0.1);
        idli2.castShadow = true;

        foodGroup.add(idli1, idli2);
        break;
      }
      case 'vada': {
        const vadaGeo = new THREE.TorusGeometry(0.18, 0.08, 16, 32);
        const vadaMat = new THREE.MeshStandardMaterial({ color: 0xD9923B, roughness: 0.7 });
        const vadaMesh = new THREE.Mesh(vadaGeo, vadaMat);
        vadaMesh.rotation.x = Math.PI / 2;
        vadaMesh.position.y = 0.08;
        vadaMesh.scale.z = 0.7; // flatten
        vadaMesh.castShadow = true;
        foodGroup.add(vadaMesh);
        break;
      }
      case 'egg': {
        const eggGeo = new THREE.SphereGeometry(0.18, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2);
        const eggMat = new THREE.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 0.5 });
        const eggMesh = new THREE.Mesh(eggGeo, eggMat);
        eggMesh.position.y = 0;
        
        const yolkGeo = new THREE.SphereGeometry(0.08, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
        const yolkMat = new THREE.MeshStandardMaterial({ color: 0xF5B83D, roughness: 0.6 });
        const yolkMesh = new THREE.Mesh(yolkGeo, yolkMat);
        yolkMesh.position.y = 0.01;
        
        foodGroup.add(eggMesh, yolkMesh);
        break;
      }
      case 'sambar': {
        const liqGeo = new THREE.CylinderGeometry(0.33, 0.33, 0.01, 32);
        // "orange-red liquid #E8873A (clearcoat)" - standard material doesn't have clearcoat, physical does.
        const liqMat = new THREE.MeshPhysicalMaterial({ color: 0xE8873A, roughness: 0.1, clearcoat: 1.0 });
        const liqMesh = new THREE.Mesh(liqGeo, liqMat);
        liqMesh.position.y = 0.2;
        
        // Veggie spheres
        const vegMat = new THREE.MeshStandardMaterial({ color: 0xA34A12, roughness: 0.8 });
        const vegGeo = new THREE.SphereGeometry(0.04, 8, 8);
        for(let i=0; i<4; i++) {
           const veg = new THREE.Mesh(vegGeo, vegMat);
           veg.position.set((Math.random() - 0.5) * 0.4, 0.205, (Math.random() - 0.5) * 0.4);
           foodGroup.add(veg);
        }
        
        // Steam sprites (we'll generate these in animation loop if needed, for now just static placeholders)
        for (let i = 0; i < 6; i++) {
           const steamGeo = new THREE.PlaneGeometry(0.1, 0.1);
           const steamMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.2, depthWrite: false });
           const steam = new THREE.Mesh(steamGeo, steamMat);
           steam.name = `steam_${i}`;
           steam.position.set((Math.random() - 0.5) * 0.3, 0.3 + Math.random() * 0.2, (Math.random() - 0.5) * 0.3);
           foodGroup.add(steam);
        }

        foodGroup.add(liqMesh);
        break;
      }
      case 'curd': {
        const curdGeo = new THREE.SphereGeometry(0.32, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
        const curdMat = new THREE.MeshStandardMaterial({ color: 0xFFFDF7, roughness: 0.8 });
        const curdMesh = new THREE.Mesh(curdGeo, curdMat);
        curdMesh.position.y = 0.1;
        curdMesh.scale.y = 0.4;
        foodGroup.add(curdMesh);
        break;
      }
      case 'palak': {
        const palakGeo = new THREE.SphereGeometry(0.32, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
        const pos = palakGeo.attributes.position;
        for (let i = 0; i < pos.count; i++) {
          const y = pos.getY(i);
          if (y > 0) {
            const noise = Math.random() * 0.03;
            pos.setY(i, y + noise);
          }
        }
        palakGeo.computeVertexNormals();
        const palakMat = new THREE.MeshStandardMaterial({ color: 0x4E9A55, roughness: 0.7 });
        const palakMesh = new THREE.Mesh(palakGeo, palakMat);
        palakMesh.position.y = 0.1;
        palakMesh.scale.y = 0.5;
        foodGroup.add(palakMesh);
        break;
      }
    }
    
    // Hidden larger hit mesh for generous tap area (>=44px)
    const hitGeo = new THREE.CylinderGeometry(0.45, 0.45, 0.6, 16);
    const hitMat = new THREE.MeshBasicMaterial({ visible: false });
    const hitMesh = new THREE.Mesh(hitGeo, hitMat);
    hitMesh.position.y = 0.2;
    foodGroup.add(hitMesh);

    group.add(foodGroup);
  });

  return group;
}
