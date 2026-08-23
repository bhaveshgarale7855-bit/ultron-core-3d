// import React, { useRef, useMemo, useState } from 'react';
// import { Canvas, useFrame } from '@react-three/fiber';
// import { OrbitControls } from '@react-three/drei';
// import { EffectComposer, Bloom } from '@react-three/postprocessing';
// import * as THREE from 'three';

// // Soft Round Glowing Texture
// function createCircleTexture() {
//   const canvas = document.createElement('canvas');
//   canvas.width = 64;
//   canvas.height = 64;
//   const ctx = canvas.getContext('2d');

//   const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
//   gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
//   gradient.addColorStop(0.3, 'rgba(255, 235, 80, 0.9)');
//   gradient.addColorStop(0.7, 'rgba(255, 200, 0, 0.3)');
//   gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

//   ctx.fillStyle = gradient;
//   ctx.beginPath();
//   ctx.arc(32, 32, 32, 0, Math.PI * 2);
//   ctx.fill();

//   return new THREE.CanvasTexture(canvas);
// }

// // Round Glowing Particles
// function Particles({ audioLevel, circleTexture }) {
//   const count = 3000;
//   const mesh = useRef();

//   const [positions] = useMemo(() => {
//     const pos = new Float32Array(count * 3);
//     for (let i = 0; i < count; i++) {
//       const u = Math.random();
//       const v = Math.random();
//       const theta = u * 2.0 * Math.PI;
//       const phi = Math.acos(2.0 * v - 1.0);
//       const r = Math.cbrt(Math.random()) * 2.6 + 0.6;

//       pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
//       pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
//       pos[i * 3 + 2] = r * Math.cos(phi);
//     }
//     return [pos];
//   }, [count]);

//   useFrame(({ clock }) => {
//     const t = clock.getElapsedTime();
//     if (mesh.current) {
//       mesh.current.rotation.y = t * 0.1;
//       mesh.current.rotation.x = t * 0.04;
//       const scale = 1 + audioLevel * 0.6;
//       mesh.current.scale.set(scale, scale, scale);
//     }
//   });

//   return (
//     <points ref={mesh}>
//       <bufferGeometry>
//         <bufferAttribute attach="attributes-position" args={[positions, 3]} />
//       </bufferGeometry>
//       <pointsMaterial
//         size={0.07}
//         map={circleTexture}
//         color={[8, 7.5, 0.5]}
//         transparent
//         opacity={0.85}
//         depthWrite={false}
//         blending={THREE.AdditiveBlending}
//         toneMapped={false}
//       />
//     </points>
//   );
// }

// // Smooth Orbital Rings
// function OrbitalRings({ audioLevel }) {
//   const group = useRef();

//   useFrame(({ clock }) => {
//     const t = clock.getElapsedTime();
//     if (group.current) {
//       group.current.children[0].rotation.x = t * 0.9;
//       group.current.children[0].rotation.y = t * 0.6;

//       group.current.children[1].rotation.x = t * -0.7;
//       group.current.children[1].rotation.z = t * 0.8;

//       group.current.children[2].rotation.y = t * 1.1;
//       group.current.children[2].rotation.z = t * -0.5;
//     }
//   });

//   return (
//     <group ref={group}>
//       <mesh>
//         <torusGeometry args={[1.35 + audioLevel * 0.3, 0.015, 16, 100]} />
//         <meshBasicMaterial color={[12, 3.5, 0]} toneMapped={false} />
//       </mesh>
//       <mesh>
//         <torusGeometry args={[1.55 + audioLevel * 0.4, 0.012, 16, 100]} />
//         <meshBasicMaterial color={[10, 5, 0.2]} toneMapped={false} />
//       </mesh>
//       <mesh>
//         <torusGeometry args={[1.75 + audioLevel * 0.2, 0.01, 16, 100]} />
//         <meshBasicMaterial color={[8, 2.5, 0]} toneMapped={false} />
//       </mesh>
//     </group>
//   );
// }

