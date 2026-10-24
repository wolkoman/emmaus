/**
 * This file was @generated using pocketbase-typegen
 */

import type PocketBase from "pocketbase";
import type { RecordService } from "pocketbase";

export const Collections = {
  Authorigins: "_authOrigins",
  Externalauths: "_externalAuths",
  Mfas: "_mfas",
  Otps: "_otps",
  Superusers: "_superusers",
  AlphaRegistrations: "alpha_registrations",
  Articles: "articles",
  Cache: "cache",
  ContentAssets: "content_assets",
  Impressum: "impressum",
  Liturgies: "liturgies",
  LiturgyEvents: "liturgy_events",
  LiturgyRosters: "liturgy_rosters",
  Monthlies: "monthlies",
  MonthlyImages: "monthly_images",
  Newsletter: "newsletter",
  PapalIntentions: "papal_intentions",
  PaperArticles: "paper_articles",
  PaperProjects: "paper_projects",
  PaperStats: "paper_stats",
  PaperTexts: "paper_texts",
  Passkeys: "passkeys",
  PasswordResets: "password_resets",
  Persons: "persons",
  Renders: "renders",
  Reservations: "reservations",
  SharedLinks: "shared_links",
  Sites: "sites",
  Users: "users",
  Weeklies: "weeklies",
} as const;
export type Collections = (typeof Collections)[keyof typeof Collections];

// Alias types for improved usability
export type IsoDateString = string;
export type IsoAutoDateString = string & { readonly autodate: unique symbol };
export type RecordIdString = string;
export type FileNameString = string & { readonly filename: unique symbol };
export type HTMLString = string;

type ExpandType<T> = unknown extends T
  ? T extends unknown
    ? { expand?: unknown }
    : { expand: T }
  : { expand: T };

// System fields
export type BaseSystemFields<T = unknown> = {
  id: RecordIdString;
  collectionId: string;
  collectionName: Collections;
} & ExpandType<T>;

export type AuthSystemFields<T = unknown> = {
  email: string;
  emailVisibility: boolean;
  username: string;
  verified: boolean;
} & BaseSystemFields<T>;

// Record types for each collection

export type AuthoriginsRecord = {
  collectionRef: string;
  created: IsoAutoDateString;
  fingerprint: string;
  id: string;
  recordRef: string;
  updated: IsoAutoDateString;
};

export type ExternalauthsRecord = {
  collectionRef: string;
  created: IsoAutoDateString;
  id: string;
  provider: string;
  providerId: string;
  recordRef: string;
  updated: IsoAutoDateString;
};

export type MfasRecord = {
  collectionRef: string;
  created: IsoAutoDateString;
  id: string;
  method: string;
  recordRef: string;
  updated: IsoAutoDateString;
};

export type OtpsRecord = {
  collectionRef: string;
  created: IsoAutoDateString;
  id: string;
  password: string;
  recordRef: string;
  sentTo?: string;
  updated: IsoAutoDateString;
};

export type SuperusersRecord = {
  created: IsoAutoDateString;
  email: string;
  emailVisibility?: boolean;
  id: string;
  password: string;
  tokenKey: string;
  updated: IsoAutoDateString;
  verified?: boolean;
};

export type AlphaRegistrationsRecord = {
  cockpit_id?: string;
  id: string;
  mail?: string;
  name?: string;
  phone?: string;
  postal?: string;
};

export type ArticlesRecord = {
  author?: string;
  content?: HTMLString;
  created: IsoAutoDateString;
  id: string;
  image?: FileNameString;
  public?: boolean;
  title: string;
  title_slug?: string;
  updated: IsoAutoDateString;
};

export type CacheRecord = {
  cockpit_id?: string;
  id: string;
  key: string;
  value?: string;
};

export type ContentAssetsRecord = {
  cockpit_path: string;
  created: IsoAutoDateString;
  file?: FileNameString;
  id: string;
  updated: IsoAutoDateString;
};

export type ImpressumRecord = {
  cockpit_id?: string;
  content?: HTMLString;
  created: IsoAutoDateString;
  id: string;
  title?: string;
  updated: IsoAutoDateString;
};

export type LiturgiesRecord = {
  color?: string;
  evangelium?: string;
  id: string;
  key: string;
  name?: string;
  position?: number;
  psalm?: string;
  rank?: string;
  reading1?: string;
  reading2?: string;
};

