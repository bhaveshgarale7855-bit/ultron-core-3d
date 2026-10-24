
import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';

const THEMES = {
  blue: { name: 'STRONG SIGNAL', core: '#00d2ff', outer: [0, 1.5, 3], ring: [0.2, 5, 10], auraColors: ['#00d2ff', '#0077ff', '#00f0ff', '#1a36ff'] },
  gold: { name: 'MEDIUM SIGNAL', core: '#ffaa00', outer: [3, 0.8, 0], ring: [10, 8.5, 0.8], auraColors: ['#ffaa00', '#ff6600', '#ffd700', '#cc3300'] },
  red: { name: 'WEAK / NO SIGNAL', core: '#ff0033', outer: [3, 0, 0.2], ring: [10, 0.5, 0.5], auraColors: ['#ff0055', '#ff0033', '#990022', '#ff3366'] }
};

let isAISpeaking = false;
let globalRecognition = null;

// ==========================================
// SYNTHETIC SCI-FI SFX ENGINE
// ==========================================
function playSciFiSound(type) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;

    if (type === 'POWER_UP') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(80, now);
      osc.frequency.exponentialRampToValueAtTime(600, now + 0.4);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
      osc.start(now);
      osc.stop(now + 0.5);
    } else if (type === 'BEEP_LOCK') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, now);
      osc.frequency.setValueAtTime(1800, now + 0.08);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);
      osc.start(now);
      osc.stop(now + 0.18);
    } else if (type === 'SWIPE') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.2);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);
      osc.start(now);
      osc.stop(now + 0.22);
    }
  } catch (e) {
    console.warn("SFX error:", e);
  }
}

function speakAI(text) {
  if (!('speechSynthesis' in window)) return;

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);

  // Check karo ki text Devanagari Hindi hai ya English/Roman
  const isHindiScript = /[\u0900-\u097F]/.test(text);

  utterance.lang = isHindiScript ? 'hi-IN' : 'en-IN';
  utterance.rate = 1.0;
  utterance.pitch = 0.95;

  const voices = window.speechSynthesis.getVoices();

  let selectedVoice = null;
  if (isHindiScript) {
    selectedVoice = voices.find((v) => v.lang.includes('hi') || v.name.toLowerCase().includes('hindi'));
  } else {
    selectedVoice = voices.find((v) => v.lang === 'en-IN' || v.name.toLowerCase().includes('india'));
  }

  // Fallback to any default English voice agar specific Indian voice na mile
  if (!selectedVoice) {
    selectedVoice = voices.find((v) => v.lang.startsWith('en'));
  }

  if (selectedVoice) {
    utterance.voice = selectedVoice;
  }

  isAISpeaking = true;
  utterance.onend = () => { isAISpeaking = false; };
  utterance.onerror = () => { isAISpeaking = false; };

  window.speechSynthesis.speak(utterance);
}

// ==========================================
// REAL LLM ENGINE (GEMINI / FREE AI API)
// ==========================================
const AI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";

