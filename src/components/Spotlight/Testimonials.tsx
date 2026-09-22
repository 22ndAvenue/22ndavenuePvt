/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { ChevronLeft, ChevronRight, Play, X, Quote } from "lucide-react";
import styles from "./Testimonials.module.css";
import imageUrlBuilder from "@sanity/image-url";
import { client } from "@/sanity/client";

const builder = imageUrlBuilder(client);

function getImageUrl(imageSource: any) {
  if (!imageSource) return "";
  if (typeof imageSource === "string") return imageSource;
  try {
    return builder.image(imageSource).width(400).height(500).fit("crop").auto("format").quality(75).url();
  } catch (err) {
    console.error("Error building image URL:", err);
    return "";
  }
}

interface Testimonial {
  name: string;
  role: string;
  image: string;
  quote?: string;   // Text-only testimonials
  video?: string;   // Video-only testimonials
}

interface TestimonialsProps {
  data?: {
    buzzList: {
      authorName: string;
      authorTitle: string;
      authorImage: any;
      hasVideo: boolean;
      videoUrl?: string;
      text?: string;
    }[];
  } | null;
}

const DEFAULT_TESTIMONIALS: Testimonial[] = [
  {
    name: "Rahul Sharma",
    role: "Event Director",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=600&auto=format&fit=crop",
    quote: "22nd Avenue transformed our corporate gala into an unforgettable experience. Their attention to detail is unmatched."
  },
  {
    name: "Priya Kapoor",
    role: "Music Producer",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=600&auto=format&fit=crop",
    video: "https://www.w3schools.com/html/mov_bbb.mp4"
  },
  {
    name: "Arjun Mehta",
    role: "Brand Strategist",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=600&auto=format&fit=crop",
    quote: "The team's creative vision elevated our brand launch to a whole new level. Truly world-class execution."
  },
  {
    name: "Sneha Iyer",
    role: "Artist Manager",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=600&auto=format&fit=crop",
    video: "https://www.w3schools.com/html/mov_bbb.mp4"
  }
];

import { getDirectVideoUrl } from "@/utils/video";

