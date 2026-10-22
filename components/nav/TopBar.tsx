import { Links } from "@/app/(shared)/Links";
import { Loading } from "@/components/Loading";
import { AboutCards, AboutMenu } from "@/components/nav/AboutItems";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
  NavigationMenuViewport,
} from "@/components/ui/navigation-menu";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";

import { InternItems, InternNavLink } from "@/components/nav/InternItems";
import { PiList } from "react-icons/pi";
import { CurrentItems } from "./CurrentItems";

export default function TopBar() {
  return (
    <div
      className={`relative z-30 flex flex-row items-center justify-between py-4 print:hidden`}
    >
      <Link href={Links.Hauptseite}>
        <div className="flex cursor-pointer items-center gap-3">
          <Image
            width={32}
            height={32}
            src="/logo.svg"
            alt="Logo der Pfarre Emmaus"
            className="rounded-full"
          />
          <div className="font-semibold">Pfarre Emmaus am Wienerberg</div>
        </div>
      </Link>
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem className="hidden lg:block">
            <NavigationMenuTrigger>Über uns</NavigationMenuTrigger>
            <NavigationMenuContent>
              <Suspense fallback={<Loading />}>
                <AboutMenu />
              </Suspense>
            </NavigationMenuContent>
          </NavigationMenuItem>
          <NavigationMenuItem className="hidden lg:block">
            <Link href={Links.Termine} className={navigationMenuTriggerStyle()}>
              Termine
            </Link>
          </NavigationMenuItem>
          <NavigationMenuItem className="hidden lg:block">
            <Link
              href={Links.Monatsblatt}
              className={navigationMenuTriggerStyle()}
            >
              Monatsblatt
            </Link>
          </NavigationMenuItem>
          <NavigationMenuItem className="hidden lg:block">
            <InternNavLink />
          </NavigationMenuItem>

          <NavigationMenuItem value="r5" className="lg:hidden">
            <NavigationMenuTrigger>
              <PiList />
            </NavigationMenuTrigger>
            <NavigationMenuContent>
              <div className="flex flex-col gap-2 p-1">
                <div className="grid grid-cols-2 gap-2">
                  <CurrentItems />
                </div>
                <Suspense fallback={<Loading />}>
                  <AboutCards />
                </Suspense>
                <div className="grid grid-cols-2 gap-1 border-t border-black/5 pt-2">
                  <InternItems />
                </div>
              </div>
            </NavigationMenuContent>
          </NavigationMenuItem>
        </NavigationMenuList>
        <div className="top-full left-0 flex w-full lg:absolute lg:justify-center">
          <NavigationMenuViewport />
        </div>
      </NavigationMenu>
    </div>
  );
}
