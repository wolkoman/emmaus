"use server";

import { mailOptions, transporter } from "@/app/(shared)/mail/sendMail";
import NewsletterConfirmation from "@/emails/newsletter-confirmation";
import {
  createNewsletterSubscription,
  fetchOneNewsletter,
} from "@/domain/forms/forms-repo";
import { render } from "@react-email/components";
import crypto from "crypto";

export async function subscribeToNewsletter(
  email: string,
): Promise<string | null> {
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return "Ungültige E-Mail-Adresse";
  }

  const existing = await fetchOneNewsletter({ mail: email });
  if (existing) {
    return "Diese E-Mail-Adresse ist bereits registriert.";
  }

  const token = crypto.randomBytes(32).toString("hex");
  await createNewsletterSubscription({
    mail: email,
    token,
    active: false,
  });

  // Generate confirmation link
  const confirmUrl = `${process.env.NEXT_PUBLIC_BASE_URL || "https://emmaus.wien"}/newsletter/bestaetigen?token=${token}`;

  // Render email using react-email
  const emailHtml = await render(NewsletterConfirmation({ confirmUrl }));
  const emailText = await render(NewsletterConfirmation({ confirmUrl }), {
    plainText: true,
  });

  await transporter.sendMail({
    ...mailOptions,
    to: email,
    subject: "Newsletter-Anmeldung bestätigen - Pfarre Emmaus",
    html: emailHtml,
    text: emailText,
  });

  return null;
}