// // Central Sun Core
// function GlowingCore({ audioLevel }) {
//   const coreRef = useRef();

//   useFrame(({ clock }) => {
//     const t = clock.getElapsedTime();
//     const heartbeat = Math.sin(t * 3.5) * 0.06 + 0.55;
//     const finalScale = heartbeat + audioLevel * 0.7;

//     if (coreRef.current) {
//       coreRef.current.scale.set(finalScale, finalScale, finalScale);
//     }
//   });

//   return (
//     <group>
//       <mesh ref={coreRef}>
//         <sphereGeometry args={[0.6, 32, 32]} />
//         {/* <meshBasicMaterial color={[8, 6, 2]} toneMapped={false} /> */}
//         <meshBasicMaterial color="#ffaa00" />
//       </mesh>

//       <mesh>
//         <sphereGeometry args={[0.85, 32, 32]} />
//         <meshBasicMaterial
//           color={[3, 0.8, 0]}
//           transparent
//           opacity={0.4 + audioLevel * 0.3}
//           blending={THREE.AdditiveBlending}
//           toneMapped={false}
//         />
//       </mesh>
//     </group>
//   );
// }

// export default function App() {
//   const [isListening, setIsListening] = useState(false);
//   const [audioLevel, setAudioLevel] = useState(0);

//   const circleTexture = useMemo(() => createCircleTexture(), []);

//   const startMic = async () => {
//     try {
//       const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
//       const audioContext = new (window.AudioContext || window.webkitAudioContext)();
//       const analyser = audioContext.createAnalyser();
//       const source = audioContext.createMediaStreamSource(stream);

//       analyser.fftSize = 64;
//       source.connect(analyser);

//       const dataArray = new Uint8Array(analyser.frequencyBinCount);
//       setIsListening(true);

//       const updateAudio = () => {
//         analyser.getByteFrequencyData(dataArray);
//         let sum = 0;
//         for (let i = 0; i < dataArray.length; i++) {
//           sum += dataArray[i];
//         }
//         const average = sum / dataArray.length;
//         setAudioLevel(average / 128);

//         requestAnimationFrame(updateAudio);
//       };

//       updateAudio();
//     } catch (err) {
//       alert("Mic Permission Error: " + err.message);
//     }
//   };

//   return (
//     <div style={{ width: '100vw', height: '100vh', background: '#000000', position: 'relative', overflow: 'hidden' }}>

//       {!isListening && (
//         <button
//           onClick={startMic}
//           style={{
//             position: 'absolute',
//             top: '30px',
//             left: '50%',
//             transform: 'translateX(-50%)',
//             zIndex: 10,
//             padding: '12px 28px',
//             backgroundColor: '#ff5500',
//             color: '#fff',
//             border: 'none',
//             borderRadius: '30px',
//             cursor: 'pointer',
//             fontWeight: 'bold',
//             boxShadow: '0 0 25px #ff5500',
//             letterSpacing: '1px'
//           }}
//         >
//           INITIALIZE ULTRON CORE
//         </button>
//       )}

//       <Canvas camera={{ position: [0, 0, 4.2], fov: 60 }}
//       gl={{ antialias: true, toneMapping: THREE.NoToneMapping }}
//       >
//         <color attach="background" args={['#000000']} />
//         <OrbitControls enableZoom={true} enablePan={false} />

//         <GlowingCore audioLevel={audioLevel} />
//         <OrbitalRings audioLevel={audioLevel} />
//         <Particles audioLevel={audioLevel} circleTexture={circleTexture} />

//         {/* Fine-tuned Cinematic Bloom */}
//         <EffectComposer>
//           <Bloom
//             intensity={2.2}
//             luminanceThreshold={0.85}
//             luminanceSmoothing={0.9}
//             mipmapBlur
//           />
//         </EffectComposer>
//       </Canvas>
//     </div>
//   );
// }  












