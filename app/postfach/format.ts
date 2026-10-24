const TIME_ZONE = "Europe/Vienna";

/** Time for today's mails, the date otherwise. */
export function formatMailDate(iso: string) {
  const date = new Date(iso);
  const day = (d: Date) =>
    d.toLocaleDateString("de-AT", { timeZone: TIME_ZONE });
  return day(date) === day(new Date())
    ? date.toLocaleTimeString("de-AT", {
        timeZone: TIME_ZONE,
        timeStyle: "short",
      })
    : date.toLocaleDateString("de-AT", {
        timeZone: TIME_ZONE,
        dateStyle: "medium",
      });
}

export function formatMailDateTime(date: Date) {
  return date.toLocaleString("de-AT", {
    timeZone: TIME_ZONE,
    dateStyle: "full",
    timeStyle: "short",
  });
}
