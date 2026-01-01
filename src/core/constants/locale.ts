// src/core/constants/locale.ts

/**
 * Centralized locale strings for the entire application
 * All user-facing text should be defined here for easy maintenance and localization
 */

// ============================================================================
// Common UI Elements
// ============================================================================

export const COMMON = {
    APP_NAME: 'wBus',
    APP_TITLE: 'wBus',
    LOADING: 'Loading...',
    RETRY: '다시 시도',
    CONFIRM: '확인',
    CANCEL: '취소',
    CLOSE: '닫기',
    BACK: '돌아가기',
} as const;

// ============================================================================
// Direction Labels & Icons
// ============================================================================

export const DIRECTIONS = {
    UP: '상행',
    DOWN: '하행',
    UNKNOWN: '방향 미상',
} as const;

export const DIRECTION_ICONS = {
    UP: '⬆️',
    DOWN: '⬇️',
    UNKNOWN: '❓',
} as const;

// ============================================================================
// Time & Schedule Strings
// ============================================================================

export const TIME_LABELS = {
    HOUR_SUFFIX: '시',
    MINUTE_SUFFIX: '분',
    MINUTES_LEFT_SUFFIX: '분 후',
    WITHIN_MINUTES: '분 이내',
    ARRIVAL_FORMAT: (hours: string, minutes: string) => `${hours}시 ${minutes}분`,
    HOUR_ABBREV: 'h',
    MINUTE_ABBREV: 'm',
    IN_PREFIX: 'in',
} as const;

export const SCHEDULE_MESSAGES = {
    ARRIVING_SOON: '곧 도착',
    DEPARTING_SOON: '곧 출발',
    ONE_STOP_AWAY: '1정거장 전',
    STOPS_AWAY: (count: number) => `${count}정거장 전`,
    NEXT_BUS: (minutes: number) => `다음 버스는 약 ${minutes}분 후 출발합니다.`,
    NO_SCHEDULED_BUSES: '현재 출발 예정인 버스가 없습니다.',
    NEXT_DEPARTURE_TIME: '가장 가까운 출발 시간',
    NO_TIMETABLE_INFO: '시간표 정보가 없습니다.',
    WAITING_BUS_DEPARTING: '대기 중인 버스가 곧 출발 합니다.',
    ROUTE_SUFFIX: '번',
} as const;

// ============================================================================
// Bus Arrival Messages
// ============================================================================

export const ARRIVAL_MESSAGES = {
    LOADING: '도착 정보를 불러오는 중...',
    LOAD_FAILED: '도착 정보를 불러오는 데 실패했습니다.',
    NO_BUSES: '예정된 버스가 없습니다',
    CHECK_SCHEDULE: '운행 시간을 확인해주세요',
} as const;

// ============================================================================
// Error Messages
// ============================================================================

export const ERROR_MESSAGES = {
    NONE_RUNNING: '운행이 종료되었습니다.',
    NETWORK: '⚠️ 네트워크 오류가 발생했습니다.',
    INVALID_ROUTE: '⚠️ 유효하지 않은 노선입니다.',
    UNKNOWN: '⚠️ 알 수 없는 오류가 발생했습니다.',
    ERROR_OCCURRED: '문제가 발생했습니다',
    RESTART_APP: '앱을 다시 시작해주세요.',
} as const;

// ============================================================================
// Application Messages (Splash, Loading, etc.)
// ============================================================================

export const APP_MESSAGES = {
    LOADING_INFO: '실시간 버스 정보를 불러오는 중...',
} as const;

// ============================================================================
// Site & Page Information
// ============================================================================

export const SITE_INFO = {
    DESCRIPTION: '원주 시내버스 정보 서비스',
    SHORT_DESCRIPTION: '원주 시내버스 시간표 및 실시간 위치 정보 서비스',
    FOOTER_TEXT: '원주시 시내버스 실시간 정보 제공',
} as const;

// ============================================================================
// Navigation & UI Text
// ============================================================================

export const UI_TEXT = {
    REAL_TIME_LOCATION: '실시간 버스 위치',
    REAL_TIME_LOCATION_DESC: '지도에서 버스 위치를 실시간으로 확인하세요',
    SCHEDULE_INQUIRY: '시간표 조회',
    SCHEDULE_INQUIRY_DESC: '노선별 버스 운행 시간표를 확인하세요',
    BACK_TO_HOME: '시간표 목록으로',
    TIMETABLE_SUFFIX: '버스 시간표',
    NOTES_TITLE: '※ 비고 사항',
    MAJOR_STOPS: '주요 정류장',
    LAST_UPDATED: '최종 업데이트:',
    ROUTE_NOT_FOUND: '노선을 찾을 수 없습니다',
    NO_BUSES_TODAY: '운행 예정인 버스가 없습니다.',
    NO_BUSES_SYMBOL: '-',
} as const;

// ============================================================================
// Day Type Labels
// ============================================================================

export const DAY_TYPE_LABELS = {
    WEEKDAY: '평일',
    WEEKEND: '주말/공휴일',
} as const;

export const FEATURED_STOPS_LABELS = {
    GENERAL: '평일',
    SUNDAY: '일요일',
} as const;

// ============================================================================
// Metadata
// ============================================================================

export const METADATA = {
    TITLE: 'wBus',
    DESCRIPTION: '원주 시내버스 시간표 및 실시간 위치 정보 서비스',
} as const;