async function fetchAIResponse(userPrompt) {
  // Agar API key nahi dali toh fallback responses chalenge
// Agar API key empty ho ya set na ho
  if (!AI_API_KEY) {
    const prompt = userPrompt.toLowerCase();
    if (prompt.includes('time')) return `The time is ${new Date().toLocaleTimeString()}`;
    if (prompt.includes('who are you')) return "I am Ultron, an autonomous synthetic intelligence core.";
    return `Neural link active. State your full query, Boss.`;
  }
  
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${AI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `You are ULTRON, a concise, highly intelligent sci-fi AI assistant.
Language Rule:
- If user speaks in English, reply in English.
- If user speaks in Hindi or Hinglish, reply in Hinglish (Roman script Hindi) or crisp Hindi.
- Always match the user's language and tone automatically.
Constraint: Respond in 1 to 2 sharp, punchy sentences strictly meant for voice TTS. Never output markdown, asterisks (*), or bullet points.
User query: ${userPrompt}`
                }
              ]
            }
          ]
        })
      }
    );

    const data = await response.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;

    return reply ? reply.trim() : "Core subroutines were unable to parse that request.";
  } catch (error) {
    console.error("LLM Uplink Error:", error);
    return "Neural uplink connection timeout. Check your network or API status.";
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

// ==========================================
// 1. CLASSIC THREE.JS COMPONENTS
// ==========================================
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

// ==========================================
// 2. ULTRA RESPONSIVE SILK AURA (WITH HAND GESTURE CONTROL & HUD)
// ==========================================
function UltronAuraVisualizer({ audioLevel, handData, theme, isSpeaking }) {
  const canvasRef = useRef(null);

  const audioRef = useRef(audioLevel);
  const handRef = useRef(handData);
  const themeRef = useRef(theme);
  const speakingRef = useRef(isSpeaking);

  useEffect(() => { audioRef.current = audioLevel; }, [audioLevel]);
  useEffect(() => { handRef.current = handData; }, [handData]);
  useEffect(() => { themeRef.current = theme; }, [theme]);
  useEffect(() => { speakingRef.current = isSpeaking; }, [isSpeaking]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId;
    let time = 0;
    let rotationAngle = 0;

    let currentX = window.innerWidth / 2;
    let currentY = window.innerHeight / 2;
    let currentScale = 1.0;

    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      const width = window.innerWidth;
      const height = window.innerHeight;

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('orientationchange', resizeCanvas);

    const render = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      ctx.clearRect(0, 0, width, height);

      const currentAudio = audioRef.current || 0;
      const currentHand = handRef.current || { handX: 0, handY: 0, distance: 0.2, gesture: 'NONE' };
      const currentTheme = themeRef.current || {};
      const speaking = speakingRef.current;

      const isMobile = width < 640;

      // Center Magnetic Drift
      const targetX = width / 2 + (currentHand.handX || 0) * (isMobile ? 50 : 120);
      const targetY = height / 2 - (currentHand.handY || 0) * (isMobile ? 50 : 120);
      currentX += (targetX - currentX) * 0.08;
      currentY += (targetY - currentY) * 0.08;

      // GESTURE INFLUENCE ON SCALE
      let targetScale = Math.max(0.4, Math.min(2.2, (currentHand.distance || 0.2) * 5.5));
      if (currentHand.gesture === 'FIST') {
        targetScale = 0.35; // Dense compact lock
      } else if (currentHand.gesture === 'PALM') {
        targetScale = 1.8; // Expanded energy burst
      }
      currentScale += (targetScale - currentScale) * 0.12;

      const minDimension = Math.min(width, height);
      const baseRadius = minDimension * (isMobile ? 0.20 : 0.16) * currentScale;

      // High frequency jitter when AI is speaking
      const dynamicEnergy = speaking
        ? 2.2 + Math.sin(time * 20) * 0.8
        : 1.0 + currentAudio * 1.8;

      time += speaking ? 0.06 : 0.02;

      const baseSpeed = speaking ? 0.04 : 0.015;
      rotationAngle += baseSpeed + currentAudio * 0.03;

      let auraColors = currentTheme.auraColors || ['#00d2ff', '#0077ff', '#00f0ff', '#1a36ff'];
      if (currentHand.gesture === 'FIST') {
        auraColors = ['#ff0033', '#cc0022', '#ff3344', '#880011']; // Lock Red
      }

      const scaleMultiplier = isMobile ? 0.75 : 1.0;

      const ribbonLayers = [
        { color: auraColors[0], blur: 10 * scaleMultiplier, amp: 16 * scaleMultiplier, offset: 0, width: 8 * currentScale, dir: 1 },
        { color: auraColors[1], blur: 18 * scaleMultiplier, amp: 22 * scaleMultiplier, offset: 1.5, width: 11 * currentScale, dir: -0.7 },
        { color: auraColors[2], blur: 6 * scaleMultiplier, amp: 12 * scaleMultiplier, offset: 3.0, width: 6 * currentScale, dir: 1.3 },
        { color: auraColors[3], blur: 24 * scaleMultiplier, amp: 26 * scaleMultiplier, offset: 4.5, width: 13 * currentScale, dir: -1 }
      ];

      ctx.save();
      ctx.globalCompositeOperation = 'screen';

      ribbonLayers.forEach((layer) => {
        ctx.save();
        ctx.filter = `blur(${layer.blur}px)`;
        ctx.strokeStyle = layer.color;
        ctx.lineWidth = layer.width + (speaking ? 14 : currentAudio * (isMobile ? 6 : 10));
        ctx.beginPath();

        const segments = isMobile ? 80 : 120;
        for (let i = 0; i <= segments; i++) {
          const theta = (i / segments) * Math.PI * 2;
          const animatedTheta = theta + (rotationAngle * layer.dir);

          // High frequency spikes when AI speaks
          const waveHarmonics = speaking ? Math.sin(animatedTheta * 12 + time * 4) * 12 : 0;

          const wave =
            Math.sin(animatedTheta * 3 + layer.offset) * (layer.amp * 0.5) +
            Math.cos(animatedTheta * 2 - time + layer.offset) * (layer.amp * 0.35) +
            Math.sin(animatedTheta * 4 + time * 1.2) * (layer.amp * 0.2) +
            waveHarmonics;

          const r = baseRadius + wave * dynamicEnergy;
          const px = currentX + Math.cos(animatedTheta) * r;
          const py = currentY + Math.sin(animatedTheta) * r;

          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }

        ctx.closePath();
        ctx.stroke();
        ctx.restore();
      });

      ctx.restore();

      // HUD & GESTURE STATUS
      if (currentHand.handX !== 0 || currentHand.handY !== 0) {
        ctx.save();
        ctx.strokeStyle = auraColors[0];
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(currentX, currentY, 20, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = auraColors[0];
        ctx.font = 'bold 11px monospace';
        ctx.fillText(`MODE: ${currentHand.gesture} | ${Math.round(currentScale * 100)}%`, currentX + 28, currentY + 4);
        ctx.restore();
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('orientationchange', resizeCanvas);
    };
  }, []);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100dvh',
      overflow: 'hidden',
      pointerEvents: 'none',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1
    }}>
      <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />
    </div>
  );
}

