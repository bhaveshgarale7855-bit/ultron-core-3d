// import React, { useRef, useMemo, useState, useEffect } from 'react';
// import { Canvas, useFrame } from '@react-three/fiber';
// import { OrbitControls } from '@react-three/drei';
// import { EffectComposer, Bloom } from '@react-three/postprocessing';
// import * as THREE from 'three';

// // Color Themes
// const THEMES = {
//   gold: { core: '#ffaa00', outer: [3, 0.8, 0], ring: [10, 8.5, 0.8] },
//   blue: { core: '#00d2ff', outer: [0, 1.5, 3], ring: [0.2, 5, 10] },
//   red: { core: '#ff0033', outer: [3, 0, 0.2], ring: [10, 0.5, 0.5] }
// };

// // Speak AI
// function speakAI(text) {
//   if ('speechSynthesis' in window) {
//     window.speechSynthesis.cancel();
//     const utterance = new SpeechSynthesisUtterance(text);
//     utterance.pitch = 0.85;
//     utterance.rate = 1.0;
//     window.speechSynthesis.speak(utterance);
//   }
// }

// function createCircleTexture() {
//   const canvas = document.createElement('canvas');
//   canvas.width = 32;
//   canvas.height = 32;
//   const ctx = canvas.getContext('2d');
//   const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
//   gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
//   gradient.addColorStop(0.4, 'rgba(255, 200, 0, 0.8)');
//   gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
//   ctx.fillStyle = gradient;
//   ctx.beginPath();
//   ctx.arc(16, 16, 16, 0, Math.PI * 2);
//   ctx.fill();
//   return new THREE.CanvasTexture(canvas);
// }

// // Optimized Ring Particles (Reduced to 350 for mobile smoothness)
// function RingParticles({ audioLevel, theme }) {
//   const count = 350;
//   const meshRef = useRef();
//   const dummy = useMemo(() => new THREE.Object3D(), []);

//   const particles = useMemo(() => {
//     const temp = [];
//     for (let i = 0; i < count; i++) {
//       const u = Math.random();
//       const v = Math.random();
//       const theta = u * 2.0 * Math.PI;
//       const phi = Math.acos(2.0 * v - 1.0);
//       const r = Math.random() * 0.9 + 1.85;

//       const pos = new THREE.Vector3(
//         r * Math.sin(phi) * Math.cos(theta),
//         r * Math.sin(phi) * Math.sin(theta),
//         r * Math.cos(phi)
//       );

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

//       const streakScale = 1.0 + audioLevel * 0.4;
//       dummy.scale.set(0.008, 0.008, 0.20 * streakScale);

//       dummy.updateMatrix();
//       meshRef.current.setMatrixAt(i, dummy.matrix);
//     });

//     meshRef.current.rotation.y = t * 0.02;
//     meshRef.current.instanceMatrix.needsUpdate = true;
//   });

//   return (
//     <instancedMesh ref={meshRef} args={[null, null, count]}>
//       <cylinderGeometry args={[0, 0.5, 1, 6]} />
//       <meshBasicMaterial
//         color={theme.ring}
//         transparent
//         opacity={0.85}
//         blending={THREE.AdditiveBlending}
//         toneMapped={false}
//       />
//     </instancedMesh>
//   );
// }

// function FreeFloatingParticles({ circleTexture, theme }) {
//   const count = 60;
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
//         color={theme.ring}
//         transparent
//         opacity={0.75}
//         depthWrite={false}
//         blending={THREE.AdditiveBlending}
//         toneMapped={false}
//       />
//     </points>
//   );
// }

// function OrbitalRings({ audioLevel, theme }) {
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
//         <torusGeometry args={[1.35 + audioLevel * 0.3, 0.015, 12, 60]} />
//         <meshBasicMaterial color={theme.ring} toneMapped={false} />
//       </mesh>
//       <mesh>
//         <torusGeometry args={[1.55 + audioLevel * 0.4, 0.012, 12, 60]} />
//         <meshBasicMaterial color={theme.ring} toneMapped={false} />
//       </mesh>
//       <mesh>
//         <torusGeometry args={[1.75 + audioLevel * 0.2, 0.01, 12, 60]} />
//         <meshBasicMaterial color={theme.ring} toneMapped={false} />
//       </mesh>
//     </group>
//   );
// }

