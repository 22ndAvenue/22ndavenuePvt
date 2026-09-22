/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Menu, X, ChevronDown, Rocket, Facebook, Instagram, Linkedin, Twitter } from "lucide-react";
import { motion, AnimatePresence, useScroll, useMotionValueEvent, useMotionValue, useSpring } from "framer-motion";
import { useContactModal } from "@/components/ui/ContactModalContext";
import styles from "./Navbar.module.css";

const SocialLink = ({ href, icon: Icon, label, colorClass }: { href: string; icon: any; label: string; colorClass: string }) => {
  const ref = useRef<HTMLAnchorElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 160, damping: 14 });
  const springY = useSpring(y, { stiffness: 160, damping: 14 });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (window.innerWidth < 1024 || !ref.current) return;
    const { clientX, clientY } = e;
    const { left, top, width, height } = ref.current.getBoundingClientRect();
    x.set((clientX - (left + width / 2)) * 0.25);
    y.set((clientY - (top + height / 2)) * 0.25);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.a
      ref={ref}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ x: springX, y: springY }}
      className={`${styles.socialLink} ${colorClass}`}
    >
      <div className={styles.socialLinkBg} />
      <Icon className={styles.socialLinkIcon} />
      <span className="sr-only">{label}</span>
    </motion.a>
  );
};

interface NavItem {
  name: string;
  path: string;
  children?: { name: string; path: string }[];
}