// import React, { useRef, useMemo, useState, useEffect } from 'react';
// import { Canvas, useFrame } from '@react-three/fiber';
// import { OrbitControls } from '@react-three/drei';
// import { EffectComposer, Bloom } from '@react-three/postprocessing';
// import * as THREE from 'three';
// // import { Hands } from '@mediapipe/hands';
// // import { Camera } from '@mediapipe/camera_utils';

// // Soft Round Glowing Texture
// function createCircleTexture() {
//   const canvas = document.createElement('canvas');
//   canvas.width = 64;
//   canvas.height = 64;
//   const ctx = canvas.getContext('2d');

//   const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
//   gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
//   gradient.addColorStop(0.3, 'rgba(255, 235, 80, 0.9)');
//   gradient.addColorStop(0.7, 'rgba(255, 200, 0, 0.3)');
//   gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

//   ctx.fillStyle = gradient;
//   ctx.beginPath();
//   ctx.arc(32, 32, 32, 0, Math.PI * 2);
//   ctx.fill();

//   return new THREE.CanvasTexture(canvas);
// }

// // Stretched / Oval Radial Texture (Core ki taraf stretch effect ke liye)
// function createStretchedTexture() {
//   const canvas = document.createElement('canvas');
//   canvas.width = 64;
//   canvas.height = 64;
//   const ctx = canvas.getContext('2d');

//   ctx.translate(32, 32);
//   ctx.scale(0.35, 1.0); // X-axis par narrow karke oval (stretched) banaya hai

//   const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 32);
//   gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
//   gradient.addColorStop(0.3, 'rgba(255, 235, 80, 0.9)');
//   gradient.addColorStop(0.7, 'rgba(255, 200, 0, 0.3)');
//   gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

//   ctx.fillStyle = gradient;
//   ctx.beginPath();
//   ctx.arc(0, 0, 32, 0, Math.PI * 2);
//   ctx.fill();

//   return new THREE.CanvasTexture(canvas);
// }

// // Pehle wale 'function Particles' ki jagah ye dono aayenge:

// // RingParticles Directed Towards Core
// function RingParticles({ audioLevel }) {
//   const count = 800;
//   const meshRef = useRef();

//   // Dummy matrix for transformation calculations
//   const dummy = useMemo(() => new THREE.Object3D(), []);

//   // Pre-calculate positions and rotations targeting the center (0,0,0)
//   const particles = useMemo(() => {
//     const temp = [];
//     for (let i = 0; i < count; i++) {
//       const u = Math.random();
//       const v = Math.random();
//       const theta = u * 2.0 * Math.PI;
//       const phi = Math.acos(2.0 * v - 1.0);
//       const r = Math.random() * 0.9 + 1.85; // Outside rings

//       const pos = new THREE.Vector3(
//         r * Math.sin(phi) * Math.cos(theta),
//         r * Math.sin(phi) * Math.sin(theta),
//         r * Math.cos(phi)
//       );

//       // Rotation matrix facing the center core
//       const rotation = new THREE.Quaternion();
//       const lookAtMat = new THREE.Matrix4().lookAt(pos, new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 1, 0));
//       rotation.setFromRotationMatrix(lookAtMat);

//       temp.push({ pos, rotation });
//     }
//     return temp;
//   }, [count]);

//   useFrame(({ clock }) => {
//     if (!meshRef.current) return;
//     const t = clock.getElapsedTime();

//     particles.forEach((p, i) => {
//       dummy.position.copy(p.pos);
//       dummy.quaternion.copy(p.rotation);

//       // Core ki taraf streak shape dene ke liye Z-axis stretch
//       const streakScale = 1.0 + audioLevel * 0.4;
//       // Z value ko 0.08 se badha kar 0.25 ya 0.35 kar do
//       dummy.scale.set(0.008, 0.008, 0.20 * streakScale);