// function GlowingCore({ audioLevel, theme }) {
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
//         <sphereGeometry args={[0.6, 24, 24]} />
//         <meshBasicMaterial color={theme.core} />
//       </mesh>

//       <mesh>
//         <sphereGeometry args={[0.85, 24, 24]} />
//         <meshBasicMaterial
//           color={theme.outer}
//           transparent
//           opacity={0.4 + audioLevel * 0.3}
//           blending={THREE.AdditiveBlending}
//           toneMapped={false}
//         />
//       </mesh>
//     </group>
//   );
// }

// // Light-weight Hand Tracking Controller (Prevents Lag)
// function HandController({ onHandMove }) {
//   const videoRef = useRef(null);

//   useEffect(() => {
//     const HandsClass = window.Hands;
//     const CameraClass = window.Camera;

//     if (!HandsClass || !CameraClass) return;

//     const hands = new HandsClass({
//       locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
//     });

//     hands.setOptions({
//       maxNumHands: 1,
//       modelComplexity: 0, // Set to 0 for maximum mobile performance (No Lag)
//       minDetectionConfidence: 0.5,
//       minTrackingConfidence: 0.5,
//     });

//     hands.onResults((results) => {
//       if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
//         const landmarks = results.multiHandLandmarks[0];

//         const indexTip = landmarks[8];
//         const thumbTip = landmarks[4];

//         const handX = (0.5 - indexTip.x) * 3;
//         const handY = (0.5 - indexTip.y) * 3;

//         const distance = Math.hypot(
//           indexTip.x - thumbTip.x,
//           indexTip.y - thumbTip.y
//         );

//         onHandMove({ handX, handY, distance });
//       }
//     });

//     if (videoRef.current) {
//       const camera = new CameraClass(videoRef.current, {
//         onFrame: async () => {
//           await hands.send({ image: videoRef.current });
//         },
//         width: 320, // Low resolution for smooth lag-free performance
//         height: 240,
//         facingMode: 'user',
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
//   const [currentThemeKey, setCurrentThemeKey] = useState('gold');
//   const [handData, setHandData] = useState({ handX: 0, handY: 0, distance: 0.2 });

//   const circleTexture = useMemo(() => createCircleTexture(), []);
//   const theme = THEMES[currentThemeKey];

//   // Gesture Pinch Thresholds for Themes
//   useEffect(() => {
//     if (handData.distance > 0.01 && handData.distance < 0.1) {
//       setCurrentThemeKey('blue');
//     } else if (handData.distance >= 0.1 && handData.distance < 0.22) {
//       setCurrentThemeKey('gold');
//     } else if (handData.distance >= 0.22) {
//       setCurrentThemeKey('red');
//     }
//   }, [handData.distance]);

//   // Voice Command Listener ("Hello", "Ultron", "Jarvis")
//   const startSpeechRecognition = () => {
//     const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
//     if (SpeechRecognition) {
//       const recognition = new SpeechRecognition();
//       recognition.continuous = true;
//       recognition.lang = 'en-US';

//       recognition.onresult = (event) => {
//         const lastIndex = event.results.length - 1;
//         const command = event.results[lastIndex][0].transcript.toLowerCase();

//         if (command.includes('hello') || command.includes('ultron') || command.includes('jarvis')) {
//           speakAI("Systems online, Boss. How can I assist you?");
//         }
//       };

//       recognition.start();
//     }
//   };

//   const startMic = async () => {
//     try {
//       const stream = await navigator.mediaDevices.getUserMedia({ 
//         audio: true, 
//         video: { facingMode: 'user' } 
//       });

//       const audioContext = new (window.AudioContext || window.webkitAudioContext)();
//       const analyser = audioContext.createAnalyser();
//       const source = audioContext.createMediaStreamSource(stream);

