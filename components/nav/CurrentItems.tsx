import { Links } from "@/app/(shared)/Links";
import Link from "next/link";
import type { IconType } from "react-icons";
import { PiCalendarBlank, PiCalendarDots } from "react-icons/pi";

const ITEMS: {
  href: string;
  title: string;
  text: string;
  Icon: IconType;
}[] = [
  {
    href: Links.Termine,
    title: "Termine",
    text: "Alle Veranstaltungen der kommenden Zeit",
    Icon: PiCalendarBlank,
  },
  {
    href: Links.Monatsblatt,
    title: "Monatsblatt",
    text: "Alle Termine des Monats zum Mitnehmen",
    Icon: PiCalendarDots,
  },
];

/** Mobile menu: the invitations to join something, most prominent. */
export function CurrentItems() {
  return (
    <>
      {ITEMS.map(({ href, title, text, Icon }) => (
        <Link
          key={href}
          href={href}
          className="bg-emmaus hover:bg-emmaus/90 flex flex-col gap-1 rounded-lg p-4 text-white transition-colors"
        >
          <Icon className="mb-2 size-7" />
          <div className="text-lg font-bold">{title}</div>
          <div className="text-sm leading-snug text-white/85">{text}</div>
        </Link>
      ))}
    </>
  );
}
