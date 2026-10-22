"use client";

import { LIVESTREAM, LIVESTREAM_ENDS_AFTER } from "@/app/carlo/livestream";
import { ReactNode, useEffect, useState } from "react";

/** Shows `during` until the livestream is over; checked in the browser because the homepage is cached for hours. */
export function UntilLivestreamEnds(props: {
  during: ReactNode;
  after: ReactNode;
}) {
  const [ended, setEnded] = useState(false);
  useEffect(() => {
    setEnded(Date.now() > Date.parse(LIVESTREAM.start) + LIVESTREAM_ENDS_AFTER);
  }, []);
  return ended ? props.after : props.during;
}
