import TransformationHero from "@/components/TransformationHero";
import { AboutHome } from "@/components/Spotlight/AboutHome";
import { StatsBand } from "@/components/Spotlight/StatsBand";
import { Values } from "@/components/Spotlight/Values";
import { Services } from "@/components/Spotlight/Services";
import { FeaturedArtists } from "@/components/Spotlight/FeaturedArtists";
import { MicDropMoments } from "@/components/Spotlight/MicDropMoments";
import { Testimonials } from "@/components/Spotlight/Testimonials";
import { GlobalFootprint } from "@/components/Spotlight/GlobalFootprint";
import { Showrunners } from "@/components/Spotlight/Showrunners";
import { StackedCard } from "@/components/ui/StackedCard";
import { ContentLayer } from "@/components/ui/ContentLayer";

import { client } from "@/sanity/client";
import {
  heroQuery,
  aboutQuery,
  collabsQuery,
  momentsQuery,
  testimonialsQuery,
  servicesQuery,
  footprintQuery,
  showrunnersQuery,
  statsQuery
} from "@/sanity/queries";

// Serve a CDN-cached copy of the page and rebuild it at most once an hour.
// Sanity's publish webhook calls /api/revalidate, so CMS edits still show up
// within seconds — without running a server function for every visitor.
export const revalidate = 3600;

export default async function HomePage() {
  // Initialize with null so we can check if fetch succeeded
  let heroData = null;
  let aboutData = null;
  let collabsData = null;
  let momentsData = null;
  let testimonialsData = null;
  let servicesData = null;
  let footprintData = null;
  let showrunnersData = null;
  let statsData = null;

  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;

  // Force fetch if we have a project ID
  if (projectId) {
    try {
      console.log(`Attempting to fetch data for project: ${projectId}`);
      const results = await Promise.all([
        client.fetch(heroQuery),
        client.fetch(aboutQuery),
        client.fetch(collabsQuery),
        client.fetch(momentsQuery),
        client.fetch(testimonialsQuery),
        client.fetch(servicesQuery),
        client.fetch(footprintQuery),
        client.fetch(showrunnersQuery),
        client.fetch(statsQuery)
      ]);

      [
        heroData,
        aboutData,
        collabsData,
        momentsData,
        testimonialsData,
        servicesData,
        footprintData,
        showrunnersData,
        statsData
      ] = results;
      
      console.log("Sanity fetch successful!");
    } catch (error) {
      console.error("Sanity connection failed:", error);
    }
  } else {
    console.warn("NEXT_PUBLIC_SANITY_PROJECT_ID is missing from environment variables.");
  }

  return (
    <div style={{ position: 'relative' }}>
      {/* Hero — sticky on desktop, normal flow on mobile */}
      <div className="hero-sticky-wrapper">
        <TransformationHero data={heroData} />
      </div>
      
      <ContentLayer zIndex={2}>
        <AboutHome data={aboutData} />
        <StatsBand data={statsData} />
      </ContentLayer>
      
      <ContentLayer zIndex={3}>
        <FeaturedArtists data={collabsData} />
        <MicDropMoments data={momentsData} />
      </ContentLayer>

      <StackedCard zIndex={4}>
        <Testimonials data={testimonialsData} />
      </StackedCard>

      <ContentLayer zIndex={5}>
        <Services data={servicesData} />
      </ContentLayer>

      <ContentLayer zIndex={6}>
        <Showrunners data={showrunnersData} />
      </ContentLayer>

      <ContentLayer zIndex={7}>
        <GlobalFootprint data={footprintData} />
      </ContentLayer>
    </div>
  );
}