//       analyser.fftSize = 64;
//       source.connect(analyser);

//       const dataArray = new Uint8Array(analyser.frequencyBinCount);
//       setIsListening(true);

//       // Start actual voice recognition when active
//       startSpeechRecognition();

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
//       alert("Mic/Camera Permission Error: " + err.message);
//     }
//   };

//   return (
//     <div style={{ width: '100vw', height: '100vh', background: '#000000', position: 'relative', overflow: 'hidden' }}>

//       <HandController onHandMove={setHandData} />

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

//       {/* On-Screen Status HUD */}
//       {isListening && (
//         <div style={{
//           position: 'absolute',
//           top: '20px',
//           left: '20px',
//           color: theme.core,
//           fontFamily: 'monospace',
//           fontSize: '12px',
//           zIndex: 10,
//           textTransform: 'uppercase',
//           letterSpacing: '1px',
//           textShadow: `0 0 8px ${theme.core}`
//         }}>
//           <div>MODE: {currentThemeKey} PROTOCOL</div>
//           <div style={{ marginTop: '4px', opacity: 0.7 }}>SAY: "HELLO" OR "ULTRON"</div>
//         </div>
//       )}

//       <Canvas
//         camera={{ position: [0, 0, 4.2], fov: 60 }}
//         gl={{ antialias: false, toneMapping: THREE.NoToneMapping }}
//       >
//         <color attach="background" args={['#000000']} />
//         <OrbitControls enableZoom={true} enablePan={false} />

//         <HandControlledScene handData={handData}>
//           <GlowingCore audioLevel={audioLevel} theme={theme} />
//           <OrbitalRings audioLevel={audioLevel} theme={theme} />
//           <RingParticles audioLevel={audioLevel} theme={theme} />
//           <FreeFloatingParticles circleTexture={circleTexture} theme={theme} />
//         </HandControlledScene>

//         <EffectComposer>
//           <Bloom
//             intensity={1.8}
//             luminanceThreshold={0.85}
//             luminanceSmoothing={0.9}
//             mipmapBlur={false}
//           />
//         </EffectComposer>
//       </Canvas>
//     </div>
//   );
// }  not tested












import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';

const THEMES = {
  blue: { name: 'STRONG SIGNAL', core: '#00d2ff', outer: [0, 1.5, 3], ring: [0.2, 5, 10] },
  gold: { name: 'MEDIUM SIGNAL', core: '#ffaa00', outer: [3, 0.8, 0], ring: [10, 8.5, 0.8] },
  red: { name: 'WEAK / NO SIGNAL', core: '#ff0033', outer: [3, 0, 0.2], ring: [10, 0.5, 0.5] }
};

// Global variables for Feedback Control & State Lock
let isAISpeaking = false;
let globalRecognition = null;

function speakAI(text) {
  if ('speechSynthesis' in window) {
    isAISpeaking = true;
    window.speechSynthesis.cancel();

    if (globalRecognition) {
      try { globalRecognition.stop(); } catch (e) { }
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.pitch = 1.0;
    utterance.rate = 1.0;
    utterance.lang = 'en-US';

    utterance.onend = () => {
      // Resume listening AFTER AI finishes speaking
      setTimeout(() => {
        isAISpeaking = false;
        if (globalRecognition) {
          try { globalRecognition.start(); } catch (e) { }
        }
      }, 400);
    };

    utterance.onerror = () => {
      isAISpeaking = false;
    };

    window.speechSynthesis.speak(utterance);
  }
}

function createCircleTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
  gradient.addColorStop(0.4, 'rgba(255, 200, 0, 0.8)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(16, 16, 16, 0, Math.PI * 2);
  ctx.fill();
  return new THREE.CanvasTexture(canvas);
}

function RingParticles({ audioLevel, theme }) {
  const count = 300;
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

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.getElapsedTime();

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
      <cylinderGeometry args={[0, 0.5, 1, 6]} />
      <meshBasicMaterial
        color={theme.ring}
        transparent
        opacity={0.85}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </instancedMesh>
  );
}