const navItems: NavItem[] = [
  { name: "Home", path: "/" },
  { name: "Backstage", path: "/#about-home" },
  { name: "Our Collabs", path: "/#featured-artists" },
  { name: "Showcase", path: "/#showcase-section" },
  { name: "Testimonies", path: "/#testimonials-section" },
  { name: "Services", path: "/#services-section" },
  { name: "Showrunners", path: "/#showrunners-section" },
];

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [mobileExpandedIndex, setMobileExpandedIndex] = useState<number | null>(null);
  const [isForceOpenAtTop, setIsForceOpenAtTop] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("/");
  const pathname = usePathname() || "/";
  const { openModal } = useContactModal();
  const isTransparentPage = ["/"].includes(pathname);
  const isHeroVideoPage = ["/"].includes(pathname);
  const shouldHideDesktopNavAtTop = isHeroVideoPage && !isScrolled && !isForceOpenAtTop;
  const [isHeroAnimating, setIsHeroAnimating] = useState(isHeroVideoPage);

  useEffect(() => {
    if (isHeroVideoPage) {
      setIsHeroAnimating(true);
      const timer = setTimeout(() => {
        setIsHeroAnimating(false);
      }, 3800);
      return () => clearTimeout(timer);
    } else {
      setIsHeroAnimating(false);
    }
  }, [isHeroVideoPage]);

  const { scrollY } = useScroll();
  const lastYRef = useRef(0);

  // Scrollspy: sort sections by real document position (offsetTop, not getBCR which breaks with sticky)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const sectionIds = navItems
      .filter(item => item.path.startsWith("/#"))
      .map(item => item.path.replace("/#", ""));

    // Walk offsetParent chain to get true document top — unaffected by sticky ancestors
    const getDocTop = (el: HTMLElement): number => {
      let top = 0;
      let cur: HTMLElement | null = el;
      while (cur) {
        top += cur.offsetTop;
        cur = cur.offsetParent as HTMLElement | null;
      }
      return top;
    };

    const getActiveSection = () => {
      if (window.scrollY < 80) {
        setActiveSection(prev => prev !== "/" ? "/" : prev);
        return;
      }

      const sections = sectionIds
        .map(id => {
          const el = document.getElementById(id);
          if (!el) return null;
          return { id, docTop: getDocTop(el) };
        })
        .filter((s): s is { id: string; docTop: number } => s !== null)
        .sort((a, b) => a.docTop - b.docTop);

      if (sections.length === 0) return;

      // Near-bottom fallback: activate last section when page can't scroll further
      const nearBottom =
        window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 80;

      let currentId: string | null = nearBottom
        ? sections[sections.length - 1].id
        : null;

      if (!nearBottom) {
        const triggerY = window.scrollY + window.innerHeight * 0.4;
        for (const { id, docTop } of sections) {
          if (triggerY >= docTop) currentId = id;
        }
      }

      if (currentId) {
        const next = `/#${currentId}`;
        setActiveSection(prev => prev !== next ? next : prev);
      }
    };

    let rafId: number | null = null;
    const handleScroll = () => {
      if (rafId !== null) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        getActiveSection();
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    getActiveSection();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, []);

  const [isHovered, setIsHovered] = useState(false);
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);

  const startHideTimer = useCallback(() => {
    if (window.innerWidth < 1024 || !isTransparentPage) return; // Never hide on non-hero pages
    if (isScrolled) return; // 3-second rule doesn't apply when the menu is capsule (scrolled)
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      if (!isHovered) {
        setIsHidden(true);
        setIsForceOpenAtTop(false); // Revert to minimal menu button at the top
      }
    }, 3000);
  }, [isHovered, isTransparentPage, isScrolled]);

  useMotionValueEvent(scrollY, "change", (latest) => {
    const diff = latest - lastYRef.current;

    // -- isScrolled gate: only setState if crossing the 30px boundary --
    const newScrolled = latest > 30;
    if (newScrolled !== isScrolled) setIsScrolled(newScrolled);

    if (latest > 100) setIsForceOpenAtTop(false);

    // Desktop logic: Show on scroll up, hide after 3s inactivity
    if (window.innerWidth >= 1024) {
      if (diff < -4 || latest < 100) {
        setIsHidden(false);
        startHideTimer();
      } else if (diff > 4 && latest > 100) {
        setIsHidden(true);
      }
    } else {
      // Mobile: only setState when crossing clear thresholds, skip tiny movements
      const absDiff = Math.abs(diff);
      if (absDiff < 6) {
        lastYRef.current = latest;
        return; // Skip tiny movements — no setState, no re-render
      }
      if (latest > 100 && diff > 6 && !isMobileMenuOpen) {
        if (!isHidden) setIsHidden(true);
      } else if (diff < -6 || latest < 100) {
        if (isHidden) setIsHidden(false);
      }
    }
    
    lastYRef.current = latest;
  });

  // If hovered, clear timer and show
  useEffect(() => {
    if (isHovered && window.innerWidth >= 1024) {
      setIsHidden(false);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    } else if (!isHovered && !isHidden && window.innerWidth >= 1024) {
      startHideTimer();
    }
  }, [isHovered, isHidden, startHideTimer]);

  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isMobileMenuOpen]);

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setMobileExpandedIndex(null);
    setIsForceOpenAtTop(false);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
  }, [pathname]);


  
  const navbarVariants = {
    top: {
      width: "fit-content",
      minWidth: "auto",
      y: 20,
      borderRadius: "99px",
      backgroundColor: "#000000",
      backdropFilter: "blur(0px)",
      border: "1px solid rgba(255, 255, 255, 0.1)",
      boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
      paddingTop: "6px",
      paddingBottom: "6px",
      paddingLeft: "12px",
      paddingRight: "12px",
    },
    scrolled: {
      width: "fit-content",
      minWidth: "auto",
      y: 20,
      borderRadius: "99px",
      backgroundColor: "#000000", 
      backdropFilter: "blur(0px)",
      border: "1px solid rgba(255, 255, 255, 0.15)", 
      boxShadow: "0 20px 40px rgba(0,0,0,0.6)",
      paddingTop: "8px",
      paddingBottom: "8px",
      paddingLeft: "12px",
      paddingRight: "12px",
    },
    hiddenTop: {
      width: "fit-content",
      y: -100,
      opacity: 0,
      scale: 0.95,
      transition: { duration: 0.4 }
    }
  };

  const mobileNavbarVariants = {
    scrolled: {
      y: 0,
      backgroundColor: "rgba(0, 0, 0, 0.95)", 
      backdropFilter: "blur(16px)",
      borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
      boxShadow: "0 4px 20px rgba(0,0,0,0.3)"
    }
  };

  return (
    <div 
      className={styles.navSystemWrapper}
      style={{ 
        opacity: isHeroAnimating ? 0 : 1, 
        pointerEvents: isHeroAnimating ? "none" : "auto",
        transition: "opacity 0.5s ease" 
      }}
    >
      <motion.div
        className={styles.smartScrollWrapper}
        animate={{ y: (isHidden && isScrolled) ? "-200px" : "0px" }}
        transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
      >
        {/* DESKTOP MINIMAL NAV (HERO ONLY) */}
        <AnimatePresence>
          {shouldHideDesktopNavAtTop && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20, transition: { duration: 0.2 } }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
              className={styles.desktopMinimalNav}
            >
              <div className={styles.pointerAuto}></div>
              <button
                onClick={() => setIsForceOpenAtTop(true)}
                className={styles.minimalMenuBtn}
              >
                <span className={styles.minimalMenuText}>MENU</span>
                <div className={styles.burgerLines}>
                  <span className={styles.burgerLine1}></span>
                  <span className={styles.burgerLine2}></span>
                  <span className={styles.burgerLine3}></span>
                </div>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          variants={navbarVariants}
          initial="top"
          animate={shouldHideDesktopNavAtTop ? "hiddenTop" : (isScrolled || !isTransparentPage ? "scrolled" : "top")}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className={`${styles.desktopNav} ${shouldHideDesktopNavAtTop ? styles.pointerNone : styles.pointerAuto}`}
          style={{ transformOrigin: "top center" }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* LOGO */}
          <Link href="/" className={styles.logoLink}>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <img
                src="/assets/hero/logo.webp"
                alt="22nd Avenue Logo"
                className={`${styles.logoImage} ${styles.logoSmall}`}
              />
            </motion.div>
          </Link>

          {/* DIVIDER */}
          <div className={styles.verticalDivider}></div>

          {/* LINKS */}
          <nav className={styles.desktopLinks}>
            {navItems.map((item, index) => {
              const isActive = pathname === '/' ? activeSection === item.path : pathname === item.path;
              return (
                <div
                  key={item.name}
                  className={styles.navItemWrapper}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  <Link href={item.path} className={`${styles.navLink} ${styles.navLinkDark} ${isActive ? styles.navLinkActive : ""}`}>
                    {isActive && (
                      <motion.div
                        layoutId="activeNavPill"
                        className={styles.activePill}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      />
                    )}
                    <span className={styles.navLinkText}>{item.name}</span>
                  </Link>
                </div>
              );
            })}
          </nav>

          {/* CTA */}
          <div className={styles.ctaWrapper}>
            <button onClick={openModal} className={styles.sayHelloBtn}>
              Let&apos;s Talk
            </button>
          </div>
        </motion.div>

        {/* MOBILE BAR */}
        <motion.div
          variants={mobileNavbarVariants}
          animate={isScrolled || !isTransparentPage ? "scrolled" : "top"}
          className={styles.mobileBar}
        >
          <Link href="/" className={styles.mobileLogoLink}>
            <img
              src="/assets/hero/logo.webp"
              alt="Logo"
              className={`${styles.mobileLogoImage} ${styles.mobileLogoSmall}`}
            />
          </Link>
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className={`${styles.mobileMenuBtn} ${styles.mobileMenuBtnDark}`}
          >
            <Menu size={32} />
          </button>
        </motion.div>
      </motion.div>

      {/* MOBILE MENU 90% DRAWER */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className={styles.mobileBackdrop}
            />

            <motion.div
              className={styles.mobileDrawer}
              initial={{ clipPath: "polygon(100% 0%, 100% 0%, 100% 100%, 100% 100%)", opacity: 1 }}
              animate={{ clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)" }}
              exit={{ clipPath: "polygon(100% 0%, 100% 0%, 100% 100%, 100% 100%)", opacity: 1 }}
              transition={{ duration: 0.65, ease: [0.76, 0, 0.24, 1] }}
            >
              <div className={styles.mobileDrawerDeco} />
              
              <div className={styles.mobileDrawerContent}>
                <div className={styles.mobileDrawerHeader}>
                  <img src="/assets/hero/logo.webp" alt="Logo" className={styles.mobileDrawerLogo} />
                  <button onClick={() => setIsMobileMenuOpen(false)} className={styles.mobileCloseBtn}>
                    <X size={28} />
                  </button>
                </div>

                <div className={styles.mobileDrawerLinks}>
                  {navItems.map((item, index) => (
                    <motion.div
                      key={item.name}
                      initial={{ x: 60, opacity: 0, skewX: -4 }}
                      animate={{ x: 0, opacity: 1, skewX: 0 }}
                      transition={{ delay: 0.2 + index * 0.07, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                    >
                      <div className={styles.mobileDrawerLinkRow}>
                        <Link
                          href={item.path}
                          onClick={(e) => {
                            setActiveSection(item.path);
                            setIsMobileMenuOpen(false);
                            if (item.path.startsWith("/#") && pathname === "/") {
                              e.preventDefault();
                              const id = item.path.replace("/#", "");
                              setTimeout(() => {
                                const element = document.getElementById(id);
                                if (element) {
                                  element.scrollIntoView({ behavior: "smooth", block: "start" });
                                }
                              }, 300);
                            }
                          }}
                          className={`${styles.mobileDrawerLink} ${
                            (pathname === '/' ? activeSection === item.path : pathname === item.path)
                              ? styles.mobileDrawerLinkActive : ""
                          }`}
                        >
                          {item.name}
                        </Link>
                        {item.children && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setMobileExpandedIndex(mobileExpandedIndex === index ? null : index);
                            }}
                            className={styles.mobileDrawerChevronBtn}
                          >
                            <ChevronDown
                              size={22}
                              className={`${styles.mobileDrawerChevron} ${mobileExpandedIndex === index ? styles.mobileDrawerChevronOpen : ""}`}
                            />
                          </button>
                        )}
                      </div>

                      <AnimatePresence>
                        {item.children && mobileExpandedIndex === index && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className={styles.mobileDrawerSubLinksWrapper}
                          >
                            <div className={styles.mobileDrawerSubLinks}>
                              {item.children.map((child) => (
                                <Link key={child.path} href={child.path} onClick={() => setIsMobileMenuOpen(false)} className={styles.mobileDrawerSubLink}>
                                  {child.name}
                                </Link>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ))}
                </div>

                <div className={styles.mobileDrawerFooter}>
                  <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}>
                    <button onClick={() => { setIsMobileMenuOpen(false); openModal(); }} className={styles.mobileSayHelloBtn}>
                      Let&apos;s Talk <Rocket className={styles.rocketIcon} />
                    </button>

                    <div className={styles.socialsRow}>
                      <SocialLink href="#" icon={Facebook} label="Facebook" colorClass={styles.fbColor} />
                      <SocialLink href="#" icon={Instagram} label="Instagram" colorClass={styles.igColor} />
                      <SocialLink href="#" icon={Linkedin} label="LinkedIn" colorClass={styles.inColor} />
                      <SocialLink href="#" icon={Twitter} label="Twitter" colorClass={styles.xColor} />
                    </div>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
