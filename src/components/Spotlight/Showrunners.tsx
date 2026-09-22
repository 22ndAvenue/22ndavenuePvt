/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { ChevronLeft, ChevronRight } from "lucide-react";
import styles from "./Showrunners.module.css";
import imageUrlBuilder from "@sanity/image-url";
import { client } from "@/sanity/client";

const builder = imageUrlBuilder(client);

function getImageUrl(imageSource: any) {
  if (!imageSource) return "";
  if (typeof imageSource === "string") return imageSource;
  try {
    return builder.image(imageSource).width(500).height(500).fit("crop").auto("format").quality(75).url();
  } catch {
    return "";
  }
}

interface TeamMember {
  name: string;
  role: string;
  image: string;
  bio?: string;
}

interface ShowrunnersProps {
  data?: {
    title?: string;
    subCopy?: string;
    teamList?: {
      name: string;
      role: string;
      image: any;
      bio?: string;
    }[];
  } | null;
}

const DEFAULT_TEAM: TeamMember[] = [
  {
    name: "Michael Janda",
    role: "Best Selling Author",
    image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=600&auto=format&fit=crop",
    bio: "Michael Janda is an executive creative director, agency founder, and author of the best-selling books 'Burn Your Portfolio' and 'The Psychology of Graphic Design Pricing'."
  },
  {
    name: "Melinda Livsey",
    role: "Brand Strategist",
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=600&auto=format&fit=crop",
    bio: "Melinda Livsey is a brand strategist, educator, and co-founder of Marks and Maker. She helps designers transition to strategy and build high-value client relationships."
  },
  // {
  //   name: "Alex Antolino",
  //   role: "Creative Director",
  //   image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=600&auto=format&fit=crop",
  //   bio: "Alex Antolino is a creative director and brand builder known for his work at Typeform, specializing in turning complex products into beloved human brands."
  // },
  // {
  //   name: "Sara Chen",
  //   role: "Event Director",
  //   image: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?q=80&w=600&auto=format&fit=crop",
  //   bio: "Sara Chen is a seasoned event director with over 15 years of experience producing large-scale concerts, corporate summits, and global brand activations."
  // },
  // {
  //   name: "James Torres",
  //   role: "Marketing Lead",
  //   image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=600&auto=format&fit=crop",
  //   bio: "James Torres leads marketing strategy with a sharp focus on audience growth and authentic brand storytelling across global markets."
  // }
];

