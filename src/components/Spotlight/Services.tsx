/* eslint-disable @next/next/no-img-element */
"use client";

import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { X, ChevronLeft, ChevronRight, Play, Film } from "lucide-react";
import styles from "./Services.module.css";
import { getDirectVideoUrl, getDriveEmbedUrl, extractDriveId } from "@/utils/video";

function getOptimizedUrl(url: string, width = 800) {
  if (!url) return "";
  if (url.includes("cdn.sanity.io") || url.includes("images.unsplash.com")) {
    const separator = url.includes("?") ? "&" : "?";
    // Avoid appending if already appended
    if (url.includes(`w=${width}`)) return url;
    return `${url}${separator}w=${width}&q=80&auto=format`;
  }
  return url;
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface GalleryMedia {
  type: "image" | "video";
  url: string;
  thumbnail?: string;
}

interface ServicesProps {
  data?: {
    servicesList: {
      title: string;
      enableGallery?: boolean;
      description: string;
      image: string;
      shape: string;
      bulkVideoUrls?: string;
      gallery: {
        type: string;
        image?: string;
        videoUrl?: string;
        thumbnail?: string;
      }[];
    }[];
  };
}

// ─── Default fallback services ────────────────────────────────────────────────
const DEFAULT_SERVICES = [
  {
    title: "LIVE EVENTS",
    image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=1200&auto=format&fit=crop",
    shape: "shapeArch",
    gallery: [
      { type: "image" as const, url: "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?q=80&w=800" },
      { type: "image" as const, url: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=800" },
      { type: "image" as const, url: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=800" },
      { type: "image" as const, url: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?q=80&w=800" },
      { type: "image" as const, url: "https://images.unsplash.com/photo-1470229722913-7c090be5c560?q=80&w=800" },
    ],
  },
  {
    title: "BRAND COLLABS",
    image: "https://images.unsplash.com/photo-1557804506-669a67965ba0?q=80&w=1200&auto=format&fit=crop",
    shape: "shapeArch",
    gallery: [
      { type: "image" as const, url: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=800" },
      { type: "image" as const, url: "https://images.unsplash.com/photo-1556761175-b413da4baf72?q=80&w=800" },
      { type: "image" as const, url: "https://images.unsplash.com/photo-1520333789090-1afc82db536a?q=80&w=800" },
      { type: "image" as const, url: "https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=800" },
      { type: "image" as const, url: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=800" },
    ],
  },
];

// ─── Scroll lock helpers ──────────────────────────────────────────────────────
function lockScroll() {
  if (document.body.dataset.scrollLocked) return;
  document.body.dataset.scrollLocked = "1";
  document.documentElement.style.overflow = "hidden";
  document.body.style.overflow = "hidden";
}
function unlockScroll() {
  if (!document.body.dataset.scrollLocked) return;
  document.documentElement.style.overflow = "";
  document.body.style.overflow = "";
  delete document.body.dataset.scrollLocked;
}

// ─── Parse bulk video URLs ────────────────────────────────────────────────────
function parseBulkVideoUrls(raw: string): GalleryMedia[] {
  return raw
    .split(/[\n,]+/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((url) => {
      const driveId = extractDriveId(url);
      return {
        type: "video" as const,
        url: getDirectVideoUrl(url),
        thumbnail: driveId ? `https://drive.google.com/thumbnail?id=${driveId}&sz=w800` : undefined,
      };
    });
}

// ─── Gallery Tile ─────────────────────────────────────────────────────────────
function GalleryTile({
  item,
  index,
  serviceTitle,
  onClick,
}: {
  item: GalleryMedia;
  index: number;
  serviceTitle: string;
  onClick: () => void;
}) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const thumbSrc = item.type === "video" ? item.thumbnail : getOptimizedUrl(item.url, 600);
  const hasThumbnail = !!thumbSrc;

  return (
    <div
      className={styles.galleryTile}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
      aria-label={`Open ${serviceTitle} item ${index + 1}`}
    >
      {/* Skeleton shimmer */}
      <div className={`${styles.tileSkeleton} ${imgLoaded || !hasThumbnail ? styles.tileSkeletonHidden : ""}`} />

      {hasThumbnail ? (
        <img
          src={thumbSrc}
          alt={`${serviceTitle} ${index + 1}`}
          className={`${styles.tileMedia} ${imgLoaded ? styles.tileMediaLoaded : ""}`}
          loading="lazy"
          decoding="async"
          onLoad={() => setImgLoaded(true)}
          onError={() => setImgLoaded(true)}
          referrerPolicy="no-referrer"
        />
      ) : (
        /* Placeholder for videos with no thumbnail */
        <div className={`${styles.tilePlaceholder} ${styles.tileMediaLoaded}`}>
          <Film size={28} className={styles.tilePlaceholderIcon} />
          <span className={styles.tilePlaceholderText}>Video</span>
        </div>
      )}

      {/* Hover overlay */}
      <div className={styles.tileOverlay}>
        {item.type === "video" ? (
          <div className={styles.playBtn}>
            <Play size={18} fill="currentColor" />
          </div>
        ) : (
          <div className={styles.expandDot} />
        )}
      </div>

      {/* Persistent video badge (always visible, not just on hover) */}
      {item.type === "video" && (
        <div className={styles.videoBadge}>
          <Play size={10} fill="currentColor" />
        </div>
      )}
    </div>
  );
}

// ─── Lightbox Video — uses Drive iframe embed on desktop, native HTML5 playsInline on mobile ────────
function LightboxVideo({ driveId, streamUrl, poster }: { driveId?: string; streamUrl: string; poster?: string }) {
  const [isMobile, setIsMobile] = useState(false);
  const [iframeReady, setIframeReady] = useState(false);
  const [mode, setMode] = useState<"poster" | "iframe" | "html5">(driveId ? "iframe" : (poster ? "poster" : "iframe"));
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Detect mobile phone/tablet devices
    setIsMobile(/Mobi|Android|iPhone|iPad/i.test(navigator.userAgent));
  }, []);

  useEffect(() => {
    if (isMobile && videoRef.current) {
      videoRef.current.play().catch((err) => {
        console.log("Autoplay failed:", err);
      });
    }
  }, [isMobile, streamUrl]);

  // If it's a mobile device, strictly use the native HTML5 player with playsInline
  // to avoid Google Drive app hijack or native fullscreen popups
  if (isMobile) {
    return (
      <div className={styles.lbVideoWrap}>
        <video
          ref={videoRef}
          src={streamUrl}
          className={styles.lbMedia}
          controls
          playsInline
          autoPlay
          preload="auto"
          poster={poster}
        />
      </div>
    );
  }

  // On desktop, use the Google Drive iframe embed
  const embedUrl = driveId ? getDriveEmbedUrl(driveId) : null;
  const handlePlay = () => {
    if (embedUrl) {
      setMode("iframe");
    } else {
      setMode("html5");
      setTimeout(() => {
        videoRef.current?.play().catch(() => {});
      }, 100);
    }
  };

  if (mode === "poster" && poster) {
    return (
      <div className={styles.lbVideoWrap}>
        <img src={poster} alt="" className={styles.lbMedia} referrerPolicy="no-referrer" />
        <button className={styles.lbPlayOverlay} onClick={handlePlay} aria-label="Play video">
          <div className={styles.lbPlayBtn}>
            <Play size={32} fill="currentColor" />
          </div>
          <span className={styles.lbPlayLabel}>Tap to play</span>
        </button>
      </div>
    );
  }

  if (mode === "iframe" && embedUrl) {
    return (
      <div className={styles.lbVideoWrap}>
        {!iframeReady && (
          <div className={styles.lbSpinner}>
            <div className={styles.lbSpinnerRing} />
            <span className={styles.lbSpinnerText}>Loading…</span>
          </div>
        )}
        <iframe
          src={embedUrl}
          className={`${styles.lbIframe} ${iframeReady ? styles.lbIframeReady : ""}`}
          allow="autoplay; fullscreen"
          allowFullScreen
          onLoad={() => setIframeReady(true)}
          title="Video"
        />
      </div>
    );
  }

  // Fallback for non-Drive videos on desktop
  return (
    <div className={styles.lbVideoWrap}>
      <video
        ref={videoRef}
        src={streamUrl}
        className={styles.lbMedia}
        controls
        playsInline
        autoPlay
        preload="auto"
        poster={poster}
      />
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function Services({ data }: ServicesProps) {
  const services = data?.servicesList?.length
    ? data.servicesList.map((s) => {
        const defaultService = DEFAULT_SERVICES.find(
          (ds) => ds.title.toUpperCase() === s.title.toUpperCase()
        );

        // Build gallery from Sanity individual items
        const sanityGallery: GalleryMedia[] = (s.gallery || [])
          .map((g) => {
            const driveId = g.type === "video" ? extractDriveId(g.videoUrl) : undefined;
            return {
              type: g.type as "image" | "video",
              url: (g.type === "video" ? getDirectVideoUrl(g.videoUrl) : g.image) || "",
              thumbnail: g.thumbnail || (driveId ? `https://drive.google.com/thumbnail?id=${driveId}&sz=w800` : undefined),
            };
          })
          .filter((g) => g.url.length > 0);

        // Parse bulk video URLs and append them
        const bulkItems: GalleryMedia[] = s.bulkVideoUrls
          ? parseBulkVideoUrls(s.bulkVideoUrls)
          : [];

        // Prioritize bulk items if they are provided; otherwise use individual gallery items
        const combined = bulkItems.length > 0 ? bulkItems : sanityGallery;
        const gallery = combined.length > 0 ? combined : (defaultService?.gallery || []);

        return {
          ...s,
          enableGallery: s.enableGallery ?? false,
          image: s.image || defaultService?.image || "",
          shape: s.shape || "shapeDiamond",
          gallery,
        };
      })
    : DEFAULT_SERVICES;

  const carouselRef = useRef<HTMLDivElement>(null);
  const [selectedService, setSelectedService] = useState<typeof services[0] | null>(null);
  const [visibleCount, setVisibleCount] = useState(3);
  const [mobileCardIndex, setMobileCardIndex] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);

  const showArrows = services.length > 2;

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (selectedService) {
      lockScroll();
      setVisibleCount(3); // Reset to 3 items when opening a new modal
    } else {
      unlockScroll();
      setLightboxIndex(null);
    }
    return () => { unlockScroll(); };
  }, [selectedService]);

  const scrollTimeout = useRef<NodeJS.Timeout | null>(null);

  const handleCarouselScroll = useCallback(() => {
    if (scrollTimeout.current) return;
    
    scrollTimeout.current = setTimeout(() => {
      const el = carouselRef.current;
      if (el) {
        const itemWidth = el.scrollWidth / services.length;
        setMobileCardIndex(Math.min(Math.round(el.scrollLeft / itemWidth), services.length - 1));
      }
      scrollTimeout.current = null;
    }, 100);
  }, [services.length]);

  const scroll = (dir: "left" | "right") => {
    const el = carouselRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === "left" ? -el.clientWidth : el.clientWidth, behavior: "smooth" });
  };

  const scrollToCard = (index: number) => {
    const el = carouselRef.current;
    if (!el) return;
    el.scrollTo({ left: (el.scrollWidth / services.length) * index, behavior: "smooth" });
  };

  const lightboxPrev = () => {
    if (lightboxIndex === null || !selectedService) return;
    setLightboxIndex((lightboxIndex - 1 + selectedService.gallery.length) % selectedService.gallery.length);
  };
  const lightboxNext = () => {
    if (lightboxIndex === null || !selectedService) return;
    setLightboxIndex((lightboxIndex + 1) % selectedService.gallery.length);
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (lightboxIndex !== null) setLightboxIndex(null);
        else if (selectedService) setSelectedService(null);
      }
      if (lightboxIndex === null) return;
      if (e.key === "ArrowLeft") lightboxPrev();
      if (e.key === "ArrowRight") lightboxNext();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lightboxIndex, selectedService]);

  const modalPortal = mounted && selectedService ? createPortal(
    <div
      className={styles.modalOverlay}
      onClick={() => setSelectedService(null)}
      role="dialog"
      aria-modal="true"
      aria-label={`${selectedService.title} gallery`}
    >
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Gold hairline */}
        <div className={styles.modalAccentLine} />

        {/* Top bar */}
        <div className={styles.modalTopBar}>
          <div className={styles.modalTopBarLeft}>
            <div className={styles.modalBadge}>
              <Play size={12} fill="#E4C057" color="#E4C057" />
            </div>
            <div>
              <h3 className={styles.modalServiceName}>{selectedService.title}</h3>
              <span className={styles.modalCount}>{selectedService.gallery.length} items in collection</span>
            </div>
          </div>
          <button
            className={styles.modalCloseBtn}
            onClick={() => setSelectedService(null)}
            aria-label="Close gallery"
          >
            <X size={18} />
          </button>
        </div>

        {/* Gallery */}
        <div className={styles.galleryScroll}>
          <div className={styles.masonryGrid}>
            {(selectedService.gallery.slice(0, visibleCount)).map((item, idx) => (
              <GalleryTile
                key={idx}
                item={item}
                index={idx}
                serviceTitle={selectedService.title}
                onClick={() => setLightboxIndex(idx)}
              />
            ))}
          </div>

          {selectedService.gallery.length > 3 && (
            <div className={styles.seeMoreWrapper}>
              <button 
                className={styles.seeMoreBtn} 
                onClick={() => {
                  if (visibleCount >= selectedService.gallery.length) {
                    setVisibleCount(3);
                  } else {
                    setVisibleCount(prev => prev + 3);
                  }
                }}
              >
                {visibleCount >= selectedService.gallery.length ? "SHOW LESS" : "LOAD MORE"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && (() => {
        const item = selectedService.gallery[lightboxIndex] as GalleryMedia;
        const driveId = item.type === "video" ? extractDriveId(item.url) : undefined;
        return (
          <div
            className={styles.lightbox}
            onClick={(e) => { e.stopPropagation(); setLightboxIndex(null); }}
          >
            <button
              className={styles.lbClose}
              onClick={(e) => { e.stopPropagation(); setLightboxIndex(null); }}
              aria-label="Close"
            >
              <X size={20} />
            </button>
            <div className={styles.lbCounter}>
              {lightboxIndex + 1} / {selectedService.gallery.length}
            </div>
            <button
              className={`${styles.lbNav} ${styles.lbPrev}`}
              onClick={(e) => { e.stopPropagation(); lightboxPrev(); }}
              aria-label="Previous"
            >
              <ChevronLeft size={26} />
            </button>

            <div className={styles.lbMediaWrap} onClick={(e) => e.stopPropagation()}>
              {item.type === "image" ? (
                <img src={getOptimizedUrl(item.url, 1600)} alt="" className={styles.lbMedia} referrerPolicy="no-referrer" />
              ) : (
                <LightboxVideo
                  key={`${lightboxIndex}-${item.url}`}
                  driveId={driveId}
                  streamUrl={item.url}
                  poster={item.thumbnail}
                />
              )}
            </div>

            <button
              className={`${styles.lbNav} ${styles.lbNext}`}
              onClick={(e) => { e.stopPropagation(); lightboxNext(); }}
              aria-label="Next"
            >
              <ChevronRight size={26} />
            </button>

            {/* Thumbnail strip */}
            <div className={styles.lbStrip} onClick={(e) => e.stopPropagation()}>
              {(selectedService.gallery as GalleryMedia[]).map((stripItem, idx) => {
                const thumb = stripItem.type === "video" ? stripItem.thumbnail : getOptimizedUrl(stripItem.url, 200);
                return (
                  <button
                    key={idx}
                    className={`${styles.lbStripItem} ${lightboxIndex === idx ? styles.lbStripItemActive : ""}`}
                    onClick={() => setLightboxIndex(idx)}
                    aria-label={`Go to item ${idx + 1}`}
                  >
                    {thumb ? (
                      <img src={thumb} alt="" className={styles.lbStripThumb} referrerPolicy="no-referrer" />
                    ) : (
                      <div className={styles.lbStripBlank}>
                        <Film size={12} />
                      </div>
                    )}
                    {stripItem.type === "video" && (
                      <div className={styles.lbStripPlay}>
                        <Play size={8} fill="currentColor" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })()}
    </div>,
    document.body
  ) : null;

  return (
    <section className={styles.section} id="services-section">
      <div className={styles.wrapper}>
        <div className={styles.header}>
          <ScrollReveal direction="up">
            <h2 className={styles.sectionTitle}>
              Where Excellence<br />
              <span className={styles.goldText}>Runs The Show</span>
            </h2>
          </ScrollReveal>
        </div>

        <div className={styles.marqueeWrapper}>
          <div className={styles.marquee}>
            <span>OUR SERVICES — OUR SERVICES — OUR SERVICES — OUR SERVICES — OUR SERVICES — OUR SERVICES — OUR SERVICES — OUR SERVICES — </span>
            <span aria-hidden="true">OUR SERVICES — OUR SERVICES — OUR SERVICES — OUR SERVICES — OUR SERVICES — OUR SERVICES — OUR SERVICES — OUR SERVICES — </span>
          </div>
        </div>

        <div className={styles.carouselContainer}>
          {showArrows && (
            <button
              className={`${styles.desktopArrow} ${styles.desktopArrowLeft}`}
              onClick={() => scroll("left")}
              aria-label="Previous"
            >
              <ChevronLeft size={20} />
            </button>
          )}

          <div
            className={styles.servicesCarousel}
            ref={carouselRef}
            onScroll={handleCarouselScroll}
          >
            {services.map((service, i) => (
              <div key={service.title} className={styles.snapSlide}>
                  <div
                    className={styles.serviceCard}
                    onClick={() => {
                      if ('enableGallery' in service && service.enableGallery) {
                        setSelectedService(service);
                      }
                    }}
                    style={{ cursor: 'enableGallery' in service && service.enableGallery ? 'pointer' : 'default' }}
                  >
                    <div className={styles.cardBorderGlow}></div>
                    <div className={`${styles.imageWrapper} ${styles[service.shape]}`}>
                      <img src={service.image} alt={service.title} className={styles.image} loading="lazy" decoding="async" />
                      <div className={styles.cinemaOverlay}></div>
                      <div className={styles.cardContent}>
                        <div className={styles.contentInner}>
                          <div className={styles.shimmerLine}></div>
                          <h3 className={styles.serviceTitle}>{service.title}
                            {'enableGallery' in service && service.enableGallery && (
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="7" y1="17" x2="17" y2="7"></line>
                                <polyline points="7 7 17 7 17 17"></polyline>
                              </svg>
                            )}
                          </h3>
                        </div>
                      </div>
                    </div>
                  </div>
              </div>
            ))}
          </div>

          {showArrows && (
            <button
              className={`${styles.desktopArrow} ${styles.desktopArrowRight}`}
              onClick={() => scroll("right")}
              aria-label="Next"
            >
              <ChevronRight size={20} />
            </button>
          )}
        </div>

        {services.length > 1 && (
          <div className={styles.dotsRow}>
            {services.map((_, i) => (
              <button
                key={i}
                className={`${styles.dot} ${mobileCardIndex === i ? styles.dotActive : ""}`}
                onClick={() => scrollToCard(i)}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {modalPortal}
    </section>
  );
}