//       dummy.updateMatrix();
//       meshRef.current.setMatrixAt(i, dummy.matrix);
//     });

//     meshRef.current.rotation.y = t * 0.02;
//     meshRef.current.instanceMatrix.needsUpdate = true;
//   });

//   return (
//     <instancedMesh ref={meshRef} args={[null, null, count]}>
//       {/* Small Cylinder/Cone shape stretching towards core */}
//       <cylinderGeometry args={[0, 0.5, 1, 8]} />
//       <meshBasicMaterial
//         color={[10, 8.5, 0.8]}
//         transparent
//         opacity={0.85}
//         blending={THREE.AdditiveBlending}
//         toneMapped={false}
//       />
//     </instancedMesh>
//   );
// }

// function FreeFloatingParticles({ circleTexture }) {
//   const count = 100;
//   const mesh = useRef();

//   const [positions, initialPositions] = useMemo(() => {
//     const pos = new Float32Array(count * 3);
//     const initPos = new Float32Array(count * 3);

//     for (let i = 0; i < count; i++) {
//       const u = Math.random();
//       const v = Math.random();
//       const theta = u * 2.0 * Math.PI;
//       const phi = Math.acos(2.0 * v - 1.0);
//       const r = Math.random() * 2.5 + 3.0;

//       const x = r * Math.sin(phi) * Math.cos(theta);
//       const y = r * Math.sin(phi) * Math.sin(theta);
//       const z = r * Math.cos(phi);

//       pos[i * 3] = x;
//       pos[i * 3 + 1] = y;
//       pos[i * 3 + 2] = z;

//       initPos[i * 3] = x;
//       initPos[i * 3 + 1] = y;
//       initPos[i * 3 + 2] = z;
//     }
//     return [pos, initPos];
//   }, [count]);

//   useFrame(({ clock }) => {
//     const t = clock.getElapsedTime();
//     if (mesh.current) {
//       const positionsAttr = mesh.current.geometry.attributes.position;

//       for (let i = 0; i < count; i++) {
//         const ix = initialPositions[i * 3];
//         const iy = initialPositions[i * 3 + 1];
//         const iz = initialPositions[i * 3 + 2];

//         positionsAttr.setXYZ(
//           i,
//           ix + Math.sin(t * 2.5 + i) * 0.3,
//           iy + Math.cos(t * 2.2 + i * 2) * 0.3,
//           iz + Math.sin(t * 1.8 + i * 3) * 0.3
//         );
//       }
//       positionsAttr.needsUpdate = true;
//     }
//   });

//   return (
//     <points ref={mesh}>
//       <bufferGeometry>
//         <bufferAttribute attach="attributes-position" args={[positions, 3]} />
//       </bufferGeometry>
//       <pointsMaterial
//         size={0.07}
//         map={circleTexture}
//         color={[8, 7.5, 0.5]}
//         transparent
//         opacity={0.75}
//         depthWrite={false}
//         blending={THREE.AdditiveBlending}
//         toneMapped={false}
//       />
//     </points>
//   );
// }

// // Smooth Orbital Rings
// function OrbitalRings({ audioLevel }) {
//   const group = useRef();

//   useFrame(({ clock }) => {
//     const t = clock.getElapsedTime();
//     if (group.current) {
//       group.current.children[0].rotation.x = t * 0.9;
//       group.current.children[0].rotation.y = t * 0.6;

//       group.current.children[1].rotation.x = t * -0.7;
//       group.current.children[1].rotation.z = t * 0.8;

//       group.current.children[2].rotation.y = t * 1.1;
//       group.current.children[2].rotation.z = t * -0.5;
//     }
//   });

