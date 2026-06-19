import { LandingAbout } from "@/components/landing/LandingAbout";
import { LandingFooterCta } from "@/components/landing/LandingFooterCta";
import { LandingHashScroll } from "@/components/landing/LandingHashScroll";
import { LandingHero } from "@/components/landing/LandingHero";
import { LandingHowItWorks } from "@/components/landing/LandingHowItWorks";
import { LandingPageBackground } from "@/components/landing/LandingPageBackground";
import { LandingProductivity } from "@/components/landing/LandingProductivity";
import { LandingSafety } from "@/components/landing/LandingSafety";
import { Nav } from "@/components/Nav";

export default function Home() {
  return (
    <main className="relative min-h-screen bg-black text-white">
      <LandingPageBackground />
      <LandingHashScroll />

      <div className="relative z-[1]">
        <Nav />
        <LandingHero />
        <LandingAbout />
        <LandingHowItWorks />
        <LandingProductivity />
        <LandingSafety />
        <LandingFooterCta />
      </div>
    </main>
  );
}