export type LiturgyEventsRecord<Tcancellations = unknown> = {
  calendar_event_id?: string;
  cancellations?: null | Tcancellations;
  cockpit_id?: string;
  date: IsoDateString;
  id: string;
  liturgy_name?: string;
};

export const LiturgyRostersPositionOptions = {
  READER1: "READER1",
  READER2: "READER2",
  MUSICIAN: "MUSICIAN",
  SACRISTAN: "SACRISTAN",
} as const;
export type LiturgyRostersPositionOptions =
  (typeof LiturgyRostersPositionOptions)[keyof typeof LiturgyRostersPositionOptions];

export const LiturgyRostersStatusOptions = {
  assigned: "assigned",
  informed: "informed",
  cancelled: "cancelled",
} as const;
export type LiturgyRostersStatusOptions =
  (typeof LiturgyRostersStatusOptions)[keyof typeof LiturgyRostersStatusOptions];
export type LiturgyRostersRecord = {
  cockpit_id?: string;
  id: string;
  liturgy_event: RecordIdString;
  person?: RecordIdString;
  person_name?: string;
  position: LiturgyRostersPositionOptions;
  reminder_sent?: IsoDateString;
  status: LiturgyRostersStatusOptions;
};

export type MonthliesRecord<Tdata = unknown> = {
  created: IsoAutoDateString;
  data?: null | Tdata;
  flyerPdfUrl?: string;
  id: string;
  month?: string;
  name: string;
  newsletterSentAt?: IsoDateString;
  posterPdfUrl?: string;
  publishedAt?: IsoDateString;
  updated: IsoAutoDateString;
};

export type MonthlyImagesRecord = {
  created: IsoAutoDateString;
  id: string;
  image: FileNameString;
};

export type NewsletterRecord = {
  active?: boolean;
  cockpit_id?: string;
  id: string;
  mail: string;
  token?: string;
};

export type PapalIntentionsRecord = {
  created: IsoAutoDateString;
  id: string;
  month: string;
  text: string;
  title?: string;
  updated: IsoAutoDateString;
};

export const PaperArticlesStatusOptions = {
  writing: "writing",
  written: "written",
  corrected: "corrected",
  finished: "finished",
} as const;
export type PaperArticlesStatusOptions =
  (typeof PaperArticlesStatusOptions)[keyof typeof PaperArticlesStatusOptions];

export const PaperArticlesFormatOptions = {
  "C2200x3000x3/4": "C2200x3000x3/4",
  C2600x3600x1: "C2600x3600x1",
  "C1300x1800x1/2": "C1300x1800x1/2",
  "C100x2000x~": "C100x2000x~",
  C3600x5400x2: "C3600x5400x2",
  C5400x7200x3: "C5400x7200x3",
  "C800x1000x1/3": "C800x1000x1/3",
  "C4100x4900x1_1/2": "C4100x4900x1_1/2",
} as const;
export type PaperArticlesFormatOptions =
  (typeof PaperArticlesFormatOptions)[keyof typeof PaperArticlesFormatOptions];
export type PaperArticlesRecord = {
  author?: string;
  char_max?: number;
  char_min?: number;
  cockpit_id?: string;
  created: IsoAutoDateString;
  format?: PaperArticlesFormatOptions;
  gid?: string;
  id: string;
  name: string;
  project: RecordIdString;
  status?: PaperArticlesStatusOptions;
  updated: IsoAutoDateString;
};

export type PaperProjectsRecord = {
  cover?: FileNameString;
  created: IsoAutoDateString;
  deadline?: string;
  id: string;
  name: string;
  pdf?: FileNameString;
  printrelease?: string;
  published?: string;
  updated: IsoAutoDateString;
};

export type PaperStatsRecord = {
  cockpit_id?: string;
  corrected?: number;
  day: string;
  finished?: number;
  id: string;
  project: RecordIdString;
  writing?: number;
  written?: number;
};

export type PaperTextsRecord = {
  article: RecordIdString;
  cockpit_id?: string;
  created: IsoAutoDateString;
  datetime?: string;
  id: string;
  text?: string;
  updated: IsoAutoDateString;
};