//   return (
//     <group ref={group}>
//       <mesh>
//         <torusGeometry args={[1.35 + audioLevel * 0.3, 0.015, 16, 100]} />
//         <meshBasicMaterial color={[10, 9, 0.2]} toneMapped={false} />
//       </mesh>
//       <mesh>
//         <torusGeometry args={[1.55 + audioLevel * 0.4, 0.012, 16, 100]} />
//         <meshBasicMaterial color={[9, 8, 0.1]} toneMapped={false} />
//       </mesh>
//       <mesh>
//         <torusGeometry args={[1.75 + audioLevel * 0.2, 0.01, 16, 100]} />
//         <meshBasicMaterial color={[8, 7, 0.1]} toneMapped={false} />
//       </mesh>
//     </group>
//   );
// }

// // Central Sun Core
// function GlowingCore({ audioLevel }) {
//   const coreRef = useRef();

//   useFrame(({ clock }) => {
//     const t = clock.getElapsedTime();
//     const heartbeat = Math.sin(t * 3.5) * 0.06 + 0.55;
//     const finalScale = heartbeat + audioLevel * 0.7;

//     if (coreRef.current) {
//       coreRef.current.scale.set(finalScale, finalScale, finalScale);
//     }
//   });

//   return (
//     <group>
//       <mesh ref={coreRef}>
//         <sphereGeometry args={[0.6, 32, 32]} />
//         <meshBasicMaterial color="#ffaa00" />
//       </mesh>

//       <mesh>
//         <sphereGeometry args={[0.85, 32, 32]} />
//         <meshBasicMaterial
//           color={[3, 0.8, 0]}
//           transparent
//           opacity={0.4 + audioLevel * 0.3}
//           blending={THREE.AdditiveBlending}
//           toneMapped={false}
//         />
//       </mesh>
//     </group>
//   );
// }

// function HandController({ onHandMove }) {
//   const videoRef = useRef(null);

//   useEffect(() => {
//     const hands = new Hands({
//       locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
//     });

//     hands.setOptions({
//       maxNumHands: 1,
//       modelComplexity: 1,
//       minDetectionConfidence: 0.5,
//       minTrackingConfidence: 0.5,
//     });

//     hands.onResults((results) => {
//       if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
//         const landmarks = results.multiHandLandmarks[0];

//         // Index Finger Tip & Thumb Tip
//         const indexTip = landmarks[8];
//         const thumbTip = landmarks[4];

//         // X, Y movement for Rotation
//         const handX = (0.5 - indexTip.x) * 3;
//         const handY = (0.5 - indexTip.y) * 3;

//         // Pinch Distance for Scale
//         const distance = Math.hypot(
//           indexTip.x - thumbTip.x,
//           indexTip.y - thumbTip.y
//         );

//         onHandMove({ handX, handY, distance });
//       }
//     });

//     // HandController ke andar logic update:
//     if (videoRef.current) {
//       const camera = new Camera(videoRef.current, {
//         onFrame: async () => {
//           await hands.send({ image: videoRef.current });
//         },
//         width: 480,  // Mobile performance ke liye resolution thoda kam rakha hai
//         height: 360,
//         facingMode: 'user' // Front camera enforce karne ke liye
//       });
//       camera.start();
//     }
//   }, []);

//   return <video ref={videoRef} style={{ display: 'none' }} />;
// }

// function HandControlledScene({ handData, children }) {
//   const groupRef = useRef();

//   useFrame(() => {
//     if (groupRef.current) {
//       // Smooth interpolation (LERP) for natural motion
//       groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, handData.handX, 0.1);
//       groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, handData.handY, 0.1);

//       const targetScale = Math.max(0.6, Math.min(2.0, handData.distance * 5));
//       groupRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
//     }
//   });

//   return <group ref={groupRef}>{children}</group>;
// }

// export default function App() {
//   const [isListening, setIsListening] = useState(false);
//   const [audioLevel, setAudioLevel] = useState(0);

//   const [handData, setHandData] = useState({ handX: 0, handY: 0, distance: 0.2 });

//   const circleTexture = useMemo(() => createCircleTexture(), []);
//   const stretchedTexture = useMemo(() => createStretchedTexture(), []);

