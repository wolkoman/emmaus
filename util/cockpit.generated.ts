import {
  getCollection as _fetchCollection,
  getOneCollection as _fetchOneCollection,
  deleteCollection,
  saveCollection,
  saveInternalDataCollection,
} from "cockpit-client/dist/rest";
import {
  CpCollection,
  CpCollectionLink,
  CpEntries,
  CpFile,
  CpFilter,
  CpImage,
  CpLayout,
  CpOneEntry,
  CpSaveData,
  CpSingleton,
  CpSort,
} from "cockpit-client/dist/standard";

export interface CpPaperProjects extends CpCollection {
  __collectionName: "paper_projects";
  name: string;
  deadline: string;
  printrelease: string;
  published: string;
  pdfUrl: string;
  coverUrl: string;
}
export interface CpLiturgyEvent extends CpCollection {
  __collectionName: "liturgyEvent";
  cancellations: CpLiturgyEventCancellations[];
  date: string;
  liturgyName: string;
  eventId: string;
}
export interface CpLiturgyEventCancellations extends CpCollection {
  __collectionName: "CpLiturgyEventCancellations";
  value: string;
}
export interface CpSite extends CpCollection {
  __collectionName: "site";
  name: string;
  layout: CpLayout;
  slug: string;
  title: string;
  summary: string;
  icon: string;
}
export interface CpReservations extends CpCollection {
  __collectionName: "reservations";
  occasion: string;
  times: CpReservationsTimes[];
  contact_name: string;
  contact_phone: string;
  contact_relation: string;
  contact_mail: string;
  rooms: CpReservationsRooms[];
  access: boolean;
  access_via: string;
  approved_sitemanager: string;
  approved_sitemanager_at: boolean;
  sitemanager_secret: string;
  approved_reverend: string;
  approved_reverend_at: boolean;
  reverend_secret: string;
}
export interface CpReservationsTimes extends CpCollection {
  __collectionName: "CpReservationsTimes";
  value: any;
}
export interface CpReservationsRooms extends CpCollection {
  __collectionName: "CpReservationsRooms";
  value: string;
}
export interface CpEmmausbote extends CpCollection {
  __collectionName: "Emmausbote";
  date: string;
  file: CpFile;
  preview: CpImage;
}
export interface CpPerson extends CpCollection {
  __collectionName: "person";
  username: string;
  name: string;
  email: string;
  competences: CpPersonCompetences[];
  code: string;
  active: boolean;
  last_login: string;
  whatsapp_id: string;
  liturgyRemindersDisabled?: boolean;
  /** Set on login tokens of people who are also PB admins. */
  admin?: boolean;
}
export enum CpPersonCompetences {
  "Calendar" = "calendar",
  "Instagram" = "instagram",
  "CalendarAdministration" = "calendar_administration",
  "Editor" = "editor",
  "WeeklyEditor" = "weekly_editor",
  "Reader" = "reader",
  "CommunionMinister" = "communion_minister",
  "Sacristan" = "sacristan",
  "Musician" = "musician",
  "ReaderPlanning" = "reader_planning",
  "CommunionMinisterPlanning" = "communion_minister_planning",
  "SacristanPlanning" = "sacristan_planning",
  "MusicianPlanning" = "musician_planning",
  "MailEvents" = "mail:events",
}
export interface CpInternalData extends CpCollection {
  __collectionName: "internal-data";
  id: string;
  data: any;
  typeDefinition: string;
}
export interface CpWhatsappVerification extends CpCollection {
  __collectionName: "whatsapp_verification";
  person_id: string;
  code: string;
  expires_at: string;
}
export interface CpArticles extends CpCollection {
  __collectionName: "articles";
  title: string;
  title_slug: string;
  author: string;
  picture: CpImage;
  content: string;
  public: boolean;
  published_at: string;
}
export interface CpPaperArticles extends CpCollection {
  __collectionName: "paper_articles";
  name: string;
  project: CpCollectionLink;
  status: CpPaperArticlesStatus;
  author: string;
  format: CpPaperArticlesFormat;
  char_min: number;
  char_max: number;
  gid: string;
}
export enum CpPaperArticlesStatus {
  "Writing" = "writing",
  "Written" = "written",
  "Corrected" = "corrected",
  "Finished" = "finished",
}
export enum CpPaperArticlesFormat {
  "C2200x3000x3/4" = "C2200x3000x3/4",
  "C2600x3600x1" = "C2600x3600x1",
  "C1300x1800x1/2" = "C1300x1800x1/2",
  "C100x2000x~" = "C100x2000x~",
  "C3600x5400x2" = "C3600x5400x2",
  "C4100x4900x1_1/2" = "C4100x4900x1_1/2",
  "C5400x7200x3" = "C5400x7200x3",
  "C800x1000x1/3" = "C800x1000x1/3",
}
export interface CpWeeklyE extends CpCollection {
  __collectionName: "weekly_e";
  name: string;
  start: string;
  end: string;
  data: any;
  sent: boolean;
}
export interface CpNewsletter extends CpCollection {
  __collectionName: "newsletter";
  mail: string;
  token: string;
  active: boolean;
}
export interface CpLiturgyRoster extends CpCollection {
  __collectionName: "liturgyRoster";
  status: CpLiturgyRosterStatus;
  position: CpLiturgyRosterPosition;
  liturgyEventId: string;
  userId: string;
  userName: string;
  reminderSent?: string;
}
export enum CpLiturgyRosterStatus {
  "Assigned" = "assigned",
  "Informed" = "informed",
  "Cancelled" = "cancelled",
}
export enum CpLiturgyRosterPosition {
  "READER1" = "READER1",
  "READER2" = "READER2",
  "MUSICIAN" = "MUSICIAN",
  "SACRISTAN" = "SACRISTAN",
}
export interface CpArticle extends CpCollection {
  __collectionName: "article";
  title: string;
  title_slug: string;
  author: string;
  preview_image: CpImage;
  layout: CpLayout;
  slug: string;
  platform: CpArticlePlatform;
  html: string;
  public: boolean;
}
export enum CpArticlePlatform {
  "Emmaus" = "emmaus",
  "Eni" = "eni",
}
export interface CpCache extends CpCollection {
  __collectionName: "cache";
  key: string;
  value: string;
}
export interface CpSharedLinks extends CpCollection {
  __collectionName: "shared_links";
  expiration: string;
  ids: CpSharedLinksIds[];
  folder: string;
}
export interface CpSharedLinksIds extends CpCollection {
  __collectionName: "CpSharedLinksIds";
  value: any;
}
export interface CpPaperStats extends CpCollection {
  __collectionName: "paper_stats";
  writing: number;
  written: number;
  corrected: number;
  finished: number;
  project: CpCollectionLink;
  day: string;
}
export interface CpAlphaRegistration extends CpCollection {
  __collectionName: "alpha_registration";
  name: string;
  phone: string;
  mail: string;
  postal: string;
}
export interface CpPaperTexts extends CpCollection {
  __collectionName: "paper_texts";
  article: CpCollectionLink;
  text: string;
  datetime: string;
}
export type CpEvents = CpSingleton<{}>;
export type CpLiturgy = CpSingleton<
  Record<
    string,
    {
      name: string;
      rank: string;
      color: string;
      reading1: string;
      reading2: string;
      psalm: string;
      evangelium: string;
    }[]
  >
