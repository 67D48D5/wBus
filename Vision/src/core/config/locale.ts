// src/core/config/locale.ts

/**
 * Centralized locale strings for the entire application
 * All user-facing text should be defined here for easy maintenance and localization
 */

// ============================================================================
// Common UI Elements
// ============================================================================

export const COMMON = {
    APP_TITLE: 'wBus',
    LOADING: 'Loading...',
    RETRY: '다시 시도',
} as const;

// ============================================================================
// Time & Schedule Strings
// ============================================================================

export const TIME_LABELS = {
    MINUTE_SUFFIX: '분',
    HOUR_ABBREV: 'h',
    MINUTE_ABBREV: 'm',
    IN_PREFIX: 'in',
} as const;

export const SCHEDULE_MESSAGES = {
    ARRIVING_SOON: '곧 도착',
    ONE_STOP_AWAY: '1정거장 전',
    STOPS_AWAY: (count: number) => `${count}정거장 전`,
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
    NETWORK: '네트워크 오류가 발생했습니다.',
    INVALID_ROUTE: '유효하지 않은 노선입니다.',
    UNKNOWN: '알 수 없는 오류가 발생했습니다.',
    ERROR_OCCURRED: '문제가 발생했습니다',
    RESTART_APP: '앱을 다시 시작해주세요.',

    // API & Network Errors
    API_URL_NOT_SET: (apiName: string) => `[API_URL_NOT_SET] \`NEXT_PUBLIC_${apiName}\` not set in environment variables.`,
    HTTP_ERROR: (status: number, text: string) => `[HTTP Error] HTTP ${status}: ${text}`,
    REQUEST_FAILED: (message: string) => `[REQUEST_FAILED] Request failed: ${message}.`,
    UNKNOWN_NETWORK_ERROR: '[UNKNOWN_NETWORK_ERROR] Unknown network error.',

    // Data Fetching Errors
    FAILED_TO_FETCH_ROUTE_MAP: '[FAILED_TO_FETCH_ROUTE_MAP] Failed to fetch RouteMap.json',
    POLYLINE_REQUEST_FAILED: (routeName: string) => `[POLYLINE_REQUEST_FAILED] Polyline request failed: ${routeName}`,
    REMOTE_FETCH_FAILED: (status: number) => `[REMOTE_FETCH_FAILED] Remote fetch failed: ${status}`,
    DATA_FETCH_ERROR: (path: string) => `[DATA_FETCH_ERROR] Error fetching data from ${path}:`,

    // Route & Stop Errors
    ROUTE_NOT_FOUND_IN_MAP: (routeName: string) => `[ROUTE_NOT_FOUND_IN_MAP] Route with routeName '${routeName}' not found in RouteMap.json`,
    NO_ROUTE_INFO_FOUND: (routeName: string) => `[NO_ROUTE_INFO_FOUND] No routeInfo found for ${routeName}`,
    INVALID_NODEID: (nodeid: string) => `[useBusDirection] Invalid nodeid received: ${JSON.stringify(nodeid)}`,
    NO_MATCHING_STOP: (nodeid: string) => `[useBusDirection] No matching stop found for nodeid: ${nodeid}`,

    // Internal Errors
    GET_ROUTE_INFO_ERROR: (routeId: string) => `[getDirectionFromRouteDetails] Error for routeid ${routeId}:`,
    BUS_POLLING_ERROR: 'Bus polling error:',
    BUS_STOP_FETCH_ERROR: 'useBusStop fetch error:',
    POLYLINE_FETCH_ERROR: 'Polyline fetch error:',
    ROUTE_MAP_FETCH_ERROR: 'Failed to fetch route map:',

    // Component Errors
    USE_BUS_CONTEXT_ERROR: '`useBusContext` must be used within `MapProvider`',
    LEAFLET_IMPORT_ERROR: 'Leaflet import error:',
    ERROR_BOUNDARY_CAUGHT: 'ErrorBoundary caught an error:',

    // User-facing Errors
    LOCATION_UNAVAILABLE: '🚨 위치 정보를 가져올 수 없습니다.',

    // Error Codes
    ERR_INVALID_ROUTE: 'ERR:INVALID_ROUTE',
    ERR_NETWORK: 'ERR:NETWORK',
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
} as const;

// ============================================================================
// Navigation & UI Text
// ============================================================================

export const UI_TEXT = {
    REAL_TIME_LOCATION: '실시간 버스 위치',
    REAL_TIME_LOCATION_DESC: '지도에서 버스 위치를 실시간으로 확인하세요',
    BACK_TO_HOME: '시간표 목록으로',
    TIMETABLE_SUFFIX: '버스 시간표',
    NOTES_TITLE: '※ 비고 사항',
    MAJOR_STOPS: '주요 정류장',
    LAST_UPDATED: '최종 업데이트:',
    ROUTE_NOT_FOUND: '노선을 찾을 수 없습니다',
    NO_BUSES_TODAY: '운행 예정인 버스가 없습니다.',
    NO_BUSES_SYMBOL: '-',

    // Bus List UI
    ALL_BUS_LIST: '전체 버스 목록',
    ROUTE_BUS_LIST: (routeName: string) => `${routeName}번 버스 목록`,
    ALL_ROUTES: '전체 노선',
    BUSES_RUNNING: (count: number) => `${count}대 운행 중`,
    NO_BUSES_RUNNING: '운행 중인 버스 없음',
    LOADING_BUS_DATA: '버스 데이터를 불러오는 중...',

    // Bus List Toggle
    SHOW_BUS_LIST: '버스 목록 보기',
    HIDE_BUS_LIST: '버스 목록 숨기기',

    // My Location
    FIND_MY_LOCATION: '내 위치 찾기',
    MY_LOCATION_POPUP: (lat: number, lng: number) =>
        `<b>📍 내 위치</b><br>위도: ${lat}<br>경도: ${lng}`,

    // Bus Marker & Details
    BUS_ROUTE_LABEL: (routeName: string) => `${routeName}번 버스`,
    VEHICLE_NUMBER: '차량번호',
    CURRENT_LOCATION: '현재위치',
} as const;

// ============================================================================
// Day Type Labels
// ============================================================================

export const DAY_TYPE_LABELS = {
    WEEKDAY: '평일',
    WEEKEND: '주말/공휴일',
} as const;

export const FEATURED_STOPS_LABELS = {
    WEEKDAY: '평일',
    SUNDAY: '일요일',
} as const;

// ============================================================================
// Metadata
// ============================================================================

export const METADATA = {
    TITLE: 'wBus',
    DESCRIPTION: '시내버스 시간표 및 실시간 위치 정보 서비스',
} as const;

// ============================================================================
// Footer
// ============================================================================

export const FOOTER = {
    COPYRIGHT: '© 2026 wBus',
    DESCRIPTION: '시내버스 정보 서비스',
    LINKS: [
        { label: '이용약관', href: '#' },
        { label: '개인정보처리방침', href: '#' },
    ],
    DISCLAIMER: '본 서비스는 참고용이며, 실제 운행 정보와 다를 수 있습니다.',
} as const;

// ============================================================================
// Notice Section
// ============================================================================

export const NOTICE = {
    SECTION_TITLE: '공지사항',
    NO_NOTICES: '공지사항이 없습니다.',
    TYPE_INFO: 'info',
    TYPE_WARNING: 'warning',
    TYPE_URGENT: 'urgent',
} as const;