//   const startMic = async () => {
//     try {
//       const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
//       const audioContext = new (window.AudioContext || window.webkitAudioContext)();
//       const analyser = audioContext.createAnalyser();
//       const source = audioContext.createMediaStreamSource(stream);

//       analyser.fftSize = 64;
//       source.connect(analyser);

//       const dataArray = new Uint8Array(analyser.frequencyBinCount);
//       setIsListening(true);

//       const updateAudio = () => {
//         analyser.getByteFrequencyData(dataArray);
//         let sum = 0;
//         for (let i = 0; i < dataArray.length; i++) {
//           sum += dataArray[i];
//         }
//         const average = sum / dataArray.length;
//         setAudioLevel(average / 128);

//         requestAnimationFrame(updateAudio);
//       };

//       updateAudio();
//     } catch (err) {
//       alert("Mic Permission Error: " + err.message);
//     }
//   };

//   useEffect(() => {
//     startMic();
//   }, []);

//   return (
//     <div
//       onClick={startMic}
//       style={{ width: '100vw', height: '100vh', background: '#000000', position: 'relative', overflow: 'hidden' }}>

//       {!isListening && (
//         <button
//           onClick={startMic}
//           style={{
//             position: 'absolute',
//             top: '30px',
//             left: '50%',
//             transform: 'translateX(-50%)',
//             zIndex: 10,
//             padding: '12px 28px',
//             backgroundColor: '#ff5500',
//             color: '#fff',
//             border: 'none',
//             borderRadius: '30px',
//             cursor: 'pointer',
//             fontWeight: 'bold',
//             boxShadow: '0 0 25px #ff5500',
//             letterSpacing: '1px'
//           }}
//         >
//           INITIALIZE ULTRON CORE
//         </button>
//       )}

//       <Canvas
//         camera={{ position: [0, 0, 4.2], fov: 60 }}
//         gl={{ antialias: true, toneMapping: THREE.NoToneMapping }}
//       >
//         <color attach="background" args={['#000000']} />
//         <OrbitControls enableZoom={true} enablePan={false} />

//         <GlowingCore audioLevel={audioLevel} />
//         <OrbitalRings audioLevel={audioLevel} />
//         <RingParticles audioLevel={audioLevel} stretchedTexture={stretchedTexture} />
//         <FreeFloatingParticles circleTexture={circleTexture} />
//         <EffectComposer>
//           <Bloom
//             intensity={2.2}
//             luminanceThreshold={0.85}
//             luminanceSmoothing={0.9}
//             mipmapBlur
//           />
//         </EffectComposer>
//       </Canvas>
//     </div>
//   );
// }  








import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';

// Soft Round Glowing Texture
function createCircleTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');

  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
  gradient.addColorStop(0.3, 'rgba(255, 235, 80, 0.9)');
  gradient.addColorStop(0.7, 'rgba(255, 200, 0, 0.3)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(32, 32, 32, 0, Math.PI * 2);
  ctx.fill();

  return new THREE.CanvasTexture(canvas);
}

// Stretched / Oval Radial Texture
function createStretchedTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');

  ctx.translate(32, 32);
  ctx.scale(0.35, 1.0);

  const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 32);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
  gradient.addColorStop(0.3, 'rgba(255, 235, 80, 0.9)');
  gradient.addColorStop(0.7, 'rgba(255, 200, 0, 0.3)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(0, 0, 32, 0, Math.PI * 2);
  ctx.fill();

  return new THREE.CanvasTexture(canvas);
}