export type PasskeysRecord<Ttransports = unknown> = {
  counter?: number;
  created: IsoAutoDateString;
  credential_id: string;
  id: string;
  last_used?: IsoDateString;
  name?: string;
  person: RecordIdString;
  public_key: string;
  transports?: null | Ttransports;
};

export type PasswordResetsRecord = {
  created: IsoAutoDateString;
  expires: IsoDateString;
  id: string;
  person: RecordIdString;
  token_hash: string;
  used?: IsoDateString;
};

export const PersonsCompetencesOptions = {
  calendar: "calendar",
  instagram: "instagram",
  calendar_administration: "calendar_administration",
  editor: "editor",
  weekly_editor: "weekly_editor",
  reader: "reader",
  communion_minister: "communion_minister",
  sacristan: "sacristan",
  musician: "musician",
  reader_planning: "reader_planning",
  communion_minister_planning: "communion_minister_planning",
  sacristan_planning: "sacristan_planning",
  musician_planning: "musician_planning",
  "mail:events": "mail:events",
} as const;
export type PersonsCompetencesOptions =
  (typeof PersonsCompetencesOptions)[keyof typeof PersonsCompetencesOptions];
export type PersonsRecord = {
  active?: boolean;
  cockpit_id?: string;
  code?: string;
  competences?: PersonsCompetencesOptions[];
  email?: string;
  id: string;
  last_login?: IsoDateString;
  liturgy_reminders_disabled?: boolean;
  name: string;
  username?: string;
};

export const RendersStatusOptions = {
  pending: "pending",
  running: "running",
  done: "done",
  error: "error",
} as const;
export type RendersStatusOptions =
  (typeof RendersStatusOptions)[keyof typeof RendersStatusOptions];
export type RendersRecord<Tpaper = unknown> = {
  created: IsoAutoDateString;
  error?: string;
  id: string;
  paper?: null | Tpaper;
  pdf?: FileNameString;
  status: RendersStatusOptions;
  updated: IsoAutoDateString;
  url: string;
};

export type ReservationsRecord<Trooms = unknown, Ttimes = unknown> = {
  access?: boolean;
  access_via?: string;
  approved_reverend?: string;
  approved_reverend_at?: boolean;
  approved_sitemanager?: string;
  approved_sitemanager_at?: boolean;
  cockpit_id?: string;
  contact_mail?: string;
  contact_name?: string;
  contact_phone?: string;
  contact_relation?: string;
  id: string;
  occasion?: string;
  reverend_secret?: string;
  rooms?: null | Trooms;
  sitemanager_secret?: string;
  times?: null | Ttimes;
};

export type SharedLinksRecord<Tids = unknown> = {
  cockpit_id?: string;
  expiration?: IsoDateString;
  folder?: string;
  id: string;
  ids?: null | Tids;
};

export type SitesRecord = {
  cockpit_created?: number;
  cockpit_id?: string;
  cockpit_modified?: number;
  created: IsoAutoDateString;
  html?: HTMLString;
  icon?: string;
  id: string;
  name: string;
  parent?: RecordIdString;
  slug?: string;
  sort_order?: number;
  summary?: string;
  title?: string;
  updated: IsoAutoDateString;
};

export type UsersRecord = {
  avatar?: FileNameString;
  created: IsoAutoDateString;
  email: string;
  emailVisibility?: boolean;
  id: string;
  name?: string;
  password: string;
  tokenKey: string;
  updated: IsoAutoDateString;
  verified?: boolean;
};

export type WeekliesRecord<Tdata = unknown> = {
  cockpit_id?: string;
  created: IsoAutoDateString;
  data?: null | Tdata;
  end?: string;
  id: string;
  name: string;
  sent?: boolean;
  start?: string;
  updated: IsoAutoDateString;
};

// Response types include system fields and match responses from the PocketBase API
export type AuthoriginsResponse<Texpand = unknown> =
  Required<AuthoriginsRecord> & BaseSystemFields<Texpand>;
export type ExternalauthsResponse<Texpand = unknown> =
  Required<ExternalauthsRecord> & BaseSystemFields<Texpand>;
export type MfasResponse<Texpand = unknown> = Required<MfasRecord> &
  BaseSystemFields<Texpand>;
export type OtpsResponse<Texpand = unknown> = Required<OtpsRecord> &
  BaseSystemFields<Texpand>;
export type SuperusersResponse<Texpand = unknown> = Required<SuperusersRecord> &
  AuthSystemFields<Texpand>;
