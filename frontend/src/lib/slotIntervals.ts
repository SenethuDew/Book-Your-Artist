/**
 * Compare HH:mm day windows as booking-style numeric intervals (cross-midnight when end <= start).
 */
export function intervalsOverlapHM(
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string,
): boolean {
  const toVal = (t: string) => {
    const n = parseFloat(t.replace(":", "."));
    return Number.isFinite(n) ? n : -1;
  };
  let aLo = toVal(aStart);
  let aHi = (aEnd === "00:00" ? "24:00" : aEnd) as string;
  let aHiVal = toVal(aHi);
  if (aHiVal < aLo) aHiVal += 24;

  let bLo = toVal(bStart);
  let bHiVal = toVal((bEnd === "00:00" ? "24:00" : bEnd) as string);
  if (bHiVal < bLo) bHiVal += 24;

  return bLo < aHiVal && bHiVal > aLo;
}

export function overlapMinutesHM(
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string,
): number {
  const m = (t: string) => {
    const [h, mn] = t.split(":").map(Number);
    return h * 60 + mn;
  };
  const norm = (lo: number, hi: number) => {
    if (hi <= lo) hi += 24 * 60;
    return [lo, hi] as const;
  };
  const [aLo, aHi] = norm(m(aStart), m(aEnd === "00:00" ? "24:00" : aEnd));
  const [bLo, bHi] = norm(m(bStart), m(bEnd === "00:00" ? "24:00" : bEnd));

  const interLo = Math.max(aLo, bLo);
  const interHi = Math.min(aHi, bHi);
  return Math.max(0, interHi - interLo);
}

export interface HasStartEndDate {
  _id?: string;
  date: string;
  startTime: string;
  endTime: string;
  status?: string;
}

/** Same calendar day string as artist profile uses (local YYYY-MM-DD). */
export function slotCalendarDay(slotDate: string | Date): string {
  const d = new Date(slotDate);
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  return `${y}-${mo}-${da}`;
}

/**
 * Prefer exact preset match on that date; otherwise best overlap with preset column among remaining slots.
 */
export function resolvePublishedSlotForPresetColumn<
  T extends HasStartEndDate,
>(slotsOnDay: T[], presetStart: string, presetEnd: string, usedSlotIds: Set<string>): T | undefined {
  const available = slotsOnDay.filter((s) => s._id && !usedSlotIds.has(String(s._id)));

  const exact = available.find(
    (s) => s.startTime === presetStart && s.endTime === presetEnd,
  );
  if (exact) return exact;

  let best: T | undefined;
  let bestScore = 0;

  for (const s of available) {
    if (!intervalsOverlapHM(s.startTime, s.endTime, presetStart, presetEnd)) continue;
    const score = overlapMinutesHM(s.startTime, s.endTime, presetStart, presetEnd);
    if (score > bestScore || (score === bestScore && (best?.startTime ?? "") > s.startTime)) {
      bestScore = score;
      best = s;
    }
  }
  return best;
}
