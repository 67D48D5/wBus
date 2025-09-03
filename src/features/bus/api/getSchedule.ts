// src/features/bus/api/getSchedule.ts

export type ParsedScheduleResult = {
  /** Data (one of general, weekday, holiday) */
  data: Record<string, Record<string, Array<{ time: string; note?: string }>>>;
  /** Notes (ex: { "1": "...", "2": "..." }) */
  note: Record<string, string>;
  /** Schedule status (general | weekday | holiday | unknown) */
  state?: "general" | "weekday" | "holiday" | "unknown";
};

/**
 * Fetch routeName.json file and parse the schedule data.
 *
 * @param routeName - routeName (ex: "30", "100", "200")
 * @param isWeekday - true: Weekday, false: Holiday
 * @returns ParsedScheduleResult Object
 */
export async function loadSchedule(
  routeName: string,
  isWeekday: boolean
): Promise<ParsedScheduleResult> {
  try {
    const res = await fetch(`/data/schedules/${routeName}.json`);
    if (!res.ok) throw new Error("🚫 Failed to fetch schedule data");

    const jsonData = await res.json();
    const { schedule = {}, note = {} } = jsonData || {};

    // If general data exists, return it
    if (schedule.general) {
      return { data: schedule.general, note, state: "general" };
    }
    // If weekday or holiday data exists, return it based on isWeekday
    if (schedule.weekday && schedule.holiday) {
      return {
        data: isWeekday ? schedule.weekday : schedule.holiday,
        note,
        state: isWeekday ? "weekday" : "holiday",
      };
    }
    // If no valid data is found, return empty data with unknown state
    return { data: {}, note, state: "unknown" };
  } catch (err) {
    console.error("❌ Schedule loading error:", err);
    return { data: {}, note: {}, state: "unknown" };
  }
}
