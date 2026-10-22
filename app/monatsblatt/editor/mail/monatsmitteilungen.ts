"use server";

import { fetchNewsletterRecipients } from "@/domain/forms/forms-repo";
import {
  fetchMonthlyByName,
  markMonthlyNewsletterSent,
} from "@/app/(domain)/monthly/monthly-repo";
import { formatDate } from "@/app/(shared)/Localization";
import { resolveUserFromServer } from "@/app/(shared)/UserHandler";
import {
  editorialDeadline,
  evangelienDays,
  ISSUE_CONTENT_MAIL,
} from "@/app/monatsblatt/FlyerTiles";
import { screenTiles } from "@/app/monatsblatt/content";
import { LETTER_TITLE } from "@/app/monatsblatt/letter";
import { MonthlyData } from "@/app/monatsblatt/editor/store";
import { liturgyDayName } from "@/domain/liturgy/liturgy-order";
import { loadCachedLiturgyData } from "@/domain/liturgy/liturgy-loading";
import { mailOptions, transporter } from "@/app/(shared)/mail/sendMail";
import { removeImageTags } from "@/app/(shared)/removeImgTags";
import MonthlyNewsletter from "@/emails/monthly-newsletter";
import { Liturgy } from "@/domain/liturgy/liturgy-data";
import { CpPersonCompetences } from "@/util/cockpit.generated";
import { render } from "@react-email/components";
import sanitize from "sanitize-html";

/**
 * Newsletter for the Monatsmitteilungen, sent to the `newsletter` collection
 * (subscribe/confirm flow in app/newsletter):
 *
 *   - the issue must be published first: the mail is the digital version of
 *     what went to print,
 *   - `newsletterSentAt` is stamped BEFORE the mail goes to SMTP, so a retry
 *     after a crash can't deliver twice to the whole list,
 *   - recipients are BCC'd on one mail addressed to admin@emmaus.wien.
 *
 * The mail carries the content itself (no PDF links): every tile of the issue
 * except the paper-only ones (app/monatsblatt/content.ts) becomes a section.
 *
 * `previewMonthlyNewsletter` renders exactly the same mail but sends nothing —
 * that is what the editor shows before anyone confirms.
 */

async function assertEditor(): Promise<void> {
  const person = await resolveUserFromServer();
  if (!person?.competences.includes(CpPersonCompetences.WeeklyEditor)) {
    throw new Error("No authorization");
  }
}

/** Article bodies are editor HTML; keep only what mail clients handle well. */
function mailHtml(html: string): string {
  return sanitize(removeImageTags(html), {
    allowedTags: ["p", "br", "strong", "b", "em", "i", "u", "ul", "ol", "li"],
    allowedAttributes: {},
  });
}

function escapeHtml(text: string): string {
  return sanitize(text, { allowedTags: [], allowedAttributes: {} });
}

/**
 * The issue's content as mail sections, in flyer reading order. Tiles that
 * only work on paper are already filtered out by `screenTiles`; the remaining
 * types are flattened into HTML here because mail clients need inline markup
 * rather than the print components.
 */
function newsletterSections(
  data: MonthlyData,
  liturgies: Liturgy[],
): { title?: string; body: string }[] {
  return screenTiles(data.tiles).flatMap((tile) => {
    switch (tile.type) {
      case "ARTICLE":
        return [{ title: tile.title, body: mailHtml(tile.text) }];
      case "LETTER":
        if (!data.letter?.text) return [];
        return [{ title: LETTER_TITLE, body: mailHtml(data.letter.text) }];
      case "EVANGELIEN": {
        const days = evangelienDays(data.events, liturgies);
        if (!days.length) return [];
        return [
          {
            title: "Evangelien des Monats",
            body: days
              .map(
                ({ date, liturgy }) =>
                  `<p>${escapeHtml(
                    formatDate(date, {
                      weekday: "short",
                      day: "2-digit",
                      month: "2-digit",
                    }),
                  )} <strong>${escapeHtml(liturgy.evangelium ?? "")}</strong> ${escapeHtml(
                    liturgyDayName(liturgy),
                  )}</p>`,
              )
              .join(""),
          },
        ];
      }
      case "GEBETSANLIEGEN":
        if (!data.papalIntention?.text) return [];
        return [
          {
            title: "Gebetsanliegen des Papstes",
            body:
              `<p><strong>${escapeHtml(data.papalIntention.title)}</strong></p>` +
              `<p><em>${escapeHtml(data.papalIntention.text)}</em></p>`,
          },
        ];
      case "INSTAGRAM":
        return [
          {
            title: "Folgen Sie uns auf Instagram",
            body: '<p>Fotos und Neuigkeiten aus dem Pfarrleben: <a href="https://instagram.com/pfarreemmaus">@pfarreemmaus</a></p>',
          },
        ];
      case "IMAGE":
        if (!tile.url) return [];
        return [
          {
            body: `<img src="${tile.url}" alt="" style="max-width:100%;border-radius:6px" />`,
          },
        ];
      default:
        return [];
    }
  });
}

