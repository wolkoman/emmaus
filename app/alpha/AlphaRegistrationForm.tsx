"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  alphaRegistrationSchema,
  type AlphaRegistrationFormData,
} from "./schema";
import { submitAlphaRegistration } from "./submitRegistration";

export default function AlphaRegistrationForm() {
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<AlphaRegistrationFormData>({
    resolver: zodResolver(alphaRegistrationSchema),
    defaultValues: {
      name: "",
      phone: "",
      mail: "",
      postal: "",
    },
  });

  const onSubmit = async (data: AlphaRegistrationFormData) => {
    setSubmitError("");
    setSubmitSuccess(false);

    try {
      await submitAlphaRegistration(data);
      setSubmitSuccess(true);
      reset();
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Ein Fehler ist aufgetreten",
      );
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Jetzt anmelden</CardTitle>
        <CardDescription>
          Bitte füllen Sie das Formular aus, um sich für den Alpha-Kurs
          anzumelden.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">
              Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              {...register("name")}
              placeholder="Vor- und Nachname"
              disabled={isSubmitting}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">
              Telefonnummer <span className="text-red-500">*</span>
            </Label>
            <Input
              id="phone"
              type="tel"
              {...register("phone")}
              placeholder="+43 ..."
              disabled={isSubmitting}
            />
            {errors.phone && (
              <p className="text-sm text-red-500">{errors.phone.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="mail">
              E-Mail <span className="text-red-500">*</span>
            </Label>
            <Input
              id="mail"
              type="email"
              {...register("mail")}
              placeholder="email@beispiel.at"
              disabled={isSubmitting}
            />
            {errors.mail && (
              <p className="text-sm text-red-500">{errors.mail.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="postal">
              Postleitzahl <span className="text-red-500">*</span>
            </Label>
            <Input
              id="postal"
              {...register("postal")}
              placeholder="1100"
              disabled={isSubmitting}
            />
            {errors.postal && (
              <p className="text-sm text-red-500">{errors.postal.message}</p>
            )}
          </div>

          {submitSuccess && (
            <div className="rounded-md bg-green-50 p-4 text-sm text-green-800">
              <p className="font-medium">Anmeldung erfolgreich!</p>
              <p className="mt-1">
                Vielen Dank für Ihre Anmeldung zum Alpha-Kurs. Wir werden uns
                in Kürze bei Ihnen melden.
              </p>
            </div>
          )}

          {submitError && (
            <div className="rounded-md bg-red-50 p-4 text-sm text-red-800">
              <p className="font-medium">Fehler</p>
              <p className="mt-1">{submitError}</p>
            </div>
          )}

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? "Wird gesendet..." : "Anmelden"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
