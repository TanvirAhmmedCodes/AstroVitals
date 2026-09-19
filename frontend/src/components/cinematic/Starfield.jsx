import React, { useEffect, useRef } from 'react';

export default function Starfield({ opacity = 0.15 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Initialize ~200 stars across 3 parallax depth layers
    const starCount = 200;
    const stars = Array.from({ length: starCount }).map(() => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 1.4 + 0.4,
      layer: Math.floor(Math.random() * 3) + 1, // 1, 2, or 3
      alpha: Math.random() * 0.7 + 0.3,
      twinkleSpeed: (Math.random() * 0.02 + 0.005) * (Math.random() > 0.5 ? 1 : -1),
    }));

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw faint nebula background glow
      const grad1 = ctx.createRadialGradient(
        canvas.width * 0.15,
        canvas.height * 0.15,
        10,
        canvas.width * 0.15,
        canvas.height * 0.15,
        canvas.width * 0.45
      );
      grad1.addColorStop(0, 'rgba(11, 61, 145, 0.08)');
      grad1.addColorStop(1, 'transparent');
      ctx.fillStyle = grad1;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const grad2 = ctx.createRadialGradient(
        canvas.width * 0.85,
        canvas.height * 0.85,
        10,
        canvas.width * 0.85,
        canvas.height * 0.85,
        canvas.width * 0.4
      );
      grad2.addColorStop(0, 'rgba(124, 58, 237, 0.05)');
      grad2.addColorStop(1, 'transparent');
      ctx.fillStyle = grad2;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Render & drift stars
      for (const star of stars) {
        // Subtle drift based on depth layer
        const speed = star.layer * 0.08;
        star.y -= speed * 0.4;
        star.x -= speed * 0.2;

        if (star.y < 0) {
          star.y = canvas.height;
          star.x = Math.random() * canvas.width;
        }
        if (star.x < 0) {
          star.x = canvas.width;
        }

        // Twinkle
        star.alpha += star.twinkleSpeed;
        if (star.alpha > 1 || star.alpha < 0.2) {
          star.twinkleSpeed = -star.twinkleSpeed;
        }

        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(232, 237, 245, ${star.alpha * opacity})`;
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, [opacity]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity }}
    />
  );
}
