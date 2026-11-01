import { ArticleFeed } from "@/app/ArticleFeed";
import { WelcomeAndFeatured } from "@/app/mission";
import { ComingUp } from "@/components/calendar/ComingUp";
import Map from "@/components/calendar/Map";
import { CoverImage } from "@/components/CoverImage";
import TopBar from "@/components/nav/TopBar";
import { Suspense } from "react";
import Responsive from "../components/Responsive";
import Site from "../components/Site";
import { Banner1 } from "./banner1";
import { CarloTeaser } from "./CarloTeaser";
import { ContactSection } from "./ContactSection";
import { UntilLivestreamEnds } from "./UntilLivestreamEnds";

export default async function HomePage() {
  return (
    <Site responsive={false} navbar={false}>
      <Responsive>
        <TopBar />
      </Responsive>
      <div className="mx-auto w-full max-w-6xl px-4 lg:mb-16">
        <CoverImage />
        <UntilLivestreamEnds during={<CarloTeaser />} after={null} />
      </div>
      <Responsive>
        <WelcomeAndFeatured />
        <Suspense>
          <ArticleFeed />
        </Suspense>
      </Responsive>
      <Banner1 />
      <Responsive>
        <Suspense>
          <ComingUp />
        </Suspense>
        <Map />
        <ContactSection />
      </Responsive>
    </Site>
  );
}