export function Testimonials({ data }: TestimonialsProps) {
  // Map data with fallback to ensure we don't skip items
  const testimonials: Testimonial[] = (data?.buzzList && data.buzzList.length > 0)
    ? data.buzzList.map(item => ({
      name: item.authorName || "Anonymous",
      role: item.authorTitle || "",
      image: getImageUrl(item.authorImage) || "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=600",
      quote: !item.hasVideo ? (item.text || "No testimonial text provided.") : undefined,
      video: item.hasVideo ? getDirectVideoUrl(item.videoUrl) : undefined,
    }))
    : DEFAULT_TESTIMONIALS;

  const [currentPage, setCurrentPage] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [videoModal, setVideoModal] = useState<string | null>(null);
  const [textModal, setTextModal] = useState<{ name: string, role: string, quote: string } | null>(null);
  const [visibleCount, setVisibleCount] = useState(4);
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Autoplay video when modal opens, and close modal when fullscreen exits
  useEffect(() => {
    if (!videoModal) return;

    let active = true;
    const video = videoRef.current;
    if (!video) return;

    // Listener for exiting fullscreen
    const handleFullscreenChange = () => {
      if (!active) return;
      const isFullscreen = document.fullscreenElement === video ||
        (document as any).webkitFullscreenElement === video ||
        (video as any).webkitDisplayingFullscreen;
      if (!isFullscreen) {
        setVideoModal(null);
      }
    };

    // iOS Safari specific fullscreen listeners
    const handleWebkitBegin = () => {
      // Entered fullscreen
    };
    const handleWebkitEnd = () => {
      if (active) {
        setVideoModal(null);
      }
    };

    // Register listeners
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    video.addEventListener("webkitbeginfullscreen", handleWebkitBegin);
    video.addEventListener("webkitendfullscreen", handleWebkitEnd);

    // Try to play automatically inside the inline modal player
    video.play().catch(err => {
      console.log("Auto-play failed:", err);
    });

    return () => {
      active = false;
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
      if (video) {
        video.removeEventListener("webkitbeginfullscreen", handleWebkitBegin);
        video.removeEventListener("webkitendfullscreen", handleWebkitEnd);
      }
    };
  }, [videoModal]);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      // On mobile, paginate 2 at a time; on desktop, paginate 4 at a time
      setVisibleCount(mobile ? 2 : 4);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Ensure current page is valid if items change
  useEffect(() => {
    setCurrentPage(0);
  }, [testimonials.length]);

  const totalPages = Math.ceil(testimonials.length / visibleCount) || 1;
  const startIndex = currentPage * visibleCount;
  const visibleTestimonials = testimonials.slice(startIndex, startIndex + visibleCount);

  const next = useCallback(() => {
    if (isAnimating || totalPages <= 1) return;
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentPage((prev) => (prev + 1) % totalPages);
      setIsAnimating(false);
    }, 400);
  }, [isAnimating, totalPages]);

  const prev = useCallback(() => {
    if (isAnimating || totalPages <= 1) return;
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentPage((prev) => (prev - 1 + totalPages) % totalPages);
      setIsAnimating(false);
    }, 400);
  }, [isAnimating, totalPages]);

  // Disable scroll when modal is open
  useEffect(() => {
    if (videoModal || textModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [videoModal, textModal]);

  return (
    <section className={styles.section} id="testimonials-section">
      <div className={styles.container}>

        {/* Header */}
        <div className={styles.header}>
          <ScrollReveal direction="up">
            <h2 className={styles.title}>
              THE BUZZ IS <span className={styles.goldText}>REAL</span>
            </h2>
          </ScrollReveal>
        </div>

        <div className={styles.carouselContainer}>
          {/* Pills Container */}
          <div className={`${styles.pillsContainer} ${isAnimating ? styles.fadeOut : styles.fadeIn}`}>
            {visibleTestimonials.map((t, i) => {
              const isDown = i % 2 !== 0;
              const isVideo = !!t.video;
              const isText = !!t.quote;

              return (
                <div
                  key={`${t.name}-${i}`}
                  className={`${styles.pillWrapper} ${!isMobile && isDown ? styles.pillDown : styles.pillUp}`}
                >
                  <div
                    className={styles.pill}
                    onClick={() => isVideo && t.video && setVideoModal(t.video)}
                  >
                    <div className={styles.mediaArea}>
                      <img src={t.image} alt={t.name} className={styles.pillImage} loading="lazy" decoding="async" />

                      {isVideo && (
                        <div className={styles.playBadge}>
                          <Play size={18} fill="white" stroke="white" />
                        </div>
                      )}

                      {isText && t.quote && (
                        <div className={styles.quoteOverlay}>
                          <Quote size={18} className={styles.quoteIcon} />
                          <p className={styles.quoteText}>
                            {t.quote.length > 80 ? (
                              <>
                                {t.quote.substring(0, 80)}...
                                <span
                                  className={styles.readMore}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setTextModal({ name: t.name, role: t.role, quote: t.quote! });
                                  }}
                                >
                                  Read More
                                </span>
                              </>
                            ) : (
                              t.quote
                            )}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className={styles.pillInfo}>
                      <h4 className={styles.pillName}>{t.name}</h4>
                      <p className={styles.pillRole}>{t.role}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Nav Controls Only */}
          {totalPages > 1 && (
            <div className={styles.controlsDesktop}>
              <button onClick={prev} className={styles.arrowBtn} aria-label="Previous">
                <ChevronLeft size={22} strokeWidth={1.5} />
              </button>
              <button onClick={next} className={styles.arrowBtn} aria-label="Next">
                <ChevronRight size={22} strokeWidth={1.5} />
              </button>
            </div>
          )}
        </div>

        {/* Mobile Nav Controls Only */}
        {totalPages > 1 && (
          <div className={styles.controlsMobile}>
            <button onClick={prev} className={styles.arrowBtn} aria-label="Previous">
              <ChevronLeft size={22} strokeWidth={1.5} />
            </button>

            <div className={styles.indicators}>
              {Array.from({ length: totalPages }).map((_, idx) => (
                <span
                  key={idx}
                  className={`${styles.indicator} ${currentPage === idx ? styles.activeIndicator : ""}`}
                />
              ))}
            </div>

            <button onClick={next} className={styles.arrowBtn} aria-label="Next">
              <ChevronRight size={22} strokeWidth={1.5} />
            </button>
          </div>
        )}

      </div>

      {/* TEXT MODAL */}
      {mounted && textModal && createPortal(
        <div className={styles.modalBackdrop} onClick={() => setTextModal(null)}>
          <div className={styles.textModalContent} onClick={(e) => e.stopPropagation()}>
            <button className={styles.modalClose} onClick={() => setTextModal(null)} aria-label="Close">
              <X size={22} />
            </button>
            <div className={styles.textModalHeader}>
              <Quote size={32} className={styles.quoteIconLarge} />
              <h4 className={styles.textModalName}>{textModal.name}</h4>
              <p className={styles.textModalRole}>{textModal.role}</p>
            </div>
            <div className={styles.textModalBody}>
              <p className={styles.fullQuote}>{textModal.quote}</p>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* VIDEO MODAL */}
      {mounted && videoModal && createPortal(
        <div className={styles.modalBackdrop} onClick={() => setVideoModal(null)}>
          <button className={styles.modalClose} onClick={() => setVideoModal(null)} aria-label="Close">
            <X size={22} />
          </button>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <video
              ref={videoRef}
              src={videoModal}
              className={styles.modalVideo}
              autoPlay
              controls
              playsInline
              preload="metadata"
            />
          </div>
        </div>,
        document.body
      )}
    </section>
  );
}
