"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useEffect, useState } from "react";
import AlphaRegistrationForm from "./AlphaRegistrationForm";
import {
  ALPHA_FIRST_COURSE_DATE,
  isAlphaRegistrationClosed,
} from "./registrationWindow";

export default function AlphaRegistrationSection() {
  const [registrationClosed, setRegistrationClosed] = useState(false);
  const firstCourseDateLabel = ALPHA_FIRST_COURSE_DATE.toLocaleDateString(
    "de-AT",
  );

  useEffect(() => {
    setRegistrationClosed(isAlphaRegistrationClosed(new Date()));
  }, []);

  if (registrationClosed) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Anmeldung geschlossen</CardTitle>
          <CardDescription>
            Seit dem {firstCourseDateLabel} ist die Online-Anmeldung nicht mehr
            möglich.
          </CardDescription>
        </CardHeader>
        <CardContent>
          Für Rückfragen schreiben Sie bitte an{" "}
          <a href="mailto:alpha@emmaus.wien" className="font-semibold underline">
            alpha@emmaus.wien
          </a>
          .
        </CardContent>
      </Card>
    );
  }

  return <AlphaRegistrationForm />;
}
