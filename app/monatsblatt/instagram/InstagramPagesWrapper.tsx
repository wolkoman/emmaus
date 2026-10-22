"use client";

import dynamic from "next/dynamic";
import type { InstagramContentSection } from "./types";

const InstagramPages = dynamic(() => import("./InstagramPages"), {
  ssr: false,
});

export default function InstagramPagesWrapper(props: {
  coverText: string;
  issueName: string;
  filenamePrefix: string;
  sections: InstagramContentSection[];
}) {
  return (
    <InstagramPages
      title={props.coverText}
      issueName={props.issueName}
      filenamePrefix={props.filenamePrefix}
      sections={props.sections}
    />
  );
}