// ==========================================
// HAND TRACKING CONTROLLER
// ==========================================
// ==========================================
// CLEAN HAND CONTROLLER (NO MOUSE CONTROL)
// ==========================================
function HandController({ onHandMove, onSignalChange, onGesture }) {
  const videoRef = useRef(null);
  const lastXRef = useRef(null);
  const lastSwipeTimeRef = useRef(0);

  useEffect(() => {
    let streamInstance = null;

    const initTracking = async () => {
      const HandsClass = window.Hands;
      if (!HandsClass || !videoRef.current) return;

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
          const score = results.multiHandedness?.[0]?.score || 0.8;

          const indexTip = landmarks[8];
          const thumbTip = landmarks[4];
          const wrist = landmarks[0];

          const handX = (0.5 - indexTip.x) * 3;
          const handY = (0.5 - indexTip.y) * 3;
          const distance = Math.hypot(indexTip.x - thumbTip.x, indexTip.y - thumbTip.y);

          // Gestures calculation
          const tips = [8, 12, 16, 20];
          const mcps = [5, 9, 13, 17];
          let openFingers = 0;

          for (let i = 0; i < 4; i++) {
            const tipDist = Math.hypot(landmarks[tips[i]].x - wrist.x, landmarks[tips[i]].y - wrist.y);
            const mcpDist = Math.hypot(landmarks[mcps[i]].x - wrist.x, landmarks[mcps[i]].y - wrist.y);
            if (tipDist > mcpDist * 1.25) openFingers++;
          }

          let detectedGesture = 'PINCH_TRACK';
          if (openFingers === 0) detectedGesture = 'FIST';
          else if (openFingers >= 4) detectedGesture = 'PALM';

          // Swipe detection
          const now = Date.now();
          if (lastXRef.current !== null && now - lastSwipeTimeRef.current > 700) {
            const deltaX = indexTip.x - lastXRef.current;
            if (deltaX > 0.22 && onGesture) {
              onGesture('SWIPE_RIGHT');
              lastSwipeTimeRef.current = now;
            } else if (deltaX < -0.22 && onGesture) {
              onGesture('SWIPE_LEFT');
              lastSwipeTimeRef.current = now;
            }
          }
          lastXRef.current = indexTip.x;

          if (onHandMove) onHandMove({ handX, handY, distance, gesture: detectedGesture });

          if (onSignalChange) {
            if (score >= 0.85) onSignalChange('blue');
            else if (score >= 0.6) onSignalChange('gold');
            else onSignalChange('red');
          }
        } else {
          // Haath nahi dikh raha toh center neutral state
          if (onSignalChange) onSignalChange('red');
          if (onHandMove) onHandMove({ handX: 0, handY: 0, distance: 0.2, gesture: 'NONE' });
        }
      });

      // Frame send loop
      const processFrame = async () => {
        if (videoRef.current && videoRef.current.readyState >= 2) {
          try {
            await hands.send({ image: videoRef.current });
          } catch (e) { }
        }
        requestAnimationFrame(processFrame);
      };
      requestAnimationFrame(processFrame);
    };

    initTracking();

    return () => {
      if (streamInstance) {
        streamInstance.getTracks().forEach((track) => track.stop());
      }
    };
  }, [onHandMove, onSignalChange, onGesture]);

  return (
    <video
      id="ultron-webcam-feed"
      ref={videoRef}
      style={{ display: 'none' }}
      playsInline
      muted
      autoPlay
    />
  );
}

