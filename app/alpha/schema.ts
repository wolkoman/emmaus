import { z } from "zod";

export const alphaRegistrationSchema = z.object({
  name: z.string().min(1, "Bitte geben Sie Ihren Namen an"),
  phone: z.string().min(1, "Bitte geben Sie eine Telefonnummer an"),
  mail: z
    .string()
    .min(1, "Bitte geben Sie eine E-Mail-Adresse an")
    .email("Bitte geben Sie eine gültige E-Mail-Adresse an"),
  postal: z.string().min(1, "Bitte geben Sie Ihre Postleitzahl an"),
});

export type AlphaRegistrationFormData = z.infer<typeof alphaRegistrationSchema>;