export type AlphaRegistrationsResponse<Texpand = unknown> =
  Required<AlphaRegistrationsRecord> & BaseSystemFields<Texpand>;
export type ArticlesResponse<Texpand = unknown> = Required<ArticlesRecord> &
  BaseSystemFields<Texpand>;
export type CacheResponse<Texpand = unknown> = Required<CacheRecord> &
  BaseSystemFields<Texpand>;
export type ContentAssetsResponse<Texpand = unknown> =
  Required<ContentAssetsRecord> & BaseSystemFields<Texpand>;
export type ImpressumResponse<Texpand = unknown> = Required<ImpressumRecord> &
  BaseSystemFields<Texpand>;
export type LiturgiesResponse<Texpand = unknown> = Required<LiturgiesRecord> &
  BaseSystemFields<Texpand>;
export type LiturgyEventsResponse<
  Tcancellations = unknown,
  Texpand = unknown,
> = Required<LiturgyEventsRecord<Tcancellations>> & BaseSystemFields<Texpand>;
export type LiturgyRostersResponse<Texpand = unknown> =
  Required<LiturgyRostersRecord> & BaseSystemFields<Texpand>;
export type MonthliesResponse<Tdata = unknown, Texpand = unknown> = Required<
  MonthliesRecord<Tdata>
> &
  BaseSystemFields<Texpand>;
export type MonthlyImagesResponse<Texpand = unknown> =
  Required<MonthlyImagesRecord> & BaseSystemFields<Texpand>;
export type NewsletterResponse<Texpand = unknown> = Required<NewsletterRecord> &
  BaseSystemFields<Texpand>;
export type PapalIntentionsResponse<Texpand = unknown> =
  Required<PapalIntentionsRecord> & BaseSystemFields<Texpand>;
export type PaperArticlesResponse<Texpand = unknown> =
  Required<PaperArticlesRecord> & BaseSystemFields<Texpand>;
export type PaperProjectsResponse<Texpand = unknown> =
  Required<PaperProjectsRecord> & BaseSystemFields<Texpand>;
export type PaperStatsResponse<Texpand = unknown> = Required<PaperStatsRecord> &
  BaseSystemFields<Texpand>;
export type PaperTextsResponse<Texpand = unknown> = Required<PaperTextsRecord> &
  BaseSystemFields<Texpand>;
export type PasskeysResponse<
  Ttransports = unknown,
  Texpand = unknown,
> = Required<PasskeysRecord<Ttransports>> & BaseSystemFields<Texpand>;
export type PasswordResetsResponse<Texpand = unknown> =
  Required<PasswordResetsRecord> & BaseSystemFields<Texpand>;
export type PersonsResponse<Texpand = unknown> = Required<PersonsRecord> &
  BaseSystemFields<Texpand>;
export type RendersResponse<Tpaper = unknown, Texpand = unknown> = Required<
  RendersRecord<Tpaper>
> &
  BaseSystemFields<Texpand>;
export type ReservationsResponse<
  Trooms = unknown,
  Ttimes = unknown,
  Texpand = unknown,
> = Required<ReservationsRecord<Trooms, Ttimes>> & BaseSystemFields<Texpand>;
export type SharedLinksResponse<Tids = unknown, Texpand = unknown> = Required<
  SharedLinksRecord<Tids>
> &
  BaseSystemFields<Texpand>;
export type SitesResponse<Texpand = unknown> = Required<SitesRecord> &
  BaseSystemFields<Texpand>;
export type UsersResponse<Texpand = unknown> = Required<UsersRecord> &
  AuthSystemFields<Texpand>;
export type WeekliesResponse<Tdata = unknown, Texpand = unknown> = Required<
  WeekliesRecord<Tdata>
> &
  BaseSystemFields<Texpand>;

// Types containing all Records and Responses, useful for creating typing helper functions

