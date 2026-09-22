"use client";

import { useEffect, useState, useRef } from "react";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import styles from "./GlobalFootprint.module.css";

interface Location {
  name: string;
  x: number; // percentage X
  y: number; // percentage Y
  description: string;
}

const locations: Location[] = [
  { name: "Puerto Rico", x: 28, y: 50, description: "Artist Bookings & Regional Collaborations" },
  { name: "Spain", x: 45, y: 40, description: "International Live Concerts & Arena Shows" },
  { name: "Bahrain", x: 57.5, y: 47, description: "Elite Showcases & Luxury Concert Series" },
  { name: "Qatar", x: 58.5, y: 50, description: "Stadium Concerts & International Festivals" },
  { name: "UAE", x: 60, y: 51, description: "Mega Festivals & Large Scale Productions" },
  { name: "Saudi Arabia", x: 57.5, y: 53.5, description: "Exclusive Cultural Events & Heritage Shows" },
  { name: "India", x: 64.7, y: 54.5, description: "Global HQ & Nationwide Event Production Hub" },
  { name: "Thailand", x: 71.5, y: 56, description: "Regional Festivals & Cultural Showcases" },
  { name: "Singapore", x: 71.5, y: 61.5, description: "Asia-Pacific Tours & Brand Collaborations" },
  { name: "Malaysia", x: 74, y: 61.5, description: "Concert Tours & Live Entertainment" },
  { name: "Australia", x: 78.7, y: 77.2, description: "Multi-City Arena & Stadium Tours" },
];

export function GlobalFootprint({ data }: { data?: { image: string } }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [hasEntered, setHasEntered] = useState(false);

  const sectionRef = useRef<HTMLElement>(null);
  const mapScrollRef = useRef<HTMLDivElement>(null);

  // Viewport observer to trigger the cinematic entrance sequence
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasEntered(true);
        } else {
          setHasEntered(false);
        }
      },
      { threshold: 0.15 }
    );
    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }
    return () => observer.disconnect();
  }, []);

  // Coordinated auto-tour animation loop
  useEffect(() => {
    if (!hasEntered) return;

    // Delay start of the auto tour until the cascading pins finish dropping (approx 3 seconds)
    const tourTimeout = setTimeout(() => {
      const interval = setInterval(() => {
        setActiveIndex((prev) => (prev + 1) % locations.length);
      }, 5000);
      return () => clearInterval(interval);
    }, 3000);

    return () => clearTimeout(tourTimeout);
  }, [hasEntered]);

  // Handle center scroll on mobile
  useEffect(() => {
    if (mapScrollRef.current && window.innerWidth < 768) {
      const scrollContainer = mapScrollRef.current;
      const scrollTarget = scrollContainer.scrollWidth * 0.12;
      scrollContainer.scrollLeft = scrollTarget;
    }
  }, []);

  // Generate curved path
  const getArcPath = (target: Location) => {
    const hub = locations.find((l) => l.name === "India") || locations[7];

    const x1 = (hub.x / 100) * 1582;
    const y1 = (hub.y / 100) * 796;
    const x2 = (target.x / 100) * 1582;
    const y2 = (target.y / 100) * 796;

    const dx = x2 - x1;
    const dy = y2 - y1;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 10) return "";

    const mx = (x1 + x2) / 2;
    const my = (y1 + y2) / 2;
    const arcHeight = dist * 0.18;
    const cx = mx;
    const cy = my - arcHeight;

    return `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`;
  };

  const activeTooltipIndex = hoveredIndex !== null ? hoveredIndex : activeIndex;

  return (
    <section className={styles.section} ref={sectionRef} id="global-footprint">
      <div className={styles.container}>
        <ScrollReveal direction="up">
          <h2 className={styles.title}>
            OUR GLOBAL <span className={styles.goldText}>FOOTPRINT</span>
          </h2>
          <p className={styles.subcopy}>
            Creating impact across borders and stages worldwide.
          </p>
        </ScrollReveal>

        {/* Mobile Swipe Hint */}
        <div className={styles.swipeHint}>
          <span>← Swipe to explore the map →</span>
        </div>

        <div className={styles.mapViewport} ref={mapScrollRef}>
          <div className={`${styles.mapWrapper} ${hasEntered ? styles.mapEntered : ""}`}>
            {/* World Map Image */}
            <img
              src={data?.image || "/assets/hero/global-map.webp"}
              alt="Global Footprint Map"
              className={styles.mapImage}
              loading="lazy"
              decoding="async"
            />

            {/* SVG Connection Lines Overlay */}
            <svg className={styles.svgOverlay} viewBox="0 0 1582 796">
              <defs>
                <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#E4C057" stopOpacity="0.1" />
                  <stop offset="50%" stopColor="#E4C057" stopOpacity="1" />
                  <stop offset="100%" stopColor="#d4af37" stopOpacity="0.1" />
                </linearGradient>
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Draw connection paths */}
              {hasEntered && locations.map((loc, idx) => {
                if (loc.name === "India") return null;
                const pathData = getArcPath(loc);
                const isActive = activeIndex === idx;

                return (
                  <g key={idx}>
                    {/* Base faint gold guide-line */}
                    <path
                      d={pathData}
                      className={styles.baseArc}
                    />

                    {/* Shooting light beam pulse */}
                    <path
                      d={pathData}
                      className={`${styles.activeArc} ${isActive ? styles.animateArc : ""}`}
                      filter="url(#glow)"
                    />
                  </g>
                );
              })}
            </svg>

            {/* Interactive Pins & Hotspots */}
            {locations.map((loc, idx) => {
              const isActive = activeTooltipIndex === idx;
              const isActualActive = activeIndex === idx;
              const isHub = loc.name === "India";

              return (
                <div
                  key={idx}
                  className={`${styles.pinContainer} ${isHub ? styles.hubContainer : ""} ${hasEntered ? styles.entrancePin : ""
                    }`}
                  style={{
                    left: `${loc.x}%`,
                    top: `${loc.y}%`,
                    animationDelay: `${idx * 0.18}s`,
                    zIndex: isActive ? 100 : (isHub ? 10 : 5)
                  }}
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  onClick={() => setActiveIndex(idx)}
                >
                  {/* Glowing Radar Ring */}
                  <span className={`${styles.radarRing} ${isActualActive ? styles.pulseRadar : ""}`} />

                  {/* Interactive Map Pin Icon */}
                  <svg
                    viewBox="0 0 24 24"
                    className={`${styles.svgPin} ${isActive ? styles.svgPinActive : ""} ${isHub ? styles.svgPinHub : ""}`}
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
                      fill="url(#goldGradient)"
                      stroke="rgba(255,255,255,0.8)"
                      strokeWidth="0.5"
                    />
                    <circle cx="12" cy="9" r="3.5" fill="#ffffff" />
                  </svg>

                  {/* Tooltip Popup (Glassmorphic) */}
                  <div className={`${styles.tooltip} ${isActive ? styles.tooltipVisible : ""}`}>
                    <div className={styles.tooltipHeader}>
                      <h4 className={styles.tooltipTitle}>{loc.name}</h4>
                    </div>
                    <div className={styles.tooltipArrow} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
