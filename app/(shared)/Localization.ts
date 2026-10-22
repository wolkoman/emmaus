export function formatDate(
  date: number,
  options?: Intl.DateTimeFormatOptions,
): string;
export function formatDate(
  date: string,
  options?: Intl.DateTimeFormatOptions,
): string;
export function formatDate(
  date: string | number,
  options?: Intl.DateTimeFormatOptions,
): string {
  const dateS =
    typeof date === "string"
      ? new Date(date + "T02:00:00")
      : new Date((date + 3600 * 2) * 1000);
  return dateS.toLocaleString(
    "de-AT",
    options ?? {
      day: "2-digit",
      month: "2-digit",
      weekday: "short",
    },
  );
}

export function formatWeekday(date: string): string {
  const dateS = new Date(date + "T02:00:00");
  return dateS.toLocaleString("de-AT", {
    weekday: "short",
  });
}

export function formatTime(date: string, options?: Intl.DateTimeFormatOptions) {
  if (date.length > 15) {
    return date.substring(11, 16);
  }
  return new Date(date).toLocaleTimeString(
    "de-AT",
    options ?? { timeStyle: "short" },
  );
}