export type CollectionRecords = {
  _authOrigins: AuthoriginsRecord;
  _externalAuths: ExternalauthsRecord;
  _mfas: MfasRecord;
  _otps: OtpsRecord;
  _superusers: SuperusersRecord;
  alpha_registrations: AlphaRegistrationsRecord;
  articles: ArticlesRecord;
  cache: CacheRecord;
  content_assets: ContentAssetsRecord;
  impressum: ImpressumRecord;
  liturgies: LiturgiesRecord;
  liturgy_events: LiturgyEventsRecord;
  liturgy_rosters: LiturgyRostersRecord;
  monthlies: MonthliesRecord;
  monthly_images: MonthlyImagesRecord;
  newsletter: NewsletterRecord;
  papal_intentions: PapalIntentionsRecord;
  paper_articles: PaperArticlesRecord;
  paper_projects: PaperProjectsRecord;
  paper_stats: PaperStatsRecord;
  paper_texts: PaperTextsRecord;
  passkeys: PasskeysRecord;
  password_resets: PasswordResetsRecord;
  persons: PersonsRecord;
  renders: RendersRecord;
  reservations: ReservationsRecord;
  shared_links: SharedLinksRecord;
  sites: SitesRecord;
  users: UsersRecord;
  weeklies: WeekliesRecord;
};

export type CollectionResponses = {
  _authOrigins: AuthoriginsResponse;
  _externalAuths: ExternalauthsResponse;
  _mfas: MfasResponse;
  _otps: OtpsResponse;
  _superusers: SuperusersResponse;
  alpha_registrations: AlphaRegistrationsResponse;
  articles: ArticlesResponse;
  cache: CacheResponse;
  content_assets: ContentAssetsResponse;
  impressum: ImpressumResponse;
  liturgies: LiturgiesResponse;
  liturgy_events: LiturgyEventsResponse;
  liturgy_rosters: LiturgyRostersResponse;
  monthlies: MonthliesResponse;
  monthly_images: MonthlyImagesResponse;
  newsletter: NewsletterResponse;
  papal_intentions: PapalIntentionsResponse;
  paper_articles: PaperArticlesResponse;
  paper_projects: PaperProjectsResponse;
  paper_stats: PaperStatsResponse;
  paper_texts: PaperTextsResponse;
  passkeys: PasskeysResponse;
  password_resets: PasswordResetsResponse;
  persons: PersonsResponse;
  renders: RendersResponse;
  reservations: ReservationsResponse;
  shared_links: SharedLinksResponse;
  sites: SitesResponse;
  users: UsersResponse;
  weeklies: WeekliesResponse;
};

// Utility types for create/update operations

type ProcessCreateAndUpdateFields<T> = Omit<
  {
    // Omit AutoDate fields
    [K in keyof T as Extract<T[K], IsoAutoDateString> extends never
      ? K
      : never]: // Convert FileNameString to File
    T[K] extends infer U
      ? U extends FileNameString | FileNameString[]
        ? U extends any[]
          ? File[]
          : File
        : U
      : never;
  },
  "id"
>;

// Create type for Auth collections
export type CreateAuth<T> = {
  id?: RecordIdString;
  email: string;
  emailVisibility?: boolean;
  password: string;
  passwordConfirm: string;
  verified?: boolean;
} & ProcessCreateAndUpdateFields<T>;

// Create type for Base collections
export type CreateBase<T> = {
  id?: RecordIdString;
} & ProcessCreateAndUpdateFields<T>;

// Update type for Auth collections
export type UpdateAuth<T> = Partial<
  Omit<ProcessCreateAndUpdateFields<T>, keyof AuthSystemFields>
> & {
  email?: string;
  emailVisibility?: boolean;
  oldPassword?: string;
  password?: string;
  passwordConfirm?: string;
  verified?: boolean;
};

// Update type for Base collections
export type UpdateBase<T> = Partial<
  Omit<ProcessCreateAndUpdateFields<T>, keyof BaseSystemFields>
>;

// Get the correct create type for any collection
export type Create<T extends keyof CollectionResponses> =
  CollectionResponses[T] extends AuthSystemFields
    ? CreateAuth<CollectionRecords[T]>
    : CreateBase<CollectionRecords[T]>;

// Get the correct update type for any collection
export type Update<T extends keyof CollectionResponses> =
  CollectionResponses[T] extends AuthSystemFields
    ? UpdateAuth<CollectionRecords[T]>
    : UpdateBase<CollectionRecords[T]>;

// Type for usage with type asserted PocketBase instance
// https://github.com/pocketbase/js-sdk#specify-typescript-definitions

export type TypedPocketBase = {
  collection<T extends keyof CollectionResponses>(
    idOrName: T,
  ): RecordService<CollectionResponses[T]>;
} & PocketBase;
