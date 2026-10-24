import React, { useEffect, useRef } from 'react';

interface UltronAuraVisualizerProps {
  isListening?: boolean;
  audioLevel?: number; // 0 to 1 value (mic stream ya simulated)
  size?: number;
}

export const UltronAuraVisualizer: React.FC<UltronAuraVisualizerProps> = ({
  isListening = true,
  audioLevel = 0.2,
  size = 420,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let time = 0;

    const render = () => {
      ctx.clearRect(0, 0, size, size);

      const centerX = size / 2;
      const centerY = size / 2;
      const baseRadius = size * 0.28;

      const energy = isListening ? 1 + audioLevel * 1.8 : 0.4;
      time += 0.02 * (isListening ? 1.2 : 0.5);

      // Layered fluid plasma ribbons (Blue & Cyan Glowing Aura)
      const layers = [
        { color: 'rgba(0, 210, 255, 0.45)', blur: 24, offset: 0, amp: 24 },
        { color: 'rgba(30, 144, 255, 0.55)', blur: 32, offset: 1.5, amp: 28 },
        { color: 'rgba(0, 255, 230, 0.35)', blur: 16, offset: 3.0, amp: 20 },
        { color: 'rgba(64, 100, 245, 0.60)', blur: 42, offset: 4.5, amp: 32 },
      ];

      ctx.save();
      ctx.globalCompositeOperation = 'screen';

      layers.forEach((layer) => {
        ctx.save();
        ctx.filter = `blur(${layer.blur}px)`;
        ctx.strokeStyle = layer.color;
        ctx.lineWidth = 16 + audioLevel * 14;
        ctx.beginPath();

        const points = 72;
        for (let i = 0; i <= points; i++) {
          const angle = (i / points) * Math.PI * 2;
          
          // Organic fluid wave math
          const wave =
            Math.sin(angle * 3 + time + layer.offset) * (layer.amp * 0.5) +
            Math.cos(angle * 2 - time * 0.8 + layer.offset) * (layer.amp * 0.4) +
            Math.sin(angle * 5 + time * 1.5) * (layer.amp * 0.2);

          const r = baseRadius + wave * energy;
          const x = centerX + Math.cos(angle) * r;
          const y = centerY + Math.sin(angle) * r;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }

        ctx.closePath();
        ctx.stroke();
        ctx.restore();
      });

      ctx.restore();

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animationId);
  }, [isListening, audioLevel, size]);

  return (
    <div className="relative flex items-center justify-center bg-black rounded-full overflow-hidden shadow-2xl">
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        style={{ width: size, height: size }}
      />
    </div>
  );
};

export default UltronAuraVisualizer;