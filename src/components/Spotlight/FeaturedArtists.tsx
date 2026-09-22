/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useRef } from "react";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { ChevronLeft, ChevronRight } from "lucide-react";
import styles from "./FeaturedArtists.module.css";
import imageUrlBuilder from "@sanity/image-url";
import { client } from "@/sanity/client";

interface FeaturedArtistsProps {
  data?: {
    artists: {
      name: string;
      image: any;
      link?: string;
    }[];
  };
}

const builder = imageUrlBuilder(client);

function getImageUrl(imageSource: any) {
  if (!imageSource) return "";
  if (typeof imageSource === "string") return imageSource;
  try {
    // Generate cropped image URL that respects hotspot coordinates
    return builder.image(imageSource).width(400).height(500).fit("crop").auto("format").quality(75).url();
  } catch (err) {
    console.error("Error building image URL:", err);
    return "";
  }
}

const DEFAULT_ARTISTS = [
  { name: "Artful Dodger", image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=600&auto=format&fit=crop" },
  { name: "Bryson Tiller", image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=600&auto=format&fit=crop" },
  { name: "Chris Brown", image: "https://images.unsplash.com/photo-1521119989659-a83eee488004?q=80&w=600&auto=format&fit=crop" },
  { name: "DJ Snoopadelic", image: "https://images.unsplash.com/photo-1552374196-c4e7ffc6e126?q=80&w=600&auto=format&fit=crop" },
  { name: "Fetty Wap", image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=600&auto=format&fit=crop" },
  { name: "J & The Rest", image: "https://images.unsplash.com/photo-1531384441138-2736e62e0919?q=80&w=600&auto=format&fit=crop" },
  { name: "MIGOS", image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=600&auto=format&fit=crop" },
  { name: "Paris Hilton", image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=600&auto=format&fit=crop" },
  { name: "Amber Davies", image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=600&auto=format&fit=crop" },
  { name: "Future", image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=600&auto=format&fit=crop" }
];

export function FeaturedArtists({ data }: FeaturedArtistsProps) {
  const baseArtists = data?.artists?.length ? data.artists : DEFAULT_ARTISTS;

  const allArtists = baseArtists.map((artist, idx) => ({
    ...artist,
    uniqueKey: `${artist.name}-${idx}`
  }));


  const ITEMS_PER_SLIDE = 10;
  const totalSlides = Math.max(1, Math.ceil(allArtists.length / ITEMS_PER_SLIDE));

  const [currentSlide, setCurrentSlide] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);

  const scrollToTop = () => {
    if (!sectionRef.current) return;
    const y = sectionRef.current.getBoundingClientRect().top + window.scrollY;
    if (window.innerWidth <= 768) {
      // Phone: smooth scroll to section top for a polished feel
      window.scrollTo({ top: y, behavior: "smooth" });
    } else if (window.innerWidth <= 1024) {
      // Tablet: instant to avoid sticky hero compositor flicker
      window.scrollTo({ top: y, behavior: "instant" as ScrollBehavior });
    }
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
    scrollToTop();
  };
  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
    scrollToTop();
  };

  const slideChunks = Array.from({ length: totalSlides }, (_, i) =>
    allArtists.slice(i * ITEMS_PER_SLIDE, (i + 1) * ITEMS_PER_SLIDE)
  );

  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const minSwipeDistance = 50;

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      nextSlide();
    } else if (isRightSwipe) {
      prevSlide();
    }
  };

  return (
    <section ref={sectionRef} className={styles.section} id="featured-artists">
      <div className={styles.wrapper}>

        <div className={styles.headerRow}>
          <ScrollReveal direction="up">
            <h2 className={styles.sectionTitle}>
              OUR <span className={styles.goldText}>COLLABS</span>
            </h2>
          </ScrollReveal>

        </div>

        <ScrollReveal delay={200} direction="up" className={styles.carouselReveal}>
          <div className={styles.carouselContainer}>
            <div
              className={styles.carouselViewport}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <div
                className={styles.carouselTrack}
                style={{ transform: `translateX(-${currentSlide * 100}%)` }}
              >
                {slideChunks.map((chunk, slideIdx) => (
                  <div key={slideIdx} className={styles.carouselSlide}>
                    <div className={styles.grid}>
                      {chunk.map((artist) => (
                        <div key={artist.uniqueKey} className={styles.artistCard}>
                          <div className={styles.imageWrapper}>
                            <img
                              src={getImageUrl(artist.image)}
                              alt={artist.name}
                              className={styles.artistImage}
                              loading="lazy"
                            />
                          </div>
                          <div className={styles.nameStrip}>
                            <span className={styles.artistName}>{artist.name}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Desktop Controls: Overlaying the sides, vertically centered */}
            <div className={styles.controlsDesktop}>
              <button onClick={prevSlide} className={styles.arrowBtn} aria-label="Previous Slide">
                <ChevronLeft size={22} strokeWidth={1.5} />
              </button>
              <button onClick={nextSlide} className={styles.arrowBtn} aria-label="Next Slide">
                <ChevronRight size={22} strokeWidth={1.5} />
              </button>
            </div>
          </div>

          {/* Desktop Indicators */}
          <div className={styles.indicatorsDesktop}>
            {Array.from({ length: totalSlides }).map((_, idx) => (
              <span
                key={idx}
                className={`${styles.indicator} ${currentSlide === idx ? styles.activeIndicator : ""}`}
              />
            ))}
          </div>
        </ScrollReveal>

        {/* Mobile controls */}
        <div className={styles.controlsMobile}>
          <button onClick={prevSlide} className={styles.arrowBtn} aria-label="Previous Slide">
            <ChevronLeft size={20} strokeWidth={1.5} />
          </button>
          <div className={styles.indicators}>
            {Array.from({ length: totalSlides }).map((_, idx) => (
              <span
                key={idx}
                className={`${styles.indicator} ${currentSlide === idx ? styles.activeIndicator : ""}`}
              />
            ))}
          </div>
          <button onClick={nextSlide} className={styles.arrowBtn} aria-label="Next Slide">
            <ChevronRight size={20} strokeWidth={1.5} />
          </button>
        </div>

      </div>
    </section>
  );
}
