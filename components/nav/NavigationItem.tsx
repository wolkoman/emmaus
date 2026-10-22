import { navigationMenuTriggerStyle } from "@/components/ui/navigation-menu";
import { cn } from "@/util/utils";
import Link from "next/link";
import * as Icons from "react-icons/pi";

export const DynamicPiIcon = (props: { name: string; className: string }) => {
  const IconComponent = Icons[props.name as "PiUsers"];
  return IconComponent ? (
    <IconComponent className={props.className} />
  ) : (
    <Icons.PiCircle className={props.className} />
  );
};

export function NavigationItem(props: {
  icon: string;
  href?: string;
  title: string;
  slogan?: string;
}) {
  return (
    <Link
      href={props.href ?? ""}
      className={cn(
        navigationMenuTriggerStyle(),
        props.href === undefined && "pointer-events-none",
        "flex h-auto w-full flex-row items-start justify-start gap-3 px-3 py-2.5",
      )}
    >
      <DynamicPiIcon name={props.icon} className="mt-0.5 shrink-0 text-lg" />
      <div className="w-full">
        <div className="font-semibold">{props.title}</div>
        {props.slogan && (
          <div className="text-sm font-normal text-neutral-500">
            {props.slogan}
          </div>
        )}
      </div>
    </Link>
  );
}
