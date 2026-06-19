export const MATCH_SLOT_MINUTES = 30;

export function computeScheduleShift(
  originalScheduledAt: Date,
  actualStartedAt: Date
): number {
  return Math.round((actualStartedAt.getTime() - originalScheduledAt.getTime()) / 60000);
}

export function applyShiftToMatches(
  matches: Array<{ id: number; scheduled_at: Date }>,
  deltaMinutes: number
): Array<{ id: number; new_scheduled_at: Date }> {
  return matches.map((m) => ({
    id: m.id,
    new_scheduled_at: new Date(m.scheduled_at.getTime() + deltaMinutes * 60000),
  }));
}
