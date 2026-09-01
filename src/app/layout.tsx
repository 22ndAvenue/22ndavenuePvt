import type { Metadata } from "next";
import { Playfair_Display, Inter, Space_Grotesk } from "next/font/google";
import { Navbar } from "@/components/Navigation/Navbar";
import { Footer } from "@/components/Footer/Footer";
import { WhatsAppButton } from "@/components/ui/WhatsAppButton";
import { ContactModalProvider } from "@/components/ui/ContactModalContext";
import { ContactModal } from "@/components/Spotlight/ContactModal";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: ["400", "500", "600", "700", "800", "900"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-accent",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "22nd Avenue — Talent Management",
    template: "%s | 22nd Avenue",
  },
  description:
    "Where Talent Meets The Spotlight. 22nd Avenue is a talent management agency specializing in artist management, brand collaborations, live events, and entertainment-led partnerships.",
  keywords: [
    "talent management",
    "creative agency",
    "artist management",
    "brand collaborations",
    "live events",
    "entertainment",
    "22nd Avenue",
  ],
  authors: [{ name: "22nd Avenue Talent Management Pvt.Ltd." }],
  icons: {
    icon: "/assets/favicon.ico",
    shortcut: "/assets/favicon.ico",
  },
  openGraph: {
    title: "22nd Avenue — Talent Management",
    description:
      "Where Talent Meets The Spotlight. Talent management for artists, brands, and live entertainment.",
    url: "https://22ndavenue.com",
    siteName: "22nd Avenue",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "22nd Avenue — Talent Management",
    description:
      "Where Talent Meets The Spotlight. Talent management for artists, brands, and live entertainment.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${playfair.variable} ${inter.variable} ${spaceGrotesk.variable}`}
    >
      <head>
        {/* Preconnect to critical image origins for faster first requests */}
        <link rel="preconnect" href="https://cdn.sanity.io" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://cdn.sanity.io" />
        <link rel="preconnect" href="https://images.unsplash.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
      </head>
      <body>
        <ContactModalProvider>
          <Navbar />
          <main>{children}</main>
          <Footer />
          <ContactModal />
          <WhatsAppButton />
        </ContactModalProvider>
      </body>
    </html>
  );
}
