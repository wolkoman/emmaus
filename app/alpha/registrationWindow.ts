const ALPHA_FIRST_COURSE_DATE_ISO = "2026-04-17T18:30:00+02:00";

export const ALPHA_FIRST_COURSE_DATE = new Date(ALPHA_FIRST_COURSE_DATE_ISO);

export function isAlphaRegistrationClosed(referenceDate: Date) {
  return referenceDate >= ALPHA_FIRST_COURSE_DATE;
}