// RingParticles Directed Towards Core
function RingParticles({ audioLevel }) {
  const count = 800;
  const meshRef = useRef();

  const dummy = useMemo(() => new THREE.Object3D(), []);

  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = Math.random() * 0.9 + 1.85;

      const pos = new THREE.Vector3(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi)
      );

      const rotation = new THREE.Quaternion();
      const lookAtMat = new THREE.Matrix4().lookAt(pos, new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 1, 0));
      rotation.setFromRotationMatrix(lookAtMat);

      temp.push({ pos, rotation });
    }
    return temp;
  }, [count]);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.getElapsedTime();

    particles.forEach((p, i) => {
      dummy.position.copy(p.pos);
      dummy.quaternion.copy(p.rotation);

      const streakScale = 1.0 + audioLevel * 0.4;
      dummy.scale.set(0.008, 0.008, 0.20 * streakScale);

      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    });

    meshRef.current.rotation.y = t * 0.02;
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[null, null, count]}>
      <cylinderGeometry args={[0, 0.5, 1, 8]} />
      <meshBasicMaterial
        color={[10, 8.5, 0.8]}
        transparent
        opacity={0.85}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </instancedMesh>
  );
}

function FreeFloatingParticles({ circleTexture }) {
  const count = 100;
  const mesh = useRef();

  const [positions, initialPositions] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const initPos = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = Math.random() * 2.5 + 3.0;

      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);

      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;

      initPos[i * 3] = x;
      initPos[i * 3 + 1] = y;
      initPos[i * 3 + 2] = z;
    }
    return [pos, initPos];
  }, [count]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (mesh.current) {
      const positionsAttr = mesh.current.geometry.attributes.position;

      for (let i = 0; i < count; i++) {
        const ix = initialPositions[i * 3];
        const iy = initialPositions[i * 3 + 1];
        const iz = initialPositions[i * 3 + 2];

        positionsAttr.setXYZ(
          i,
          ix + Math.sin(t * 2.5 + i) * 0.3,
          iy + Math.cos(t * 2.2 + i * 2) * 0.3,
          iz + Math.sin(t * 1.8 + i * 3) * 0.3
        );
      }
      positionsAttr.needsUpdate = true;
    }
  });

  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.07}
        map={circleTexture}
        color={[8, 7.5, 0.5]}
        transparent
        opacity={0.75}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </points>
  );
}

// Orbital Rings
function OrbitalRings({ audioLevel }) {
  const group = useRef();

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (group.current) {
      group.current.children[0].rotation.x = t * 0.9;
      group.current.children[0].rotation.y = t * 0.6;

      group.current.children[1].rotation.x = t * -0.7;
      group.current.children[1].rotation.z = t * 0.8;

      group.current.children[2].rotation.y = t * 1.1;
      group.current.children[2].rotation.z = t * -0.5;
    }
  });

  return (
    <group ref={group}>
      <mesh>
        <torusGeometry args={[1.35 + audioLevel * 0.3, 0.015, 16, 100]} />
        <meshBasicMaterial color={[10, 9, 0.2]} toneMapped={false} />
      </mesh>
      <mesh>
        <torusGeometry args={[1.55 + audioLevel * 0.4, 0.012, 16, 100]} />
        <meshBasicMaterial color={[9, 8, 0.1]} toneMapped={false} />
      </mesh>
      <mesh>
        <torusGeometry args={[1.75 + audioLevel * 0.2, 0.01, 16, 100]} />
        <meshBasicMaterial color={[8, 7, 0.1]} toneMapped={false} />
      </mesh>
    </group>
  );
}

