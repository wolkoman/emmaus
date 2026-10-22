import React from "react";
import { fetchEmmausSites } from "../(shared)/Sites";
import { notFound } from "next/navigation";
import Site from "@/components/Site";
import { RenderCpWysiwyg } from "@/components/renderCpLayout";
import { Metadata } from "next";
import { SiteBreadcrumb, SiteChildren } from "./SiteNavigation";
import { Suspense } from "react";
import { formatDate } from "../(shared)/Localization";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;

  try {
    const sites = await fetchEmmausSites();
    const site = sites.find((site) => site.slug === slug);

    if (!site) {
      return {
        title: "Seite nicht gefunden",
        description: "Die angeforderte Seite wurde nicht gefunden.",
      };
    }

    return {
      title: `${site.name} | Pfarre Emmaus am Wienerberg`,
      description: site.html
        ? site.html
            .replace(/<[^>]*>/g, " ")
            .trim()
            .substring(0, 160)
        : `${site.name} - Pfarre Emmaus am Wienerberg`,
      openGraph: {
        title: site.name,
        description: `${site.name} - Pfarre Emmaus am Wienerberg`,
        type: "website",
        images: "/opengraph-image",
      },
    };
  } catch (error) {
    return {
      title: "Pfarre Emmaus am Wienerberg",
      description: "Katholische Pfarre im zehnten Wiener Gemeindebezirk",
    };
  }
}

async function SiteContent({ slug }: { slug: string }) {
  const sites = await fetchEmmausSites();
  const site = sites.find((site) => site.slug === slug);

  if (!site) {
    notFound();
  }

  return (
    <article>
      <header className="mx-auto w-full max-w-3xl px-4 pt-8 lg:pt-16">
        <SiteBreadcrumb site={site} />
        <h1 className="mt-3 text-4xl leading-tight font-bold tracking-tight text-balance lg:text-5xl">
          {site.name}
        </h1>
      </header>

      <div className="mx-auto w-full max-w-3xl px-4 pt-10">
        <RenderCpWysiwyg content={site.html} />

        <div className="mt-10 text-sm text-neutral-500">
          Zuletzt geändert am{" "}
          {formatDate(site._modified ?? 0, {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </div>
      </div>

      {site.children.length > 0 && (
        <div className="mx-auto w-full max-w-3xl px-4 pt-12">
          <SiteChildren site={site} />
        </div>
      )}

      <div className="pb-16" />
    </article>
  );
}

export default async function SitePage(props: PageProps) {
  const params = await props.params;

  return (
    <Site responsive={false}>
      <Suspense
        fallback={
          <div className="mx-auto w-full max-w-3xl px-4 pt-8 lg:pt-16">
            <div className="h-10 w-2/3 animate-pulse rounded bg-gray-200"></div>
            <div className="mt-10 space-y-4">
              <div className="h-4 animate-pulse rounded bg-gray-200"></div>
              <div className="h-4 animate-pulse rounded bg-gray-200"></div>
              <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200"></div>
            </div>
          </div>
        }
      >
        <SiteContent slug={params.slug} />
      </Suspense>
    </Site>
  );
}
