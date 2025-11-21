import { useEffect, useRef } from 'react';

export default function SilverGradient() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Canvas size adjustment
    function resizeCanvas() {
      if (!canvas) return;
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Animation parameters - MUCH FASTER and more dramatic
    let time = 0;
    const speed = 0.008; // 5x faster for more drama

    // Enhanced silver color palette with extreme light contrasts
    const silverColors = [
      { r: 140, g: 145, b: 150 },  // Darker silver for contrast
      { r: 180, g: 185, b: 190 },  // Mid-Silver
      { r: 210, g: 215, b: 220 },  // Light-Silver
      { r: 235, g: 240, b: 245 },  // Very light
      { r: 255, g: 255, b: 255 },  // Pure White - bright light
      { r: 255, g: 255, b: 255 },  // Pure White - sustained
      { r: 255, g: 255, b: 255 },  // Pure White - peak brightness
      { r: 250, g: 252, b: 255 },  // Slight blue tint
      { r: 240, g: 245, b: 250 },  // Almost White
      { r: 220, g: 225, b: 230 },  // Light
      { r: 190, g: 195, b: 200 },  // Mid-Light
      { r: 160, g: 165, b: 170 },  // Mid-Dark for depth
    ];

    function getColorAtTime(t: number, offset: number) {
      const wave = Math.sin(t + offset) * 0.5 + 0.5;
      const index = wave * (silverColors.length - 1);
      const i1 = Math.floor(index);
      const i2 = Math.min(i1 + 1, silverColors.length - 1);
      const factor = index - i1;

      const c1 = silverColors[i1];
      const c2 = silverColors[i2];

      return {
        r: c1.r + (c2.r - c1.r) * factor,
        g: c1.g + (c2.g - c1.g) * factor,
        b: c1.b + (c2.b - c1.b) * factor
      };
    }

    let animationId: number;

    function animate() {
      if (!canvas || !ctx) return;

      time += speed;

      // Clear with subtle base color
      ctx.fillStyle = 'rgba(245, 245, 245, 0.3)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Multiple moving gradients - DRAMATIC movement
      const numGradients = 10; // More gradients for complexity

      for (let g = 0; g < numGradients; g++) {
        const angle = time * (2.5 + g * 0.8) + (g * Math.PI / 3); // Much faster rotation
        const radius = Math.min(canvas.width, canvas.height) * 2;

        const x1 = canvas.width / 2 + Math.cos(angle) * radius;
        const y1 = canvas.height / 2 + Math.sin(angle) * radius;
        const x2 = canvas.width / 2 - Math.cos(angle) * radius;
        const y2 = canvas.height / 2 - Math.sin(angle) * radius;

        const gradient = ctx.createLinearGradient(x1, y1, x2, y2);

        // More stops for smoother, more dramatic transitions
        const numStops = 50;
        for (let i = 0; i <= numStops; i++) {
          const stop = i / numStops;
          // EXTREME wave movement for dramatic light effects
          const color = getColorAtTime(time * 6, stop * Math.PI * 5 + g * 2);
          const alpha = 0.5 + (Math.sin(time * 8 + g * 1.5) * 0.4); // Higher alpha for more visible light
          gradient.addColorStop(stop, `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`);
        }

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // Radial waves with EXTREME dramatic light beams
      for (let i = 0; i < 8; i++) {
        const offsetX = Math.sin(time * (3 + i * 0.8)) * canvas.width * 0.5; // Bigger movements
        const offsetY = Math.cos(time * (3.5 + i * 0.6)) * canvas.height * 0.5;

        const radial = ctx.createRadialGradient(
          canvas.width / 2 + offsetX,
          canvas.height / 2 + offsetY,
          0,
          canvas.width / 2 + offsetX,
          canvas.height / 2 + offsetY,
          Math.max(canvas.width, canvas.height) * (0.6 + i * 0.3)
        );

        // EXTREME contrast - bright center, dark edges for light beam effect
        const centerColor = getColorAtTime(time * 5, i * Math.PI * 1.2);
        const edgeColor = getColorAtTime(time * 5 + Math.PI * 2, i * Math.PI * 1.2);

        radial.addColorStop(0, `rgba(${centerColor.r}, ${centerColor.g}, ${centerColor.b}, 0.8)`); // Very bright center
        radial.addColorStop(0.4, `rgba(${centerColor.r}, ${centerColor.g}, ${centerColor.b}, 0.4)`);
        radial.addColorStop(0.7, `rgba(${edgeColor.r}, ${edgeColor.g}, ${edgeColor.b}, 0.3)`);
        radial.addColorStop(1, `rgba(${edgeColor.r}, ${edgeColor.g}, ${edgeColor.b}, 0)`);

        ctx.fillStyle = radial;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // INTENSE pulsating light spots with dramatic flashes
      for (let i = 0; i < 8; i++) {
        const pulse = (Math.sin(time * 7 + i * Math.PI * 0.7) + 1) / 2; // Faster pulsing
        const x = canvas.width * (0.1 + i * 0.12 + Math.cos(time * 2 + i) * 0.15);
        const y = canvas.height * (0.2 + Math.sin(time * 2.5 + i) * 0.6);

        const spot = ctx.createRadialGradient(x, y, 0, x, y, 300 + pulse * 400);

        // EXTREME bright flashes for dramatic light effects
        const spotColor = getColorAtTime(time * 8, i * Math.PI * 1.8);
        const brightness = 0.9 * pulse; // Very bright when pulsing
        spot.addColorStop(0, `rgba(${spotColor.r}, ${spotColor.g}, ${spotColor.b}, ${brightness})`);
        spot.addColorStop(0.3, `rgba(${spotColor.r}, ${spotColor.g}, ${spotColor.b}, ${brightness * 0.6})`);
        spot.addColorStop(0.6, `rgba(${spotColor.r}, ${spotColor.g}, ${spotColor.b}, ${brightness * 0.3})`);
        spot.addColorStop(1, `rgba(${spotColor.r}, ${spotColor.g}, ${spotColor.b}, 0)`);

        ctx.fillStyle = spot;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // Additional sweeping light beams for extra drama
      for (let i = 0; i < 4; i++) {
        const sweepAngle = time * (4 + i * 0.5) + i * Math.PI / 2;
        const beamLength = Math.max(canvas.width, canvas.height) * 2;

        const beamX1 = canvas.width / 2;
        const beamY1 = canvas.height / 2;
        const beamX2 = beamX1 + Math.cos(sweepAngle) * beamLength;
        const beamY2 = beamY1 + Math.sin(sweepAngle) * beamLength;

        const beam = ctx.createLinearGradient(beamX1, beamY1, beamX2, beamY2);
        const beamColor = getColorAtTime(time * 6, i * Math.PI);

        beam.addColorStop(0, `rgba(${beamColor.r}, ${beamColor.g}, ${beamColor.b}, 0.7)`);
        beam.addColorStop(0.3, `rgba(${beamColor.r}, ${beamColor.g}, ${beamColor.b}, 0.4)`);
        beam.addColorStop(1, `rgba(${beamColor.r}, ${beamColor.g}, ${beamColor.b}, 0)`);

        ctx.fillStyle = beam;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      animationId = requestAnimationFrame(animate);
    }

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ zIndex: 0 }}
    />
  );
}