async function buildNewsletter(
  name: string,
  options: { requirePublished?: boolean } = {},
) {
  const [record, liturgies] = await Promise.all([
    fetchMonthlyByName(name),
    loadCachedLiturgyData(),
  ]);
  if (!record) throw new Error(`Ausgabe "${name}" nicht gefunden`);
  if ((options.requirePublished ?? true) && !record.publishedAt) {
    throw new Error("Diese Ausgabe wurde noch nicht veröffentlicht.");
  }
  const data = record.data as MonthlyData;
  const deadline = editorialDeadline(data.month);

  const mail = MonthlyNewsletter({
    title: record.name,
    coverText: data.coverText || undefined,
    sections: newsletterSections(data, liturgies),
    events: (data.events ?? []).map((event) => ({
      date: formatDate(event.date),
      time: event.time,
      summary: event.summary,
      description: event.customEventDescription ?? event.description,
    })),
    deadline: deadline
      ? formatDate(deadline, { weekday: "long", day: "numeric", month: "long" })
      : undefined,
    contactMail: ISSUE_CONTENT_MAIL,
  });

  return {
    record,
    subject: `Monatsmitteilungen ${record.name}`,
    html: await render(mail),
    text: await render(mail, { plainText: true }),
  };
}

/** What the editor needs to decide whether to send. Reads only. */
export async function monthlyNewsletterStatus(name: string): Promise<{
  recipients: number;
  sentAt: string;
  published: boolean;
}> {
  await assertEditor();
  const [record, allRecipients] = await Promise.all([
    fetchMonthlyByName(name),
    fetchNewsletterRecipients(),
  ]);
  return {
    recipients: allRecipients.filter((recipient) => recipient.active).length,
    sentAt: record?.newsletterSentAt ?? "",
    published: !!record?.publishedAt,
  };
}

/** Renders the mail for review. Sends nothing. */
export async function previewMonthlyNewsletter(name: string): Promise<string> {
  await assertEditor();
  return (await buildNewsletter(name)).html;
}

/**
 * Sends the mail to a SINGLE address for review. Touches neither the recipient
 * list nor `newsletterSentAt`, and works on unpublished issues too, so it can
 * be used freely while an issue is still being worked on. The subject is
 * prefixed so a test can't be mistaken for the real thing.
 *
 * Note it renders the SAVED issue, not the editor's unsaved state.
 */
export async function sendMonthlyNewsletterTest(
  name: string,
  to: string,
): Promise<void> {
  await assertEditor();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
    throw new Error("Ungültige E-Mail-Adresse");
  }
  const { subject, html, text } = await buildNewsletter(name, {
    requirePublished: false,
  });
  await transporter.sendMail({
    ...mailOptions,
    to,
    subject: `[Test] ${subject}`,
    html,
    text,
  });
}

/**
 * Sends the issue to all active newsletter recipients. Refuses if it already
 * went out — resending needs `newsletterSentAt` cleared in Pocketbase, which
 * is deliberately not something the editor can do by accident.
 */
export async function sendMonthlyNewsletter(name: string): Promise<string> {
  await assertEditor();
  const { record, subject, html, text } = await buildNewsletter(name);
  if (record.newsletterSentAt) {
    throw new Error(
      `Newsletter wurde bereits am ${new Date(
        record.newsletterSentAt,
      ).toLocaleString("de-AT")} versendet.`,
    );
  }

  const recipients = (await fetchNewsletterRecipients())
    .filter((recipient) => recipient.active)
    .map((recipient) => recipient.mail);
  if (recipients.length === 0) throw new Error("Keine Empfänger");

  // Mark first: see the module note on double delivery.
  const sentAt = await markMonthlyNewsletterSent(name);
  await transporter.sendMail({
    ...mailOptions,
    to: "admin@emmaus.wien",
    bcc: recipients,
    subject,
    html,
    text,
  });
  return sentAt;
}