>;
export type CpImpressum = CpSingleton<{ content: string; title: string }>;

export function fetchCpPaperProjects(
  filter?: CpFilter<CpPaperProjects>,
  sort?: CpSort<CpPaperProjects>,
): CpEntries<CpPaperProjects> {
  return _fetchCollection("paper_projects", filter, sort);
}

export function fetchOneCpPaperProjects(
  filter?: CpFilter<CpPaperProjects>,
  sort?: CpSort<CpPaperProjects>,
): CpOneEntry<CpPaperProjects> {
  return _fetchOneCollection("paper_projects", filter, sort);
}

export function saveCpPaperProjects(
  data: CpSaveData<CpPaperProjects>,
): CpOneEntry<CpPaperProjects> {
  return saveCollection("paper_projects", data);
}

export function deleteCpPaperProjects(id: string): Promise<void> {
  return deleteCollection("paper_projects", id);
}
export function fetchCpLiturgyEvent(
  filter?: CpFilter<CpLiturgyEvent>,
  sort?: CpSort<CpLiturgyEvent>,
): CpEntries<CpLiturgyEvent> {
  return _fetchCollection("liturgyEvent", filter, sort);
}

export function fetchOneCpLiturgyEvent(
  filter?: CpFilter<CpLiturgyEvent>,
  sort?: CpSort<CpLiturgyEvent>,
): CpOneEntry<CpLiturgyEvent> {
  return _fetchOneCollection("liturgyEvent", filter, sort);
}