// Glowing Core
function GlowingCore({ audioLevel }) {
  const coreRef = useRef();

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const heartbeat = Math.sin(t * 3.5) * 0.06 + 0.55;
    const finalScale = heartbeat + audioLevel * 0.7;

    if (coreRef.current) {
      coreRef.current.scale.set(finalScale, finalScale, finalScale);
    }
  });

  return (
    <group>
      <mesh ref={coreRef}>
        <sphereGeometry args={[0.6, 32, 32]} />
        <meshBasicMaterial color="#ffaa00" />
      </mesh>

      <mesh>
        <sphereGeometry args={[0.85, 32, 32]} />
        <meshBasicMaterial
          color={[3, 0.8, 0]}
          transparent
          opacity={0.4 + audioLevel * 0.3}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

// Fixed Hand Controller
function HandController({ onHandMove }) {
  const videoRef = useRef(null);

  useEffect(() => {
    const HandsClass = window.Hands;
    const CameraClass = window.Camera;

    if (!HandsClass || !CameraClass) {
      console.error("MediaPipe scripts load nahi hue hain.");
      return;
    }

    const hands = new HandsClass({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
    });

    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    hands.onResults((results) => {
      if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const landmarks = results.multiHandLandmarks[0];

        const indexTip = landmarks[8];
        const thumbTip = landmarks[4];

        const handX = (0.5 - indexTip.x) * 3;
        const handY = (0.5 - indexTip.y) * 3;

        const distance = Math.hypot(
          indexTip.x - thumbTip.x,
          indexTip.y - thumbTip.y
        );

        onHandMove({ handX, handY, distance });
      }
    });

    if (videoRef.current) {
      const camera = new CameraClass(videoRef.current, {
        onFrame: async () => {
          await hands.send({ image: videoRef.current });
        },
        width: 480,
        height: 360,
        facingMode: 'user',
      });
      camera.start();
    }
  }, []);

  return <video ref={videoRef} style={{ display: 'none' }} />;
}

// Hand Control Scene Wrapper
function HandControlledScene({ handData, children }) {
  const groupRef = useRef();

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, handData.handX, 0.1);
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, handData.handY, 0.1);

      const targetScale = Math.max(0.6, Math.min(2.0, handData.distance * 5));
      groupRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
    }
  });

  return <group ref={groupRef}>{children}</group>;
}

export default function App() {
  const [isListening, setIsListening] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);

  const [handData, setHandData] = useState({ handX: 0, handY: 0, distance: 0.2 });

  const circleTexture = useMemo(() => createCircleTexture(), []);
  const stretchedTexture = useMemo(() => createStretchedTexture(), []);

  const startMic = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: true, 
        video: { facingMode: 'user' } 
      });

      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);

      analyser.fftSize = 64;
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      setIsListening(true);

      const updateAudio = () => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const average = sum / dataArray.length;
        setAudioLevel(average / 128);

        requestAnimationFrame(updateAudio);
      };

      updateAudio();
    } catch (err) {
      alert("Mic/Camera Permission Error: " + err.message);
    }
  };

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#000000', position: 'relative', overflow: 'hidden' }}>

      {/* Hand Controller Hidden Element Added Here */}
      <HandController onHandMove={setHandData} />

      {!isListening && (
        <button
          onClick={startMic}
          style={{
            position: 'absolute',
            top: '30px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 10,
            padding: '12px 28px',
            backgroundColor: '#ff5500',
            color: '#fff',
            border: 'none',
            borderRadius: '30px',
            cursor: 'pointer',
            fontWeight: 'bold',
            boxShadow: '0 0 25px #ff5500',
            letterSpacing: '1px'
          }}
        >
          INITIALIZE ULTRON CORE
        </button>
      )}

      <Canvas
        camera={{ position: [0, 0, 4.2], fov: 60 }}
        gl={{ antialias: true, toneMapping: THREE.NoToneMapping }}
      >
        <color attach="background" args={['#000000']} />
        <OrbitControls enableZoom={true} enablePan={false} />

        {/* Hand Control Scene Added Here */}
        <HandControlledScene handData={handData}>
          <GlowingCore audioLevel={audioLevel} />
          <OrbitalRings audioLevel={audioLevel} />
          <RingParticles audioLevel={audioLevel} stretchedTexture={stretchedTexture} />
          <FreeFloatingParticles circleTexture={circleTexture} />
        </HandControlledScene>

        <EffectComposer>
          <Bloom
            intensity={2.2}
            luminanceThreshold={0.85}
            luminanceSmoothing={0.9}
            mipmapBlur
          />
        </EffectComposer>
      </Canvas>
    </div>
  );
}