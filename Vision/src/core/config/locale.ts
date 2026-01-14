// src/core/config/locale.ts

/**
 * Localization & Text Constants
 * * - UI_TEXT: User-facing strings (Korean)
 * - LOG_MESSAGES: Internal system logs/errors (English, for developers)
 */

// ============================================================================
// User Interface Text (Korean)
// ============================================================================

export const UI_TEXT = {
    COMMON: {
        LOADING: '로딩 중...',
        RETRY: '다시 시도',
        CONFIRM: '확인',
        CANCEL: '취소',
    },

    TIME: {
        MINUTE_SUFFIX: '분',
        HOUR_SUFFIX: '시간',
        FORMAT_REMAINING: (min: number) => `${min}분`,
    },

    NAV: {
        HOME: '홈',
        BACK_LIST: '목록으로 돌아가기',
        SHOW_LIST: '버스 목록 보기',
        HIDE_LIST: '버스 목록 숨기기',
    },

    SCHEDULE: {
        MAJOR_STOPS: '주요 정류장',
        TIMETABLE: '시간표',
        NEXT_BUS: '다음 버스',
        NO_SERVICE: '운행 없음',
        NOTES_TITLE: '참고 사항',
        LAST_UPDATED: '최종 업데이트:',
    },

    BUS_LIST: {
        TITLE_ALL: '전체 버스 목록',
        TITLE_ROUTE: (route: string) => `${route}번 버스`,
        COUNT_RUNNING: (count: number) => `${count}대 운행 중`,
        NO_RUNNING: '운행 중인 버스가 없습니다.',
        EMPTY_TODAY: '오늘 운행 예정인 버스가 없습니다.',
    },

    BUS_ITEM: {
        ARRIVING_SOON: '곧 도착',
        STOPS_LEFT: (count: number) => count === 1 ? '1정거장 전' : `${count}정거장 전`,
        VEHICLE_NUM: '차량번호',
        CURRENT_LOC: '현재위치',
        STATUS_CHECKING: '정보 확인 중...',
    },

    MAP: {
        MY_LOCATION: '내 위치 확인',
        BUS_LOCATION_TITLE: '실시간 버스 위치',
        BUS_LOCATION_DESC: '지도에서 실시간으로 버스 위치를 확인하세요.',
    },

    // User-facing Error Messages
    ERROR: {
        TITLE: '문제가 발생했습니다',
        NETWORK: '네트워크 연결 상태를 확인해주세요.',
        LOCATION_DENIED: '위치 권한을 허용해주세요.',
        ROUTE_NOT_FOUND: '요청하신 노선 정보를 찾을 수 없습니다.',
        NO_ARRIVAL_INFO: '도착 정보를 불러올 수 없습니다.',
        SERVICE_ENDED: '운행이 종료되었습니다.',
        UNKNOWN: '일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
    },

    METADATA: {
        TITLE: 'wBus',
        DESC: '원주 시내버스 실시간 도착 정보 & 시간표',
    },

    NOTICE: {
        SECTION_TITLE: '공지사항',
        NO_NOTICES: '공지사항이 없습니다.',
        TYPE_INFO: 'info',
        TYPE_WARNING: 'warning',
        TYPE_URGENT: 'urgent',
    },

    FOOTER: {
        COPYRIGHT: '© 2026 wBus',
        DESCRIPTION: '시내버스 정보 서비스',
        LINKS: [
            { label: '이용약관', href: '#' },
            { label: '개인정보처리방침', href: '#' },
        ],
        DISCLAIMER: '본 서비스는 참고용이며, 실제 운행 정보와 다를 수 있습니다.',
    }
} as const;


// ============================================================================
// System Log Messages (English / Internal Use)
// ============================================================================

export const LOG_MESSAGES = {
    // API & Network
    API_URL_MISSING: (key: string) => `[Config] Environment variable ${key} is missing.`,
    FETCH_FAILED: (url: string, status: number) => `[Fetch] Failed to load ${url} (Status: ${status})`,

    // Data Integrity
    ROUTE_MISSING: (routeId: string) => `[Data] Route ID ${routeId} not found in RouteMap.`,
    STOP_MISSING: (nodeId: string) => `[Data] Stop Node ID ${nodeId} not found in active route.`,

    // Components
    CONTEXT_MISSING: (hookName: string, providerName: string) => `[React] ${hookName} must be used within ${providerName}.`,

    // Critical
    UNHANDLED_EXCEPTION: '[ErrorBoundary] Caught an unhandled exception:',
} as const;


// ============================================================================
// Domain Constants (Labels used in logic/display mix)
// ============================================================================

export const ARRIVAL_STATUS_LABELS = {
    LOADING: '정보 수신 중...',
    NO_INFO: '도착 정보 없음',
    ENDED: '운행 종료',
} as const;

export const DAY_LABELS = {
    WEEKDAY: '평일',
    WEEKEND: '주말/공휴일',
    SUNDAY: '일요일',
} as const;
