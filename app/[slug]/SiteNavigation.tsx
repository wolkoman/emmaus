import React from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Links } from "../(shared)/Links";
import { CpSiteStructure } from "../(shared)/Sites";

export function SiteBreadcrumb({ site }: { site: CpSiteStructure }) {
  if (!site.parent) return null;

  return (
    <Link
      href={Links.Seite(site.parent.slug)}
      className="group inline-flex items-center gap-1.5 text-sm font-medium text-neutral-500 transition-colors hover:text-neutral-900"
    >
      <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
      {site.parent.name}
    </Link>
  );
}

export function SiteChildren({ site }: { site: CpSiteStructure }) {
  if (!site.children.length) return null;

  return (
    <nav aria-label="Weitere Seiten">
      <h2 className="mb-4 text-sm font-semibold tracking-wide text-neutral-500 uppercase">
        Weitere Seiten
      </h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {site.children.map((child) => (
          <Link
            key={child.slug}
            href={Links.Seite(child.slug)}
            className="group flex items-center justify-between gap-3 rounded-xl border border-neutral-200 px-4 py-3 transition-colors hover:border-neutral-300 hover:bg-neutral-50"
          >
            <span className="font-medium">{child.name}</span>
            <ArrowRight className="h-4 w-4 shrink-0 text-neutral-400 transition-transform group-hover:translate-x-0.5 group-hover:text-neutral-600" />
          </Link>
        ))}
      </div>
    </nav>
  );
}
