// src/utils/getSchedule.ts

export type ParsedScheduleResult = {
  /** 실제 시간표 데이터 (예: general, weekday, holiday 중 하나) */
  data: Record<string, Record<string, Array<{ time: string; note?: string }>>>;
  /** 노트 정보 (ex: { "1": "...", "2": "..." }) */
  note: Record<string, string>;
  /** 스케줄 상태 (general | weekday | holiday | unknown) */
  state?: "general" | "weekday" | "holiday" | "unknown";
};

/**
 * 주어진 routeName.json 파일을 fetch하여,
 * "general" / "weekday" / "holiday" 중 요청된 isWeekday 여부에 따라
 * 적절한 schedule 데이터를 반환합니다.
 *
 * @param routeName - 노선명
 * @param isWeekday - true: 평일, false: 공휴일
 * @returns ParsedScheduleResult 객체
 */
export async function loadSchedule(
  routeName: string,
  isWeekday: boolean
): Promise<ParsedScheduleResult> {
  try {
    const res = await fetch(`/data/schedules/${routeName}.json`);
    if (!res.ok) throw new Error("JSON 파일 로드 실패");

    const jsonData = await res.json();
    const { schedule = {}, note = {} } = jsonData || {};

    // 일반 스케줄이 있다면 우선 반환
    if (schedule.general) {
      return { data: schedule.general, note, state: "general" };
    }
    // 평일, 공휴일 데이터가 모두 존재하면 isWeekday 여부에 따라 반환
    if (schedule.weekday && schedule.holiday) {
      return {
        data: isWeekday ? schedule.weekday : schedule.holiday,
        note,
        state: isWeekday ? "weekday" : "holiday",
      };
    }
    // 그 외에는 unknown 상태로 반환
    return { data: {}, note, state: "unknown" };
  } catch (err) {
    console.error("❌ 시간표(JSON) 로딩 오류:", err);
    return { data: {}, note: {}, state: "unknown" };
  }
}
