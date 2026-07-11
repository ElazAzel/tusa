/** A stable, guidebook-friendly event date format used across TUSA.game. */
export function formatEventDate(value: string, locale: "ru" | "en") {
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!iso) return value;
  const [, year, month, day] = iso;
  if (locale === "ru") return `${day}.${month}.${year}`;
  const monthName = new Intl.DateTimeFormat("en", { month: "short" }).format(new Date(Date.UTC(Number(year), Number(month) - 1, Number(day))));
  return `${day} ${monthName} ${year}`;
}

/** Makes dates saved by older builds editable in the shared DD.MM.YYYY field. */
export function eventDateInputValue(value: string) {
  return formatEventDate(value, "ru");
}