// ==========================================
// 4. MAIN APP EXPORT
// ==========================================
export default function App() {
  const [uiMode, setUiMode] = useState('aura'); // 'aura' = reference visualizer, 'classic' = 3D Three.js
  const [audioLevel, setAudioLevel] = useState(0);
  const [speakingState, setSpeakingState] = useState(false);
  const [currentThemeKey, setCurrentThemeKey] = useState('red');
  const [handData, setHandData] = useState({ handX: 0, handY: 0, distance: 0.2 });
  const [lastHeardText, setLastHeardText] = useState('Click Core to Start...');
  const [isInitialized, setIsInitialized] = useState(false);

  const circleTexture = useMemo(() => createCircleTexture(), []);
  const theme = THEMES[currentThemeKey];


  const handleGesture = (gestureType) => {
    if (gestureType === 'SWIPE_RIGHT') {
      setCurrentThemeKey((prev) => (prev === 'blue' ? 'gold' : prev === 'gold' ? 'red' : 'blue'));
    } else if (gestureType === 'SWIPE_LEFT') {
      setCurrentThemeKey((prev) => (prev === 'red' ? 'gold' : prev === 'gold' ? 'blue' : 'red'));
    }
  };

  const handleCommand = async (cmd) => {
    if (isAISpeaking) return;
    const cleanCmd = cmd.trim();
    if (!cleanCmd || cleanCmd.length < 2) return;

    setLastHeardText(`Processing: "${cleanCmd}"...`);
    setSpeakingState(true);

    // Call real LLM
    const aiReply = await fetchAIResponse(cleanCmd);

    setLastHeardText(`Ultron: "${aiReply}"`);
    speakAI(aiReply);

    // AI voice khatam hone par visualizer reset
    const estimatedDuration = Math.max(1500, aiReply.length * 75);
    setTimeout(() => {
      setSpeakingState(false);
    }, estimatedDuration);
  };

  const startAudioAndSpeech = async () => {
    setIsInitialized(true);
    setLastHeardText("Requesting Permissions...");

    try {
      // 1. Direct User Permission Request for Both Mic and Camera
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      }).catch(async (mediaErr) => {
        console.warn("Camera/Mic combo failed, trying audio only fallback:", mediaErr);
        // Agar PC me camera nahi hai toh kam se kam mic access ho jaye
        return await navigator.mediaDevices.getUserMedia({ audio: true });
      });

      // Camera stream ko HandController ke video tag me link karna
      const videoElement = document.getElementById('ultron-webcam-feed');
      if (videoElement && stream.getVideoTracks().length > 0) {
        videoElement.srcObject = stream;
        await videoElement.play().catch(e => console.warn("Video play error:", e));
      }

      // Audio setup
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

      // Speech Recognition initialization
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        globalRecognition = new SpeechRecognition();
        globalRecognition.continuous = true;
        globalRecognition.interimResults = true;

        // 'en-IN' Indian English aur mixed Hindi/Hinglish dono capture karta hai
        globalRecognition.lang = 'en-IN';

        globalRecognition.onstart = () => {
          if (!isAISpeaking) setLastHeardText("🎤 Listening (Hindi / English)...");
        };

        globalRecognition.onresult = (event) => {
          if (isAISpeaking) return;
          let currentTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript;
          }
          const cleanText = currentTranscript.trim();
          setLastHeardText(`Heard: "${cleanText}"`);
          if (event.results[event.resultIndex].isFinal) {
            handleCommand(cleanText);
          }
        };

        globalRecognition.onerror = (err) => {
          console.warn("Speech Error:", err.error);
        };

        globalRecognition.onend = () => {
          if (!isAISpeaking) {
            setTimeout(() => {
              try { globalRecognition.start(); } catch (e) { }
            }, 1000);
          }
        };

        globalRecognition.start();
      }

      speakAI("All sensory systems online. Ready for command.");

    } catch (err) {
      setLastHeardText("Hardware Permission Denied!");
      console.error("Initialization Error:", err);
    }
  };

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#000000', position: 'relative', overflow: 'hidden' }}>

      <HandController onHandMove={setHandData} onSignalChange={setCurrentThemeKey} onGesture={handleGesture} />

      {/* START OVERLAY */}
      {!isInitialized && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0,0,0,0.88)',
          zIndex: 100,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <button
            onClick={startAudioAndSpeech}
            style={{
              padding: '16px 36px',
              fontSize: '17px',
              fontFamily: 'monospace',
              fontWeight: '900',
              color: '#00d2ff',
              backgroundColor: 'transparent',
              border: '2px solid #00d2ff',
              borderRadius: '12px',
              cursor: 'pointer',
              boxShadow: '0 0 25px rgba(0,210,255,0.4)',
              textTransform: 'uppercase',
              letterSpacing: '2px'
            }}
          >
            INITIALIZE ULTRON CORE
          </button>
        </div>
      )}

      {/* TOP LEFT STATUS BAR */}
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

      {/* TOP RIGHT UI SWITCH TOGGLE */}
      <div style={{
        position: 'absolute',
        top: '20px',
        right: '20px',
        zIndex: 20,
        display: 'flex',
        gap: '8px',
        background: 'rgba(15,23,42,0.85)',
        padding: '6px',
        borderRadius: '12px',
        border: '1px solid #1e293b'
      }}>
        <button
          onClick={() => setUiMode('classic')}
          style={{
            padding: '6px 14px',
            borderRadius: '8px',
            fontSize: '11px',
            fontWeight: 'bold',
            fontFamily: 'monospace',
            cursor: 'pointer',
            border: 'none',
            background: uiMode === 'classic' ? '#2563eb' : 'transparent',
            color: uiMode === 'classic' ? '#ffffff' : '#94a3b8'
          }}
        >
          3D CORE
        </button>

        <button
          onClick={() => setUiMode('aura')}
          style={{
            padding: '6px 14px',
            borderRadius: '8px',
            fontSize: '11px',
            fontWeight: 'bold',
            fontFamily: 'monospace',
            cursor: 'pointer',
            border: 'none',
            background: uiMode === 'aura' ? '#06b6d4' : 'transparent',
            color: uiMode === 'aura' ? '#000000' : '#94a3b8'
          }}
        >
          AURA NEON
        </button>
      </div>

      {/* CONDITIONAL RENDERING BASED ON MODE */}
      {uiMode === 'aura' ? (
        <UltronAuraVisualizer
          audioLevel={audioLevel}
          handData={handData}
          theme={theme}
          isSpeaking={speakingState}
        />
      ) : (
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
      )}

    </div>
  );
}