export function saveCpLiturgyEvent(
  data: CpSaveData<CpLiturgyEvent>,
): CpOneEntry<CpLiturgyEvent> {
  return saveCollection("liturgyEvent", data);
}

export function deleteCpLiturgyEvent(id: string): Promise<void> {
  return deleteCollection("liturgyEvent", id);
}
export function fetchCpSite(
  filter?: CpFilter<CpSite>,
  sort?: CpSort<CpSite>,
): CpEntries<CpSite> {
  return _fetchCollection("site", filter, sort);
}

export function fetchOneCpSite(
  filter?: CpFilter<CpSite>,
  sort?: CpSort<CpSite>,
): CpOneEntry<CpSite> {
  return _fetchOneCollection("site", filter, sort);
}

export function saveCpSite(data: CpSaveData<CpSite>): CpOneEntry<CpSite> {
  return saveCollection("site", data);
}

export function deleteCpSite(id: string): Promise<void> {
  return deleteCollection("site", id);
}
export function fetchCpReservations(
  filter?: CpFilter<CpReservations>,
  sort?: CpSort<CpReservations>,
): CpEntries<CpReservations> {
  return _fetchCollection("reservations", filter, sort);
}

export function fetchOneCpReservations(
  filter?: CpFilter<CpReservations>,
  sort?: CpSort<CpReservations>,
): CpOneEntry<CpReservations> {
  return _fetchOneCollection("reservations", filter, sort);
}

export function saveCpReservations(
  data: CpSaveData<CpReservations>,
): CpOneEntry<CpReservations> {
  return saveCollection("reservations", data);
}

export function deleteCpReservations(id: string): Promise<void> {
  return deleteCollection("reservations", id);
}
export function fetchCpEmmausbote(
  filter?: CpFilter<CpEmmausbote>,
  sort?: CpSort<CpEmmausbote>,
): CpEntries<CpEmmausbote> {
  return _fetchCollection("Emmausbote", filter, sort);
}

export function fetchOneCpEmmausbote(
  filter?: CpFilter<CpEmmausbote>,
  sort?: CpSort<CpEmmausbote>,
): CpOneEntry<CpEmmausbote> {
  return _fetchOneCollection("Emmausbote", filter, sort);
}

export function saveCpEmmausbote(
  data: CpSaveData<CpEmmausbote>,
): CpOneEntry<CpEmmausbote> {
  return saveCollection("Emmausbote", data);
}

export function deleteCpEmmausbote(id: string): Promise<void> {
  return deleteCollection("Emmausbote", id);
}
export function fetchCpPerson(
  filter?: CpFilter<CpPerson>,
  sort?: CpSort<CpPerson>,
): CpEntries<CpPerson> {
  return _fetchCollection("person", filter, sort);
}

export function fetchOneCpPerson(
  filter?: CpFilter<CpPerson>,
  sort?: CpSort<CpPerson>,
): CpOneEntry<CpPerson> {
  return _fetchOneCollection("person", filter, sort);
}

