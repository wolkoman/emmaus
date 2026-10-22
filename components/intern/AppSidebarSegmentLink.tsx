"use client";

import { AppSidebarLink } from "@/components/intern/AppSidebar";
import { useSelectedLayoutSegment } from "next/navigation";
import { ReactNode } from "react";

/**
 * Sidebar entry inside a layout: the layout doesn't re-render on navigation,
 * so the active state comes from the URL segment below it. `segment` null is
 * the layout's own index page.
 */
export function AppSidebarSegmentLink(props: {
  href: string;
  segment: string | null;
  icon: ReactNode;
  children: ReactNode;
}) {
  const active = useSelectedLayoutSegment() === props.segment;
  return (
    <AppSidebarLink href={props.href} active={active} icon={props.icon}>
      {props.children}
    </AppSidebarLink>
  );
}
