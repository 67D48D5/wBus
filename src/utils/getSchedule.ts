// src/utils/getSchedule.ts

export type ParsedScheduleResult = {
  /** 실제 시간표 데이터 (예: general, weekday, holiday 중 하나) */
  data: Record<string, Record<string, Array<{ time: string; note?: string }>>>;
  /** 노트 정보 (ex: { "1": "...", "2": "..." }) */
  note: Record<string, string>;
  /** 어떤 상태인지 (general | weekday | holiday | unknown) */
  state?: "general" | "weekday" | "holiday" | "unknown";
};

/**
 * routeName.json 파일을 fetch하여, "general" / "weekday" / "holiday" 중
 * 요청된 weekday 여부에 따라 적절한 schedule 데이터 반환
 */
export async function loadSchedule(
  routeName: string,
  isWeekday: boolean
): Promise<ParsedScheduleResult> {
  try {
    const res = await fetch(`/schedules/${routeName}.json`);
    if (!res.ok) throw new Error("JSON 파일 로드 실패");

    const jsonData = await res.json();
    const scheduleObj = jsonData?.schedule ?? {};
    const noteObj = jsonData?.note ?? {};

    const hasGeneral = !!scheduleObj.general;
    const hasWeekday = !!scheduleObj.weekday;
    const hasHoliday = !!scheduleObj.holiday;

    // 일반(general) 스케줄이 있다면 우선 반환
    if (hasGeneral) {
      return {
        data: scheduleObj.general,
        note: noteObj,
        state: "general",
      };
    }
    // weekday, holiday 둘 다 있다면 인자로 받은 isWeekday에 따라 반환
    else if (hasWeekday && hasHoliday) {
      return {
        data: isWeekday ? scheduleObj.weekday : scheduleObj.holiday,
        note: noteObj,
        state: isWeekday ? "weekday" : "holiday",
      };
    }
    // 그 외에는 unknown
    else {
      return {
        data: {},
        note: noteObj,
        state: "unknown",
      };
    }
  } catch (err) {
    console.error("❌ 시간표(JSON) 로딩 오류:", err);
    return {
      data: {},
      note: {},
      state: "unknown",
    };
  }
}
