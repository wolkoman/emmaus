import { cn } from "@/util/utils";
import { ReactNode } from "react";

export function SectionHeader(props: {
  children: ReactNode;
  id?: string;
  className?: string;
}) {
  return (
    <div
      id={props.id}
      className={cn("mb-2 mt-8 text-xl font-semibold", props.className)}
    >
      {props.children}
    </div>
  );
}