export function Showrunners({ data }: ShowrunnersProps) {
  const sectionSubCopy = data?.subCopy ||
    "The minds behind the hustle, who turn opportunities into success.";

  const team: TeamMember[] = (data?.teamList && data.teamList.length > 0)
    ? data.teamList.map(m => ({
      name: m.name || "Anonymous",
      role: m.role || "",
      image: getImageUrl(m.image) || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=600",
      bio: m.bio
    }))
    : DEFAULT_TEAM;

  const [currentPage, setCurrentPage] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [visibleCount, setVisibleCount] = useState(3);
  const [activeBio, setActiveBio] = useState<TeamMember | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 600) setVisibleCount(2);
      else if (window.innerWidth < 900) setVisibleCount(2);
      else setVisibleCount(3);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Reset page when team length or visibleCount changes
  useEffect(() => { setCurrentPage(0); }, [team.length, visibleCount]);

  const totalPages = Math.ceil(team.length / visibleCount) || 1;
  const startIndex = currentPage * visibleCount;
  const visibleTeam = team.slice(startIndex, startIndex + visibleCount);

  const next = useCallback(() => {
    if (isAnimating || totalPages <= 1) return;
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentPage(p => (p + 1) % totalPages);
      setIsAnimating(false);
    }, 400);
  }, [isAnimating, totalPages]);

  const prev = useCallback(() => {
    if (isAnimating || totalPages <= 1) return;
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentPage(p => (p - 1 + totalPages) % totalPages);
      setIsAnimating(false);
    }, 400);
  }, [isAnimating, totalPages]);

  useEffect(() => {
    document.body.style.overflow = activeBio ? "hidden" : "unset";
    return () => { document.body.style.overflow = "unset"; };
  }, [activeBio]);

  // Split name: everything except last word is "first", last word is "last" (gold)
  const splitName = (fullName: string) => {
    const parts = fullName.trim().split(" ");
    if (parts.length === 1) return { first: fullName, last: "" };
    return {
      first: parts.slice(0, -1).join(" "),
      last: parts[parts.length - 1]
    };
  };

  return (
    <section className={styles.section} id="showrunners-section">
      <div className={styles.container}>

        {/* Header */}
        <div className={styles.header}>
          <ScrollReveal direction="up">
            <h2 className={styles.title}>
              THE <span className={styles.goldText}>SHOWRUNNERS</span>
            </h2>
          </ScrollReveal>
          <ScrollReveal direction="up" delay={0.12}>
            <p className={styles.subCopy}>{sectionSubCopy}</p>
          </ScrollReveal>
        </div>

        {/* Carousel */}
        <div className={styles.carouselContainer}>

          {/* Cards row */}
          <div className={`${styles.cardsRow} ${isAnimating ? styles.fadeOut : styles.fadeIn}`}>
            {visibleTeam.map((member, idx) => {
              const { first, last } = splitName(member.name);
              return (
                <div
                  key={`${member.name}-${startIndex + idx}`}
                  className={styles.card}
                >
                  {/* Portrait circle */}
                  <div className={styles.portraitArea}>
                    <div className={styles.imageWrapper}>
                      <img
                        src={member.image}
                        alt={member.name}
                        className={styles.image}
                        loading="lazy"
                        decoding="async"
                      />
                    </div>
                  </div>

                  {/* Name overlapping bottom of circle */}
                  <div className={styles.nameBlock}>
                    <span className={styles.firstName}>{first}</span>
                    {last && <span className={styles.lastName}>{last}</span>}
                  </div>

                  {/* Role below */}
                  <div className={styles.roleBlock}>
                    <p className={styles.role}>{member.role}</p>
                    {/* Temporarily hidden — re-enable when bio modal is ready
                    {member.bio && (
                      <span className={styles.bioHint}>Read Bio</span>
                    )}
                    */}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop arrows — outside the cards row, only if multiple pages */}
          {totalPages > 1 && (
            <div className={styles.controlsDesktop}>
              <button onClick={prev} className={styles.arrowBtn} aria-label="Previous">
                <ChevronLeft size={20} strokeWidth={1.5} />
              </button>
              <button onClick={next} className={styles.arrowBtn} aria-label="Next">
                <ChevronRight size={20} strokeWidth={1.5} />
              </button>
            </div>
          )}
        </div>

        {/* Mobile nav — dots + arrows */}
        {totalPages > 1 && (
          <div className={styles.controlsMobile}>
            <button onClick={prev} className={styles.arrowBtn} aria-label="Previous">
              <ChevronLeft size={20} strokeWidth={1.5} />
            </button>
            <div className={styles.indicators}>
              {Array.from({ length: totalPages }).map((_, i) => (
                <span
                  key={i}
                  className={`${styles.indicator} ${currentPage === i ? styles.activeIndicator : ""}`}
                />
              ))}
            </div>
            <button onClick={next} className={styles.arrowBtn} aria-label="Next">
              <ChevronRight size={20} strokeWidth={1.5} />
            </button>
          </div>
        )}

      </div>

      {/* BIO MODAL — temporarily commented out, re-enable when ready
      {mounted && activeBio && createPortal(
        <div className={styles.modalBackdrop} onClick={() => setActiveBio(null)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <button className={styles.modalClose} onClick={() => setActiveBio(null)} aria-label="Close">
              <X size={18} />
            </button>
            <div className={styles.modalLeft}>
              <div className={styles.modalImageWrapper}>
                <img src={activeBio.image} alt={activeBio.name} className={styles.modalImage} />
              </div>
            </div>
            <div className={styles.modalRight}>
              <div className={styles.modalHeader}>
                {(() => {
                  const { first, last } = splitName(activeBio.name);
                  return (
                    <h4 className={styles.modalName}>
                      {first} {last && <span className={styles.modalNameGold}>{last}</span>}
                    </h4>
                  );
                })()}
                <p className={styles.modalRole}>{activeBio.role}</p>
              </div>
              <div className={styles.modalBody}>
                <p className={styles.fullBio}>{activeBio.bio}</p>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
      */}
    </section>
  );
}
