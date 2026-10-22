"use server";

import {
  mailOptions,
  transporter,
} from "@/app/(shared)/mail/sendMail";
import AlphaRegistrationNotification from "@/emails/alpha-registration-notification";
import { createAlphaRegistration } from "@/domain/forms/forms-repo";
import { render } from "@react-email/components";
import {
  alphaRegistrationSchema,
  type AlphaRegistrationFormData,
} from "./schema";
import {
  ALPHA_FIRST_COURSE_DATE,
  isAlphaRegistrationClosed,
} from "./registrationWindow";

/**
 * Speichert eine neue Alpha-Kurs-Anmeldung im System und sendet eine Benachrichtigung
 */
export async function submitAlphaRegistration(
  formData: AlphaRegistrationFormData,
) {
  try {
    if (isAlphaRegistrationClosed(new Date())) {
      throw new Error(
        `Die Anmeldung ist seit dem ${ALPHA_FIRST_COURSE_DATE.toLocaleDateString("de-AT")} geschlossen.`,
      );
    }

    // Validierung mit Zod
    const validatedData = alphaRegistrationSchema.parse(formData);

    // Anmeldung in Pocketbase speichern
    const result = await createAlphaRegistration({
      name: validatedData.name,
      phone: validatedData.phone,
      mail: validatedData.mail,
      postal: validatedData.postal,
    });

    // E-Mail-Benachrichtigung an den Administrator senden
    const notificationEmailHtml = await render(
      AlphaRegistrationNotification({
        name: validatedData.name,
        phone: validatedData.phone,
        mail: validatedData.mail,
        postal: validatedData.postal,
      }),
    );

    await transporter.sendMail({
      ...mailOptions,
      to: "alpha@emmaus.wien",
      subject: "Neue Alpha-Kurs Anmeldung",
      html: notificationEmailHtml,
    });

    return {
      success: true,
      id: result._id,
    };
  } catch (error) {
    console.error("Error submitting alpha registration:", error);
    throw error;
  }
}
