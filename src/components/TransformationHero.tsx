/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect, useRef } from "react";
import { Volume2, VolumeX } from "lucide-react";
import styles from "./TransformationHero.module.css";

interface TransformationHeroProps {
  data?: {
    desktopVideoUrl?: string;
    mobileVideoUrl?: string;
    fallbackImage?: string;
  };
}

import { getDirectVideoUrl } from "@/utils/video";

const TransformationHero = ({ data }: TransformationHeroProps) => {
  const [isSplit, setIsSplit] = useState(false);
  const [isMuted, setIsMuted] = useState(false); // Auto-play requires mute initially
  const [isMobile, setIsMobile] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLElement>(null);

  const rawVideoUrl = (isMobile && data?.mobileVideoUrl ? data.mobileVideoUrl : data?.desktopVideoUrl) || "/assets/hero/Intro AV.mp4";
  const videoSrc = getDirectVideoUrl(rawVideoUrl);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Play video only after animation completes (isSplit becomes true)
  useEffect(() => {
    if (isSplit && videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(err => console.log("Play prevented:", err));
    }
  }, [isSplit]);


  useEffect(() => {
    // Prevent browser from restoring previous scroll position on reload
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }

    // Force scroll to top immediately on load
    window.scrollTo(0, 0);

    const splitTimer = setTimeout(() => {
      setIsSplit(true);
    }, 3800);

    return () => clearTimeout(splitTimer);
  }, []);

  useEffect(() => {
    // Strictly lock scroll while the animation is active
    if (!isSplit) {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
      // Prevent mobile touch scrolling
      document.body.style.touchAction = "none";
      document.body.classList.add("hero-animating");
    } else {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
      document.body.style.touchAction = "";
      document.body.classList.remove("hero-animating");
    }

    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
      document.body.style.touchAction = "";
      document.body.classList.remove("hero-animating");
    };
  }, [isSplit]);

  // Ref to the right panel DOM element so we can mutate style directly (no React re-render)
  const rightPanelRef = useRef<HTMLDivElement>(null);
  const isPastThresholdRef = useRef(false);
  const isMutedRef = useRef(true);

  // Scroll handler: direct DOM mutation only — zero React setState during scroll
  useEffect(() => {
    if (!isSplit) return; // Don't attach until hero animation is done

    let rafId: number | null = null;

    const handleScroll = () => {
      if (rafId !== null) return; // Already scheduled
      rafId = window.requestAnimationFrame(() => {
        rafId = null;
        const heroHeight = containerRef.current?.offsetHeight || window.innerHeight;
        const scrolled = window.scrollY;
        const threshold = heroHeight * 0.8;
        const isPast = scrolled > threshold;

        if (isPast && !isPastThresholdRef.current) {
          isPastThresholdRef.current = true;
          // Mute + pause video — direct DOM, no setState
          if (videoRef.current) {
            if (!videoRef.current.paused) videoRef.current.pause();
            if (!isMutedRef.current) {
              videoRef.current.muted = true;
              isMutedRef.current = true;
              setIsMuted(true); // Only setState for UI button icon — acceptable, rare
            }
          }
          // Hide right panel via direct style — no React re-render
          if (rightPanelRef.current) {
            rightPanelRef.current.style.opacity = '0';
            rightPanelRef.current.style.pointerEvents = 'none';
          }
        } else if (!isPast && isPastThresholdRef.current) {
          isPastThresholdRef.current = false;
          // Resume video
          if (videoRef.current && videoRef.current.paused) {
            videoRef.current.play().catch(() => { });
          }
          // Show right panel
          if (rightPanelRef.current) {
            rightPanelRef.current.style.opacity = '';
            rightPanelRef.current.style.pointerEvents = '';
          }
        }
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [isSplit]);

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  return (
    <section ref={containerRef} className={`${styles.heroContainer} ${isSplit ? styles.split : ""}`}>

      {/* Left Panel: Cream background, holds the typography */}
      <div className={styles.leftPanel}>
        <div className={styles.ambientOrb2}></div>
        <div className={styles.splashTextContainer}>
          <h2 className={styles.splashText}>
            <div>
              <span className={`${styles.splashWord} ${styles.wordWe}`}>WE</span>{" "}
              <span className={`${styles.splashWord} ${styles.wordAre}`}>ARE</span>
            </div>
            <div className={`${styles.splashWord} ${styles.splashLogoWrapper}`}>
              <img src="/assets/hero/logo.png" alt="22nd Avenue Logo" className={styles.splashLogo} />
            </div>
          </h2>
        </div>
      </div>

      {/* Right Panel: Showcase Reel */}
      <div
        ref={rightPanelRef}
        className={styles.rightPanel}
      >
        <div className={styles.videoContainer}>
          <video
            key={videoSrc}
            ref={videoRef}
            src={videoSrc}
            poster={data?.fallbackImage}
            className={styles.showcaseVideo}
            loop
            muted={isMuted}
            playsInline
          />
        </div>

        <div className={styles.overlay} />

        {/* Video Controls Overlay */}
        <div className={styles.videoControls}>
          <button onClick={toggleMute} className={styles.controlBtn} aria-label="Toggle Mute">
            {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>
        </div>
      </div>

    </section>
  );
};

export default TransformationHero;
