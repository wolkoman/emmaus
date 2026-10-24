import { slugifyTitle } from "@/app/(shared)/slugify";

export const Links = {
  Hauptseite: "/",
  Archiv: "/archiv",
  Impressum: "/impressum",
  Termine: "/termine",
  Monatsblatt: "/monatsblatt",
  MonatsblattEditor: "/monatsblatt/editor",
  Verlautbarungen: "/verlautbarungen",
  Alpha: "/alpha",
  /**
   * Without an article: the "Beiträge" index. With one: its detail page, as
   * `/artikel/<id>/<slug>`. The id is what's resolved server-side; the slug is
   * cosmetic, so links stay valid when a title changes.
   */
  Artikel: (artikel?: { _id: string; title: string }) =>
    artikel
      ? `/artikel/${artikel._id}/${slugifyTitle(artikel.title)}`
      : "/artikel",
  Intern: "/intern",
  DiensteUebersicht: "/liturgische-dienste",
  Projektplattform: "/redaktion",
  ProjektplattformProjekt: (id: string) => `/redaktion/${id}`,
  ProjektplattformArtikel: (id: any) => `/redaktion/artikel/${id}`,
  ProjektplattformVersion: (id: any) => `/redaktion/artikel/${id}/version`,
  PasswortÄndern: "/intern/change-password",
  Sicherheit: "/intern/sicherheit",
  PasswortVergessen: "/intern/passwort-vergessen",
  PasswortZuruecksetzen: "/intern/passwort-zuruecksetzen",
  Login: "/intern/login",
  LoginRedirect: (path: string) =>
    `/intern/login?redirect=${encodeURIComponent(path)}`,
  Logout: "/intern/logout",
  Resourcen: "/resourcen",
  Postfach: "/postfach",
  PostfachOrdner: (mailbox: string, folder: string) =>
    `/postfach/${mailbox}/${folder}`,
  PostfachMail: (mailbox: string, folder: string, uid: number) =>
    `/postfach/${mailbox}/${folder}/${uid}`,
  PostfachNeu: (mailbox: string) => `/postfach/${mailbox}/neu`,
  PostfachListe: (mailbox: string) => `/postfach/${mailbox}/liste`,
  PostfachBenachrichtigung: (mailbox: string) =>
    `/postfach/${mailbox}/benachrichtigung`,
  Seite: (slug: string) => `/${slug}`,
};
