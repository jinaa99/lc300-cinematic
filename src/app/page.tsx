import { HeroSection } from "@/sections/HeroSection";

/**
 * The page is a sequence of self-contained sections (src/sections). Each one
 * owns its markup and anchors; motion is layered on from client wrappers so
 * the page stays server-rendered and readable without JavaScript.
 */
export default function HomePage() {
  return <HeroSection />;
}
