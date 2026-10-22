"use client";

import { CopyArticleLinkButton } from "@/app/redaktion/CopyArticleLinkButton";
import { Button } from "@/components/ui/button";
import { PiGoogleDriveLogo } from "react-icons/pi";

interface ArticleQuickLinksProps {
  articleId: string;
  gid?: string;
}

export function ArticleQuickLinks({ articleId, gid }: ArticleQuickLinksProps) {
  return (
    <div className="flex items-center gap-1 pl-2">
      <CopyArticleLinkButton articleId={articleId} />
      {gid && (
        <a
          href={`https://docs.google.com/document/d/${gid}/edit`}
          target="_blank"
          rel="noopener noreferrer"
          title="Google Doc öffnen"
          aria-label="Google Doc öffnen"
        >
          <Button variant="ghost" size="icon-sm">
            <PiGoogleDriveLogo />
          </Button>
        </a>
      )}
    </div>
  );
}
