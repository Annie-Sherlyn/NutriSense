import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
// @ts-expect-error type missing
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment';
import { buildThaliGroup } from './buildThali';
import { buildRingsGroup } from './buildRings';
import { buildLeafMarkGroup } from './buildLeafMark';
import { buildKolamMesh, drawKolam } from './buildKolam';
import { PRESET_BREAKFAST, FoodItem } from './thaliPresets';
import { SPLASH_TIMELINE } from './splash.timeline';
import { mapTime, easeOutBack, easeOutSpring, easeInOutCubic, easeOutExpo, lerp } from '@/utils/motion';

interface ThaliScene3DProps {
  onTapFood: (food: FoodItem) => void;
  onTapRing: (food: FoodItem) => void;
  onAllTapped: () => void;
  onScanSweep: () => void;
  isReducedMotion: boolean;
  isWelcomeScreen?: boolean;
  freezeTimeMs?: number | null;
}

export const ThaliScene3D: React.FC<ThaliScene3DProps> = ({ 
  onTapFood, onTapRing, onAllTapped, onScanSweep, isReducedMotion, isWelcomeScreen, freezeTimeMs
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const currentMount = mountRef.current;
    if (!currentMount) return;
    
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    // Setup Renderer
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.8; // Lowered to prevent blowout
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    currentMount.appendChild(renderer.domElement);
    
    const scene = new THREE.Scene();
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environmentIntensity = 0.05; // Drastically lower to prevent blowout of the clay-toy look
    
    // Camera
    // Adaptive framing based on width - make it much closer and lower angle for more impact
    const aspect = width / height;
    const distance = width < 768 ? 9 : 7;
    const cameraHeight = width < 768 ? 7 : 5;
    const camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 100);
    camera.position.set(0, cameraHeight, distance);
    camera.lookAt(0, -0.5, 0); // Look slightly lower so the plate is centered

    // Lights
    // Warm key light from the upper-left
    const keyLight = new THREE.DirectionalLight(0xfffaee, 1.0);
    keyLight.position.set(-4, 12, 6);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024; // 1024 as per prompt
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.bias = -0.001;
    scene.add(keyLight);

    // Cool soft fill light from the right
    const fillLight = new THREE.DirectionalLight(0xebe0ff, 0.4);
    fillLight.position.set(6, 8, 4);
    scene.add(fillLight);
    
    // Warm rim light from the back to separate from background
    const rimLight = new THREE.PointLight(0xffd5b8, 0.8, 20); // Reduced from 1.5
    rimLight.position.set(0, 4, -8);
    scene.add(rimLight);
    
    const ambientLight = new THREE.AmbientLight(0xddeeff, 0.3); // Reduced from 0.6
    scene.add(ambientLight);

    // Objects
    const thaliMasterGroup = new THREE.Group();
    thaliMasterGroup.scale.set(1.4, 1.4, 1.4); // Scale up for better visibility
    scene.add(thaliMasterGroup);

    const thaliGroup = buildThaliGroup(PRESET_BREAKFAST);
    thaliMasterGroup.add(thaliGroup);

    const ringsGroup = buildRingsGroup(PRESET_BREAKFAST);
    thaliMasterGroup.add(ringsGroup);

    const leafMark = buildLeafMarkGroup();
    leafMark.scale.setScalar(0.001); // starts hidden
    thaliMasterGroup.add(leafMark);
    
    // Kolam (underneath the plate)
    const kolamMesh = buildKolamMesh();
    thaliMasterGroup.add(kolamMesh);

    // Floor (transparent to catch shadows)
    const floorMat = new THREE.ShadowMaterial({ opacity: 0.4 });
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // Scan Beam (mint-white)
    const scanBeamGeo = new THREE.PlaneGeometry(10, 0.2);
    const scanBeamMat = new THREE.MeshBasicMaterial({ color: 0xdbfcf3, transparent: true, opacity: 0 });
    const scanBeam = new THREE.Mesh(scanBeamGeo, scanBeamMat);
    scanBeam.rotation.x = -Math.PI / 2;
    scanBeam.position.y = 0.01;
    scene.add(scanBeam);

    // Animation state
    let frameId: number;
    let clockStarted = false;
    let startTime = 0;
    
    let thaliYawVelocity = 0;
    
    const tappedFoods = new Set<string>();

    const animate = (time: number) => {
      frameId = requestAnimationFrame(animate);
      
      if (!clockStarted) {
        startTime = time;
        clockStarted = true;
      }
      
      const t = freezeTimeMs !== undefined && freezeTimeMs !== null ? freezeTimeMs : (time - startTime);
      const b = SPLASH_TIMELINE.BEATS;

      if (isReducedMotion) {
        // Just render final state
        thaliMasterGroup.position.y = 0;
        camera.position.set(0, 7, distance);
        camera.lookAt(0, 0, 0);
        ringsGroup.children.forEach(ring => {
          const arc = ring.children.find(c => c.name.startsWith('arc_')) as THREE.Mesh;
          const bead = ring.children.find(c => c.name.startsWith('bead_')) as THREE.Mesh;
          if (arc && bead) {
            arc.geometry.dispose();
            arc.geometry = new THREE.TorusGeometry(arc.userData.radius, 0.02, 8, 64, arc.userData.maxArc);
            const angle = arc.userData.maxArc;
            bead.position.set(arc.userData.radius * Math.cos(angle), arc.userData.radius * Math.sin(angle), 0);
          }
        });
        leafMark.scale.setScalar(1);
        drawKolam(1);
      } else {
        // MORNING (0 - 700ms)
        if (t <= b.MORNING_END) {
          const p = mapTime(t, b.MORNING_START, b.MORNING_END);
          thaliMasterGroup.position.y = lerp(5, 0, easeOutSpring(p, 1.2));
          thaliGroup.rotation.y = lerp(Math.PI * 3, 0, easeOutExpo(p));
          camera.position.y = lerp(12, 7, easeOutSpring(p, 1.1));
          drawKolam(easeInOutCubic(p));
        } else if (t > b.MORNING_END && t < b.MORNING_END + 30) {
          thaliMasterGroup.position.y = 0;
          thaliGroup.rotation.y = 0;
          camera.position.y = 7;
          drawKolam(1);
        }

        // SERVED (700 - 1400ms)
        if (t > b.SERVED_START && t <= b.SERVED_END) {
          const pServed = mapTime(t, b.SERVED_START, b.SERVED_END);
          thaliGroup.children.forEach((foodGroup, index) => {
            if (foodGroup.userData.isFood) {
              const staggerStart = (index / thaliGroup.children.length) * 0.6;
              const pItem = mapTime(pServed, staggerStart, staggerStart + 0.4);
              const scaleEase = easeOutSpring(pItem, 1.05);
              // Small scale-bounce (0 -> 1.1 -> 1) handled inherently by easeOutSpring 1.05
              foodGroup.scale.setScalar(Math.max(0.001, scaleEase));
            }
          });
        } else if (t > b.SERVED_END) {
          thaliGroup.children.forEach((foodGroup) => {
            if (foodGroup.userData.isFood && foodGroup.scale.x !== 1) {
              foodGroup.scale.setScalar(1);
            }
          });
        } else if (t <= b.SERVED_START) {
          thaliGroup.children.forEach((foodGroup) => {
            if (foodGroup.userData.isFood) {
              foodGroup.scale.setScalar(0.001);
            }
          });
        }

        // UNDERSTAND (1400 - 2800ms)
        if (t > b.SCAN_START && t <= b.SCAN_END) {
          const pScan = mapTime(t, b.SCAN_START, b.SCAN_END);
          
          // Thali yaws smoothly (-15 deg to 15 deg)
          const yaw = Math.sin(pScan * Math.PI) * (15 * Math.PI / 180);
          thaliGroup.rotation.y = yaw;
          ringsGroup.rotation.y = yaw * -0.2;
          
          // Scan beam translates
          const beamZ = lerp(-3, 3, pScan);
          scanBeam.position.z = beamZ;
          scanBeam.material.opacity = Math.sin(pScan * Math.PI) * 0.8;
          
          // Hover interactions conceptually (item jumps when beam passes)
          thaliGroup.children.forEach((foodGroup) => {
            if (foodGroup.userData.isFood) {
              const dist = Math.abs(foodGroup.position.z - beamZ);
              if (dist < 0.2) {
                // Quick jump
                foodGroup.position.y = lerp(foodGroup.position.y, 0.3, 0.4);
              } else {
                foodGroup.position.y = lerp(foodGroup.position.y, 0.1, 0.2);
              }
            }
          });
          
          if (pScan >= 0.49 && pScan <= 0.51) {
             onScanSweep(); // Fire once around middle
          }
        } else {
          scanBeam.material.opacity = 0;
          if (t > b.SCAN_END) {
            thaliGroup.children.forEach((foodGroup) => {
               if (foodGroup.userData.isFood) foodGroup.position.y = lerp(foodGroup.position.y, 0.1, 0.1);
            });
            thaliGroup.rotation.y *= 0.9;
            ringsGroup.rotation.y = thaliGroup.rotation.y * -0.2;
          }
        }

        // Apply interactive inertia rotation (added on top of programmatic yaw)
        thaliGroup.rotation.y += thaliYawVelocity;
        thaliYawVelocity *= 0.94; // friction
        
        // BALANCE (2800 - 3600ms)
        if (t > b.BALANCE_START) {
          const pBalance = mapTime(t, b.BALANCE_START, b.BALANCE_END);
          const ease = easeInOutCubic(pBalance);
          ringsGroup.children.forEach(ring => {
            const arc = ring.children.find(c => c.name.startsWith('arc_')) as THREE.Mesh;
            const bead = ring.children.find(c => c.name.startsWith('bead_')) as THREE.Mesh;
            if (arc && bead) {
              const currentArc = Math.max(0.01, arc.userData.maxArc * ease);
              arc.geometry.dispose();
              arc.geometry = new THREE.TorusGeometry(arc.userData.radius, 0.02, 8, 64, currentArc);
              bead.position.set(arc.userData.radius * Math.cos(currentArc), arc.userData.radius * Math.sin(currentArc), 0);
            }
          });
          leafMark.scale.setScalar(easeOutBack(ease));
        }

        // REVEAL & PROMISE (3600 - 5000ms)
        if (t > b.REVEAL_START) {
          // Idle floating
          const timeSec = time * 0.001;
          leafMark.position.y = 1.1 + Math.sin(timeSec * 2) * 0.05;
          const mote = leafMark.children.find(c => c.name === 'mote');
          if (mote) {
            mote.position.set(0.5 * Math.cos(timeSec * 3), 1.1, 0.5 * Math.sin(timeSec * 3));
          }
        }

        if (isWelcomeScreen) {
           camera.position.y = lerp(camera.position.y, cameraHeight + 1.0, 0.05);
           camera.position.z = lerp(camera.position.z, distance + 1.0, 0.05);
           camera.lookAt(0, -0.4, 0); 
           thaliMasterGroup.scale.lerp(new THREE.Vector3(0.9, 0.9, 0.9), 0.05);
           thaliMasterGroup.position.lerp(new THREE.Vector3(0, 0.6, 0), 0.05);
        }
      }

      renderer.render(scene, camera);
    };
    
    frameId = requestAnimationFrame(animate);

    // Interactivity: Drag & Tap
    let isDragging = false;
    let previousTouchX = 0;
    let pressStartTime = 0;
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handlePointerDown = (e: PointerEvent) => {
      isDragging = true;
      previousTouchX = e.clientX;
      pressStartTime = performance.now();
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (isDragging) {
        const deltaX = e.clientX - previousTouchX;
        thaliYawVelocity += deltaX * 0.001;
        previousTouchX = e.clientX;
      }
      
      // Parallax
      const x = (e.clientX / width) * 2 - 1;
      camera.position.x = lerp(camera.position.x, x * 2, 0.05);
      camera.lookAt(0, 0, 0);
    };

    const handlePointerUp = (e: PointerEvent) => {
      isDragging = false;
      const duration = performance.now() - pressStartTime;
      
      if (duration >= 400) {
        // Long press -> Scan sweep
        onScanSweep();
        return;
      }

      if (duration < 300) {
        // Tap
        mouse.x = (e.clientX / width) * 2 - 1;
        mouse.y = -(e.clientY / height) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);
        
        const intersects = raycaster.intersectObjects(thaliMasterGroup.children, true);
        if (intersects.length > 0) {
          const hit = intersects[0].object;
          
          if (hit.parent?.userData.isFood) {
            const foodId = hit.parent.userData.id;
            const item = PRESET_BREAKFAST.find(i => i.id === foodId);
            if (item) {
              hit.parent.position.y += 0.2; // Quick pop visual
              setTimeout(() => hit.parent!.position.y -= 0.2, 150);
              onTapFood(item);
              tappedFoods.add(foodId);
              if (tappedFoods.size === 6) {
                onAllTapped();
              }
            }
          }
          
          if (hit.userData.isRingBead) {
            const item = PRESET_BREAKFAST.find(i => i.id === hit.userData.id);
            if (item) onTapRing(item);
          }
        }
      }
    };

    const canvas = renderer.domElement;
    canvas.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    // Resize
    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', onResize);
      canvas.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      
      scene.traverse(object => {
        if (object instanceof THREE.Mesh) {
          if (object.geometry) object.geometry.dispose();
          if (object.material) {
            if (Array.isArray(object.material)) object.material.forEach(m => m.dispose());
            else object.material.dispose();
          }
        }
      });
      pmremGenerator.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      if (currentMount) currentMount.removeChild(renderer.domElement);
    };
  }, [onTapFood, onTapRing, onAllTapped, onScanSweep, isReducedMotion, isWelcomeScreen, freezeTimeMs]);

  return <div ref={mountRef} className="absolute inset-0 z-0" style={{ touchAction: 'none' }} />;
};
