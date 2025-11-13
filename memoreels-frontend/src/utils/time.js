// utils (inline here for brevity)
const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });

export function timeAgoUTCToLocal(iso) {
  if (!iso) return "—";
  const then = new Date(iso);          // interprets Z as UTC
  const diffMs = Date.now() - then.getTime(); // local-now vs UTC timestamp
  const sec = Math.round(diffMs / 1000);

  const units = [
    ["year", 60 * 60 * 24 * 365],
    ["month", 60 * 60 * 24 * 30],
    ["day", 60 * 60 * 24],
    ["hour", 60 * 60],
    ["minute", 60],
    ["second", 1],
  ];

  for (const [unit, s] of units) {
    const v = Math.trunc(sec / s);
    if (Math.abs(v) >= (unit === "second" ? 5 : 1)) { // collapse <5s to "just now"
      return rtf.format(-v, unit); // negative → past
    }
  }
  return "just now";
}

export function formatLocalDateTime(iso) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    year: "numeric", month: "short", day: "2-digit",
    hour: "2-digit", minute: "2-digit",
  });
}
