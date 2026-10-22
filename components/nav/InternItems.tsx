"use client";
import { Links } from "@/app/(shared)/Links";
import { NavigationItem } from "@/components/nav/NavigationItem";
import { navigationMenuTriggerStyle } from "@/components/ui/navigation-menu";
import { useUserStore } from "@/store/UserStore";
import { cn } from "@/util/utils";
import Link from "next/link";
import { PiHouseBold, PiSignIn, PiSignInBold } from "react-icons/pi";

export function InternItems() {
  const person = useUserStore((state) => state.person);
  return (
    <>
      {person ? (
        <>
          {/* The internal areas themselves are listed on Mein Bereich. */}
          <NavigationItem
            icon="PiHouse"
            href={Links.Intern}
            title="Mein Bereich"
          />
          <NavigationItem
            icon="PiHandWaving"
            href={Links.Logout}
            title="Logout"
          />
        </>
      ) : (
        <>
          <Link
            href={Links.Login}
            className={cn(
              navigationMenuTriggerStyle(),
              "col-span-2 hidden h-auto w-full flex-row items-start gap-2 px-12 lg:flex",
            )}
          >
            <PiSignIn className={"mt-1 text-lg"} />
            <div className="w-full">
              <div>Anmelden</div>
              <div className="text-sm font-medium text-gray-600">
                Zugang zum internen Bereich
              </div>
            </div>
          </Link>
          <Link
            href={Links.Login}
            className={cn(
              navigationMenuTriggerStyle(),
              "col-span-2 flex h-auto w-full flex-row items-center justify-center gap-2 rounded-none border-t border-neutral-200 pt-2 pb-1 text-sm font-normal lg:hidden",
            )}
          >
            <PiSignIn />
            Anmelden
          </Link>
        </>
      )}
    </>
  );
}

/** Desktop navbar entry: straight to Mein Bereich, or to the login. */
export function InternNavLink() {
  const person = useUserStore((state) => state.person);
  return (
    <Link
      href={person ? Links.Intern : Links.Login}
      title={person ? "Mein Bereich" : "Anmelden"}
      aria-label={person ? "Mein Bereich" : "Anmelden"}
      className={navigationMenuTriggerStyle()}
    >
      {person ? <PiHouseBold /> : <PiSignInBold />}
    </Link>
  );
}
