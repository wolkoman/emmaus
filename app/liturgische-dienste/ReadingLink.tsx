import {
  CpLiturgyRoster,
  CpLiturgyRosterPosition,
} from "@/util/cockpit.generated";
import { Liturgy } from "@/domain/liturgy/liturgy-data";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FiExternalLink } from "react-icons/fi";
import React from "react";
import { cn } from "@/util/utils";

export function ReadingLink(props: {
  roster: CpLiturgyRoster;
  liturgy: Liturgy;
  className?: string;
}) {
  const link =
    props.roster.position === CpLiturgyRosterPosition.READER1
      ? props.liturgy.reading1
      : props.roster.position === CpLiturgyRosterPosition.READER2
        ? props.liturgy.reading2
        : null;
  if (!link) return null;
  return (
    <Link
      target="_blank"
      href={`https://www.bibleserver.com/EU/${encodeURIComponent(link)}`}
    >
      <Button variant="link" className={cn("text-base", props.className)}>
        {link}
        <FiExternalLink className="inline-block text-sm" />
      </Button>
    </Link>
  );
}
