import { ColourSection } from "@/sections/ColourSection";
import { ContactSection } from "@/sections/ContactSection";
import { DesignSection } from "@/sections/DesignSection";
import { HeroSection } from "@/sections/HeroSection";
import { InteriorSection } from "@/sections/InteriorSection";
import { LightSection } from "@/sections/LightSection";
import { PerformanceSection } from "@/sections/PerformanceSection";
import { TerrainSection } from "@/sections/TerrainSection";

/**
 * The page is a sequence of self-contained chapters (src/sections). Each one
 * owns its markup and anchor; they scroll over the fixed 3D layer, which is
 * added from the root layout, so the page stays server-rendered and readable
 * without JavaScript. Order matches siteConfig.nav.
 */
export default function HomePage() {
  return (
    <>
      <HeroSection />
      <DesignSection />
      <LightSection />
      <TerrainSection />
      <InteriorSection />
      <PerformanceSection />
      <ColourSection />
      <ContactSection />
    </>
  );
}