export function saveCpPerson(data: CpSaveData<CpPerson>): CpOneEntry<CpPerson> {
  return saveCollection("person", data);
}

export function deleteCpPerson(id: string): Promise<void> {
  return deleteCollection("person", id);
}
export function fetchCpInternalData(
  filter?: CpFilter<CpInternalData>,
  sort?: CpSort<CpInternalData>,
): CpEntries<CpInternalData> {
  return _fetchCollection("internal-data", filter, sort);
}

export function fetchOneCpInternalData(
  filter?: CpFilter<CpInternalData>,
  sort?: CpSort<CpInternalData>,
): CpOneEntry<CpInternalData> {
  return _fetchOneCollection("internal-data", filter, sort);
}

export function saveCpInternalData(
  data: CpSaveData<CpInternalData>,
): CpOneEntry<CpInternalData> {
  return saveCollection("internal-data", data);
}

export function deleteCpInternalData(id: string): Promise<void> {
  return deleteCollection("internal-data", id);
}
export function fetchCpWhatsappVerification(
  filter?: CpFilter<CpWhatsappVerification>,
  sort?: CpSort<CpWhatsappVerification>,
): CpEntries<CpWhatsappVerification> {
  return _fetchCollection("whatsapp_verification", filter, sort);
}

export function fetchOneCpWhatsappVerification(
  filter?: CpFilter<CpWhatsappVerification>,
  sort?: CpSort<CpWhatsappVerification>,
): CpOneEntry<CpWhatsappVerification> {
  return _fetchOneCollection("whatsapp_verification", filter, sort);
}

export function saveCpWhatsappVerification(
  data: CpSaveData<CpWhatsappVerification>,
): CpOneEntry<CpWhatsappVerification> {
  return saveCollection("whatsapp_verification", data);
}

export function deleteCpWhatsappVerification(id: string): Promise<void> {
  return deleteCollection("whatsapp_verification", id);
}
export function fetchCpArticles(
  filter?: CpFilter<CpArticles>,
  sort?: CpSort<CpArticles>,
): CpEntries<CpArticles> {
  return _fetchCollection("articles", filter, sort);
}

export function fetchOneCpArticles(
  filter?: CpFilter<CpArticles>,
  sort?: CpSort<CpArticles>,
): CpOneEntry<CpArticles> {
  return _fetchOneCollection("articles", filter, sort);
}

export function saveCpArticles(
  data: CpSaveData<CpArticles>,
): CpOneEntry<CpArticles> {
  return saveCollection("articles", data);
}

export function deleteCpArticles(id: string): Promise<void> {
  return deleteCollection("articles", id);
}
export function fetchCpPaperArticles(
  filter?: CpFilter<CpPaperArticles>,
  sort?: CpSort<CpPaperArticles>,
): CpEntries<CpPaperArticles> {
  return _fetchCollection("paper_articles", filter, sort);
}

export function fetchOneCpPaperArticles(
  filter?: CpFilter<CpPaperArticles>,
  sort?: CpSort<CpPaperArticles>,
): CpOneEntry<CpPaperArticles> {
  return _fetchOneCollection("paper_articles", filter, sort);
}

export function saveCpPaperArticles(
  data: CpSaveData<CpPaperArticles>,
): CpOneEntry<CpPaperArticles> {
  return saveCollection("paper_articles", data);
}

export function deleteCpPaperArticles(id: string): Promise<void> {
  return deleteCollection("paper_articles", id);
}
export function fetchCpWeeklyE(
  filter?: CpFilter<CpWeeklyE>,
  sort?: CpSort<CpWeeklyE>,
): CpEntries<CpWeeklyE> {
  return _fetchCollection("weekly_e", filter, sort);
}

export function fetchOneCpWeeklyE(
  filter?: CpFilter<CpWeeklyE>,
  sort?: CpSort<CpWeeklyE>,
): CpOneEntry<CpWeeklyE> {
  return _fetchOneCollection("weekly_e", filter, sort);
}

