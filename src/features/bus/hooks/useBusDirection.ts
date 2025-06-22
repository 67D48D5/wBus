// src/features/bus/hooks/useBusDirection.ts

import { useBusStop } from "./useBusStop";

// @TODO: Move this to a config file or constants module
const ALWAYS_UPWARD_NODEIDS = ["WJB251036041"];

export function useBusDirection(routeName: string) {
  const stops = useBusStop(routeName);

  /**
   * 주어진 정류장 ID와 노선상의 위치(nodeord)를 기준으로 상행/하행 코드를 반환합니다.
   *
   * @param nodeid   현재 정류장 ID
   * @param nodeord  정류장의 노선상 순서
   * @returns 상행/하행 코드(예: 1 또는 2) 또는 해당 정류장이 없으면 null
   */
  function getDirection(nodeid: string, nodeord: number): number | null {
    // 항상 상행인 정류장 ID 목록에 포함된 경우
    if (ALWAYS_UPWARD_NODEIDS.includes(nodeid)) {
      return 1; // 상행
    }

    // 해당 nodeid를 가진 정류장을 필터링
    const matchingStops = stops.filter((stop) => stop.nodeid === nodeid);
    if (matchingStops.length === 0) {
      /** console.warn(
        `[useBusDirection] nodeid ${nodeid}에 대한 정류장 매칭 실패`
      ); */
      return null;
    }
    if (matchingStops.length === 1) return matchingStops[0].updowncd;

    // 여러 개 있을 경우, nodeord 차이가 가장 작은 정류장을 선택
    const closestStop = matchingStops.reduce((prev, curr) =>
      Math.abs(curr.nodeord - nodeord) < Math.abs(prev.nodeord - nodeord)
        ? curr
        : prev
    );
    return closestStop.updowncd;
  }

  return getDirection;
}
