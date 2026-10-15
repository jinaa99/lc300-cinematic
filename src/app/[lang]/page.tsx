import { ExperienceRoot } from "@/components/experience/ExperienceRoot";
import { getServerCopy } from "@/content/copy/server";
import { ColourSection } from "@/sections/ColourSection";
import { ContactSection } from "@/sections/ContactSection";
import { DesignSection } from "@/sections/DesignSection";
import { HeroSection } from "@/sections/HeroSection";
import { InteriorSection } from "@/sections/InteriorSection";
import { LightSection } from "@/sections/LightSection";
import { PerformanceSection } from "@/sections/PerformanceSection";
import { TerrainSection } from "@/sections/TerrainSection";
import { VehicleInfoSection } from "@/sections/VehicleInfoSection";

/**
 * The page is a sequence of self-contained chapters (src/sections). Each one
 * owns its markup and anchor; they scroll over the fixed 3D layer, so the
 * page stays server-rendered and readable without JavaScript. Order matches
 * siteConfig.nav. The film ends at Contact (fade to ink); the vehicle
 * information follows as an opaque appendix, outside the shot list.
 */
export default async function HomePage() {
  const copy = await getServerCopy();
  return (
    <>
      {/* Fixed 3D layer behind the page; renders nothing without JS or on the static tier. */}
      <ExperienceRoot loadingLabel={copy.loading3d} />
      <main id="main" className="relative z-10">
        <HeroSection />
        <DesignSection />
        <LightSection />
        <TerrainSection />
        <InteriorSection />
        <PerformanceSection />
        <ColourSection />
        <ContactSection />
        <VehicleInfoSection />
      </main>
    </>
  );
}