export function saveCpWeeklyE(
  data: CpSaveData<CpWeeklyE>,
): CpOneEntry<CpWeeklyE> {
  return saveCollection("weekly_e", data);
}

export function deleteCpWeeklyE(id: string): Promise<void> {
  return deleteCollection("weekly_e", id);
}
export function fetchCpNewsletter(
  filter?: CpFilter<CpNewsletter>,
  sort?: CpSort<CpNewsletter>,
): CpEntries<CpNewsletter> {
  return _fetchCollection("newsletter", filter, sort);
}

export function fetchOneCpNewsletter(
  filter?: CpFilter<CpNewsletter>,
  sort?: CpSort<CpNewsletter>,
): CpOneEntry<CpNewsletter> {
  return _fetchOneCollection("newsletter", filter, sort);
}

export function saveCpNewsletter(
  data: CpSaveData<CpNewsletter>,
): CpOneEntry<CpNewsletter> {
  return saveCollection("newsletter", data);
}

export function deleteCpNewsletter(id: string): Promise<void> {
  return deleteCollection("newsletter", id);
}
export function fetchCpLiturgyRoster(
  filter?: CpFilter<CpLiturgyRoster>,
  sort?: CpSort<CpLiturgyRoster>,
): CpEntries<CpLiturgyRoster> {
  return _fetchCollection("liturgyRoster", filter, sort);
}

export function fetchOneCpLiturgyRoster(
  filter?: CpFilter<CpLiturgyRoster>,
  sort?: CpSort<CpLiturgyRoster>,
): CpOneEntry<CpLiturgyRoster> {
  return _fetchOneCollection("liturgyRoster", filter, sort);
}

export function saveCpLiturgyRoster(
  data: CpSaveData<CpLiturgyRoster>,
): CpOneEntry<CpLiturgyRoster> {
  return saveCollection("liturgyRoster", data);
}

export function deleteCpLiturgyRoster(id: string): Promise<void> {
  return deleteCollection("liturgyRoster", id);
}
export function fetchCpArticle(
  filter?: CpFilter<CpArticle>,
  sort?: CpSort<CpArticle>,
): CpEntries<CpArticle> {
  return _fetchCollection("article", filter, sort);
}

export function fetchOneCpArticle(
  filter?: CpFilter<CpArticle>,
  sort?: CpSort<CpArticle>,
): CpOneEntry<CpArticle> {
  return _fetchOneCollection("article", filter, sort);
}

export function saveCpArticle(
  data: CpSaveData<CpArticle>,
): CpOneEntry<CpArticle> {
  return saveCollection("article", data);
}

export function deleteCpArticle(id: string): Promise<void> {
  return deleteCollection("article", id);
}
export function fetchCpCache(
  filter?: CpFilter<CpCache>,
  sort?: CpSort<CpCache>,
): CpEntries<CpCache> {
  return _fetchCollection("cache", filter, sort);
}

export function fetchOneCpCache(
  filter?: CpFilter<CpCache>,
  sort?: CpSort<CpCache>,
): CpOneEntry<CpCache> {
  return _fetchOneCollection("cache", filter, sort);
}

export function saveCpCache(data: CpSaveData<CpCache>): CpOneEntry<CpCache> {
  return saveCollection("cache", data);
}

export function deleteCpCache(id: string): Promise<void> {
  return deleteCollection("cache", id);
}
export function fetchCpSharedLinks(
  filter?: CpFilter<CpSharedLinks>,
  sort?: CpSort<CpSharedLinks>,
): CpEntries<CpSharedLinks> {
  return _fetchCollection("shared_links", filter, sort);
}

export function fetchOneCpSharedLinks(
  filter?: CpFilter<CpSharedLinks>,
  sort?: CpSort<CpSharedLinks>,
): CpOneEntry<CpSharedLinks> {
  return _fetchOneCollection("shared_links", filter, sort);
}

export function saveCpSharedLinks(
  data: CpSaveData<CpSharedLinks>,
): CpOneEntry<CpSharedLinks> {
  return saveCollection("shared_links", data);
}

