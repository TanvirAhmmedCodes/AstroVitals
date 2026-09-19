import React, { useState, useEffect, useRef } from 'react';

/**
 * VideoBackground — High-performance NASA Public Domain video background.
 *
 * Features:
 * - Lazy load via IntersectionObserver (plays only when in viewport)
 * - Auto-pauses when scrolled off-screen to conserve GPU/CPU
 * - Poster image loaded instantly with loading="lazy"
 * - Graceful fallback to cosmic gradient mesh on error
 * - Mobile responsive: renders static poster on screens <640px for battery & speed
 *
 * Made by MD Tanvir Ahmmed · Team Orbitrix · NASA Space Apps Challenge 2026
 */
export default function VideoBackground({
  src,
  poster,
  opacity = 0.25,
  className = '',
  overlay = true,
  loop = true,
  allowMobileVideo = false,
}) {
  const containerRef = useRef(null);
  const videoRef = useRef(null);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile screen size on mount
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile, { passive: true });
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Viewport intersection observer to play/pause video
  useEffect(() => {
    if (!containerRef.current || (isMobile && !allowMobileVideo)) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
        if (videoRef.current) {
          if (entry.isIntersecting) {
            videoRef.current.play().catch(() => {});
          } else {
            videoRef.current.pause();
          }
        }
      },
      { threshold: 0.15 }
    );

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [isMobile, allowMobileVideo]);

  if (hasError) {
    return (
      <div
        className={`absolute inset-0 bg-gradient-to-b from-[#0B3D91]/20 via-[#070B14] to-[#030509] pointer-events-none ${className}`}
        style={{ opacity }}
      />
    );
  }

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 overflow-hidden pointer-events-none select-none -z-10 ${className}`}
    >
      {/* Mobile-optimized static poster image */}
      {isMobile && !allowMobileVideo ? (
        <img
          src={poster}
          alt="NASA Mission Visual"
          loading="lazy"
          className="w-full h-full object-cover transition-opacity duration-700"
          style={{ opacity }}
        />
      ) : (
        /* Video Element for Tablet & Desktop */
        <video
          ref={videoRef}
          autoPlay
          muted
          loop={loop}
          playsInline
          preload="metadata"
          poster={poster}
          onError={() => setHasError(true)}
          className="w-full h-full object-cover transition-opacity duration-700"
          style={{ opacity }}
        >
          {src && <source src={src} type="video/mp4" />}
        </video>
      )}

      {/* Dark Gradient Overlay for text contrast & legibility */}
      {overlay && (
        <div className="absolute inset-0 bg-gradient-to-t from-[#030509] via-[#030509]/60 to-[#030509]/80 pointer-events-none" />
      )}
    </div>
  );
}
