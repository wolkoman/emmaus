import { notFound } from "next/navigation";
import { LIVE_LANGS, LiveLang } from "../i18n";
import { carloMetadata, CarloPage } from "../CarloPage";

export function generateStaticParams() {
  return LIVE_LANGS.map((lang) => ({ lang }));
}

function parseLang(lang: string): LiveLang {
  if (!(LIVE_LANGS as readonly string[]).includes(lang)) notFound();
  return lang as LiveLang;
}

export async function generateMetadata(props: {
  params: Promise<{ lang: string }>;
}) {
  return carloMetadata(parseLang((await props.params).lang));
}

export default async function Page(props: {
  params: Promise<{ lang: string }>;
}) {
  return <CarloPage lang={parseLang((await props.params).lang)} />;
}