function FreeFloatingParticles({ circleTexture, theme }) {
  const count = 50;
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

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
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
        color={theme.ring}
        transparent
        opacity={0.75}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </points>
  );
}

function OrbitalRings({ audioLevel, theme }) {
  const group = useRef();

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
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
        <torusGeometry args={[1.35 + audioLevel * 0.3, 0.015, 12, 60]} />
        <meshBasicMaterial color={theme.ring} toneMapped={false} />
      </mesh>
      <mesh>
        <torusGeometry args={[1.55 + audioLevel * 0.4, 0.012, 12, 60]} />
        <meshBasicMaterial color={theme.ring} toneMapped={false} />
      </mesh>
      <mesh>
        <torusGeometry args={[1.75 + audioLevel * 0.2, 0.01, 12, 60]} />
        <meshBasicMaterial color={theme.ring} toneMapped={false} />
      </mesh>
    </group>
  );
}

function GlowingCore({ audioLevel, theme }) {
  const coreRef = useRef();

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const heartbeat = Math.sin(t * 3.5) * 0.06 + 0.55;
    const finalScale = heartbeat + audioLevel * 0.7;

    if (coreRef.current) {
      coreRef.current.scale.set(finalScale, finalScale, finalScale);
    }
  });

  return (
    <group>
      <mesh ref={coreRef}>
        <sphereGeometry args={[0.6, 24, 24]} />
        <meshBasicMaterial color={theme.core} />
      </mesh>

      <mesh>
        <sphereGeometry args={[0.85, 24, 24]} />
        <meshBasicMaterial
          color={theme.outer}
          transparent
          opacity={0.4 + audioLevel * 0.3}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

function HandController({ onHandMove, onSignalChange }) {
  const videoRef = useRef(null);

  useEffect(() => {
    const HandsClass = window.Hands;
    const CameraClass = window.Camera;

    if (!HandsClass || !CameraClass) return;

    const hands = new HandsClass({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
    });

    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 0,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    hands.onResults((results) => {
      if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const landmarks = results.multiHandLandmarks[0];
        const score = results.multiHandedness[0]?.score || 0.8;

        const indexTip = landmarks[8];
        const thumbTip = landmarks[4];

        const handX = (0.5 - indexTip.x) * 3;
        const handY = (0.5 - indexTip.y) * 3;

        const distance = Math.hypot(
          indexTip.x - thumbTip.x,
          indexTip.y - thumbTip.y
        );

        onHandMove({ handX, handY, distance });

        if (score >= 0.85) {
          onSignalChange('blue');
        } else if (score >= 0.6) {
          onSignalChange('gold');
        } else {
          onSignalChange('red');
        }
      } else {
        onSignalChange('red');
      }
    });

    if (videoRef.current) {
      const camera = new CameraClass(videoRef.current, {
        onFrame: async () => {
          await hands.send({ image: videoRef.current });
        },
        width: 320,
        height: 240,
        facingMode: 'user',
      });
      camera.start();
    }
  }, []);

  return <video ref={videoRef} style={{ display: 'none' }} />;
}

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
  const [audioLevel, setAudioLevel] = useState(0);
  const [currentThemeKey, setCurrentThemeKey] = useState('red');
  const [handData, setHandData] = useState({ handX: 0, handY: 0, distance: 0.2 });
  const [lastHeardText, setLastHeardText] = useState('Click Core to Start...');
  const [isInitialized, setIsInitialized] = useState(false);

  const circleTexture = useMemo(() => createCircleTexture(), []);
  const theme = THEMES[currentThemeKey];

  const handleCommand = (cmd) => {
    const cleanCmd = cmd.trim().toLowerCase();

    // Noise Filter & Lock check
    if (!cleanCmd || cleanCmd.length < 3 || isAISpeaking) return;

    setLastHeardText(`Heard: "${cleanCmd}"`);

    // Command Filter
    if (
      cleanCmd.includes('hello') ||
      cleanCmd.includes('ultron') ||
      cleanCmd.includes('jarvis') ||
      cleanCmd.includes('hi')
    ) {
      speakAI("Systems online, Boss. How can I assist you?");
    }
  };

  const startAudioAndSpeech = async () => {
    setIsInitialized(true);
    setLastHeardText("Initializing Systems...");

    try {
      // 1. Audio Stream Request with Echo Cancellation
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      await audioContext.resume();

      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);
      analyser.fftSize = 64;
      source.connect(analyser);
      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const updateAudio = () => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
        setAudioLevel((sum / dataArray.length) / 128);
        requestAnimationFrame(updateAudio);
      };
      updateAudio();

      // 2. Web Speech Engine Initialization
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

      if (!SpeechRecognition) {
        setLastHeardText("Browser WebSpeech Not Supported!");
        return;
      }

      globalRecognition = new SpeechRecognition();
      globalRecognition.continuous = false;
      globalRecognition.interimResults = false;
      globalRecognition.lang = 'en-US';

      globalRecognition.onstart = () => {
        if (!isAISpeaking) setLastHeardText("Listening...");
      };

      globalRecognition.onresult = (event) => {
        if (isAISpeaking) return;
        const transcript = event.results[0][0].transcript;
        handleCommand(transcript);
      };

      globalRecognition.onerror = (err) => {
        console.error("Speech Error:", err.error);
      };

      globalRecognition.onend = () => {
        // Auto-restart ONLY when AI is not speaking
        if (!isAISpeaking) {
          setTimeout(() => {
            try { globalRecognition.start(); } catch (e) { }
          }, 300);
        }
      };

      globalRecognition.start();
      speakAI("Ultron Core Active");

    } catch (err) {
      setLastHeardText("Mic Access Denied by Browser/OS!");
      console.error(err);
    }
  };

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#000000', position: 'relative', overflow: 'hidden' }}>

      <HandController onHandMove={setHandData} onSignalChange={setCurrentThemeKey} />

      {!isInitialized && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0,0,0,0.85)',
          zIndex: 100,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <button
            onClick={startAudioAndSpeech}
            style={{
              padding: '16px 32px',
              fontSize: '18px',
              fontFamily: 'monospace',
              fontWeight: 'bold',
              color: '#00d2ff',
              backgroundColor: 'transparent',
              border: '2px solid #00d2ff',
              borderRadius: '8px',
              cursor: 'pointer',
              boxShadow: '0 0 15px #00d2ff',
              textTransform: 'uppercase',
              letterSpacing: '2px'
            }}
          >
            INITIALIZE ULTRON CORE
          </button>
        </div>
      )}

      <div style={{
        position: 'absolute',
        top: '20px',
        left: '20px',
        color: theme.core,
        fontFamily: 'monospace',
        fontSize: '12px',
        zIndex: 10,
        textTransform: 'uppercase',
        letterSpacing: '1px',
        textShadow: `0 0 8px ${theme.core}`
      }}>
        <div>HAND TRACKING: {theme.name}</div>
        <div style={{ marginTop: '6px', color: '#fff', fontWeight: 'bold' }}>{lastHeardText}</div>
      </div>

      <Canvas
        camera={{ position: [0, 0, 4.2], fov: 60 }}
        gl={{ antialias: false, toneMapping: THREE.NoToneMapping }}
      >
        <color attach="background" args={['#000000']} />
        <OrbitControls enableZoom={true} enablePan={false} />

        <HandControlledScene handData={handData}>
          <GlowingCore audioLevel={audioLevel} theme={theme} />
          <OrbitalRings audioLevel={audioLevel} theme={theme} />
          <RingParticles audioLevel={audioLevel} theme={theme} />
          <FreeFloatingParticles circleTexture={circleTexture} theme={theme} />
        </HandControlledScene>

        <EffectComposer>
          <Bloom
            intensity={1.8}
            luminanceThreshold={0.85}
            luminanceSmoothing={0.9}
            mipmapBlur={false}
          />
        </EffectComposer>
      </Canvas>
    </div>
  );
}