export function deleteCpSharedLinks(id: string): Promise<void> {
  return deleteCollection("shared_links", id);
}
export function fetchCpPaperStats(
  filter?: CpFilter<CpPaperStats>,
  sort?: CpSort<CpPaperStats>,
): CpEntries<CpPaperStats> {
  return _fetchCollection("paper_stats", filter, sort);
}

export function fetchOneCpPaperStats(
  filter?: CpFilter<CpPaperStats>,
  sort?: CpSort<CpPaperStats>,
): CpOneEntry<CpPaperStats> {
  return _fetchOneCollection("paper_stats", filter, sort);
}

export function saveCpPaperStats(
  data: CpSaveData<CpPaperStats>,
): CpOneEntry<CpPaperStats> {
  return saveCollection("paper_stats", data);
}

export function deleteCpPaperStats(id: string): Promise<void> {
  return deleteCollection("paper_stats", id);
}
export function fetchCpAlphaRegistration(
  filter?: CpFilter<CpAlphaRegistration>,
  sort?: CpSort<CpAlphaRegistration>,
): CpEntries<CpAlphaRegistration> {
  return _fetchCollection("alpha_registration", filter, sort);
}

export function fetchOneCpAlphaRegistration(
  filter?: CpFilter<CpAlphaRegistration>,
  sort?: CpSort<CpAlphaRegistration>,
): CpOneEntry<CpAlphaRegistration> {
  return _fetchOneCollection("alpha_registration", filter, sort);
}

export function saveCpAlphaRegistration(
  data: CpSaveData<CpAlphaRegistration>,
): CpOneEntry<CpAlphaRegistration> {
  return saveCollection("alpha_registration", data);
}

export function deleteCpAlphaRegistration(id: string): Promise<void> {
  return deleteCollection("alpha_registration", id);
}
export function fetchCpPaperTexts(
  filter?: CpFilter<CpPaperTexts>,
  sort?: CpSort<CpPaperTexts>,
): CpEntries<CpPaperTexts> {
  return _fetchCollection("paper_texts", filter, sort);
}

export function fetchOneCpPaperTexts(
  filter?: CpFilter<CpPaperTexts>,
  sort?: CpSort<CpPaperTexts>,
): CpOneEntry<CpPaperTexts> {
  return _fetchOneCollection("paper_texts", filter, sort);
}

export function saveCpPaperTexts(
  data: CpSaveData<CpPaperTexts>,
): CpOneEntry<CpPaperTexts> {
  return saveCollection("paper_texts", data);
}

export function deleteCpPaperTexts(id: string): Promise<void> {
  return deleteCollection("paper_texts", id);
}

export function fetchCpEvents(): Promise<CpEvents> {
  return _fetchOneCollection("internal-data", {
    _id: "61b335996165305292000383",
  }).then((x) => x.data);
}

export function saveCpEvents(data: CpSaveData<CpEvents>): Promise<CpEvents> {
  return saveInternalDataCollection("internal-data", {
    _id: "61b335996165305292000383",
    data,
  });
}

export function fetchCpLiturgy(): Promise<CpLiturgy> {
  return _fetchOneCollection("internal-data", {
    _id: "61b86ada3831347379000158",
  }).then((x) => x.data);
}

export function saveCpLiturgy(data: CpSaveData<CpLiturgy>): Promise<CpLiturgy> {
  return saveInternalDataCollection("internal-data", {
    _id: "61b86ada3831347379000158",
    data,
  });
}

export function fetchCpImpressum(): Promise<CpImpressum> {
  return _fetchOneCollection("internal-data", {
    _id: "675df468613062eb9e0000ed",
  }).then((x) => x.data);
}

export function saveCpImpressum(
  data: CpSaveData<CpImpressum>,
): Promise<CpImpressum> {
  return saveInternalDataCollection("internal-data", {
    _id: "675df468613062eb9e0000ed",
    data,
  });
}
