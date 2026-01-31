'use client';

import { useEffect, useRef, useState } from 'react';

interface AudioWaveformProps {
  isActive?: boolean;
  className?: string;
}

export default function AudioWaveform({ isActive = false, className = '' }: AudioWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [animationFrame, setAnimationFrame] = useState<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth || 400;
      canvas.height = canvas.offsetHeight || 128;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const centerY = canvas.height / 2;
    const barCount = 50;
    const barWidth = canvas.width / barCount;
    const maxBarHeight = canvas.height * 0.6;

    let phase = 0;
    let frameId: number | null = null;

    const draw = () => {
      // Recalculate dimensions in case canvas was resized
      const currentBarWidth = canvas.width / barCount;
      const currentMaxBarHeight = canvas.height * 0.6;
      const currentCenterY = canvas.height / 2;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (isActive) {
        for (let i = 0; i < barCount; i++) {
          const x = i * currentBarWidth + currentBarWidth / 2;
          
          // Créer des vagues avec différentes fréquences pour un effet dynamique
          const wave1 = Math.sin((i * 0.1) + phase) * 0.5 + 0.5;
          const wave2 = Math.sin((i * 0.15) + phase * 1.2) * 0.3 + 0.5;
          const wave3 = Math.sin((i * 0.2) + phase * 0.8) * 0.2 + 0.5;
          
          const combinedWave = (wave1 + wave2 + wave3) / 3;
          const barHeight = combinedWave * currentMaxBarHeight;

          // Créer un gradient pour chaque barre
          const gradient = ctx.createLinearGradient(x - currentBarWidth / 2, currentCenterY - barHeight / 2, x + currentBarWidth / 2, currentCenterY + barHeight / 2);
          
          // Couleurs dynamiques basées sur la position et l'activité
          const hue = (i / barCount) * 360 + phase * 50;
          gradient.addColorStop(0, `hsla(${hue % 360}, 70%, 60%, 0.8)`);
          gradient.addColorStop(0.5, `hsla(${(hue + 60) % 360}, 80%, 70%, 0.9)`);
          gradient.addColorStop(1, `hsla(${(hue + 120) % 360}, 70%, 60%, 0.8)`);

          ctx.fillStyle = gradient;
          ctx.fillRect(x - currentBarWidth / 2 + 1, currentCenterY - barHeight / 2, currentBarWidth - 2, barHeight);
        }
        phase += 0.1;
      } else {
        // État inactif - barres statiques plus petites
        for (let i = 0; i < barCount; i++) {
          const x = i * currentBarWidth + currentBarWidth / 2;
          const baseHeight = currentMaxBarHeight * 0.2;
          const variation = Math.sin(i * 0.2) * baseHeight * 0.3;
          const barHeight = baseHeight + variation;

          const gradient = ctx.createLinearGradient(x - currentBarWidth / 2, currentCenterY - barHeight / 2, x + currentBarWidth / 2, currentCenterY + barHeight / 2);
          gradient.addColorStop(0, 'hsla(240, 50%, 50%, 0.3)');
          gradient.addColorStop(1, 'hsla(280, 50%, 50%, 0.3)');

          ctx.fillStyle = gradient;
          ctx.fillRect(x - currentBarWidth / 2 + 1, currentCenterY - barHeight / 2, currentBarWidth - 2, barHeight);
        }
      }

      frameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (frameId !== null) {
        cancelAnimationFrame(frameId);
      }
    };
  }, [isActive]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ width: '100%', height: '100%' }}
    />
  );
}
