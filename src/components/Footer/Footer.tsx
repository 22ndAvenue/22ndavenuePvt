"use client";

import React from "react";
import Link from "next/link";
import { Instagram, Linkedin, ArrowUpRight, Mail, MapPin } from "lucide-react";
import { useContactModal } from "@/components/ui/ContactModalContext";
import styles from "./Footer.module.css";

const socials = [
  {
    label: "Email",
    href: "mailto:experiences@22ndavenue.co.in",
    icon: <Mail size={18} strokeWidth={1.5} />
  },
  {
    label: "Instagram",
    href: "https://www.instagram.com/22ndavenuetalentmanagement/",
    icon: <Instagram size={18} strokeWidth={1.5} />
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/twenty-second-avenue-talent-management-company",
    icon: <Linkedin size={18} strokeWidth={1.5} />
  },
];

const offices = [
  {
    city: "Mumbai",
    tag: "GLOBAL HQ",
    address: `16th Floor, Aston Building,
Sundervan Complex,
Andheri West, Mumbai 400053`,
    mapLink: "https://www.google.com/maps/search/?api=1&query=22nd+Avenue+Talent+Management+Aston+Building+Andheri+West+Mumbai",
  },
  {
    city: "Delhi",
    address: `Flat No. J-236,
Sarita Vihar,
New Delhi - 110076`,
    mapLink: "https://www.google.com/maps/search/?api=1&query=Flat+No.+J-236,+Sarita+Vihar,+New+Delhi+-+110076",
  },
  {
    city: "Singapore",
    address: `3 Shenton Way,
#19-02,
Shenton House
Singapore ( 068805)`,
    mapLink: "https://www.google.com/maps/search/?api=1&query=3+Shenton+Way,+Shenton+House,+Singapore",
  },
  {
    city: "Sydney",
    address: `14th Floor,
3 Parramatta Square,
Parramatta NSW 2150`,
    mapLink: "https://www.google.com/maps/search/?api=1&query=3+Parramatta+Square+Parramatta+NSW+2150+Australia",
  }
];

export function Footer() {
  const { openModal } = useContactModal();

  return (
    <footer className={styles.footer} id="site-footer">
      {/* Subtle warm ambient glow in background */}
      <div className={styles.ambientGlow}></div>

      <div className={styles.container}>
        {/* CTA section */}
        <div className={styles.ctaStrip}>
          <div className={styles.ctaInner}>
            <h2 className={styles.ctaHeading}>
              Ready to make <span className={styles.ctaAccent}>magic</span>?
            </h2>
            <p className={styles.ctaSub}>
              Let&apos;s turn your vision into an unforgettable moment.
            </p>
            <button onClick={openModal} className={styles.ctaButton} id="footer-cta">
              Start a Conversation
            </button>
          </div>
        </div>

        {/* Top Separator Line */}
        <div className={styles.topDivider}></div>

        {/* Main Content Grid (Brand Left, Address Columns Right) */}
        <div className={styles.footerContent}>
          {/* Brand Info (Left) */}
          <div className={styles.brand}>
            {/* Top group: logo + tagline stay together */}
            <div className={styles.brandTop}>
              <Link href="/" className={styles.logo}>
                <img
                  src="/assets/hero/logo.webp"
                  alt="22nd Avenue Logo"
                  className={styles.footerLogo}
                />
              </Link>
              <p className={styles.tagline}>
                Leading entertainment curators, <br /> crafting impact through <span className={styles.goldText}>artist-led experiences</span>.
              </p>
            </div>

            {/* Social icons anchored to bottom */}
            <div className={styles.socialRow}>
              {socials.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  className={styles.socialIcon}
                  target={s.label !== "Email" ? "_blank" : undefined}
                  rel={s.label !== "Email" ? "noopener noreferrer" : undefined}
                  aria-label={s.label}
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          <div className={styles.addressBlock}>
            <div className={styles.addressHeader}>
              <span className={styles.addressHeaderLabel}>OUR PRESENCE</span>
              <span className={styles.addressHeaderLine}></span>
            </div>

            <div className={styles.addressGrid}>
              {offices.map((office, index) => (
                <div key={office.city} className={styles.countryCol}>
                  <a
                    href={office.mapLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.addressCol}
                    title={`View ${office.city} office`}
                  >
                    <div className={styles.badgeWrapper}>
                      {office.tag && (
                        <span className={office.tag === "APAC HQ" ? styles.badgeAPAC : styles.badgeHQ}>
                          {office.tag}
                        </span>
                      )}
                    </div>
                    <div className={styles.cityRow}>
                      <MapPin size={12} className={styles.mapIcon} />
                      <h4 className={styles.officeCity}>{office.city}</h4>
                      <ArrowUpRight size={11} className={styles.cityArrow} />
                    </div>
                    <p className={styles.officeAddress}>{office.address}</p>
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.divider}></div>

        {/* Bottom Row: Copyright */}
        <div className={styles.bottomRow}>
          <p className={styles.copyright}>
            © {new Date().getFullYear()} 22nd Avenue Talent Management Pvt. Ltd. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
